import { createContext, useContext } from 'react';

/**
 * The hat the student's platypus is wearing. QuestProvider supplies it, so
 * every mascot in the app wears it without each screen passing it along;
 * anywhere outside (signing in, loading) the platypus is bare-headed.
 */
export const WornLookContext = createContext<string | null>(null);

export const useWornLook = (): string | null => useContext(WornLookContext);
