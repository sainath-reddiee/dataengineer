// src/components/flashcards/FlashCard.jsx
// Interactive flashcard component with flip animation

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCw, Volume2, Check, X } from 'lucide-react';

const FlashCard = ({ card, onNext, onPrevious, currentIndex, totalCards, showAnswer, onToggleAnswer }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    onToggleAnswer();
  };

  const handleKeyPress = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleFlip();
    } else if (e.key === 'ArrowRight') {
      onNext();
    } else if (e.key === 'ArrowLeft') {
      onPrevious();
    }
  };

  return (
    <div 
      className="flex flex-col items-center justify-center min-h-[500px] p-6"
      onKeyDown={handleKeyPress}
      tabIndex={0}
    >
      {/* Card Counter */}
      <div className="mb-6 text-center">
        <span className="text-lg font-semibold text-gray-300">
          Card {currentIndex + 1} of {totalCards}
        </span>
      </div>

      {/* Flashcard */}
      <motion.div
        className="relative w-full max-w-2xl h-[400px] cursor-pointer"
        onClick={handleFlip}
        style={{ perspective: '1000px' }}
      >
        <motion.div
          className="relative w-full h-full"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front of Card (Question) */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-2xl p-8 flex flex-col items-center justify-center"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            <div className="text-center">
              <div className="text-sm font-semibold text-blue-200 mb-4 uppercase tracking-wide">
                Question
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 leading-relaxed">
                {card.question}
              </h2>
              <div className="flex items-center justify-center gap-2 text-white/80 text-sm">
                <RotateCw className="h-4 w-4" />
                <span>Click or press Space to flip</span>
              </div>
            </div>
          </div>

          {/* Back of Card (Answer) */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-green-600 to-teal-600 rounded-2xl shadow-2xl p-8 flex flex-col"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="text-center flex-grow flex flex-col justify-center">
              <div className="text-sm font-semibold text-green-200 mb-4 uppercase tracking-wide">
                Answer
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 leading-relaxed">
                {card.answer}
              </h2>
              
              {/* Explanation (if exists) */}
              {card.explanation && (
                <div className="mt-4 p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                  <div className="text-xs font-semibold text-green-200 mb-2 uppercase">
                    Explanation
                  </div>
                  <p className="text-white/90 text-sm leading-relaxed">
                    {card.explanation}
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-center gap-2 text-white/80 text-sm mt-4">
              <RotateCw className="h-4 w-4" />
              <span>Click to flip back</span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Navigation Controls */}
      <div className="mt-8 flex items-center gap-4">
        <button
          onClick={onPrevious}
          disabled={currentIndex === 0}
          className="px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-all"
        >
          ← Previous
        </button>

        <button
          onClick={handleFlip}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold flex items-center gap-2 transition-all"
        >
          <RotateCw className="h-4 w-4" />
          Flip Card
        </button>

        <button
          onClick={onNext}
          disabled={currentIndex === totalCards - 1}
          className="px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-all"
        >
          Next →
        </button>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="mt-6 text-center text-sm text-gray-400">
        <p>Keyboard shortcuts: <span className="font-semibold">Space/Enter</span> to flip, 
        <span className="font-semibold"> ← →</span> to navigate</p>
      </div>
    </div>
  );
};

export default FlashCard;