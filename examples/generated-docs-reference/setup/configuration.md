# ⚙️ Configuration

Configuration files and settings for **example-docs-project**.


## Generated Configuration

The following configuration was automatically generated:

- **Environment**: .env (3 variables)
- **SSH Key**: ~/.ssh/id_ed25519
- **Git User**: Test User <test@example.com>

{{#if config.envFile}}
### Environment Variables

Your `.env` file has been created with project-specific variables.

**Important**: Never commit `.env` to version control. Use `.env.template` or `.env.example` for sharing configuration structure.

View your configuration:
```bash
cat .env
```



### SSH Keys

SSH key generated at: **~/.ssh/id_ed25519**

Your public key:
```bash
cat ~/.ssh/id_ed25519.pub
```

Add this key to your GitHub/GitLab account for repository access.



### Git Configuration

Git identity configured as: **Test User <test@example.com>**

View your git config:
```bash
git config --global user.name
git config --global user.email
```

{{/if}}

## Manual Configuration


### Required Variables

Ensure these environment variables are set in your `.env`:


```bash
DATABASE_URL=your_value_here
```

```bash
API_KEY=your_value_here
```

```bash
JWT_SECRET=your_value_here
```




### Optional Variables

You may also configure these optional variables:


```bash
DEBUG_MODE=your_value_here
```

```bash
LOG_LEVEL=your_value_here
```



## Configuration Files

Common configuration files for this project:

- **`.env`** - Environment variables (DO NOT commit)
- **`.env.template`** - Template for required variables (commit this)
- **`.env.example`** - Example configuration with documentation
- **`.gitignore`** - Ensures sensitive files aren't committed

## Validation

Verify your configuration:

```bash
jetpack verify
```

This will check that all required variables are set and valid.

---

For configuration issues, see [troubleshooting guide](../troubleshooting/common-issues.md).
