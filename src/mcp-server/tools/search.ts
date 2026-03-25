/**
 * Semantic search tool for the PaperCortex MCP Server.
 *
 * Performs vector similarity search across all embedded documents,
 * returning the most semantically relevant results.
 */

import type { ToolContext } from "../index.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SearchArgs {
  readonly query: string;
  readonly limit?: number;
  readonly tags?: readonly string[];
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

/**
 * Handle a `papercortex_search` tool call.
 *
 * 1. Generate an embedding for the search query via Ollama.
 * 2. Search the local vector store for similar documents.
 * 3. Return ranked results with scores and metadata.
 *
 * TODO: Add hybrid search (combine vector + keyword for better recall)
 * TODO: Add date range filtering
 * TODO: Add result caching for repeated queries
 */
export async function handleSearch(
  ctx: ToolContext,
  args: Record<string, unknown>,
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  const { query, limit = 10, tags } = args as unknown as SearchArgs;

  if (!query || query.trim().length === 0) {
    return {
      content: [{ type: "text", text: "Error: search query cannot be empty." }],
    };
  }

  // Generate embedding for the query
  const queryEmbedding = await ctx.ollama.embed(query);

  // Search vector store
  const results = ctx.vectorStore.search(queryEmbedding.vector, {
    limit,
    minScore: 0.4,
    tagFilter: tags ? [...tags] : undefined,
  });

  if (results.length === 0) {
    return {
      content: [
        {
          type: "text",
          text: `No documents found matching "${query}". The vector store may need to be populated first.`,
        },
      ],
    };
  }

  // Format results
  const formatted = results
    .map(
      (r, i) =>
        `${i + 1}. [Document #${r.documentId}] (score: ${r.score.toFixed(3)})\n` +
        `   Title: ${r.title}\n` +
        `   Tags: ${r.tags.length > 0 ? r.tags.join(", ") : "none"}\n` +
        `   Preview: ${r.content.slice(0, 200).replace(/\n/g, " ")}...`,
    )
    .join("\n\n");

  return {
    content: [
      {
        type: "text",
        text: `Found ${results.length} documents matching "${query}":\n\n${formatted}`,
      },
    ],
  };
}
