import { create } from 'zustand';
import type { SessionEntryView } from '@/api/types';

export type ChatSessionListSnapshot = {
  sessions: SessionEntryView[];
  selectedSessionKey: string | null;
  selectedAgentId: string;
  query: string;
  isLoading: boolean;
};

type ChatSessionListStore = {
  snapshot: ChatSessionListSnapshot;
  setSnapshot: (patch: Partial<ChatSessionListSnapshot>) => void;
};

const initialSnapshot: ChatSessionListSnapshot = {
  sessions: [],
  selectedSessionKey: null,
  selectedAgentId: 'main',
  query: '',
  isLoading: false
};

export const useChatSessionListStore = create<ChatSessionListStore>((set) => ({
  snapshot: initialSnapshot,
  setSnapshot: (patch) =>
    set((state) => ({
      snapshot: {
        ...state.snapshot,
        ...patch
      }
    }))
}));
