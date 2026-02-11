# 🖥️ Environment Setup

Platform-specific setup instructions for **example-docs-project**.

## Your Environment

- **Operating System**: Windows_NT
- **Shell**: powershell

## Platform-Specific Notes

> **Note for Windows users**: Use PowerShell or Command Prompt to run commands.


### Windows_NT Setup



### Package Managers

Recommended package managers for your platform:

**Windows:**
- [Chocolatey](https://chocolatey.org/) - `choco install <package>`
- [Scoop](https://scoop.sh/) - `scoop install <package>`
- [winget](https://docs.microsoft.com/en-us/windows/package-manager/) - `winget install <package>`

**macOS:**
- [Homebrew](https://brew.sh/) - `brew install <package>`

**Linux:**
- apt (Debian/Ubuntu) - `sudo apt install <package>`
- yum (RHEL/CentOS) - `sudo yum install <package>`
- dnf (Fedora) - `sudo dnf install <package>`

## Shell Configuration

Add these to your shell configuration file:

**PowerShell** (`$PROFILE`):
```powershell
# Add custom PATH entries
$env:PATH += ";C:\path\to\your\tools"
```

**Bash/Zsh** (`~/.bashrc` or `~/.zshrc`):
```bash
# Add custom PATH entries
export PATH="$PATH:/path/to/your/tools"
```

## Environment Variables

Set environment variables for your shell:

**PowerShell**:
```powershell
[Environment]::SetEnvironmentVariable("VAR_NAME", "value", "User")
```

**Bash/Zsh**:
```bash
export VAR_NAME=value
echo 'export VAR_NAME=value' >> ~/.bashrc
```

## Permissions


**Windows_NT** users may need elevated permissions for system-level changes.


**Windows**: Run PowerShell as Administrator
**macOS/Linux**: Use `sudo` for system commands

## Verification

Check your environment setup:

```bash
# Check shell
echo $SHELL

# Check PATH
echo $PATH

# Check environment variables


echo $DATABASE_URL

echo $API_KEY

echo $JWT_SECRET


```

---

For environment-related issues, see [troubleshooting guide](../troubleshooting/common-issues.md).
