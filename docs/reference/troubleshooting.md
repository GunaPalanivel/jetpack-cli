# Troubleshooting

Solutions to common issues encountered when using Jetpack CLI.

## General Issues

### manifest not found
**Error:** `Manifest file not found: .onboard.yaml`
**Cause:** The repository URL provided does not have an `.onboard.yaml` file at the root level.
**Solution:** Ensure the repository has a valid manifest file or specify a custom filename with `--manifest <filename>`.

### permission denied
**Error:** `EACCES: permission denied`
**Cause:** Jetpack tries to install global packages or modify system files without sufficient privileges.
**Solution:** Run the command with `sudo` (Linux/macOS) or as Administrator (Windows).

### github rate limit
**Error:** `API rate limit exceeded`
**Cause:** Too many anonymous requests to GitHub API.
**Solution:** Authenticate with GitHub CLI (`gh auth login`) or set `GITHUB_TOKEN` environment variable.

## Setup Issues

### package installation fails
**Error:** `Failed to install package: <name>`
**Cause:** Network issues or package manager conflicts.
**Solution:** Check your internet connection. Try running the package manager command manually to see detailed errors. Using `--verbose` might reveal more info.

### .env file not generated
**Cause:** Manifest does not define any `environment` dependencies.
**Solution:** Check your `.onboard.yaml` and ensure `dependencies.environment` is correctly populated.

## Verification Issues

### verify command fails
**Error:** `Verification failed: <check-name>`
**Cause:** A health check defined in the manifest failed.
**Solution:** Run `jetpack verify --verbose` to see specific error output. Manually inspect the resource (URL, file, port) being checked.

## Rollback Issues

### rollback partial failures
**Error:** `Failed to uninstall <package>`
**Cause:** Package might be in use or require elevated permissions.
**Solution:** Close applications using the package and try running with `sudo` / Administrator privileges.
