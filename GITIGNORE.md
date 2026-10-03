# ExtraTime — Git Ignore Reference

For the comprehensive documentation, rationale, and troubleshooting commands, please see:
👉 **[Git Ignore Documentation & Guide](docs/git-ignore.md)**

---

## Quick Summary of Ignored Items

- **Dependencies**: `node_modules/`, Yarn caches
- **Next.js & Build Outputs**: `.next/`, `out/`, `build/`, `*.tsbuildinfo`, `next-env.d.ts`
- **Secrets & Environments**: `.env*` (`.env.local`, `.env.production`, etc.)
- **Convex Database/State**: `.convex/`
- **System & OS Artifacts**: `.DS_Store`, `Thumbs.db`, `[Dd]esktop.ini`
- **IDE Configurations**: `.vscode/`, `.idea/`, swap files
- **Logs**: `*.log`, debug logs, scratch directories

### Essential Commands

```bash
# Check why a file is ignored:
git check-ignore -v <path>

# Untrack a file without deleting it:
git rm --cached <path>
```
