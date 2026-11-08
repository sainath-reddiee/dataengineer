// Browser Avro encode/decode using avsc's Type API only.
// The package default entry pulls Node stream/zlib/path into the bundle.

import { Buffer } from '@/lib/node-shims/buffer';

const OCF_OPTS = { namespace: 'org.apache.avro.file' };
const HEADER_SCHEMA = {
  name: 'Header',
  type: 'record',
  fields: [
    { name: 'magic', type: { type: 'fixed', name: 'Magic', size: 4 } },
    { name: 'meta', type: { type: 'map', values: 'bytes' } },
    { name: 'sync', type: { type: 'fixed', name: 'HeaderSync', size: 16 } },
  ],
};
const BLOCK_SCHEMA = {
  name: 'Block',
  type: 'record',
  fields: [
    { name: 'count', type: 'long' },
    { name: 'data', type: 'bytes' },
    { name: 'sync', type: { type: 'fixed', name: 'BlockSync', size: 16 } },
  ],
};

let typePromise = null;

function loadType() {
  if (!typePromise) {
    typePromise = import('avsc/lib/types.js').then((mod) => {
      const Type = mod.Type || mod.default?.Type;
      if (!Type) throw new Error('avsc Type API failed to load');
      return Type;
    });
  }
  return typePromise;
}

function asBuffer(bytes) {
  return Buffer.from(bytes);
}

function randomSync() {
  const sync = Buffer.alloc(16);
  crypto.getRandomValues(sync);
  return sync;
}

async function inflateRaw(bytes) {
  if (typeof DecompressionStream !== 'function') {
    throw new Error('This browser cannot decode deflate-compressed Avro files.');
  }
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  const buffer = await new Response(stream).arrayBuffer();
  return asBuffer(buffer);
}

function decodeRecords(Type, payload, count) {
  const records = [];
  let pos = 0;
  for (let i = 0; i < count; i += 1) {
    const next = Type.decode(payload, pos);
    if (!next || next.offset < 0) {
      throw new Error('Truncated Avro data block.');
    }
    records.push(next.value);
    pos = next.offset;
  }
  return records;
}

export async function jsonToAvro(jsonStr) {
  const Type = await loadType();
  const data = JSON.parse(jsonStr);
  const records = Array.isArray(data) ? data : [data];
  if (records.length === 0) {
    throw new Error('Input JSON is empty — need at least one record to infer schema.');
  }

  const recordType = Type.forValue(records[0]);
  const headerType = Type.forSchema(HEADER_SCHEMA, OCF_OPTS);
  const blockType = Type.forSchema(BLOCK_SCHEMA, OCF_OPTS);
  const sync = randomSync();
  const header = headerType.toBuffer({
    magic: Buffer.from('Obj\x01'),
    meta: {
      'avro.schema': Buffer.from(JSON.stringify(recordType.schema())),
      'avro.codec': Buffer.from('null'),
    },
    sync,
  });

  const chunks = records.map((record) => recordType.toBuffer(record));
  const block = blockType.toBuffer({
    count: records.length,
    data: Buffer.concat(chunks),
    sync,
  });

  return {
    buffer: new Uint8Array(Buffer.concat([header, block])),
    preview: records.slice(0, 50),
    columns: Object.keys(records[0] || {}),
    totalRows: records.length,
    avroSchema: recordType.schema(),
  };
}

export async function avroToJson(uint8Array) {
  const Type = await loadType();
  const buf = asBuffer(uint8Array);
  const isContainer =
    buf.length >= 4 &&
    buf[0] === 0x4f &&
    buf[1] === 0x62 &&
    buf[2] === 0x6a &&
    buf[3] === 0x01;
  if (!isContainer) {
    throw new Error(
      'Avro file does not appear to be an Object Container File (OCF). Please use a .avro file with the standard Obj\\x01 header.'
    );
  }

  const headerType = Type.forSchema(HEADER_SCHEMA, OCF_OPTS);
  const header = headerType.decode(buf, 0);
  if (!header || header.offset < 0) {
    throw new Error('Could not read Avro container header.');
  }

  const schemaJson = header.value.meta['avro.schema']?.toString();
  if (!schemaJson) throw new Error('Avro file is missing an embedded schema.');
  const codec = (header.value.meta['avro.codec'] || Buffer.from('null')).toString() || 'null';
  const recordType = Type.forSchema(JSON.parse(schemaJson));
  const blockType = Type.forSchema(BLOCK_SCHEMA, OCF_OPTS);
  const sync = header.value.sync;

  const records = [];
  let pos = header.offset;
  while (pos < buf.length) {
    const block = blockType.decode(buf, pos);
    if (!block || block.offset < 0) break;
    if (!sync.equals(block.value.sync)) {
      throw new Error('Invalid Avro sync marker.');
    }
    let payload = asBuffer(block.value.data);
    if (codec === 'deflate') payload = await inflateRaw(payload);
    else if (codec !== 'null') throw new Error(`Unsupported Avro codec: ${codec}`);
    records.push(...decodeRecords(recordType, payload, Number(block.value.count)));
    pos = block.offset;
  }

  return {
    text: JSON.stringify(records, null, 2),
    preview: records.slice(0, 50),
    columns: records.length > 0 ? Object.keys(records[0] || {}) : [],
    totalRows: records.length,
  };
}
