/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import type { ChatMessageModel } from "./chat-message-model";

/**
 * A single chat turn request from the client.
 */
export interface ChatTurnRequest {
    /**
     * The AI session ID. Caller-generated; ties all changesets produced in a session together.
     */
    sessionId: string;
    /**
     * The full conversation history, including the new user message as the last entry.
     * The client owns and maintains this list across turns.
     */
    messages: ChatMessageModel[];
    /**
     * Document IDs to load as context for this turn.
     */
    documentIds: string[];
}
