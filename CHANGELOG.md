# Changelog

All notable changes to Jetpack CLI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
- **Test Suite** (`tests/test-manifest-parser.js`)
  - 8 comprehensive test cases
  - All tests passing ✅
  - Coverage for success and error scenarios
  
- **Example Manifests**
  - `templates/example.onboard.yaml` - Simple manifest with basic dependencies
  - `templates/complex.onboard.yaml` - Advanced multi-tech stack manifest

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
templates/example.onboard.yaml     - Simple example manifest
templates/complex.onboard.yaml     - Advanced example manifest
tests/test-manifest-parser.js      - Comprehensive test suite
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

[Unreleased]: https://github.com/yourusername/jetpack-cli/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/yourusername/jetpack-cli/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/yourusername/jetpack-cli/releases/tag/v0.1.0
