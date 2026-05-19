import { ArrowRight, Camera, CheckCircle, Loader2, Plus, X } from "lucide-react";
import { Dispatch, SetStateAction, useRef, useState } from "react";
import { toast } from "sonner";
import { GroupWord } from "../types";
import { generateSentencesForWords } from "../services/geminiService";

interface WordImageModeProps {
    userWords: GroupWord[]
    setImageMode: Dispatch<SetStateAction<boolean>>
    handleAddWord: (words: { term: string; definition: string }[], title?: string) => void;
    handleUpdateGroup: (id: string, words?: { term: string; definition: string }[], title?: string) => void; 
}

const WordImageMode = ({ handleAddWord, handleUpdateGroup, setImageMode, userWords }: WordImageModeProps) => {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [extractedText, setExtractedText] = useState('');
    const [isProcessingOCR, setIsProcessingOCR] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [translatedWords, setTranslatedWords] = useState<{ term: string; definition: string }[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                        const response = finalResult.split("\n");
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
            const terms = translatedWords.map(pair => pair.term);
            const generatedData = await generateSentencesForWords(terms);
            const sentenceMap = new Map(generatedData.map(item => [item.term, item.sentence]));
                    
            const wordsToAdd = translatedWords.map(word => ({
                term: word.term,
                definition: word.definition,
                sentence: sentenceMap.get(word.term) || `Example sentence for ${word.term} will be added later.`
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
  )
}

export default WordImageMode