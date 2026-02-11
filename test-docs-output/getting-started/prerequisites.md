# 📋 Prerequisites

Before setting up **example-docs-project**, ensure your system meets these requirements.

## System Requirements

### Operating System

This project supports:
- **Windows** 10/11 (PowerShell 5.1+)
- **macOS** 11+ (Monterey or later)
- **Linux** (Ubuntu 20.04+, Debian 11+, or equivalent)

Your system: **Windows_NT**

### Required Software

The following software must be installed:

{{#if dependencies.system}}
| Type | Packages |
|------|----------|
| System | docker, nodejs, git |
| npm | eslint, prettier, typescript |
| Python | black, pytest |
{{/if}}

{{#if dependencies.npm}}
#### Node.js & npm

- **Node.js**: 16.x or higher
- **npm**: 8.x or higher

Check your versions:
```bash
node --version
npm --version
```
{{/if}}

{{#if dependencies.python}}
#### Python

- **Python**: 3.8 or higher
- **pip**: Latest version

Check your version:
```bash
python --version
pip --version
```
{{/if}}

## Environment Setup

{{#if environment.required}}
### Required Environment Variables

You'll need to configure these variables:

{{#each environment.required}}
- **``** - (Description needed)
{{/each}}
{{/if}}

{{#if environment.optional}}
### Optional Environment Variables

These variables are optional but recommended:

{{#each environment.optional}}
- **``** - (Description needed)
{{/each}}
{{/if}}

## Verification

After installing prerequisites, verify your setup:

```bash
# Check Node.js
node --version

# Check npm
npm --version

{{#if dependencies.system}}
# Check system dependencies
{{#each dependencies.system}}
 --version
{{/each}}
{{/if}}
```

## Troubleshooting

If you're missing any prerequisites:

- **Windows**: Use [Chocolatey](https://chocolatey.org/) or [Scoop](https://scoop.sh/)
- **macOS**: Use [Homebrew](https://brew.sh/)
- **Linux**: Use your distribution's package manager (apt, yum, dnf)

For detailed installation instructions, see [setup documentation](../setup/dependencies.md).

---

> **Note for Windows users**: Use PowerShell or Command Prompt to run commands.
