// HistorySection.tsx
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, XCircle, BookOpen, TrendingUp, Calendar, ChevronRight, Award, Target } from 'lucide-react';

interface HistoryItem {
  _id: string;
  title: string;
  category: string;
  score: number;
  total: number;
  completedAt: string;
  results: Array<{
    questionId: string;
    isCorrect: boolean;
    correctAnswerIndex: number;
    userSelectedIndex: number;
  }>;
}

interface HistoryResponse {
  history: HistoryItem[];
  total: number;
  page: number;
  totalPages: number;
}

const HistorySection = ({ userId }: { userId: string }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [userId, selectedCategory, currentPage]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/history/${userId}?page=${currentPage}&limit=10&category=${selectedCategory}`);
      const data: HistoryResponse = await res.json();
      setHistory(data.history);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', 'Math', 'Reading', 'Writing', 'Vocab'];

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-50 border-green-200';
    if (percentage >= 60) return 'bg-blue-50 border-blue-200';
    if (percentage >= 40) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-950 flex items-center gap-3">
            <Award className="w-8 h-8 text-blue-900" />
            Test History
          </h1>
          <p className="text-slate-500 mt-2">Track your progress and performance</p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedCategory === cat
                  ? 'bg-blue-950 text-white shadow-lg'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* History Cards */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600">No tests found</h3>
            <p className="text-slate-400 mt-2">Complete some tests to see your history</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item, index) => {
              const percentage = (item.score / item.total) * 100;
              const scoreColor = getScoreColor(percentage);
              const bgColor = getScoreBgColor(percentage);
              const date = new Date(item.completedAt);
              
              return (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl border border-slate-200 hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <div 
                    className="p-6 cursor-pointer"
                    onClick={() => setExpandedId(expandedId === item._id ? null : item._id)}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Left side - Test Info */}
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <BookOpen className="w-5 h-5 text-blue-950" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-blue-950">{item.title}</h3>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-slate-500 px-2 py-1 bg-slate-100 rounded-full">
                                {item.category}
                              </span>
                              <div className="flex items-center gap-1 text-xs text-slate-500">
                                <Calendar className="w-3 h-3" />
                                {date.toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-slate-500">
                                <Clock className="w-3 h-3" />
                                {date.toLocaleTimeString('en-US', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right side - Score */}
                      <div className={`flex items-center gap-6 px-4 py-3 rounded-xl ${bgColor}`}>
                        <div className="text-center">
                          <div className={`text-3xl font-bold ${scoreColor}`}>
                            {item.score}/{item.total}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">Score</div>
                        </div>
                        <div className="w-px h-10 bg-slate-200" />
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${scoreColor}`}>
                            {percentage.toFixed(0)}%
                          </div>
                          <div className="text-xs text-slate-500 mt-1">Percentage</div>
                        </div>
                        <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                          expandedId === item._id ? 'rotate-90' : ''
                        }`} />
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.8, delay: index * 0.1 }}
                          className={`h-full rounded-full ${
                            percentage >= 80 ? 'bg-green-500' :
                            percentage >= 60 ? 'bg-blue-500' :
                            percentage >= 40 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedId === item._id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-100 bg-slate-50/50 p-6"
                    >
                      <h4 className="font-semibold text-blue-950 mb-4 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Question Analysis
                      </h4>
                      <div className="grid gap-3">
                        {item.results.map((result, idx) => (
                          <div
                            key={result.questionId}
                            className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-slate-500">
                                Question {idx + 1}
                              </span>
                              {result.isCorrect ? (
                                <div className="flex items-center gap-1 text-green-600">
                                  <CheckCircle className="w-4 h-4" />
                                  <span className="text-xs font-medium">Correct</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-red-600">
                                  <XCircle className="w-4 h-4" />
                                  <span className="text-xs font-medium">Incorrect</span>
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-slate-400">
                              Answer: {String.fromCharCode(65 + result.correctAnswerIndex)}
                              {result.userSelectedIndex !== null && (
                                <span className="ml-2">
                                  (Your: {String.fromCharCode(65 + result.userSelectedIndex)})
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-slate-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
            >
              Next
            </button>
          </div>
        )}

        {/* Stats Summary */}
        {history.length > 0 && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-950 to-blue-900 rounded-2xl p-6 text-white">
              <TrendingUp className="w-8 h-8 mb-3 opacity-80" />
              <div className="text-2xl font-bold">
                {(history.reduce((acc, h) => acc + (h.score / h.total), 0) / history.length * 100).toFixed(0)}%
              </div>
              <div className="text-sm opacity-80 mt-1">Average Score</div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <Award className="w-8 h-8 mb-3 text-blue-950" />
              <div className="text-2xl font-bold text-blue-950">
                {history.length}
              </div>
              <div className="text-sm text-slate-500 mt-1">Total Tests</div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <CheckCircle className="w-8 h-8 mb-3 text-green-600" />
              <div className="text-2xl font-bold text-green-600">
                {history.reduce((acc, h) => acc + h.score, 0)}
              </div>
              <div className="text-sm text-slate-500 mt-1">Correct Answers</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistorySection;