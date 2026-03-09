import { useChatRunStatusStore } from '@/components/chat/stores/chat-run-status.store';
import type { ChatRunStatusSnapshot } from '@/components/chat/stores/chat-run-status.store';

export class ChatRunStatusManager {
  syncSnapshot = (patch: Partial<ChatRunStatusSnapshot>) => {
    useChatRunStatusStore.getState().setSnapshot(patch);
  };
}
