import { useState } from "react";
import { WordRecord, GroupWord } from "../types";
import WordImageMode from "./word-image-mode";
import WordBatchMode from "./word-batch-mode";
import WordsCards from "./words-cards";
import SelectWord from "../shared/select-word";
import SearchWord from "../shared/search-word";
import WordsHeader from "../shared/words-header";

interface PasteWordProps {
    handleAddWord: (words: { term: string; definition: string }[], title?: string) => void;
    handleUpdateGroup: (id: string, words?: { term: string; definition: string }[], title?: string) => void;
    handleDeleteGroup: (id: string) => void;
    userWords: GroupWord[];
    setView: (view: "landing" | "dashboard" | "create" | "testing" | "results" | "ai-gen" | "profile" | "words" | "stories" | "story-gen" | "story-reader" | "word-group") => void;
    setCurrentWordGroup: (group: { name: string; words: WordRecord[], _id: string } | null) => void;
}

const PasteWord = ({ handleAddWord, handleUpdateGroup, handleDeleteGroup, userWords, setView, setCurrentWordGroup }: PasteWordProps) => {
    const [batchMode, setBatchMode] = useState(false);
    const [selectedWord, setSelectedWord] = useState<WordRecord | null>(null);
    const [imageMode, setImageMode] = useState(false);

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <WordsHeader setBatchMode={setBatchMode} setImageMode={setImageMode} />

            {/* Search & Filter Bar */}
            <SearchWord />

            {/* Words Display */}
            <WordsCards 
                setCurrentWordGroup={setCurrentWordGroup}
                setView={setView}
                userWords={userWords}
                handleUpdateGroup={handleUpdateGroup}
                handleDeleteGroup={handleDeleteGroup}
            />

            {/* Word Detail Modal */}
            {selectedWord && (
                <SelectWord selectedWord={selectedWord} setSelectedWord={setSelectedWord} />
            )}

            {/* Batch Import Modal (same as before but with improved styling) */}
            {batchMode && (
                <WordBatchMode setBatchMode={setBatchMode} handleAddWord={handleAddWord} handleUpdateGroup={handleUpdateGroup} userWords={userWords}/>
            )}

            {/* Image OCR Modal */}
            {imageMode && (
                <WordImageMode handleAddWord={handleAddWord} handleUpdateGroup={handleUpdateGroup} setImageMode={setImageMode} userWords={userWords}/>
            )}
        </div>
    );
};

export default PasteWord;