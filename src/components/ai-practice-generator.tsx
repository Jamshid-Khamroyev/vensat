import { motion } from 'framer-motion';
import { BrainCircuit, RotateCcw, Wand2, X } from "lucide-react"
import axios from '../services/api';
import { useState } from 'react';
import { toast } from 'sonner';
import { useWordState } from '../states/word.state';
import { useSearchParams } from 'react-router-dom';

interface AiPracticeGeneratorProps {
    setView: (view: "landing" | "dashboard" | "create" | "testing" | "results" | "ai-gen" | "profile" | "words" | "stories" | "story-gen" | "story-reader") => void;
    isProcessing: boolean;
    setIsProcessing: (processing: boolean) => void;
    startTest: (id: string) => void;
}

const AiPracticeGenerator = ({ 
    setView, isProcessing, setIsProcessing, startTest
}: AiPracticeGeneratorProps) => {
    const [genOptions, setGenOptions] = useState<{ category: string, difficulty: string, words?: string[] }>({
        category: 'information-and-ideas',
        difficulty: 'medium',
    });
    const [searchParams] = useSearchParams();
    const groupTitle = searchParams.get("group");

      const { words } = useWordState()

    const handleAIGen = async () => {
        if(!words){
            toast.error("No words found. Please add some words first.");
            return;
        }
        
        if(words.length > 50){
            toast.error("You have too many words. Please select a group with less than 50 words.");
            return;
        }
        setIsProcessing(true);
        try {
            const context = words.map(word => word.term).join(", ");
            const res = await axios.post(`/api/rag/generate`, {
                difficulty: genOptions.difficulty,
                category: genOptions.category,
                userWords: context
            });
            startTest(res.data.data._id);
        } catch (e) { 
            console.error(e);
            toast.error("Generation failed.", e.response.data.message); 
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
                            <option value={"craft-and-structure"}>Reading: Craft & Structure</option>
                            <option value={"information-and-ideas"}>Reading: Information & Ideas</option>
                            <option value={"expression-of-ideas"}>Writing: Expression of Ideas</option>
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
                            {!words ? (
                                <p className="text-xs sm:text-sm text-slate-400 text-center py-3 sm:py-4">No word groups available</p>
                            ) : (
                                <div className="space-y-1.5 sm:space-y-2">
                                   Added <span className='text-emerald-600'>{groupTitle ? `${groupTitle} group!` : `${words.length} words`}</span> 
                                </div>
                            )}
                        </div>
                        <p className="text-[10px] sm:text-xs text-slate-400 mt-1.5 sm:mt-2">AI will prioritize these words in passages</p>
                    </div>
                    
                    {/* Generate Button */}
                    <button 
                        disabled={isProcessing} 
                        onClick={handleAIGen} 
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