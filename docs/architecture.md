# Architecture

## Overview

PaperCortex is structured as three layers:

1. **MCP Server Layer** -- Exposes tools via the Model Context Protocol for AI agent integration.
2. **Intelligence Layer** -- Embedding generation, classification, receipt extraction, and query answering.
3. **Data Layer** -- Paperless-ngx API client and local SQLite vector store.

## Components

### MCP Server (`src/mcp-server/`)

The entry point for all AI agent interactions. Implements the MCP standard using `@modelcontextprotocol/sdk` and communicates via stdio transport.

Each tool is implemented as a separate handler module under `src/mcp-server/tools/`.

### Embeddings (`src/embeddings/`)

- **ollama.ts** -- Client for the Ollama API. Handles embedding generation and LLM completions.
- **store.ts** -- SQLite-backed vector store using `better-sqlite3`. Stores document embeddings and supports cosine similarity search.

Current implementation uses brute-force search, which is performant up to ~100k documents. For larger archives, consider migrating to `sqlite-vss` or a dedicated vector database.

### Paperless Integration (`src/paperless/`)

- **client.ts** -- REST API client for Paperless-ngx. Supports document CRUD, search, tags, correspondents, and document types.
- **types.ts** -- TypeScript type definitions matching the Paperless-ngx API v3+ schema.

### Receipt Processing (`src/receipt/`)

- **extractor.ts** -- Uses LLM to extract structured data from receipt OCR text.
- **matcher.ts** -- Matches extracted receipts against bank CSV transaction exports.
- **datev.ts** -- Generates DATEV Buchungsstapel format CSV for German accounting software.

## Data Flow

```
Paperless-ngx  --(REST API)-->  PaperCortex  --(Ollama API)-->  Ollama
                                     |
                                     v
                              SQLite Vector DB
                                     |
                                     v
                              MCP Server (stdio)
                                     |
                                     v
                              Claude Code / AI Agents
```

## Security Model

- All data stays local -- no external API calls except to Paperless-ngx and Ollama (both self-hosted).
- API tokens are read from environment variables, never hardcoded.
- The SQLite database is stored on the local filesystem with configurable path.
- MCP Server communicates via stdio (no network port required for MCP).

## Future Considerations

- **Webhook support** -- Listen for Paperless-ngx webhooks to auto-process new documents.
- **Plugin system** -- Allow custom extractors and exporters.
- **Web dashboard** -- Optional UI for monitoring and manual review.
- **Multi-user** -- Support multiple Paperless-ngx instances and user isolation.
