import { BookOpen, FileText, Search, X, Play } from "lucide-react";
import { useState, useMemo } from "react";
import { motion } from 'framer-motion';
import { WordRecord } from "../types";

interface PasteWordProps {
    handleAddWord: (word: { term: string; definition: string; category: string }) => void;
    userWords: WordRecord[];
    setView: (view: "landing" | "dashboard" | "create" | "testing" | "results" | "ai-gen" | "profile" | "words" | "stories" | "story-gen" | "story-reader" | "word-group") => void;
    setCurrentWordGroup: (group: { name: string; words: WordRecord[] } | null) => void;
}

const PasteWord = ({ handleAddWord, userWords, setView, setCurrentWordGroup }: PasteWordProps) => {
    const [batchMode, setBatchMode] = useState(false);
    const [batchText, setBatchText] = useState('');
    const [parsedPairs, setParsedPairs] = useState<{ english: string; uzbek: string }[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [selectedWord, setSelectedWord] = useState<WordRecord | null>(null);

    // Automatic word grouping (20 words per group)
    const groupedWords = useMemo(() => {
        const groups: { [key: string]: WordRecord[] } = {};
        
        const filtered = userWords.filter(w => 
            w.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
            w.definition.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const sorted = [...filtered].sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

        // Group words by 20s
        sorted.forEach((word, index) => {
            const groupIndex = Math.floor(index / 20);
            const groupKey = `Group ${groupIndex + 1}`;
            
            if (!groups[groupKey]) groups[groupKey] = [];
            groups[groupKey].push(word);
        });

        return groups;
    }, [userWords, searchTerm, sortOrder]);

    const handleGroupClick = (groupKey: string, words: WordRecord[]) => {
        setCurrentWordGroup({ name: groupKey, words });
        setView('word-group');
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

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                        Lexicon Manager
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Store private vocabulary for AI-enhanced test generation.</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setBatchMode(true)} 
                        className="px-5 py-2.5 rounded-sm bg-gradient-to-r from-blue-950 to-blue-900 text-white font-medium flex items-center gap-2 cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-100 "
                    >
                        <FileText className="w-4 h-4" /> Batch Paste
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
                        {Object.entries(groupedWords).map(([groupKey, words], groupIndex) => (
                            <motion.div
                                key={groupKey}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: groupIndex * 0.05 }}
                                className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer"
                                onClick={() => handleGroupClick(groupKey, words)}
                            >
                                {/* Thumbnail Area */}
                                <div className="relative aspect-video bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="grid grid-cols-4 gap-2 p-4 opacity-40 group-hover:scale-105 transition-transform duration-500">
                                            {words.slice(0, 8).map((word) => (
                                                <div key={word._id} className="bg-white/80 backdrop-blur-sm rounded-lg px-2 py-1.5 text-[10px] font-bold text-slate-600 truncate shadow-sm">
                                                    {word.term}
                                                </div>
                                            ))}
                                            {words.length < 8 && Array.from({ length: 8 - words.length }).map((_, i) => (
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
                                        {words.length} words
                                    </div>
                                    {/* Group Number Badge */}
                                    <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded-md shadow-md">
                                        #{groupKey.split(' ')[1]}
                                    </div>
                                </div>

                                {/* Info Area */}
                                <div className="p-4">
                                    <h3 className="font-bold text-slate-800 text-base group-hover:text-blue-600 transition-colors line-clamp-1">
                                        {groupKey}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Playlist • {words.length} so'z
                                    </p>
                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                        {words.slice(0, 3).map((word) => (
                                            <span
                                                key={word._id}
                                                className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-medium"
                                            >
                                                {word.term}
                                            </span>
                                        ))}
                                        {words.length > 3 && (
                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[10px] font-bold">
                                                +{words.length - 3}
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
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
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
                                        <button onClick={confirmBatchAdd} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium hover:shadow-lg transition-all">
                                            Confirm & Add All ({parsedPairs.length} words)
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