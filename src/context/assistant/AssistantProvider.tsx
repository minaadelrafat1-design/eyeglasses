import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useRecentlyViewed } from '@/context/recentlyViewed/RecentlyViewedProvider';
import { useWishlist } from '@/context/wishlist/WishlistProvider';
import { useCompare } from '@/context/compare/CompareProvider';
import { sanitizeMessage, sendAssistantTurn } from '@/services/assistantService';
import { emptyShopperContext } from '@/types/assistant';
import type {
  AssistantMessage,
  AssistantShopperContext,
  AssistantProductRef,
} from '@/types/assistant';
import type { FaceShape } from '@/types/ai';

/**
 * Shopping assistant conversation state.
 *
 * One ongoing conversation, restored from this browser only. Nothing is sent
 * to a server except the sanitized turns, and history can be cleared at any
 * time from the chat header.
 */

const STORAGE_KEY = 'vuera.assistant.conversation';
const MAX_STORED_MESSAGES = 40;

export interface AssistantContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  messages: AssistantMessage[];
  isThinking: boolean;
  send: (text: string) => Promise<void>;
  clear: () => void;
  /** Extra context the current page contributes (e.g. product being viewed). */
  setPageContext: (patch: Partial<AssistantShopperContext>) => void;
}

const AssistantContext = createContext<AssistantContextValue | null>(null);

function newId(): string {
  return `msg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadStored(): AssistantMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AssistantMessage[];
    return Array.isArray(parsed) ? parsed.slice(-MAX_STORED_MESSAGES) : [];
  } catch {
    return [];
  }
}

function persist(messages: AssistantMessage[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(messages.filter((m) => !m.pending).slice(-MAX_STORED_MESSAGES)),
    );
  } catch {
    // storage full or blocked — chat still works for this session
  }
}

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [pageContext, setPageContextState] = useState<Partial<AssistantShopperContext>>({});

  const { items: recentlyViewed } = useRecentlyViewed();
  const { items: wishlistItems } = useWishlist();
  const { items: compareItems } = useCompare();

  useEffect(() => {
    setMessages(loadStored());
  }, []);

  const messagesRef = useRef<AssistantMessage[]>([]);
  messagesRef.current = messages;

  const wishlistIds = wishlistItems;
  const compareIds = compareItems;


  const buildContext = useCallback((): AssistantShopperContext => {
    const stored =
      typeof window === 'undefined'
        ? null
        : (window.localStorage.getItem('vuera.face-shape') as FaceShape | null);

    return {
      ...emptyShopperContext(),
      faceShape: stored,
      recentlyViewedProductIds: recentlyViewed.slice(0, 8),
      wishlistProductIds: wishlistIds.slice(0, 12),
      compareProductIds: compareIds.slice(0, 4),
      ...pageContext,
    };
  }, [recentlyViewed, wishlistIds, compareIds, pageContext]);

  const send = useCallback(
    async (text: string) => {
      const content = sanitizeMessage(text);
      if (!content || isThinking) return;

      const userMessage: AssistantMessage = {
        id: newId(),
        role: 'user',
        content,
        products: [],
        suggestions: [],
        createdAt: new Date().toISOString(),
      };

      const history = [...messagesRef.current, userMessage];
      setMessages(history);
      persist(history);
      setIsThinking(true);

      try {
        const result = await sendAssistantTurn(history, buildContext());
        const reply: AssistantMessage = {
          id: newId(),
          role: 'assistant',
          content: result.reply,
          products: result.products as AssistantProductRef[],
          suggestions: result.suggestions,
          createdAt: result.respondedAt,
        };
        const next = [...history, reply];
        setMessages(next);
        persist(next);
      } catch (error) {
        const reply: AssistantMessage = {
          id: newId(),
          role: 'assistant',
          content:
            error instanceof Error
              ? error.message
              : 'The assistant is unavailable right now. Please try again shortly.',
          products: [],
          suggestions: [],
          createdAt: new Date().toISOString(),
          failed: true,
        };
        const next = [...history, reply];
        setMessages(next);
        persist(next);
      } finally {
        setIsThinking(false);
      }
    },
    [buildContext, isThinking],
  );

  const clear = useCallback(() => {
    setMessages([]);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // non-fatal
      }
    }
  }, []);

  const setPageContext = useCallback((patch: Partial<AssistantShopperContext>) => {
    setPageContextState((prev) => ({ ...prev, ...patch }));
  }, []);

  const value = useMemo<AssistantContextValue>(
    () => ({
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      toggle: () => setIsOpen((prev) => !prev),
      messages,
      isThinking,
      send,
      clear,
      setPageContext,
    }),
    [isOpen, messages, isThinking, send, clear, setPageContext],
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useAssistant(): AssistantContextValue {
  const context = useContext(AssistantContext);
  if (!context) throw new Error('useAssistant must be used within an AssistantProvider');
  return context;
}
