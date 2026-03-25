/**
 * Receipt data extraction using local LLM via Ollama.
 *
 * Extracts structured data from receipt documents: vendor, date, amounts,
 * tax breakdown, line items, and payment method. Uses the Paperless-ngx
 * OCR content and enriches it with LLM analysis.
 *
 * @example
 * ```ts
 * const extractor = createReceiptExtractor({ ollama, paperless });
 * const receipt = await extractor.extract(documentId);
 * console.log(receipt.vendor, receipt.totalAmount, receipt.taxAmount);
 * ```
 */

import type { OllamaClient } from "../embeddings/ollama.js";
import type { PaperlessClient } from "../paperless/client.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReceiptData {
  readonly documentId: number;
  readonly vendor: string;
  readonly vendorAddress: string | null;
  readonly vendorTaxId: string | null;
  readonly date: string;
  readonly currency: string;
  readonly subtotal: number | null;
  readonly taxRate: number | null;
  readonly taxAmount: number | null;
  readonly totalAmount: number;
  readonly paymentMethod: string | null;
  readonly lineItems: readonly LineItem[];
  readonly category: string | null;
  readonly confidence: number;
  readonly rawText: string;
}

export interface LineItem {
  readonly description: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly totalPrice: number;
  readonly taxRate: number | null;
}

export interface ReceiptExtractorConfig {
  readonly ollama: OllamaClient;
  readonly paperless: PaperlessClient;
}

export interface ReceiptExtractor {
  /** Extract structured receipt data from a Paperless-ngx document. */
  extract(documentId: number): Promise<ReceiptData>;

  /** Batch-extract receipts from multiple documents. */
  extractBatch(documentIds: readonly number[]): Promise<readonly ReceiptData[]>;
}

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

const EXTRACTION_SYSTEM_PROMPT = `You are a receipt data extraction assistant. Given the OCR text of a receipt, extract structured data in JSON format.

Extract the following fields:
- vendor: Company/store name
- vendorAddress: Full address if visible
- vendorTaxId: Tax ID / VAT number if visible (e.g., USt-IdNr, Steuernummer)
- date: Date in ISO 8601 format (YYYY-MM-DD)
- currency: ISO 4217 currency code (e.g., EUR, USD)
- subtotal: Amount before tax (null if not distinguishable)
- taxRate: Tax percentage as decimal (e.g., 19 for 19%)
- taxAmount: Tax amount
- totalAmount: Total amount including tax
- paymentMethod: Payment method if visible (cash, card, etc.)
- lineItems: Array of { description, quantity, unitPrice, totalPrice, taxRate }
- category: Suggested expense category (office_supplies, travel, food, etc.)
- confidence: Your confidence in the extraction (0.0 to 1.0)

Respond ONLY with valid JSON. No explanation, no markdown.`;

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

/**
 * Create a receipt data extractor.
 *
 * TODO: Add support for image-based receipts (pass images to multimodal LLM)
 * TODO: Add receipt template matching for common vendors
 * TODO: Add currency conversion support
 */
export function createReceiptExtractor(
  config: ReceiptExtractorConfig,
): ReceiptExtractor {
  const { ollama, paperless } = config;

  async function extractSingle(documentId: number): Promise<ReceiptData> {
    // Fetch the document content from Paperless-ngx
    const document = await paperless.getDocument(documentId);
    const ocrText = document.content;

    if (!ocrText || ocrText.trim().length === 0) {
      throw new Error(
        `Document ${documentId} has no OCR content. Ensure Paperless-ngx has processed the document.`,
      );
    }

    // Send to Ollama for structured extraction
    const prompt = `Extract receipt data from the following OCR text:\n\n---\n${ocrText}\n---`;
    const completion = await ollama.complete(prompt, EXTRACTION_SYSTEM_PROMPT);

    // Parse LLM response
    // TODO: Add robust JSON extraction (handle markdown code blocks, partial JSON)
    // TODO: Validate against Zod schema for type safety
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(completion.text);
    } catch {
      throw new Error(
        `Failed to parse receipt extraction result for document ${documentId}. ` +
        `LLM response was not valid JSON.`,
      );
    }

    return {
      documentId,
      vendor: String(parsed.vendor ?? "Unknown"),
      vendorAddress: parsed.vendorAddress ? String(parsed.vendorAddress) : null,
      vendorTaxId: parsed.vendorTaxId ? String(parsed.vendorTaxId) : null,
      date: String(parsed.date ?? new Date().toISOString().split("T")[0]),
      currency: String(parsed.currency ?? "EUR"),
      subtotal: typeof parsed.subtotal === "number" ? parsed.subtotal : null,
      taxRate: typeof parsed.taxRate === "number" ? parsed.taxRate : null,
      taxAmount: typeof parsed.taxAmount === "number" ? parsed.taxAmount : null,
      totalAmount: typeof parsed.totalAmount === "number" ? parsed.totalAmount : 0,
      paymentMethod: parsed.paymentMethod ? String(parsed.paymentMethod) : null,
      lineItems: Array.isArray(parsed.lineItems)
        ? parsed.lineItems.map((item: Record<string, unknown>) => ({
            description: String(item.description ?? ""),
            quantity: Number(item.quantity ?? 1),
            unitPrice: Number(item.unitPrice ?? 0),
            totalPrice: Number(item.totalPrice ?? 0),
            taxRate: typeof item.taxRate === "number" ? item.taxRate : null,
          }))
        : [],
      category: parsed.category ? String(parsed.category) : null,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
      rawText: ocrText,
    };
  }

  return {
    extract: extractSingle,

    async extractBatch(documentIds) {
      // TODO: Add concurrency control (process N at a time)
      // TODO: Add progress reporting callback
      const results: ReceiptData[] = [];
      for (const id of documentIds) {
        const result = await extractSingle(id);
        results.push(result);
      }
      return results;
    },
  };
}
