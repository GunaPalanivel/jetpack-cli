# Changelog

All notable changes to Jetpack CLI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v0.4.0] - 2026-02-12

### 🚀 New Features (AI Integration)

*   **Copilot Troubleshooter**: Automatically analyzes installation failures and suggests fixes using `jetpack verify --copilot-troubleshoot`.
*   **Manifest Generator**: Generates `.onboard.yaml` from existing codebases using `jetpack generate-manifest --copilot`.
*   **Risk Analyzer**: Assesses rollback risks (data loss, side effects) before execution with `jetpack rollback --check-risks`.
*   **Dependency Resolver**: intelligently resolves version conflicts and missing peer dependencies during installation.
*   **Config Explanations**: Annotates generated `.env` files with AI-generated explanations for each variable.

### 🛠️ CLI Enhancements

*   Added `--copilot-generate` flag to `init` command for local repo onboarding.
*   Added `--check-risks` flag to `rollback` command.
*   Added `--copilot-troubleshoot` flag to `verify` command.
*   Updated all AI modules to use correct `gh copilot -p` syntax for reliability.

### 📚 Documentation

*   Added dedicated **Copilot Integration Guide**.
*   Updated `architecture.md` with AI layer diagrams.
*   Refactored documentation to remove placeholder content.

### Internal & Testing

*   **Jest Migration**: Migrated test suite to Jest for improved reliability and speed.
*   **Expanded Coverage**: Test suite now includes **235 tests** covering unit, integration, and rollback scenarios.
*   **Unified Runner**: Consolidated test execution into a standard `npm test` workflow.
*   **Mocking Strategy**: Implemented robust mocking for filesystem and child processes to eliminate flakiness.

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
