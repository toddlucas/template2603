/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import type { ChangesetModel } from "../docs/changeset-model";

/**
 * The final result of a chat turn, returned after the stream closes.
 * 
 * @remarks
 * For streaming responses, the text content is delivered via SSE chunks.
 * This model is serialized as the final SSE event (event: done) so the client
 * can capture any changesets produced during tool execution.
 */
export interface ChatTurnResponse {
    /**
     * Any changesets created by the LLM's propose_edit tool calls during this turn.
     * Empty if the LLM produced only a text reply.
     */
    changesets: ChangesetModel[];
}
