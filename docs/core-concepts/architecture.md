# Architecture

Jetpack CLI differs from other tools by being **manifest-driven** and **state-aware**.

## The Orchestrator

The core of Jetpack is the `Orchestrator`. It:
1.  Reads the parsed manifest.
2.  Builds a dependency graph.
3.  Executes installation steps in top-down order (System -> NPM -> Python).
4.  Generates configuration files.
5.  Updates the local state file `.jetpack-state.json`.

## State Management

Jetpack maintains a `.jetpack-state.json` file in your project root. This file tracks:
*   Installed packages (to avoid reinstalling).
*   Generated configuration files (for rollback).
*   Verification history.

## Rollback System

Because Jetpack tracks every action in its state file, it can accurately reverse them. The rollback system reads the state file and performs the inverse operation (e.g., `npm uninstall`, `rm .env`).

## AI Integration

Jetpack leverages GitHub Copilot CLI for intelligent automation:

1.  **Troubleshooter**: Parses error logs and context (OS, Node version) to prompt Copilot for specific fixes.
2.  **Resolver**: Intercepts dependency conflicts (e.g., `ERESOLVE`) and asks Copilot for compatible version sets.
3.  **Generator**: Analyzes codebase structure to infer dependencies and build steps for `generate-manifest`.
4.  **Risk Analyzer**: Evaluates the potential impact of rollback actions (data loss, system changes) before execution.

