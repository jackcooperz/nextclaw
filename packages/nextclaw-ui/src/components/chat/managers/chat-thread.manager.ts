import { deleteSession as deleteSessionApi } from '@/api/config';
import type { ChatStreamManager } from '@/components/chat/managers/chat-stream.manager';
import { useChatSessionListStore } from '@/components/chat/stores/chat-session-list.store';
import { useChatThreadStore } from '@/components/chat/stores/chat-thread.store';
import type { ChatSessionListManager } from '@/components/chat/managers/chat-session-list.manager';
import type { ChatUiManager } from '@/components/chat/managers/chat-ui.manager';
import type { ChatThreadSnapshot } from '@/components/chat/stores/chat-thread.store';
import { t } from '@/lib/i18n';

export type ChatThreadManagerActions = {
  refetchSessions: () => Promise<unknown>;
};

const noopAsync = async () => {};
export class ChatThreadManager {
  private actions: ChatThreadManagerActions = {
    refetchSessions: noopAsync
  };

  private isUserScrolling = false;

  constructor(
    private uiManager: ChatUiManager,
    private sessionListManager: ChatSessionListManager,
    private streamManager: ChatStreamManager
  ) {}

  bindActions = (patch: Partial<ChatThreadManagerActions>) => {
    this.actions = {
      ...this.actions,
      ...patch
    };
  };

  syncSnapshot = (patch: Partial<ChatThreadSnapshot>) => {
    useChatThreadStore.getState().setSnapshot(patch);
    this.tryAutoScroll();
  };

  deleteSession = () => {
    void this.deleteCurrentSession();
  };

  createSession = () => {
    this.sessionListManager.createSession();
  };

  goToProviders = () => {
    this.uiManager.goToProviders();
  };

  handleThreadScroll = () => {
    const element = useChatThreadStore.getState().snapshot.threadRef?.current;
    if (!element) {
      this.isUserScrolling = false;
      return;
    }
    const threshold = 50;
    const isNearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < threshold;
    this.isUserScrolling = !isNearBottom;
  };

  private tryAutoScroll = () => {
    const snapshot = useChatThreadStore.getState().snapshot;
    const element = snapshot.threadRef?.current;
    if (!element || this.isUserScrolling) {
      return;
    }
    element.scrollTop = element.scrollHeight;
  };

  private deleteCurrentSession = async () => {
    const selectedSessionKey = useChatSessionListStore.getState().snapshot.selectedSessionKey;
    if (!selectedSessionKey) {
      return;
    }
    const confirmed = await this.uiManager.confirm({
      title: t('chatDeleteSessionConfirm'),
      variant: 'destructive',
      confirmLabel: t('delete')
    });
    if (!confirmed) {
      return;
    }
    useChatThreadStore.getState().setSnapshot({ isDeletePending: true });
    try {
      await deleteSessionApi(selectedSessionKey);
      this.streamManager.resetStreamState();
      useChatSessionListStore.getState().setSnapshot({ selectedSessionKey: null });
      this.uiManager.goToChatRoot({ replace: true });
      await this.actions.refetchSessions();
    } finally {
      useChatThreadStore.getState().setSnapshot({ isDeletePending: false });
    }
  };
}
