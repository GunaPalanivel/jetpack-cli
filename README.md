# 🚀 Jetpack CLI — Zero-Config Developer Onboarding

> **Transform 3-week developer onboarding into 90-minute autonomous setup.**  
> Intelligent orchestration powered by GitHub Copilot CLI to setup, configure, and verify your development environment.

[![Node.js](https://img.shields.io/badge/Node.js-≥16-green.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Copilot CLI](https://img.shields.io/badge/Copilot_CLI-Powered-blueviolet.svg)](https://docs.github.com/en/copilot)
[![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen.svg)](#)

![Jetpack CLI Banner](docs/images/banner_placeholder.png)

---

## ⚡ Quick Start

### Prerequisites
- **Node.js ≥ 16** — [Install](https://nodejs.org/)
- **Git** — [Install](https://git-scm.com/)

### Install
```bash
# Clone & install
git clone https://github.com/GunaPalanivel/jetpack-cli.git
cd jetpack-cli
npm install

# Global install (makes `jetpack` available everywhere)
npm link
```

### 🎬 See It In Action
```bash
# Initialize a project from a repository
jetpack init https://github.com/StartInOne/next-starter

# Expected: Environment detected, dependencies installed, .env generated in <5 min
```

---

## 🚀 Usage

### `jetpack init` — Onboard a Project
Automatically detects the OS, installs system/npm/python dependencies, and generates config files.

```bash
# Standard initialization
jetpack init <repo-url>

# Initialize current directory with Copilot manifest generation
jetpack init . --copilot-generate

# Dry run (preview changes)
jetpack init <repo-url> --dry-run
```

### `jetpack generate-manifest` — AI Setup
Generate a comprehensive `.onboard.yaml` from your codebase using Copilot.

```bash
# Analyze repo and generate manifest
jetpack generate-manifest --copilot
```

### `jetpack verify` — Health Check
Ensures your environment matches the project requirements.

```bash
# Run all verification checks
jetpack verify

# Analyze failures with Copilot suggestions
jetpack verify --copilot-troubleshoot

# Verbose output for debugging
jetpack verify --verbose
```

### `jetpack rollback` — Undo Changes
Safely revert your system to its previous state.

```bash
# Analyze rollback risks with Copilot
jetpack rollback --check-risks

# Safe rollback (keeps packages, removes configs)
jetpack rollback

# Full rollback (uninstalls packages - CAUTION)
jetpack rollback --unsafe
```

---

## 🏗️ Architecture

```
bin/jetpack.js              ← CLI entry point
src/
├── cli/
│   ├── commands/
│   │   ├── init.js         ← Onboarding workflow
│   │   ├── verify.js       ← Environment health checks
│   │   └── rollback.js     ← State reversion engine
├── core/
│   ├── orchestrator.js     ← Dependency graph execution
│   ├── state-manager.js    ← JSON-based state tracking
│   ├── manifest-fetcher.js ← GitHub API integration
│   └── package-managers.js ← Cross-platform installers (brew, choco, apt)
├── detectors/
│   ├── env-analyzer.js     ← OS & Shell detection
│   └── manifest-parser.js  ← YAML schema validation
└── ui/
    └── logger.js           ← Interactive terminal UI
```

---

## ⚙️ Configuration

Create an `.onboard.yaml` file in your project root:

```yaml
name: my-project
dependencies:
  system: [nodejs, git, docker]
  npm: [typescript, eslint]
environment:
  required: [DATABASE_URL, API_KEY]
setup_steps:
  - name: Install dependencies
    command: npm install
ssh:
  generate: true
verification:
  checks:
    - type: http
      url: http://localhost:3000
```

See the [Configuration Guide](docs/reference/configuration.md) for the full schema.

---

## 🆚 Why Jetpack?

| Feature | Jetpack CLI | Manual Setup | Docker/DevContainers |
| :--- | :--- | :--- | :--- |
| **Native Performance** | ✅ Yes | ✅ Yes | ❌ No (Virtualization overhead) |
| **Setup Time** | **5 mins** | 1-2 Days | 15 mins (pulling images) |
| **Cross-Platform** | ✅ Windows/Mac/Linux | ❌ Manual steps vary | ✅ Yes |
| **IDE Agnostic** | ✅ Any Editor | ✅ Any Editor | ⚠️ VS Code focused |
| **State Awareness** | ✅ Tracks changes | ❌ No tracking | ❌ Ephemeral |
| **Rollback** | ✅ One command | ❌ Impossible | ✅ Kill container |

---

## 🤖 AI Capabilities

Jetpack CLI integrates **GitHub Copilot** to automate complex onboarding tasks:

| Feature | Command | Description |
| :--- | :--- | :--- |
| **Troubleshooting** | `verify --copilot-troubleshoot` | Analyzes verification failures and suggests fixes. |
| **Conflict Resolution** | `init` (Automatic) | Resolves dependency version conflicts and peer dep issues. |
| **Manifest Generation** | `generate-manifest --copilot` | Scans repo to create `.onboard.yaml` automatically. |
| **Risk Assessment** | `rollback --check-risks` | Identifies data loss risks before rolling back. |
| **Documentation** | `jetpack doc` (Automatic) | Adds AI-generated troubleshooting tips to docs. |
| **Config Explainer** | `config` (Automatic) | Generates explanations for `.env` variables. |

---

## 📖 Documentation

Full modular documentation is available in [`docs/`](docs/index.md):

| Guide | What's Inside |
| :--- | :--- |
| [**Getting Started**](docs/getting-started.md) | Installation, Quickstart, First Run |
| [**Core Concepts**](docs/core-concepts.md) | Architecture, Manifest Schema, State |
| [**Commands**](docs/commands.md) | `init`, `verify`, `rollback` flags & options |
| [**Troubleshooting**](docs/troubleshooting.md) | Common errors and solutions |

---

## 🧪 Testing

```bash
npm test              # Run all 60+ tests
npm run test:unit     # Run unit tests only
npm run test:rollback # Test rollback functionality
```

**63 tests** across unit, integration, and rollback suites ensure reliability.

---

## 📝 License

MIT © [Guna Palanivel](https://github.com/GunaPalanivel)

---

## 🏆 Project Stats
- **Zero-Config**: Auto-detects environment
- **3-Phase Rollback**: Documented, Verified, Reversible
- **Multi-Platform**: Windows, macOS, Ubuntu support
