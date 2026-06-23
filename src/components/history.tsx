// HistoryDetail.tsx - Clean Design without Ring, Outline & Explanation
import { useEffect, useState } from 'react';
import { 
  ArrowLeft, CheckCircle, XCircle, Trophy, Clock, 
  ChevronLeft, ChevronRight, MinusCircle, Lightbulb, 
  X, ChevronDown, ChevronUp 
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

interface Question {
  _id: string;
  text: string;
  options: string[];
  question: string;
  category: string;
  difficulty: string;
  correctAnswerIndex: number;
}

interface Result {
  questionId: string;
  isCorrect: boolean;
  correctAnswerIndex: number;
  userSelectedIndex: number | null;
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
    omittedCount: number;
    percentage: number;
  };
}

interface HintData {
  A: string;
  B: string;
  C: string;
  D: string;
  general_advice: string;
}

interface HistoryDetailProps {
  onBack?: () => void;
}

const HistoryDetail = ({ onBack }: HistoryDetailProps) => {
  const [detail, setDetail] = useState<HistoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hintData, setHintData] = useState<HintData | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [expandedHint, setExpandedHint] = useState<string | null>(null);
  const { id: historyId } = useParams();

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

  const closeHint = () => {
    setShowHint(false);
    setHintData(null);
    setExpandedHint(null);
  };

  const toggleHintSection = (section: string) => {
    setExpandedHint(expandedHint === section ? null : section);
  };

  const goToNext = () => {
    if (detail && currentIndex < detail.total - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowHint(false);
      setHintData(null);
      setExpandedHint(null);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowHint(false);
      setHintData(null);
      setExpandedHint(null);
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentIndex(index);
    setShowHint(false);
    setHintData(null);
    setExpandedHint(null);
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
    if (result.userSelectedIndex === null || result.userSelectedIndex === undefined) {
      return 'omitted';
    }
    if (result.isCorrect) return 'correct';
    return 'incorrect';
  };

  const omittedCount = detail.results.filter(r => r.userSelectedIndex === null || r.userSelectedIndex === undefined).length;

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
                <div className="text-base sm:text-xl font-bold text-blue-950">{percentage.toFixed(0)}%</div>
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
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-600 rounded"></div>
                <span className="text-gray-600 hidden sm:inline">Correct</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded"></div>
                <span className="text-gray-600 hidden sm:inline">Incorrect</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-200 rounded border border-gray-300"></div>
                <span className="text-gray-600 hidden sm:inline">Omitted</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-800 rounded"></div>
                <span className="text-gray-600 hidden sm:inline">Current</span>
              </div>
            </div>
          </div>
          
          {/* Grid - 10 columns fixed */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
            {detail.results.map((result, idx) => {
              const status = getQuestionStatus(result);
              return (
                <button
                  key={idx}
                  onClick={() => goToQuestion(idx)}
                  className={`
                    rounded-md sm:rounded-lg aspect-square h-10 text-xs sm:text-sm font-medium
                    flex items-center justify-center transition-all duration-200
                    ${currentIndex === idx 
                      ? 'bg-gray-800 text-white' 
                      : status === 'correct'
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : status === 'incorrect'
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-gray-100 text-gray-500 border border-gray-300 hover:bg-gray-200'
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
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-sm font-medium ${
                currentResult.userSelectedIndex === null || currentResult.userSelectedIndex === undefined
                  ? 'bg-gray-100 text-gray-600'
                  : currentResult.isCorrect 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
              }`}>
                {currentResult.userSelectedIndex === null || currentResult.userSelectedIndex === undefined ? (
                  <MinusCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                ) : currentResult.isCorrect ? (
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                ) : (
                  <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                )}
                <span className="hidden sm:inline">
                  {currentResult.userSelectedIndex === null || currentResult.userSelectedIndex === undefined 
                    ? 'Omitted' 
                    : currentResult.isCorrect ? 'Correct' : 'Incorrect'
                  }
                </span>
              </div>
              
              {/* Hint Button */}
              {currentResult.userSelectedIndex !== null && currentResult.userSelectedIndex !== undefined && (
                <button
                  disabled={hintLoading}
                  className="flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 bg-yellow-100 text-yellow-700 rounded-full hover:bg-yellow-200 transition-colors text-[9px] sm:text-xs font-medium disabled:opacity-50"
                >
                  <Lightbulb className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">
                    {hintLoading ? 'Loading...' : 'Hint'}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Question */}
          <div className="p-3 sm:p-6">
            <p className="text-gray-800 text-xs sm:text-base leading-relaxed mb-4 sm:mb-6">
              {currentQuestion?.text || 'Question text not available'}
            </p>

            <p className="text-gray-800 text-xs sm:text-base leading-relaxed mb-4 sm:mb-6">
              {currentQuestion?.question || 'Question text not available'}
            </p>

            {/* Options */}
            <div className="space-y-2 sm:space-y-3">
              {currentQuestion?.options?.map((option, idx) => {
                const isCorrect = idx === currentResult.correctAnswerIndex;
                const isUserSelected = idx === currentResult.userSelectedIndex;
                const isOmitted = currentResult.userSelectedIndex === null || currentResult.userSelectedIndex === undefined;
                const showCorrectHighlight = isCorrect && !isOmitted && !currentResult.isCorrect;
                
                let optionStyle = 'border-gray-200 bg-white';
                let textStyle = 'text-gray-700';
                
                if (isOmitted && isCorrect) {
                  optionStyle = 'border-green-500 bg-green-50';
                  textStyle = 'text-green-900 font-medium';
                } else if (isUserSelected && currentResult.isCorrect) {
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
                        ${isUserSelected || (isOmitted && isCorrect) || showCorrectHighlight ? 'bg-white border-2' : 'bg-gray-100'}
                        ${isUserSelected && currentResult.isCorrect ? 'border-green-500 text-green-600' : ''}
                        ${isUserSelected && !currentResult.isCorrect ? 'border-red-500 text-red-600' : ''}
                        ${isOmitted && isCorrect ? 'border-green-500 text-green-600' : ''}
                        ${showCorrectHighlight ? 'border-green-500 text-green-600' : ''}
                        ${!isUserSelected && !showCorrectHighlight && !(isOmitted && isCorrect) ? 'text-gray-600' : ''}
                      `}>
                        {getOptionLetter(idx)}
                      </div>
                      <div className="flex-1">
                        <p className={`text-[11px] sm:text-sm ${textStyle}`}>
                          {option}
                        </p>
                      </div>
                      {(isUserSelected || (isOmitted && isCorrect) || showCorrectHighlight) && (
                        <div className="flex-shrink-0">
                          {(isUserSelected && currentResult.isCorrect) || (isOmitted && isCorrect) || showCorrectHighlight ? (
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

            {/* Hint Display */}
            {showHint && (
              <div className="mt-4 sm:mt-6 border border-yellow-200 bg-yellow-50 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-yellow-100 border-b border-yellow-200">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-700" />
                    <h4 className="text-xs sm:text-sm font-medium text-yellow-900">Detailed Hint</h4>
                  </div>
                  <button
                    onClick={closeHint}
                    className="p-1 hover:bg-yellow-200 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-yellow-700" />
                  </button>
                </div>
                
                <div className="p-3 sm:p-4 space-y-3">
                  {hintLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600"></div>
                    </div>
                  ) : hintData ? (
                    <>
                      {/* General Advice */}
                      {hintData.general_advice && (
                        <div className="bg-white rounded-lg p-3 border border-yellow-100">
                          <p className="text-xs sm:text-sm text-gray-700">{hintData.general_advice}</p>
                        </div>
                      )}
                      
                      {/* Option Analysis */}
                      <div className="space-y-2">
                        {['A', 'B', 'C', 'D'].map((letter) => {
                          const content = hintData[letter as keyof HintData];
                          if (!content) return null;
                          
                          const isExpanded = expandedHint === letter;
                          const optionIndex = letter.charCodeAt(0) - 65;
                          const isCorrect = optionIndex === currentResult.correctAnswerIndex;
                          const isUserSelected = optionIndex === currentResult.userSelectedIndex;
                          
                          let bgColor = 'bg-white';
                          let borderColor = 'border-gray-200';
                          let titleColor = 'text-gray-700';
                          
                          if (isUserSelected && currentResult.isCorrect) {
                            bgColor = 'bg-green-50';
                            borderColor = 'border-green-200';
                            titleColor = 'text-green-700';
                          } else if (isUserSelected && !currentResult.isCorrect) {
                            bgColor = 'bg-red-50';
                            borderColor = 'border-red-200';
                            titleColor = 'text-red-700';
                          } else if (isCorrect) {
                            bgColor = 'bg-blue-50';
                            borderColor = 'border-blue-200';
                            titleColor = 'text-blue-700';
                          }
                          
                          return (
                            <div 
                              key={letter}
                              className={`border rounded-lg ${borderColor} ${bgColor} overflow-hidden`}
                            >
                              <button
                                onClick={() => toggleHintSection(letter)}
                                className="w-full px-3 py-2 flex items-center justify-between hover:bg-opacity-50 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <span className={`font-medium text-xs sm:text-sm ${titleColor}`}>
                                    Option {letter}
                                  </span>
                                  {isCorrect && (
                                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                                  )}
                                  {isUserSelected && !currentResult.isCorrect && (
                                    <XCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] sm:text-xs text-gray-500">
                                    {isExpanded ? 'Hide' : 'Show'} explanation
                                  </span>
                                  {isExpanded ? (
                                    <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                                  ) : (
                                    <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                                  )}
                                </div>
                              </button>
                              
                              {isExpanded && (
                                <div className="px-3 pb-3">
                                  <p className="text-[10px] sm:text-xs text-gray-600 leading-relaxed">
                                    {content}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <p className="text-xs sm:text-sm text-gray-600">No hint available.</p>
                  )}
                </div>
              </div>
            )}
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
          <div className="grid grid-cols-4 gap-2 sm:gap-4">
            <div className="text-center">
              <div className="text-base sm:text-2xl font-bold text-green-600">{detail.stats.correctCount}</div>
              <div className="text-[9px] sm:text-xs text-gray-500">Correct</div>
            </div>
            <div className="text-center">
              <div className="text-base sm:text-2xl font-bold text-red-500">{detail.stats.incorrectCount}</div>
              <div className="text-[9px] sm:text-xs text-gray-500">Incorrect</div>
            </div>
            <div className="text-center">
              <div className="text-base sm:text-2xl font-bold text-gray-400">{omittedCount}</div>
              <div className="text-[9px] sm:text-xs text-gray-500">Omitted</div>
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