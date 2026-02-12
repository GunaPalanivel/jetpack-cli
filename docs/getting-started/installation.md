# Installation

## Prerequisites

Before installing Jetpack CLI, ensure your system meets these requirements:

*   **Node.js**: Version 16 or higher
*   **npm**: Version 8 or higher
*   **Git**: Installed and available in PATH

## Install via npm

Since Jetpack CLI is currently in development, you can clone and link it globally:

```bash
# Clone the repository
git clone https://github.com/GunaPalanivel/jetpack-cli.git
cd jetpack-cli

# Install dependencies
npm install

# Link command globally
npm link
```

## Verify Installation

Check that `jetpack` is available in your terminal:

```bash
jetpack --version
# Output: 1.0.0
```

## Upgrading

To upgrade to the latest version, pull the latest changes and reinstall dependencies:

```bash
cd jetpack-cli
git pull
npm install
```
