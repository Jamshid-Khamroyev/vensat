import { BookOpen, FileText, Search, X, Play, Camera, Loader2, ArrowRight, CheckCircle, Plus, Edit2, Trash2 } from "lucide-react";
import { useState, useMemo, useRef } from "react";
import { motion } from 'framer-motion';
import { WordRecord, GroupWord } from "../types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface PasteWordProps {
    handleAddWord: (words: { term: string; definition: string }[], title?: string) => void;
    handleUpdateGroup: (id: string, words?: { term: string; definition: string }[], title?: string) => void;
    handleDeleteGroup: (id: string) => void;
    userWords: GroupWord[];
    setView: (view: "landing" | "dashboard" | "create" | "testing" | "results" | "ai-gen" | "profile" | "words" | "stories" | "story-gen" | "story-reader" | "word-group") => void;
    setCurrentWordGroup: (group: { name: string; words: WordRecord[] } | null) => void;
}

const PasteWord = ({ handleAddWord, handleUpdateGroup, handleDeleteGroup, userWords, setView, setCurrentWordGroup }: PasteWordProps) => {
    const [batchMode, setBatchMode] = useState(false);
    const [batchText, setBatchText] = useState('');
    const [parsedPairs, setParsedPairs] = useState<{ term: string; definition: string }[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [selectedWord, setSelectedWord] = useState<WordRecord | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Image OCR states
    const [imageMode, setImageMode] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [extractedText, setExtractedText] = useState('');
    const [isProcessingOCR, setIsProcessingOCR] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [translatedWords, setTranslatedWords] = useState<{ term: string; definition: string }[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Display word groups (already grouped in database)
    const groupedWords = useMemo(() => {
        const groups: { [key: string]: WordRecord[] } = {};
        
        const filtered = userWords.filter(group => 
            group?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            group?.words?.some(w => 
                w.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
                w.definition.toLowerCase().includes(searchTerm.toLowerCase())
            )
        );

        const sorted = [...filtered].sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

        // Convert GroupWord to display format
        sorted.forEach((group, index) => {
            const wordRecords: WordRecord[] = group.words.map((word, idx) => ({
                _id: `${group._id}-${idx}`,
                term: word.term,
                definition: word.definition,
                category: group.category,
                createdAt: group.createdAt
            }));
            
            groups[group.title] = wordRecords;
        });

        return groups;
    }, [userWords, searchTerm, sortOrder]);

    const handleGroupClick = (groupKey: string, words: any) => {
        setCurrentWordGroup({ name: groupKey, words });
        setView('word-group');
    };

    const parseBatch = () => {
        const lines = batchText.split(/\r?\n/);
        const pairs: { term: string; definition: string }[] = [];
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            
            let eng = '', uzb = '';
            
            if (trimmed.includes(' - ')) [eng, uzb] = trimmed.split(' - ');
            else if (trimmed.includes(': ')) [eng, uzb] = trimmed.split(': ');
            else if (trimmed.includes('—')) [eng, uzb] = trimmed.split('—');
            else if (trimmed.includes('|')) [eng, uzb] = trimmed.split('|');
            else if (trimmed.includes('\t')) [eng, uzb] = trimmed.split('\t');
            
            if (eng && uzb) pairs.push({ term: eng.trim(), definition: uzb.trim() });
        }
        setParsedPairs(pairs);
    };

    const confirmBatchAdd = async () => {
        if (isProcessing) return;
        
        setIsProcessing(true);
        
        try {
            const wordsToAdd = parsedPairs.map(pair => ({
                term: pair.term, 
                definition: pair.definition,
                category: 'Vocabulary'
            }));
            
            await handleWordSubmission(wordsToAdd);
            setBatchMode(false);
            setBatchText('');
            setParsedPairs([]);
        } catch (error) {
            console.error('Batch add failed:', error);
            toast.error('So\'zlarni qo\'shishda xatolik yuz berdi');
        } finally {
            setIsProcessing(false);
        }
    };

    // Function to handle adding words to existing group or creating new group
    const handleWordSubmission = async (wordsToAdd: { term: string; definition: string }[]) => {
        if (isProcessing) return;
        
        setIsProcessing(true);
        
        try {
            // Find if there's an existing group with less than 30 words
            const existingGroup = userWords.find(group => group.words.length < 30);
            
            if (existingGroup) {
                // Add to existing group
                const updatedWords = [...existingGroup.words, ...wordsToAdd];
                await handleUpdateGroup(existingGroup._id, updatedWords, existingGroup.title);
                toast.success(`${wordsToAdd.length} ta so'z "${existingGroup.title}" guruhiga qo'shildi`);
            } else {
                // Create new group
                await handleAddWord(wordsToAdd);
                toast.success(`${wordsToAdd.length} ta so'z bilan yangi guruh yaratildi`);
            }
        } catch (error) {
            console.error('Word submission failed:', error);
            toast.error('So\'zlarni qo\'shishda xatolik yuz berdi');
        } finally {
            setIsProcessing(false);
        }
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
            formData.append('OCREngine', '2'); 
            formData.append('scale', 'true');
            formData.append('detectOrientation', 'true');
            
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

    const translateExtractedText = async () => {
        if (!extractedText.trim()) return toast.error('Tarjima qilish uchun matn kerak');
        
        if (isTranslating) return;
        
        setIsTranslating(true);
        try {
            const data = JSON.stringify({
                q: extractedText,
                source: 'en',
                target: 'uz'
            });

            const xhr = new XMLHttpRequest();
            xhr.withCredentials = true;

            xhr.addEventListener('readystatechange', function () {
                if (this.readyState === this.DONE) {
                    try {
                        const info = JSON.parse(this.responseText);
                        
                        const translatedArray = info.data.translations.translatedText;
                        
                        const finalResult = translatedArray[0]; 
                        const response = finalResult.split(",");
                        const finalWordsList = extractedText
                            .split(/\r?\n/)
                            .map(line => line.trim())
                            .filter(line => line.length > 0)
                            .map((word, index) => {
                                return {
                                    term: word,
                                    definition: response[index] || ""
                                };
                            });
                        setTranslatedWords(finalWordsList);
                    } catch (error) {
                        console.error("JSON parse qilishda xato:", error);
                    }
                }
            });

            xhr.open('POST', 'https://deep-translate1.p.rapidapi.com/language/translate/v2');
            xhr.setRequestHeader('x-rapidapi-key', 'f3251f90e7msh179edc31ad1c822p139b02jsnaeb7fd4fb5cd');
            xhr.setRequestHeader('x-rapidapi-host', 'deep-translate1.p.rapidapi.com');
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(data);
        } catch (error) {
            toast.error('Tarjimada xatolik yuz berdi');
        } finally {
            setIsTranslating(false);
        }
    };

    const confirmImageWordsAdd = async () => {
        const wordsToAdd = translatedWords.map(word => ({
            term: word.term,
            definition: word.definition,
        }));
        
        await handleAddWord(wordsToAdd, 'OCR Import ' + new Date().toLocaleDateString());
        
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
                        className="px-5 py-2.5 rounded-sm bg-linear-to-r from-blue-950 to-blue-900 text-white font-medium flex items-center gap-2 cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-100 "
                    >
                        <FileText className="w-4 h-4" /> Batch Paste
                    </button>
                    <button 
                        onClick={() => setImageMode(true)} 
                        className="px-5 py-2.5 rounded-sm bg-linear-to-r from-emerald-600 to-teal-600 text-white font-medium flex items-center gap-2 cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-100 "
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
                    <div className="py-20 text-center bg-linear-to-br from-slate-50 to-white rounded-3xl border-2 border-dashed border-slate-200">
                        <div className="bg-linear-to-br from-slate-100 to-slate-200 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                            <BookOpen className="text-slate-400 w-10 h-10" />
                        </div>
                        <p className="text-slate-500 font-medium text-lg">Lexiconingiz bo'sh</p>
                        <p className="text-slate-400 text-sm mt-1">So'zlar qo'shishni boshlang</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {userWords.map((group, index) => (
                            <motion.div
                                key={group._id || index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                className="group bg-white rounded-2xl border border-slate-200 shadow-sm md:hover:shadow-xl md:hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer"
                                onClick={() => handleGroupClick(group._id, group)}
                            >
                                {/* Thumbnail Area */}
                                <div className="relative aspect-video bg-linear-to-br from-slate-100 to-slate-200 overflow-hidden">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="grid grid-cols-4 gap-2 p-4 opacity-40 md:group-hover:scale-105 transition-transform duration-500">
                                            {group.words.slice(0, 8).map((word) => (
                                                <div key={word.term} className="bg-white/80 backdrop-blur-sm rounded-lg px-2 py-1.5 text-[10px] font-bold text-slate-600 truncate shadow-sm">
                                                    {word.term}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {/* Play Overlay */}
                                    <div className="absolute inset-0 bg-black/0 md:group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                                        <div className="w-14 h-14 bg-white/90 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg opacity-0 md:group-hover:opacity-100 scale-75 md:group-hover:scale-100 transition-all duration-300">
                                            <Play className="w-6 h-6 text-blue-600 fill-blue-600 ml-1" />
                                        </div>
                                    </div>

                                    {/* Badges */}
                                    <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-black px-2 py-1 rounded-md">
                                        {group.words.length} so'z
                                    </div>
                                    <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded-md shadow-md">
                                        #{index + 1}
                                    </div>
                                </div>

                                {/* Info Area */}
                                <div className="p-4">
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <h3 className="font-bold text-slate-800 text-base md:group-hover:text-blue-600 transition-colors line-clamp-1">
                                            {group.title}
                                        </h3>
                                        
                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                            <button 
                                                onClick={() => handleUpdateGroup(group._id, group.words, group.title)}
                                                className="p-2 bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-lg transition-colors flex items-center gap-2"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                                <span className="hidden sm:inline text-xs font-semibold">Tahrirlash</span>
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteGroup(group._id)}
                                                className="p-2 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-lg transition-colors flex items-center gap-2"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                <span className="hidden sm:inline text-xs font-semibold">O'chirish</span>
                                            </button>
                                        </div>
                                    </div>

                                    <p className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">
                                        Playlist • {group.words.length} so'z
                                    </p>

                                    <div className="flex flex-wrap gap-1 mt-3">
                                        {group.words.slice(0, 3).map((word) => (
                                            <span key={word.term} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-medium border border-slate-200/50">
                                                {word.term}
                                            </span>
                                        ))}
                                        {group.words.length > 3 && (
                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[10px] font-bold">
                                                +{group.words.length - 3}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
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
                                                        <td className="p-3">{pair.term}</td>
                                                        <td className="p-3">{pair.definition}</td>
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

                                    <div className="text-sm text-slate-500 mt-2">Bu yerda ham saqlashingiz mumkin!</div>
                                        {userWords.filter(group => group.words.length + parsedPairs.length <= 30).map(group => (
                                            <div
                                                onClick={() => {
                                                    const concatedWords = parsedPairs.concat(group.words)
                                                    handleUpdateGroup(group._id, concatedWords)
                                                    setBatchMode(false)
                                                }} 
                                                key={group._id} 
                                                className="p-2 border my-1 flex w-full justify-between items-center rounded-sm hover:opacity-80 cursor-pointer">
                                                    <h3>{group.title}</h3>
                                                    <Plus className="w-4 h-4"/>
                                            </div>
                                        ))}
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
                                            onClick={translateExtractedText}
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
                                            <Plus className="w-4 h-4" />
                                            Yangi yaratish ({translatedWords.length} ta so'z)
                                        </button>
                                    </div>

                                    <div className="text-sm text-slate-500 mt-2">Bu yerda ham saqlashingiz mumkin!</div>
                                        {userWords.filter(group => group.words.length + translatedWords.length <= 30).map(group => (
                                            <div
                                                onClick={() => {
                                                    const concatedWords = translatedWords.concat(group.words)
                                                    handleUpdateGroup(group._id, concatedWords )
                                                    setImageMode(false)
                                                }} 
                                                key={group._id} 
                                                className="p-2 border flex w-full justify-between items-center rounded-sm hover:opacity-80 cursor-pointer">
                                                    <h3>{group.title}</h3>
                                                    <Plus className="w-4 h-4"/>
                                            </div>
                                        ))}
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