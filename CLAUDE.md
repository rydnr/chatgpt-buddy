# GEMINI.md - Project Constitution & Guide

This document is the primary guide for any AI agent assisting in the development of **ChatGPT-buddy**. Its purpose is to ensure consistency, maintain architectural integrity, and provide a single source of truth for the project's design and principles.

**As an AI assistant, you MUST adhere to the principles and structures outlined in this document for all code generation, refactoring, and architectural discussions.**

## 1. High-Level Project Goal

ChatGPT-buddy is a tool that allows external clients to interact with specific browser tabs programmatically. It consists of two main components:
1.  A **Node.js Server** that acts as a secure gateway and message router.
2.  A **Browser Extension** that receives commands from the server and executes them within a target browser tab.

The core workflow is: **Client -> Server -> Browser Extension -> Target Tab**.

There are other secondary components: WebUI, clients and language SDKs.

## 2. Core Principles

-   **TypeScript First**: All code, for both the server and the extension, MUST be written in TypeScript. Use strong typing and interfaces wherever possible.
-   **Security is Paramount**: The connection between the server and the extension must be secure. The server must validate all incoming client requests. Never trust user-controlled input.
-   **Modularity and Separation of Concerns**: Each component (server, extension background, content script) has a distinct role. Do not mix logic.
-   **Robust Error Handling**: Every asynchronous operation, API call, and message handler must include comprehensive `try...catch` blocks and clear error reporting.
-   **Structured Communication**: All communication between components MUST use the JSON-based message protocol defined in this document.
-   **Clarity and Documentation**: Generate code that is clean, readable, and includes TSDoc comments for all public functions, classes, and interfaces.
-   **Adopt DDD, Hexagonal architecture and Event-Driven Architecture**: Enforce strict separation of the domain, infrastructure and application layers. All interactions come, by definition, from primary ports, implemented in the infrastructure layer. They gather all information and build an meaningful event, that is then passed to the `accept(event)` method of the `application`. The `application` instance is injected into the adapter. 

## Memories

- Never use markdown but for the top-level README files. Always use org-mode.
- `private` methods are not recommended. Use `protected` instead.
- Scripts should use `/usr/bin/env bash`, never `/bin/bash`.