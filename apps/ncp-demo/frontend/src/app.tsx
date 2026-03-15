import { useMemo } from "react";
import { getOrCreateSessionId } from "./lib/session";
import { useSessions } from "./hooks/use-sessions";
import { SessionsPanel } from "./components/sessions-panel";
import { ChatPanel } from "./components/chat-panel";

export function App() {
  const sessionId = useMemo(() => getOrCreateSessionId(), []);
  const sessions = useSessions();

  return (
    <div className="demo-shell">
      <SessionsPanel
        sessionId={sessionId}
        sessions={sessions.sessions}
        onRefresh={sessions.refresh}
      />
      <ChatPanel sessionId={sessionId} onRefresh={sessions.refresh} />
    </div>
  );
}
