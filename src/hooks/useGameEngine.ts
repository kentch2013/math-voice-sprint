import { useState, useEffect, useRef, useCallback } from 'react';
import type { MathProblem, QuestionResult, GameSession } from '../types';
import { generateMathProblems } from '../utils/mathGenerator';
import { parseNumberFromUtterance } from '../utils/numberWords';
import { playCorrectChime } from '../utils/audioSynthesizer';
import { useVoiceRecognition } from './useVoiceRecognition';

export type GameStatus = 'idle' | 'playing' | 'completed';

export const QUESTION_TIME_LIMIT = 30; // 30 seconds
export const SILENCE_NUDGE_TIME = 10;   // 10 seconds silence detection nudge
export const AUTO_RESTART_TIME = 15;   // 15 seconds session restart countdown

export function useGameEngine() {
  const [status, setStatus] = useState<GameStatus>('idle');
  const [problems, setProblems] = useState<MathProblem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [results, setResults] = useState<QuestionResult[]>([]);

  // Timers
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number>(QUESTION_TIME_LIMIT);
  const [showSilenceNudge, setShowSilenceNudge] = useState<boolean>(false);
  const [restartCountdown, setRestartCountdown] = useState<number>(AUTO_RESTART_TIME);

  const [attemptsCount, setAttemptsCount] = useState<number>(0);
  const [keypadInput, setKeypadInput] = useState<string>('');
  const [session, setSession] = useState<GameSession | null>(null);

  const startTimeRef = useRef<number>(Date.now());
  const questionStartTimeRef = useRef<number>(Date.now());
  const processedUtteranceRef = useRef<string>('');
  const silenceTimeRef = useRef<number>(0);

  const currentProblem: MathProblem | undefined = problems[currentIndex];

  // Callback when voice recognition hears text
  const handleVoiceTranscript = useCallback((text: string) => {
    if (status !== 'playing' || !text) return;

    // Process new transcript text
    const parsedNumber = parseNumberFromUtterance(text);
    if (parsedNumber !== null && currentProblem) {
      if (text !== processedUtteranceRef.current) {
        processedUtteranceRef.current = text;
        submitAnswer(parsedNumber, 'voice');
      }
    }
  }, [status, currentProblem]);

  const voiceRecognition = useVoiceRecognition({
    onTranscriptChange: handleVoiceTranscript,
  });

  // Start new game session
  const startGame = useCallback(() => {
    const newProblems = generateMathProblems(10);
    setProblems(newProblems);
    setCurrentIndex(0);
    setResults([]);
    setStatus('playing');
    setQuestionTimeLeft(QUESTION_TIME_LIMIT);
    setShowSilenceNudge(false);
    silenceTimeRef.current = 0;
    setAttemptsCount(0);
    setKeypadInput('');
    setRestartCountdown(AUTO_RESTART_TIME);
    processedUtteranceRef.current = '';

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

  // Submit an answer (from voice or keypad or timeout)
  const submitAnswer = useCallback((
    answer: number | undefined,
    inputMethod: 'voice' | 'keypad' | 'timeout'
  ) => {
    if (!currentProblem || status !== 'playing') return;

    const timeSpent = Math.max(1, Math.round((Date.now() - questionStartTimeRef.current) / 1000));
    const isCorrect = answer === currentProblem.expectedAnswer;

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

    // Reset voice transcript & input for next question
    voiceRecognition.resetTranscript();
    processedUtteranceRef.current = '';
    setKeypadInput('');
    setAttemptsCount(0);
    setShowSilenceNudge(false);
    silenceTimeRef.current = 0;

    const nextIndex = currentIndex + 1;
    if (nextIndex < problems.length) {
      setCurrentIndex(nextIndex);
      setQuestionTimeLeft(QUESTION_TIME_LIMIT);
      questionStartTimeRef.current = Date.now();
    } else {
      finishGame(updatedResults);
    }
  }, [currentProblem, status, attemptsCount, results, currentIndex, problems.length, finishGame, voiceRecognition]);

  // Handle wrong attempt count bump
  const recordFailedAttempt = useCallback(() => {
    setAttemptsCount((prev) => prev + 1);
  }, []);

  // Question 30s countdown and 10s silence timer
  useEffect(() => {
    if (status !== 'playing') return;

    const timer = setInterval(() => {
      setQuestionTimeLeft((prev) => {
        if (prev <= 1) {
          // Question timeout!
          submitAnswer(undefined, 'timeout');
          return QUESTION_TIME_LIMIT;
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
    restartCountdown,
    keypadInput,
    setKeypadInput,
    session,
    voiceRecognition,
    startGame,
    submitAnswer,
    recordFailedAttempt,
  };
}
