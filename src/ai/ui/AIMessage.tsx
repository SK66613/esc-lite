export interface AIConversationMessage { id: string; role: 'user' | 'assistant'; text: string }

export function AIMessage({ message }: { message: AIConversationMessage }) {
  return <div className={`ai-message ${message.role}`}><small>{message.role === 'assistant' ? 'Escalita AI' : 'Вы'}</small><p>{message.text}</p></div>;
}
