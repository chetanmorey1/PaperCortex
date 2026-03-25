# PaperCortex -- Document Intelligence Skill

> A Claude Code skill for interacting with your Paperless-ngx document archive through AI-powered semantic search, classification, receipt extraction, and accounting export.

## Prerequisites

- PaperCortex MCP Server running (see project README)
- Paperless-ngx instance with API access
- Ollama with `qwen2.5:14b` and `nomic-embed-text` models

## Available Tools

### papercortex_search
Search documents by meaning, not just keywords.

```
Search for: "office lease agreements from last year"
Search for: "tax-relevant receipts over 500 EUR"
Search for: "correspondence with insurance companies"
```

### papercortex_classify
Auto-classify a document with AI-suggested tags, type, and correspondent.

```
Classify document #1234
Classify document #1234 and apply suggested tags
```

### papercortex_receipt
Extract structured data from receipt documents.

```
Extract receipt from document #5678
```

Returns: vendor, date, amounts, tax breakdown, line items, category.

### papercortex_query
Ask natural language questions about your document archive.

```
"How much did I spend on office supplies in Q1 2024?"
"Which invoices are still unpaid?"
"Summarize all contracts expiring this year"
```

### papercortex_export
Export receipt data for accounting software.

```
Export documents #100, #101, #102 as DATEV CSV
Export documents #200, #201 as generic CSV
```

## Workflow Examples

### Monthly Bookkeeping
1. Search for all receipts from the current month
2. Extract data from each receipt
3. Export as DATEV CSV
4. Import into accounting software

### Document Organization
1. Find unclassified documents (no tags)
2. Auto-classify each document
3. Review and approve suggested tags

### Expense Analysis
1. Query: "What were my top 5 expense categories last quarter?"
2. Drill into specific categories with follow-up queries
3. Export relevant receipts for documentation
