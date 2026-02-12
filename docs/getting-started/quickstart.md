# Quickstart Guide

This guide will walk you through onboarding a project using Jetpack CLI.

## 1. Install Jetpack

If you haven't already, install Jetpack globally:

```bash
npm install -g jetpack-cli
```

## 2. Onboard a Repository

To set up a project, valid `.onboard.yaml` manifest is required. You can:

### Option A: Initialize from an existing Jetpack-enabled repo

```bash
jetpack init https://github.com/my-org/my-project
```

### Option B: Onboard a local project (AI Powered)

If you have a local project without a manifest, Jetpack can generate one for you using GitHub Copilot:

```bash
cd my-project
jetpack init . --copilot-generate
```

This will:
1.  Analyze your code.
2.  Generate `.onboard.yaml`.
3.  Install dependencies.
4.  Generate `.env` and other configs.

## 3. Verify Setup

Once initialization is complete, verify everything is working:

```bash
jetpack verify
```

If anything fails, ask Copilot to troubleshoot:

```bash
jetpack verify --copilot-troubleshoot
```
