// HistoryDetail.tsx
import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Target, Trophy, Clock, ChevronLeft, ChevronRight, Grid, X } from 'lucide-react';
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
  const [showGrid, setShowGrid] = useState(false);

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
    setShowGrid(false);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
              )}
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{detail.title}</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-100 rounded">
                    {detail.category}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(detail.completedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {detail.score}/{detail.total}
                </div>
                <div className="text-xs text-gray-500">Score</div>
              </div>
              <div className="w-px h-8 bg-gray-200"></div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{percentage.toFixed(0)}%</div>
                <div className="text-xs text-gray-500">Accuracy</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Question {currentIndex + 1} of {detail.total}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowGrid(!showGrid)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
              >
                <Grid className="w-3 h-3" />
                {showGrid ? 'Hide Grid' : 'Show Grid'}
              </button>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / detail.total) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Grid */}
        {showGrid && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-gray-700">Jump to Question</h3>
              <button onClick={() => setShowGrid(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-2">
              {detail.results.map((result, idx) => (
                <button
                  key={idx}
                  onClick={() => goToQuestion(idx)}
                  className={`
                    h-10 rounded-lg font-medium text-sm transition-all
                    ${currentIndex === idx 
                      ? 'ring-2 ring-blue-600 ring-offset-2 bg-blue-600 text-white' 
                      : result.isCorrect
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }
                  `}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-green-100 rounded"></div>
                <span className="text-xs text-gray-600">Correct</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-red-100 rounded"></div>
                <span className="text-xs text-gray-600">Incorrect</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-blue-600 rounded"></div>
                <span className="text-xs text-gray-600">Current</span>
              </div>
            </div>
          </div>
        )}

        {/* Question Card */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {/* Status Bar */}
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">
                Question {currentIndex + 1}
              </span>
              {currentQuestion?.difficulty && (
                <span className={`text-xs px-2 py-0.5 rounded capitalize ${
                  currentQuestion.difficulty === 'Easy' ? 'bg-green-50 text-green-700' :
                  currentQuestion.difficulty === 'Medium' ? 'bg-yellow-50 text-yellow-700' :
                  'bg-red-50 text-red-700'
                }`}>
                  {currentQuestion.difficulty}
                </span>
              )}
            </div>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              currentResult.isCorrect 
                ? 'bg-green-50 text-green-700' 
                : 'bg-red-50 text-red-700'
            }`}>
              {currentResult.isCorrect ? (
                <CheckCircle className="w-3.5 h-3.5" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}
              {currentResult.isCorrect ? 'Correct' : 'Incorrect'}
            </div>
          </div>

          {/* Question Text */}
          <div className="p-6">
            <p className="text-gray-800 leading-relaxed mb-6">
              {currentQuestion?.text || 'Question text not available'}
            </p>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion?.options?.map((option, idx) => {
                const isCorrect = idx === currentResult.correctAnswerIndex;
                const isUserSelected = idx === currentResult.userSelectedIndex;
                const showAsCorrect = isCorrect && !currentResult.isCorrect;
                
                let bgColor = '';
                let borderColor = 'border-gray-200';
                
                if (isUserSelected && currentResult.isCorrect) {
                  bgColor = 'bg-green-50';
                  borderColor = 'border-green-400';
                } else if (isUserSelected && !currentResult.isCorrect) {
                  bgColor = 'bg-red-50';
                  borderColor = 'border-red-400';
                } else if (showAsCorrect) {
                  bgColor = 'bg-green-50';
                  borderColor = 'border-green-400';
                }
                
                return (
                  <div
                    key={idx}
                    className={`border ${borderColor} rounded-lg p-3 ${bgColor} transition-all`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className={`
                          w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                          ${isUserSelected || showAsCorrect ? 'bg-white border-2' : 'bg-gray-100 text-gray-600'}
                          ${isUserSelected && currentResult.isCorrect ? 'border-green-500 text-green-600' : ''}
                          ${isUserSelected && !currentResult.isCorrect ? 'border-red-500 text-red-600' : ''}
                          ${showAsCorrect ? 'border-green-500 text-green-600' : ''}
                        `}>
                          {getOptionLetter(idx)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${(isUserSelected || showAsCorrect) ? 'font-medium' : 'text-gray-700'}`}>
                          {option}
                        </p>
                      </div>
                      {(isUserSelected || showAsCorrect) && (
                        <div className="flex-shrink-0">
                          {(isUserSelected && currentResult.isCorrect) || (showAsCorrect && !isUserSelected) ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : isUserSelected && !currentResult.isCorrect ? (
                            <XCircle className="w-5 h-5 text-red-600" />
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Explanation for incorrect answers */}
            {!currentResult.isCorrect && (
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xs text-blue-600 font-bold">i</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-blue-800">
                      <strong>Correct answer: {getOptionLetter(currentResult.correctAnswerIndex)}</strong>
                      {' — '}{currentQuestion?.options?.[currentResult.correctAnswerIndex]}
                    </p>
                    {currentResult.userSelectedIndex !== undefined && (
                      <p className="text-sm text-blue-800 mt-2">
                        Your answer: {getOptionLetter(currentResult.userSelectedIndex)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
            <button
              onClick={goToPrev}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <div className="text-sm text-gray-500 flex items-center">
              {currentIndex + 1} of {detail.total}
            </div>
            <button
              onClick={goToNext}
              disabled={currentIndex === detail.total - 1}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Summary Card */}
        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-yellow-600" />
            <h3 className="text-sm font-medium text-gray-900">Quick Summary</h3>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-green-600">{detail.stats.correctCount}</div>
              <div className="text-xs text-gray-500">Correct</div>
            </div>
            <div>
              <div className="text-xl font-bold text-red-600">{detail.stats.incorrectCount}</div>
              <div className="text-xs text-gray-500">Incorrect</div>
            </div>
            <div>
              <div className="text-xl font-bold text-blue-600">{detail.total}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryDetail;