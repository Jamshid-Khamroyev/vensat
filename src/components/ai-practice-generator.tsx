import { motion } from 'framer-motion';
import { BrainCircuit, CheckCircle, Clock, PlusCircle, RotateCcw, Wand2, X } from "lucide-react"
import { generateSATTest } from '../services/geminiService';
import axios from '../services/api';
import { GroupWord } from '../types';
import { useState } from 'react';
import { toast } from 'sonner';
import { useUserStore } from '../states/user.state';

interface AiPracticeGeneratorProps {
    setView: (view: "landing" | "dashboard" | "create" | "testing" | "results" | "ai-gen" | "profile" | "words" | "stories" | "story-gen" | "story-reader") => void;
    selectedTime: number;
    setSelectedTime: (time: number) => void;
    isProcessing: boolean;
    setIsProcessing: (processing: boolean) => void;
    userWords: GroupWord[];
    startTest: (id: string) => void;
}

const AiPracticeGenerator = ({ 
    selectedTime, setSelectedTime, setView, userWords, isProcessing, setIsProcessing, startTest
}: AiPracticeGeneratorProps) => {
    const [genOptions, setGenOptions] = useState<{ category: string, difficulty: string, count: number, words?: string }>({
        category: 'information-ideas',
        difficulty: 'medium',
        count: 10,
    });
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
      const { user } = useUserStore()

    const handleAIGen = async (options: { type: 'sat' | 'words', value: string, count: number, difficulty?: string, category?: string }) => {
        const usedWords = userWords.filter(group => group._id === selectedGroupId).map(group => group.words.map(word => word.term).join(",")).join(",");
        if(userWords.length > 50){
            toast.error("You have too many words in your selected group. Please select a group with less than 50 words.");
            return;
        }
        setIsProcessing(true);
        try {
            const parsed: any = await generateSATTest(options.value, options.difficulty || 'Medium', options.count, usedWords);
            
            const res = await axios.post("/api/tests", {
                ...parsed, 
                creatorId: user?._id, 
                category: parsed.category,
                timeLimit: selectedTime 
            });
            const saved = res.data;
            startTest(res.data._id);
        } catch (e) { 
            console.error(e);
            toast.error("Generation failed."); 
        }
        finally { setIsProcessing(false); }
    }

    return (
        <motion.div 
            key="ai-gen" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="w-full max-w-2xl mx-auto px-3 sm:px-6 py-4 sm:py-6"
        >
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 md:p-8">
                {/* Header */}
                <div className="flex items-start justify-between mb-6 sm:mb-8">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 bg-blue-950 rounded-xl">
                            <BrainCircuit className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-semibold text-blue-950">AI Generator</h2>
                            <p className="text-xs sm:text-sm text-slate-500">Create custom SAT practice</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setView('dashboard')} 
                        className="p-1.5 sm:p-2 text-slate-400 rounded-lg"
                    >
                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                </div>

                {/* Form */}
                <div className="space-y-4 sm:space-y-6">
                    {/* Category */}
                    <div>
                        <label className="block text-[10px] sm:text-xs font-medium text-slate-600 uppercase tracking-wider mb-1.5 sm:mb-2">
                            Test Category
                        </label>
                        <select 
                            value={genOptions.category} 
                            onChange={e => setGenOptions({...genOptions, category: e.target.value})} 
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none text-[14px]"
                        >
                            <option value={"craft-structure"}>Reading: Craft & Structure</option>
                            <option value={"information-ideas"}>Reading: Information & Ideas</option>
                            <option value={"expression-ideas"}>Writing: Expression of Ideas</option>
                        </select>
                    </div>

                    {/* Difficulty */}
                    <div>
                        <label className="block text-[10px] sm:text-xs font-medium text-slate-600 uppercase tracking-wider mb-1.5 sm:mb-2">
                            Difficulty
                        </label>
                        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                            {['easy', 'medium', 'hard'].map(lvl => (
                                <button 
                                    key={lvl} 
                                    onClick={() => setGenOptions({...genOptions, difficulty: lvl.toLowerCase()})} 
                                    className={`py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-medium capitalize ${
                                        genOptions.difficulty === lvl.toLowerCase() 
                                            ? 'bg-blue-950 text-white' 
                                            : 'bg-slate-50 text-slate-600 border border-slate-200'
                                    }`}
                                >
                                    {lvl}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Word Groups */}
                    <div>
                        <label className="block text-[10px] sm:text-xs font-medium text-slate-600 uppercase tracking-wider mb-1.5 sm:mb-2">
                            Context Words <span className="font-normal text-slate-400">(optional)</span>
                        </label>
                        <div className="bg-slate-50 rounded-xl border border-slate-200 p-2 sm:p-3 max-h-40 sm:max-h-52 overflow-y-auto">
                            {userWords.length === 0 ? (
                                <p className="text-xs sm:text-sm text-slate-400 text-center py-3 sm:py-4">No word groups available</p>
                            ) : (
                                <div className="space-y-1.5 sm:space-y-2">
                                    {userWords.map(group => (
                                        <div 
                                            key={group._id} 
                                            className={`flex items-center justify-between p-2.5 sm:p-3 rounded-lg ${
                                                selectedGroupId === group._id 
                                                    ? 'bg-blue-950' 
                                                    : 'bg-white border border-slate-200'
                                            }`}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-xs sm:text-sm font-medium truncate ${
                                                    selectedGroupId === group._id ? 'text-white' : 'text-slate-800'
                                                }`}>
                                                    {group.title}
                                                </p>
                                                <p className={`text-[10px] sm:text-xs ${
                                                    selectedGroupId === group._id ? 'text-blue-300' : 'text-slate-400'
                                                }`}>
                                                    {group.words.length} words
                                                </p>
                                            </div>
                                            <button 
                                                onClick={() => setSelectedGroupId(selectedGroupId === group._id ? null : group._id)} 
                                                className="p-1 flex-shrink-0 ml-2"
                                            >
                                                {selectedGroupId === group._id ? (
                                                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                                ) : (
                                                    <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                                                )}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <p className="text-[10px] sm:text-xs text-slate-400 mt-1.5 sm:mt-2">AI will prioritize these words in passages</p>
                    </div>

                    {/* Count & Time */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <label className="block text-[10px] sm:text-xs font-medium text-slate-600 uppercase tracking-wider mb-1.5 sm:mb-2">
                                Questions
                            </label>
                            <div className="flex items-center gap-2 sm:gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3">
                                <input 
                                    type="range" 
                                    min="5" 
                                    max="20" 
                                    step="5" 
                                    value={genOptions.count} 
                                    onChange={e => setGenOptions({...genOptions, count: Number(e.target.value)})} 
                                    className="flex-1 accent-blue-950 h-1.5"
                                />
                                <span className="text-base sm:text-lg font-semibold text-blue-950 min-w-[1.5rem] sm:min-w-[2rem] text-center">
                                    {genOptions.count}
                                </span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] sm:text-xs font-medium text-slate-600 uppercase tracking-wider mb-1.5 sm:mb-2">
                                Time (min)
                            </label>
                            <div className="flex items-center gap-2 sm:gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3">
                                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 flex-shrink-0" />
                                <input 
                                    type="number" 
                                    value={selectedTime} 
                                    onChange={e => setSelectedTime(Number(e.target.value))} 
                                    className="w-full bg-transparent border-none outline-none text-base sm:text-lg font-semibold text-blue-950"
                                    min="1"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Generate Button */}
                    <button 
                        disabled={isProcessing} 
                        onClick={() => handleAIGen({ 
                            type: 'sat', 
                            value: genOptions.category, 
                            count: genOptions.count, 
                            difficulty: genOptions.difficulty,
                        })} 
                        className="w-full py-3.5 sm:py-4 bg-blue-950 text-white rounded-xl font-medium text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isProcessing ? (
                            <>
                                <RotateCcw className="animate-spin w-4 h-4 sm:w-5 sm:h-5" />
                                <span>Generating...</span>
                            </>
                        ) : (
                            <>
                                <Wand2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span>Generate Module</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </motion.div>
    )
}

export default AiPracticeGenerator