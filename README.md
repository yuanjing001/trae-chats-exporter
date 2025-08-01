
# trae-history-viewer

<table>
<tr>
<td><img width="100" src="./images/icon.png" /></td>
<td>View and browse your Trae AI chat history directly in VS Code. This extension allows you to access all your AI conversations across different workspaces, making it easy to reference past questions and AI solutions.</td>

</tr>
</table>


## Features

- 🔍 **Workspace Browser**: Access chat history from all your Trae workspaces in one place
- 💬 **Complete Chat History**: View full conversations including:
  - Code snippets and file selections
  - Your messages and queries
- ✨ **Clean Formatting**: 
  - Syntax-highlighted code blocks
  - Markdown-formatted conversations
  - Clear separation between messages
- 🚀 **Easy Access**: Quick command palette integration

## How to Use

1. Open Command Palette (`Cmd/Ctrl + Shift + P`)
2. Type "View Trae Chat History"
3. Select a workspace from the list
4. Choose a chat to view its contents

The chat will open in a new editor tab with proper formatting and syntax highlighting.

## Installation

### Option 1: Install from Source

If you want to build and install the extension from source:

#### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm
- Visual Studio Code  or Trae IDE

#### Build and Install Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/yuanjing001/trae-chats-exporter.git
   cd trae-chats-exporter
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Compile TypeScript**
   ```bash
   npm run compile
   ```

4. **Install VS Code Extension CLI (if not already installed)**
   ```bash
   npm install -g @vscode/vsce
   ```

5. **Package the extension**
   ```bash
   vsce package
   ```
   This will generate a `.vsix` file (e.g., `trae-chats-exporter-0.1.1.vsix`)

6. **Install the extension**
   
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

### Option 2: Download Pre-built Extension

Download the latest `.vsix` file from the [Releases](https://github.com/yuanjing001/trae-chats-exporter/releases) page and install using Method B or C above.

## Requirements

- Visual Studio Code 1.93.0 or higher
- Trae Editor installed locally
- Existing chat history in Trae

## Known Limitations

- Currently supports macOS paths only

### Troubleshooting

#### No Workspaces Found
- Ensure Trae is installed
- Check if you have any chat history in Trae
- Verify the path: `~/Library/Application Support/Trae/User/workspaceStorage`

#### Extension Not Working
- Make sure the extension is properly installed and enabled
- Check VS Code Developer Console for error messages (`Help > Toggle Developer Tools`)
- Verify that Trae database files exist in the expected location




## Contributing

Found a bug or have a suggestion? Please open an issue on our [GitHub repository](https://github.com/abakermi/traechat-downloader).

## License

This extension is licensed under the [MIT License](LICENSE).
