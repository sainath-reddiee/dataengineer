// src/components/flashcards/FlashCardDeck.jsx
// Manages a deck of flashcards with progress tracking

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import FlashCard from './FlashCard';
import { CheckCircle, XCircle, RotateCcw, Award } from 'lucide-react';

const FlashCardDeck = ({ cards, certificationTitle }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [knownCards, setKnownCards] = useState([]);
  const [unknownCards, setUnknownCards] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const currentCard = cards[currentIndex];

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
    } else {
      // End of deck
      setShowResults(true);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowAnswer(false);
    }
  };

  const handleToggleAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  const handleMarkKnown = () => {
    if (!knownCards.includes(currentIndex)) {
      setKnownCards([...knownCards, currentIndex]);
      // Remove from unknown if it was there
      setUnknownCards(unknownCards.filter(i => i !== currentIndex));
    }
    handleNext();
  };

  const handleMarkUnknown = () => {
    if (!unknownCards.includes(currentIndex)) {
      setUnknownCards([...unknownCards, currentIndex]);
      // Remove from known if it was there
      setKnownCards(knownCards.filter(i => i !== currentIndex));
    }
    handleNext();
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setShowAnswer(false);
    setKnownCards([]);
    setUnknownCards([]);
    setShowResults(false);
  };

  const handleStudyUnknown = () => {
    if (unknownCards.length > 0) {
      setCurrentIndex(unknownCards[0]);
      setShowResults(false);
    }
  };

  // Results Screen
  if (showResults) {
    const score = knownCards.length;
    const total = cards.length;
    const percentage = Math.round((score / total) * 100);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto p-8 text-center"
      >
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700">
          {/* Trophy Icon */}
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
              <Award className="h-10 w-10 text-white" />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white mb-4">
            Study Session Complete!
          </h2>
          
          <div className="mb-8">
            <div className="text-6xl font-black text-white mb-2">
              {percentage}%
            </div>
            <p className="text-gray-400">
              You knew {score} out of {total} cards
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4">
              <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{knownCards.length}</div>
              <div className="text-sm text-gray-400">Known</div>
            </div>
            
            <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4">
              <XCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{unknownCards.length}</div>
              <div className="text-sm text-gray-400">Need Review</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleRestart}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <RotateCcw className="h-4 w-4" />
              Restart Deck
            </button>
            
            {unknownCards.length > 0 && (
              <button
                onClick={handleStudyUnknown}
                className="px-6 py-3 bg-orange-600 hover:bg-orange-700 rounded-lg text-white font-semibold transition-all"
              >
                Review {unknownCards.length} Unknown Cards
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Main Flashcard View
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          {certificationTitle} Flashcards
        </h1>
        <p className="text-gray-400">
          Study and test your knowledge
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Progress</span>
          <span>{currentIndex + 1} / {cards.length}</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <FlashCard
        card={currentCard}
        onNext={handleNext}
        onPrevious={handlePrevious}
        currentIndex={currentIndex}
        totalCards={cards.length}
        showAnswer={showAnswer}
        onToggleAnswer={handleToggleAnswer}
      />

      {/* Know/Don't Know Buttons (shown after flipping) */}
      {showAnswer && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center gap-4 mt-8"
        >
          <button
            onClick={handleMarkUnknown}
            className="px-8 py-4 bg-red-600/20 hover:bg-red-600/30 border-2 border-red-500 rounded-lg text-white font-semibold flex items-center gap-2 transition-all"
          >
            <XCircle className="h-5 w-5" />
            Need Review
          </button>
          
          <button
            onClick={handleMarkKnown}
            className="px-8 py-4 bg-green-600/20 hover:bg-green-600/30 border-2 border-green-500 rounded-lg text-white font-semibold flex items-center gap-2 transition-all"
          >
            <CheckCircle className="h-5 w-5" />
            I Know This
          </button>
        </motion.div>
      )}

      {/* Stats Panel */}
      <div className="mt-12 grid grid-cols-2 gap-4 max-w-md mx-auto">
        <div className="bg-slate-800/50 rounded-lg p-4 text-center border border-slate-700">
          <CheckCircle className="h-6 w-6 text-green-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{knownCards.length}</div>
          <div className="text-xs text-gray-400">Known</div>
        </div>
        
        <div className="bg-slate-800/50 rounded-lg p-4 text-center border border-slate-700">
          <XCircle className="h-6 w-6 text-red-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{unknownCards.length}</div>
          <div className="text-xs text-gray-400">Review</div>
        </div>
      </div>
    </div>
  );
};

export default FlashCardDeck;