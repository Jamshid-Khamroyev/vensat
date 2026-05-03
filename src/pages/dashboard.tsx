import { motion } from "framer-motion";
import { Dispatch, SetStateAction } from "react";
import { 
    Clock,
    Wand2,
    FileJson,
    LayoutGrid,
    Trash2,
    Edit2,
    User as UserIcon
  } from 'lucide-react';

interface DashboardProps {
        setView: Dispatch<SetStateAction<"landing" | "dashboard" | "create" | "testing" | "results" | "ai-gen" | "profile" | "words" | "stories" | "story-gen" | "story-reader">>
        user: { _id: string; displayName: string; email: string } | null;
        dbTests: any[];
        dbSessions: any[];
        fetchAll: (userId: string) => void;
        startTest: (test: any) => void;
}

const Dashboard = ({
    dbSessions, dbTests, startTest, user, setView, fetchAll
 }: DashboardProps) => {

  const handleRenameTest = async (id: string, currentTitle: string) => {
    const newTitle = prompt("Enter new title:", currentTitle);
    if (!newTitle || newTitle === currentTitle) return;
    try {
      await fetch(`/api/tests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle })
      });
      if (user) fetchAll(user._id);
    } catch (e) { alert("Rename failed."); }
  };

  const handleUpdateTimeLimit = async (id: string, currentTime: number) => {
    const newTime = prompt("Enter new time limit (minutes):", currentTime.toString());
    if (!newTime || Number(newTime) === currentTime) return;
    try {
      await fetch(`/api/tests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeLimit: Number(newTime) })
      });
      if (user) fetchAll(user._id);
    } catch (e) { alert("Update failed."); }
  };

  const handleDeleteTest = async (id: string) => {
    if (!confirm("Delete this test permanently?")) return;
    try {
      await fetch(`/api/tests/${id}`, { method: "DELETE" });
      if (user) fetchAll(user._id);
    } catch (e) { alert("Delete failed."); }
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm("Delete this history record?")) return;
    try {
      await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      if (user) fetchAll(user._id);
    } catch (e) { alert("Delete failed."); }
  };

  const handleRenameSession = async (id: string, currentTitle: string) => {
    const newTitle = prompt("Rename session record:", currentTitle || "Test Session");
    if (!newTitle || newTitle === currentTitle) return;
    try {
      await fetch(`/api/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle })
      });
      if (user) fetchAll(user._id);
    } catch (e) { alert("Rename failed."); }
  };

  return (
    <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} 
              className="focus-mode space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold">Good Day, {user?.displayName?.split(' ')[0]}</h2>
                  <p className="text-slate-500 text-sm">Your testing centralized center.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setView('create')} className="bluebook-button !bg-white !text-bluebook-navy border border-bluebook-border flex items-center gap-2 shadow-sm"><FileJson className="w-4 h-4" /> Import</button>
                  <button onClick={() => setView('ai-gen')} className="bluebook-button flex items-center gap-2 shadow-md"><Wand2 className="w-4 h-4" /> AI Generate</button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400"><LayoutGrid className="w-4 h-4" /> Library</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {dbTests.length === 0 ? (
                      <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">Library is empty. Create your first test.</div>
                    ) : (
                      dbTests.map((t) => (
                        <div key={t._id} className="bg-white border border-slate-200 md:rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 group">
                          <div className="p-2 sm:p-5 relative">
                            <div className="absolute hidden top-3 group-hover:block right-3 flex gap-1 z-10">
                              <button onClick={(e) => { e.stopPropagation(); handleUpdateTimeLimit(t._id, t.timeLimit || 30); }} className="p-1 bg-slate-50 border border-slate-200 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-500 transition-all shadow-sm" title="Edit Time"><Clock className="w-3 h-3" /></button>
                              <button onClick={(e) => { e.stopPropagation(); handleRenameTest(t._id, t.title); }} className="p-1 bg-slate-50 border border-slate-200 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-all shadow-sm" title="Rename"><Edit2 className="w-3 h-3" /></button>
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteTest(t._id); }} className="p-1 bg-slate-50 border border-slate-200 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all shadow-sm" title="Delete"><Trash2 className="w-3 h-3" /></button>
                            </div>
                            <div className="mb-4">
                              <h4 className="text-sm sm:text-base mb-1 mb-2 text-slate-800">{t.title}</h4>
                              <div className="flex items-center gap-3 border-t py-2 border-gray-400">
                                <span className="text-[10px] text-slate-900 uppercase tracking-widest font-semibold">{t.questions.length} Question</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                                <span className="text-[10px] text-slate-900 uppercase tracking-widest font-semibold">{t.timeLimit || 30} Daqiqa</span>
                              </div>
                            </div>
                            <button onClick={() => startTest(t as any)} className="w-full py-2 bg-slate-900 text-white hover:bg-blue-600 rounded-lg font-black text-[10px] transition-all uppercase tracking-widest">Start Session</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400"><Clock className="w-4 h-4" /> History</div>
                  <div className="bluebook-card p-4 space-y-3 h-[400px] overflow-y-auto no-scrollbar">
                    {dbSessions.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-400 italic text-sm">No activity recorded.</div>
                    ) : (
                      dbSessions.map((s, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-100 group transition-all duration-200 shadow-sm hover:shadow-md">
                          <div className="min-w-0 pr-2">
                            <div className="font-bold text-[11px] sm:text-xs truncate flex items-center gap-1 text-slate-700">
                              <span className="truncate">{s.title || "Test Session"}</span>
                              <div className="flex gap-0.5 ml-auto sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleRenameSession(s._id, s.title)} className="p-0.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded transition-all"><Edit2 className="w-2.5 h-2.5" /></button>
                                <button onClick={() => handleDeleteSession(s._id)} className="p-0.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-all"><Trash2 className="w-2.5 h-2.5" /></button>
                              </div>
                            </div>
                            <div className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-tight mt-0.5">{new Date(s.startTime).toLocaleDateString()}</div>
                          </div>
                          <div className="flex-shrink-0">
                            <div className="px-2 py-1 bg-blue-50/50 rounded-lg border border-blue-100/50 text-[10px] font-black text-blue-600">
                              {Math.round(((s.score || 0) / (s.total || 1)) * 100)}%
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
  )
}

export default Dashboard