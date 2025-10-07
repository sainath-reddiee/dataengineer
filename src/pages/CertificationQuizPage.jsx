// src/pages/CertificationQuizPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, ChevronLeft, ChevronRight, Flag } from 'lucide-react';
import certificationApi from '@/services/certificationApi';
import { Button } from '@/components/ui/button';

const CertificationQuizPage = () => {
  const { slug } = useParams();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Fetch questions for this certification
    const loadQuestions = async () => {
      try {
        // First get cert ID by slug, then fetch questions
        const certs = await certificationApi.getCertifications();
        const cert = certs.find(c => c.slug === slug);
        
        if (cert) {
          const data = await certificationApi.getQuestions(cert.id);
          setQuestions(data.questions);
        }
      } catch (error) {
        console.error('Failed to load questions:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadQuestions();
  }, [slug]);
  
  const currentQuestion = questions[currentIndex];
  const isAnswered = selectedAnswers[currentQuestion?.id] !== undefined;
  
  const handleAnswerSelect = (optionIndex) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion.id]: optionIndex
    });
    setShowExplanation(true);
  };
  
  const goToNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowExplanation(false);
    }
  };
  
  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowExplanation(false);
    }
  };
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!currentQuestion) {
    return <div>No questions found</div>;
  }
  
  const selectedAnswer = selectedAnswers[currentQuestion.id];
  const correctAnswer = currentQuestion.options.findIndex(opt => opt.is_correct);
  const isCorrect = selectedAnswer === correctAnswer;
  
  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>{Math.round(((currentIndex + 1) / questions.length) * 100)}% Complete</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
      
      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="blog-card rounded-2xl p-8 mb-8"
        >
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-2xl font-bold">Question {currentIndex + 1}</h2>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                currentQuestion.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                currentQuestion.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {currentQuestion.difficulty}
              </span>
              <Button variant="ghost" size="sm">
                <Flag className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div
            className="prose prose-invert max-w-none mb-8 text-lg"
            dangerouslySetInnerHTML={{ __html: currentQuestion.question }}
          />
          
          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrectOption = option.is_correct;
              const showResult = showExplanation;
              
              let optionStyle = 'border-gray-700 hover:border-blue-400';
              if (showResult) {
                if (isCorrectOption) {
                  optionStyle = 'border-green-500 bg-green-500/10';
                } else if (isSelected && !isCorrectOption) {
                  optionStyle = 'border-red-500 bg-red-500/10';
                }
              } else if (isSelected) {
                optionStyle = 'border-blue-500 bg-blue-500/10';
              }
              
              return (
                <motion.button
                  key={index}
                  onClick={() => !showExplanation && handleAnswerSelect(index)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${optionStyle} ${
                    showExplanation ? 'cursor-default' : 'cursor-pointer'
                  }`}
                  whileHover={!showExplanation ? { scale: 1.02 } : {}}
                  whileTap={!showExplanation ? { scale: 0.98 } : {}}
                  disabled={showExplanation}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                        showResult && isCorrectOption ? 'border-green-500 bg-green-500' :
                        showResult && isSelected && !isCorrectOption ? 'border-red-500 bg-red-500' :
                        isSelected ? 'border-blue-500 bg-blue-500' :
                        'border-gray-600'
                      }`}>
                        <span className="text-sm font-bold">
                          {String.fromCharCode(65 + index)}
                        </span>
                      </div>
                      <span>{option.text}</span>
                    </div>
                    
                    {showResult && isCorrectOption && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {showResult && isSelected && !isCorrectOption && (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
          
          {/* Explanation */}
          <AnimatePresence>
            {showExplanation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 p-6 rounded-xl bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-400/30"
              >
                <div className="flex items-start space-x-3 mb-3">
                  {isCorrect ? (
                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
                  )}
                  <div>
                    <h3 className="text-lg font-bold mb-2">
                      {isCorrect ? '✅ Correct!' : '❌ Incorrect'}
                    </h3>
                    <div
                      className="prose prose-invert prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: currentQuestion.explanation }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
      
      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          variant="outline"
          className="border-blue-400/50"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        
        <Button
          onClick={goToNext}
          disabled={currentIndex === questions.length - 1}
          className="bg-gradient-to-r from-blue-600 to-purple-600"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default CertificationQuizPage;