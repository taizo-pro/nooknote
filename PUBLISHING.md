# Publishing to npm

This document explains how to publish the GitHub Discussions CLI to npm registry.

## Prerequisites

### 1. Create npm Account
If you don't have an npm account:
1. Go to [npmjs.com](https://www.npmjs.com/)
2. Sign up for a free account
3. Verify your email address

### 2. Login to npm
```bash
npm login
# Enter your npm username, password, and email
```

### 3. Verify Login
```bash
npm whoami
# Should display your npm username
```

## Publishing Process

### 1. Pre-publish Checks
```bash
# Run tests
npm test

# Build the project
npm run build

# Lint the code
npm run lint

# Check what will be published
npm pack --dry-run
```

### 2. Version Management
```bash
# For patch releases (bug fixes)
npm version patch

# For minor releases (new features)
npm version minor

# For major releases (breaking changes)
npm version major
```

### 3. Publish to npm
```bash
# First time publishing (public scoped package)
npm publish --access public

# Subsequent publishes
npm publish
```

## Verification

After publishing, verify the package:

```bash
# Install globally to test
npm install -g @taizo-pro/github-discussions-cli

# Test the CLI
gh-discussions --help

# Check package page
# Visit: https://www.npmjs.com/package/@taizo-pro/github-discussions-cli
```

## Troubleshooting

### Authentication Issues
```bash
# If login fails, try:
npm logout
npm login

# For organization scopes, ensure you have permissions
npm org ls taizo-pro
```

### Publishing Errors
```bash
# If package name is taken, update package.json:
{
  "name": "@your-username/github-discussions-cli"
}

# Then republish with --access public for scoped packages
npm publish --access public
```

### Version Conflicts
```bash
# Check existing versions
npm view @taizo-pro/github-discussions-cli versions --json

# Update version and republish
npm version patch
npm publish
```

## Automated Publishing (GitHub Actions)

Consider setting up automated publishing with GitHub Actions:

```yaml
# .github/workflows/publish.yml
name: Publish to npm

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org/'
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Current Package Information

- **Package Name**: `@taizo-pro/github-discussions-cli`
- **Version**: `1.0.0`
- **Registry**: npmjs.com
- **Access**: Public
- **License**: MIT