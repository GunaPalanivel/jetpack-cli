# 📦 Dependencies

Complete list of dependencies installed for **example-docs-project**.

## Installed Packages

| Type | Packages |
|------|----------|
| System | docker, nodejs, git |
| npm | eslint, prettier, typescript |
| Python | black, pytest |

{{#if dependencies.system}}
## System Dependencies

These tools were installed at the system level:

{{#each dependencies.system}}
### ``

Check installation:
```bash
 --version
```
{{/each}}
{{/if}}

{{#if dependencies.npm}}
## npm Packages

Global npm packages installed:

{{#each dependencies.npm}}
- **``**
{{/each}}

Check installations:
```bash
npm list -g --depth=0
```
{{/if}}

{{#if dependencies.python}}
## Python Packages

Python packages installed via pip:

{{#each dependencies.python}}
- **``**
{{/each}}

Check installations:
```bash
pip list
```
{{/if}}

## Updating Dependencies

To update dependencies in the future:

{{#if dependencies.npm}}
```bash
npm update -g
```
{{/if}}

{{#if dependencies.python}}
```bash
pip install --upgrade black, pytest
```
{{/if}}

## Uninstalling

If you need to remove dependencies:

{{#if dependencies.npm}}
```bash
npm uninstall -g eslint, prettier, typescript
```
{{/if}}

{{#if dependencies.python}}
```bash
pip uninstall black, pytest
```
{{/if}}

---

For troubleshooting dependency issues, see [common issues](../troubleshooting/common-issues.md).
