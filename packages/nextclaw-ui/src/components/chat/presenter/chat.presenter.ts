import { ChatInputManager } from '@/components/chat/managers/chat-input.manager';
import { ChatRunStatusManager } from '@/components/chat/managers/chat-run-status.manager';
import { ChatSessionListManager } from '@/components/chat/managers/chat-session-list.manager';
import { ChatStreamManager } from '@/components/chat/managers/chat-stream.manager';
import { ChatThreadManager } from '@/components/chat/managers/chat-thread.manager';
import { ChatUiManager } from '@/components/chat/managers/chat-ui.manager';

export class ChatPresenter {
  chatUiManager = new ChatUiManager();
  chatStreamManager = new ChatStreamManager();
  chatInputManager = new ChatInputManager(this.chatUiManager, this.chatStreamManager);
  chatSessionListManager = new ChatSessionListManager(this.chatUiManager, this.chatStreamManager);
  chatRunStatusManager = new ChatRunStatusManager();
  chatThreadManager = new ChatThreadManager(this.chatUiManager, this.chatSessionListManager, this.chatStreamManager);
}
