import React, { useState, useEffect } from 'react';
import socket from '../socket';
import { Question } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, Zap, Timer, Trophy } from 'lucide-react';

const Player: React.FC = () => {
  const [playerName, setPlayerName] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<'A' | 'B'>('A');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [askedQuestions, setAskedQuestions] = useState<string[]>([]);
  const [mode, setMode] = useState<'1v1' | '2v2'>('1v1');
  const [roomId, setRoomId] = useState<string>('');
  const [playerIndex, setPlayerIndex] = useState<number | null>(null);
  const [gameState, setGameState] = useState<'joining' | 'waiting' | 'quiz' | 'controller' | 'stunned' | 'finished'>('joining');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [stunTimeLeft, setStunTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    const modeParam = urlParams.get('mode') as '1v1' | '2v2';
    if (roomParam) setRoomId(roomParam);
    if (modeParam) setMode(modeParam);

    socket.on('joined-room', ({ playerIndex, team, mode }) => {
      setPlayerIndex(playerIndex);
      setSelectedTeam(team);
      if (mode) setMode(mode);
      setGameState('waiting');
    });

    socket.on('join-error', (msg) => setError(msg));

    socket.on('game-started', ({ questions }) => {
      setQuestions(questions);
      nextQuestion(questions);
    });

    socket.on('team-assigned', (team) => {
      setSelectedTeam(team);
    });

    socket.on('score-updated', (scores) => {
      if (socket.id) setScore(scores[socket.id] || 0);
    });

    socket.on('game-finished', () => setGameState('finished'));

    return () => {
      socket.off('joined-room');
      socket.off('join-error');
      socket.off('game-started');
      socket.off('score-updated');
      socket.off('game-finished');
      socket.off('team-assigned');
    };
  }, []);

  const joinRoom = () => {
    if (roomId && playerName) {
      socket.emit('player-join-room', { 
        roomId: roomId.toUpperCase(), 
        name: playerName,
        team: selectedTeam 
      });
    }
  };

  const nextQuestion = (qs?: Question[]) => {
    const availableQuestions = (qs || questions).filter(q => !askedQuestions.includes(q.id));
    const list = availableQuestions.length > 0 ? availableQuestions : (qs || questions);
    
    if (list.length === 0) return;

    const randomQuestion = list[Math.floor(Math.random() * list.length)];
    setCurrentQuestion(randomQuestion);
    setAskedQuestions(prev => [...prev, randomQuestion.id]);
    setGameState('quiz');
  };

  const handleAnswer = (index: number) => {
    const correct = index === currentQuestion?.correctAnswer;
    socket.emit('submit-answer', { roomId, correct });

    if (correct) {
      setGameState('controller');
    } else {
      setGameState('stunned');
      setStunTimeLeft(3); // Reduced stun time as requested
      const timer = setInterval(() => {
        setStunTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            nextQuestion();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const fireHook = () => {
    socket.emit('fire-hook', { roomId });
    // After firing, wait a bit then show next question
    setTimeout(() => {
      if (gameState === 'controller') nextQuestion();
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-stone-900 text-white flex flex-col items-center justify-center p-6 font-sans select-none overflow-hidden">
      <AnimatePresence mode="wait">
        {gameState === 'joining' && (
          <motion.div 
            key="joining"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-sm space-y-6"
          >
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-black italic tracking-tighter text-yellow-500 uppercase">Join Arena</h1>
              <p className="text-stone-400 font-medium">Enter your name and room code</p>
            </div>
            
            <div className="space-y-4">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="YOUR NAME"
                className="w-full bg-stone-800 border-2 border-stone-700 rounded-2xl p-4 text-center text-xl font-bold focus:border-yellow-500 outline-none transition-all placeholder:text-stone-600"
              />
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                placeholder="ROOM CODE"
                className="w-full bg-stone-800 border-2 border-stone-700 rounded-2xl p-4 text-center text-2xl font-mono font-bold focus:border-yellow-500 outline-none transition-all placeholder:text-stone-600"
              />
              
              {mode === '2v2' && (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setSelectedTeam('A')}
                    className={`p-4 rounded-2xl font-bold border-2 transition-all ${selectedTeam === 'A' ? 'bg-blue-600 border-blue-400' : 'bg-stone-800 border-stone-700 text-stone-500'}`}
                  >
                    TEAM A
                  </button>
                  <button
                    onClick={() => setSelectedTeam('B')}
                    className={`p-4 rounded-2xl font-bold border-2 transition-all ${selectedTeam === 'B' ? 'bg-red-600 border-red-400' : 'bg-stone-800 border-stone-700 text-stone-500'}`}
                  >
                    TEAM B
                  </button>
                </div>
              )}

              {error && <p className="text-red-500 text-center font-bold text-sm">{error}</p>}
              <button
                onClick={joinRoom}
                disabled={!roomId || !playerName}
                className="w-full py-4 bg-yellow-500 text-stone-900 rounded-2xl font-bold text-xl hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-yellow-500/20"
              >
                Connect Controller
              </button>
            </div>
          </motion.div>
        )}

        {gameState === 'waiting' && (
          <motion.div 
            key="waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-6"
          >
            <div className="relative">
              <div className="w-24 h-24 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Zap className="text-yellow-500" size={32} />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold">Ready, {playerName}!</h2>
              <p className="text-stone-400">Waiting for host to start the game...</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-stone-800 p-4 rounded-2xl border border-stone-700">
                <p className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-1">Player Slot</p>
                <p className="text-2xl font-black text-yellow-500">P{playerIndex !== null ? playerIndex + 1 : '?'}</p>
              </div>
              {mode === '2v2' && (
                <div className={`p-4 rounded-2xl border ${selectedTeam === 'A' ? 'bg-blue-900/50 border-blue-700' : 'bg-red-900/50 border-red-700'}`}>
                  <p className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-1">Team</p>
                  <p className={`text-2xl font-black ${selectedTeam === 'A' ? 'text-blue-400' : 'text-red-400'}`}>{selectedTeam}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {gameState === 'quiz' && currentQuestion && (
          <motion.div 
            key="quiz"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="w-full max-w-md space-y-8"
          >
            <div className="bg-stone-800 p-6 rounded-3xl border border-stone-700 shadow-xl">
              <p className="text-yellow-500 font-bold uppercase tracking-widest text-xs mb-4">Question</p>
              <h3 className="text-xl font-bold leading-tight">{currentQuestion.text}</h3>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {currentQuestion.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  className="w-full p-4 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-2xl text-left font-bold transition-all active:scale-95 flex items-center gap-4"
                >
                  <div className="w-8 h-8 bg-stone-700 rounded-lg flex items-center justify-center text-stone-400 text-sm">
                    {String.fromCharCode(65 + i)}
                  </div>
                  {opt}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {gameState === 'controller' && (
          <motion.div 
            key="controller"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm text-center space-y-8"
          >
            <div className="space-y-2">
              <div className="inline-block p-4 bg-green-500/10 rounded-full mb-2">
                <CheckCircle2 className="text-green-500" size={48} />
              </div>
              <h2 className="text-3xl font-black uppercase italic tracking-tighter">Correct!</h2>
              <p className="text-stone-400">Watch the screen and fire when ready!</p>
            </div>

            <button
              onClick={fireHook}
              className="w-full aspect-square bg-yellow-500 text-stone-900 rounded-full font-black text-4xl shadow-[0_12px_0_rgb(161,98,7)] active:shadow-none active:translate-y-3 transition-all flex items-center justify-center uppercase italic tracking-tighter"
            >
              Fire!
            </button>
          </motion.div>
        )}

        {gameState === 'stunned' && (
          <motion.div 
            key="stunned"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-8"
          >
            <div className="relative">
              <div className="w-32 h-32 border-8 border-red-500/20 rounded-full mx-auto" />
              <div className="absolute inset-0 flex items-center justify-center">
                <XCircle className="text-red-500 animate-pulse" size={64} />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-4xl font-black text-red-500 uppercase italic tracking-tighter">Stunned!</h2>
              <p className="text-stone-400 font-bold">Wrong answer. Try again in:</p>
            </div>
            <div className="flex items-center justify-center gap-3 text-5xl font-mono font-black">
              <Timer className="text-red-500" />
              {stunTimeLeft}s
            </div>
          </motion.div>
        )}

        {gameState === 'finished' && (
          <motion.div 
            key="finished"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-8"
          >
            <div className="inline-block p-6 bg-yellow-500 rounded-full">
              <Trophy size={64} className="text-stone-900" />
            </div>
            <div className="space-y-2">
              <h2 className="text-5xl font-black italic tracking-tighter uppercase">Final Score</h2>
              <p className="text-7xl font-black text-yellow-500">{score}</p>
              <p className="text-stone-400 font-bold uppercase tracking-widest">Points Collected</p>
            </div>
            <p className="text-stone-500 font-medium">Check the main screen for results!</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Player;
