# AI Context & Tooling Guide

This document is intended for AI agents (Claude, ChatGPT, Gemini, etc.) working on the **Korat_MVP** project.

## 📂 Project Structure

- **`src/`**: Main application source code.
- **`_ai_tools/`**: Dedicated directory for AI-assisted tooling and documentation.
  - **`_ai_tools/n8n-mcp/`**: Usage: MCP Server for n8n integration.
  - **`_ai_tools/n8n-skills/`**: Usage: **Reference Library**. Contains expert guides and patterns for n8n.
    - Path: `_ai_tools/n8n-skills/skills/`
    - **Instructions**: Before generating n8n workflows or fixing complex errors, checks these markdown files for best practices.

## 🛠️ n8n-skills Inventory

The `n8n-skills` directory contains the following expert guides:

1.  **n8n Expression Syntax** (`expression-syntax.md`)
2.  **n8n MCP Tools Expert** (`mcp-tools.md`)
3.  **n8n Workflow Patterns** (`workflow-patterns.md`)
4.  **n8n Validation Expert** (`validation.md`)
5.  **n8n Node Configuration** (`node-configuration.md`)
6.  **n8n Code JavaScript** (`code-node-js.md`)
7.  **n8n Code Python** (`code-node-python.md`)

## 🚀 How to use
When the user asks for n8n help, **always** verify if a relevant skill exists in `_ai_tools/n8n-skills` and read it to ensure high-quality, verified output.
