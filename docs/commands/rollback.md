# `jetpack rollback`

Revert changes made by Jetpack.

## Usage

```bash
jetpack rollback [options]
```

## Description

Safely undoes changes made during the onboarding process. By default, it performs a **safe rollback** which does not remove installed packages.

**What gets rolled back:**
*   ✅ **Documentation**: Removes generated docs in `.jetpack/` or `docs/`.
*   ✅ **Git Config**: Restores original global git settings.
*   ✅ **SSH Keys**: Removes generated SSH keys (safe check included).
*   ✅ **Config Files**: Restores `.env` from backup and removes generated templates.
*   ✅ **Dependencies**: Uninstalls packages (Only if `--unsafe` is used).

## Options

| Option | Description | Default |
| :--- | :--- | :--- |
| `--dry-run` | Preview changes without executing. | `false` |
| `--check-risks` | Analyze rollback risks (e.g., data loss) using Copilot before execution. | `false` |
| `--partial <phases>` | Rollback only specific phases. Comma-separated list: `docs`, `config`, `git`, `ssh`, `dependencies`. | `all` |
| `--unsafe` | Allow uninstallation of system packages. **Use with caution.** | `false` |
| `--force` | Bypass interactive safety confirmations. | `false` |

## Examples

**Safe Rollback (Recommended):**
```bash
jetpack rollback
```

**Preview changes:**
```bash
jetpack rollback --dry-run
```

**Rollback only documentation:**
```bash
jetpack rollback --partial=docs
```

**Full Rollback (Uninstall packages):**
```bash
jetpack rollback --unsafe
```
