// HistorySection.tsx
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, XCircle, BookOpen, Calendar, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

interface HistorySectionProps {
  userId: string;
}

const HistorySection = ({ userId }: HistorySectionProps) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
  }, [userId, currentPage]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/history/${userId}?page=${currentPage}&limit=10`);
      const data: HistoryResponse = await res.json();
      setHistory(data.history);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Test History</h1>
          <p className="text-gray-500 text-sm mt-1">Your completed tests</p>
        </div>

        {/* History Cards */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-600">No tests found</h3>
            <p className="text-gray-400 text-sm mt-1">Complete some tests to see your history</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item, index) => {
              const percentage = (item.score / item.total) * 100;
              const scoreColor = getScoreColor(percentage);
              const date = new Date(item.completedAt);
              
              return (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => navigate(`/history/${item._id}`)}
                  className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer transition-all duration-200 hover:border-gray-300 hover:shadow-sm"
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Left side - Test Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <h3 className="font-medium text-gray-900 truncate">{item.title}</h3>
                      </div>
                      
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-100 rounded">
                          {item.category}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Calendar className="w-3 h-3" />
                          {date.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {date.toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Right side - Score */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <div className={`text-xl font-bold ${scoreColor}`}>
                          {item.score}/{item.total}
                        </div>
                        <div className="text-xs text-gray-400">{percentage.toFixed(0)}%</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.5, delay: index * 0.05 }}
                        className={`h-full rounded-full ${
                          percentage >= 80 ? 'bg-green-500' :
                          percentage >= 60 ? 'bg-blue-500' :
                          percentage >= 40 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-md border border-gray-200 text-sm text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 text-sm text-gray-600">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-md border border-gray-200 text-sm text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistorySection;