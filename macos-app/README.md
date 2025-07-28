# GitHub Discussions macOS App

This directory contains the macOS application built with SwiftUI that provides a native interface to GitHub Discussions.

## Features

- Native macOS interface using SwiftUI
- List and browse discussions
- View discussion details and comments
- Create new discussions and comments
- Shared configuration with CLI tool

## Development

To develop the macOS app:

1. Open Xcode
2. Create a new macOS App project in this directory
3. Choose SwiftUI as the interface
4. Implement the views and services as outlined in the design document

## Architecture

The app follows the MVVM pattern with:

- **Views**: SwiftUI views for the user interface
- **ViewModels**: Observable objects that manage state
- **Services**: Business logic and API communication
- **Models**: Data structures shared with the CLI

## Configuration

The app shares configuration with the CLI tool by reading from:
- `~/.github-discussions/config.json`
- `~/.github-discussions/token`

## Next Steps

1. Create the Xcode project structure
2. Implement the GitHub API service in Swift
3. Create the main views (Discussion List, Detail, Settings)
4. Add configuration management
5. Implement error handling and user feedback