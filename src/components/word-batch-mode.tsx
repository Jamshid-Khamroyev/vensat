import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { GroupWord, WordRecord } from "../types";
import { generateSentencesForWords } from "../services/geminiService";

interface WordBatchModeProps {
    setBatchMode: (value: boolean) => void;
    userWords: GroupWord[];
    handleAddWord: (words: { term: string; definition: string }[], title?: string) => void;
    handleUpdateGroup: (id: string, words?: { term: string; definition: string }[], title?: string) => void;
}

const WordBatchMode = ({ setBatchMode, handleAddWord, handleUpdateGroup, userWords }: WordBatchModeProps) => {
    const [batchText, setBatchText] = useState('');
    const [parsedPairs, setParsedPairs] = useState<{ term: string; definition: string }[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
        
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
        
        if (pairs.length === 0) {
            toast.error('Hech qanday so\'z juftligi topilmadi');
            return;
        }
        
        if (pairs.length > 50) {
            toast.warning(`${pairs.length} ta so'z topildi, 50 tadan ko'p so'z qo'shish tavsiya etilmaydi`);
        }
        
        setParsedPairs(pairs);
        toast.success(`${pairs.length} ta so'z juftligi aniqlandi`);
    };

    const confirmBatchAdd = async () => {
        if (parsedPairs.length === 0) {
            toast.error('Qo\'shish uchun so\'zlar mavjud emas');
            return;
        }
        
        if (isProcessing) return;
        
        setIsProcessing(true);
        const loadingToast = toast.loading(`${parsedPairs.length} ta so'z qo'shilmoqda...`);
        
        try {
            const terms = parsedPairs.map(pair => pair.term);
            let generatedData;
            
            try {
                generatedData = await generateSentencesForWords(terms);
            } catch (error) {
                console.error('Sentence generation error:', error);
                toast.warning('Ba\'zi so\'zlar uchun gap yaratilmadi, keyin qo\'shishingiz mumkin');
                generatedData = [];
            }
            console.log(generatedData);
            
            const sentenceMap = new Map(generatedData.map(item => [item.term, item.sentence]));

            const wordsToAdd = parsedPairs.map(pair => ({
                term: pair.term,
                definition: pair.definition,
                sentence: sentenceMap.get(pair.term) || `${pair.term} uchun misol gap keyin qo'shiladi.`
            }));

            await handleAddWord(wordsToAdd, `Batch Import ${new Date().toLocaleDateString()} ${Math.floor(Math.random()*1200).toFixed(0)}`);
            
            toast.success(`${wordsToAdd.length} ta so'z muvaffaqiyatli qo'shildi!`, { id: loadingToast });
            setBatchMode(false);
            setBatchText('');
            setParsedPairs([]);
        } catch (error) {
            console.error('Batch add failed:', error);
            toast.error('So\'zlarni qo\'shishda xatolik yuz berdi', { id: loadingToast });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUpdateGroupWithWords = async (group: GroupWord) => {
        if (parsedPairs.length === 0) {
            toast.error('Qo\'shish uchun so\'zlar mavjud emas');
            return;
        }
        
        const newWordCount = group.words.length + parsedPairs.length;
        if (newWordCount > 30) {
            toast.error(`Bu guruhga ${parsedPairs.length} ta so'z qo'shib bo'lmaydi (maksimal 30 ta so'z)`);
            return;
        }
        
        const loadingToast = toast.loading(`${parsedPairs.length} ta so'z qo'shilmoqda...`);
        
        try {
            const concatedWords = [...group.words, ...parsedPairs] as WordRecord[];
            await handleUpdateGroup(group._id, concatedWords);
            toast.success(`${parsedPairs.length} ta so'z "${group.title}" guruhiga qo'shildi`, { id: loadingToast });
            setBatchMode(false);
            setBatchText('');
            setParsedPairs([]);
        } catch (error) {
            console.error('Update group error:', error);
            toast.error('Guruhga qo\'shishda xatolik', { id: loadingToast });
        }
    };

    const closeBatchMode = () => {
        if (isProcessing) {
            toast.error('Iltimos, joriy jarayon tugashini kuting');
            return;
        }
        
        setBatchMode(false);
        setBatchText('');
        setParsedPairs([]);
    };
    
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeBatchMode}>
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b sticky top-0 bg-white flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold">Batch Import Words</h3>
                        <p className="text-sm text-slate-500 mt-1">Paste English — Uzbek pairs (one per line)</p>
                    </div>
                    <button 
                        onClick={closeBatchMode} 
                        disabled={isProcessing}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    <textarea 
                        value={batchText}
                        onChange={(e) => setBatchText(e.target.value)}
                        placeholder="apple - olma&#10;cat - mushuk&#10;run: yugurmoq&#10;beautiful — go'zal"
                        className="w-full h-48 p-4 border rounded-xl font-mono text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                        disabled={isProcessing}
                    />
                    
                    <button 
                        onClick={parseBatch} 
                        disabled={isProcessing || !batchText.trim()}
                        className="bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Parse & Preview
                    </button>
                    
                    {parsedPairs.length > 0 && (
                        <div className="mt-6">
                            <h4 className="font-semibold mb-3">Preview ({parsedPairs.length} pairs):</h4>
                            <div className="border rounded-xl overflow-hidden max-h-64 overflow-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 sticky top-0">
                                        <tr>
                                            <th className="p-3 text-left font-semibold">English</th>
                                            <th className="p-3 text-left font-semibold">O‘zbek</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parsedPairs.map((pair, idx) => (
                                            <tr key={idx} className="border-t hover:bg-slate-50 transition-colors">
                                                <td className="p-3 font-medium">{pair.term}</td>
                                                <td className="p-3">{pair.definition}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            
                            <div className="flex justify-end gap-3 mt-6">
                                <button 
                                    onClick={closeBatchMode} 
                                    disabled={isProcessing}
                                    className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={confirmBatchAdd} 
                                    disabled={isProcessing}
                                    className="px-5 py-2.5 rounded-xl bg-linear-to-r from-emerald-500 to-teal-600 text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isProcessing ? (
                                        <><svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg> Processing...</>
                                    ) : (
                                        <>Confirm & Add All ({parsedPairs.length} words)</>
                                    )}
                                </button>
                            </div>

                            <div className="text-sm text-slate-500 mt-4">Mavjud guruhlarga qo'shish:</div>
                            <div className="space-y-2 mt-2 max-h-48 overflow-auto">
                                {userWords.filter(group => group.words.length + parsedPairs.length <= 30).length === 0 && (
                                    <p className="text-center text-slate-400 py-4">
                                        Qo'shish uchun bo'sh joyi bo'lgan guruh mavjud emas
                                    </p>
                                )}
                                {userWords
                                    .filter(group => group.words.length + parsedPairs.length <= 30)
                                    .map(group => (
                                        <div
                                            key={group._id}
                                            onClick={() => handleUpdateGroupWithWords(group)}
                                            className="p-3 border rounded-lg flex w-full justify-between items-center hover:bg-emerald-50 hover:border-emerald-300 cursor-pointer transition-all"
                                        >
                                            <div>
                                                <h3 className="font-medium text-slate-700">{group.title}</h3>
                                                <p className="text-xs text-slate-500">
                                                    {group.words.length} ta so'z + {parsedPairs.length} ta = {group.words.length + parsedPairs.length}/30
                                                </p>
                                            </div>
                                            <Plus className="w-4 h-4 text-emerald-600" />
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WordBatchMode;