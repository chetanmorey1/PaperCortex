/**
 * DATEV export formatter.
 *
 * Generates DATEV-compatible CSV files for import into German accounting
 * software (DATEV Unternehmen Online, lexoffice, sevDesk, etc.).
 *
 * Implements the DATEV "Buchungsstapel" (posting batch) format v7.0+.
 *
 * @see https://developer.datev.de/datev/platform/en/dtvf/formate
 *
 * @example
 * ```ts
 * const exporter = createDatevExporter({ consultantNumber: 12345, clientNumber: 67890 });
 * const csv = exporter.generateCsv(receiptData);
 * writeFileSync("./export.csv", csv);
 * ```
 */

import { stringify } from "csv-stringify/sync";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DatevConfig {
  /** DATEV consultant number (Beraternummer). */
  readonly consultantNumber: number;
  /** DATEV client number (Mandantennummer). */
  readonly clientNumber: number;
  /** Fiscal year start (1-12, default: 1 for January). */
  readonly fiscalYearStart?: number;
  /** Default debit account length (SKR03/SKR04). */
  readonly accountLength?: 4 | 5;
}

export interface DatevBookingEntry {
  readonly amount: number;
  readonly debitAccount: string;
  readonly creditAccount: string;
  readonly taxCode: string;
  readonly date: string;
  readonly description: string;
  readonly documentNumber: string;
  readonly costCenter?: string;
}

export interface ReceiptForExport {
  readonly documentId: number;
  readonly vendor: string;
  readonly date: string;
  readonly totalAmount: number;
  readonly taxRate: number | null;
  readonly category: string | null;
}

export interface DatevExporter {
  /** Generate DATEV CSV from receipt data. */
  generateCsv(receipts: readonly ReceiptForExport[]): string;

  /** Map a receipt to a DATEV booking entry. */
  mapToBooking(receipt: ReceiptForExport): DatevBookingEntry;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Map expense categories to SKR03 accounts.
 * TODO: Add SKR04 mapping support
 * TODO: Make configurable via user settings
 */
const SKR03_ACCOUNT_MAP: Record<string, string> = {
  office_supplies: "4930",
  travel: "4660",
  food: "4650",
  telephone: "4920",
  postage: "4910",
  insurance: "4360",
  rent: "4210",
  advertising: "4600",
  software: "4964",
  hardware: "4980",
  consulting: "4950",
  training: "4945",
  vehicle: "4500",
  default: "4900",
};

/**
 * Map tax rates to DATEV tax codes (Steuerschluessel).
 */
const TAX_CODE_MAP: Record<number, string> = {
  19: "9",   // 19% USt (standard)
  7: "8",    // 7% USt (reduced)
  0: "0",    // Tax-free
};

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

/**
 * Create a DATEV-format exporter for receipt data.
 *
 * TODO: Implement DATEV header line with metadata (consultant, client, date range)
 * TODO: Add validation for account numbers against SKR03/SKR04
 * TODO: Support DATEV XML format (Buchungsdaten v5.0)
 */
export function createDatevExporter(config: DatevConfig): DatevExporter {
  const {
    consultantNumber: _consultantNumber,
    clientNumber: _clientNumber,
    fiscalYearStart: _fiscalYearStart = 1,
    accountLength: _accountLength = 4,
  } = config;

  function mapToBooking(receipt: ReceiptForExport): DatevBookingEntry {
    const category = receipt.category ?? "default";
    const debitAccount =
      SKR03_ACCOUNT_MAP[category] ?? SKR03_ACCOUNT_MAP["default"];

    const taxRate = receipt.taxRate ?? 19;
    const taxCode = TAX_CODE_MAP[taxRate] ?? TAX_CODE_MAP[19];

    // Parse date to DD.MM format for DATEV
    const dateParts = receipt.date.split("-");
    const datevDate =
      dateParts.length === 3
        ? `${dateParts[2]}${dateParts[1]}`
        : receipt.date;

    return {
      amount: receipt.totalAmount,
      debitAccount,
      creditAccount: "1200", // Bank account (SKR03 default)
      taxCode,
      date: datevDate,
      description: receipt.vendor.slice(0, 60), // DATEV max 60 chars
      documentNumber: `PC-${receipt.documentId}`,
      costCenter: undefined,
    };
  }

  function generateCsv(receipts: readonly ReceiptForExport[]): string {
    const bookings = receipts.map(mapToBooking);

    // DATEV Buchungsstapel columns
    const rows = bookings.map((b) => [
      b.amount.toFixed(2).replace(".", ","), // Umsatz (amount with comma)
      "S",                                    // Soll/Haben (S = Soll/Debit)
      b.taxCode,                              // BU-Schluessel (tax code)
      b.debitAccount,                         // Gegenkonto (offset account)
      b.date,                                 // Belegdatum (document date)
      b.documentNumber,                       // Belegfeld 1 (document number)
      "",                                     // Belegfeld 2
      b.description,                          // Buchungstext (description)
      "",                                     // Umsatzsteuer-ID
      b.creditAccount,                        // Konto (account)
      b.costCenter ?? "",                     // Kostenstelle (cost center)
    ]);

    return stringify(rows, {
      delimiter: ";",
      quoted: true,
      record_delimiter: "\r\n",
    });
  }

  return { generateCsv, mapToBooking };
}
