import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Headphones,
  Play,
  Pause,
  Square,
  SkipForward,
  SkipBack,
  Volume2,
  Settings,
  X,
  ChevronDown,
  Gauge,
} from 'lucide-react';

// ── helpers ────────────────────────────────────────────────────────────────
/** Strip HTML tags and decode common entities into plain readable text. */
const htmlToPlainText = (html) => {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<(br|\/p|\/li|\/h[1-6]|\/div|\/tr)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n))
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

/** Split text into sentences so we can track per-sentence progress. */
const splitIntoSentences = (text) => {
  if (!text) return [];
  // Split on sentence-ending punctuation followed by whitespace or end of string
  const raw = text.match(/[^.!?\n]+[.!?]+[\s\n]*/g) || [text];
  return raw.map((s) => s.trim()).filter((s) => s.length > 0);
};

// ── component ──────────────────────────────────────────────────────────────
const AudioReader = ({ content, title }) => {
  // State
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0); // 0‑1
  const [currentSentenceIdx, setCurrentSentenceIdx] = useState(0);
  const [rate, setRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [supported, setSupported] = useState(true);

  // Refs
  const utteranceRef = useRef(null);
  const sentencesRef = useRef([]);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const pausedAtRef = useRef(0);
  const containerRef = useRef(null);

  // Derived
  const plainText = useMemo(() => htmlToPlainText(content), [content]);
  const sentences = useMemo(() => splitIntoSentences(plainText), [plainText]);
  sentencesRef.current = sentences;

  const wordCount = useMemo(
    () => plainText.split(/\s+/).filter(Boolean).length,
    [plainText]
  );
  // Average WPM spoken is ~150; adjust by rate
  const estimatedTotalSec = useMemo(
    () => Math.round((wordCount / (150 * rate)) * 60),
    [wordCount, rate]
  );
  const remainingSec = Math.max(0, estimatedTotalSec - elapsedSec);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // ── voice loading ────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setSupported(false);
      return;
    }

    const loadVoices = () => {
      const available = speechSynthesis.getVoices();
      const english = available.filter((v) => v.lang.startsWith('en'));
      setVoices(english.length > 0 ? english : available);
      if (!selectedVoice && english.length > 0) {
        // Prefer a natural-sounding voice
        const preferred =
          english.find((v) => v.name.includes('Google') && v.name.includes('Female')) ||
          english.find((v) => v.name.includes('Google')) ||
          english.find((v) => v.default) ||
          english[0];
        setSelectedVoice(preferred);
      }
    };

    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, []);

  // ── cleanup on unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
      clearInterval(timerRef.current);
    };
  }, []);

  // ── elapsed-time ticker ──────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    startTimeRef.current = Date.now() - pausedAtRef.current * 1000;
    timerRef.current = setInterval(() => {
      const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
      setElapsedSec(elapsed);
    }, 500);
  }, []);

  const stopTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  // ── speak from a given sentence index ────────────────────────────────────
  const speakFrom = useCallback(
    (fromIdx) => {
      speechSynthesis.cancel();
      stopTimer();

      const textToSpeak = sentencesRef.current.slice(fromIdx).join(' ');
      if (!textToSpeak) return;

      const utt = new SpeechSynthesisUtterance(textToSpeak);
      utt.rate = rate;
      utt.pitch = 1;
      if (selectedVoice) utt.voice = selectedVoice;

      let localIdx = fromIdx;

      utt.onboundary = (e) => {
        if (e.name === 'sentence') {
          localIdx += 1;
          setCurrentSentenceIdx(localIdx);
          setProgress(localIdx / sentencesRef.current.length);
        }
      };

      utt.onend = () => {
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(1);
        setCurrentSentenceIdx(sentencesRef.current.length);
        stopTimer();
      };

      utt.onerror = (e) => {
        if (e.error !== 'canceled') {
          console.warn('SpeechSynthesis error:', e.error);
        }
        setIsPlaying(false);
        setIsPaused(false);
        stopTimer();
      };

      utteranceRef.current = utt;
      setCurrentSentenceIdx(fromIdx);
      setProgress(fromIdx / sentencesRef.current.length);
      setIsPlaying(true);
      setIsPaused(false);

      // Estimate how far into the article we are for the timer
      const spokenBefore = sentencesRef.current.slice(0, fromIdx).join(' ').split(/\s+/).filter(Boolean).length;
      pausedAtRef.current = Math.round((spokenBefore / (150 * rate)) * 60);
      setElapsedSec(pausedAtRef.current);

      startTimer();
      speechSynthesis.speak(utt);
    },
    [rate, selectedVoice, startTimer, stopTimer]
  );

  // ── playback controls ────────────────────────────────────────────────────
  const handlePlay = () => {
    if (isPaused) {
      speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      startTimer();
      return;
    }
    speakFrom(0);
    setElapsedSec(0);
    pausedAtRef.current = 0;
  };

  const handlePause = () => {
    speechSynthesis.pause();
    setIsPaused(true);
    setIsPlaying(false);
    pausedAtRef.current = elapsedSec;
    stopTimer();
  };

  const handleStop = () => {
    speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
    setCurrentSentenceIdx(0);
    setElapsedSec(0);
    pausedAtRef.current = 0;
    stopTimer();
  };

  const handleSkipForward = () => {
    const next = Math.min(currentSentenceIdx + 3, sentences.length - 1);
    speakFrom(next);
  };

  const handleSkipBack = () => {
    const prev = Math.max(currentSentenceIdx - 3, 0);
    speakFrom(prev);
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    const targetIdx = Math.round(pct * sentences.length);
    speakFrom(targetIdx);
  };

  const handleRateChange = (newRate) => {
    setRate(newRate);
    if (isPlaying || isPaused) {
      // Restart from current position with the new rate
      speakFrom(currentSentenceIdx);
    }
  };

  // ── don't render if speech synthesis is not available ─────────────────────
  if (!supported) return null;

  const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 1.75, 2];

  return (
    <>
      {/* ── Collapsed state: "Listen to this article" pill ──────────── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={() => setIsOpen(true)}
            className="group flex items-center gap-2.5 w-auto px-4 py-2.5 rounded-2xl
                       bg-gradient-to-r from-slate-800/80 to-slate-700/60
                       hover:from-slate-800 hover:to-slate-700
                       border border-slate-700/50 hover:border-blue-500/40
                       backdrop-blur-md shadow-lg hover:shadow-blue-500/10
                       transition-all duration-300 cursor-pointer"
            aria-label="Listen to this article"
          >
            <span className="relative flex items-center justify-center w-8 h-8 rounded-xl
                            bg-gradient-to-br from-blue-500 to-purple-600
                            shadow-md shadow-blue-500/20 group-hover:shadow-blue-500/40
                            transition-shadow duration-300 shrink-0">
              <Headphones className="w-4 h-4 text-white" />
              {/* animated pulse ring */}
              <span className="absolute inset-0 rounded-xl bg-blue-400/30 animate-ping opacity-0 group-hover:opacity-100" />
            </span>
            <span className="flex flex-col items-start leading-tight">
              <span className="text-xs sm:text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">
                Listen to this article
              </span>
              <span className="text-[10px] text-gray-400 group-hover:text-gray-300 transition-colors">
                ~{Math.ceil(wordCount / 150)} min · browser audio
              </span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Expanded player ─────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: 'spring', damping: 22, stiffness: 260 }}
            className="relative overflow-hidden rounded-2xl
                       bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95
                       border border-slate-700/50 backdrop-blur-xl
                       shadow-2xl shadow-black/40"
          >
            {/* decorative gradient blur */}
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-blue-500/8 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-purple-500/6 rounded-full blur-3xl pointer-events-none" />

            <div className="relative p-5 space-y-4">
              {/* ── Header row ────────────────────────────────────────── */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl
                                  bg-gradient-to-br from-blue-500 to-purple-600
                                  shadow-lg shadow-blue-500/20 shrink-0">
                    <Headphones className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">
                      {title || 'Now Playing'}
                    </h4>
                    <p className="text-[11px] text-gray-500 truncate">
                      {wordCount.toLocaleString()} words · ~{Math.ceil(wordCount / 150)} min
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* Settings toggle */}
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={`p-2 rounded-lg transition-colors ${
                      showSettings
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                    aria-label="Audio settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  {/* Close button */}
                  <button
                    onClick={() => {
                      handleStop();
                      setIsOpen(false);
                    }}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-400
                               hover:bg-red-500/10 transition-colors"
                    aria-label="Close audio player"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* ── Settings panel (collapsible) ──────────────────────── */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-3 pb-2">
                      {/* Speed selector */}
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-2">
                          <Gauge className="w-3.5 h-3.5" />
                          Playback Speed
                        </label>
                        <div className="flex gap-1.5">
                          {SPEED_OPTIONS.map((s) => (
                            <button
                              key={s}
                              onClick={() => handleRateChange(s)}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                rate === s
                                  ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50 shadow-sm shadow-blue-500/10'
                                  : 'bg-slate-800/60 text-gray-400 border border-slate-700/40 hover:text-white hover:border-slate-600/60'
                              }`}
                            >
                              {s}×
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Voice selector */}
                      {voices.length > 1 && (
                        <div>
                          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-2">
                            <Volume2 className="w-3.5 h-3.5" />
                            Voice
                          </label>
                          <div className="relative">
                            <select
                              value={selectedVoice?.name || ''}
                              onChange={(e) => {
                                const v = voices.find((v) => v.name === e.target.value);
                                setSelectedVoice(v);
                                if (isPlaying || isPaused) {
                                  // We'll need to restart to apply new voice
                                  setTimeout(() => speakFrom(currentSentenceIdx), 100);
                                }
                              }}
                              className="w-full appearance-none bg-slate-800/60 border border-slate-700/40
                                         rounded-lg px-3 py-2 pr-8 text-xs text-gray-300
                                         focus:outline-none focus:border-blue-500/50 transition-colors"
                            >
                              {voices.map((v) => (
                                <option key={v.name} value={v.name}>
                                  {v.name} ({v.lang})
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Progress bar (seekable) ───────────────────────────── */}
              <div className="space-y-1.5">
                <div
                  className="relative h-2 bg-slate-700/60 rounded-full cursor-pointer group/bar overflow-hidden"
                  onClick={handleSeek}
                  role="progressbar"
                  aria-valuenow={Math.round(progress * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Reading progress"
                >
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #a855f7)',
                      width: `${progress * 100}%`,
                    }}
                    transition={{ duration: 0.15 }}
                  />
                  {/* Glowing dot at the end */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full
                               bg-white shadow-lg shadow-blue-500/40
                               opacity-0 group-hover/bar:opacity-100 transition-opacity"
                    style={{ left: `calc(${progress * 100}% - 7px)` }}
                  />
                </div>

                {/* Timestamps */}
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono">
                  <span>{formatTime(elapsedSec)}</span>
                  <span>-{formatTime(remainingSec)}</span>
                </div>
              </div>

              {/* ── Playback controls ─────────────────────────────────── */}
              <div className="flex items-center justify-center gap-3">
                {/* Skip back */}
                <button
                  onClick={handleSkipBack}
                  disabled={!isPlaying && !isPaused}
                  className="p-2.5 rounded-xl text-gray-400 hover:text-white
                             hover:bg-slate-700/50 disabled:opacity-30
                             disabled:cursor-not-allowed transition-all"
                  aria-label="Skip back 3 sentences"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                {/* Play / Pause */}
                <button
                  onClick={isPlaying ? handlePause : handlePlay}
                  className="relative flex items-center justify-center w-14 h-14 rounded-2xl
                             bg-gradient-to-br from-blue-500 to-purple-600
                             hover:from-blue-400 hover:to-purple-500
                             shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40
                             text-white transition-all duration-200 active:scale-95"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" fill="white" />
                  ) : (
                    <Play className="w-6 h-6 ml-0.5" fill="white" />
                  )}
                </button>

                {/* Stop */}
                <button
                  onClick={handleStop}
                  disabled={!isPlaying && !isPaused}
                  className="p-2.5 rounded-xl text-gray-400 hover:text-white
                             hover:bg-slate-700/50 disabled:opacity-30
                             disabled:cursor-not-allowed transition-all"
                  aria-label="Stop"
                >
                  <Square className="w-5 h-5" />
                </button>

                {/* Skip forward */}
                <button
                  onClick={handleSkipForward}
                  disabled={!isPlaying && !isPaused}
                  className="p-2.5 rounded-xl text-gray-400 hover:text-white
                             hover:bg-slate-700/50 disabled:opacity-30
                             disabled:cursor-not-allowed transition-all"
                  aria-label="Skip forward 3 sentences"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              {/* ── Current speed badge (quick toggle) ────────────────── */}
              <div className="flex items-center justify-center">
                <button
                  onClick={() => {
                    const idx = SPEED_OPTIONS.indexOf(rate);
                    const next = SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length];
                    handleRateChange(next);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full
                             bg-slate-800/60 border border-slate-700/40
                             text-[11px] font-semibold text-gray-400
                             hover:text-blue-300 hover:border-blue-500/40
                             transition-all"
                  aria-label={`Playback speed: ${rate}×. Click to cycle.`}
                >
                  <Gauge className="w-3 h-3" />
                  {rate}× speed
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AudioReader;
