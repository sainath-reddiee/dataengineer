// src/hooks/useMockExam.js
// Timed mock exam state: deadline-based timer (correct even when the tab was
// in the background), resume after refresh, auto-submit at zero.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildMockExam, isAnswerCorrect, restoreQuestions, scoreMock } from '@/lib/practice/mockExam';
import { useQuizStore } from '@/hooks/useQuizStore';

const saveKey = (slug) => `mock:${slug}`;

export function useMockExam(slug, quiz) {
  const { addAttempt, saveInProgress, loadInProgress, clearInProgress } = useQuizStore();
  const [phase, setPhase] = useState('setup'); // 'setup' | 'exam' | 'results'
  const [exam, setExam] = useState(null); // { questions, deadlineAt, startedAt, lengthId, timeLimitSec }
  const [answers, setAnswers] = useState({});
  const [flags, setFlags] = useState(() => new Set());
  const [idx, setIdx] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [result, setResult] = useState(null);
  const submittedRef = useRef(false);
  const [savedVersion, setSavedVersion] = useState(0);

  const saved = useMemo(() => {
    if (!quiz || phase !== 'setup') return null;
    const s = loadInProgress(saveKey(slug));
    return s?.ids?.length ? s : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz, slug, phase, savedVersion]);

  const begin = useCallback((questions, timeLimitSec, lengthId, restored = null) => {
    submittedRef.current = false;
    const startedAt = restored?.startedAt || new Date().toISOString();
    setExam({
      questions,
      lengthId,
      timeLimitSec,
      startedAt,
      deadlineAt: restored?.deadlineAt || Date.now() + timeLimitSec * 1000,
    });
    setAnswers(restored?.answers || {});
    setFlags(new Set(restored?.flags || []));
    setIdx(Math.min(restored?.idx || 0, Math.max(0, questions.length - 1)));
    setResult(null);
    setNow(Date.now());
    setPhase('exam');
  }, []);

  const start = useCallback((lengthId, options) => {
    const built = buildMockExam(quiz, lengthId, options);
    if (!built.questions.length) return;
    clearInProgress(saveKey(slug));
    begin(built.questions, built.timeLimitSec, options?.onlyIds ? 'retake' : lengthId);
  }, [quiz, slug, clearInProgress, begin]);

  const resume = useCallback(() => {
    if (!saved) return;
    const questions = restoreQuestions(quiz, saved);
    if (!questions.length) {
      clearInProgress(saveKey(slug));
      return;
    }
    begin(questions, saved.timeLimitSec, saved.lengthId, saved);
  }, [saved, quiz, slug, clearInProgress, begin]);

  const discardSaved = useCallback(() => {
    clearInProgress(saveKey(slug));
    setSavedVersion((v) => v + 1);
  }, [slug, clearInProgress]);

  const submit = useCallback(() => {
    if (!exam || submittedRef.current) return;
    submittedRef.current = true;
    const score = scoreMock(exam.questions, answers);
    const finishedAt = new Date().toISOString();
    const durationSec = Math.max(0, Math.round((Math.min(Date.now(), exam.deadlineAt) - Date.parse(exam.startedAt)) / 1000));
    addAttempt({
      id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      quizSlug: slug,
      mode: 'mock',
      length: exam.lengthId,
      score: score.percent,
      correct: score.correct,
      total: score.total,
      durationSec,
      startedAt: exam.startedAt,
      finishedAt,
      answers: Object.fromEntries(exam.questions.map((q) => [
        q.id,
        { correct: isAnswerCorrect(q, answers[q.id]), selectedIds: answers[q.id] || [], timeSec: 0 },
      ])),
      flaggedIds: Array.from(flags),
    });
    clearInProgress(saveKey(slug));
    setResult({ ...score, durationSec });
    setPhase('results');
  }, [exam, answers, flags, slug, addAttempt, clearInProgress]);

  // Tick once a second, and re-sync when the tab becomes visible again.
  useEffect(() => {
    if (phase !== 'exam') return undefined;
    const tick = () => setNow(Date.now());
    const id = setInterval(tick, 1000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [phase]);

  const timeLeft = exam ? Math.max(0, Math.ceil((exam.deadlineAt - now) / 1000)) : null;

  useEffect(() => {
    if (phase === 'exam' && timeLeft === 0) submit();
  }, [phase, timeLeft, submit]);

  // Persist progress so a refresh or closed tab can resume.
  useEffect(() => {
    if (phase !== 'exam' || !exam || submittedRef.current) return;
    saveInProgress(saveKey(slug), {
      ids: exam.questions.map((q) => q.id),
      optionOrder: Object.fromEntries(exam.questions.map((q) => [q.id, q.options.map((o) => o.id)])),
      answers,
      flags: Array.from(flags),
      idx,
      deadlineAt: exam.deadlineAt,
      startedAt: exam.startedAt,
      timeLimitSec: exam.timeLimitSec,
      lengthId: exam.lengthId,
    });
  }, [phase, exam, answers, flags, idx, slug, saveInProgress]);

  const select = useCallback((questionId, optionId, isMulti) => {
    setAnswers((prev) => {
      const current = prev[questionId] || [];
      if (!isMulti) return { ...prev, [questionId]: [optionId] };
      const next = current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId];
      return { ...prev, [questionId]: next };
    });
  }, []);

  const toggleFlag = useCallback((questionId) => {
    setFlags((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  }, []);

  const backToSetup = useCallback(() => {
    setExam(null);
    setResult(null);
    setPhase('setup');
  }, []);

  return {
    phase,
    exam,
    answers,
    flags,
    idx,
    setIdx,
    timeLeft,
    result,
    saved: saved && saved.deadlineAt > now ? saved : saved ? { ...saved, expired: true } : null,
    start,
    resume,
    discardSaved,
    submit,
    select,
    toggleFlag,
    backToSetup,
  };
}
