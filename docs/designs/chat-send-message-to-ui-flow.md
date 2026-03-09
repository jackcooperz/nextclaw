# 发送消息到前端展示的链路

## 链路概览

1. **用户点击发送**  
   `ChatInputBar` → `ChatInputManager.send()`（清空 draft、可选 `goToSession`）→ `ChatStreamManager.sendMessage(payload)`。

2. **入队与执行发送**  
   `ChatStreamRuntimeController.sendMessage()` → `flowController.executeSendMessagePolicy(payload)`：  
   - 若当前未在发送：`runSend(item)`；  
   - 否则按策略入队或先 interrupt 再发。  
   `runSend` 内部：`flowController.executeSendPendingMessage(item)` → `executeStreamRun(...)`。

3. **乐观更新**  
   在 `StreamRunController.execute()` 里：  
   - `activateRun()`：写 `activeRunRef`；  
   - `applyRunStartState()`：**在这里** `setters.setOptimisticUserEvent(optimisticUserEvent)`，并设 `isSending` 等；  
   - 随后 `await openStream(...)` 才发起请求。  
   乐观用户消息在「打开流」之前就写入 `ChatStreamRuntimeController.state$`。

4. **React 消费流状态**  
   `ChatPage` 使用 `useChatStreamController(..., streamManager)`，内部是 `useSyncExternalStore(manager.subscribe, manager.getSnapshot, ...)`。  
   `state$.next()` 会同步触发 subscribe 回调，React 安排重渲染，`getSnapshot()` 得到含 `optimisticUserEvent` 的新 state。

5. **合并事件与同步到 Thread**  
   `ChatPage` 中：  
   - `mergedEvents = useMergedEvents({ historyEvents, optimisticUserEvent, streamingSessionEvents, streamingAssistantText, ... })`；  
   - 在 `useEffect` 里 `presenter.chatThreadManager.syncSnapshot({ mergedEvents, ... })`，把合并结果写入 `useChatThreadStore`。

6. **会话区展示**  
   `ChatConversationPanel` 用 `useChatThreadStore((state) => state.snapshot)`，渲染 `snapshot.mergedEvents`（含乐观用户消息 + 历史 + 流式事件）。

## 为何可能“没有任何展示/闪烁”

- **乐观更新与打开的时序**：若在 `applyRunStartState()` 之后立刻 `await openStream()`，且流或 React 调度在同一 tick 内完成首包/渲染，乐观更新可能被后续的 `onSessionEvent(user)` 清掉（`setOptimisticUserEvent(null)`），或首帧未渲染就进入流式状态，看起来像“没闪一下”。
- **store 更新在 effect 里**：`mergedEvents` 更新后，要等 `useEffect` 跑完才 `syncSnapshot` 到 thread store，再触发 `ChatConversationPanel` 重绘；若中间有异常或依赖未正确触发 effect，也会看不到。
- **无当前 session 时**：发送前会 `goToSession(sessionKey)` 再 `sendMessage`；若路由/`selectedSessionKey` 未及时更新，或 `showWelcome`/`hideEmptyHint` 逻辑导致仍显示欢迎或空白，也会看不到消息。

## 修复思路

- 在 `applyRunStartState()` 之后、`await openStream()` 之前 **让出一帧**（例如 `await new Promise(r => queueMicrotask(r))`），确保 React 有机会先根据 `state$` 的更新完成一次渲染，再发起请求，这样至少会有一帧乐观展示。
