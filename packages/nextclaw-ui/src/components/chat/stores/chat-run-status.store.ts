import { create } from 'zustand';
import type { SessionRunStatus } from '@/lib/session-run-status';

export type ChatRunStatusSnapshot = {
  sessionRunStatusByKey: ReadonlyMap<string, SessionRunStatus>;
  isLocallyRunning: boolean;
  activeBackendRunId: string | null;
};

type ChatRunStatusStore = {
  snapshot: ChatRunStatusSnapshot;
  setSnapshot: (patch: Partial<ChatRunStatusSnapshot>) => void;
};

const initialSnapshot: ChatRunStatusSnapshot = {
  sessionRunStatusByKey: new Map(),
  isLocallyRunning: false,
  activeBackendRunId: null
};

export const useChatRunStatusStore = create<ChatRunStatusStore>((set) => ({
  snapshot: initialSnapshot,
  setSnapshot: (patch) =>
    set((state) => ({
      snapshot: {
        ...state.snapshot,
        ...patch
      }
    }))
}));
