# `jetpack generate-manifest`

Generate a comprehensive `.onboard.yaml` manifest from your codebase using GitHub Copilot.

## Usage

```bash
jetpack generate-manifest [options]
```

## Description

This command analyzes your repository structure (package.json, Dockerfile, requirements.txt, etc.) and uses GitHub Copilot to generate a ready-to-use `.onboard.yaml` file. It infers:
-   Project name and description
-   System and language dependencies
-   Setup steps (build, install)
-   Environment variables

## Options

| Option | Description | Default |
| :--- | :--- | :--- |
| `--copilot` | Required flag to enable Copilot analysis. | `false` |

## Examples

**Generate manifest:**
```bash
jetpack generate-manifest --copilot
```
