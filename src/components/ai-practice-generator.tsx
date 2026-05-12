import {motion} from 'framer-motion';
import { BrainCircuit, CheckCircle, Clock, PlusCircle, RotateCcw, Wand2, X } from "lucide-react"
import { generateSATTest, generateWordsTest } from '../services/geminiService';
import axios from '../services/api';
import { GroupWord } from '../types';
import { group } from 'console';
import { useState } from 'react';

interface AiPracticeGeneratorProps {
    setView: (view: "landing" | "dashboard" | "create" | "testing" | "results" | "ai-gen" | "profile" | "words" | "stories" | "story-gen" | "story-reader") => void;
    selectedTime: number;
    setSelectedTime: (time: number) => void;
    isProcessing: boolean;
    setIsProcessing: (processing: boolean) => void;
    user: { _id: string; displayName: string; email: string } | null;
    dbTests: any[];
    setDbTests: (tests: any[]) => void;
    userWords: GroupWord[];
    startTest: (test: any) => void;
}

const AiPracticeGenerator = ({ 
    selectedTime, setSelectedTime,setView, userWords, isProcessing, setIsProcessing, user, dbTests, setDbTests, startTest
}: AiPracticeGeneratorProps) => {
   const [genOptions, setGenOptions] = useState<{ category: string, difficulty: string, count: number, words?: string }>({
      category: 'Reading & Writing: Information & Ideas',
      difficulty: 'Medium',
      count: 10,
      words: ''
  });
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

    const handleAIGen = async (options: { type: 'sat' | 'words', value: string, count: number, difficulty?: string, category?: string }) => {
        setIsProcessing(true);
        const usedWords = userWords.filter(group => group._id === selectedGroupId).map(group => group.words.map(word => word.term).join(",")).join(",");
        try {
          let parsed;
          if (options.type === 'sat') {
            parsed = await generateSATTest(options.value, options.difficulty || 'Medium', options.count, usedWords);
          } else {
            parsed = await generateWordsTest(options.category || 'General', usedWords, options.count);
          }
          const res = await axios.post("/api/tests", {
            ...parsed, 
            creatorId: user?._id, 
            timeLimit: selectedTime 
          });
          const saved = res.data;
          setDbTests([saved, ...dbTests]);
          startTest(parsed);
        } catch (e) { alert("Generation failed."); }
        finally { setIsProcessing(false); }
    }

  return (
    <motion.div key="ai-gen" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="focus-mode max-w-2xl">
              <div className="bluebook-card p-6 sm:p-8 space-y-8">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold flex items-center gap-2 tracking-tight"><BrainCircuit className="text-blue-600 w-7 h-7" /> Aero AI Generator</h2>
                    <p className="text-sm text-slate-500">Crafting high-rigor SAT modules instantly.</p>
                  </div>
                  <button onClick={() => setView('dashboard')} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all"><X className="w-5 h-5" /></button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">Test Type & Category</label>
                       <select 
                         value={genOptions.category} 
                         onChange={e => setGenOptions({...genOptions, category: e.target.value})} 
                         className="bluebook-input !py-3 bg-slate-50 appearance-none text-xs font-bold"
                       >
                          <optgroup label="DSAT Sections">
                            <option>Reading & Writing: Craft & Structure</option>
                            <option>Reading & Writing: Information & Ideas</option>
                            <option>Reading & Writing: Standard English Conventions</option>
                            <option>Reading & Writing: Expression of Ideas</option>
                          </optgroup>
                          <optgroup label="Vocabulary Focus">
                            <option value="Vocabulary: Science & Tech">Vocabulary: Science & Tech</option>
                            <option value="Vocabulary: Literature & Arts">Vocabulary: Literature & Arts</option>
                            <option value="Vocabulary: History & Social Studies">Vocabulary: History & Social Studies</option>
                          </optgroup>
                       </select>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">Complexity</label>
                       <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
                         {['Easy', 'Medium', 'Hard'].map(lvl => (
                           <button key={lvl} onClick={() => setGenOptions({...genOptions, difficulty: lvl})} className={`flex-1 py-2 text-[10px] font-black rounded-md transition-all uppercase ${genOptions.difficulty === lvl ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:bg-white/50'}`}>{lvl}</button>
                         ))}
                       </div>
                    </div>
                  </div>

                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                       <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">Context Words (Optional)</label>
                       {userWords.map(group => (
                        <div key={group._id} className="space-y-1 border hover:bg-slate-100 flex items-center justify-between border-slate-200 p-2 rounded-sm">
                          <div className='flex items-center space-x-1' >
                            <p className="text-[14px] text-blue-950">{group.title}</p>
                            <p className="text-[12px] text-slate-400">({group.words.length} words)</p>
                          </div>

                          <button onClick={() => setSelectedGroupId(group._id)} className="text-[10px] text-slate-400 cursor-pointer hover:text-slate-600">
                            {selectedGroupId === group._id ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <PlusCircle className="h-6 w-6" />
                            )}
                          </button>
                        </div>
                       ))}
                       <p className="text-[9px] text-slate-400 italic">AI will attempt to prioritize these words within the DSAT passages where appropriate.</p>
                    </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">Question Count</label>
                       <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <input type="range" min="5" max="20" step="5" value={genOptions.count} onChange={e => setGenOptions({...genOptions, count: Number(e.target.value)})} className="flex-1 accent-blue-600 h-1" />
                          <span className="font-bold text-blue-600 text-xs">{genOptions.count}</span>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">Time Limit (Min)</label>
                       <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <input type="number" value={selectedTime} onChange={e => setSelectedTime(Number(e.target.value))} className="flex-1 bg-transparent border-none outline-none font-bold text-xs" />
                       </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button 
                      disabled={isProcessing} 
                      onClick={() => handleAIGen({ 
                        type: 'sat', 
                        value: genOptions.category, 
                        count: genOptions.count, 
                        difficulty: genOptions.difficulty,
                      })} 
                      className="bluebook-button w-full flex items-center justify-center gap-3 !py-4 shadow-xl active:scale-[0.98] transition-all"
                    >
                      {isProcessing ? <RotateCcw className="animate-spin w-5 h-5" /> : <><Wand2 className="w-5 h-5" /> Assemble AI Module</>}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
  )
}

export default AiPracticeGenerator