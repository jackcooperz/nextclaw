import { useChatSessionListStore } from '@/components/chat/stores/chat-session-list.store';
import { useChatInputStore } from '@/components/chat/stores/chat-input.store';
import type { ChatStreamManager } from '@/components/chat/managers/chat-stream.manager';
import type { ChatUiManager } from '@/components/chat/managers/chat-ui.manager';
import type { ChatSessionListSnapshot } from '@/components/chat/stores/chat-session-list.store';
import type { SetStateAction } from 'react';

export class ChatSessionListManager {
  constructor(
    private uiManager: ChatUiManager,
    private streamManager: ChatStreamManager
  ) {}

  private resolveUpdateValue = <T>(prev: T, next: SetStateAction<T>): T => {
    if (typeof next === 'function') {
      return (next as (value: T) => T)(prev);
    }
    return next;
  };

  syncSnapshot = (patch: Partial<ChatSessionListSnapshot>) => {
    useChatSessionListStore.getState().setSnapshot(patch);
  };

  setSelectedAgentId = (next: SetStateAction<string>) => {
    const prev = useChatSessionListStore.getState().snapshot.selectedAgentId;
    const value = this.resolveUpdateValue(prev, next);
    useChatSessionListStore.getState().setSnapshot({ selectedAgentId: value });
  };

  setSelectedSessionKey = (next: SetStateAction<string | null>) => {
    const prev = useChatSessionListStore.getState().snapshot.selectedSessionKey;
    const value = this.resolveUpdateValue(prev, next);
    useChatSessionListStore.getState().setSnapshot({ selectedSessionKey: value });
  };

  createSession = () => {
    const defaultSessionType = useChatInputStore.getState().snapshot.defaultSessionType || 'native';
    this.streamManager.resetStreamState();
    this.setSelectedSessionKey(null);
    useChatInputStore.getState().setSnapshot({ pendingSessionType: defaultSessionType });
    this.uiManager.goToChatRoot();
  };

  selectSession = (sessionKey: string) => {
    this.setSelectedSessionKey(sessionKey);
    this.uiManager.goToSession(sessionKey);
  };

  setQuery = (next: SetStateAction<string>) => {
    const prev = useChatSessionListStore.getState().snapshot.query;
    const value = this.resolveUpdateValue(prev, next);
    useChatSessionListStore.getState().setSnapshot({ query: value });
  };
}
