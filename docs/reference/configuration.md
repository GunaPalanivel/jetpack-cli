# Configuration

Jetpack CLI uses `.onboard.yaml` manifest files to define the setup process for a repository.

## Manifest Schema

The manifest is a YAML file at the root of your repository. It defines dependencies, environment variables, setup steps, and more.

### Example

```yaml
name: my-project
description: A sample project setup
dependencies:
  system:
    - nodejs
    - git
  npm:
    - typescript
    - eslint
  environment:
    required:
      - DATABASE_URL
    optional:
      - DEBUG
setup_steps:
  - name: Install dependencies
    command: npm install
  - name: Build project
    command: npm run build
ssh:
  generate: true
  comment: "jetpack-generated-key"
git:
  configure: true
  user:
    name: "Developer"
    email: "dev@example.com"
verification:
  checks:
    - name: HTTP check
      type: http
      url: http://localhost:3000
documentation:
  enabled: true
  output_dir: "./docs"
```

### Top-Level Fields

| Field | Type | Description | Required |
| :--- | :--- | :--- | :--- |
| `name` | string | Project name | Yes |
| `description` | string | Description of the project | No |
| `dependencies` | object | List of dependencies to install | Yes |
| `setup_steps` | array | List of commands to run for setup | Yes |
| `ssh` | object | SSH key generation settings | No |
| `git` | object | Git configuration settings | No |
| `verification` | object | Post-setup health checks | No |
| `documentation` | object | Documentation generation settings | No |

### Dependencies

Defines packages to install.

*   **system**: Array of system packages. Installing these requires platform-specific package managers (e.g., `brew`, `choco`, `apt`).
*   **npm**: Array of global npm packages.
*   **python**: Array of Python packages installed via `pip`.
*   **environment**: Object with `required` and `optional` environment variable names. Jetpack will prompt for values or allow generation.

### Setup Steps

An ordered list of commands.

*   `name`: Display name for the step.
*   `command`: Shell command to execute.

### SSH Configuration

*   `generate` (boolean): Whether to generate an SSH key pair.
*   `comment` (string): Comment for the generated key.
*   `algorithm` (string): Key algorithm (default: `ed25519`).

### Git Configuration

*   `configure` (boolean): Whether to enforce git user config.
*   `user.name` (string): Default user name.
*   `user.email` (string): Default user email.

### Verification

Define health checks to run after setup.

*   `checks`: Array of check objects.
    *   `type`: `http`, `tcp`, `command`, `file`, etc.
    *   `url`/`path`/`command`: Parameters specific to the check type.

### Documentation

Settings for auto-generated documentation.

*   `enabled` (boolean): Enable/disable doc generation.
*   `output_dir` (string): Directory to write docs to (default: `./docs`).
*   `sections` (array): List of sections to include (e.g., `getting-started`, `setup`).
