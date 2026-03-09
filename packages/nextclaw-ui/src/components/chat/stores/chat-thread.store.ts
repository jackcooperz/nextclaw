import { create } from 'zustand';
import type { MutableRefObject } from 'react';
import type { SessionEventView } from '@/api/types';
import type { ChatModelOption } from '@/components/chat/chat-input.types';

export type ChatThreadSnapshot = {
  isProviderStateResolved: boolean;
  modelOptions: ChatModelOption[];
  sessionTypeUnavailable: boolean;
  sessionTypeUnavailableMessage?: string | null;
  selectedSessionKey: string | null;
  sessionDisplayName?: string;
  canDeleteSession: boolean;
  isDeletePending: boolean;
  threadRef: MutableRefObject<HTMLDivElement | null> | null;
  isHistoryLoading: boolean;
  mergedEvents: SessionEventView[];
  isSending: boolean;
  isAwaitingAssistantOutput: boolean;
  streamingAssistantText: string;
};

type ChatThreadStore = {
  snapshot: ChatThreadSnapshot;
  setSnapshot: (patch: Partial<ChatThreadSnapshot>) => void;
};

const initialSnapshot: ChatThreadSnapshot = {
  isProviderStateResolved: false,
  modelOptions: [],
  sessionTypeUnavailable: false,
  sessionTypeUnavailableMessage: null,
  selectedSessionKey: null,
  sessionDisplayName: undefined,
  canDeleteSession: false,
  isDeletePending: false,
  threadRef: null,
  isHistoryLoading: false,
  mergedEvents: [],
  isSending: false,
  isAwaitingAssistantOutput: false,
  streamingAssistantText: ''
};

export const useChatThreadStore = create<ChatThreadStore>((set) => ({
  snapshot: initialSnapshot,
  setSnapshot: (patch) =>
    set((state) => ({
      snapshot: {
        ...state.snapshot,
        ...patch
      }
    }))
}));
