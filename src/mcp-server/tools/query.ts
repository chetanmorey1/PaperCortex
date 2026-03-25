/**
 * Natural language query tool for the PaperCortex MCP Server.
 *
 * Answers questions about documents using RAG (Retrieval-Augmented Generation):
 * retrieves relevant documents via semantic search, then generates an answer
 * using the local LLM with document context.
 */

import type { ToolContext } from "../index.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface QueryArgs {
  readonly question: string;
  readonly maxDocuments?: number;
}

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

const QUERY_SYSTEM_PROMPT = `You are a document analysis assistant. Answer the user's question based ONLY on the provided document excerpts. If the documents don't contain enough information to answer, say so clearly.

Be precise with numbers, dates, and amounts. Cite document IDs when referencing specific documents.`;

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

/**
 * Handle a `papercortex_query` tool call.
 *
 * Uses RAG (Retrieval-Augmented Generation):
 * 1. Embed the question and retrieve relevant documents.
 * 2. Build a context from retrieved documents.
 * 3. Generate an answer using the local LLM.
 *
 * TODO: Add conversation history for follow-up questions
 * TODO: Add source citation with page numbers
 * TODO: Implement query decomposition for complex questions
 */
export async function handleQuery(
  ctx: ToolContext,
  args: Record<string, unknown>,
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  const { question, maxDocuments = 5 } = args as unknown as QueryArgs;

  if (!question || question.trim().length === 0) {
    return {
      content: [{ type: "text", text: "Error: question cannot be empty." }],
    };
  }

  // Step 1: Retrieve relevant documents
  const queryEmbedding = await ctx.ollama.embed(question);
  const relevantDocs = ctx.vectorStore.search(queryEmbedding.vector, {
    limit: maxDocuments,
    minScore: 0.3,
  });

  if (relevantDocs.length === 0) {
    return {
      content: [
        {
          type: "text",
          text:
            `I couldn't find any relevant documents to answer: "${question}"\n\n` +
            "The vector store may need to be populated first, or your documents " +
            "may not contain information related to this question.",
        },
      ],
    };
  }

  // Step 2: Build context from retrieved documents
  const context = relevantDocs
    .map(
      (doc) =>
        `--- Document #${doc.documentId}: ${doc.title} (relevance: ${doc.score.toFixed(2)}) ---\n` +
        doc.content.slice(0, 2000),
    )
    .join("\n\n");

  // Step 3: Generate answer with context
  const prompt =
    `Based on the following documents, answer this question: "${question}"\n\n` +
    `Documents:\n${context}`;

  const completion = await ctx.ollama.complete(prompt, QUERY_SYSTEM_PROMPT);

  const sourcesNote = relevantDocs
    .map(
      (doc) =>
        `  - Document #${doc.documentId}: ${doc.title} (score: ${doc.score.toFixed(2)})`,
    )
    .join("\n");

  return {
    content: [
      {
        type: "text",
        text:
          `${completion.text}\n\n` +
          `---\nSources (${relevantDocs.length} documents):\n${sourcesNote}`,
      },
    ],
  };
}
