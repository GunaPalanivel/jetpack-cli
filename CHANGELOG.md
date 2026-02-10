# Changelog

All notable changes to Jetpack CLI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Phase 5: Configuration Generation** - Automated configuration file generation
  - **P0: Environment Files** (.env, .env.template, .env.example)
    - Smart merge mode preserves existing .env values
    - Copilot CLI integration for secure value generation (API keys, JWT secrets)
    - Automatic .gitignore updates (.env, .env.backup.*, .jetpack-state.json)
    - Timestamped backups with auto-cleanup (keeps last 3)
    - Comprehensive .env.example with Copilot-generated explanations
    - Environment variable validation (URLs, emails, ports, booleans)
  - **P1: SSH Key Generation** (ed25519 algorithm)
    - Secure SSH key generation at ~/.ssh/id_ed25519
    - Automatic addition to ssh-agent (with graceful Windows fallback)
    - Skip-if-exists protection (never overwrites existing keys)
    - Configurable comment and algorithm via manifest
  - **P2: Git Configuration** (global scope)
    - Auto-configure user.name and user.email if missing
    - Sets init.defaultBranch = main for modern workflows
    - Preserves existing git identity (no overwrite)
    - Warnings for placeholder emails
- New modules: `src/core/config-generator.js` (640 LOC) and `src/core/config-utils.js` (390 LOC)
  - ConfigGenerator with P0, P1, P2 orchestration
  - File merge utilities (preserve existing .env values)
  - Backup management with timestamp and cleanup
  - SSH key generation with ed25519 security
  - Git config management (get/set with validation)
  - Cross-platform path handling (Windows + Unix)
  - Copilot CLI integration with crypto fallbacks
- Enhanced `src/detectors/manifest-parser.js`
  - New manifest sections: `ssh` and `git`
  - Validation for ssh.generate, ssh.comment, ssh.algorithm
  - Validation for git.configure, git.user.name, git.user.email
- Test suite for config generation (3 comprehensive tests)
  - P0+P1+P2 dry-run validation
  - Actual P0 generation with file verification
  - Manifest parsing for ssh/git sections
- Updated `.onboard.yaml` schema with ssh/git examples

- **Phase 4: Setup Step Execution** - Automated execution of setup commands
  - Sequential step execution from `.onboard.yaml` manifests
  - Stop-on-failure error handling (workflow halts on any step failure)
  - Live command output display (stdio: inherit)
  - Dry-run mode support with command preview
  - Step validation (command required, proper types)
  - Detailed execution summary (executed/skipped/failed counts)
  - Duration tracking for performance monitoring
  - Full environment variable inheritance
- New module: `src/core/setup-executor.js` (400 LOC)
  - Main executor with sequential step processing
  - Pre-execution validation with clear error messages
  - Step execution with real-time output
  - Comprehensive result reporting
- Test suite for setup executor (12 tests, all passing)
  - Validation tests (5 tests)
  - Execution tests (4 tests)
  - Edge case handling (3 tests)
- Integration test suite (5 tests, all passing)
  - End-to-end workflow validation
  - Orchestrator Step 4 integration
  - Manifest compatibility verification
- Updated orchestrator (Step 4 complete)
  - Integrated setup executor into main workflow
  - Stop-on-failure propagation to prevent Steps 5-7 on error
  - State tracking for setup execution results

### Fixed

- **Quality Review Issues** (Phase 6)
  - Issue 1: Fixed off-by-one error in skipped count calculation
  - Issue 2: Added orchestrator stop-on-failure when setup steps fail
  - Issue 3: Fixed property access order in step validation (validate before accessing)
  - Issue 4: Added `@private` JSDoc tags to helper methods for documentation consistency

- **Phase 3: Dependency Installation** - Complete automated package management
  - System package installation (Chocolatey, Scoop, Homebrew, apt, yum, winget)
  - NPM global package installation with bulk install optimization
  - Python package installation via pip
  - Check-before-install logic (skips already present packages)
  - Sequential installation phases (system → npm → python)
  - Continue-on-failure with detailed error reporting
  - Comprehensive installation summary with success/skip/failure counts
- New module: `src/core/package-managers.js` (200 LOC)
  - Package detection utilities
  - Multi-platform command generation
  - Package manager auto-detection
- New module: `src/core/dependency-installer.js` (300 LOC)
  - Main orchestrator for all installation phases
  - Phase-based execution with state tracking
  - Detailed logging and progress indicators
- Test suite for dependency installer (5 tests, all passing)
- Updated orchestrator integration (Step 3 complete)
- Enhanced documentation with installation behavior details

## [0.3.0] - 2026-02-10

### Added - Phase 2: GitHub Integration

#### Core Features

- **GitHub Manifest Fetcher** (`src/core/manifest-fetcher.js`)
  - `fetchFromGitHub(repoUrl, options)` - Fetch manifests from GitHub repositories
  - `parseRepoUrl(url)` - Parse GitHub URLs (supports multiple formats)
  - `isGhCliAvailable()` - Check gh CLI availability
  - `clearCache(repoUrl)` - Clear manifest cache
  - Tries multiple manifest filenames: `.onboard.yaml`, `.onboard.yml`, `onboard.yaml`
  - Intelligent fallback: gh CLI → raw.githubusercontent.com

- **Manifest Cache Manager** (`src/core/manifest-cache.js`)
  - `read(owner, repo)` - Read manifest from cache
  - `write(owner, repo, content)` - Write manifest to cache
  - `clear(owner, repo)` - Clear specific or all cache
  - `getStats()` - Get cache statistics
  - 24-hour TTL (time-to-live) for cached manifests
  - Cache directory: `~/.jetpack/cache/`

#### CLI Enhancements

- **New flag:** `--no-cache` - Skip cache, always fetch fresh manifest
- Enhanced `init` command workflow:
  1. Fetch manifest from GitHub
  2. Parse and validate manifest
  3. Display manifest summary in dry-run mode
  4. Pass parsed manifest to orchestrator

#### Authentication Support

- **Primary:** GitHub CLI (`gh`) authentication (preserves existing auth)
- **Fallback:** GITHUB_TOKEN environment variable
- **Public repos:** No authentication required (uses raw.githubusercontent.com)

#### Testing

- **Test Suite** (`tests/manifest-fetcher.test.js`)
  - 14 comprehensive test cases
  - All tests passing ✅
  - Tests for: URL parsing, cache operations, error handling, gh CLI availability

#### Integration

- Updated `src/cli/commands/init.js` to use manifest fetcher
- Updated `src/core/orchestrator.js` to handle parsed manifests
- Enhanced dry-run mode to show detailed manifest summary

#### Documentation

- Added GitHub Authentication section to README
- Added Cache Management documentation
- Updated project structure with new modules
- Updated usage examples with new flags

### Changed

- `bin/jetpack.js` - Added `--no-cache` flag to init command
- `src/cli/commands/init.js` - Integrated manifest fetcher
- `src/core/orchestrator.js` - Enhanced to use parsed manifests from init
- `README.md` - Comprehensive documentation updates

### Technical Details

**Dependencies:**

- No new dependencies required (uses existing Node.js built-ins)
- Leverages `curl` for raw.githubusercontent.com fallback
- Uses `gh` CLI if available (optional, but recommended)

**Architecture:**

- Pragmatic balance: 2 focused modules (~340 LOC)
- Clear separation: fetcher (business logic) + cache (storage)
- Graceful degradation: multiple fetch strategies
- Error resilience: continues on cache failures

**File Structure:**

```
src/core/manifest-fetcher.js   - GitHub fetch logic (220 LOC)
src/core/manifest-cache.js     - Cache management (120 LOC)
tests/manifest-fetcher.test.js - Test suite (14 tests)
```

---

## [0.2.0] - 2026-02-10

### Added - Phase 1: Manifest Parser Implementation

#### Core Features

- **Manifest Parser Module** (`src/detectors/manifest-parser.js`)
  - `parseManifest(filePath)` - Parse `.onboard.yaml` files from filesystem
  - `parseManifestFromString(content)` - Parse YAML content from strings
  - `validateManifestSchema(manifest)` - Comprehensive schema validation
  - `extractDependencies(manifest)` - Extract system, npm, python dependencies
  - `extractEnvironment(manifest)` - Extract required/optional environment variables
  - `extractSetupSteps(manifest)` - Extract multi-step setup commands

#### Validation & Error Handling

- Schema validation for required fields (name, dependencies, setup_steps)
- Support for multiple dependency types (system, npm, python)
- Flexible environment variable format (array or object with required/optional)
- Clear error messages for:
  - File not found
  - Invalid YAML syntax
  - Missing required fields
  - Empty or malformed manifests

#### Testing & Examples

- **Test Suite** (`tests/manifest-parser.test.js`)
  - 8 comprehensive test cases
  - All tests passing ✅
  - Coverage for success and error scenarios
- **Example Manifests**
  - `templates/basic-example.yaml` - Simple manifest with basic dependencies
  - `templates/complex-example.yaml` - Advanced multi-tech stack manifest

#### Documentation

- Updated README.md with Manifest Parser API documentation
- Added usage examples and supported features
- Updated project structure to reflect new files

### Technical Details

**Dependencies Used:**

- `yaml: ^2.3.4` - YAML parsing and validation

**File Structure:**

```
src/detectors/manifest-parser.js   - Core parser implementation (10KB)
templates/basic-example.yaml     - Simple example manifest
templates/complex-example.yaml     - Advanced example manifest
tests/manifest-parser.test.js      - Comprehensive test suite
```

**Supported Manifest Schema:**

```yaml
name: string (required)
description: string (optional)
dependencies: object (required, must have at least one category)
  system: array<string> (optional)
  npm: array<string> (optional)
  python: array<string> (optional)
  environment: array<string> | object (optional)
    required: array<string>
    optional: array<string>
setup_steps: array<object> (required)
  - name: string (required)
    command: string (required)
    description: string (optional)
```

## [0.1.0] - 2026-02-09

### Added - Foundation Implementation

#### Core CLI Framework

- CLI skeleton using Commander.js
- Three main commands:
  - `jetpack init <repo-url>` - Initialize developer environment
  - `jetpack verify` - Verify installation
  - `jetpack rollback` - Rollback onboarding

#### Core Modules

- **Orchestrator** (`src/core/orchestrator.js`) - Main workflow engine
- **State Manager** (`src/core/state-manager.js`) - Progress tracking with JSON
- **Environment Analyzer** (`src/detectors/env-analyzer.js`) - System detection
- **Logger** (`src/ui/logger.js`) - Colored console output

#### Features

- Environment detection (OS, Node.js, shell, package managers)
- State management for recovery and rollback
- Modular architecture for easy extension
- Error handling framework
- Dry-run mode support
- Skip installation flag

#### Project Setup

- Package.json with all dependencies
- .gitignore for Node.js projects
- README.md with comprehensive documentation
- ProjectArchitecture.md with design details

---

## Upcoming Releases

### [0.3.0] - Phase 2: GitHub Integration (Planned)

- GitHub repository fetcher
- Remote manifest downloading
- Repository caching
- Authentication support

### [0.4.0] - Phase 3: Orchestrator Integration (Planned)

- Connect manifest parser to orchestrator
- Pass parsed data to installation steps
- Update state tracking with manifest data

### [0.5.0] - Phase 4: Dependency Installation (Planned)

- System package installation (Chocolatey, Homebrew, apt)
- NPM package installation
- Python package installation
- Conflict resolution

### [1.0.0] - Full Release (Planned)

- Configuration file generation
- GitHub Copilot CLI integration
- TUI dashboard
- Custom documentation generation
- Full test coverage
- Production-ready release

---

[Unreleased]: https://github.com/GunaPalanivel/jetpack-cli/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/GunaPalanivel/jetpack-cli/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/GunaPalanivel/jetpack-cli/releases/tag/v0.1.0
