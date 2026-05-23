import { motion, AnimatePresence } from "framer-motion";
import { Dispatch, SetStateAction, useEffect, useState, useCallback, useMemo } from "react";
import { 
    Clock,
    Wand2,
    FileJson,
    Trash2,
    Edit2,
    RefreshCw,
    AlertCircle,
    ChevronRight
  } from 'lucide-react';
import axios from 'axios';
import { categories } from "../constants";

interface DashboardProps {
  setView: (view: "landing" | "dashboard" | "create" | "testing" | "results" | "ai-gen" | "profile" | "words" | "stories" | "story-gen" | "story-reader" | "word-group" | "textbooks" | "mock-test" | "history" | "article" | "nytimes-story" | "springer-reader") => void;
  user: { _id: string; displayName: string; email: string } | null;
  fetchAll: (userId: string) => void;
  startTest: (id: string) => void;
}

// DSAT Categories
type DSATCategory = 
  | 'information-ideas' 
  | 'craft-structure' 
  | 'expression-ideas' 
  | 'standard-conventions';

interface CategoryTestsData {
  tests: any[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
}

const Dashboard = ({ startTest, user, setView, fetchAll }: DashboardProps) => {
  const [activeCategory, setActiveCategory] = useState<DSATCategory>('information-ideas');
  const [categoryData, setCategoryData] = useState<Record<DSATCategory, CategoryTestsData>>({
    'information-ideas': { tests: [], loading: false, error: null, lastFetched: null },
    'craft-structure': { tests: [], loading: false, error: null, lastFetched: null },
    'expression-ideas': { tests: [], loading: false, error: null, lastFetched: null },
    'standard-conventions': { tests: [], loading: false, error: null, lastFetched: null }
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Categories Configuration
  

  // Get current category config
  const currentCategory = useMemo(() => 
    categories.find(c => c.id === activeCategory)!,
    [activeCategory]
  );

  // Cache keys
  const getCacheKey = (categoryId: DSATCategory) => `sat_category_${categoryId}_${user?._id}`;
  const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  // Load from localStorage
  const loadFromCache = useCallback((categoryId: DSATCategory): CategoryTestsData | null => {
    if (!user) return null;
    
    try {
      const cached = localStorage.getItem(getCacheKey(categoryId));
      if (cached) {
        const parsed = JSON.parse(cached);
        const now = Date.now();
        
        if (parsed.lastFetched && (now - parsed.lastFetched) < CACHE_DURATION) {
          return {
            tests: parsed.tests || [],
            loading: false,
            error: null,
            lastFetched: parsed.lastFetched
          };
        }
      }
    } catch (error) {
      console.error('Cache read error:', error);
    }
    return null;
  }, [user]);

  // Save to cache
  const saveToCache = useCallback((categoryId: DSATCategory, data: CategoryTestsData) => {
    if (!user) return;
    
    try {
      const cacheData = {
        tests: data.tests,
        lastFetched: data.lastFetched,
        categoryId
      };
      localStorage.setItem(getCacheKey(categoryId), JSON.stringify(cacheData));
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }, [user]);

  // Fetch tests by category
  const fetchTestsByCategory = useCallback(async (categoryId: DSATCategory, forceRefresh: boolean = false) => {
    if (!user?._id) return;

    // Check cache first
    if (!forceRefresh) {
      const cachedData = loadFromCache(categoryId);
      if (cachedData && cachedData.tests.length > 0) {
        setCategoryData(prev => ({
          ...prev,
          [categoryId]: cachedData
        }));
        return;
      }
    }

    // Set loading state
    setCategoryData(prev => ({
      ...prev,
      [categoryId]: { ...prev[categoryId], loading: true, error: null }
    }));

    try {
      const response = await axios.get('/api/tests', {
        params: {
          userId: user._id,
          category: categoryId,
          limit: 50,
          sort: '-createdAt'
        }
      });

      const testsData = response.data.tests || [];
      const now = Date.now();

      const newCategoryData: CategoryTestsData = {
        tests: testsData,
        loading: false,
        error: null,
        lastFetched: now
      };

      setCategoryData(prev => ({
        ...prev,
        [categoryId]: newCategoryData
      }));

      saveToCache(categoryId, newCategoryData);

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
  }, [user, loadFromCache, saveToCache]);

  // Handle category change
  const handleCategoryChange = (categoryId: DSATCategory) => {
    setActiveCategory(categoryId);
    // Fetch if not loaded
    if (!categoryData[categoryId].tests.length && !categoryData[categoryId].loading) {
      fetchTestsByCategory(categoryId);
    }
  };

  // Refresh current category
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchTestsByCategory(activeCategory, true);
    setIsRefreshing(false);
  };

  // Initial load for active category
  useEffect(() => {
    if (user?._id && !categoryData[activeCategory].tests.length && !categoryData[activeCategory].loading) {
      fetchTestsByCategory(activeCategory);
    }
  }, [user?._id]);

  // API Functions
  const handleRenameTest = async (id: string, currentTitle: string) => {
    const newTitle = prompt("Enter new title:", currentTitle);
    if (!newTitle || newTitle === currentTitle) return;
    
    try {
      await axios.patch(`/api/tests/${id}`, { title: newTitle });
      
      // Update local state
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
      
      saveToCache(activeCategory, {
        ...categoryData[activeCategory],
        tests: updatedTests
      });
      
      if (user) fetchAll(user._id);
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
      
      saveToCache(activeCategory, {
        ...categoryData[activeCategory],
        tests: updatedTests
      });
      
      if (user) fetchAll(user._id);
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
      
      saveToCache(activeCategory, {
        ...categoryData[activeCategory],
        tests: updatedTests
      });
      
      if (user) fetchAll(user._id);
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
              <button 
                onClick={() => setView('create')} 
                className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 flex items-center gap-2 transition-all"
              >
                <FileJson className="w-4 h-4" /> Import
              </button>
              <button 
                onClick={() => setView('ai-gen')} 
                className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 flex items-center gap-2 transition-all shadow-sm"
              >
                <Wand2 className="w-4 h-4" /> AI Generate
              </button>
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
        </div>

        {/* Active Category Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
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
                  <p className="text-xs text-gray-500">{activeCategoryConfig.description}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {currentData.lastFetched && !currentData.loading && (
                  <span className="text-[10px] text-gray-400">
                    Updated {new Date(currentData.lastFetched).toLocaleTimeString()}
                  </span>
                )}
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing || currentData.loading}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-xl border border-gray-200 min-h-[400px]">
              {/* Loading State */}
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
              ) : 
              // Error State
              currentData.error ? (
                <div className="p-12 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mb-4">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                  </div>
                  <p className="text-gray-600 mb-2">{currentData.error}</p>
                  <button
                    onClick={() => fetchTestsByCategory(activeCategory, true)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Try again →
                  </button>
                </div>
              ) : 
              // Empty State
              currentData.tests.length === 0 ? (
                <div className="p-12 text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${activeCategoryConfig.bgColor} mb-4`}>
                    <activeCategoryConfig.icon className={`w-8 h-8 ${activeCategoryConfig.color}`} />
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No tests yet</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Create your first {activeCategoryConfig.name.toLowerCase()} test
                  </p>
                  <button
                    onClick={() => setView('ai-gen')}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 transition-colors"
                  >
                    Generate with AI
                  </button>
                </div>
              ) : 
              // Tests List
              <div className="divide-y divide-gray-100">
                {currentData.tests.map((test) => (
                  <motion.div
                    key={test._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="group p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex md:items-center items-start justify-between flex-wrap gap-3">
                      {/* Test Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="md:font-medium text-sm! text-gray-800 truncate">
                            {test.title}
                          </h3>
                          {test.difficulty && (
                            <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                              {test.difficulty}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{test?.question || 0} questions</span>
                          <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                          <span>{test.timeLimit || 30} minutes</span>
                          {test.lastAttempted && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                              <span>Last: {new Date(test.lastAttempted).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
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
                        
                        <button 
                          onClick={() => startTest(test._id)} 
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
            }
            </div>

            {/* Stats Bar */}
            {currentData.tests.length > 0 && (
              <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
                <span>Total: {currentData.tests.length} tests</span>
                <span>
                  Completed: {currentData.tests.filter(t => t.completed).length} | 
                  In Progress: {currentData.tests.filter(t => t.inProgress).length}
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