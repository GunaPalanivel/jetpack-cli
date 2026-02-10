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

#### Rollback

```bash
jetpack rollback
```

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
│   │   └── setup-executor.js       # ✨ NEW: Setup step executor (Phase 4)
│   ├── detectors/
│   │   ├── env-analyzer.js         # Environment detection
│   │   └── manifest-parser.js      # .onboard.yaml parser
│   └── ui/
│       └── logger.js               # Formatted output
├── tests/
│   ├── test-manifest-parser.js     # Parser test suite (8 tests)
│   ├── test-edge-cases.js          # Edge case tests (5 tests)
│   ├── test-manifest-fetcher.js    # Fetcher tests (14 tests)
│   ├── test-dependency-installer.js # Dependency tests (5 tests)
│   ├── test-setup-executor.js      # ✨ NEW: Setup executor tests (12 tests)
│   └── test-phase4-integration.js  # ✨ NEW: Phase 4 integration (5 tests)
├── templates/
│   ├── example.onboard.yaml        # Simple manifest example
│   └── complex.onboard.yaml        # Advanced manifest example
├── docs/
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
```

### Supported Features

✅ **Schema Validation** - Validates required fields and structure  
✅ **Multi-Language Support** - System, NPM, and Python dependencies  
✅ **Environment Variables** - Required and optional configurations  
✅ **Setup Steps** - Multi-step setup commands with descriptions  
✅ **Error Handling** - Clear, actionable error messages

See `templates/example.onboard.yaml` and `templates/complex.onboard.yaml` for manifest examples.

---

## 🎯 Features

### Current Implementation

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
- 🔄 Configuration file generation (.env, SSH keys) - **Phase 5: Next**
- 🔄 Setup verification and health checks - **Phase 6: Planned**
- 🔄 Custom documentation generation - **Phase 7: Planned**
- 🔄 GitHub Copilot CLI integration for intelligent suggestions
- 🔄 TUI dashboard with Blessed
- 🔄 Custom documentation generation
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
4. **Generate Configurations** → Create .env files, SSH keys
5. **Create Documentation** → Generate personalized guides
6. **Verify Setup** → Run health checks

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
