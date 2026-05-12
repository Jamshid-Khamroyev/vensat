import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { WordRecord } from '../types';
import { Dispatch, SetStateAction } from 'react';

interface SelectWordProps {
  selectedWord: WordRecord;
  setSelectedWord: Dispatch<SetStateAction<WordRecord | null>>;
}

const SelectWord = ({ selectedWord, setSelectedWord }: SelectWordProps) => {
  return (
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
  )
}

export default SelectWord