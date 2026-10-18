import { useState, useEffect, useRef, useCallback } from 'react';
import type { MathProblem, QuestionResult, GameSession } from '../types';
import { generateMathProblems } from '../utils/mathGenerator';
import { checkUtteranceMatchesAnswer } from '../utils/numberWords';
import { playCorrectChime } from '../utils/audioSynthesizer';
import { useVoiceRecognition, type VoiceLanguage } from './useVoiceRecognition';

export type GameStatus = 'idle' | 'playing' | 'completed';

export const QUESTION_TIME_LIMIT = 30; // 30 seconds
export const SILENCE_NUDGE_TIME = 10;   // 10 seconds silence detection nudge
export const AUTO_RESTART_TIME = 15;   // 15 seconds session restart countdown

export function useGameEngine() {
  const [status, setStatus] = useState<GameStatus>('idle');
  const [problems, setProblems] = useState<MathProblem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [language, setLanguage] = useState<VoiceLanguage>('en-US');

  // Timers
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number>(QUESTION_TIME_LIMIT);
  const [showSilenceNudge, setShowSilenceNudge] = useState<boolean>(false);
  const [restartCountdown, setRestartCountdown] = useState<number>(AUTO_RESTART_TIME);

  // Expired answer display state (PRD §5.1: 3-second red/orange answer display)
  const [showExpiredAnswer, setShowExpiredAnswer] = useState<boolean>(false);

  const [attemptsCount, setAttemptsCount] = useState<number>(0);
  const [keypadInput, setKeypadInput] = useState<string>('');
  const [session, setSession] = useState<GameSession | null>(null);

  const startTimeRef = useRef<number>(Date.now());
  const questionStartTimeRef = useRef<number>(Date.now());
  const silenceTimeRef = useRef<number>(0);
  const isTransitioningRef = useRef<boolean>(false);

  const currentProblem: MathProblem | undefined = problems[currentIndex];

  const currentProblemRef = useRef<MathProblem | undefined>(currentProblem);
  const statusRef = useRef<GameStatus>(status);
  const finishGameRef = useRef<(finalResults: QuestionResult[]) => void>(() => {});
  const resetTranscriptRef = useRef<() => void>(() => {});

  useEffect(() => {
    currentProblemRef.current = currentProblem;
    statusRef.current = status;
  }, [currentProblem, status]);

  // Submit an answer (voice, keypad, or timeout)
  const submitAnswer = useCallback((
    answer: number | undefined,
    inputMethod: 'voice' | 'keypad' | 'timeout'
  ) => {
    if (!currentProblem || status !== 'playing' || isTransitioningRef.current) return;

    const timeSpent = Math.max(1, Math.round((Date.now() - questionStartTimeRef.current) / 1000));
    const isCorrect = answer === currentProblem.expectedAnswer;

    // PRD: Incorrect answers do nothing; allow retries until 30s timeout
    if (!isCorrect && inputMethod !== 'timeout') {
      setAttemptsCount((prev) => prev + 1);
      return;
    }

    if (isCorrect) {
      playCorrectChime();
    }

    const newResult: QuestionResult = {
      questionId: currentProblem.id,
      problem: `${currentProblem.operandA} x ${currentProblem.operandB}`,
      expectedAnswer: currentProblem.expectedAnswer,
      userAnswer: answer,
      isCorrect,
      timeSpentSeconds: timeSpent,
      inputMethod,
      attemptsCount: attemptsCount + 1,
    };

    const updatedResults = [...results, newResult];
    setResults(updatedResults);

    const advanceToNext = () => {
      resetTranscriptRef.current();
      setKeypadInput('');
      setAttemptsCount(0);
      setShowSilenceNudge(false);
      setShowExpiredAnswer(false);
      silenceTimeRef.current = 0;
      isTransitioningRef.current = false;

      const nextIndex = currentIndex + 1;
      if (nextIndex < problems.length) {
        setCurrentIndex(nextIndex);
        setQuestionTimeLeft(QUESTION_TIME_LIMIT);
        questionStartTimeRef.current = Date.now();
      } else {
        finishGameRef.current(updatedResults);
      }
    };

    resetTranscriptRef.current();

    // If timeout, display the correct answer for 3 seconds before advancing
    if (inputMethod === 'timeout') {
      isTransitioningRef.current = true;
      setShowExpiredAnswer(true);
      setTimeout(() => {
        advanceToNext();
      }, 3000);
    } else {
      advanceToNext();
    }
  }, [currentProblem, status, attemptsCount, results, currentIndex, problems.length]);

  const submitAnswerRef = useRef(submitAnswer);
  useEffect(() => {
    submitAnswerRef.current = submitAnswer;
  }, [submitAnswer]);

  // Callback when voice recognition hears text
  const handleVoiceTranscript = useCallback((text: string) => {
    const activeStatus = statusRef.current;
    const activeProblem = currentProblemRef.current;

    if (activeStatus !== 'playing' || !text || isTransitioningRef.current || !activeProblem) return;

    // Reset silence nudge on recognized speech
    silenceTimeRef.current = 0;
    setShowSilenceNudge(false);

    // Evaluate whole sentence or any substring token against expected answer
    if (checkUtteranceMatchesAnswer(text, activeProblem.expectedAnswer)) {
      submitAnswerRef.current(activeProblem.expectedAnswer, 'voice');
    }
  }, []);

  const voiceRecognition = useVoiceRecognition({
    onTranscriptChange: handleVoiceTranscript,
    language,
  });

  useEffect(() => {
    resetTranscriptRef.current = voiceRecognition.resetTranscript;
  }, [voiceRecognition.resetTranscript]);

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => (prev === 'en-US' ? 'zh-CN' : 'en-US'));
  }, []);

  // Start new game session
  const startGame = useCallback(() => {
    const newProblems = generateMathProblems(10);
    setProblems(newProblems);
    setCurrentIndex(0);
    setResults([]);
    setStatus('playing');
    setQuestionTimeLeft(QUESTION_TIME_LIMIT);
    setShowSilenceNudge(false);
    setShowExpiredAnswer(false);
    silenceTimeRef.current = 0;
    setAttemptsCount(0);
    setKeypadInput('');
    setRestartCountdown(AUTO_RESTART_TIME);
    isTransitioningRef.current = false;

    const now = Date.now();
    startTimeRef.current = now;
    questionStartTimeRef.current = now;

    voiceRecognition.resetTranscript();
    voiceRecognition.startListening();
  }, [voiceRecognition]);

  // Finish current game session
  const finishGame = useCallback((finalResults: QuestionResult[]) => {
    voiceRecognition.stopListening();
    setStatus('completed');
    const correctCount = finalResults.filter((r) => r.isCorrect).length;
    const totalDurationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);

    const completedSession: GameSession = {
      sessionId: `session-${Date.now()}`,
      startedAt: new Date(startTimeRef.current).toISOString(),
      completedAt: new Date().toISOString(),
      totalQuestions: finalResults.length,
      correctCount,
      totalDurationSeconds,
      results: finalResults,
    };

    setSession(completedSession);
    setRestartCountdown(AUTO_RESTART_TIME);
  }, [voiceRecognition]);

  useEffect(() => {
    finishGameRef.current = finishGame;
  }, [finishGame]);

  // Question 30s countdown and 10s silence timer
  useEffect(() => {
    if (status !== 'playing') return;

    const timer = setInterval(() => {
      if (isTransitioningRef.current) return;

      setQuestionTimeLeft((prev) => {
        if (prev <= 1) {
          // Question timeout
          submitAnswer(undefined, 'timeout');
          return 0;
        }
        return prev - 1;
      });

      silenceTimeRef.current += 1;
      if (silenceTimeRef.current >= SILENCE_NUDGE_TIME) {
        setShowSilenceNudge(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [status, submitAnswer]);

  // Auto-restart 15s countdown on completed screen
  useEffect(() => {
    if (status !== 'completed') return;

    const autoRestartTimer = setInterval(() => {
      setRestartCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(autoRestartTimer);
          startGame();
          return AUTO_RESTART_TIME;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(autoRestartTimer);
  }, [status, startGame]);

  return {
    status,
    currentProblem,
    currentIndex,
    totalQuestions: problems.length || 10,
    results,
    questionTimeLeft,
    showSilenceNudge,
    showExpiredAnswer,
    restartCountdown,
    keypadInput,
    setKeypadInput,
    session,
    language,
    setLanguage,
    toggleLanguage,
    voiceRecognition,
    startGame,
    submitAnswer,
  };
}
