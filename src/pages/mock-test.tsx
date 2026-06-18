import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  FileText, Plus, Eye, Save, X, Edit2, ArrowLeft, Clock, 
  Target, Crown, Loader2, Search, Calendar, 
  Play, BookOpen, Trash2, CheckCircle, AlertCircle, User
} from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../states/user.state";

type Difficulty = 'easy' | 'medium' | 'hard';

interface Test {
  _id: string;
  title: string;
  category: string;
  timeLimit: number;
  difficulty: Difficulty;
  isGlobal: boolean;
  isOfficial: boolean;
  creatorId?: string;
  createdAt: string;
  questionCount: number;
}

interface ApiResponse {
  tests: Test[];
  total: number;
  page: number;
  limit: number;
}

interface MockTestProps {
  setView: (view: any) => void;
}

const MockTest = ({ setView }: MockTestProps) => {
  const navigate = useNavigate();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'all'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [testName, setTestName] = useState("");
  const [testText, setTestText] = useState("");
  const [answerKey, setAnswerKey] = useState("");
  const [testDifficulty, setTestDifficulty] = useState<Difficulty>('medium');
  const [selectedTime, setSelectedTime] = useState(60);
  const [preview, setPreview] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { user } = useUserStore()
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const { data } = await axios.get<ApiResponse>("/api/tests", {
        params: { isGlobal: true, category: "practice" }
      });
      setTests(data.tests);
    } catch (error) {
      toast.error("Failed to load tests");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this test?")) return;
    try {
      await axios.delete(`/api/tests/${id}`);
      setTests(tests.filter(t => t._id !== id));
      toast.success("Test deleted");
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const handleSave = async () => {
    if (!preview) return;
    setIsProcessing(true);
    try {
      const { data } = await axios.post("/api/tests", {
        ...preview.data,
        creatorId: user?._id,
        category: "practice",
        isGlobal: true,
        isOfficial: true
      });
      setTests([data, ...tests]);
      toast.success("Test saved!");
      setShowCreateForm(false);
      setPreview(null);
      setTestName("");
      setTestText("");
      setAnswerKey("");
    } catch (error: any) {
      toast.error(error.response?.data || "Failed to save");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartTest = (testId: string) => {
    navigate(`/testing/${testId}`);
  };

  const filteredTests = tests.filter(test => {
    const matchSearch = test.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDifficulty = selectedDifficulty === 'all' || test.difficulty === selectedDifficulty;
    return matchSearch && matchDifficulty;
  });

  const getDifficultyColor = (difficulty: Difficulty) => {
    const colors = { 
      easy: "bg-green-100 text-green-700", 
      medium: "bg-yellow-100 text-yellow-700", 
      hard: "bg-red-100 text-red-700" 
    };
    return colors[difficulty];
  };

  if (showCreateForm && isAdmin) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setShowCreateForm(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-2xl font-semibold text-gray-900">Create Practice Test</h1>
            </div>

            {!preview ? (
              <>
                <input 
                  type="text"
                  value={testName}
                  onChange={e => setTestName(e.target.value)}
                  placeholder="Test name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950 focus:border-transparent mb-4"
                />
                <textarea 
                  value={testText} 
                  onChange={e => setTestText(e.target.value)} 
                  className="w-full h-80 px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-950"
                  placeholder="1. Passage...&#10;&#10;*Question?*&#10;A) Option 1&#10;B) Option 2&#10;C) Option 3&#10;D) Option 4&#10;[CATEGORY: information-ideas]" 
                />
                <input 
                  type="text"
                  value={answerKey}
                  onChange={e => setAnswerKey(e.target.value)}
                  placeholder="Answer key (e.g., 1-B,2-C,3-A)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono mb-4 focus:outline-none focus:ring-2 focus:ring-blue-950"
                />
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <select 
                    value={testDifficulty} 
                    onChange={e => setTestDifficulty(e.target.value as Difficulty)} 
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setSelectedTime(Math.max(1, selectedTime-5))} className="w-8 h-8 border border-gray-300 rounded-lg hover:bg-gray-50">-</button>
                    <input type="number" value={selectedTime} onChange={e => setSelectedTime(Math.max(1, parseInt(e.target.value) || 0))} className="w-20 text-center border border-gray-300 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-blue-950" />
                    <button onClick={() => setSelectedTime(Math.min(180, selectedTime+5))} className="w-8 h-8 border border-gray-300 rounded-lg hover:bg-gray-50">+</button>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowCreateForm(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">Cancel</button>
                  <button onClick={() => {
                    if (!testName || !testText || !answerKey) return toast.error("Fill all fields");
                    setPreview({ data: { title: testName, timeLimit: selectedTime, difficulty: testDifficulty, questions: [], category: "practice", isGlobal: true, isOfficial: true } });
                  }} className="flex-[2] py-2 bg-blue-950 text-white rounded-lg hover:bg-blue-900 transition">Preview</button>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">{preview.data.title}</h2>
                  <button onClick={() => setPreview(null)} className="text-red-600 hover:text-red-700">Back</button>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setPreview(null)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Edit</button>
                  <button onClick={handleSave} disabled={isProcessing} className="flex-[2] py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Save</button>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setView('dashboard')} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Practice Tests</h1>
                <p className="text-sm text-gray-500">Official DSAT practice materials</p>
              </div>
            </div>
            {isAdmin && (
              <button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-950 text-white rounded-lg hover:bg-blue-900 transition shadow-sm">
                <Plus className="w-4 h-4" />
                Create New
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <p className="text-gray-500 text-sm mb-1">Total Tests</p>
            <p className="text-3xl font-bold text-gray-900">{tests.length}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <p className="text-gray-500 text-sm mb-1">Available</p>
            <p className="text-3xl font-bold text-gray-900">{filteredTests.length}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <p className="text-gray-500 text-sm mb-1">Official</p>
            <p className="text-3xl font-bold text-gray-900">{tests.filter(t => t.isOfficial).length}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search practice tests..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950 focus:border-transparent"
              />
            </div>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value as Difficulty | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-950" />
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900">No practice tests found</h3>
            <p className="text-gray-500 mt-1">Check back later for new materials</p>
            {isAdmin && (
              <button onClick={() => setShowCreateForm(true)} className="mt-4 px-4 py-2 bg-blue-950 text-white rounded-lg hover:bg-blue-900 transition">Create Test</button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTests.map((test) => (
              <motion.div
                key={test._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <FileText className="w-4 h-4 text-blue-950" />
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(test.difficulty)}`}>
                        {test.difficulty.toUpperCase()}
                      </span>
                    </div>
                    {test.isOfficial && (
                      <Crown className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {test.title}
                  </h3>
                  
                  <p className="text-sm text-gray-500 mb-4">
                    {test.questionCount || 0} questions • {test.timeLimit} minutes
                  </p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(test.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-2">
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(test._id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleStartTest(test._id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-950 text-white text-sm rounded-lg hover:bg-blue-900 transition"
                      >
                        <Play className="w-3 h-3" />
                        Start
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MockTest;