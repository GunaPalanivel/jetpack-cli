# 🚀 Quickstart Guide

Get started with **example-docs-project** in 5 minutes.

## Overview

Full-stack web application with comprehensive documentation

## Quick Setup

### 1. Install Dependencies

{{#if dependencies.system}}
System dependencies:
{{#each dependencies.system}}
- ``
{{/each}}
{{/if}}

{{#if dependencies.npm}}
npm packages:
```bash
npm install eslint, prettier, typescript
```
{{/if}}

{{#if dependencies.python}}
Python packages:
```bash
pip install black, pytest
```
{{/if}}

### 2. Configure Environment

{{#if environment.required}}
Set up required environment variables in `.env`:

{{#each environment.required}}
- ``
{{/each}}
{{/if}}


Configuration files created:
- **Environment**: .env (3 variables)
- **SSH Key**: ~/.ssh/id_ed25519
- **Git User**: Test User <test@example.com>


### 3. Verify Installation

Run verification checks to ensure everything is set up correctly:

```bash
jetpack verify
```


✅ All checks passed (3/3 successful)


## Next Steps

- Review [detailed setup instructions](../setup/dependencies.md)
- Check [troubleshooting guide](../troubleshooting/common-issues.md) if you encounter issues
- Run [health checks](../verification/health-checks.md) to validate your setup

---

> **Note for Windows users**: Use PowerShell or Command Prompt to run commands.
