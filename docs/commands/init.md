# `jetpack init`

Initialize a new developer environment from a remote repository manifest.

## Usage

```bash
jetpack init <repo-url> [options]
```

## Description

This command is the entry point for onboarding. It:
1.  Fetches the `.onboard.yaml` manifest from the specified GitHub repository.
2.  Parses the manifest to understand dependencies and setup steps.
3.  Detects the local environment (OS, shell).
4.  Execute the installation and setup workflow.

## Options

| Option | Description | Default |
| :--- | :--- | :--- |
| `-m, --manifest <file>` | Path to a custom manifest file within the repo. | `.onboard.yaml` |
| `--no-cache` | Force a fresh fetch of the manifest from GitHub, ignoring the local 24h cache. | `false` |
| `--skip-install` | skip the dependency installation phase. Useful for testing config generation or when dependencies are already managed. | `false` |
| `--dry-run` | Preview what would happen without making any changes to the system. | `false` |

## Examples

**Basic Usage:**
```bash
jetpack init https://github.com/my-org/my-project
```

**Use a custom manifest file:**
```bash
jetpack init https://github.com/my-org/my-project --manifest dev-onboard.yaml
```

**Force refresh from GitHub:**
```bash
jetpack init https://github.com/my-org/my-project --no-cache
```# `jetpack init`

Initialize a new developer environment from a remote repository manifest.

## Usage

```bash
jetpack init <repo-url> [options]
```

## Description

This command is the entry point for onboarding. It:
1.  Fetches the `.onboard.yaml` manifest from the specified GitHub repository.
2.  Parses the manifest to understand dependencies and setup steps.
3.  Detects the local environment (OS, shell).
4.  Execute the installation and setup workflow.

## Options

| Option | Description | Default |
| :--- | :--- | :--- |
| `-m, --manifest <file>` | Path to a custom manifest file within the repo. | `.onboard.yaml` |
| `--no-cache` | Force a fresh fetch of the manifest from GitHub, ignoring the local 24h cache. | `false` |
| `--skip-install` | skip the dependency installation phase. Useful for testing config generation or when dependencies are already managed. | `false` |
| `--dry-run` | Preview what would happen without making any changes to the system. | `false` |

## Examples

**Basic Usage:**
```bash
jetpack init https://github.com/my-org/my-project
```

**Use a custom manifest file:**
```bash
jetpack init https://github.com/my-org/my-project --manifest dev-onboard.yaml
```

**Force refresh from GitHub:**
```bash
jetpack init https://github.com/my-org/my-project --no-cache
```
