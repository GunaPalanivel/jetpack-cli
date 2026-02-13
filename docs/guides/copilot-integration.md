# GitHub Copilot Integration Guide

Jetpack CLI integrates with GitHub Copilot to provide intelligent assistance throughout the onboarding lifecycle. This guide explains how to enable and use these features.

## Prerequisites

To use AI features, you must have:

1.  **GitHub CLI (`gh`)** installed:
    ```bash
    winget install GitHub.cli
    # or
    brew install gh
    ```
2.  **Copilot Extension** installed and authenticated:
    ```bash
    gh extension install github/gh-copilot
    gh auth login --web
    ```

> [!NOTE]
> Jetpack automatically detects if `gh` is available. If not, AI features will gracefully degrade or fall back to manual modes.

## features

### 1. Smart Troubleshooter

When verifying your environment, Jetpack can analyze failures and suggest fixes.

**Usage:**
```bash
jetpack verify --copilot-troubleshoot
```

**What it does:**
- Analyzes error messages and exit codes.
- Contextualizes errors with your OS and Node version.
- Suggests specific terminal commands to fix the issue.

### 2. Manifest Generation

Generate a `.onboard.yaml` manifest for your project automatically by analyzing your codebase.

**Usage:**
```bash
jetpack init . --copilot-generate
```

**What it does:**
- Scans for `package.json`, `requirements.txt`, `Dockerfile`, etc.
- Infers project name, dependencies, and setup steps.
- Generates a valid YAML manifest.

### 3. Rollback Risk Analysis

Before undoing changes, assess the potential impact significantly reducing the risk of data loss.

**Usage:**
```bash
jetpack rollback --check-risks
```

**What it does:**
- Reviews the list of packages to be uninstalled.
- Identifies potential data directories (e.g., databases).
- Warns about irreversible changes (like SSH key removal).

### 4. Dependency Conflict Resolution

During installation, if version conflicts occur (e.g., `ERESOLVE` in npm), Copilot intervenes.

**Automatic Behavior:**
- Analyzes the conflict error.
- Proposes compatible version sets.
- Suggests flags like `--legacy-peer-deps` if safe.

### 5. Config Explanations

When generating `.env` files, Jetpack uses Copilot to explain what each variable does.

**Automatic Behavior:**
- Adds comments above each variable in `.env`.
- Generates secure defaults for distinct keys (e.g., `JWT_SECRET`).

### 6. Documentation Enhancement

Generated documentation includes AI-refined descriptions and troubleshooting tips specific to your project's technology stack.

## troubleshooting

**"GitHub CLI not found" error:**
Ensure `gh` is in your system PATH. Restart your terminal after installation.

**"No quota" error:**
Your GitHub account must have an active Copilot subscription.

**"Interactive mode" issues:**
Jetpack uses `gh copilot -p` for non-interactive prompting. Ensure your `gh-copilot` extension is up to date:
```bash
gh extension upgrade github/gh-copilot
```
