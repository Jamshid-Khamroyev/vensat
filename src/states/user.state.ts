import { create } from 'zustand'
import { AppUser } from '../types'

type UserStore = {
  user: AppUser | null
  login: (user: AppUser) => void
  logout: () => void
}

export const useUserStore = create<UserStore>()((set) => ({
  user: null,
  login: (user: AppUser) => set((state) => ({ user })),
  logout: () => set((state) => ({ user: null })),
}))