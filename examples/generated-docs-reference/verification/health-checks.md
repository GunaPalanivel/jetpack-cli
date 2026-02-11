# ✅ Health Checks

Automated verification checks for **example-docs-project**.


## Current Status

✅ All checks passed (3/3 successful)



## Automated Verification

Run all health checks:

```bash
jetpack verify
```

This command automatically verifies:
- All dependencies are installed and accessible
- Configuration files exist and are valid
- Required services are running
- Environment variables are set correctly

## Check Types

### Command Checks

Verifies that required commands are available and executable.

Example checks:


```bash
docker --version
```

```bash
nodejs --version
```

```bash
git --version
```




```bash
npm list -g --depth=0
```


### HTTP Checks

Verifies that web services are running and responding.

```bash
# Check if service is responding
curl -I http://localhost:3000/health
```

### Port Checks

Verifies that required ports are open and listening.

```bash
# Check if port is listening
netstat -an | grep PORT
```

### File Checks

Verifies that configuration files exist and contain expected content.


{{#if config.envFile}}
```bash
# Check .env file
test -f .env && echo ".env exists"
```



```bash
# Check SSH key
test -f ~/.ssh/id_ed25519 && echo "SSH key exists"
```

{{/if}}

## Interpreting Results

### ✅ Success

All checks passed - your environment is ready!

```
✅ All verification checks passed (12/12)
```

### ⚠️ Warnings

Some non-critical checks failed - review and fix if needed.

```
⚠️ 2 checks failed (10/12 successful)
```

### ❌ Failure

Critical checks failed - setup is incomplete.

```
❌ 5 checks failed (7/12 successful)
```

## Troubleshooting Failed Checks

If checks fail, see:
- [Verification Failures Guide](../troubleshooting/verification-failures.md) for specific fixes
- [Common Issues](../troubleshooting/common-issues.md) for general troubleshooting

## Verbose Mode

Get detailed information about each check:

```bash
jetpack verify --verbose
```

This shows:
- Exact commands being run
- Full output from each check
- Detailed error messages
- Timing information

## Custom Verification

You can define custom checks in your `.onboard.yaml`:

```yaml
verification:
  checks:
    # Command check
    - type: command
      command: docker --version
      expected_output: "Docker version"
      tags: [critical]
      
    # HTTP check
    - type: http
      url: http://localhost:3000/health
      expected_status: 200
      tags: [service]
      
    # Port check
    - type: port
      port: 3000
      host: localhost
      tags: [service]
      
    # File check
    - type: file
      path: .env
      should_exist: true
      contains: "DATABASE_URL"
      tags: [config]
```

## Continuous Verification

Add verification to your workflow:

```bash
# Before starting work
jetpack verify && npm start

# In CI/CD pipeline
jetpack verify --json > verification-results.json
```

## Health Check Schedule

Recommended verification frequency:
- **After setup**: Immediately after `jetpack init`
- **Daily**: Before starting development
- **After updates**: When dependencies or config changes
- **In CI**: On every pull request

---

For manual testing procedures, see [manual testing guide](manual-testing.md).
