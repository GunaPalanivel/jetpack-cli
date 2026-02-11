# 🔧 Common Issues

Solutions to common problems when setting up **example-docs-project**.

## Dependency Installation Issues

### npm packages fail to install

**Problem**: `npm install` fails with permission errors or network issues.

**Solutions**:

1. **Permission errors** (Windows):
   ```powershell
   # Run PowerShell as Administrator
   npm install -g <package>
   ```

2. **Permission errors** (macOS/Linux):
   ```bash
   # Don't use sudo - fix npm permissions instead
   mkdir ~/.npm-global
   npm config set prefix '~/.npm-global'
   echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.profile
   source ~/.profile
   ```

3. **Network issues**:
   ```bash
   # Clear npm cache
   npm cache clean --force
   
   # Try different registry
   npm config set registry https://registry.npmjs.org/
   ```


### Python package installation fails

**Problem**: `pip install` fails with version conflicts or missing dependencies.

**Solutions**:

1. **Upgrade pip**:
   ```bash
   python -m pip install --upgrade pip
   ```

2. **Use virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install black, pytest
   ```

3. **Install missing system dependencies** (Linux):
   ```bash
   sudo apt-get install python3-dev build-essential
   ```



### System packages not found

**Problem**: System dependencies are not recognized after installation.

**Solutions**:

1. **Refresh PATH**:
   ```bash
   # Windows: Restart PowerShell
   # macOS/Linux: Reload shell config
   source ~/.bashrc  # or ~/.zshrc
   ```

2. **Verify installation**:
   
   ```bash
   which docker  # Unix
   where.exe docker  # Windows
   ```
   
   ```bash
   which nodejs  # Unix
   where.exe nodejs  # Windows
   ```
   
   ```bash
   which git  # Unix
   where.exe git  # Windows
   ```
   

3. **Reinstall package manager**:
   - Windows: Reinstall Chocolatey/Scoop
   - macOS: `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
   - Linux: `sudo apt update && sudo apt upgrade`


## Configuration Issues

### Environment variables not loading

**Problem**: `.env` file exists but variables aren't accessible.

**Solutions**:

1. **Check file location**:
   ```bash
   ls -la .env  # Should be in project root
   ```

2. **Load variables manually**:
   ```bash
   # Bash/Zsh
   export $(cat .env | xargs)
   
   # PowerShell
   Get-Content .env | ForEach-Object { 
     $name, $value = $_.split('=')
     [Environment]::SetEnvironmentVariable($name, $value, "Process")
   }
   ```

3. **Restart your terminal** after setting variables.


### SSH key not working

**Problem**: SSH authentication fails despite key generation.

**Solutions**:

1. **Add key to ssh-agent**:
   ```bash
   eval "$(ssh-agent -s)"
   ssh-add ~/.ssh/id_ed25519
   ```

2. **Verify permissions** (Unix):
   ```bash
   chmod 700 ~/.ssh
   chmod 600 ~/.ssh/id_ed25519
   chmod 644 ~/.ssh/id_ed25519.pub
   ```

3. **Add public key to GitHub/GitLab**:
   ```bash
   cat ~/.ssh/id_ed25519.pub
   # Copy output and add to your account settings
   ```



### Git commands fail with identity errors

**Problem**: Git operations fail due to missing user configuration.

**Solutions**:

1. **Verify git config**:
   ```bash
   git config --global user.name
   git config --global user.email
   ```

2. **Set manually if needed**:
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```


## Platform-Specific Issues

> **Note for Windows users**: Use PowerShell or Command Prompt to run commands.

### Windows Issues

- **Execution policy errors**: `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`
- **Long path errors**: Enable long paths: `New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force`
- **PowerShell version**: Upgrade to PowerShell 7+ for best compatibility

### macOS Issues

- **Command not found**: Add to PATH: `echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.zshrc`
- **Xcode tools missing**: `xcode-select --install`
- **Homebrew permissions**: `sudo chown -R $(whoami) /usr/local/Homebrew`

### Linux Issues

- **Sudo password required**: Add to sudoers for package manager commands
- **Package conflicts**: `sudo apt-get autoremove && sudo apt-get autoclean`
- **Missing libraries**: `sudo apt-get install build-essential`

## Getting Help

If you're still experiencing issues:

1. Check [verification failures](verification-failures.md) for specific check errors
2. Review [setup documentation](../setup/dependencies.md) for installation details
3. Run diagnostics: `jetpack verify --verbose`
4. Search existing GitHub issues or create a new one

## Logs and Debugging

Enable verbose logging:
```bash
jetpack init <repo> --verbose
```

Check state file for errors:
```bash
cat .jetpack-state.json
```

---

_Last updated: 2026-02-11T08:59:57.072Z_
