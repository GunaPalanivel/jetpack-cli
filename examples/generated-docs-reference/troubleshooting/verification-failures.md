# ⚠️ Verification Failures

How to fix failed verification checks for **example-docs-project**.


## Your Verification Status

✅ All checks passed (3/3 successful)



## Common Verification Failures

### Command Checks Failed

**Problem**: `command` type checks fail because a tool is not found or returns an error.

**Solutions**:

1. **Tool not in PATH**:
   ```bash
   # Find the tool
   which <tool-name>  # Unix
   where.exe <tool-name>  # Windows
   
   # Add to PATH if found
   export PATH="$PATH:/path/to/tool"  # Unix
   $env:PATH += ";C:\path\to\tool"  # Windows
   ```

2. **Tool not installed**:
   
   ```bash
   # Reinstall system dependencies
   
   # Install docker
   
   # Install nodejs
   
   # Install git
   
   ```
   

3. **Version mismatch**:
   ```bash
   # Check required version in manifest
   <tool-name> --version
   ```

### HTTP Checks Failed

**Problem**: `http` checks fail due to service unavailability or network issues.

**Solutions**:

1. **Service not running**:
   ```bash
   # Check if service is running
   curl http://localhost:PORT
   
   # Start the service
   npm start  # or appropriate start command
   ```

2. **Wrong port or URL**:
   - Verify URL in verification check matches your configuration
   - Check `.env` file for correct PORT settings

3. **Firewall blocking**:
   - Allow port in firewall settings
   - Check antivirus software blocking local connections

### Port Checks Failed

**Problem**: `port` checks fail because a port is not listening or is blocked.

**Solutions**:

1. **Service not started**:
   ```bash
   # Start the service that should be listening
   npm run dev  # or appropriate command
   ```

2. **Port already in use**:
   ```bash
   # Find what's using the port (Unix)
   lsof -i :PORT
   
   # Find what's using the port (Windows)
   netstat -ano | findstr :PORT
   
   # Kill the process or use a different port
   ```

3. **Incorrect port number**:
   - Check manifest verification config
   - Verify service is configured to use the expected port

### File Checks Failed

**Problem**: `file` checks fail because files don't exist or have wrong permissions.

**Solutions**:

1. **File missing**:
   ```bash
   # Check if file exists
   ls -la /path/to/file  # Unix
   dir /path/to/file  # Windows
   
   # Create file if needed
   touch /path/to/file  # Unix
   New-Item -Path /path/to/file -ItemType File  # Windows
   ```

2. **Wrong permissions** (Unix):
   ```bash
   # Fix permissions
   chmod 644 /path/to/file  # For regular files
   chmod 755 /path/to/file  # For executables
   ```

3. **Wrong content**:
   - Check expected content patterns in verification manifest
   - Ensure file contains required strings or format


## Configuration-Related Failures

{{#if config.envFile}}
### Missing environment variables

Check your `.env` file contains all required variables:

{{#if environment.required}}

- `DATABASE_URL`

- `API_KEY`

- `JWT_SECRET`



```bash
# Regenerate .env from template
cp .env.template .env
# Edit .env and fill in values
```
{{/if}}


### SSH key issues

Verify SSH key:
```bash
ssh-add -l  # List loaded keys
ssh -T git@github.com  # Test GitHub connection
```

{{/if}}

## Debugging Verification

### Run checks individually

```bash
jetpack verify --verbose
```

### Check verification manifest

Review your `.onboard.yaml`:
```yaml
verification:
  checks:
    - type: command
      command: <tool-name> --version
    - type: http
      url: http://localhost:3000
    # ... other checks
```

### Manual verification

Run checks manually to see detailed errors:

```bash
# Test command
<command-to-check>

# Test HTTP endpoint
curl -I http://localhost:PORT

# Check port
netstat -an | grep PORT
```

## Re-running Verification

After fixing issues, re-run verification:

```bash
jetpack verify
```

Or re-run full setup:

```bash
jetpack init https://github.com/example/example-docs-project
```

## Still Failing?

1. Review [common issues](common-issues.md) for general troubleshooting
2. Check [setup documentation](../setup/dependencies.md) for installation requirements
3. Enable debug logging: `jetpack verify --verbose --debug`
4. Check `.jetpack-state.json` for error details

---

_Last updated: 2026-02-11T08:59:57.072Z_
