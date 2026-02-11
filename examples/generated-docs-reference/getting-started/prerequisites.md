# 📋 Prerequisites

Before setting up **example-docs-project**, ensure your system meets these requirements.

## System Requirements

### Operating System

This project supports:
- **Windows** 10/11 (PowerShell 5.1+)
- **macOS** 11+ (Monterey or later)
- **Linux** (Ubuntu 20.04+, Debian 11+, or equivalent)

Your system: **Windows_NT**

### Required Software

The following software must be installed:


| Type | Packages |
|------|----------|
| System | docker, nodejs, git |
| npm | eslint, prettier, typescript |
| Python | black, pytest |



#### Node.js & npm

- **Node.js**: 16.x or higher
- **npm**: 8.x or higher

Check your versions:
```bash
node --version
npm --version
```



#### Python

- **Python**: 3.8 or higher
- **pip**: Latest version

Check your version:
```bash
python --version
pip --version
```


## Environment Setup


### Required Environment Variables

You'll need to configure these variables:


- **`DATABASE_URL`** - (Description needed)

- **`API_KEY`** - (Description needed)

- **`JWT_SECRET`** - (Description needed)




### Optional Environment Variables

These variables are optional but recommended:


- **`DEBUG_MODE`** - (Description needed)

- **`LOG_LEVEL`** - (Description needed)



## Verification

After installing prerequisites, verify your setup:

```bash
# Check Node.js
node --version

# Check npm
npm --version


# Check system dependencies

docker --version

nodejs --version

git --version


```

## Troubleshooting

If you're missing any prerequisites:

- **Windows**: Use [Chocolatey](https://chocolatey.org/) or [Scoop](https://scoop.sh/)
- **macOS**: Use [Homebrew](https://brew.sh/)
- **Linux**: Use your distribution's package manager (apt, yum, dnf)

For detailed installation instructions, see [setup documentation](../setup/dependencies.md).

---

> **Note for Windows users**: Use PowerShell or Command Prompt to run commands.
