# 🚀 Jetpack CLI

**Zero-config developer onboarding orchestrator powered by GitHub Copilot CLI**

Transform 3-week developer onboarding into 90-minute autonomous setup.

---

## 📖 Overview

Jetpack CLI automates developer environment setup using intelligent orchestration. It reads a `.onboard.yaml` manifest from your repository and automatically:

- 🔍 Detects your system environment (OS, shell, package managers)
- 📦 Installs required dependencies and tools
- ⚙️ Generates configuration files (.env, SSH keys)
- 📚 Creates personalized documentation
- ✅ Verifies everything is correctly installed

**Built with:** Node.js, Commander.js, GitHub Copilot CLI integration

---

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/GunaPalanivel/jetpack-cli.git
cd jetpack-cli

# Install dependencies
npm install

# Link CLI globally
npm link

# Verify installation
jetpack --help
```

### Usage

#### Initialize Onboarding

```bash
# Basic usage - fetches manifest from GitHub repository
jetpack init https://github.com/owner/repo

# With custom manifest filename
jetpack init https://github.com/owner/repo --manifest custom-onboard.yaml

# Skip cache - always fetch fresh manifest
jetpack init https://github.com/owner/repo --no-cache

# Dry run (see what would be installed)
jetpack init https://github.com/owner/repo --dry-run

# Skip dependency installation
jetpack init https://github.com/owner/repo --skip-install
```

**Note:** The `init` command will:

1. Fetch the `.onboard.yaml` manifest from the GitHub repository
2. Try multiple filenames: `.onboard.yaml`, `.onboard.yml`, `onboard.yaml`
3. Cache the manifest locally for 24 hours (use `--no-cache` to bypass)
4. Parse and validate the manifest
5. Execute the onboarding workflow

#### Verify Installation

```bash
jetpack verify
```

#### Rollback Changes

Jetpack includes a comprehensive rollback system to undo all changes made during onboarding:

```bash
# Preview what will be rolled back (dry run)
jetpack rollback --dry-run

# Rollback everything (safe operations only)
jetpack rollback

# Rollback specific components
jetpack rollback --partial=docs,config

# Rollback including package uninstallation (use with caution)
jetpack rollback --unsafe

# Force rollback despite warnings
jetpack rollback --force
```

**What Gets Rolled Back:**

- ✅ **Documentation** - Removes `.jetpack/` directory
- ✅ **Configuration** - Restores `.env` from backup, removes generated files
- ✅ **Git Config** - Restores original git configuration values
- ✅ **SSH Keys** - Removes generated SSH keys
- ✅ **Dependencies** - Uninstalls packages (requires `--unsafe` flag)

**Rollback Options:**

- `--dry-run` - Preview changes without executing
- `--partial=<phases>` - Rollback specific phases (docs, config, git, ssh, dependencies)
- `--unsafe` - Allow package uninstallation (disabled by default for safety)
- `--force` - Skip safety checks and continue despite warnings

**Examples:**

```bash
# Safe rollback (keeps packages, removes configs and docs)
jetpack rollback

# Rollback only documentation
jetpack rollback --partial=docs

# Preview full rollback including packages
jetpack rollback --unsafe --dry-run

# Complete system cleanup (removes everything)
jetpack rollback --unsafe
```

**Safety Features:**

- Packages are **NOT** uninstalled by default (requires `--unsafe`)
- Original `.env` is restored from backup (not deleted)
- Git config values are restored to their original state
- Warnings are shown for packages with dependencies
- Dry-run mode lets you preview changes before executing
- State file is only cleared after successful full rollback



---

## 🏗️ Project Structure

```
jetpack-cli/
├── bin/
│   └── jetpack.js                  # CLI entry point
├── src/
│   ├── cli/
│   │   └── commands/
│   │       ├── init.js             # Init command (with GitHub fetch)
│   │       ├── verify.js           # Verify command
│   │       └── rollback.js         # Rollback command
│   ├── core/
│   │   ├── orchestrator.js         # Main workflow engine
│   │   ├── state-manager.js        # State tracking
│   │   ├── manifest-fetcher.js     # GitHub manifest fetcher (Phase 2)
│   │   ├── manifest-cache.js       # Cache management (Phase 2)
│   │   ├── package-managers.js     # Package manager utils (Phase 3)
│   │   ├── dependency-installer.js # Dependency installation (Phase 3)
│   │   ├── setup-executor.js       # Setup step executor (Phase 4)
│   │   ├── config-generator.js     # ✨ NEW: Configuration orchestrator (Phase 5)
│   │   └── config-utils.js         # ✨ NEW: Config utilities (Phase 5)
│   ├── detectors/
│   │   ├── env-analyzer.js         # Environment detection
│   │   └── manifest-parser.js      # .onboard.yaml parser (updated for ssh/git)
│   └── ui/
│       └── logger.js               # Formatted output
├── tests/
│   ├── manifest-parser.test.js     # Parser test suite (8 tests)
│   ├── edge-cases.test.js          # Edge case tests (5 tests)
│   ├── manifest-fetcher.test.js    # Fetcher tests (14 tests)
│   ├── dependency-installer.test.js # Dependency tests (5 tests)
│   ├── setup-executor.test.js      # Setup executor tests (12 tests)
│   ├── integration-setup.test.js   # Setup integration (5 tests)
│   ├── integration-verification.test.js # Verification tests (20 tests)
│   └── config-generator.test.js    # Config generation tests (3 tests)
├── templates/
│   ├── basic-example.yaml         # Simple manifest example
│   ├── complex-example.yaml       # Advanced manifest example
│   ├── complete-config.yaml       # Complete example with ssh/git
│   ├── verification-basic.yaml    # Verification checks example
│   └── verification-advanced.yaml # Advanced verification example
├── package.json
└── README.md
```

---

## 📝 Manifest Parser API

The manifest parser (`src/detectors/manifest-parser.js`) provides functions to parse and validate `.onboard.yaml` files.

### Usage

```javascript
const manifestParser = require("./src/detectors/manifest-parser");

// Parse from file path
const manifest = manifestParser.parseManifest(".onboard.yaml");

// Parse from string (useful for remote fetching)
const yamlContent = "..."; // YAML content as string
const manifest = manifestParser.parseManifestFromString(yamlContent);

// Access parsed data
console.log(manifest.name); // Project name
console.log(manifest.description); // Project description
console.log(manifest.dependencies.system); // System dependencies
console.log(manifest.dependencies.npm); // NPM packages
console.log(manifest.dependencies.python); // Python packages
console.log(manifest.environment.required); // Required env vars
console.log(manifest.environment.optional); // Optional env vars
console.log(manifest.setupSteps); // Setup commands
console.log(manifest.ssh); // SSH key configuration (Phase 5)
console.log(manifest.git); // Git configuration (Phase 5)
```

### Supported Features

✅ **Schema Validation** - Validates required fields and structure  
✅ **Multi-Language Support** - System, NPM, and Python dependencies  
✅ **Environment Variables** - Required and optional configurations  
✅ **Setup Steps** - Multi-step setup commands with descriptions  
✅ **SSH Configuration** - SSH key generation settings (Phase 5)  
✅ **Git Configuration** - Git user identity settings (Phase 5)  
✅ **Error Handling** - Clear, actionable error messages

See `templates/basic-example.yaml`, `templates/complex-example.yaml`, and `templates/complete-config.yaml` for manifest examples.

---

## 🎯 Features

### Current Implementation

#### ✅ Phase 7: Documentation Generation (COMPLETED)

- ✅ **Modular Documentation System** - Stripe-style developer documentation
  - Generates 4 sections: getting-started, setup, troubleshooting, verification
  - Each section contains 2-3 focused markdown files (< 300 lines each)
  - Context-aware: Only documents what was actually installed/configured
  - Platform-specific instructions (Windows/macOS/Linux)
- ✅ **Template Engine** - Variable interpolation with Handlebars-style syntax
  - Supports `{{variable}}`, `{{#if condition}}`, `{{#each items}}`
  - Nested variable access with dot notation
  - Array handling with comma-join
- ✅ **Content Builders** - Markdown formatting utilities
  - Dependency tables, command snippets, environment lists
  - Verification summaries, setup steps, config summaries
  - Platform-specific notes and navigation
- ✅ **Documentation Generators** (4 specialized generators)
  - GettingStartedGenerator: Quickstart & prerequisites
  - SetupDocsGenerator: Dependencies, configuration, environment
  - TroubleshootingGenerator: Common issues & verification failures
  - VerificationDocsGenerator: Health checks & manual testing
- ✅ **Manifest Schema Extension** - `documentation` section in `.onboard.yaml`
  - Enable/disable documentation generation
  - Custom output directory
  - Selective sections
  - Project metadata (repo_url, docs_url, support_url)
- ✅ **Orchestrator Integration** - Step 6 fully implemented
  - Generates documentation after verification
  - Dry-run mode support
  - Graceful failure handling (continues if docs fail)
- ✅ **Test Coverage** - 25/25 tests passing
  - TemplateEngine (8 tests)
  - ContentBuilder (11 tests)
  - DocumentGenerator (6 tests)

#### ✅ Phase 6: Verification & Health Checks (COMPLETED)

- ✅ **Environment Files (P0)** - Automated .env generation from manifests
  - Smart merge mode preserves existing values while adding new variables
  - Generates .env.template (version control), .env.example (documentation), .env (actual values)
  - Copilot CLI integration for secure random values (API keys, JWT secrets)
  - Automatic .gitignore updates (.env, .env.backup.*, .jetpack-state.json)
  - Timestamped backups with auto-cleanup (keeps last 3)
  - Environment variable validation (URLs, emails, ports, booleans)
- ✅ **SSH Key Generation (P1)** - Secure ed25519 SSH keys
  - Generates ~/.ssh/id_ed25519 and id_ed25519.pub
  - Automatic addition to ssh-agent (graceful Windows fallback)
  - Skip-if-exists protection (never overwrites user's existing keys)
  - Configurable comment and algorithm via manifest
- ✅ **Git Configuration (P2)** - Global git identity setup
  - Auto-configures user.name and user.email if missing
  - Sets init.defaultBranch = main for modern workflows
  - Preserves existing git identity (no overwrite)
- ✅ **Cross-Platform Support** - Windows + Unix path handling
- ✅ **Continue-on-Failure** - Collects all errors, shows comprehensive summary
- ✅ **Dry-Run Mode** - Preview all generated files and configurations
- ✅ **Test Coverage** - 3/3 tests passing (P0, P1, P2 validation)

#### ✅ Phase 4: Setup Step Execution (COMPLETED)

- ✅ **Sequential Command Execution** - Runs setup_steps from `.onboard.yaml` manifests
- ✅ **Stop-on-Failure** - Halts workflow immediately if any step fails
- ✅ **Live Output Display** - Shows real-time command output (stdio: inherit)
- ✅ **Step Validation** - Pre-execution checks for required fields and proper types
- ✅ **Dry-Run Mode** - Preview commands without executing them
- ✅ **Detailed Summary** - Shows executed/skipped/failed counts with duration
- ✅ **Error Propagation** - Prevents Steps 5-7 from running on setup failure
- ✅ **Test Coverage** - 17/17 tests passing (12 unit + 5 integration)

#### ✅ Phase 3: Dependency Installation (COMPLETED)

- ✅ **Automated Package Installation** - System, npm, and Python packages
- ✅ **Check-Before-Install** - Skips already present packages (optimization)
- ✅ **Multi-Platform Support** - Windows (Chocolatey, Scoop), macOS (Homebrew), Linux (apt, yum)
- ✅ **Sequential Installation** - System → npm → Python (proper dependency order)
- ✅ **Continue-on-Failure** - Collects all errors, shows comprehensive summary
- ✅ **Detailed Progress** - Phase-based execution with real-time feedback
- ✅ **Smart Detection** - Automatically selects best available package manager

#### ✅ Phase 2: GitHub Integration (COMPLETED)

- ✅ **GitHub Manifest Fetcher** - Fetch `.onboard.yaml` from GitHub repositories
- ✅ **Multiple Fetch Methods** - Try gh CLI first, fallback to raw.githubusercontent.com
- ✅ **Intelligent Caching** - 24-hour TTL cache in `~/.jetpack/cache/` (6-10x faster)
- ✅ **Multiple Filenames** - Tries `.onboard.yaml`, `.onboard.yml`, `onboard.yaml`
- ✅ **Private Repository Support** - Works with gh CLI authentication
- ✅ **Cache Control** - `--no-cache` flag to force fresh fetch

#### ✅ Phase 1: Core Parser Implementation (COMPLETED)

- ✅ **Manifest Parser** - Full-featured `.onboard.yaml` parser with schema validation
- ✅ **Dependency Extraction** - Supports system, npm, and python dependencies
- ✅ **Environment Variables** - Handles required and optional env vars
- ✅ **Setup Steps** - Parses multi-step setup commands
- ✅ **Error Handling** - Comprehensive validation and clear error messages
- ✅ **Test Suite** - 14/14 tests passing with full coverage

#### ✅ Foundation (Previously Implemented)

- ✅ CLI framework with Commander.js
- ✅ Environment detection (OS, Node.js, package managers)
- ✅ State management with JSON persistence
- ✅ Colored console output with Chalk
- ✅ Modular architecture for easy extension
- ✅ Error handling and recovery

### Planned Features (Roadmap)

- ✅ ~~Dependency installation (npm, Chocolatey, Scoop, Homebrew)~~ **COMPLETED in Phase 3**
- ✅ ~~Setup step execution with live output~~ **COMPLETED in Phase 4**
- ✅ ~~Configuration file generation (.env, SSH keys, Git config)~~ **COMPLETED in Phase 5**
- ✅ ~~Setup verification and health checks~~ **COMPLETED in Phase 6**
- ✅ ~~Custom documentation generation~~ **COMPLETED in Phase 7**
- 🔄 GitHub Copilot CLI integration enhancements (explanations, validations)
- 🔄 TUI dashboard with Blessed
- 🔄 Full rollback functionality
- 🔄 Branch/tag support for manifest fetching
- 🔄 Support for GitLab and other git providers

---

## 🛠️ Development

### Prerequisites

- Node.js 16+
- npm 8+
- Git

### Setup Development Environment

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests (when implemented)
npm test
```

### Key Dependencies

- **commander**: CLI framework
- **inquirer**: Interactive prompts
- **chalk**: Terminal styling
- **blessed**: Terminal UI widgets
- **dotenv**: Environment variable management
- **yaml**: YAML parsing

---

## 🔐 GitHub Authentication

Jetpack CLI fetches manifests from GitHub repositories and supports both public and private repos.

### Authentication Methods (in order of priority):

1. **GitHub CLI (`gh`)** - Recommended

   ```bash
   # Authenticate with gh CLI
   gh auth login

   # Verify authentication
   gh auth status
   ```

   - ✅ Preserves your GitHub authentication
   - ✅ Works with private repositories
   - ✅ No token management needed

2. **GITHUB_TOKEN environment variable** - Fallback

   ```bash
   # Set GITHUB_TOKEN
   export GITHUB_TOKEN=ghp_your_token_here

   # Run jetpack init
   jetpack init https://github.com/owner/repo
   ```

   - ✅ Works in CI/CD pipelines
   - ✅ No gh CLI dependency
   - ⚠️ Requires manual token creation

### For Public Repositories:

- No authentication required
- Fetches directly from raw.githubusercontent.com

### Cache Management:

```bash
# Manifests are cached in ~/.jetpack/cache/ for 24 hours

# Force fresh fetch
jetpack init https://github.com/owner/repo --no-cache

# Clear cache manually
rm -rf ~/.jetpack/cache/
```

---

## 📝 Example `.onboard.yaml` Manifest

```yaml
# .onboard.yaml - Repository onboarding configuration
name: my-awesome-project
description: Full-stack web application

dependencies:
  system:
    - docker
    - nodejs
    - git

  npm:
    - eslint
    - prettier
    - typescript

  environment:
    - DATABASE_URL
    - API_KEY
    - JWT_SECRET

setup_steps:
  - name: Install dependencies
    command: npm install

  - name: Setup database
    command: npm run db:migrate

  - name: Run tests
    command: npm test

# Phase 7: Documentation Generation
documentation:
  enabled: true
  output_dir: "./docs"
  sections:
    - getting-started
    - setup
    - troubleshooting
    - verification
  custom:
    repo_url: https://github.com/owner/repo
    docs_url: https://docs.example.com
```

---

## 🎓 Architecture Highlights

### Design Principles

1. **Modular Design**: Each component has single responsibility
2. **Error-First**: Comprehensive error handling with rollback support
3. **State Management**: JSON-based progress tracking for recovery
4. **Platform Abstraction**: Cross-platform support (Windows, macOS, Linux)
5. **Extensibility**: Easy to add new installers and detectors

### Workflow Steps

1. **Environment Detection** → Analyze system capabilities
2. **Parse Manifest** → Read `.onboard.yaml` from repository
3. **Install Dependencies** → Execute platform-specific installers
4. **Execute Setup Steps** → Run project-specific setup commands
5. **Generate Configurations** → Create .env files, SSH keys, Git config
6. **Create Documentation** → Generate personalized developer guides
7. **Verify Setup** → Run health checks and validation

---

## 🤝 Contributing

Contributions are welcome! This is a foundation implementation with room for enhancements.

### Priority Areas

- Implement `.onboard.yaml` parser
- Add platform-specific installers (Chocolatey, Homebrew, apt)
- Integrate GitHub Copilot CLI for intelligent suggestions
- Build TUI dashboard with Blessed
- Add comprehensive test coverage

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🔗 Resources

- [Commander.js Documentation](https://github.com/tj/commander.js)
- [GitHub CLI](https://cli.github.com/)
- [GitHub Copilot CLI](https://docs.github.com/en/copilot/github-copilot-in-the-cli)
- [Project Architecture](./ProjectArchitecture.md)

---

## 🎉 Next Steps

After installation:

1. Run `npm install` to install dependencies
2. Run `npm link` to make `jetpack` globally available
3. Test with `jetpack --help`
4. Try a dry run: `jetpack init https://github.com/GunaPalanivel/test-repo --dry-run`
5. Review the [ProjectArchitecture.md](./ProjectArchitecture.md) for implementation details

**Happy coding! 🚀**
