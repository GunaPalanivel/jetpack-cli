# 🧪 Manual Testing

Manual verification procedures for **example-docs-project**.

## Pre-Flight Checklist

Before running the application, verify:

{{#if dependencies.system}}
### System Dependencies

{{#each dependencies.system}}
- [ ] `` is installed and in PATH
  ```bash
   --version
  ```
{{/each}}
{{/if}}

{{#if dependencies.npm}}
### Node.js Dependencies

- [ ] npm packages are installed globally
  ```bash
  npm list -g --depth=0
  ```
{{/if}}

{{#if dependencies.python}}
### Python Dependencies

- [ ] Python packages are installed
  ```bash
  pip list
  ```
{{/if}}


### Configuration

{{#if config.envFile}}
- [ ] `.env` file exists and is populated
  ```bash
  cat .env
  ```


{{#if config.sshKey}}
- [ ] SSH key is generated and loaded
  ```bash
  ssh-add -l
  ```
{{/if}}

{{#if config.gitUser}}
- [ ] Git user is configured
  ```bash
  git config user.name && git config user.email
  ```
{{/if}}
{{/if}}

{{#if environment.required}}
### Environment Variables

{{#each environment.required}}
- [ ] `` is set
  ```bash
  echo $
  ```
{{/each}}
{{/if}}

## Setup Steps Testing



## Functional Testing

### Basic Functionality

Test core features manually:

1. **Start the application**
   ```bash
   npm start
   # or appropriate start command
   ```

2. **Access the application**
   - Open browser to `http://localhost:PORT`
   - Verify homepage loads correctly

3. **Test key features**
   - Create/read/update/delete operations
   - Authentication (if applicable)
   - API endpoints (if applicable)

### Integration Testing

Test integrations with external services:

1. **Database connection**
   ```bash
   # Test database connection
   npm run db:test
   ```

2. **API connectivity**
   ```bash
   # Test external API calls
   curl http://localhost:PORT/api/health
   ```

3. **Third-party services**
   - Test authentication providers
   - Test payment gateways
   - Test notification services

## Common Test Scenarios

### Scenario 1: Fresh Install

1. Run `jetpack init`
2. Verify all dependencies install
3. Verify configuration generates
4. Run `jetpack verify`
5. Start application
6. Test basic functionality

### Scenario 2: Configuration Changes

1. Modify `.env` file
2. Restart application
3. Verify changes take effect
4. Run `jetpack verify`

### Scenario 3: Dependency Updates

1. Update package versions
2. Run installation
3. Run test suite
4. Verify functionality

## Smoke Tests

Quick tests to verify basic functionality:

```bash
# Test 1: Application starts
npm start &
sleep 5
curl http://localhost:PORT

# Test 2: Health endpoint
curl http://localhost:PORT/health

# Test 3: Database connection
npm run db:ping

# Test 4: Environment loaded
echo $DATABASE_URL
```

## Performance Testing

Basic performance checks:

```bash
# Response time test
time curl http://localhost:PORT

# Load test (if ab is installed)
ab -n 100 -c 10 http://localhost:PORT/

# Memory usage
ps aux | grep node
```

## Security Checks

Verify security measures:

1. **Secrets not exposed**
   ```bash
   # .env should not be in git
   git status --ignored | grep .env
   ```

2. **HTTPS in production**
   - Verify SSL certificates
   - Test HTTPS redirects

3. **Authentication**
   - Test login/logout
   - Verify token expiration
   - Test password reset

## Regression Testing

After making changes, verify:

- [ ] Existing features still work
- [ ] No new errors in console
- [ ] Tests pass: `npm test`
- [ ] Verification passes: `jetpack verify`

## Rollback Testing

Test rollback functionality:

```bash
# Create backup
cp .env .env.backup

# Make changes
# Test changes
# If issues, rollback
cp .env.backup .env

# Or use jetpack rollback
jetpack rollback
```

## Logging and Monitoring

Check logs for errors:

```bash
# Application logs
tail -f logs/app.log

# System logs (Linux)
journalctl -u <service-name> -f

# Windows Event Viewer
Get-EventLog -LogName Application -Newest 50
```

## Documentation Testing

Verify documentation accuracy:

- [ ] All commands in docs are correct
- [ ] All links work
- [ ] Screenshots are up-to-date
- [ ] Examples are executable

## Reporting Issues

If manual tests fail:

1. Document exact steps to reproduce
2. Capture error messages and logs
3. Note environment details (OS, versions)
4. Check [troubleshooting guide](../troubleshooting/common-issues.md)
5. File an issue with reproduction steps

---

For automated health checks, see [health checks guide](health-checks.md).
