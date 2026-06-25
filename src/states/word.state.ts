import { create } from 'zustand'
import { WordRecord } from '../types'

type WordStore = {
  words: WordRecord[] | null
  addWords: (words: WordRecord[]) => void
  result: any
  setResult: (result: any) => void
}

export const useWordState = create<WordStore>()((set) => ({
    words: null,
    addWords: (words: WordRecord[]) => set(() => ({ words })),
    result: null,
    setResult: (result: any) => set(() => ({ result }))
})) 