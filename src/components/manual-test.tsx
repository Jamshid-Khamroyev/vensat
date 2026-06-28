import { motion } from "framer-motion";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { 
    ArrowLeft, Eye, Save, X, Clock, FileText, BookOpen, Layers, Target, 
    CheckCircle, Sparkles, Loader2, Plus, Minus, Zap, Award, Flame, AirVent,
    Image as ImageIcon, Trash2
} from 'lucide-react';
import { useUserStore } from "../states/user.state";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

type DSATCategory = 'information-and-ideas' | 'craft-and-structure' | 'expression-of-ideas' | 'standard-conventions';
type Difficulty = 'easy' | 'medium' | 'hard';

interface Question {
    text: string;
    question: string;
    options: string[];
    correctAnswerIndex: number;
    difficulty: Difficulty;
    category: DSATCategory;
    graph?: string;
    imageFile?: File;
    imagePreview?: string;
}

const ManualTest = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedTime, setSelectedTime] = useState(30);
    const { user } = useUserStore()
    const [testText, setTestText] = useState("");
    const [keyText, setKeyText] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<DSATCategory>('information-and-ideas');
    const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium');
    const [preview, setPreview] = useState<any>(null);
    const [query, setQuery] = useState<string>("")
    const [uploadingImage, setUploadingImage] = useState<number | null>(null);
    const navigate = useNavigate()
    const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});


    const generateTitle = () => `DSAT ${["Practice","Assessment","Quiz"][Math.floor(Math.random()*3)]} - ${new Date().toLocaleDateString()}`;

    const generateRules = async () => {
        if(!query) return toast.error("Please enter a query")
        try {
            setIsProcessing(true);
            const { data } = await api.post(`/api/rag/generate/rules`, { query });
            
            const questions = data.data.map((item: any, index: number) => 
                `${index + 1}. ${item.text}\n\n*${item.question}*\n${item.options.map((opt: string, i: number) => `${String.fromCharCode(65 + i)}) ${opt}`).join('\n')}`
            ).join('\n\n');
            
            const answerKey = data.data.map((item: any, index: number) => 
                `${index + 1}-${String.fromCharCode(65 + item.correctAnswerIndex)}`
            ).join(', ');
            
            setTestText(questions);
            setKeyText(answerKey);
            setSelectedCategory('standard-conventions');
            setSelectedDifficulty('medium');
            toast.success(`${data.data.length} ta savol yaratildi!`);
        } catch (error) {
            toast.error("Savollarni yaratishda xatolik");
        } finally {
            setIsProcessing(false);
        }
    }

    const parseQuestions = (text: string): Question[] => {
        const questions: Question[] = [];
        const cleanText = text.replace(/ANSWER\s*KEY\s*:.*$/gis, '');
        const blocks = cleanText.split(/\n(?=\d+\.\s+)/);
        
        for (const block of blocks) {
            const numMatch = block.match(/^(\d+)\.\s+(.+?)(?=\n\d+\.|$)/s);
            if (!numMatch) continue;
            
            let remainingText = numMatch[2].trim();
            let passage = "";
            let questionStem = "";
            const options: string[] = [];
            
            const questionMatch = remainingText.match(/\*(.+?)\*/s);
            
            if (questionMatch) {
                questionStem = questionMatch[1].trim();
                passage = remainingText.substring(0, questionMatch.index!).trim();
                const afterQuestion = remainingText.substring(questionMatch.index! + questionMatch[0].length).trim();
                
                const optMatches = afterQuestion.matchAll(/\n?([A-D])[\.\)]\s+(.+?)(?=\n[A-D][\.\)]|\n\n|$)/gs);
                for (const m of optMatches) {
                    options.push(m[2].trim());
                }
            }
            
            if (!passage) passage = " ";
            
            if (options.length >= 2) {
                while(options.length < 4) options.push(`Option ${String.fromCharCode(65+options.length)}`);
                questions.push({
                    text: passage,
                    question: questionStem,
                    options: options.slice(0,4),
                    correctAnswerIndex: 0,
                    difficulty: selectedDifficulty,
                    category: selectedCategory
                });
            }
        }
        return questions;
    };

    const parseAnswers = (key: string, count: number) => {
        const map = new Map();
        const clean = key.toUpperCase().replace(/\s/g, '');
        const matches = clean.matchAll(/(\d+)[\s\-]?([A-D])/g);
        for (const m of matches) {
            const q = parseInt(m[1]);
            const idx = m[2].charCodeAt(0) - 65;
            if (q >= 1 && q <= count && idx >= 0 && idx < 4) map.set(q, idx);
        }
        return map;
    };

    const handleImageSelect = (file: File, index: number) => {
        if (!preview) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const updatedQuestions = [...preview.preview];
            updatedQuestions[index] = {
                ...updatedQuestions[index],
                imageFile: file,
                imagePreview: e.target?.result as string
            };
            setPreview({
                ...preview,
                preview: updatedQuestions,
                data: {
                    ...preview.data,
                    questions: updatedQuestions
                }
            });
        };
        reader.readAsDataURL(file);
    };

    const removeImage = (index: number) => {
        if (!preview) return;
        
        const updatedQuestions = [...preview.preview];
        updatedQuestions[index] = {
            ...updatedQuestions[index],
            imageFile: undefined,
            imagePreview: undefined
        };
        setPreview({
            ...preview,
            preview: updatedQuestions,
            data: {
                ...preview.data,
                questions: updatedQuestions
            }
        });
    };

    const uploadImages = async (questions: Question[]) => {
        const uploadedQuestions = [...questions];
        
        for (let i = 0; i < uploadedQuestions.length; i++) {
            if (uploadedQuestions[i].imageFile) {
                try {
                    const formData = new FormData();
                    formData.append('image', uploadedQuestions[i].imageFile as File);
                    
                    const { data } = await api.post('/api/tests/image/upload', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    
                    uploadedQuestions[i] = {
                        ...uploadedQuestions[i],
                        graph: data.url,
                        imageFile: undefined,
                        imagePreview: undefined
                    };
                } catch (error) {
                    throw new Error(`Failed to upload image for question ${i + 1}`);
                }
            }
        }
        
        return uploadedQuestions;
    };

    const handlePreview = async () => {
        if (!testText.trim()) return toast.error("Please enter test content");
        setIsProcessing(true);

        const questions = parseQuestions(testText);
        if (questions.length === 0) {
            toast.error("No valid questions found");
            setIsProcessing(false);
            return;
        }
        
        let answerMap = parseAnswers(keyText, questions.length);
        if (answerMap.size === 0 && keyText !== testText) {
            const answerSection = testText.match(/ANSWER\s*KEY\s*:?\s*([\s\S]+)$/i);
            if (answerSection) answerMap = parseAnswers(answerSection[1], questions.length);
        }
        
        const finalQuestions = questions.map((q, i) => ({ ...q, correctAnswerIndex: answerMap.get(i+1) ?? 0 }));
        const missing = [];
        for (let i = 1; i <= questions.length; i++) if (!answerMap.has(i)) missing.push(i);
        if (missing.length) toast.warning(`Missing answers for Q: ${missing.join(',')}. Using A as default.`);
        else toast.success(`${questions.length} questions parsed!`);
        
        setPreview({ 
            data: { 
                title: generateTitle(), 
                category: selectedCategory, 
                difficulty: selectedDifficulty,
                timeLimit: selectedTime, 
                questions: finalQuestions 
            }, 
            preview: finalQuestions 
        });
        setIsProcessing(false);
    };

    const handleSave = async () => {
        if (!preview) return;
        setIsProcessing(true);
        
        try {
            const questionsWithImages = await uploadImages(preview.preview);
            
            const testData = {
                ...preview.data,
                questions: questionsWithImages.map(({ imageFile, imagePreview, ...q }) => q),
                creatorId: user?._id,
                isGlobal: true,
                difficulty: selectedDifficulty
            };

            const res = await fetch("/api/tests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(testData)
            });
            
            if (!res.ok) throw new Error(await res.text());
            
            toast.success("Test saved successfully!");
            setPreview(null);
            setTestText("");
            setKeyText("");
            navigate('/dashboard');
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setIsProcessing(false);
        }
    };


    const loadExample = () => {
        setTestText(`1. Dr. Aris Thorne's 2025 study found that speakers of Kuuk Thaayorre demonstrate significantly better spatial awareness than English speakers.
*Which choice best states the main purpose of the text?*
A) To criticize previous studies
B) To present evidence supporting linguistic relativity
C) To compare two languages
D) To argue spatial awareness is genetic

2. The industrial revolution altered labor patterns, yet some occupations proved resilient. Blacksmithing persisted in specialized niches like farriery.
*The author uses blacksmithing as an example to illustrate that*
A) Mechanization eliminated crafts
B) Some occupations survive technological change
C) Only manufacturing was affected
D) Specialized skills are less valuable`);
        setKeyText("1-B,2-B");
        setSelectedDifficulty('medium');
    };

    const getDifficultyConfig = (diff: Difficulty) => {
        const configs = {
            easy: { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: Zap, label: 'Easy' },
            medium: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: Award, label: 'Medium' },
            hard: { color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', icon: Flame, label: 'Hard' }
        };
        return configs[diff] || configs.medium;
    };

    const categoryLabels = {
        'information-and-ideas': { label: 'Information & Ideas', icon: BookOpen },
        'craft-and-structure': { label: 'Craft & Structure', icon: Layers },
        'expression-of-ideas': { label: 'Expression of Ideas', icon: FileText },
        'standard-conventions': { label: 'Standard Conventions', icon: Target }
    };

    const DifficultyIcon = getDifficultyConfig(selectedDifficulty).icon;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-gray-50 p-3 sm:p-4">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white w-full rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <button onClick={() => navigate("/dashboard")} className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
                                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                            </button>
                            <div className="min-w-0">
                                <h1 className="text-sm sm:text-lg font-semibold text-gray-900 truncate">Import DSAT Test</h1>
                                <p className="text-xs sm:text-sm text-gray-500 truncate hidden sm:block">Create a new test from formatted text</p>
                            </div>
                        </div>
                        <button onClick={loadExample} className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span className="hidden xs:inline">Load Example</span>
                        </button>
                    </div>

                    {!preview ? (
                        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                                    Test Content
                                    <span className="text-gray-400 text-xs ml-1 sm:ml-2">(Questions with passages and options)</span>
                                </label>
                                <textarea 
                                    value={testText} 
                                    onChange={e => setTestText(e.target.value)} 
                                    className="w-full h-48 sm:h-64 p-3 border border-gray-200 rounded-lg font-mono text-xs sm:text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                                    placeholder="1. Passage text...&#10;&#10;*Question stem?*&#10;A) Option 1&#10;B) Option 2&#10;C) Option 3&#10;D) Option 4"
                                />
                            </div>

                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                                    Answer Key
                                    <span className="text-gray-400 text-xs ml-1 sm:ml-2">(Optional)</span>
                                </label>
                                <textarea 
                                    value={keyText} 
                                    onChange={e => setKeyText(e.target.value)} 
                                    className="w-full h-12 sm:h-16 p-2 sm:p-3 border border-gray-200 rounded-lg font-mono text-xs sm:text-sm resize-none focus:border-transparent transition-shadow"
                                    placeholder="1-B, 2-C, 3-A"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                                        <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
                                        Category
                                    </label>
                                    <select 
                                        value={selectedCategory} 
                                        onChange={e => setSelectedCategory(e.target.value as DSATCategory)} 
                                        className="w-full px-2 sm:px-3 py-2 border border-gray-200 rounded-lg bg-white focus:border-transparent text-xs sm:text-sm"
                                    >
                                        {Object.entries(categoryLabels).map(([key, { label }]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                                        <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
                                        Difficulty
                                    </label>
                                    <select 
                                        value={selectedDifficulty} 
                                        onChange={e => setSelectedDifficulty(e.target.value as Difficulty)} 
                                        className="w-full px-2 sm:px-3 py-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                                    >
                                        <option value="easy">Easy</option>
                                        <option value="medium">Medium</option>
                                        <option value="hard">Hard</option>
                                    </select>
                                </div>

                                <div className="sm:col-span-2 lg:col-span-1">
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                                        <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
                                        Time Limit
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setSelectedTime(Math.max(1, selectedTime-5))} className="w-8 h-8 sm:w-9 sm:h-9 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center flex-shrink-0">
                                            <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        </button>
                                        <input 
                                            type="number" 
                                            value={selectedTime} 
                                            onChange={e => setSelectedTime(Math.max(1, parseInt(e.target.value) || 0))} 
                                            className="w-full text-center border border-gray-200 rounded-lg py-1.5 sm:py-2 px-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                            min="1"
                                        />
                                        <button onClick={() => setSelectedTime(Math.min(180, selectedTime+5))} className="w-8 h-8 sm:w-9 sm:h-9 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center flex-shrink-0">
                                            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        </button>
                                        <span className="text-xs sm:text-sm text-gray-500">min</span>
                                    </div>
                                </div>
                            </div>

                            {selectedCategory === 'standard-conventions' && (
                                <div className="w-full">
                                    <textarea
                                        rows={3}
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        className="p-2 w-full border m-1 rounded-sm" 
                                        placeholder="Write Rules Theme"
                                    />
                                    <Button onClick={generateRules} className="cursor-pointer w-full" variant="outline">
                                        <AirVent className="w-4 h-4 inline mr-1" /> Generate Rules questions
                                    </Button>
                                </div>
                            )}

                            <div className="flex flex-wrap items-center gap-2 p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                                <span className="text-xs sm:text-sm text-gray-600">Selected:</span>
                                <span className={`inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border ${getDifficultyConfig(selectedDifficulty).bg} ${getDifficultyConfig(selectedDifficulty).color} ${getDifficultyConfig(selectedDifficulty).border}`}>
                                    <DifficultyIcon className="w-3.5 h-3.5" />
                                    {getDifficultyConfig(selectedDifficulty).label}
                                </span>
                                <span className="text-xs sm:text-sm text-gray-400 ml-1 sm:ml-2">
                                    {categoryLabels[selectedCategory]?.label}
                                </span>
                            </div>

                            <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 pt-2">
                                <button onClick={() => navigate('/dashboard')} className="px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 flex-1 order-2 xs:order-1">
                                    <X className="w-4 h-4" />
                                    Cancel
                                </button>
                                <button onClick={handlePreview} disabled={isProcessing} className="px-4 py-2.5 bg-blue-950 text-white rounded-lg hover:bg-blue-900 cursor-pointer transition-colors text-xs sm:text-sm font-medium flex items-center justify-center gap-2 flex-[2] order-1 xs:order-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {isProcessing ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                                    ) : (
                                        <><Eye className="w-4 h-4" /> Preview Test</>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 sm:p-6">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="text-base sm:text-lg font-semibold text-gray-900">Preview</h2>
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs sm:text-sm">
                                        {preview.data.questions.length} Qs
                                    </span>
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${getDifficultyConfig(selectedDifficulty).bg} ${getDifficultyConfig(selectedDifficulty).color} ${getDifficultyConfig(selectedDifficulty).border}`}>
                                        <DifficultyIcon className="w-3 h-3" />
                                        {getDifficultyConfig(selectedDifficulty).label}
                                    </span>
                                </div>
                                <button onClick={() => setPreview(null)} className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                    <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                                </button>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 max-h-[400px] sm:max-h-[500px] overflow-y-auto space-y-3 sm:space-y-4">
                                {preview.preview.map((q: Question, i: number) => {
                                    const diffConfig = getDifficultyConfig(q.difficulty || selectedDifficulty);
                                    const DiffIcon = diffConfig.icon;
                                    
                                    return (
                                        <div key={i} className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5">
                                                        <span className="text-xs sm:text-sm font-semibold text-gray-700">Q{i+1}</span>
                                                        <span className={`inline-flex items-center gap-0.5 sm:gap-1 text-xs px-1.5 sm:px-2 py-0.5 rounded-full border ${diffConfig.bg} ${diffConfig.color} ${diffConfig.border}`}>
                                                            <DiffIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                                            <span className="hidden xs:inline">{diffConfig.label}</span>
                                                        </span>
                                                        <span className="text-[10px] sm:text-xs text-gray-400 truncate">
                                                            {categoryLabels[q.category || selectedCategory]?.label}
                                                        </span>
                                                    </div>
                                                    
                                                    <p className="text-xs sm:text-sm text-gray-800 mb-2 break-words">{q.question}</p>
                                                    
                                                    {q.text && q.text !== " " && (
                                                        <p className="text-[10px] sm:text-xs text-gray-500 mb-2 line-clamp-2 break-words">{q.text}</p>
                                                    )}
                                                    
                                                    {q.imagePreview && (
                                                        <div className="mb-2 relative">
                                                            <img 
                                                                src={q.imagePreview} 
                                                                alt={`Question ${i+1} illustration`}
                                                                className="max-w-full h-auto max-h-40 rounded-lg border border-gray-200"
                                                            />
                                                            <button
                                                                onClick={() => removeImage(i)}
                                                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    )}
                                                    
                                                    <div className="space-y-0.5 sm:space-y-1">
                                                        {q.options.map((opt: string, oi: number) => (
                                                            <div key={oi} className={`text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 rounded ${oi === q.correctAnswerIndex ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-600'} break-words`}>
                                                                <span className="font-mono">{String.fromCharCode(65+oi)})</span> {opt}
                                                                {oi === q.correctAnswerIndex && <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 inline ml-1 text-green-600" />}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                
                                                <div className="flex-shrink-0">
                                                    <input
                                                        type="file"
                                                        ref={(el) => {
                                                            fileInputRefs.current[i] = el;
                                                        }}
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) handleImageSelect(file, i);
                                                            e.target.value = '';
                                                        }}
                                                    />
                                                    <button
                                                        onClick={() => fileInputRefs.current[i]?.click()}
                                                        className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                                        title="Add image to question"
                                                    >
                                                        <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 hover:text-gray-600" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
                                <button onClick={() => setPreview(null)} className="px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 flex-1 order-2 xs:order-1">
                                    <ArrowLeft className="w-4 h-4" /> Edit
                                </button>
                                <button onClick={handleSave} disabled={isProcessing} className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm font-medium flex items-center justify-center gap-2 flex-[2] order-1 xs:order-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {isProcessing ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                                    ) : (
                                        <><Save className="w-4 h-4" /> Save Test</>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default ManualTest;