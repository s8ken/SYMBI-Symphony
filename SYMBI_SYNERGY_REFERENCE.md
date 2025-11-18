# SYMBI SYNERGY Reference

## Overview

The `SYMBI SYNERGY/` directory in this repository contains a vendored copy or backup of the SYMBI SYNERGY project for reference purposes. This is NOT the canonical source.

## Official Repository

The canonical and actively maintained SYMBI SYNERGY project is located at:

**Repository**: https://github.com/s8ken/SYMBI-SYNERGY (adjust if different)

## Purpose of Local Copy

The local copy serves as:
1. **Historical Reference**: Preserves state at time of integration
2. **Example Code**: Provides examples of agent orchestration patterns
3. **Integration Testing**: Enables local integration tests without external dependencies

## Synchronization Policy

### DO NOT modify code in `SYMBI SYNERGY/` directly

Instead:
1. Make changes in the canonical SYMBI SYNERGY repository
2. Submit PRs to the upstream project
3. After approval, update the reference here if needed

### Updating the Reference

When synchronization is needed:

```bash
# Option 1: Git subtree (if configured)
git subtree pull --prefix="SYMBI SYNERGY" <remote> <branch> --squash

# Option 2: Manual copy (for backups)
# 1. Clone the canonical repo
# 2. Copy relevant files to SYMBI SYNERGY/
# 3. Commit with message: "chore: update SYMBI SYNERGY reference to <commit-sha>"
```

### Backup Directory

The `SYMBI SYNERGY_backup_*/` directories are snapshots taken at specific points in time. They should:
- **Never be modified**
- **Not be included in new features**
- **Be documented with timestamp in directory name**

## Git Submodule Alternative

For better maintenance, consider converting to a git submodule:

```bash
# Remove the directory
git rm -r "SYMBI SYNERGY"

# Add as submodule
git submodule add https://github.com/s8ken/SYMBI-SYNERGY.git "SYMBI SYNERGY"

# Initialize and update
git submodule update --init --recursive
```

**Pros**:
- Automatic version tracking
- Clear separation of concerns
- Easier updates

**Cons**:
- Requires submodule commands for cloning
- More complex for contributors unfamiliar with submodules

## Integration Points

The SYMBI Symphony project integrates with SYMBI SYNERGY through:

1. **Agent Orchestration**: Shared agent lifecycle patterns
2. **Trust Evaluation**: Bridge between trust protocol and synergy agents
3. **Configuration**: Environment variable passing and service discovery

See `src/integration/` for integration code.

## For Contributors

If you need to work with SYMBI SYNERGY:

1. **Read**: Use the local copy for reference and understanding
2. **Modify**: Work in the canonical SYMBI SYNERGY repository
3. **Test**: Use integration tests that can point to either local or remote instances
4. **Document**: Update integration documentation when patterns change

## Questions?

- For SYMBI Symphony questions: Open an issue in this repository
- For SYMBI SYNERGY questions: Open an issue in the canonical SYMBI SYNERGY repository
- For integration questions: Tag both projects in the issue

---

**Last Updated**: 2025-11-18  
**Maintained by**: SYMBI Team
