/**
 * Assistant provider bootstrap.
 *
 * Kept separate from the `services/ai` barrel so importing the shopping
 * assistant never pulls in the try-on/auth modules (and their backend client)
 * on the storefront path.
 */
import { registerShoppingAssistantProvider, getShoppingAssistantProvider } from './assistantProvider';
import { lovableShoppingAssistantProvider } from './lovableAssistantProvider';

registerShoppingAssistantProvider(lovableShoppingAssistantProvider, { makeActive: true });

export { getShoppingAssistantProvider };
