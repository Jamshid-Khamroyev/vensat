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
        setParsedPairs(pairs);
    };

   const confirmBatchAdd = async () => {
        if (parsedPairs.length > 30) {
            toast.error('Jami 30 ta so\'z qo\'shishingiz mumkin! Qolganini boshqa turkumga qo\'shasiz!');
            return;
        }
        if (isProcessing) return;
        
        setIsProcessing(true);
        
        try {
            const terms = parsedPairs.map(pair => pair.term);
            const generatedData = await generateSentencesForWords(terms);
            const sentenceMap = new Map(generatedData.map(item => [item.term, item.sentence]));

            const wordsToAdd = parsedPairs.map(pair => ({
                term: pair.term,
                definition: pair.definition,
                sentence: sentenceMap.get(pair.term) || `Example sentence for ${pair.term} will be added later.`
            }));

            await handleAddWord(wordsToAdd);
            setBatchMode(false);
            setBatchText('');
            setParsedPairs([]);
            toast.success(`${wordsToAdd.length} ta so'z muvaffaqiyatli qo'shildi!`);
        } catch (error) {
            console.error('Batch add failed:', error);
            toast.error('So\'zlarni qo\'shishda xatolik yuz berdi');
        } finally {
            setIsProcessing(false);
        }
        };
    return (
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
                                                    handleUpdateGroup(group._id, concatedWords as WordRecord[])
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
  )
}

export default WordBatchMode