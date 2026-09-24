import { useAssistant } from '@/context/assistant/AssistantProvider';
import { AssistantProductCard } from './AssistantProductCard';
import { cx } from '@/lib/utils';
import type { AssistantMessage as AssistantMessageModel } from '@/types/assistant';

/** One conversation bubble plus any frames the assistant surfaced with it. */
export function AssistantMessage({ message }: { message: AssistantMessageModel }) {
  const { close, send } = useAssistant();
  const isUser = message.role === 'user';

  return (
    <div className={cx('flex flex-col gap-2', isUser ? 'items-end' : 'items-start')}>
      <div
        className={cx(
          'max-w-[85%] whitespace-pre-wrap text-sm leading-relaxed',
          isUser
            ? 'rounded-2xl rounded-br-sm bg-ink-900 px-3.5 py-2.5 text-white'
            : message.failed
              ? 'rounded-2xl rounded-bl-sm bg-error-50 px-3.5 py-2.5 text-error-700'
              : 'text-ink-800',
        )}
      >
        {message.content}
      </div>

      {message.products.length > 0 ? (
        <div className="grid w-full gap-2">
          {message.products.map((product) => (
            <AssistantProductCard key={product.id} product={product} onNavigate={close} />
          ))}
        </div>
      ) : null}

      {!isUser && message.suggestions.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {message.suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => void send(suggestion)}
              className="rounded-full border border-ink-200 px-3 py-1 text-xs text-ink-600 transition-colors hover:border-primary-400 hover:text-primary-700"
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
