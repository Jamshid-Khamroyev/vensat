import { BookOpen, FileText, Plus, Trash2, Calendar, ChevronDown, ChevronUp, Search, X, Volume2 } from "lucide-react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from 'framer-motion';


interface Word {
  _id: string;
  term: string;
  definition: string;
  category: string;
  createdAt?: string;
}

interface PasteWordProps {
    handleAddWord: (word: { term: string; definition: string; category: string }) => void;
    userWords: Word[];
    handleDeleteWord: (id: string) => void;
}

const PasteWord = ({ handleAddWord, userWords, handleDeleteWord }: PasteWordProps) => {
    const [batchMode, setBatchMode] = useState(false);
    const [batchText, setBatchText] = useState('');
    const [parsedPairs, setParsedPairs] = useState<{ english: string; uzbek: string }[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [selectedWord, setSelectedWord] = useState<Word | null>(null);

    // So'zlarni vaqt bo'yicha guruhlash
    const groupedWords = useMemo(() => {
        const groups: { [key: string]: Word[] } = {};
        
        const filtered = userWords.filter(w => 
            w.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
            w.definition.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const sorted = [...filtered].sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

        sorted.forEach(word => {
            const date = word.createdAt ? new Date(word.createdAt) : new Date();
            const groupKey = date.toLocaleDateString('uz-UZ', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            
            if (!groups[groupKey]) groups[groupKey] = [];
            groups[groupKey].push(word);
        });

        return groups;
    }, [userWords, searchTerm, sortOrder]);

    const toggleGroup = (groupKey: string) => {
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(groupKey)) {
            newExpanded.delete(groupKey);
        } else {
            newExpanded.add(groupKey);
        }
        setExpandedGroups(newExpanded);
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
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium flex items-center gap-2 shadow-lg shadow-emerald-200 hover:shadow-xl hover:scale-105 transition-all duration-200"
                    >
                        <FileText className="w-4 h-4" /> Batch Paste
                    </button>
                    <button 
                        onClick={() => {
                            const term = prompt("Enter word/phrase:");
                            const definition = prompt("Enter definition/context:");
                            const category = prompt("Category (e.g. Science, Literature):", "General");
                            if (term && definition) handleAddWord({ term, definition, category: category || 'General' });
                        }} 
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium flex items-center gap-2 shadow-lg shadow-blue-200 hover:shadow-xl hover:scale-105 transition-all duration-200"
                    >
                        <Plus className="w-4 h-4" /> Add Word
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
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-blue-400 cursor-pointer"
                >
                    <option value="newest">📅 Newest First</option>
                    <option value="oldest">📅 Oldest First</option>
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
                    </div>
                ) : (
                    Object.entries(groupedWords).map(([groupKey, words]) => (
                        <div key={groupKey} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            {/* Group Header */}
                            <button
                                onClick={() => toggleGroup(groupKey)}
                                className="w-full px-6 py-4 bg-gradient-to-r from-slate-50 to-white hover:from-slate-100 transition-all flex items-center justify-between border-b border-slate-200"
                            >
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-5 h-5 text-slate-500" />
                                    <span className="font-semibold text-slate-700">{groupKey}</span>
                                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                                        {words.length} words
                                    </span>
                                </div>
                                {expandedGroups.has(groupKey) ? 
                                    <ChevronUp className="w-5 h-5 text-slate-400" /> : 
                                    <ChevronDown className="w-5 h-5 text-slate-400" />
                                }
                            </button>

                            {/* Group Content */}
                            {expandedGroups.has(groupKey) && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                                    {words.map((w, idx) => (
                                        <motion.div
                                            key={w._id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            onClick={() => setSelectedWord(w)}
                                            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 cursor-pointer group relative"
                                        >
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleDeleteWord(w._id); }} 
                                                className="absolute top-3 right-3 p-1.5 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 z-10"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                            <div className="space-y-3">
                                                <div className="inline-flex px-2.5 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 text-[10px] font-black uppercase text-blue-700 rounded-lg tracking-wider border border-blue-100">
                                                    {w.category}
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                                                    {w.term}
                                                </h3>
                                                <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">
                                                    {w.definition}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                                    <Volume2 className="w-3 h-3" />
                                                    <span>Click to see full meaning</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
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
                            <div>
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</span>
                                <p className="text-slate-600 mt-1">{selectedWord.category}</p>
                            </div>
                            {selectedWord.createdAt && (
                                <div>
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Added on</span>
                                    <p className="text-slate-600 mt-1">
                                        {new Date(selectedWord.createdAt).toLocaleDateString('uz-UZ', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            )}
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