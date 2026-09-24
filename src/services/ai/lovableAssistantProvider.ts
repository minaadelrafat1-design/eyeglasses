/**
 * Lovable AI shopping assistant provider. Delegates to the server function so
 * the API key, system prompt and catalog tools never reach the browser.
 */
import { askShoppingAssistant } from '@/lib/ai/shoppingAssistant.functions';
import type { ShoppingAssistantProvider } from './assistantProvider';

export const lovableShoppingAssistantProvider: ShoppingAssistantProvider = {
  id: 'lovable-ai',
  label: 'Lovable AI advisor',
  async respond(request) {
    return askShoppingAssistant({ data: request });
  },
};
