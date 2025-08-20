# Publishing Guide for google-maps-geocoding-mcp

This guide explains how to publish this MCP server to npm so others can use it with `npx`.

## Prerequisites

1. **npm Account**: Create an account at [npmjs.com](https://www.npmjs.com/signup)
2. **Authentication**: Login to npm from your terminal:
   ```bash
   npm login
   ```

## Pre-publish Checklist

- [ ] Update version in `package.json` following [semver](https://semver.org/)
- [ ] Update author name in `package.json` (replace "Your Name")
- [ ] Update repository URLs in `package.json` (replace "your-username")
- [ ] Update copyright in `LICENSE` file
- [ ] Ensure all tests pass: `pnpm test:run`
- [ ] Build successfully: `pnpm build`
- [ ] Update `README.md` with any new features or changes

## Publishing Steps

### 1. Update Package Metadata

Edit `package.json`:

```json
{
  "name": "google-maps-geocoding-mcp", // or use a scoped name like @yourname/google-maps-geocoding-mcp
  "version": "1.0.0", // increment appropriately
  "author": "Your Real Name",
  "repository": {
    "url": "git+https://github.com/YOUR-USERNAME/google-maps-geocoding-mcp.git"
  }
}
```

### 2. Test Locally

Test the package as if it were installed from npm:

```bash
# Build the project
pnpm build

# Create a local package
pnpm pack

# This creates google-maps-geocoding-mcp-1.0.0.tgz
# Test it in another directory
cd /tmp
npm init -y
npm install /path/to/google-maps-geocoding-mcp-1.0.0.tgz

# Test with npx (using full path)
GOOGLE_MAPS_API_KEY=your_key npx /path/to/google-maps-geocoding-mcp-1.0.0.tgz
```

### 3. Publish to npm

```bash
# Dry run to see what will be published
pnpm publish --dry-run

# Publish for real
pnpm publish --access public
```

Note: The `prepublishOnly` script will automatically:

1. Clean the dist directory
2. Build the TypeScript code
3. Run tests
4. Add shebang line to dist/index.js
5. Make dist/index.js executable

### 4. Verify Publication

After publishing, test that it works:

```bash
# Test with npx (after a few minutes for npm to update)
GOOGLE_MAPS_API_KEY=your_key npx google-maps-geocoding-mcp

# Or install globally
npm install -g google-maps-geocoding-mcp
GOOGLE_MAPS_API_KEY=your_key google-maps-geocoding-mcp
```

## Usage After Publishing

Once published, users can use your MCP server in three ways:

### 1. With npx (no installation required)

```bash
npx google-maps-geocoding-mcp
```

### 2. Global Installation

```bash
npm install -g google-maps-geocoding-mcp
google-maps-geocoding-mcp
```

### 3. In Claude Desktop or Cursor Config

```json
{
  "mcpServers": {
    "google-maps-geocoding": {
      "command": "npx",
      "args": ["google-maps-geocoding-mcp"],
      "env": {
        "GOOGLE_MAPS_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## Version Management

Follow [Semantic Versioning](https://semver.org/):

- **Patch** (1.0.x): Bug fixes, documentation updates
- **Minor** (1.x.0): New features, backwards compatible
- **Major** (x.0.0): Breaking changes

Update version:

```bash
# Patch release
npm version patch

# Minor release
npm version minor

# Major release
npm version major
```

## Troubleshooting

### "Package name already exists"

If the name is taken, you can:

1. Use a scoped package name: `@yourname/google-maps-geocoding-mcp`
2. Choose a different name

### "npm ERR! code E403"

Make sure you're logged in:

```bash
npm whoami
npm login
```

### "Files not included in package"

Check what will be included:

```bash
npm pack --dry-run
```

The `files` field in `package.json` controls what gets published:

```json
"files": [
  "dist/**/*",
  "README.md",
  "LICENSE"
]
```

## Maintenance

### Updating the Package

1. Make your changes
2. Update version: `npm version patch/minor/major`
3. Publish: `pnpm publish`

### Deprecating Versions

If you need to deprecate a version:

```bash
npm deprecate google-maps-geocoding-mcp@1.0.0 "Critical bug, please upgrade to 1.0.1"
```

### Unpublishing (within 72 hours only)

```bash
npm unpublish google-maps-geocoding-mcp@1.0.0
```

## Best Practices

1. **Always test before publishing** using `pnpm pack` and local installation
2. **Use `prepublishOnly`** script to ensure builds are fresh
3. **Document breaking changes** in README or CHANGELOG
4. **Use npm tags** for pre-releases: `pnpm publish --tag beta`
5. **Keep dependencies minimal** for faster installs
6. **Include only necessary files** via `files` field or `.npmignore`

## Security Notes

- Never include `.env` files or API keys in the published package
- Review `.npmignore` before publishing
- Use `npm audit` to check for vulnerabilities
- Consider using 2FA on your npm account
