import { motion } from "framer-motion"
import { BrainCircuit, ChevronLeft, GraduationCap, Lightbulb, MessageSquare, RotateCcw, Send, TrendingUp, Target, Award, BarChart3, User, Mail, Clock } from "lucide-react";
import Markdown from "react-markdown";
import HistorySection from "../components/histories";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import api from "../services/api";

interface ProfileProps {
    setView: (view: "landing" | "dashboard" | "create" | "testing" | "results" | "ai-gen" | "profile" | "words" | "stories" | "story-gen" | "story-reader") => void;
    user: { displayName: string; email: string, _id: string } | null;
    chatMessages: { role: 'user' | 'model'; parts: { text: string }[] }[];
    setChatMessages: (messages: any[]) => void;
    chatInput: string;
    setHistoryId: Dispatch<SetStateAction<string>>
    setChatInput: (input: string) => void;
    isChatting: boolean;
    setIsChatting: (chatting: boolean) => void;
    handleSendMessage: () => void;
    chatScrollRef: React.RefObject<HTMLDivElement>;
}

// Category mapping for SAT sections
const skillCategories = {
    eoi_skill: { name: "Information & Ideas", icon: Lightbulb, color: "from-blue-400 to-cyan-400", description: "Reading comprehension & analysis" },
    sec_skill: { name: "Standard English", icon: MessageSquare, color: "from-indigo-400 to-blue-400", description: "Grammar & conventions" },
    iai_skill: { name: "Craft & Structure", icon: Target, color: "from-violet-400 to-purple-400", description: "Vocabulary & text structure" },
    cas_skill: { name: "Expression of Ideas", icon: TrendingUp, color: "from-sky-400 to-blue-400", description: "Effective writing & rhetoric" }
};

const Profile = ({ chatInput, chatMessages, chatScrollRef, handleSendMessage, setHistoryId, isChatting, setChatInput, setChatMessages, setView, user }: ProfileProps) => {
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getUser = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get(`/api/auth/me`, { headers: { Authorization: `Bearer ${localStorage.getItem('aero_token')}` }});
      setUserData(data.user);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    getUser();
  }, []);

  // Calculate average score
  const calculateAverageScore = () => {
    if (!userData) return 0;
    const skills = ['eoi_skill', 'sec_skill', 'iai_skill', 'cas_skill'];
    const total = skills.reduce((sum, skill) => sum + (userData[skill]?.score || 0), 0);
    return Math.round(total / skills.length);
  };

  // Loading Skeleton
  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="focus-mode space-y-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-10 h-10 bg-slate-100 rounded-full animate-pulse" />
          <div className="h-8 w-48 bg-slate-100 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bluebook-card p-8 bg-gradient-to-br from-blue-950 to-slate-900 border-none shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-slate-700 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-6 w-32 bg-slate-700 rounded animate-pulse" />
                  <div className="h-4 w-40 bg-slate-700/50 rounded animate-pulse" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-20 bg-slate-800/50 rounded-xl animate-pulse" />
                <div className="grid grid-cols-2 gap-3">
                  {[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-800/50 rounded-xl animate-pulse" />)}
                </div>
              </div>
            </div>
          </div>
          <div className="bluebook-card flex flex-col min-h-[500px] bg-slate-50 animate-pulse" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div key="profile" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="focus-mode space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <button onClick={() => setView('dashboard')} className="p-2 hover:bg-slate-100 rounded-full transition-all duration-200 hover:scale-105">
          <ChevronLeft className="w-5 h-5 text-slate-500" />
        </button>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <GraduationCap className="text-blue-600" /> Student Profile
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Profile & Stats */}
        <div className="space-y-6">
  <motion.div 
    initial={{ y: 20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.5 }}
    className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
  >
    {/* Profile Header */}
    <div className="p-6 pb-4 border-b border-slate-100">
      <div className="flex items-center gap-4">
        <img 
          src={`https://api.dicebear.com/7.x/initials/svg?seed=${userData?.displayName || user?.displayName}`} 
          className="w-12 h-12 rounded-full border border-slate-200" 
          referrerPolicy="no-referrer" 
        />
        <div>
          <h3 className="text-base font-semibold text-slate-800">
            {userData?.displayName || user?.displayName}
          </h3>
          <p className="text-xs text-slate-500">{userData?.email || user?.email}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Member since {new Date(userData?.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>

    {/* Overall Performance */}
    <div className="p-6 pb-4 border-b border-slate-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-700">Overall Performance</span>
        <span className="text-sm font-semibold text-slate-800">{calculateAverageScore()}%</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${calculateAverageScore()}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full bg-blue-950 rounded-full"
        />
      </div>
      <div className="flex justify-between mt-2">
        <p className="text-xs text-slate-500">Digital SAT Readiness</p>
        <p className="text-xs font-medium text-slate-600">{userData?.accuracy?.totalTestsTaken || 0} tests</p>
      </div>
    </div>

    {/* Domain Scores - Mapped with borders */}
    <div className="border-t-2 border-gray-400">
      {[
        { key: 'eoi_skill', name: 'Information and Ideas', description: 'Reading comprehension, main ideas, and supporting details' },
        { key: 'iai_skill', name: 'Craft and Structure', description: 'Vocabulary, text structure, and author\'s purpose' },
        { key: 'sec_skill', name: 'Standard English Conventions', description: 'Grammar, punctuation, and sentence structure' },
        { key: 'cas_skill', name: 'Expression of Ideas', description: 'Effective writing, transitions, and rhetoric' }
      ].map((domain, idx) => {
        const score = userData?.[domain.key]?.score || 0;
        const questions = userData?.[domain.key]?.questionTaken || 0;
        
        return (
          <motion.div
            key={domain.key}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`p-4 transition-colors duration-200 ${(idx+1)%2 === 0 ? "bg-slate-200" : ""}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-medium text-slate-800">{domain.name}</h4>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{score}%</span>
                </div>
                <p className="text-xs text-slate-500">{domain.description}</p>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 0.8, delay: idx * 0.05 }}
                className="h-full bg-blue-950 rounded-full"
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <p className="text-[11px] text-slate-400">{questions} questions attempted</p>
              <p className="text-[11px] font-medium text-slate-500">{score}% accuracy</p>
            </div>
          </motion.div>
        );
      })}
    </div>

          {/* Stats Summary - Clean grid with borders */}
          <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100 bg-slate-50/30">
            {[
              { label: 'Avg. Score', value: `${calculateAverageScore()}%`, icon: TrendingUp, color: 'text-blue-600' },
              { label: 'Total Questions', value: Object.values(userData || {}).reduce((total: number, skill: any) => {
                  if (skill?.questionTaken) return total + skill.questionTaken;
                  return total;
                }, 0), icon: BarChart3, color: 'text-emerald-600' },
              { label: 'Tests Taken', value: userData?.accuracy?.totalTestsTaken || 0, icon: Target, color: 'text-purple-600' }
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="p-4 text-center hover:bg-slate-50/50 transition-colors duration-200">
                  <div className="flex justify-center mb-2">
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <p className="text-lg font-semibold text-slate-800">{stat.value}</p>
                  <p className="text-[11px] text-slate-500 uppercase tracking-wide">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

        {/* Chatbot Section - Enhanced */}
        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bluebook-card flex flex-col min-h-[500px] max-h-[600px] overflow-hidden shadow-2xl relative"
        >
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white shadow-md">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black tracking-tight">AeroBot AI</h4>
                <div className="flex items-center gap-1">
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-1.5 h-1.5 rounded-full bg-green-500" 
                  />
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Online Coach</span>
                </div>
              </div>
            </div>
            <motion.button 
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
              onClick={() => setChatMessages([])} 
              className="p-2 hover:bg-slate-100 rounded-full text-slate-300 hover:text-slate-500 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </motion.button>
          </div>

          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-50 to-white no-scrollbar">
            {chatMessages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center"
                >
                  <MessageSquare className="text-slate-300" />
                </motion.div>
                <p className="text-xs text-slate-400 font-medium max-w-[200px] mx-auto leading-relaxed">
                  Ask me about SAT strategies, formulas, or grammar rules. I'm here to help you ace your test! 🚀
                </p>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[90%] p-4 rounded-2xl text-sm shadow-md leading-relaxed ${msg.role === 'user' ? 'bg-blue-950 text-white rounded-br-none' : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'}`}>
                  <div className="markdown-body">
                    <Markdown>{msg.parts[0].text}</Markdown>
                  </div>
                </div>
              </motion.div>
            ))}
            {isChatting && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-2xl flex gap-1 items-center shadow-sm">
                  <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.5, repeat: Infinity }} className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                  <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }} className="w-1.5 h-1.5 bg-slate-500 rounded-full" />
                  <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t border-slate-100">
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2">
              <input 
                value={chatInput} 
                onChange={e => setChatInput(e.target.value)} 
                placeholder="Type a message..." 
                className="flex-1 bluebook-input !py-2.5 bg-slate-50 border-none px-4 transition-all" 
              />
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit" 
                disabled={!chatInput.trim() || isChatting} 
                className="p-2.5 bg-blue-950 text-white rounded-lg hover:bg-blue-900 disabled:opacity-50 transition-all shadow-md"
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>

      <HistorySection userId={user?._id} setView={setView} setHistoryId={setHistoryId}/>
    </motion.div>
  )
}

export default Profile