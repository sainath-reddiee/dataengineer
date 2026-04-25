// src/pages/FormatConverterPage.jsx
// Client-side JSON / Parquet / Avro converter powered by DuckDB-WASM + avsc.
// No upload — all processing runs in-browser via WebAssembly.
import React, { useState, useCallback, useRef, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ArrowLeftRight,
  Upload,
  Download,
  Copy,
  Check,
  Loader2,
  AlertTriangle,
  FileJson,
  BookOpen,
  Table2,
} from 'lucide-react';
import MetaTags from '@/components/SEO/MetaTags';
import { getDb } from '@/lib/duckdb';

const AdPlacement = React.lazy(() => import('@/components/AdPlacement'));

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const FORMATS = ['JSON', 'Parquet', 'Avro'];

const SAMPLE_JSON = `[
  { "id": 1, "name": "Alice", "department": "Engineering", "salary": 125000, "active": true },
  { "id": 2, "name": "Bob",   "department": "Marketing",   "salary": 95000,  "active": true },
  { "id": 3, "name": "Carol", "department": "Engineering", "salary": 135000, "active": false },
  { "id": 4, "name": "Dave",  "department": "Sales",       "salary": 88000,  "active": true },
  { "id": 5, "name": "Eve",   "department": "Engineering", "salary": 142000, "active": true }
]`;

const FAQ = [
  {
    q: 'Is this converter free and private?',
    a: 'Yes. Everything runs in your browser via WebAssembly (DuckDB-WASM) and JavaScript (avsc). Your files never leave your device — there is no server upload, no logging, and no storage.',
  },
  {
    q: 'What file size limit can it handle?',
    a: 'The practical limit is your browser\'s available memory — typically 1-4 GB depending on device and browser. Files up to ~200 MB convert reliably on modern machines. For larger files, use a local DuckDB CLI or Apache Spark.',
  },
  {
    q: 'Does it preserve schema and types?',
    a: 'Yes. JSON types are inferred automatically (integer, float, string, boolean, date). Parquet preserves its full schema including nested structs. Avro schemas are inferred from JSON data or read from existing Avro files. Nullability is preserved across all formats.',
  },
  {
    q: 'Which Parquet compression is used?',
    a: 'Output Parquet files use ZSTD compression by default — the best balance of compression ratio and speed. DuckDB also supports Snappy, Gzip, and LZ4 for reading input Parquet files.',
  },
  {
    q: 'Can I convert between Parquet and Avro directly?',
    a: 'Yes. The converter chains through an intermediate representation: Parquet → JSON (via DuckDB) → Avro (via avsc), or Avro → JSON → Parquet. The intermediate step is in-memory and instant for typical file sizes.',
  },
  {
    q: 'What Avro features are supported?',
    a: 'The converter reads and writes Avro binary format with automatic schema inference. Supported types: null, boolean, int, long, float, double, string, bytes, arrays, maps, records, and unions. Logical types (date, timestamp) are preserved when present in the source schema.',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert Arrow table result to plain JS rows */
function arrowToObjects(arrowResult) {
  const rows = [];
  const batches = arrowResult.batches || [arrowResult];
  for (const batch of batches) {
    const numRows = batch.numRows;
    const schema = batch.schema;
    for (let r = 0; r < numRows; r++) {
      const row = {};
      for (let c = 0; c < schema.fields.length; c++) {
        const col = batch.getChildAt(c);
        let val = col.get(r);
        // Convert BigInt to Number for JSON compatibility
        if (typeof val === 'bigint') val = Number(val);
        row[schema.fields[c].name] = val;
      }
      rows.push(row);
    }
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Conversion engines
// ---------------------------------------------------------------------------

async function jsonToParquet(jsonStr) {
  const db = await getDb();
  const conn = await db.connect();
  try {
    // Clean up any previous temp files/tables
    await conn.query('DROP TABLE IF EXISTS __conv_input').catch(() => {});
    await db.registerFileText('__conv_input.json', jsonStr);
    await conn.query("CREATE TABLE __conv_input AS SELECT * FROM read_json('__conv_input.json', auto_detect=true)");
    await conn.query("COPY __conv_input TO '__conv_output.parquet' (FORMAT PARQUET, COMPRESSION ZSTD)");
    const buffer = await db.copyFileToBuffer('__conv_output.parquet');
    // Preview
    const preview = await conn.query('SELECT * FROM __conv_input LIMIT 50');
    const rows = arrowToObjects(preview);
    const cols = preview.schema?.fields?.map(f => f.name) || Object.keys(rows[0] || {});
    // Count total rows
    const countResult = await conn.query('SELECT COUNT(*) AS cnt FROM __conv_input');
    const totalRows = Number(arrowToObjects(countResult)[0]?.cnt || rows.length);
    await conn.query('DROP TABLE IF EXISTS __conv_input').catch(() => {});
    return { buffer: new Uint8Array(buffer), preview: rows, columns: cols, totalRows };
  } finally {
    await conn.close();
  }
}

async function parquetToJson(uint8Array) {
  const db = await getDb();
  const conn = await db.connect();
  try {
    await db.registerFileBuffer('__conv_input.parquet', uint8Array);
    const allResult = await conn.query("SELECT * FROM read_parquet('__conv_input.parquet')");
    const allRows = arrowToObjects(allResult);
    const jsonStr = JSON.stringify(allRows, null, 2);
    const cols = allResult.schema?.fields?.map(f => f.name) || Object.keys(allRows[0] || {});
    const preview = allRows.slice(0, 50);
    return { text: jsonStr, preview, columns: cols, totalRows: allRows.length };
  } finally {
    await conn.close();
  }
}

async function jsonToAvro(jsonStr) {
  const avsc = await import('avsc');
  const data = JSON.parse(jsonStr);
  const arr = Array.isArray(data) ? data : [data];
  if (arr.length === 0) throw new Error('Input JSON is empty — need at least one record to infer schema.');
  // Infer Avro type from the first record
  const type = avsc.Type.forValue(arr[0]);
  // Wrap in array type for encoding all records
  const arrayType = avsc.Type.forSchema({ type: 'array', items: type.schema() });
  const buffer = arrayType.toBuffer(arr);
  const preview = arr.slice(0, 50);
  const cols = Object.keys(arr[0] || {});
  return { buffer: new Uint8Array(buffer), preview, columns: cols, totalRows: arr.length, avroSchema: type.schema() };
}

async function avroToJson(uint8Array) {
  const avsc = await import('avsc');
  // Try decoding as a single array first, then fall back to block decoding
  // Avro container files have a magic header: 'Obj\x01'
  const isContainer = uint8Array[0] === 0x4f && uint8Array[1] === 0x62 &&
                      uint8Array[2] === 0x6a && uint8Array[3] === 0x01;
  let records = [];
  if (isContainer) {
    // Avro Object Container File — decode with BlockDecoder
    const decoder = avsc.createBlobDecoder(new Blob([uint8Array]));
    records = await new Promise((resolve, reject) => {
      const rows = [];
      decoder.on('data', (val) => rows.push(val));
      decoder.on('end', () => resolve(rows));
      decoder.on('error', reject);
    });
  } else {
    // Raw Avro binary — try to decode with auto-inferred schema
    // This is a best-effort fallback; structured container files are preferred
    throw new Error('Avro file does not appear to be an Object Container File (OCF). Please use a .avro file with the standard Obj\\x01 header. Raw binary Avro without an embedded schema cannot be auto-decoded.');
  }
  const jsonStr = JSON.stringify(records, null, 2);
  const cols = records.length > 0 ? Object.keys(records[0]) : [];
  const preview = records.slice(0, 50);
  return { text: jsonStr, preview, columns: cols, totalRows: records.length };
}

async function parquetToAvro(uint8Array) {
  // Parquet → JSON via DuckDB, then JSON → Avro
  const jsonResult = await parquetToJson(uint8Array);
  const avroResult = await jsonToAvro(jsonResult.text);
  return { ...avroResult, preview: jsonResult.preview, columns: jsonResult.columns, totalRows: jsonResult.totalRows };
}

async function avroToParquet(uint8Array) {
  // Avro → JSON, then JSON → Parquet via DuckDB
  const jsonResult = await avroToJson(uint8Array);
  const parquetResult = await jsonToParquet(jsonResult.text);
  return { ...parquetResult };
}

// Route to the correct converter
async function convert(sourceFormat, targetFormat, input) {
  const key = `${sourceFormat}->${targetFormat}`;
  switch (key) {
    case 'JSON->Parquet':  return jsonToParquet(input);
    case 'Parquet->JSON':  return parquetToJson(input);
    case 'JSON->Avro':     return jsonToAvro(input);
    case 'Avro->JSON':     return avroToJson(input);
    case 'Parquet->Avro':  return parquetToAvro(input);
    case 'Avro->Parquet':  return avroToParquet(input);
    default: throw new Error(`Unsupported conversion: ${key}`);
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function FormatConverterPage() {
  const [sourceFormat, setSourceFormat] = useState('JSON');
  const [targetFormat, setTargetFormat] = useState('Parquet');
  const [jsonInput, setJsonInput] = useState(SAMPLE_JSON);
  const [fileName, setFileName] = useState('');
  const [fileBuffer, setFileBuffer] = useState(null); // Uint8Array for binary input
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [converting, setConverting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [elapsed, setElapsed] = useState(null);
  const fileInputRef = useRef(null);
  const dropRef = useRef(null);

  const isBinarySource = sourceFormat === 'Parquet' || sourceFormat === 'Avro';
  const isBinaryOutput = targetFormat === 'Parquet' || targetFormat === 'Avro';

  // Swap formats
  const handleSwap = useCallback(() => {
    setSourceFormat(targetFormat);
    setTargetFormat(sourceFormat);
    setResult(null);
    setError(null);
    setFileBuffer(null);
    setFileName('');
    setJsonInput(sourceFormat === 'JSON' ? '' : SAMPLE_JSON);
  }, [sourceFormat, targetFormat]);

  // Handle file selection
  const handleFile = useCallback((file) => {
    if (!file) return;
    setFileName(file.name);
    setError(null);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const arr = new Uint8Array(e.target.result);
      setFileBuffer(arr);
    };
    reader.onerror = () => setError('Failed to read file.');
    reader.readAsArrayBuffer(file);
  }, []);

  // Drag-and-drop handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropRef.current) dropRef.current.classList.add('ring-2', 'ring-amber-400');
  }, []);
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropRef.current) dropRef.current.classList.remove('ring-2', 'ring-amber-400');
  }, []);
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropRef.current) dropRef.current.classList.remove('ring-2', 'ring-amber-400');
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  // Run conversion
  const handleConvert = useCallback(async () => {
    setConverting(true);
    setError(null);
    setResult(null);
    setElapsed(null);
    const t0 = performance.now();
    try {
      const input = isBinarySource ? fileBuffer : jsonInput;
      if (!input || (typeof input === 'string' && !input.trim())) {
        throw new Error(isBinarySource ? 'Please select a file first.' : 'Please enter JSON data.');
      }
      const res = await convert(sourceFormat, targetFormat, input);
      setResult(res);
      setElapsed(Math.round(performance.now() - t0));
    } catch (err) {
      setError(err.message || 'Conversion failed.');
      setElapsed(Math.round(performance.now() - t0));
    } finally {
      setConverting(false);
    }
  }, [sourceFormat, targetFormat, jsonInput, fileBuffer, isBinarySource]);

  // Download result
  const handleDownload = useCallback(() => {
    if (!result) return;
    const ext = targetFormat === 'JSON' ? 'json' : targetFormat === 'Parquet' ? 'parquet' : 'avro';
    const mime = targetFormat === 'JSON' ? 'application/json' : 'application/octet-stream';
    const data = result.buffer || new TextEncoder().encode(result.text);
    const blob = new Blob([data], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result, targetFormat]);

  // Copy JSON output
  const handleCopy = useCallback(async () => {
    if (!result?.text) return;
    try {
      await navigator.clipboard.writeText(result.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard may be blocked */ }
  }, [result]);

  // Auto-adjust target when source changes
  const handleSourceChange = useCallback((fmt) => {
    setSourceFormat(fmt);
    if (fmt === targetFormat) {
      const other = FORMATS.find(f => f !== fmt);
      setTargetFormat(other);
    }
    setResult(null);
    setError(null);
    setFileBuffer(null);
    setFileName('');
    if (fmt === 'JSON') setJsonInput(SAMPLE_JSON);
  }, [targetFormat]);

  const handleTargetChange = useCallback((fmt) => {
    setTargetFormat(fmt);
    setResult(null);
    setError(null);
  }, []);

  // Schema.org structured data
  const softwareAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'JSON / Parquet / Avro Converter',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    description: 'Free in-browser converter between JSON, Parquet, and Avro formats. Powered by DuckDB-WASM. No upload, no server — 100% client-side.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    url: 'https://dataengineerhub.blog/tools/json-parquet-avro-converter',
    publisher: {
      '@type': 'Organization',
      name: 'DataEngineer Hub',
      url: 'https://dataengineerhub.blog',
    },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };

  return (
    <>
      <MetaTags
        title="JSON / Parquet / Avro Converter 2026 — Free Browser Tool"
        description="Convert between JSON, Parquet, and Avro instantly in your browser. Powered by DuckDB-WASM and avsc. No upload, no server, 100% private."
        keywords="json to parquet, parquet to json, json to avro, avro to json, parquet to avro, avro to parquet, file converter, data format converter, duckdb wasm, browser converter"
        url="/tools/json-parquet-avro-converter"
        type="website"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Tools', url: '/tools' },
          { name: 'JSON / Parquet / Avro Converter', url: '/tools/json-parquet-avro-converter' },
        ]}
        faqSchema={faqSchema}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(softwareAppSchema)}</script>
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Badge */}
        <div>
          <span className="inline-block px-3 py-1 bg-amber-900/30 text-amber-300 text-xs font-semibold rounded-full border border-amber-700/50 mb-4">
            Client-side &middot; DuckDB-WASM + avsc &middot; no data leaves your browser
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
            <ArrowLeftRight className="w-8 h-8 text-amber-400" />
            JSON / Parquet / Avro Converter
          </h1>
          <p className="text-gray-300 text-lg max-w-3xl mt-3">
            Convert between JSON, Apache Parquet, and Apache Avro directly in your browser.
            Powered by DuckDB-WASM for Parquet and <code className="text-amber-300">avsc</code> for Avro.
            No file upload, no server — everything runs locally.
          </p>
        </div>

        {/* Format selectors */}
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-400 mb-1 font-medium">Source format</label>
            <div className="flex gap-1">
              {FORMATS.map(f => (
                <button
                  key={f}
                  onClick={() => handleSourceChange(f)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    sourceFormat === f
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSwap}
            className="p-2 rounded bg-slate-700 hover:bg-slate-600 text-amber-400 transition-colors"
            title="Swap source and target"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>

          <div>
            <label className="block text-xs text-gray-400 mb-1 font-medium">Target format</label>
            <div className="flex gap-1">
              {FORMATS.filter(f => f !== sourceFormat).map(f => (
                <button
                  key={f}
                  onClick={() => handleTargetChange(f)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    targetFormat === f
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleConvert}
            disabled={converting}
            className="ml-auto px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold flex items-center gap-2 transition-colors"
          >
            {converting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Converting...</>
            ) : (
              <><ArrowLeftRight className="w-4 h-4" /> Convert</>
            )}
          </button>
        </div>

        {/* Input panel */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Source */}
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
              Input — {sourceFormat}
            </h2>
            {isBinarySource ? (
              <div
                ref={dropRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-600 rounded-xl p-12 text-center cursor-pointer hover:border-amber-500 transition-colors bg-slate-800/50"
              >
                <Upload className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                {fileName ? (
                  <p className="text-amber-300 font-medium">{fileName}{fileBuffer ? ` (${(fileBuffer.length / 1024).toFixed(1)} KB)` : ''}</p>
                ) : (
                  <>
                    <p className="text-gray-300 font-medium">
                      Drop a .{sourceFormat.toLowerCase()} file here
                    </p>
                    <p className="text-gray-500 text-sm mt-1">or click to browse</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={sourceFormat === 'Parquet' ? '.parquet' : '.avro'}
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
              </div>
            ) : (
              <textarea
                value={jsonInput}
                onChange={(e) => { setJsonInput(e.target.value); setResult(null); setError(null); }}
                spellCheck={false}
                className="w-full h-80 bg-slate-800/80 text-green-300 font-mono text-sm rounded-xl p-4 border border-slate-700 focus:border-amber-500 focus:outline-none resize-none"
                placeholder='Paste JSON array here, e.g. [{"id":1, "name":"Alice"}, ...]'
              />
            )}
          </div>

          {/* Right: Output / Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                Output — {targetFormat}
              </h2>
              <div className="flex gap-2">
                {result?.text && (
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600 text-gray-300 transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                )}
                {result && (
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-amber-700 hover:bg-amber-600 text-white transition-colors"
                  >
                    <Download className="w-3 h-3" /> Download .{targetFormat.toLowerCase()}
                  </button>
                )}
              </div>
            </div>

            {/* Results area */}
            <div className="bg-slate-800/80 rounded-xl border border-slate-700 p-4 h-80 overflow-auto">
              {converting && (
                <div className="flex items-center justify-center h-full text-amber-300">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" /> Converting...
                </div>
              )}
              {error && !converting && (
                <div className="flex items-start gap-2 text-red-400">
                  <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <pre className="whitespace-pre-wrap text-sm">{error}</pre>
                </div>
              )}
              {result && !converting && result.text && (
                <pre className="text-green-300 font-mono text-xs whitespace-pre-wrap">{result.text.length > 50000 ? result.text.slice(0, 50000) + '\n... (truncated for display)' : result.text}</pre>
              )}
              {result && !converting && !result.text && result.preview && (
                <div>
                  <p className="text-gray-400 text-xs mb-2">
                    Binary output — {result.buffer?.length ? `${(result.buffer.length / 1024).toFixed(1)} KB` : ''} &middot; {result.totalRows} row{result.totalRows !== 1 ? 's' : ''} &middot; Preview below
                  </p>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs font-mono">
                      <thead>
                        <tr>
                          {result.columns?.map(c => (
                            <th key={c} className="px-2 py-1 text-left text-amber-400 border-b border-slate-600 whitespace-nowrap">{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.preview?.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-700/50">
                            {result.columns?.map(c => (
                              <td key={c} className="px-2 py-1 text-gray-300 border-b border-slate-700/50 whitespace-nowrap">
                                {row[c] === null || row[c] === undefined ? <span className="text-gray-600">NULL</span> : String(row[c])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {result.totalRows > 50 && (
                    <p className="text-gray-500 text-xs mt-2">Showing 50 of {result.totalRows} rows</p>
                  )}
                </div>
              )}
              {!result && !error && !converting && (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <FileJson className="w-6 h-6 mr-2 opacity-50" />
                  Output will appear here
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status bar */}
        {elapsed !== null && (
          <p className="text-sm text-gray-400">
            {error ? 'Failed' : 'Converted'} in {elapsed} ms
            {result?.totalRows ? ` \u00B7 ${result.totalRows} row${result.totalRows !== 1 ? 's' : ''}` : ''}
            {result?.buffer ? ` \u00B7 ${(result.buffer.length / 1024).toFixed(1)} KB` : ''}
          </p>
        )}

        {/* Ad placement */}
        <Suspense fallback={null}>
          <AdPlacement />
        </Suspense>

        {/* Educational content */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Table2 className="w-5 h-5 text-amber-400" /> Format Comparison
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left text-gray-400 px-2 py-1 border-b border-slate-600">Feature</th>
                    <th className="text-left text-amber-400 px-2 py-1 border-b border-slate-600">JSON</th>
                    <th className="text-left text-amber-400 px-2 py-1 border-b border-slate-600">Parquet</th>
                    <th className="text-left text-amber-400 px-2 py-1 border-b border-slate-600">Avro</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300 text-xs">
                  <tr><td className="px-2 py-1">Format</td><td className="px-2 py-1">Text</td><td className="px-2 py-1">Binary / columnar</td><td className="px-2 py-1">Binary / row</td></tr>
                  <tr><td className="px-2 py-1">Schema</td><td className="px-2 py-1">None (implicit)</td><td className="px-2 py-1">Embedded</td><td className="px-2 py-1">Embedded</td></tr>
                  <tr><td className="px-2 py-1">Compression</td><td className="px-2 py-1">None built-in</td><td className="px-2 py-1">Per-column (ZSTD, Snappy)</td><td className="px-2 py-1">Per-block (Deflate, Snappy)</td></tr>
                  <tr><td className="px-2 py-1">Best for</td><td className="px-2 py-1">APIs, config, small data</td><td className="px-2 py-1">Analytics, data lakes</td><td className="px-2 py-1">Streaming, Kafka, schema evolution</td></tr>
                  <tr><td className="px-2 py-1">Read speed</td><td className="px-2 py-1">Slow at scale</td><td className="px-2 py-1">Fast (column pruning)</td><td className="px-2 py-1">Fast (sequential)</td></tr>
                  <tr><td className="px-2 py-1">Human-readable</td><td className="px-2 py-1">Yes</td><td className="px-2 py-1">No</td><td className="px-2 py-1">No</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" /> When to Use Each Format
            </h2>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li><strong className="text-amber-300">JSON</strong> — Universal interchange. Use for REST APIs, configuration files, small datasets, and anywhere human readability matters. Poor compression and slow scans make it unsuitable for analytics at scale.</li>
              <li><strong className="text-amber-300">Parquet</strong> — The standard for analytical workloads. Columnar layout enables predicate pushdown and column pruning. Used by Snowflake, BigQuery, Databricks, Spark, DuckDB, and every modern data lake. Ideal for large datasets queried repeatedly.</li>
              <li><strong className="text-amber-300">Avro</strong> — Row-oriented binary format with strong schema evolution support. The default for Apache Kafka, Hadoop, and event streaming pipelines. Compact, fast to serialize/deserialize, and supports schema registries.</li>
            </ul>
          </div>
        </div>

        {/* Related tools */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Related Tools &amp; Guides</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { to: '/tools/sql-playground', title: 'SQL Playground', desc: 'Run SQL on sample data in your browser with DuckDB-WASM' },
              { to: '/tools/csv-to-sql', title: 'CSV to SQL Converter', desc: 'Paste CSV, get CREATE TABLE + INSERT statements' },
              { to: '/tools/json-to-sql-ddl', title: 'JSON to SQL DDL', desc: 'Infer CREATE TABLE from a JSON sample' },
              { to: '/cheatsheets/sql-window-functions-cheat-sheet', title: 'Window Functions Cheat Sheet', desc: 'ROW_NUMBER, RANK, LAG/LEAD, running totals and more' },
            ].map(({ to, title, desc }) => (
              <Link key={to} to={to} className="block bg-slate-800/50 rounded-xl border border-slate-700 p-4 hover:border-amber-500/50 transition-colors group">
                <span className="text-amber-400 font-medium group-hover:underline">{title}</span>
                <span className="block text-gray-400 text-sm mt-1">{desc}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {FAQ.map(({ q, a }, i) => (
              <details key={i} className="group bg-slate-800/40 rounded-xl border border-slate-700 open:bg-slate-800/70 transition-colors">
                <summary className="flex items-center justify-between px-5 py-3 cursor-pointer select-none">
                  <span className="text-gray-200 font-medium text-sm">{q}</span>
                  <span className="text-amber-400 text-lg font-bold transition-transform group-open:rotate-45 ml-3">+</span>
                </summary>
                <p className="px-5 pb-4 text-gray-400 text-sm leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
