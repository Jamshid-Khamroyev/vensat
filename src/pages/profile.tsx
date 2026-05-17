import { motion } from "framer-motion"
import { BrainCircuit, ChevronLeft, GraduationCap, Lightbulb, MessageSquare, RotateCcw, Send } from "lucide-react";
import Markdown from "react-markdown";
import HistorySection from "../components/histories";
import { Dispatch, SetStateAction } from "react";

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

const Profile = ({ chatInput, chatMessages, chatScrollRef, handleSendMessage, setHistoryId, isChatting, setChatInput, setChatMessages, setView, user }: ProfileProps) => {

  return (
    <motion.div key="profile" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="focus-mode space-y-6">
              <div className="flex items-center gap-4 mb-2">
                 <button onClick={() => setView('dashboard')} className="p-2 hover:bg-white rounded-full bg-slate-100 text-slate-500"><ChevronLeft className="w-5 h-5" /></button>
                 <h2 className="text-2xl font-bold flex items-center gap-2"><GraduationCap className="text-blue-600" /> Student Profile</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="bluebook-card p-8 bg-gradient-to-br from-bluebook-navy to-slate-900 text-white border-none shadow-xl">
                    <div className="flex items-center gap-4 mb-6">
                       <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.displayName}`} className="w-16 h-16 rounded-full border-2 border-blue-400 shadow-lg p-0.5 bg-white" referrerPolicy="no-referrer" />
                       <div>
                          <h3 className="text-xl font-black">{user?.displayName}</h3>
                          <p className="text-blue-300 text-sm font-medium">{user?.email?.slice(0, 15)}...</p>
                       </div>
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

              <HistorySection userId={user._id} setView={setView} setHistoryId={setHistoryId}/>
            </motion.div>
  )
}

export default Profile  