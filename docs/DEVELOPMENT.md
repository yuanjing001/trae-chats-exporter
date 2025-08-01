# Development Guide

This document contains information for developers who want to contribute to or build the Trae Chat Exporter extension.

## Prerequisites

- Node.js (v18 or higher)
- pnpm (recommended) or npm
- Visual Studio Code or Trae IDE

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yuanjing001/trae-chats-exporter.git
   cd trae-chats-exporter
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Compile TypeScript**
   ```bash
   pnpm run compile
   ```

4. **Run in development mode**
   - Open the project in VS Code
   - Press `F5` to launch a new Extension Development Host window
   - Test the extension in the new window

## Building and Packaging

### Install VS Code Extension CLI

```bash
pnpm add -g @vscode/vsce
```

### Package the extension

```bash
vsce package --no-dependencies
```

This will generate a `.vsix` file (e.g., `trae-chats-exporter-0.1.1.vsix`)

### Install the packaged extension

**Method A: Command Line**
```bash
code --install-extension trae-chats-exporter-0.1.1.vsix
```

**Method B: VS Code Interface**
- Open VS Code
- Press `Cmd/Ctrl + Shift + P` to open Command Palette
- Type `Extensions: Install from VSIX...`
- Select the generated `.vsix` file

**Method C: Drag and Drop**
- Simply drag the `.vsix` file into VS Code window

## Available Scripts

- `pnpm run compile` - Compile TypeScript to JavaScript
- `pnpm run watch` - Watch for changes and recompile
- `pnpm run lint` - Run ESLint
- `pnpm run test` - Run tests

## Project Structure

```
├── src/
│   ├── extension.ts      # Main extension entry point
│   ├── utils.ts          # Utility functions
│   ├── types.ts          # Type definitions
│   └── test/             # Test files
├── out/                  # Compiled JavaScript output
├── images/               # Extension icons and assets
├── .github/workflows/    # CI/CD configuration
└── docs/                 # Documentation
```

## CI/CD

The project uses GitHub Actions for automated building and releasing. See [CICD.md](./CICD.md) for more details.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`pnpm run test && pnpm run lint`)
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Troubleshooting Development Issues

### Extension Not Loading in Development
- Make sure all dependencies are installed
- Check the TypeScript compilation output for errors
- Verify the extension manifest (`package.json`) is valid

### Build Errors
- Ensure you're using the correct Node.js version
- Clear node_modules and reinstall: `rm -rf node_modules && pnpm install`
- Check for TypeScript compilation errors: `pnpm run compile`

### Testing Issues
- Make sure VS Code is closed before running tests
- Check that test dependencies are properly installed
- Verify test configuration in `.vscode-test.mjs`

## Release Process

Releases are automated through GitHub Actions. When code is pushed to the main branch:

1. Dependencies are installed and code is compiled
2. Version number is automatically incremented
3. Extension is packaged
4. A new GitHub release is created with the `.vsix` file

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.