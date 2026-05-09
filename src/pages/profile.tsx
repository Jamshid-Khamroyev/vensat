import { motion } from "framer-motion"
import { BrainCircuit, ChevronLeft, Clock, Edit2, GraduationCap, Lightbulb, MessageSquare, RotateCcw, Send, Sparkles, Trash2 } from "lucide-react";
import Markdown from "react-markdown";
import { SessionRecord } from "../types";

interface ProfileProps {
    setView: (view: "landing" | "dashboard" | "create" | "testing" | "results" | "ai-gen" | "profile" | "words" | "stories" | "story-gen" | "story-reader") => void;
    user: { displayName: string; email: string, _id: string } | null;
    dbSessions: SessionRecord[];
    chatMessages: { role: 'user' | 'model'; parts: { text: string }[] }[];
    setChatMessages: (messages: any[]) => void;
    chatInput: string;
    setChatInput: (input: string) => void;
    isChatting: boolean;
    setIsChatting: (chatting: boolean) => void;
    handleSendMessage: () => void;
    chatScrollRef: React.RefObject<HTMLDivElement>;
    fetchAll: (userId: string) => void;
}

const Profile = ({ chatInput, chatMessages, chatScrollRef,  dbSessions, handleSendMessage, isChatting, setChatInput, setChatMessages, setView, user, fetchAll }: ProfileProps) => {
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
    <motion.div key="profile" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="focus-mode space-y-6">
              <div className="flex items-center gap-4 mb-2">
                 <button onClick={() => setView('dashboard')} className="p-2 hover:bg-white rounded-full bg-slate-100 text-slate-500"><ChevronLeft className="w-5 h-5" /></button>
                 <h2 className="text-2xl font-bold flex items-center gap-2"><GraduationCap className="text-blue-600" /> Student Profile</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  {/* Stats & Identity */}
                  <div className="bluebook-card p-8 bg-gradient-to-br from-bluebook-navy to-slate-900 text-white border-none shadow-xl">
                    <div className="flex items-center gap-4 mb-6">
                       <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.displayName}`} className="w-16 h-16 rounded-full border-2 border-blue-400 shadow-lg p-0.5 bg-white" referrerPolicy="no-referrer" />
                       <div>
                          <h3 className="text-xl font-black">{user?.displayName}</h3>
                          <p className="text-blue-300 text-sm font-medium">{user?.email.slice(0, 15)}...</p>
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-white/10 p-4 rounded-xl border border-white/10">
                          <div className="text-2xl font-black">{dbSessions.length}</div>
                          <div className="text-[10px] uppercase font-bold text-blue-300 tracking-tighter">Total Sessions</div>
                       </div>
                       <div className="bg-white/10 p-4 rounded-xl border border-white/10">
                          <div className="text-2xl font-black">{Math.round(dbSessions.reduce((acc, s) => acc + s.score, 0) / (dbSessions.reduce((acc, s) => acc + (s.total || 10), 0) || 1) * 100) || 0}%</div>
                          <div className="text-[10px] uppercase font-bold text-blue-300 tracking-tighter">Avg Mastery</div>
                       </div>
                    </div>
                  </div>

                  {/* Study Tips */}
                  <div className="bluebook-card md:p-6 p-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Lightbulb className="w-4 h-4 text-amber-400" /> Performance Tips</h3>
                      <span className="text-[9px] font-bold text-slate-300 uppercase">Live Analysis</span>
                    </div>
                    <div className="space-y-4">
                       {(() => {
                         if (dbSessions.length === 0) return (
                            <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-400 italic">Complete at least one session to see AI insights.</div>
                         );
                         const avgScore = dbSessions.reduce((acc, s) => acc + (s.score / (s.total || 1)), 0) / dbSessions.length;
                         const tips = [];
                         if (avgScore < 0.6) tips.push({ icon: <GraduationCap className="w-4 h-4 text-amber-500" />, tip: "Review core foundations. Focus on one category at a time to build confidence." });
                         else if (avgScore < 0.85) tips.push({ icon: <BrainCircuit className="w-4 h-4 text-blue-500" />, tip: "Solid accuracy! Use the 'Eliminate' tool more aggressively to narrow down trick questions." });
                         else tips.push({ icon: <Sparkles className="w-4 h-4 text-green-500" />, tip: "Excellent mastery. Focus on full-length mock exams to build mental stamina." });

                         const avgTime = dbSessions.reduce((acc, s) => acc + (s.endTime && s.startTime ? (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) : 0), 0) / dbSessions.length / 60000;
                         if (avgTime > 15) tips.push({ icon: <Clock  className="w-4 h-4 text-red-500" />, tip: "Pacing Alert: You are spending significant time per module. Try 20-minute timed sets." });

                         return tips.map((t, idx) => (
                           <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm flex gap-4 items-start shadow-sm hover:shadow-md transition-all">
                              <span className="p-2 bg-white rounded-lg shadow-inner">{t.icon}</span>
                              <p className="text-slate-600 leading-relaxed font-medium">{t.tip}</p>
                           </div>
                         ));
                       })()}
                    </div>
                  </div>
                </div>

                {/* Chatbot */}
                <div className="bluebook-card flex flex-col min-h-[500px] max-h-[600px] overflow-hidden shadow-2xl relative">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white"><BrainCircuit className="w-4 h-4" /></div>
                       <div>
                          <h4 className="text-sm font-black tracking-tight">AeroBot AI</h4>
                          <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /> <span className="text-[10px] text-slate-400 font-bold uppercase">Online Coach</span></div>
                       </div>
                    </div>
                    <button onClick={() => setChatMessages([])} className="p-2 hover:bg-slate-100 rounded text-slate-300 hover:text-slate-500 transition-colors"><RotateCcw className="w-4 h-4" /></button>
                  </div>

                  <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 no-scrollbar">
                    {chatMessages.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                         <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center"><MessageSquare className="text-slate-200" /></div>
                         <p className="text-xs text-slate-400 font-medium max-w-[200px] mx-auto leading-relaxed">Ask me about SAT strategies, formulas, or grammar rules.</p>
                      </div>
                    )}
                    {chatMessages.map((msg, i) => (
                       <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                          <div className={`max-w-[90%] p-4 rounded-2xl text-sm shadow-md leading-relaxed ${msg.role === 'user' ? 'bg-bluebook-navy text-white rounded-br-none' : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'}`}>
                            <div className="markdown-body">
                              <Markdown>{msg.parts[0].text}</Markdown>
                            </div>
                          </div>
                       </div>
                    ))}
                    {isChatting && (
                      <div className="flex justify-start">
                        <div className="bg-white p-3 rounded-2xl flex gap-1 items-center shadow-sm">
                           <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                           <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                           <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-white border-t border-slate-100">
                    <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2">
                       <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type a message..." className="flex-1 bluebook-input !py-2.5 bg-slate-50 border-none px-4" />
                       <button type="submit" disabled={!chatInput.trim() || isChatting} className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md"><Send className="w-5 h-5" /></button>
                    </form>
                  </div>
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
            </motion.div>
  )
}

export default Profile