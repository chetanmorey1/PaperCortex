/**
 * Auto-classification tool for the PaperCortex MCP Server.
 *
 * Uses local LLM to analyze document content and suggest appropriate
 * tags, document types, and correspondents.
 */

import type { ToolContext } from "../index.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ClassifyArgs {
  readonly documentId: number;
  readonly applyTags?: boolean;
}

interface ClassificationResult {
  readonly suggestedTags: readonly string[];
  readonly suggestedType: string | null;
  readonly suggestedCorrespondent: string | null;
  readonly summary: string;
  readonly language: string;
  readonly confidence: number;
}

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

const CLASSIFY_SYSTEM_PROMPT = `You are a document classification assistant. Analyze the document content and provide structured classification.

Respond with valid JSON only:
{
  "suggestedTags": ["tag1", "tag2"],
  "suggestedType": "invoice|contract|receipt|letter|report|tax_document|bank_statement|insurance|warranty|manual|other",
  "suggestedCorrespondent": "Company or person name",
  "summary": "One sentence summary",
  "language": "ISO 639-1 code",
  "confidence": 0.0 to 1.0
}`;

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

/**
 * Handle a `papercortex_classify` tool call.
 *
 * 1. Fetch document content from Paperless-ngx.
 * 2. Send content to Ollama for classification.
 * 3. Optionally apply suggested tags back to Paperless-ngx.
 *
 * TODO: Match suggested tags against existing Paperless-ngx tags
 * TODO: Create new tags automatically when confidence is high
 * TODO: Learn from user corrections to improve classification
 */
export async function handleClassify(
  ctx: ToolContext,
  args: Record<string, unknown>,
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  const { documentId, applyTags = false } = args as unknown as ClassifyArgs;

  // Fetch document from Paperless-ngx
  const document = await ctx.paperless.getDocument(documentId);

  if (!document.content || document.content.trim().length === 0) {
    return {
      content: [
        {
          type: "text",
          text: `Document #${documentId} has no text content. OCR may not have completed.`,
        },
      ],
    };
  }

  // Classify using Ollama
  const prompt = `Classify this document:\n\nTitle: ${document.title}\n\nContent:\n${document.content.slice(0, 4000)}`;
  const completion = await ctx.ollama.complete(prompt, CLASSIFY_SYSTEM_PROMPT);

  let classification: ClassificationResult;
  try {
    classification = JSON.parse(completion.text) as ClassificationResult;
  } catch {
    return {
      content: [
        {
          type: "text",
          text: `Classification failed: LLM did not return valid JSON.\nRaw response: ${completion.text.slice(0, 500)}`,
        },
      ],
    };
  }

  // Optionally apply tags
  let appliedNote = "";
  if (applyTags && classification.suggestedTags.length > 0) {
    // TODO: Look up tag IDs from Paperless-ngx, create missing tags
    appliedNote =
      "\n\nNote: Tag application is not yet implemented. " +
      "Tags need to be matched against existing Paperless-ngx tags.";
  }

  const output =
    `Classification for Document #${documentId} "${document.title}":\n\n` +
    `Type: ${classification.suggestedType ?? "unknown"}\n` +
    `Correspondent: ${classification.suggestedCorrespondent ?? "unknown"}\n` +
    `Tags: ${classification.suggestedTags.join(", ") || "none"}\n` +
    `Language: ${classification.language}\n` +
    `Summary: ${classification.summary}\n` +
    `Confidence: ${(classification.confidence * 100).toFixed(0)}%` +
    appliedNote;

  return { content: [{ type: "text", text: output }] };
}
