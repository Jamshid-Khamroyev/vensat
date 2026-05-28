import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";

type DSATCategory = 'information-ideas' | 'craft-structure' | 'expression-ideas' | 'standard-conventions';

interface ManualTestProps {
    setView: (view: any) => void;
    user: { _id: string; displayName: string; email: string } | null;
    dbTests: any[];
    setDbTests: (tests: any[]) => void;
    selectedTime: number;
    setSelectedTime: (time: number) => void;
    isProcessing: boolean;
    setIsProcessing: (processing: boolean) => void;
}

const ManualTest = ({ selectedTime, dbTests, setDbTests, setSelectedTime, setView, user, isProcessing, setIsProcessing }: ManualTestProps) => {
    const [testText, setTestText] = useState("");
    const [keyText, setKeyText] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<DSATCategory>('information-ideas');
    const [preview, setPreview] = useState<any>(null);

    const generateTitle = () => `DSAT ${["Practice","Assessment","Quiz"][Math.floor(Math.random()*3)]} - ${new Date().toLocaleDateString()}`;

    const parseQuestions = (text: string) => {
        const questions: any[] = [];
        const cleanText = text.replace(/ANSWER\s*KEY\s*:.*$/gis, '');
        const blocks = cleanText.split(/\n(?=\d+\.\s+)/);
        
        for (const block of blocks) {
            const numMatch = block.match(/^(\d+)\.\s+(.+?)(?=\n\d+\.|$)/s);
            if (!numMatch) continue;
            
            let remainingText = numMatch[2].trim();
            let passage = "";
            let questionStem = "";
            const options: string[] = [];
            
            // 1. Yulduzchalar ichidagi savol matnini topish
            const questionMatch = remainingText.match(/\*(.+?)\*/s);
            
            if (questionMatch) {
                // Yulduzchalar topildi - savol matni yulduzchalar ichida
                questionStem = questionMatch[1].trim();
                // Yulduzchalardan oldingi qism passage
                passage = remainingText.substring(0, questionMatch.index!).trim();
                // Yulduzchalardan keyingi qism answer choices
                const afterQuestion = remainingText.substring(questionMatch.index! + questionMatch[0].length).trim();
                
                // Answer choices ni parse qilish
                const optMatches = afterQuestion.matchAll(/\n?([A-D])[\.\)]\s+(.+?)(?=\n[A-D][\.\)]|\n\n|$)/gs);
                for (const m of optMatches) {
                    options.push(m[2].trim());
                }
            } else {
                // Fallback: eski usul - yulduzchalar bo'lmasa
                const qMatch = remainingText.match(/((?:Which|What|Based|According)[^?!]*[?])/i);
                if (qMatch) {
                    passage = remainingText.substring(0, qMatch.index!).trim();
                    questionStem = qMatch[0];
                } else if (remainingText.includes('?')) {
                    const idx = remainingText.lastIndexOf('?');
                    let start = remainingText.lastIndexOf('.', idx) + 1;
                    if (start < 0 || start > idx) start = 0;
                    questionStem = remainingText.substring(start, idx + 1).trim();
                    passage = remainingText.substring(0, start).trim();
                } else {
                    passage = remainingText;
                    questionStem = "Select the best answer";
                }
                
                // Optionlarni topish
                const optMatches = block.matchAll(/\n([A-D])[\.\)]\s+(.+?)(?=\n[A-D][\.\)]|\n\n|$)/gs);
                for (const m of optMatches) options.push(m[2].trim());
            }
            
            // Agar passage bo'sh bo'lsa, placeholder qo'yish
            if (!passage) passage = " ";
            
            if (options.length >= 2) {
                while(options.length < 4) options.push(`Option ${String.fromCharCode(65+options.length)}`);
                questions.push({
                    text: passage,  // Yulduzchalarsiz passage
                    question: questionStem,  // Yulduzchalarsiz savol matni
                    options: options.slice(0,4),
                    correctAnswerIndex: 0,
                    difficulty: "medium",
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

const handlePreview = async () => {
    if (!testText.trim()) return toast.error("Please enter test content");
    setIsProcessing(true);

    const questions = parseQuestions(testText);
    if (questions.length === 0) {
        toast.error("No valid questions found. Use: 1. Passage\\n\\nQuestion?\\n\\nA) Opt\\nB) Opt\\nC) Opt\\nD) Opt");
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
    
    setPreview({ data: { title: generateTitle(), category: selectedCategory, timeLimit: selectedTime, questions: finalQuestions }, preview: finalQuestions });
    setIsProcessing(false);
};

const handleSave = async () => {
    if (!preview) return
    setIsProcessing(true);
    try {
        const res = await fetch("/api/tests", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...preview.data, creatorId: user?._id })
        });
        if (!res.ok) throw new Error(await res.text());
        const saved = await res.json();
        setDbTests([saved, ...dbTests]);
        toast.success("Test saved!");
        setPreview(null);
        setTestText("");
        setKeyText("");
        setView('dashboard');
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
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-6">
                    {!preview ? (
                        <>
                            <div className="flex justify-between items-center mb-4">
                                <h1 className="text-2xl font-bold">DSAT Test Importer</h1>
                                <button onClick={loadExample} className="text-sm text-blue-600 hover:underline">📋 Load Example</button>
                            </div>
                            
                            <textarea value={testText} onChange={e => setTestText(e.target.value)} 
                                className="w-full h-80 p-3 border rounded-lg font-mono text-sm mb-4 resize-none"
                                placeholder="1. Passage text...&#10;&#10;Question stem?&#10;A) Option 1&#10;B) Option 2&#10;C) Option 3&#10;D) Option 4" />
                            
                            <textarea value={keyText} onChange={e => setKeyText(e.target.value)} 
                                className="w-full h-16 p-3 border rounded-lg font-mono text-sm mb-4 resize-none"
                                placeholder="Answer key: 1-B,2-C,3-A (optional)" />
                            
                            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value as DSATCategory)} 
                                className="w-full p-3 border rounded-lg mb-4 bg-white">
                                <option value="information-ideas">Information and Ideas</option>
                                <option value="craft-structure">Craft and Structure</option>
                                <option value="expression-ideas">Expression of Ideas</option>
                                <option value="standard-conventions">Standard English Conventions</option>
                            </select>
                            
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg mb-4">
                                <span>Time (minutes)</span>
                                <div className="flex gap-2">
                                    <button onClick={() => setSelectedTime(Math.max(1, selectedTime-5))} className="w-8 h-8 bg-white border rounded">-</button>
                                    <input type="number" value={selectedTime} onChange={e => setSelectedTime(Math.max(1, parseInt(e.target.value) || 0))} className="w-20 text-center border rounded p-1" />
                                    <button onClick={() => setSelectedTime(Math.min(180, selectedTime+5))} className="w-8 h-8 bg-white border rounded">+</button>
                                </div>
                            </div>
                            
                            <div className="flex gap-3">
                                <button onClick={() => setView('dashboard')} className="flex-1 py-2 bg-slate-100 rounded-lg">Cancel</button>
                                <button onClick={handlePreview} disabled={isProcessing} className="flex-[2] py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">
                                    {isProcessing ? "⏳" : "Preview"}
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <h2 className="text-xl font-bold mb-4">Preview ({preview.data.questions.length} questions)</h2>
                            <div className="bg-slate-50 rounded-lg p-4 max-h-96 overflow-y-auto mb-4">
                                {preview.data.questions.map((q: any, i: number) => (
                                    <div key={i} className="mb-6 border-b pb-4">
                                        <p className="font-semibold">Q{i+1}: {q.question}</p>
                                        {q.text && q.text !== " " && <p className="text-sm text-slate-600 mt-1">{q.text.substring(0,150)}...</p>}
                                        <div className="mt-2">
                                            {q.options.map((opt: string, oi: number) => (
                                                <p key={oi} className={`text-sm ml-4 ${oi === q.correctAnswerIndex ? "text-green-600 font-bold" : "text-slate-700"}`}>
                                                    {String.fromCharCode(65+oi)}) {opt} {oi === q.correctAnswerIndex && "✓"}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setPreview(null)} className="flex-1 py-2 bg-slate-100 rounded-lg">Edit</button>
                                <button onClick={handleSave} disabled={isProcessing} className="flex-[2] py-2 bg-green-600 text-white rounded-lg disabled:opacity-50">
                                    {isProcessing ? "⏳" : "Save Test"}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default ManualTest;