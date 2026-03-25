/**
 * Receipt extraction tool for the PaperCortex MCP Server.
 *
 * Extracts structured receipt data from Paperless-ngx documents
 * using local LLM analysis.
 */

import { createReceiptExtractor } from "../../receipt/extractor.js";
import type { ToolContext } from "../index.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReceiptArgs {
  readonly documentId: number;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

/**
 * Handle a `papercortex_receipt` tool call.
 *
 * 1. Fetch document from Paperless-ngx.
 * 2. Extract receipt data using LLM.
 * 3. Return structured receipt information.
 *
 * TODO: Cache extraction results to avoid re-processing
 * TODO: Add confidence thresholds and human review flags
 * TODO: Store extracted data back as Paperless-ngx custom fields
 */
export async function handleReceipt(
  ctx: ToolContext,
  args: Record<string, unknown>,
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  const { documentId } = args as unknown as ReceiptArgs;

  const extractor = createReceiptExtractor({
    ollama: ctx.ollama,
    paperless: ctx.paperless,
  });

  const receipt = await extractor.extract(documentId);

  // Format line items table
  const lineItemsTable =
    receipt.lineItems.length > 0
      ? receipt.lineItems
          .map(
            (item, i) =>
              `  ${i + 1}. ${item.description} | ` +
              `${item.quantity}x ${item.unitPrice.toFixed(2)} = ${item.totalPrice.toFixed(2)}`,
          )
          .join("\n")
      : "  No line items extracted";

  const output =
    `Receipt Data for Document #${documentId}:\n\n` +
    `Vendor: ${receipt.vendor}\n` +
    `Address: ${receipt.vendorAddress ?? "N/A"}\n` +
    `Tax ID: ${receipt.vendorTaxId ?? "N/A"}\n` +
    `Date: ${receipt.date}\n` +
    `Currency: ${receipt.currency}\n` +
    `\nAmounts:\n` +
    `  Subtotal: ${receipt.subtotal?.toFixed(2) ?? "N/A"}\n` +
    `  Tax (${receipt.taxRate ?? "?"}%): ${receipt.taxAmount?.toFixed(2) ?? "N/A"}\n` +
    `  Total: ${receipt.totalAmount.toFixed(2)}\n` +
    `\nPayment: ${receipt.paymentMethod ?? "N/A"}\n` +
    `Category: ${receipt.category ?? "uncategorized"}\n` +
    `Confidence: ${(receipt.confidence * 100).toFixed(0)}%\n` +
    `\nLine Items:\n${lineItemsTable}`;

  return { content: [{ type: "text", text: output }] };
}
