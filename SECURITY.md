# Security Policy

## Reporting a vulnerability

Do **not** open a public GitHub Issue for a security vulnerability.

Report privately using [GitHub Private Vulnerability Reporting / Security Advisories](https://github.com/DouglasPrado/ushark/security/advisories/new) if that feature is enabled on the repository. If the advisory form is unavailable, contact a repository maintainer privately through GitHub.

No dedicated security email is published for this project.

Please include:

- a description of the issue and its impact
- affected files, components, or specification sections
- steps to reproduce, if applicable
- whether you know of existing exploitation

Do not attach real secrets, production credentials, private torrent passkeys, or personal media libraries.

## Supported versions

This repository currently publishes **draft specifications only**. There is no released application version.

When tagged releases exist, security fixes will apply to the latest Stable channel described in [CI/CD & Quality Gates](docs/architecture/10-ci-cd-quality-gates.md). Older tags should not be assumed supported until a support matrix is published.

## Disclosure

1. Maintainers confirm receipt when they are able.
2. The report is assessed against the [Security Model](docs/architecture/08-security-model.md).
3. A fix is prepared privately when the issue is valid.
4. Public disclosure happens after a fix is available, or after maintainers determine the report is not a vulnerability, unless a different timeline is agreed with the reporter.

Please give maintainers reasonable time before any public write-up.

## Scope notes

Relevant trust boundaries for this product (once implemented) include manifests, `.tslib` packages, torrents/magnets, deep links, metadata providers, IPC, and the Electron renderer. See Architecture 08 for the intended fail-closed rules (signature, hash, path, schema, IPC auth).
