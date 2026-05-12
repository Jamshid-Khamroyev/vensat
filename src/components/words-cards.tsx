import { BookOpen, Edit2, Play, Trash2, X, Loader2 } from "lucide-react"
import { GroupWord, WordRecord } from "../types";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface WordsCardsProps {
    setCurrentWordGroup: (group: { name: string; words: WordRecord[] } | null) => void;
    setView: (view: "landing" | "dashboard" | "create" | "testing" | "results" | "ai-gen" | "profile" | "words" | "stories" | "story-gen" | "story-reader" | "word-group") => void;
    userWords: GroupWord[];
    handleUpdateGroup: (id: string, words?: { term: string; definition: string }[], title?: string) => void;
    handleDeleteGroup: (id: string) => void;
}

const WordsCards = ({ userWords, setCurrentWordGroup, setView, handleUpdateGroup, handleDeleteGroup }: WordsCardsProps) => {
    const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [editingGroup, setEditingGroup] = useState<GroupWord | null>(null);
    const [newGroupName, setNewGroupName] = useState("");

    const handleGroupClick = (group: GroupWord) => {
        // group.words ni to'g'ridan-to'g'ri ishlatamiz
        setCurrentWordGroup({ 
            name: group._id, 
            words: group.words as WordRecord[]  // Type assertion
        });
        setView('word-group');
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this group?")) return;
        
        setDeleteLoading(id);
        try {
            await handleDeleteGroup(id);
        } finally {
            setDeleteLoading(null);
        }
    };

    const handleEditClick = (group: GroupWord, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingGroup(group);
        setNewGroupName(group.title);
        setEditModalOpen(true);
    };

    const handleUpdate = async () => {
        if (!editingGroup || !newGroupName.trim()) return;
        
        setEditLoading(true);
        try {
            await handleUpdateGroup(editingGroup._id, undefined, newGroupName.trim());
            setEditModalOpen(false);
            setEditingGroup(null);
            setNewGroupName("");
        } finally {
            setEditLoading(false);
        }
    };

    return (
        <>
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
                                onClick={() => handleGroupClick(group)}
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
                                                onClick={(e) => handleEditClick(group, e)}
                                                disabled={deleteLoading === group._id}
                                                className="p-2 bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                                <span className="hidden sm:inline text-xs font-semibold">Tahrirlash</span>
                                            </button>
                                            <button 
                                                onClick={(e) => handleDelete(group._id, e)}
                                                disabled={deleteLoading === group._id}
                                                className="p-2 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {deleteLoading === group._id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                                <span className="hidden sm:inline text-xs font-semibold">
                                                    {deleteLoading === group._id ? "O'chirilmoqda..." : "O'chirish"}
                                                </span>
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

            {/* Edit Modal */}
            <AnimatePresence>
                {editModalOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setEditModalOpen(false)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        />
                        
                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
                        >
                            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                                {/* Modal Header */}
                                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4 flex items-center justify-between">
                                    <h3 className="text-white font-bold text-lg">Guruh nomini tahrirlash</h3>
                                    <button
                                        onClick={() => setEditModalOpen(false)}
                                        className="text-white/80 hover:text-white transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Modal Body */}
                                <div className="p-6">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Guruh nomi
                                    </label>
                                    <input
                                        type="text"
                                        value={newGroupName}
                                        onChange={(e) => setNewGroupName(e.target.value)}
                                        placeholder="Masalan: IELTS Vocabulary"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-800"
                                        autoFocus
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && newGroupName.trim()) {
                                                handleUpdate();
                                            }
                                        }}
                                    />
                                    <p className="text-xs text-slate-400 mt-2">
                                        Faqat guruh nomi o'zgartiriladi. So'zlar o'zgarishsiz qoladi.
                                    </p>
                                </div>

                                {/* Modal Footer */}
                                <div className="px-6 pb-6 flex gap-3">
                                    <button
                                        onClick={() => setEditModalOpen(false)}
                                        className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                                    >
                                        Bekor qilish
                                    </button>
                                    <button
                                        onClick={handleUpdate}
                                        disabled={!newGroupName.trim() || editLoading}
                                        className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {editLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Saqlanmoqda...
                                            </>
                                        ) : (
                                            "Saqlash"
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}

export default WordsCards