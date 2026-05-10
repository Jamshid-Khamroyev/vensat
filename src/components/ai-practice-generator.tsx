import {motion} from 'framer-motion';
import { BrainCircuit, ChevronDown, Clock, Layers, RotateCcw, Trash2, Wand2, X } from "lucide-react"
import { useMemo, useState } from "react";
import { generateSATTest, generateWordsTest } from '../services/geminiService';
import { WordGroup, WordRecord } from '../types';
import { Button } from "@/components/ui/button";

interface AiPracticeGeneratorProps {
    setView: (view: "landing" | "dashboard" | "create" | "testing" | "results" | "ai-gen" | "profile" | "words" | "stories" | "story-gen" | "story-reader") => void;
    selectedTime: number;
    setSelectedTime: (time: number) => void;
    isProcessing: boolean;
    setIsProcessing: (processing: boolean) => void;
    setGenOptions: (options: { category: string; difficulty: string; count: number; words?: string }) => void;
    genOptions: { category: string; difficulty: string; count: number; words?: string };
    user: { _id: string; displayName: string; email: string } | null;
    userWords: WordRecord[];
    dbWordGroups: WordGroup[];
    dbTests: any[];
    setDbTests: (tests: any[]) => void;
    startTest: (test: any) => void;
}

const AiPracticeGenerator = ({ 
    selectedTime, setSelectedTime,setView,  setGenOptions, genOptions, isProcessing, setIsProcessing, user, userWords, dbWordGroups, dbTests, setDbTests, startTest
}: AiPracticeGeneratorProps) => {
    const [selectedWordGroups, setSelectedWordGroups] = useState<string[]>([]);

    // Build a stable list of groups: prefer server-side groups when available,
    // otherwise bucket userWords client-side in chunks of 20 (newest first).
    const groupOptions = useMemo<{ key: string; name: string; words: { term: string }[] }[]>(() => {
        if (dbWordGroups && dbWordGroups.length > 0) {
            return [...dbWordGroups]
                .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                .map(g => ({ key: g._id, name: g.name, words: g.words || [] }));
        }
        const sorted = [...userWords].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        const buckets: { key: string; name: string; words: WordRecord[] }[] = [];
        sorted.forEach((word, index) => {
            const idx = Math.floor(index / 20);
            if (!buckets[idx]) buckets[idx] = { key: `Group ${idx + 1}`, name: `Group ${idx + 1}`, words: [] };
            buckets[idx].words.push(word);
        });
        return buckets;
    }, [dbWordGroups, userWords]);

    const groupByKey = useMemo(() => {
        const map: Record<string, { key: string; name: string; words: { term: string }[] }> = {};
        for (const g of groupOptions) map[g.key] = g;
        return map;
    }, [groupOptions]);

    const selectedWordsText = useMemo(() => {
        const terms = selectedWordGroups
            .flatMap(key => groupByKey[key]?.words || [])
            .map(w => w.term);
        return Array.from(new Set(terms)).join(", ");
    }, [selectedWordGroups, groupByKey]);

    const previewTerms = useMemo(() => {
        return selectedWordGroups.flatMap(key => groupByKey[key]?.words || []);
    }, [selectedWordGroups, groupByKey]);

    const toggleGroup = (key: string) => {
        if (!key) return;
        setSelectedWordGroups(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    const handleAIGen = async (options: { type: 'sat' | 'words', value: string, count: number, difficulty?: string, category?: string, words?: string }) => {
        setIsProcessing(true);
        try {
          // The selected word groups are flattened into a plain comma-separated
          // string so the request body matches the original "context words" format.
          const wordsPayload = selectedWordsText || options.words;

          let parsed;
          if (options.type === 'sat') {
            parsed = await generateSATTest(options.value, options.difficulty || 'Medium', options.count, wordsPayload);
          } else {
            parsed = await generateWordsTest(options.category || 'General', options.value, options.count);
          }
          
          const res = await fetch("/api/tests", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...parsed, creatorId: user?._id, timeLimit: selectedTime })
          });
          const saved = await res.json();
          setDbTests([saved, ...dbTests]);
          startTest(parsed);
        } catch (e) { alert("Generation failed."); }
        finally { setIsProcessing(false); }
    };

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

                  {!genOptions.category.startsWith('Math') && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                       <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                         <Layers className="w-3 h-3" /> Context Word Groups (Optional)
                       </label>

                       {groupOptions.length === 0 ? (
                         <div className="px-3 py-4 rounded-lg bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500">
                           You don't have any word groups yet. Add words from the Lexicon to build groups.
                         </div>
                       ) : (
                         <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
                           <div className="relative">
                             <select
                               value=""
                               onChange={e => toggleGroup(e.target.value)}
                               className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                             >
                               <option value="" disabled>Select a word group…</option>
                               {groupOptions.map(g => (
                                 <option key={g.key} value={g.key}>
                                   {selectedWordGroups.includes(g.key) ? '✓ ' : ''}{g.name} ({g.words.length} words)
                                 </option>
                               ))}
                             </select>
                             <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                           </div>

                           {selectedWordGroups.length > 0 && (
                             <div className="space-y-1.5">
                               {selectedWordGroups.slice(0, 3).map(key => {
                                 const g = groupByKey[key];
                                 if (!g) return null;
                                 return (
                                   <div key={key} className="flex w-full items-center justify-between p-2 rounded-md bg-white border border-slate-200">
                                     <div className="flex items-center gap-2 text-xs">
                                       <span className="font-bold text-blue-950">{g.name}</span>
                                       <span className="text-slate-500">({g.words.length} words)</span>
                                     </div>
                                     <Button
                                       variant="ghost"
                                       size="sm"
                                       className="cursor-pointer h-6 px-2"
                                       onClick={() => toggleGroup(key)}
                                     >
                                       <Trash2 className="w-3 h-3" />
                                     </Button>
                                   </div>
                                 );
                               })}
                               {selectedWordGroups.length > 3 && (
                                 <span className="inline-block px-2 py-0.5 bg-blue-950 text-white rounded text-[10px] mx-1">
                                   And +{selectedWordGroups.length - 3} more
                                 </span>
                               )}

                               {previewTerms.length > 0 && (
                                 <div className="flex flex-wrap gap-1.5 pt-1">
                                   {previewTerms.slice(0, 6).map((w, i) => (
                                     <span key={`${w.term}-${i}`} className="px-2 py-0.5 bg-blue-100 text-blue-950 rounded text-[10px] font-bold">
                                       {w.term}
                                     </span>
                                   ))}
                                   {previewTerms.length > 6 && (
                                     <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold">
                                       +{previewTerms.length - 6} more
                                     </span>
                                   )}
                                 </div>
                               )}
                             </div>
                           )}
                         </div>
                       )}
                       <p className="text-[9px] text-slate-400 italic">AI will attempt to prioritize words from the selected groups within the DSAT passages where appropriate.</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">Question Count</label>
                       <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <input type="range" min="5" max="25" step="5" value={genOptions.count} onChange={e => setGenOptions({...genOptions, count: Number(e.target.value)})} className="flex-1 accent-blue-600 h-1" />
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
                        words: selectedWordsText || genOptions.words
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