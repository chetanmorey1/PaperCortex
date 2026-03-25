/**
 * Bank CSV transaction matching for receipts.
 *
 * Matches extracted receipt data against bank CSV exports to reconcile
 * transactions. Supports common German bank export formats (Sparkasse,
 * Volksbank, ING, DKB).
 *
 * @example
 * ```ts
 * const matcher = createTransactionMatcher();
 * const bankTxns = await matcher.parseBankCsv("./bank_export.csv");
 * const matches = matcher.matchReceipts(receipts, bankTxns);
 * ```
 */

import { parse } from "csv-parse/sync";
import { readFileSync } from "node:fs";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BankTransaction {
  readonly date: string;
  readonly description: string;
  readonly amount: number;
  readonly currency: string;
  readonly iban: string | null;
  readonly bic: string | null;
  readonly reference: string | null;
  readonly rawLine: string;
}

export interface ReceiptMatchCandidate {
  readonly documentId: number;
  readonly vendor: string;
  readonly date: string;
  readonly totalAmount: number;
  readonly currency: string;
}

export interface MatchResult {
  readonly receipt: ReceiptMatchCandidate;
  readonly transaction: BankTransaction;
  readonly confidence: number;
  readonly matchReasons: readonly string[];
}

export interface UnmatchedItem {
  readonly type: "receipt" | "transaction";
  readonly item: ReceiptMatchCandidate | BankTransaction;
}

export interface MatchSummary {
  readonly matched: readonly MatchResult[];
  readonly unmatchedReceipts: readonly ReceiptMatchCandidate[];
  readonly unmatchedTransactions: readonly BankTransaction[];
  readonly matchRate: number;
}

export interface TransactionMatcher {
  /** Parse a bank CSV export file into structured transactions. */
  parseBankCsv(filePath: string, format?: BankCsvFormat): readonly BankTransaction[];

  /** Match receipts against bank transactions. */
  matchReceipts(
    receipts: readonly ReceiptMatchCandidate[],
    transactions: readonly BankTransaction[],
  ): MatchSummary;
}

export type BankCsvFormat = "auto" | "sparkasse" | "ing" | "dkb" | "volksbank" | "generic";

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

/**
 * Create a transaction matcher for bank CSV reconciliation.
 *
 * TODO: Add ML-based fuzzy matching for vendor names
 * TODO: Add support for MT940/CAMT.053 bank statement formats
 * TODO: Add date tolerance configuration (match within N days)
 */
export function createTransactionMatcher(): TransactionMatcher {
  /**
   * Parse bank CSV with auto-detected or specified format.
   */
  function parseBankCsv(
    filePath: string,
    format: BankCsvFormat = "auto",
  ): readonly BankTransaction[] {
    const raw = readFileSync(filePath, "utf-8");

    // TODO: Implement format auto-detection based on header patterns
    // TODO: Add support for different CSV delimiters (semicolon for German exports)
    // TODO: Handle different date formats (DD.MM.YYYY, YYYY-MM-DD, MM/DD/YYYY)

    const _format = format; // Acknowledge format parameter for future use

    const records = parse(raw, {
      columns: true,
      skip_empty_lines: true,
      delimiter: ";",
      relaxColumnCount: true,
    }) as Record<string, string>[];

    return records.map((record): BankTransaction => {
      // Generic column mapping -- override per format
      // TODO: Implement format-specific column mappings
      return {
        date: record["Buchungstag"] ?? record["Date"] ?? record["Datum"] ?? "",
        description:
          record["Verwendungszweck"] ??
          record["Description"] ??
          record["Buchungstext"] ??
          "",
        amount: parseFloat(
          (record["Betrag"] ?? record["Amount"] ?? "0")
            .replace(/\./g, "")
            .replace(",", "."),
        ),
        currency: record["Waehrung"] ?? record["Currency"] ?? "EUR",
        iban: record["IBAN"] ?? null,
        bic: record["BIC"] ?? null,
        reference: record["Kundenreferenz"] ?? record["Reference"] ?? null,
        rawLine: JSON.stringify(record),
      };
    });
  }

  /**
   * Match receipts against bank transactions by amount and date proximity.
   */
  function matchReceipts(
    receipts: readonly ReceiptMatchCandidate[],
    transactions: readonly BankTransaction[],
  ): MatchSummary {
    const matched: MatchResult[] = [];
    const matchedReceiptIds = new Set<number>();
    const matchedTxnIndices = new Set<number>();

    // TODO: Implement smarter matching with vendor name fuzzy matching
    // TODO: Add configurable date tolerance window
    // TODO: Handle split transactions (one receipt, multiple bank entries)

    for (const receipt of receipts) {
      let bestMatch: { index: number; confidence: number; reasons: string[] } | null =
        null;

      for (let i = 0; i < transactions.length; i++) {
        if (matchedTxnIndices.has(i)) continue;

        const txn = transactions[i];
        const reasons: string[] = [];
        let confidence = 0;

        // Amount matching (exact or close)
        const amountDiff = Math.abs(Math.abs(txn.amount) - receipt.totalAmount);
        if (amountDiff < 0.01) {
          confidence += 0.5;
          reasons.push("exact_amount_match");
        } else if (amountDiff < 1.0) {
          confidence += 0.3;
          reasons.push("close_amount_match");
        }

        // Date matching
        const receiptDate = new Date(receipt.date).getTime();
        const txnDate = new Date(txn.date).getTime();
        const daysDiff = Math.abs(receiptDate - txnDate) / (1000 * 60 * 60 * 24);

        if (daysDiff < 1) {
          confidence += 0.3;
          reasons.push("same_day");
        } else if (daysDiff < 3) {
          confidence += 0.15;
          reasons.push("within_3_days");
        } else if (daysDiff < 7) {
          confidence += 0.05;
          reasons.push("within_7_days");
        }

        // Vendor name in description
        if (
          txn.description
            .toLowerCase()
            .includes(receipt.vendor.toLowerCase().slice(0, 8))
        ) {
          confidence += 0.2;
          reasons.push("vendor_in_description");
        }

        if (
          confidence > 0.5 &&
          (!bestMatch || confidence > bestMatch.confidence)
        ) {
          bestMatch = { index: i, confidence, reasons };
        }
      }

      if (bestMatch) {
        matched.push({
          receipt,
          transaction: transactions[bestMatch.index],
          confidence: bestMatch.confidence,
          matchReasons: bestMatch.reasons,
        });
        matchedReceiptIds.add(receipt.documentId);
        matchedTxnIndices.add(bestMatch.index);
      }
    }

    const unmatchedReceipts = receipts.filter(
      (r) => !matchedReceiptIds.has(r.documentId),
    );
    const unmatchedTransactions = transactions.filter(
      (_, i) => !matchedTxnIndices.has(i),
    );

    return {
      matched,
      unmatchedReceipts,
      unmatchedTransactions,
      matchRate:
        receipts.length > 0 ? matched.length / receipts.length : 0,
    };
  }

  return { parseBankCsv, matchReceipts };
}
