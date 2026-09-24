import { useEffect, useRef, useState, type FormEvent } from 'react';
import { MessageSquare, Send, Trash2, X } from 'lucide-react';
import { useAssistant } from '@/context/assistant/AssistantProvider';
import { AssistantMessage } from './AssistantMessage';
import { STARTER_PROMPTS } from '@/services/ai/assistantKnowledge';
import { Spinner } from '@/components/vui';

/** The conversation window: history, thinking state and composer. */
export function AssistantWindow() {
  const { isOpen, close, messages, isThinking, send, clear } = useAssistant();
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isThinking]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen, isThinking]);

  if (!isOpen) return null;

  function submit(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || isThinking) return;
    setDraft('');
    void send(text);
  }

  return (
    <div
      role="dialog"
      aria-label="Eyewear advisor"
      className="fixed inset-x-3 bottom-3 z-50 flex max-h-[80vh] flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-2xl animate-slide-up sm:inset-x-auto sm:right-6 sm:bottom-24 sm:h-[34rem] sm:w-[24rem]"
    >
      <header className="flex items-center justify-between border-b border-ink-100 bg-ink-950 px-4 py-3 text-white">
        <div>
          <p className="font-display text-lg leading-tight">Vuera Advisor</p>
          <p className="text-[11px] tracking-wide text-ink-300 uppercase">
            Personal eyewear guidance
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={clear}
            aria-label="Clear conversation"
            className="rounded-full p-1.5 text-ink-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Trash2 size={16} />
          </button>
          <button
            type="button"
            onClick={close}
            aria-label="Close assistant"
            className="rounded-full p-1.5 text-ink-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 rounded-full bg-primary-50 p-1.5 text-primary-700">
                <MessageSquare size={16} />
              </span>
              <p className="text-sm leading-relaxed text-ink-700">
                I can help you find frames, understand materials and sizing, and compare styles.
                Tell me what you are looking for.
              </p>
            </div>
            <div className="grid gap-1.5">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void send(prompt)}
                  className="rounded-xl border border-ink-200 px-3 py-2 text-left text-sm text-ink-700 transition-colors hover:border-primary-400 hover:text-primary-700"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => <AssistantMessage key={message.id} message={message} />)
        )}

        {isThinking ? (
          <div className="flex items-center gap-2 text-sm text-ink-500">
            <Spinner size={14} />
            Looking through the collection…
          </div>
        ) : null}
      </div>

      <form onSubmit={submit} className="border-t border-ink-100 p-3">
        <div className="flex items-end gap-2 rounded-xl border border-ink-200 px-3 py-2 focus-within:border-primary-400">
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) submit(event);
            }}
            rows={1}
            maxLength={1000}
            placeholder="Ask about frames, fit or lenses…"
            aria-label="Message the advisor"
            className="max-h-28 flex-1 resize-none bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
          />
          <button
            type="submit"
            disabled={isThinking || draft.trim().length === 0}
            aria-label="Send message"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white transition-colors hover:bg-primary-700 disabled:opacity-40"
          >
            <Send size={15} />
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-ink-400">
          Please don't share personal or payment details in chat.
        </p>
      </form>
    </div>
  );
}
