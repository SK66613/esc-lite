import { AIMessage, type AIConversationMessage } from './AIMessage';

export function AIChat({ messages, loading }: { messages: AIConversationMessage[]; loading: boolean }) {
  return <div className="ai-chat">{messages.map((message) => <AIMessage key={message.id} message={message} />)}{loading && <div className="ai-message assistant"><small>Escalita AI</small><p>Анализирую бизнес и подбираю структуру…</p></div>}</div>;
}
