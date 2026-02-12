# The Manifest

The `.onboard.yaml` file is the source of truth for your project's development environment.

## Design Philosophy

*   **Declarative**: You describe *what* you need, not *how* to install it.
*   **Cross-Platform**: The same manifest works on Windows, macOS, and Linux.
*   **Secure**: Dependencies are validated to prevent command injection.

## Schema Versioning

Currently, Jetpack supports `v1` schema. Future versions will handle schema migrations automatically.

[View the full Configuration Schema](../reference/configuration.md)
