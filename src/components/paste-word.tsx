import { BookOpen, FileText, Search, X, Play, Camera, Loader2, ArrowRight, CheckCircle, Trash2 } from "lucide-react";
import { useState, useMemo, useRef } from "react";
import { motion } from 'framer-motion';
import { WordGroup, WordRecord } from "../types";
import { translateWords } from "../services/geminiService";
import { toast } from "sonner";

interface PasteWordProps {
    handleAddWord: (word: { term: string; definition: string; category: string }) => void;
    userWords: WordRecord[];
    dbWordGroups?: WordGroup[];
    wordsBusy?: boolean;
    deletingGroupId?: string | null;
    handleDeleteWordGroup?: (groupId: string) => Promise<void> | void;
    setView: (view: "landing" | "dashboard" | "create" | "testing" | "results" | "ai-gen" | "profile" | "words" | "stories" | "story-gen" | "story-reader" | "word-group") => void;
    setCurrentWordGroup: (group: { name: string; words: WordRecord[] } | null) => void;
    localWords?: { term: string; definition?: string }[];
    removeLocalWord?: (term: string) => void;
    translateLocalWords?: () => void;
    isProcessing?: boolean;
}

const PasteWord = ({ handleAddWord, userWords, dbWordGroups = [], wordsBusy = false, deletingGroupId = null, handleDeleteWordGroup, setView, setCurrentWordGroup, localWords = [], removeLocalWord, translateLocalWords, isProcessing }: PasteWordProps) => {
    const [batchMode, setBatchMode] = useState(false);
    const [batchText, setBatchText] = useState('');
    const [parsedPairs, setParsedPairs] = useState<{ english: string; uzbek: string }[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [selectedWord, setSelectedWord] = useState<WordRecord | null>(null);
    
    // Image OCR states
    const [imageMode, setImageMode] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [extractedText, setExtractedText] = useState('');
    const [isProcessingOCR, setIsProcessingOCR] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [translatedWords, setTranslatedWords] = useState<{ term: string; definition: string }[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Use server-side groups when available; otherwise fall back to client-side bucketing of 20.
    const matchesSearch = (w: WordRecord) =>
        w.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.definition.toLowerCase().includes(searchTerm.toLowerCase());

    const sortGroupsByCreatedAt = (a: { createdAt?: string }, b: { createdAt?: string }) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    };

    const groupCards = useMemo<{ id: string | null; name: string; words: WordRecord[] }[]>(() => {
        if (dbWordGroups && dbWordGroups.length > 0) {
            return [...dbWordGroups]
                .sort(sortGroupsByCreatedAt)
                .map(g => ({
                    id: g._id,
                    name: g.name,
                    words: (g.words || []).filter(matchesSearch)
                }))
                .filter(g => searchTerm === '' || g.words.length > 0);
        }

        // Fallback: client-side bucketing.
        const filtered = userWords.filter(matchesSearch);
        const sorted = [...filtered].sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });
        const buckets: { id: string | null; name: string; words: WordRecord[] }[] = [];
        sorted.forEach((word, index) => {
            const idx = Math.floor(index / 20);
            if (!buckets[idx]) buckets[idx] = { id: null, name: `Group ${idx + 1}`, words: [] };
            buckets[idx].words.push(word);
        });
        return buckets;
    }, [dbWordGroups, userWords, searchTerm, sortOrder]);

    const handleGroupClick = (groupKey: string, words: WordRecord[]) => {
        setCurrentWordGroup({ name: groupKey, words });
        setView('word-group');
    };

    const onDeleteGroup = async (e: React.MouseEvent, groupId: string | null) => {
        e.stopPropagation();
        if (!groupId) {
            toast.error("Group not yet synced. Please refresh.");
            return;
        }
        if (!handleDeleteWordGroup) return;
        if (deletingGroupId) return;
        if (!confirm("Delete this group and all words inside?")) return;
        await handleDeleteWordGroup(groupId);
    };

    const parseBatch = () => {
        const lines = batchText.split(/\r?\n/);
        const pairs: { english: string; uzbek: string }[] = [];
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            
            let eng = '', uzb = '';
            
            if (trimmed.includes(' - ')) [eng, uzb] = trimmed.split(' - ');
            else if (trimmed.includes(': ')) [eng, uzb] = trimmed.split(': ');
            else if (trimmed.includes('—')) [eng, uzb] = trimmed.split('—');
            else if (trimmed.includes('|')) [eng, uzb] = trimmed.split('|');
            else if (trimmed.includes('\t')) [eng, uzb] = trimmed.split('\t');
            
            if (eng && uzb) pairs.push({ english: eng.trim(), uzbek: uzb.trim() });
        }
        setParsedPairs(pairs);
    };

    const confirmBatchAdd = () => {
        const now = new Date().toISOString();
        for (const pair of parsedPairs) {
            handleAddWord({ 
                term: pair.english, 
                definition: pair.uzbek,
                category: 'Vocabulary'
            });
        }
        setBatchMode(false);
        setBatchText('');
        setParsedPairs([]);
    };

    // Image OCR handlers
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            setSelectedImage(event.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const processImageWithOCR = async () => {
        if (!selectedImage) return;
        
        setIsProcessingOCR(true);
        try {
            // Use OCR.space API to extract text from image
            const formData = new FormData();
            formData.append('apikey', 'd4ae045a0088957');
            formData.append('base64Image', selectedImage);
            formData.append('language', 'eng');
            formData.append('isTable', 'false');
            
            const response = await fetch('https://api.ocr.space/parse/image', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.IsErroredOnProcessing) {
                toast.error('OCR xatolik: ' + data.ErrorMessage);
                return;
            }
            
            if (data.ParsedResults && data.ParsedResults.length > 0) {
                const parsedText = data.ParsedResults[0].ParsedText;
                
                // Extract English words from the parsed text
                const words = parsedText
                    .replace(/[^a-zA-Z\s]/g, ' ') // Keep only letters and spaces
                    .split(/\s+/)
                    .map(w => w.trim().toLowerCase())
                    .filter(w => w.length > 2 && w.length < 20); // Filter reasonable word lengths
                
                const uniqueWords = [...new Set(words)];
                
                if (uniqueWords.length > 0) {
                    setExtractedText(uniqueWords.join('\n'));
                    toast.success(`${uniqueWords.length} ta so'z aniqlandi`);
                } else {
                    toast.error('Rasmda so\'zlar topilmadi');
                }
            } else {
                toast.error('Rasmda matn topilmadi');
            }
        } catch (error) {
            console.error('OCR error:', error);
            toast.error('Rasmni qayta ishlashda xatolik');
        } finally {
            setIsProcessingOCR(false);
        }
    };

    const handleTranslateWords = async () => {
        const words = extractedText
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(line => line.length > 0);
        
        if (words.length === 0) {
            toast.error('Tarjima qilish uchun so\'zlar yo\'q');
            return;
        }
        
        setIsTranslating(true);
        try {
            const translations = await translateWords(words);
            setTranslatedWords(translations);
            toast.success(`${translations.length} ta so'z tarjima qilindi`);
        } catch (error) {
            toast.error('Tarjimada xatolik yuz berdi');
        } finally {
            setIsTranslating(false);
        }
    };

    const confirmImageWordsAdd = () => {
        for (const word of translatedWords) {
            handleAddWord({
                term: word.term,
                definition: word.definition,
                category: 'Vocabulary'
            });
        }
        
        toast.success(`${translatedWords.length} ta so'z lug'atga qo'shildi`);
        
        // Reset states
        setImageMode(false);
        setSelectedImage(null);
        setExtractedText('');
        setTranslatedWords([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const closeImageMode = () => {
        setImageMode(false);
        setSelectedImage(null);
        setExtractedText('');
        setTranslatedWords([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                        Lexicon Manager
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Store private vocabulary for AI-enhanced test generation.</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setBatchMode(true)} 
                        disabled={wordsBusy}
                        className="px-5 py-2.5 rounded-sm bg-linear-to-r from-blue-950 to-blue-900 text-white font-medium flex items-center gap-2 cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
                    >
                        <FileText className="w-4 h-4" /> Batch Paste
                    </button>
                    <button 
                        onClick={() => setImageMode(true)} 
                        disabled={wordsBusy}
                        className="px-5 py-2.5 rounded-sm bg-linear-to-r from-emerald-600 to-teal-600 text-white font-medium flex items-center gap-2 cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
                    >
                        <Camera className="w-4 h-4" /> Rasmdan OCR
                    </button>
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search words..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2">
                            <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                        </button>
                    )}
                </div>
                <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                    className="px-4 py-2.5 border border-slate-200 bg-white focus:border-blue-400 cursor-pointer"
                >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                </select>
            </div>

            {/* Words Display */}
            <div className="space-y-6">
                {userWords.length === 0 ? (
                    <div className="py-20 text-center bg-gradient-to-br from-slate-50 to-white rounded-3xl border-2 border-dashed border-slate-200">
                        <div className="bg-gradient-to-br from-slate-100 to-slate-200 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                            <BookOpen className="text-slate-400 w-10 h-10" />
                        </div>
                        <p className="text-slate-500 font-medium text-lg">Your lexicon is empty</p>
                        <p className="text-slate-400 text-sm mt-1">Start by adding words or using batch paste</p>
                        <p className="text-slate-400 text-xs mt-2">Words will be automatically grouped in sets of 20</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {groupCards.map((card, groupIndex) => {
                            const isDeleting = !!card.id && deletingGroupId === card.id;
                            const groupNumberLabel = (card.name.match(/\d+/) || [String(groupIndex + 1)])[0];
                            return (
                                <motion.div
                                    key={card.id || card.name}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: groupIndex * 0.05 }}
                                    className={`group relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer ${isDeleting ? 'opacity-60 pointer-events-none' : ''}`}
                                    onClick={() => !isDeleting && handleGroupClick(card.name, card.words)}
                                >
                                    {/* Thumbnail Area */}
                                    <div className="relative aspect-video bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="grid grid-cols-4 gap-2 p-4 opacity-40 group-hover:scale-105 transition-transform duration-500">
                                                {card.words.slice(0, 8).map((word) => (
                                                    <div key={word._id} className="bg-white/80 backdrop-blur-sm rounded-lg px-2 py-1.5 text-[10px] font-bold text-slate-600 truncate shadow-sm">
                                                        {word.term}
                                                    </div>
                                                ))}
                                                {card.words.length < 8 && Array.from({ length: 8 - card.words.length }).map((_, i) => (
                                                    <div key={`empty-${i}`} className="bg-white/40 rounded-lg px-2 py-1.5" />
                                                ))}
                                            </div>
                                        </div>
                                        {/* Play Overlay */}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                                            <div className="w-14 h-14 bg-white/90 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300">
                                                <Play className="w-6 h-6 text-blue-600 fill-blue-600 ml-1" />
                                            </div>
                                        </div>
                                        {/* Word Count Badge */}
                                        <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-black px-2 py-1 rounded-md">
                                            {card.words.length} words
                                        </div>
                                        {/* Group Number Badge */}
                                        <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded-md shadow-md">
                                            #{groupNumberLabel}
                                        </div>
                                        {/* Delete Group Button */}
                                        {card.id && handleDeleteWordGroup && (
                                            <button
                                                onClick={(e) => onDeleteGroup(e, card.id)}
                                                disabled={isDeleting || wordsBusy}
                                                className="absolute top-2 right-2 z-10 p-1.5 rounded-md bg-white/90 backdrop-blur-sm text-slate-500 hover:text-red-500 hover:bg-white shadow-sm border border-slate-200 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-100 disabled:cursor-not-allowed"
                                                title="Delete group"
                                            >
                                                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                            </button>
                                        )}
                                    </div>

                                    {/* Info Area */}
                                    <div className="p-4">
                                        <h3 className="font-bold text-slate-800 text-base group-hover:text-blue-600 transition-colors line-clamp-1">
                                            {card.name}
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Playlist • {card.words.length} so'z
                                        </p>
                                        <div className="flex flex-wrap gap-1.5 mt-3">
                                            {card.words.slice(0, 3).map((word) => (
                                                <span
                                                    key={word._id}
                                                    className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-medium"
                                                >
                                                    {word.term}
                                                </span>
                                            ))}
                                            {card.words.length > 3 && (
                                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[10px] font-bold">
                                                    +{card.words.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {isDeleting && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
                                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white shadow border border-slate-200">
                                                <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                                                <span className="text-xs font-bold text-slate-600">Deleting…</span>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Word Detail Modal */}
            {selectedWord && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedWord(null)}>
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-linear-to-r from-blue-600 to-indigo-600 px-6 py-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-bold text-white">{selectedWord.term}</h3>
                                <button onClick={() => setSelectedWord(null)} className="text-white/80 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Definition</span>
                                <p className="text-slate-700 mt-1 text-lg leading-relaxed">{selectedWord.definition}</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Batch Import Modal (same as before but with improved styling) */}
            {batchMode && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setBatchMode(false)}>
                    <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b sticky top-0 bg-white">
                            <h3 className="text-xl font-bold">Batch Import Words</h3>
                            <p className="text-sm text-slate-500 mt-1">Paste English — Uzbek pairs (one per line)</p>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <textarea 
                                value={batchText}
                                onChange={(e) => setBatchText(e.target.value)}
                                placeholder="apple - olma&#10;cat - mushuk&#10;run: yugurmoq&#10;beautiful — go'zal"
                                className="w-full h-48 p-4 border rounded-xl font-mono text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                            />
                            
                            <button onClick={parseBatch} className="bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-700 transition-all">
                                Parse & Preview
                            </button>
                            
                            {parsedPairs.length > 0 && (
                                <div className="mt-6">
                                    <h4 className="font-semibold mb-3">Preview ({parsedPairs.length} pairs):</h4>
                                    <div className="border rounded-xl overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-slate-50">
                                                <tr>
                                                    <th className="p-3 text-left font-semibold">English</th>
                                                    <th className="p-3 text-left font-semibold">O‘zbek</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {parsedPairs.map((pair, idx) => (
                                                    <tr key={idx} className="border-t hover:bg-slate-50 transition-colors">
                                                        <td className="p-3">{pair.english}</td>
                                                        <td className="p-3">{pair.uzbek}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    <div className="flex justify-end gap-3 mt-6">
                                        <button onClick={() => setBatchMode(false)} className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all">
                                            Cancel
                                        </button>
                                        <button onClick={confirmBatchAdd} className="px-5 py-2.5 rounded-xl bg-linear-to-r from-emerald-500 to-teal-600 text-white font-medium hover:shadow-lg transition-all">
                                            Confirm & Add All ({parsedPairs.length} words)
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Image OCR Modal */}
            {imageMode && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeImageMode}>
                    <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b sticky top-0 bg-white flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold">Rasmdan So'zlarni Olish</h3>
                                <p className="text-sm text-slate-500 mt-1">Rasm yuklang → so'zlarni tahrirlang → tarjima qiling → saqlang</p>
                            </div>
                            <button onClick={closeImageMode} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            {/* Show image and text extraction only when no translations yet */}
                            {translatedWords.length === 0 && (
                                <>
                                    {/* Step 1: Image Upload */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-semibold text-slate-700">1. Rasm yuklang</label>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            onChange={handleImageSelect}
                                            className="hidden"
                                        />
                                        
                                        {!selectedImage ? (
                                            <div 
                                                onClick={() => fileInputRef.current?.click()}
                                                className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/50 transition-all"
                                            >
                                                <Camera className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                                                <p className="text-slate-600 font-medium">Rasm tanlash uchun bosing</p>
                                                <p className="text-sm text-slate-400 mt-1">Yoki kamera ochish uchun (telefonda)</p>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <img 
                                                    src={selectedImage} 
                                                    alt="Selected" 
                                                    className="max-h-64 mx-auto rounded-lg shadow-md"
                                                />
                                                <button
                                                    onClick={() => {
                                                        setSelectedImage(null);
                                                        setExtractedText('');
                                                        setTranslatedWords([]);
                                                    }}
                                                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Step 2: Extract Text Button */}
                                    {selectedImage && !extractedText && (
                                        <button
                                            onClick={processImageWithOCR}
                                            disabled={isProcessingOCR}
                                            className="w-full py-3 bg-linear-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {isProcessingOCR ? (
                                                <><Loader2 className="w-5 h-5 animate-spin" /> Qayta ishlanmoqda...</>
                                            ) : (
                                                <><Camera className="w-5 h-5" /> So'zlarni olish</>
                                            )}
                                        </button>
                                    )}

                                    {/* Step 3: Edit Extracted Text */}
                                    {extractedText && (
                                        <div className="space-y-3">
                                            <label className="text-sm font-semibold text-slate-700">2. So'zlarni tahrirlang (har bir qatorda bitta so'z)</label>
                                            <textarea
                                                value={extractedText}
                                                onChange={(e) => setExtractedText(e.target.value)}
                                                placeholder="apple&#10;beautiful&#10;run"
                                                className="w-full h-32 p-4 border rounded-xl font-mono text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                                            />
                                            <p className="text-xs text-slate-500">{extractedText.split(/\r?\n/).filter(l => l.trim()).length} ta so'z</p>
                                        </div>
                                    )}

                                    {/* Step 4: Translate Button */}
                                    {extractedText && (
                                        <button
                                            onClick={handleTranslateWords}
                                            disabled={isTranslating}
                                            className="w-full py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {isTranslating ? (
                                                <><Loader2 className="w-5 h-5 animate-spin" /> Tarjima qilinmoqda...</>
                                            ) : (
                                                <><ArrowRight className="w-5 h-5" /> O'zbek tiliga tarjima qilish</>
                                            )}
                                        </button>
                                    )}
                                </>
                            )}

                            {/* Step 5: Editable Translation Table - Only show when translations exist */}
                            {translatedWords.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                                            Tarjima natijalari ({translatedWords.length} ta so'z)
                                        </label>
                                        <button
                                            onClick={() => {
                                                setTranslatedWords([]);
                                                setExtractedText('');
                                                setSelectedImage(null);
                                                if (fileInputRef.current) {
                                                    fileInputRef.current.value = '';
                                                }
                                            }}
                                            className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
                                        >
                                            <X className="w-4 h-4" />
                                            Qayta boshlash
                                        </button>
                                    </div>
                                    
                                    <p className="text-xs text-slate-500">O'zbek tarjimalarini tahrirlashingiz mumkin</p>
                                    
                                    <div className="border rounded-xl max-h-80 overflow-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-slate-50 sticky top-0">
                                                <tr>
                                                    <th className="p-3 text-left font-semibold w-1/2">English</th>
                                                    <th className="p-3 text-left font-semibold w-1/2">O'zbek (tahrirlash mumkin)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {translatedWords.map((word, idx) => (
                                                    <tr key={idx} className="border-t">
                                                        <td className="p-3 font-medium align-top">{word.term}</td>
                                                        <td className="p-2 align-top">
                                                            <input
                                                                type="text"
                                                                value={word.definition}
                                                                onChange={(e) => {
                                                                    const newWords = [...translatedWords];
                                                                    newWords[idx] = { ...word, definition: e.target.value };
                                                                    setTranslatedWords(newWords);
                                                                }}
                                                                className="w-full px-2 py-1 border rounded-md text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100 transition-all"
                                                                placeholder="Tarjima..."
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    <div className="flex justify-end gap-3 pt-4 border-t">
                                        <button 
                                            onClick={closeImageMode} 
                                            className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all"
                                        >
                                            Bekor qilish
                                        </button>
                                        <button 
                                            onClick={confirmImageWordsAdd} 
                                            className="px-5 py-2.5 rounded-xl bg-linear-to-r from-emerald-500 to-teal-600 text-white font-medium hover:shadow-lg transition-all flex items-center gap-2"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Saqlash ({translatedWords.length} ta so'z)
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PasteWord;