# `jetpack verify`

Verify the health of the current environment.

## Usage

```bash
jetpack verify [options]
```

## Description

The `verify` command ensures that the developer environment is correctly set up. It performs:
1.  **System Checks**: Verifies Node.js, npm, and Git versions.
2.  **Dependency Checks**: Confirms that all packages listed in `.onboard.yaml` are installed.
3.  **Custom Checks**: Runs user-defined verification steps (HTTP, TCP, Command) specified in the manifest.

## Options

| Option | Description | Default |
| :--- | :--- | :--- |
| `--verbose` | Show detailed output for all verification checks, including successful ones. | `false` |

## Examples

**Run standard verification:**
```bash
jetpack verify
```

**Debug failing checks:**
```bash
jetpack verify --verbose
```
