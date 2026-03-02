import { create } from "zustand"

interface I18nState {
  locale: string
  setLocale: (locale: string) => void
}

export const useI18nStore = create<I18nState>((set) => ({
  locale: "en",
  setLocale: (locale) => set({ locale }),
}))
