import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { ChatPresenter } from '@/components/chat/presenter/chat.presenter';

const ChatPresenterContext = createContext<ChatPresenter | null>(null);

type ChatPresenterProviderProps = {
  presenter: ChatPresenter;
  children: ReactNode;
};

export function ChatPresenterProvider({ presenter, children }: ChatPresenterProviderProps) {
  return <ChatPresenterContext.Provider value={presenter}>{children}</ChatPresenterContext.Provider>;
}

export function usePresenter(): ChatPresenter {
  const presenter = useContext(ChatPresenterContext);
  if (!presenter) {
    throw new Error('usePresenter must be used inside ChatPresenterProvider');
  }
  return presenter;
}

// Backward-compatible alias with the name from project notes.
export const usePresneter = usePresenter;
