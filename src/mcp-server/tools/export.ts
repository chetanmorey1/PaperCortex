/**
 * DATEV/CSV export tool for the PaperCortex MCP Server.
 *
 * Exports receipt data in accounting-compatible formats.
 */

import { createReceiptExtractor } from "../../receipt/extractor.js";
import { createDatevExporter } from "../../receipt/datev.js";
import type { ToolContext } from "../index.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExportArgs {
  readonly documentIds: readonly number[];
  readonly format?: "datev" | "csv";
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

/**
 * Handle a `papercortex_export` tool call.
 *
 * 1. Extract receipt data from all specified documents.
 * 2. Format as DATEV or generic CSV.
 * 3. Return the CSV content.
 *
 * TODO: Add file output option (save to disk)
 * TODO: Add date range filtering
 * TODO: Add DATEV header metadata (consultant/client numbers from config)
 */
export async function handleExport(
  ctx: ToolContext,
  args: Record<string, unknown>,
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  const { documentIds, format = "datev" } = args as unknown as ExportArgs;

  if (!documentIds || documentIds.length === 0) {
    return {
      content: [
        {
          type: "text",
          text: "Error: at least one document ID is required for export.",
        },
      ],
    };
  }

  // Extract receipt data from all documents
  const extractor = createReceiptExtractor({
    ollama: ctx.ollama,
    paperless: ctx.paperless,
  });

  const receipts = await extractor.extractBatch(documentIds);

  if (format === "datev") {
    // TODO: Read consultant/client numbers from configuration
    const exporter = createDatevExporter({
      consultantNumber: 0,
      clientNumber: 0,
    });

    const receiptsForExport = receipts.map((r) => ({
      documentId: r.documentId,
      vendor: r.vendor,
      date: r.date,
      totalAmount: r.totalAmount,
      taxRate: r.taxRate,
      category: r.category,
    }));

    const csv = exporter.generateCsv(receiptsForExport);

    return {
      content: [
        {
          type: "text",
          text:
            `DATEV export for ${receipts.length} receipt(s):\n\n` +
            "```csv\n" +
            csv +
            "\n```\n\n" +
            "Copy this CSV content into a file and import into your " +
            "DATEV-compatible accounting software.",
        },
      ],
    };
  }

  // Generic CSV format
  const header = "Document ID;Vendor;Date;Amount;Tax Rate;Tax Amount;Currency;Category";
  const rows = receipts.map(
    (r) =>
      `${r.documentId};${r.vendor};${r.date};${r.totalAmount.toFixed(2)};` +
      `${r.taxRate ?? ""};${r.taxAmount?.toFixed(2) ?? ""};${r.currency};${r.category ?? ""}`,
  );

  const csv = [header, ...rows].join("\n");

  return {
    content: [
      {
        type: "text",
        text:
          `CSV export for ${receipts.length} receipt(s):\n\n` +
          "```csv\n" +
          csv +
          "\n```",
      },
    ],
  };
}
