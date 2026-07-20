import { create } from 'zustand';

interface LayoutState {
  isMobileChatOpen: boolean;
  setMobileChatOpen: (v: boolean) => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  isMobileChatOpen: false,
  setMobileChatOpen: (v) => set({ isMobileChatOpen: v }),
}));
