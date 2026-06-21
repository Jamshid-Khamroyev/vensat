import { ArrowRight, Camera, CheckCircle, Loader2, Plus, X } from "lucide-react";
import { Dispatch, SetStateAction, useRef, useState } from "react";
import { toast } from "sonner";
import { GroupWord, UserWords } from "../types";
import { generateSentencesForWords } from "../services/geminiService";

interface WordImageModeProps {
    userWords: UserWords[]
    setImageMode: Dispatch<SetStateAction<boolean>>
    handleAddWord: (words: { term: string; definition: string }[], title?: string) => void;
    handleUpdateGroup: (id: string, words?: { term: string; definition: string }[], title?: string) => void; 
}

const WordImageMode = ({ handleAddWord, handleUpdateGroup, setImageMode, userWords }: WordImageModeProps) => {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [extractedText, setExtractedText] = useState('');
    const [isProcessingOCR, setIsProcessingOCR] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [isAddingWords, setIsAddingWords] = useState(false);
    const [translatedWords, setTranslatedWords] = useState<{ term: string; definition: string }[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Image OCR handlers
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Iltimos, rasm fayli tanlang');
            return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Rasm hajmi 5MB dan kichik bo\'lishi kerak');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (event) => {
            setSelectedImage(event.target?.result as string);
            toast.success('Rasm muvaffaqiyatli yuklandi');
        };
        reader.onerror = () => {
            toast.error('Rasmni yuklashda xatolik yuz berdi');
        };
        reader.readAsDataURL(file);
    };

    const processImageWithOCR = async () => {
        if (!selectedImage) {
            toast.error('Iltimos, avval rasm tanlang');
            return;
        }
        
        setIsProcessingOCR(true);
        const loadingToast = toast.loading('Rasm qayta ishlanmoqda...');
        
        try {
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
            
            if (!response.ok) {
                throw new Error(`OCR server xatosi: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.IsErroredOnProcessing) {
                throw new Error(data.ErrorMessage || 'OCR qayta ishlashda xatolik');
            }
            
            if (data.ParsedResults && data.ParsedResults.length > 0) {
                const parsedText = data.ParsedResults[0].ParsedText;
                
                if (!parsedText || parsedText.trim().length === 0) {
                    throw new Error('Rasmda matn topilmadi');
                }
                
                // Extract English words from the parsed text
                const words = parsedText
                    .replace(/[^a-zA-Z\s]/g, ' ')
                    .split(/\s+/)
                    .map(w => w.trim().toLowerCase())
                    .filter(w => w.length > 2 && w.length < 20);
                
                const uniqueWords = [...new Set(words)];
                
                if (uniqueWords.length === 0) {
                    throw new Error('Rasmda ingliz tilidagi so\'zlar topilmadi');
                }
                
                if (uniqueWords.length > 50) {
                    toast.warning(`${uniqueWords.length} ta so'z topildi, lekin maksimal 50 ta so'z qo'shish tavsiya etiladi`);
                }
                
                setExtractedText(uniqueWords.join('\n'));
                toast.success(`${uniqueWords.length} ta so'z aniqlandi`, { id: loadingToast });
            } else {
                throw new Error('Rasmda matn topilmadi');
            }
        } catch (error) {
            console.error('OCR error:', error);
            toast.error(error instanceof Error ? error.message : 'Rasmni qayta ishlashda xatolik', { id: loadingToast });
        } finally {
            setIsProcessingOCR(false);
        }
    };

    const translateExtractedText = async () => {
        if (!extractedText.trim()) {
            toast.error('Tarjima qilish uchun matn kerak');
            return;
        }
        
        if (isTranslating) return;
        
        setIsTranslating(true);
        const loadingToast = toast.loading('Tarjima qilinmoqda...');
        
        try {
            const wordsList = extractedText.split(/\r?\n/).filter(line => line.trim().length > 0);
            
            if (wordsList.length === 0) {
                throw new Error('Tarjima qilish uchun so\'zlar topilmadi');
            }
            
            const data = JSON.stringify({
                q: extractedText,
                source: 'en',
                target: 'uz'
            });

            const xhr = new XMLHttpRequest();
            xhr.withCredentials = false;

            const promise = new Promise<{ term: string; definition: string }[]>((resolve, reject) => {
                xhr.addEventListener('readystatechange', function () {
                    if (this.readyState === this.DONE) {
                        try {
                            if (this.status !== 200) {
                                throw new Error(`Tarjima server xatosi: ${this.status}`);
                            }
                            
                            const info = JSON.parse(this.responseText);
                            
                            if (!info.data || !info.data.translations || !info.data.translations.translatedText) {
                                throw new Error('Tarjima javobi noto\'g\'ri formatda');
                            }
                            
                            const translatedArray = info.data.translations.translatedText;
                            const finalResult = translatedArray[0];
                            const response = finalResult.split("\n");
                            
                            const finalWordsList = wordsList.map((word, index) => ({
                                term: word,
                                definition: response[index]?.trim() || "Tarjima topilmadi"
                            }));
                            
                            resolve(finalWordsList);
                        } catch (error) {
                            reject(error);
                        }
                    }
                });
                
                xhr.onerror = () => reject(new Error('Tarmoq xatosi'));
                xhr.ontimeout = () => reject(new Error('Tarjima vaqti tugadi'));
            });

            xhr.open('POST', 'https://deep-translate1.p.rapidapi.com/language/translate/v2');
            xhr.setRequestHeader('x-rapidapi-key', 'f3251f90e7msh179edc31ad1c822p139b02jsnaeb7fd4fb5cd');
            xhr.setRequestHeader('x-rapidapi-host', 'deep-translate1.p.rapidapi.com');
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.timeout = 30000; // 30 second timeout
            xhr.send(data);
            
            const result = await promise;
            setTranslatedWords(result);
            toast.success(`${result.length} ta so'z tarjima qilindi`, { id: loadingToast });
        } catch (error) {
            console.error("Tarjima xatosi:", error);
            toast.error(error instanceof Error ? error.message : 'Tarjimada xatolik yuz berdi', { id: loadingToast });
        } finally {
            setIsTranslating(false);
        }
    };

    const confirmImageWordsAdd = async () => {
        if (translatedWords.length === 0) {
            toast.error('Qo\'shish uchun so\'zlar mavjud emas');
            return;
        }
        
        setIsAddingWords(true);
        const loadingToast = toast.loading(`${translatedWords.length} ta so'z qo'shilmoqda...`);
        
        try {
            const terms = translatedWords.map(pair => pair.term);
            let generatedData;
            
            try {
                generatedData = await generateSentencesForWords(terms);
            } catch (error) {
                console.error('Sentence generation error:', error);
                toast.warning('Ba\'zi so\'zlar uchun gap yaratilmadi, keyin qo\'shishingiz mumkin');
                generatedData = [];
            }
            
            const sentenceMap = new Map(generatedData.map(item => [item.term, item.sentence]));
                    
            const wordsToAdd = translatedWords.map(word => ({
                term: word.term,
                definition: word.definition,
                sentence: sentenceMap.get(word.term) || `${word.term} uchun misol gap keyin qo'shiladi.`
            }));
        
            await handleAddWord(wordsToAdd, `OCR Import ${new Date().toLocaleDateString()}`);
            
            toast.success(`${translatedWords.length} ta so'z muvaffaqiyatli qo'shildi`, { id: loadingToast });
            
            // Reset states
            setImageMode(false);
            setSelectedImage(null);
            setExtractedText('');
            setTranslatedWords([]);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            console.error('Add words error:', error);
            toast.error('So\'zlarni qo\'shishda xatolik yuz berdi', { id: loadingToast });
        } finally {
            setIsAddingWords(false);
        }
    };

    const handleUpdateGroupWithWords = async (group: GroupWord) => {
        if (translatedWords.length === 0) {
            toast.error('Qo\'shish uchun so\'zlar mavjud emas');
            return;
        }
        
        const newWordCount = group.words.length + translatedWords.length;
        if (newWordCount > 30) {
            toast.error(`Bu guruhga ${translatedWords.length} ta so'z qo'shib bo'lmaydi (maksimal 30 ta so'z)`);
            return;
        }
        
        const loadingToast = toast.loading(`${translatedWords.length} ta so'z qo'shilmoqda...`);
        
        try {
            const concatedWords = [...group.words, ...translatedWords];
            await handleUpdateGroup(group._id, concatedWords);
            toast.success(`${translatedWords.length} ta so'z "${group.title}" guruhiga qo'shildi`, { id: loadingToast });
            setImageMode(false);
        } catch (error) {
            console.error('Update group error:', error);
            toast.error('Guruhga qo\'shishda xatolik', { id: loadingToast });
        }
    };

    const closeImageMode = () => {
        if (isProcessingOCR || isTranslating || isAddingWords) {
            toast.error('Iltimos, joriy jarayon tugashini kuting');
            return;
        }
        
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
                <div className="p-6 border-b sticky top-0 bg-white flex items-center justify-between z-10">
                    <div>
                        <h3 className="text-xl font-bold">Rasmdan So'zlarni Olish</h3>
                        <p className="text-sm text-slate-500 mt-1">Rasm yuklang → so'zlarni tahrirlang → tarjima qiling → saqlang</p>
                    </div>
                    <button 
                        onClick={closeImageMode} 
                        disabled={isProcessingOCR || isTranslating || isAddingWords}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>
                
                <div className="p-6 space-y-6">
                    {translatedWords.length === 0 ? (
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
                                    disabled={isProcessingOCR}
                                />
                                
                                {!selectedImage ? (
                                    <div 
                                        onClick={() => !isProcessingOCR && fileInputRef.current?.click()}
                                        className={`border-2 border-dashed border-slate-300 rounded-xl p-8 text-center transition-all ${
                                            !isProcessingOCR ? 'cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/50' : 'opacity-50 cursor-not-allowed'
                                        }`}
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
                                                if (!isProcessingOCR && !isTranslating) {
                                                    setSelectedImage(null);
                                                    setExtractedText('');
                                                } else {
                                                    toast.error('Jarayon davom etmoqda');
                                                }
                                            }}
                                            disabled={isProcessingOCR || isTranslating}
                                            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
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
                                    className="w-full py-3 bg-linear-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                                        disabled={isTranslating}
                                    />
                                    <p className="text-xs text-slate-500">
                                        {extractedText.split(/\r?\n/).filter(l => l.trim()).length} ta so'z
                                    </p>
                                </div>
                            )}

                            {/* Step 4: Translate Button */}
                            {extractedText && (
                                <button
                                    onClick={translateExtractedText}
                                    disabled={isTranslating}
                                    className="w-full py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isTranslating ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" /> Tarjima qilinmoqda...</>
                                    ) : (
                                        <><ArrowRight className="w-5 h-5" /> O'zbek tiliga tarjima qilish</>
                                    )}
                                </button>
                            )}
                        </>
                    ) : (
                        /* Step 5: Editable Translation Table - Only show when translations exist */
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                    Tarjima natijalari ({translatedWords.length} ta so'z)
                                </label>
                                <button
                                    onClick={() => {
                                        if (!isAddingWords) {
                                            setTranslatedWords([]);
                                            setExtractedText('');
                                            setSelectedImage(null);
                                            if (fileInputRef.current) {
                                                fileInputRef.current.value = '';
                                            }
                                            toast.info('Jarayon qayta boshlandi');
                                        } else {
                                            toast.error('Iltimos, joriy jarayon tugashini kuting');
                                        }
                                    }}
                                    disabled={isAddingWords}
                                    className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 disabled:opacity-50"
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
                                                            if (!isAddingWords) {
                                                                const newWords = [...translatedWords];
                                                                newWords[idx] = { ...word, definition: e.target.value };
                                                                setTranslatedWords(newWords);
                                                            }
                                                        }}
                                                        disabled={isAddingWords}
                                                        className="w-full px-2 py-1 border rounded-md text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100 transition-all disabled:bg-slate-50"
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
                                    disabled={isAddingWords}
                                    className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all disabled:opacity-50"
                                >
                                    Bekor qilish
                                </button>
                                <button 
                                    onClick={confirmImageWordsAdd} 
                                    disabled={isAddingWords}
                                    className="px-5 py-2.5 rounded-xl bg-linear-to-r from-emerald-500 to-teal-600 text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isAddingWords ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Qo'shilmoqda...</>
                                    ) : (
                                        <><Plus className="w-4 h-4" /> Yangi yaratish ({translatedWords.length} ta so'z)</>
                                    )}
                                </button>
                            </div>

                            {/* Existing groups section */}
                            <div className="text-sm text-slate-500 mt-2">Mavjud guruhlarga qo'shish:</div>
                            <div className="space-y-2 max-h-48 overflow-auto">
                                {userWords
                                    .filter(group => group.wordsCount + translatedWords.length <= 30)
                                    .map(group => (
                                        <div
                                            key={group._id}
                                            onClick={() => handleUpdateGroupWithWords({ ...group, words: translatedWords, category: 'image' })}
                                            className="p-3 border rounded-lg flex w-full justify-between items-center hover:bg-emerald-50 hover:border-emerald-300 cursor-pointer transition-all"
                                        >
                                            <div>
                                                <h3 className="font-medium text-slate-700">{group.title}</h3>
                                                <p className="text-xs text-slate-500">
                                                    {group.wordsCount} ta so'z + {translatedWords.length} ta = {group.wordsCount + translatedWords.length}/30
                                                </p>
                                            </div>
                                            <Plus className="w-4 h-4 text-emerald-600" />
                                        </div>
                                    ))}
                                {userWords.filter(group => group.wordsCount + translatedWords.length <= 30).length === 0 && (
                                    <p className="text-center text-slate-400 py-4">
                                        Qo'shish uchun bo'sh joyi bo'lgan guruh mavjud emas
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WordImageMode;