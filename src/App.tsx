import { useGameEngine } from './hooks/useGameEngine';
import { StartScreen } from './components/StartScreen';
import { ProgressBar } from './components/ProgressBar';
import { GameBoard } from './components/GameBoard';
import { Keypad } from './components/Keypad';
import { SummaryModal } from './components/SummaryModal';

export function App() {
  const {
    status,
    currentProblem,
    currentIndex,
    totalQuestions,
    results,
    questionTimeLeft,
    showSilenceNudge,
    showExpiredAnswer,
    restartCountdown,
    keypadInput,
    setKeypadInput,
    session,
    voiceRecognition,
    startGame,
    submitAnswer,
  } = useGameEngine();

  const handleKeypadPress = (digit: string) => {
    if (keypadInput.length < 3) {
      setKeypadInput((prev) => prev + digit);
    }
  };

  const handleKeypadDelete = () => {
    setKeypadInput((prev) => prev.slice(0, -1));
  };

  const handleKeypadSubmit = () => {
    if (!keypadInput) return;
    const num = parseInt(keypadInput, 10);
    if (!isNaN(num)) {
      submitAnswer(num, 'keypad');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans flex flex-col justify-between py-6">
      <header className="px-4 text-center mb-2">
        <h1 className="text-xl font-black text-indigo-900 tracking-tight flex items-center justify-center gap-2">
          ⚡ Math Sprint PWA
        </h1>
      </header>

      <main className="flex-1 flex flex-col justify-center max-w-3xl mx-auto w-full">
        {status === 'idle' && (
          <StartScreen
            onStart={startGame}
            isVoiceSupported={voiceRecognition.isSupported}
          />
        )}

        {(status === 'playing' || status === 'completed') && (
          <>
            <ProgressBar
              currentIndex={currentIndex}
              totalQuestions={totalQuestions}
              results={results}
            />

            {currentProblem && status === 'playing' && (
              <>
                <GameBoard
                  problem={currentProblem}
                  timeLeft={questionTimeLeft}
                  showSilenceNudge={showSilenceNudge}
                  showExpiredAnswer={showExpiredAnswer}
                  transcript={voiceRecognition.transcript}
                  interimTranscript={voiceRecognition.interimTranscript}
                  isListening={voiceRecognition.isListening}
                  volumeLevel={voiceRecognition.volumeLevel}
                  isSpeechDetected={voiceRecognition.isSpeechDetected}
                  keypadInput={keypadInput}
                />

                <Keypad
                  onNumberPress={handleKeypadPress}
                  onDelete={handleKeypadDelete}
                  onSubmit={handleKeypadSubmit}
                  value={keypadInput}
                />
              </>
            )}
          </>
        )}

        {status === 'completed' && (
          <SummaryModal
            session={session}
            restartCountdown={restartCountdown}
            onPlayAgain={startGame}
          />
        )}
      </main>

      <footer className="text-center text-xs text-slate-400 mt-6">
        Voice-Enabled Math Sprint • Designed for Kids
      </footer>
    </div>
  );
}

export default App;
