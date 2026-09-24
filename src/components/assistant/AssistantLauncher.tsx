import { MessageSquare, X } from 'lucide-react';
import { useAssistant } from '@/context/assistant/AssistantProvider';
import { AssistantWindow } from './AssistantWindow';

/**
 * Floating advisor entry point. Mounted once in the root layout so the
 * conversation follows the customer across the whole storefront.
 */
export function AssistantLauncher() {
  const { isOpen, toggle } = useAssistant();

  return (
    <>
      <AssistantWindow />
      <button
        type="button"
        onClick={toggle}
        aria-label={isOpen ? 'Close eyewear advisor' : 'Open eyewear advisor'}
        aria-expanded={isOpen}
        className="fixed right-5 bottom-5 z-50 flex h-13 items-center gap-2 rounded-full bg-ink-950 px-5 text-sm font-medium text-white shadow-xl transition-transform duration-[var(--duration-base)] hover:scale-[1.03] hover:bg-ink-900"
      >
        {isOpen ? <X size={18} /> : <MessageSquare size={18} />}
        <span className="hidden sm:inline">{isOpen ? 'Close' : 'Ask the advisor'}</span>
      </button>
    </>
  );
}
