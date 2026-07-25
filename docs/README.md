# Synaptria Engineering Documentation

This directory is the canonical source of truth for Synaptria product and engineering documentation. Update these documents whenever system behavior, architecture, or major technical decisions change.

## What Synaptria Is

Synaptria is an enterprise, multi-tenant SaaS platform for biotech organizations. It coordinates program execution, project management, vendor coordination, document intelligence, reporting, and decision support across scientific, operational, financial, and external partner workflows. It is not an ELN or LIMS; it is the operating system for how biotech work gets done.

## Start Here

| Document | Description |
| --- | --- |
| [architecture/system.md](./architecture/system.md) | Platform overview, core components, and architectural decisions |
| [architecture/layers.md](./architecture/layers.md) | Layered architecture, package boundaries, and dependency rules |
| [architecture/coding-standards.md](./architecture/coding-standards.md) | TypeScript, security, testing, and review conventions |

## Additional Documentation

The repository contains deeper topic-specific documentation organized by area:

| Area | Location |
| --- | --- |
| Overview and vision | [00-overview/](./00-overview/) |
| Detailed architecture topics | [01-architecture/](./01-architecture/) |
| Database and schema | [02-database/](./02-database/) |
| Product domains | [03-product/](./03-product/) |
| UI and design system | [04-ui/](./04-ui/) |
| Development workflow | [05-development/](./05-development/) |
| Architecture Decision Records | [ADR/](./ADR/) |

## Related Resources

- [AGENTS.md](../AGENTS.md) — agent and contributor workflow rules
- [README.md](../README.md) — repository setup and quick start

## Documentation Principles

1. **Accuracy over aspiration.** Document what the system does today; note planned work explicitly.
2. **Security by default.** Tenant isolation, authorization, and audit requirements belong in every relevant document.
3. **Single source of truth.** Avoid duplicating decisions; link to ADRs and canonical docs instead.
4. **Keep docs close to change.** Significant features or refactors should include documentation updates in the same pull request.
