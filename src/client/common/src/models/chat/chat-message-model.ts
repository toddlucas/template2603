/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

/**
 * A single message in the conversation history.
 */
export interface ChatMessageModel {
    /**
     * The role of the message author: "user", "assistant", or "tool".
     */
    role: string;
    /**
     * The text content of the message. May be null or empty for assistant messages
     * that contained only tool calls and no visible text.
     */
    content?: string;
}
