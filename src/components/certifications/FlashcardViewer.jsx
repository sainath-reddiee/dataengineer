// src/components/certifications/FlashcardViewer.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, RotateCcw, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FlashcardViewer = ({ flashcards }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cards, setCards] = useState(flashcards);

  const currentCard = cards[currentIndex];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const handleShuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleReset = () => {
    setCards(flashcards);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Flashcards</h2>
          <p className="text-gray-400">
            Card {currentIndex + 1} of {cards.length}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShuffle}
            className="border-blue-400/50 text-blue-300 hover:bg-blue-500/20"
          >
            <Shuffle className="h-4 w-4 mr-2" />
            Shuffle
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="border-gray-400/50 text-gray-300 hover:bg-gray-500/20"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Flashcard */}
      <div 
        className="relative w-full h-96 cursor-pointer perspective-1000"
        onClick={handleFlip}
      >
        <motion.div
          className="relative w-full h-full"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front of card (Question) */}
          <div
            className="absolute w-full h-full bg-gradient-to-br from-blue-900/50 to-purple-900/50 backdrop-blur-sm border-2 border-blue-400/30 rounded-2xl shadow-2xl flex items-center justify-center p-8"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            <div className="text-center">
              <div className="text-sm font-semibold text-blue-300 mb-4">
                QUESTION
              </div>
              <h3 className="text-2xl font-bold text-white leading-relaxed">
                {currentCard.question}
              </h3>
              <p className="mt-8 text-sm text-gray-400">
                Click card to flip
              </p>
            </div>
          </div>

          {/* Back of card (Answer) */}
          <div
            className="absolute w-full h-full bg-gradient-to-br from-green-900/50 to-teal-900/50 backdrop-blur-sm border-2 border-green-400/30 rounded-2xl shadow-2xl flex items-center justify-center p-8"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="text-center">
              <div className="text-sm font-semibold text-green-300 mb-4">
                ANSWER
              </div>
              <h3 className="text-xl font-bold text-white leading-relaxed mb-4">
                {currentCard.answer}
              </h3>
              {currentCard.explanation && (
                <div className="mt-6 pt-6 border-t border-green-400/30">
                  <p className="text-sm font-semibold text-green-300 mb-2">
                    EXPLANATION
                  </p>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {currentCard.explanation}
                  </p>
                </div>
              )}
              <p className="mt-8 text-sm text-gray-400">
                Click card to flip back
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Navigation */}
      <div className="flex justify-center items-center gap-4 mt-8">
        <Button
          variant="outline"
          size="lg"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="border-blue-400/50 text-blue-300 hover:bg-blue-500/20"
        >
          <ChevronLeft className="h-5 w-5 mr-2" />
          Previous
        </Button>

        <div className="flex gap-2">
          {cards.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentIndex(idx);
                setIsFlipped(false);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentIndex
                  ? 'bg-blue-400 w-8'
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}
            />
          ))}
        </div>

        <Button
          variant="outline"
          size="lg"
          onClick={handleNext}
          disabled={currentIndex === cards.length - 1}
          className="border-blue-400/50 text-blue-300 hover:bg-blue-500/20"
        >
          Next
          <ChevronRight className="h-5 w-5 ml-2" />
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="mt-6">
        <div className="w-full bg-gray-700/50 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((currentIndex + 1) / cards.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default FlashcardViewer;