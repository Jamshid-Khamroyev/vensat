import { create } from 'zustand'
import { WordRecord } from '../types'

type WordStore = {
  words: WordRecord[] | null
  addWords: (words: WordRecord[]) => void
}

export const useWordState = create<WordStore>()((set) => ({
    words: null,
    addWords: (words: WordRecord[]) => set(() => ({ words }))
})) 