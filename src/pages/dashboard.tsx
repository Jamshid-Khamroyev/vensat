import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback, useMemo } from "react";
import { 
    Clock,
    Wand2,
    FileJson,
    Trash2,
    Edit2,
    RefreshCw,
    AlertCircle,
    ChevronRight,
    Globe,
    Lock,
    Filter
} from 'lucide-react';
import axios from 'axios';
import { categories } from "../constants";
import { useUserStore } from "../states/user.state";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

type DSATCategory = 
  | 'information-and-ideas' 
  | 'craft-and-structure' 
  | 'expression-of-ideas' 
  | 'standard-conventions';

type Difficulty = 'easy' | 'medium' | 'hard' | 'all';

interface CategoryTestsData {
  tests: any[];
  loading: boolean;
  error: string | null;
}

const Dashboard = () => {
  const navigate = useNavigate()
  const { user } = useUserStore()
  const [activeCategory, setActiveCategory] = useState<DSATCategory>('information-and-ideas');
  const [showGlobal, setShowGlobal] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('all');
  const [categoryData, setCategoryData] = useState<Record<DSATCategory, CategoryTestsData>>({
    'information-and-ideas': { tests: [], loading: false, error: null },
    'craft-and-structure': { tests: [], loading: false, error: null },
    'expression-of-ideas': { tests: [], loading: false, error: null },
    'standard-conventions': { tests: [], loading: false, error: null }
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const currentCategory = useMemo(() => 
    categories.find(c => c.id === activeCategory)!,
    [activeCategory]
  );

  const fetchTestsByCategory = useCallback(async (categoryId: DSATCategory) => {
    if (!user?._id) return;

    setCategoryData(prev => ({
      ...prev,
      [categoryId]: { ...prev[categoryId], loading: true, error: null }
    }));

    try {
      const params: any = {
        limit: 50,
        sort: '-createdAt'
      };

      // Agar showGlobal true bo'lsa, global testlarni olish
      if (showGlobal) {
        params.isGlobal = true;
        if (selectedDifficulty !== 'all') {
          params.difficulty = selectedDifficulty;
        }
      } else {
        // Aks holda foydalanuvchining shaxsiy testlarini olish
        params.userId = user._id;
        if (selectedDifficulty !== 'all') {
          params.difficulty = selectedDifficulty;
        }
      }

      // Kategoriya bo'yicha filter
      if (categoryId) params.category = categoryId;

      const response = await axios.get('/api/tests', { params });
      const testsData = response.data.tests || [];

      setCategoryData(prev => ({
        ...prev,
        [categoryId]: {
          tests: testsData,
          loading: false,
          error: null
        }
      }));

    } catch (error: any) {
      console.error(`Error fetching ${categoryId} tests:`, error);
      setCategoryData(prev => ({
        ...prev,
        [categoryId]: {
          ...prev[categoryId],
          loading: false,
          error: error.response?.data?.message || 'Failed to load tests'
        }
      }));
    }
  }, [user, showGlobal, selectedDifficulty]);

  const handleCategoryChange = (categoryId: DSATCategory) => {
    setActiveCategory(categoryId);
    // Har safar kategoriya o'zgarganda yangi ma'lumotlarni olish
    fetchTestsByCategory(categoryId);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchTestsByCategory(activeCategory);
    setIsRefreshing(false);
  };

  const handleGlobalToggle = () => {
    setShowGlobal(prev => !prev);
  };

  const handleDifficultyChange = (difficulty: Difficulty) => {
    setSelectedDifficulty(difficulty);
  };

  // showGlobal yoki selectedDifficulty o'zgarganda testlarni qayta yuklash
  useEffect(() => {
    if (user?._id && !isInitialLoad) {
      fetchTestsByCategory(activeCategory);
    }
  }, [showGlobal, selectedDifficulty]);

  // Initial load
  useEffect(() => {
    if (user?._id) {
      if (isInitialLoad) {
        setIsInitialLoad(false);
        fetchTestsByCategory(activeCategory);
      }
    }
  }, [user?._id]);

  const handleRenameTest = async (id: string, currentTitle: string) => {
    const newTitle = prompt("Enter new title:", currentTitle);
    if (!newTitle || newTitle === currentTitle) return;
    
    try {
      await axios.patch(`/api/tests/${id}`, { title: newTitle });
      const updatedTests = categoryData[activeCategory].tests.map(test => 
        test._id === id ? { ...test, title: newTitle } : test
      );
      setCategoryData(prev => ({
        ...prev,
        [activeCategory]: {
          ...prev[activeCategory],
          tests: updatedTests
        }
      }));
    } catch (e: any) {
      alert(e.response?.data?.message || "Rename failed.");
    }
  };

  const handleUpdateTimeLimit = async (id: string, currentTime: number) => {
    const newTime = prompt("Enter new time limit (minutes):", currentTime.toString());
    if (!newTime || Number(newTime) === currentTime) return;
    
    try {
      await axios.patch(`/api/tests/${id}`, { timeLimit: Number(newTime) });
      const updatedTests = categoryData[activeCategory].tests.map(test => 
        test._id === id ? { ...test, timeLimit: Number(newTime) } : test
      );
      setCategoryData(prev => ({
        ...prev,
        [activeCategory]: {
          ...prev[activeCategory],
          tests: updatedTests
        }
      }));
    } catch (e: any) {
      alert(e.response?.data?.message || "Update failed.");
    }
  };

  const handleDeleteTest = async (id: string) => {
    if (!confirm("Delete this test permanently?")) return;
    try {
      await axios.delete(`/api/tests/${id}`);
      const updatedTests = categoryData[activeCategory].tests.filter(test => test._id !== id);
      setCategoryData(prev => ({
        ...prev,
        [activeCategory]: {
          ...prev[activeCategory],
          tests: updatedTests
        }
      }));
    } catch (e: any) {
      alert(e.response?.data?.message || "Delete failed.");
    }
  };

  const currentData = categoryData[activeCategory];
  const activeCategoryConfig = currentCategory;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">SAT Preparation</h1>
              <p className="text-sm text-gray-500 mt-1">
                Welcome back, {user?.displayName?.split(' ')[0]}
              </p>
            </div>
            <div className="flex gap-2">
              {user?.role === 'admin' ? (
                <button 
                  onClick={() => navigate('/create')} 
                  className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 flex items-center gap-2 transition-all"
                >
                  <FileJson className="w-4 h-4" /> Import Questions
                </button>
              ) : (
                <button 
                  onClick={() => navigate('/words')} 
                  className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 flex items-center gap-2 transition-all shadow-sm"
                >
                  <Wand2 className="w-4 h-4" /> AI Generate
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-gray-200">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = activeCategory === category.id;
              const hasTests = categoryData[category.id].tests.length > 0;
              
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`
                    group relative px-5 py-2.5 text-sm font-medium transition-all duration-200
                    flex items-center gap-2 rounded-t-lg
                    ${isActive 
                      ? `${category.color} border-b-2 border-current bg-white` 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? category.color : 'text-gray-400'}`} />
                  <span className="hidden sm:inline">{category.name}</span>
                  <span className="sm:hidden">{category.shortName}</span>
                  {hasTests && !isActive && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Filters Bar with Switch */}
          <div className="flex flex-wrap items-center gap-4 mt-4 p-3 bg-white rounded-lg border border-gray-200">
            {/* Global Switch */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Lock className={`w-4 h-4 ${showGlobal ? 'text-gray-700' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${showGlobal ? 'text-gray-700' : 'text-gray-400'}`}>
                  My Tests
                </span>
              </div>
              
              <button
                onClick={handleGlobalToggle}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300
                  ${showGlobal ? 'bg-blue-950' : 'bg-gray-300'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300
                    ${showGlobal ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>

            {/* Mode Indicator */}
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
              <span className="text-xs text-gray-600">
                {showGlobal ? 'Global Tests' : 'My Tests'}
              </span>
            </div>

            {/* Difficulty Filter - Hamma holatda ham ko'rsatiladi */}
            <div className="flex items-center gap-2 ml-auto">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={selectedDifficulty}
                onChange={(e) => handleDifficultyChange(e.target.value as Difficulty)}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-950"
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || currentData.loading}
              className="p-2 text-gray-400 hover:text-gray-600 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Active Category Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeCategory}-${showGlobal}-${selectedDifficulty}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Category Info Bar */}
            <div className="flex items-center justify-between flex-wrap gap-3 py-3">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${activeCategoryConfig.bgColor}`}>
                  <activeCategoryConfig.icon className={`w-5 h-5 ${activeCategoryConfig.color}`} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    {activeCategoryConfig.name}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {showGlobal ? 'Global tests from all users' : 'Your personal tests'}
                    {selectedDifficulty !== 'all' && ` • ${selectedDifficulty}`}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {currentData.tests.length > 0 && (
                  <span className="text-xs text-gray-500">
                    {currentData.tests.filter(t => t.isGlobal).length > 0 && `🌍 ${currentData.tests.filter(t => t.isGlobal).length}`}
                    {currentData.tests.filter(t => !t.isGlobal).length > 0 && ` 🔒 ${currentData.tests.filter(t => !t.isGlobal).length}`}
                  </span>
                )}
              </div>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-xl border border-gray-200 min-h-[400px]">
              {currentData.loading && !currentData.tests.length ? (
                <div className="p-8 space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg animate-pulse">
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      </div>
                      <div className="h-8 w-24 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : currentData.error ? (
                <div className="p-12 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mb-4">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                  </div>
                  <p className="text-gray-600 mb-2">{currentData.error}</p>
                  <button
                    onClick={() => fetchTestsByCategory(activeCategory)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Try again →
                  </button>
                </div>
              ) : currentData.tests.length === 0 ? (
                <div className="p-12 text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${activeCategoryConfig.bgColor} mb-4`}>
                    <activeCategoryConfig.icon className={`w-8 h-8 ${activeCategoryConfig.color}`} />
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No tests found</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {showGlobal 
                      ? `No global ${activeCategoryConfig.name.toLowerCase()} tests available`
                      : `Create your first ${activeCategoryConfig.name.toLowerCase()} test`
                    }
                  </p>
                  {!showGlobal && (
                    <button
                      onClick={() => navigate('/words')}
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 transition-colors"
                    >
                      Generate with AI
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {currentData.tests.map((test) => (
                    <motion.div
                      key={test._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex md:items-center items-start justify-between flex-wrap gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="md:font-medium md:hidden text-sm! text-gray-800 truncate">
                              {test.title.slice(0, 18)}...
                            </h3>
                            <h3 className="md:font-medium max-md:hidden text-sm! text-gray-800 truncate">
                              {test.title}
                            </h3>
                            {test.difficulty && (
                              <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                                {test.difficulty}
                              </span>
                            )}
                            {test.isGlobal ? (
                              <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full flex items-center gap-1">
                                <Globe className="w-2.5 h-2.5" /> Global
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" /> Personal
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>{test?.questionCount || 0} questions</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                            <span>{test.timeLimit || 30} minutes</span>
                            {test.creatorId && !test.isGlobal && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                <span className="text-gray-400">by you</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {!test.isGlobal && (
                            <div className="md:opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              <button 
                                onClick={() => handleUpdateTimeLimit(test._id, test.timeLimit || 30)} 
                                className="md:p-1.5 p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-all"
                                title="Edit Time"
                              >
                                <Clock className="md:w-3.5 w-2.5 md:h-3.5 h-2.5" />
                              </button>
                              <button 
                                onClick={() => handleRenameTest(test._id, test.title)} 
                                className="md:p-1.5 p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-all"
                                title="Rename"
                              >
                                <Edit2 className="md:w-3.5 w-2.5 md:h-3.5 h-2.5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteTest(test._id)} 
                                className="md:p-1.5 p-0.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                                title="Delete"
                              >
                                <Trash2 className="md:w-3.5 w-2.5 md:h-3.5 h-2.5" />
                              </button>
                            </div>
                          )}
                          
                          <button 
                            onClick={() => navigate(`/testing/${test._id}`)} 
                            className={`md:px-4 px-2 md:py-1.5 py-1 rounded-lg md:text-sm text-xs font-medium transition-all flex items-center gap-1
                              ${activeCategoryConfig.bgColor} ${activeCategoryConfig.color} hover:opacity-80`}
                          >
                            Start <ChevronRight className="md:w-3.5 w-2.5 md:h-3.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Stats Bar */}
            {currentData.tests.length > 0 && (
              <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
                <span>Total: {currentData.tests.length} tests</span>
                <span>
                  Global: {currentData.tests.filter(t => t.isGlobal).length} | 
                  Personal: {currentData.tests.filter(t => !t.isGlobal).length}
                  {selectedDifficulty !== 'all' && ` | Filter: ${selectedDifficulty}`}
                </span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Dashboard;