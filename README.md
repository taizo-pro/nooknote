# GitHub Discussions CLI & macOS App

A powerful CLI tool and macOS application for interacting with GitHub Discussions without opening a browser. Perfect for developers who want to quickly access, read, and contribute to discussions while staying in their development environment.

## Features

### CLI Tool
- 📋 List discussions in any repository
- 👀 View discussion details and comments
- 💬 Post comments to discussions
- ✨ Create new discussions
- ⚙️ Configurable settings and authentication
- 🎨 Multiple output formats (table, JSON, markdown)

### macOS App (Planned)
- 🖥️ Native macOS interface using SwiftUI
- 🔄 Shared configuration with CLI tool
- 📱 Modern, intuitive user experience
- 🚀 All CLI features in a native app

## Installation

### CLI Tool

#### Option 1: Direct Usage (Current Setup)
Since the project is already built, you can use it directly:

```bash
# Navigate to the project directory
cd /path/to/nooknote

# Run the CLI tool
node dist/cli/index.js --help
```

#### Option 2: Global Installation (Recommended)
Link the CLI tool globally for easier access:

```bash
# In the project directory
npm link

# Now you can use it from anywhere
gh-discussions --help
```

#### Option 3: From Source (Development)
If you want to modify or contribute:

```bash
git clone <your-repo-url>
cd github-discussions-cli
npm install
npm run build  # This creates the dist/ folder
npm link
```

> **Note**: The `dist/` folder is automatically generated during build and is excluded from git via `.gitignore`.

#### Option 4: Via npm (Future)
Once published to npm registry:

```bash
npm install -g github-discussions-cli
```

## Quick Start

1. **Build and link the CLI globally** (in the project directory):
   ```bash
   npm run build  # Build TypeScript to JavaScript
   npm link       # Make command available globally
   ```

2. **Set up authentication**:
   ```bash
   gh-discussions config
   ```

3. **Test with a public repository**:
   ```bash
   gh-discussions list microsoft/vscode
   ```

4. **View a specific discussion**:
   ```bash
   gh-discussions show 1 microsoft/vscode
   ```

## Setup

### 1. Create a GitHub Personal Access Token

Before using the CLI, you need to create a GitHub Personal Access Token with the required permissions:

1. **Sign in to GitHub** and go to your account settings
   
2. **Navigate to Developer Settings**
   - Click your profile picture (top-right corner)
   - Select **Settings**
   - Scroll down and click **Developer settings** (left sidebar)

3. **Access Personal Access Tokens**
   - Click **Personal access tokens**
   - Select **Tokens (classic)** or **Fine-grained tokens**

4. **Create New Token (Classic)**
   - Click **Generate new token** → **Generate new token (classic)**
   - Give your token a descriptive name (e.g., "GitHub Discussions CLI")
   - Set expiration (recommended: 90 days or custom)
   - Select the following scopes:
     - ✅ **repo** (Full control of private repositories)
       - This includes access to discussions in private repos
     - ✅ **public_repo** (Access public repositories) 
       - For discussions in public repos
   - Click **Generate token**

5. **Copy Your Token**
   - **⚠️ Important**: Copy the token immediately - you won't be able to see it again
   - Store it securely (you'll need it in the next step)

### 2. Configure the CLI Tool

Run the interactive configuration setup:

```bash
# If installed globally
gh-discussions config

# If running from source
node dist/cli/index.js config
```

The setup will prompt you for:
- **GitHub Token**: Paste the token you created above
- **Default Repository**: Enter a repo in `owner/repository` format (optional)
- **Output Format**: Choose table, json, or markdown (default: table)

### 3. Verify Setup

Test your configuration:

```bash
# Show current configuration
gh-discussions config --show

# Test by listing discussions (replace with actual repo)
gh-discussions list owner/repository
```

### Troubleshooting Token Issues

If you encounter authentication errors:

- **Invalid token**: Verify the token was copied correctly
- **Insufficient permissions**: Ensure you selected the `repo` scope
- **Token expired**: Create a new token if the old one expired
- **Private repo access**: The `repo` scope is required for private repositories

### Security Best Practices

- **Never share your token** or commit it to version control
- **Use the minimum required scopes** for your use case
- **Set reasonable expiration dates** and rotate tokens regularly
- **Revoke unused tokens** from GitHub settings

## Usage

> **Note**: If you haven't installed globally, replace `gh-discussions` with `node dist/cli/index.js` in all examples below.

### List Discussions
```bash
# List discussions in current/default repository
gh-discussions list

# List discussions in specific repository
gh-discussions list owner/repository

# Limit number of results
gh-discussions list --first 10

# Output as JSON
gh-discussions list --format json

# Output as markdown table
gh-discussions list --format markdown
```

### View Discussion Details
```bash
# Show discussion by number
gh-discussions show 42

# Show discussion in specific repository
gh-discussions show 42 owner/repository
```

### Create Comments
```bash
# Add comment with message
gh-discussions comment 42 "Great discussion!"

# Open editor for longer comments
gh-discussions comment 42 --editor

# Comment in specific repository
gh-discussions comment 42 "Thanks!" owner/repository
```

### Create Discussions
```bash
# Interactive creation
gh-discussions create

# With title and body
gh-discussions create "Bug Report" "I found a bug..."

# Open editor for body
gh-discussions create "Feature Request" --editor

# Specify category
gh-discussions create "Question" "How do I..." --category general
```

### Configuration
```bash
# Show current configuration
gh-discussions config --show

# Set GitHub token
gh-discussions config --token ghp_xxxxxxxxxxxx

# Set default repository
gh-discussions config --repo owner/repository

# Set default output format
gh-discussions config --format table

# Clear all configuration
gh-discussions config --clear
```

## Configuration Files

The tool stores configuration in `~/.github-discussions/`:
- `config.json` - General settings (default repo, output format)
- `token` - GitHub Personal Access Token (stored securely)

## Development

### Prerequisites
- Node.js 18+
- TypeScript
- npm or yarn

### Setup
```bash
git clone https://github.com/your-username/github-discussions-cli.git
cd github-discussions-cli
npm install
```

### Development Commands
```bash
# Build the project (creates dist/ folder)
npm run build

# Build and watch for changes during development
npm run build:watch

# Run in development mode (uses ts-node, no build required)
npm run dev

# Run tests
npm test

# Watch tests during development
npm run test:watch

# Lint code
npm run lint

# Format code
npm run format
```

### Build Process
- **Source**: TypeScript files in `src/`
- **Output**: JavaScript files in `dist/` (auto-generated)
- **Git**: `dist/` folder is excluded via `.gitignore`
- **Distribution**: Only built files are needed for execution

### Testing
```bash
# Run all tests
npm test

# Run with coverage
npm run test -- --coverage

# Run specific test file
npm test github-client.test.ts
```

## macOS App Development

The macOS app is built with SwiftUI and shares configuration with the CLI tool. See `macos-app/README.md` for development instructions.

## API Documentation

### Core Classes

#### GitHubClient
Main client for interacting with GitHub's GraphQL API.

#### AuthManager
Handles secure storage and validation of GitHub tokens.

#### ConfigManager
Manages user configuration and preferences.

## Error Handling

The tool provides detailed error messages and suggestions:

- **Authentication errors**: Invalid or expired tokens
- **Network errors**: Connection issues
- **API errors**: GitHub API-specific errors
- **Configuration errors**: Invalid settings or file permissions

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details.

## Support

- 🐛 Report bugs by creating an issue
- 💡 Request features by creating an issue
- 💬 Ask questions in GitHub Discussions
- 📖 Check the documentation in this README

## Roadmap

- [x] Basic CLI functionality
- [x] Authentication and configuration
- [x] Discussion listing and viewing
- [x] Comment creation
- [x] Discussion creation
- [ ] macOS app implementation
- [ ] Discussion search and filtering
- [ ] Reaction support
- [ ] Markdown editing improvements
- [ ] Configuration import/export