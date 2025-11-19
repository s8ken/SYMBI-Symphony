# Vendored Code Documentation

This document describes vendored (third-party) code included in this repository, update procedures, and license retention.

## Overview

Vendored code is third-party source code that is copied into this repository rather than managed as external dependencies. This is done for specific reasons such as stability, custom modifications, or upstream compatibility.

## Vendored Components

### 1. Phaser 3 Rex Plugins Framework

**Location**: `Agentverse/ui/src/phaser3-rex-plugins/plugins/gameobjects/live2d/framework/`

**Source**: [rexrainbow/phaser3-rex-notes](https://github.com/rexrainbow/phaser3-rex-notes)

**Version**: Vendored from upstream (check package.json for version)

**License**: MIT License

**Reason for Vendoring**: 
- Custom modifications for SYMBI integration
- Stability for production deployments
- TypeScript compatibility adjustments

**Update Procedure**:
1. Check for updates at: https://github.com/rexrainbow/phaser3-rex-notes
2. Review changelog for breaking changes
3. Download/clone the specific version
4. Copy relevant files to `Agentverse/ui/src/phaser3-rex-plugins/`
5. Re-apply custom modifications (documented in git history)
6. Run tests: `cd Agentverse/ui && npm test`
7. Update version number in this document
8. Commit with message: `chore(vendor): update phaser3-rex-plugins to vX.Y.Z`

**Custom Modifications**:
- TypeScript type definitions enhancements
- Integration hooks for SYMBI agent system
- Configuration adjustments for enterprise environments

**Last Updated**: 2024 (check git log for exact date)

---

## Vendoring Policy

### When to Vendor

Vendor code when:
- The dependency is critical and upstream is unstable or unmaintained
- Custom modifications are required that cannot be contributed upstream
- The dependency version needs to be frozen for compliance/stability
- The dependency is small and rarely updated

### When NOT to Vendor

Avoid vendoring when:
- The dependency is actively maintained with regular updates
- No custom modifications are needed
- The dependency is large or frequently updated
- Security patches are common (use package manager instead)

### Security Considerations

1. **Scanning**: Vendored code IS included in security scans (CodeQL, Semgrep, Trivy)
2. **Linting**: Vendored code is excluded from style linting but NOT from security linting
3. **Updates**: Vendored code should be reviewed quarterly for security updates
4. **Tracking**: Document CVEs affecting vendored code in GitHub issues

### License Compliance

All vendored code must:
1. Retain original license files
2. Be compatible with this project's MIT license
3. Be documented in this file
4. Include proper attribution in NOTICE or LICENSE files

## Update Schedule

- **Security Updates**: As needed, within 7 days of disclosure
- **Feature Updates**: Quarterly review
- **Major Version Updates**: Annually or as needed

## Exclusions from Linting

Vendored directories are excluded from style linting via `.eslintignore`:

```
Agentverse/ui/src/phaser3-rex-plugins/
```

However, they ARE included in security scanning to detect vulnerabilities.

## Contributing

If you need to update vendored code:

1. Document the reason in the PR description
2. Update this VENDORED.md file
3. Run all security scans
4. Get approval from CODEOWNERS
5. Add `vendor-update` label to PR

## Questions?

Contact the maintainers at stephen@yseeku.com

---

**Maintained by**: SYMBI Team  
**Last Updated**: 2025-11-18
