// HistoryDetail.tsx - Clean Design without Ring, Outline & Explanation
import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Trophy, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';

interface Question {
  _id: string;
  text: string;
  options: string[];
  category: string;
  difficulty: string;
  correctAnswerIndex: number;
}

interface Result {
  questionId: string;
  isCorrect: boolean;
  correctAnswerIndex: number;
  userSelectedIndex: number;
  question: Question;
}

interface HistoryDetail {
  _id: string;
  title: string;
  category: string;
  score: number;
  total: number;
  completedAt: string;
  testId: {
    _id: string;
    title: string;
    category: string;
  };
  results: Result[];
  stats: {
    correctCount: number;
    incorrectCount: number;
    percentage: number;
  };
}

interface HistoryDetailProps {
  historyId: string;
  onBack?: () => void;
}

const HistoryDetail = ({ historyId, onBack }: HistoryDetailProps) => {
  const [detail, setDetail] = useState<HistoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchDetail();
  }, [historyId]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/history/detail/${historyId}`);
      setDetail(res.data);
    } catch (error) {
      console.error('Error fetching detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToNext = () => {
    if (detail && currentIndex < detail.total - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentIndex(index);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">History not found</p>
          {onBack && (
            <button onClick={onBack} className="mt-4 text-blue-600 hover:text-blue-700">
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  const currentResult = detail.results[currentIndex];
  const currentQuestion = currentResult?.question;
  const percentage = detail.stats.percentage;

  const getOptionLetter = (index: number) => String.fromCharCode(65 + index);

  const getQuestionStatus = (result: Result) => {
    if (result.isCorrect) return 'correct';
    if (!result.isCorrect && result.userSelectedIndex !== undefined) return 'incorrect';
    return 'unanswered';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                </button>
              )}
              <div>
                <h1 className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-1">{detail.title}</h1>
                <div className="flex flex-wrap items-center gap-1 mt-0.5">
                  <span className="text-[10px] sm:text-xs text-gray-500 px-1.5 py-0.5 bg-gray-100 rounded">
                    {detail.category}
                  </span>
                  <span className="text-[10px] sm:text-xs text-gray-400 flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    {new Date(detail.completedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-right">
                <div className="text-base sm:text-xl font-bold text-gray-900">
                  {detail.score}/{detail.total}
                </div>
                <div className="text-[9px] sm:text-xs text-gray-500">Score</div>
              </div>
              <div className="w-px h-6 sm:h-8 bg-gray-200"></div>
              <div className="text-right">
                <div className="text-base sm:text-xl font-bold text-blue-600">{percentage.toFixed(0)}%</div>
                <div className="text-[9px] sm:text-xs text-gray-500">Accuracy</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
        {/* Question Navigator - 10 items per row */}
        <div className="bg-white rounded-lg border border-gray-200 p-2 sm:p-4 mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-2 sm:mb-3 px-1">
            <h3 className="text-xs sm:text-sm font-medium text-gray-700">Questions</h3>
            <div className="flex items-center gap-2 sm:gap-3 text-[9px] sm:text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-600 rounded"></div>
                <span className="text-gray-600 hidden sm:inline">Correct</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-600 rounded"></div>
                <span className="text-gray-600 hidden sm:inline">Incorrect</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-200 rounded border border-gray-400"></div>
                <span className="text-gray-600 hidden sm:inline">Current</span>
              </div>
            </div>
          </div>
          
          {/* Grid - 10 columns fixed */}
          <div className="grid grid-cols-10 gap-1 sm:gap-1.5">
            {detail.results.map((result, idx) => {
              const status = getQuestionStatus(result);
              return (
                <button
                  key={idx}
                  onClick={() => goToQuestion(idx)}
                  className={`
                    aspect-square rounded-md sm:rounded-lg text-xs sm:text-sm font-medium
                    flex items-center justify-center transition-colors
                    ${currentIndex === idx 
                      ? 'bg-gray-800 text-white' 
                      : status === 'correct'
                        ? 'bg-blue-950 text-white hover:bg-blue-700'
                        : status === 'incorrect'
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4 sm:mb-6">
          <div className="flex justify-between text-[10px] sm:text-sm text-gray-500 mb-1 sm:mb-2">
            <span>Question {currentIndex + 1} of {detail.total}</span>
            <span className="text-blue-600 font-medium">{Math.round(((currentIndex + 1) / detail.total) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
            <div 
              className="bg-blue-600 h-1.5 sm:h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / detail.total) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-3 sm:px-6 py-2 sm:py-4 bg-gray-50 border-b border-gray-200 flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-medium text-gray-700">
                Q{currentIndex + 1}
              </span>
              {currentQuestion?.difficulty && (
                <span className={`text-[9px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded capitalize ${
                  currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                  currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {currentQuestion.difficulty}
                </span>
              )}
            </div>
            <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-sm font-medium ${
              currentResult.isCorrect 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {currentResult.isCorrect ? (
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              ) : (
                <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              )}
              <span className="hidden sm:inline">{currentResult.isCorrect ? 'Correct' : 'Incorrect'}</span>
            </div>
          </div>

          {/* Question */}
          <div className="p-3 sm:p-6">
            <p className="text-gray-800 text-xs sm:text-base leading-relaxed mb-4 sm:mb-6">
              {currentQuestion?.text || 'Question text not available'}
            </p>

            {/* Options */}
            <div className="space-y-2 sm:space-y-3">
              {currentQuestion?.options?.map((option, idx) => {
                const isCorrect = idx === currentResult.correctAnswerIndex;
                const isUserSelected = idx === currentResult.userSelectedIndex;
                const showCorrectHighlight = isCorrect && !currentResult.isCorrect;
                
                let optionStyle = 'border-gray-200 bg-white';
                let textStyle = 'text-gray-700';
                
                if (isUserSelected && currentResult.isCorrect) {
                  optionStyle = 'border-green-500 bg-green-50';
                  textStyle = 'text-green-900 font-medium';
                } else if (isUserSelected && !currentResult.isCorrect) {
                  optionStyle = 'border-red-500 bg-red-50';
                  textStyle = 'text-red-900 font-medium';
                } else if (showCorrectHighlight) {
                  optionStyle = 'border-green-500 bg-green-50';
                  textStyle = 'text-green-900';
                }
                
                return (
                  <div
                    key={idx}
                    className={`border rounded-lg p-2 sm:p-4 ${optionStyle}`}
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className={`
                        w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-medium flex-shrink-0
                        ${isUserSelected || showCorrectHighlight ? 'bg-white border-2' : 'bg-gray-100'}
                        ${isUserSelected && currentResult.isCorrect ? 'border-green-500 text-green-600' : ''}
                        ${isUserSelected && !currentResult.isCorrect ? 'border-red-500 text-red-600' : ''}
                        ${showCorrectHighlight ? 'border-green-500 text-green-600' : ''}
                        ${!isUserSelected && !showCorrectHighlight ? 'text-gray-600' : ''}
                      `}>
                        {getOptionLetter(idx)}
                      </div>
                      <div className="flex-1">
                        <p className={`text-[11px] sm:text-sm ${textStyle}`}>
                          {option}
                        </p>
                      </div>
                      {(isUserSelected || showCorrectHighlight) && (
                        <div className="flex-shrink-0">
                          {(isUserSelected && currentResult.isCorrect) || showCorrectHighlight ? (
                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                          ) : isUserSelected && !currentResult.isCorrect ? (
                            <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation */}
          <div className="px-3 sm:px-6 py-2 sm:py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-2">
            <button
              onClick={goToPrev}
              disabled={currentIndex === 0}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 text-[10px] sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>
            <div className="text-[10px] sm:text-sm text-gray-500">
              {currentIndex + 1}/{detail.total}
            </div>
            <button
              onClick={goToNext}
              disabled={currentIndex === detail.total - 1}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 text-[10px] sm:text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-4 sm:mt-6 bg-white rounded-lg border border-gray-200 p-2 sm:p-4">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
            <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-600" />
            <h3 className="text-xs sm:text-sm font-medium text-gray-900">Summary</h3>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="text-center">
              <div className="text-base sm:text-2xl font-bold text-green-600">{detail.stats.correctCount}</div>
              <div className="text-[9px] sm:text-xs text-gray-500">Correct</div>
            </div>
            <div className="text-center">
              <div className="text-base sm:text-2xl font-bold text-red-600">{detail.stats.incorrectCount}</div>
              <div className="text-[9px] sm:text-xs text-gray-500">Incorrect</div>
            </div>
            <div className="text-center">
              <div className="text-base sm:text-2xl font-bold text-blue-600">{detail.total}</div>
              <div className="text-[9px] sm:text-xs text-gray-500">Total</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryDetail;