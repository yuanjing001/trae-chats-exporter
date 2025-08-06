
# Trae Chats Exporter

<table>
<tr>
<td><img width="100" src="./images/icon.png" /></td>
<td>Export and view your Trae AI chat history directly in VS Code. This extension allows you to access all your AI conversations across different workspaces, making it easy to reference past questions and AI solutions.</td>
</tr>
</table>

## ✨ Features

- 🔍 **Workspace Browser**: Access chat history from all your Trae workspaces in one place
- 💬 **Complete Chat History**: View full conversations including:
  - Code snippets and file selections
  - Your messages and queries
  - AI responses and suggestions
- ✨ **Clean Formatting**: 
  - Syntax-highlighted code blocks
  - Markdown-formatted conversations
  - Clear separation between messages
- 🚀 **Easy Access**: Quick command palette integration
- 📁 **Export Options**: Save chat histories as SQLite databases for offline access

## 🚀 How to Use

1. **Open Command Palette** (`Cmd/Ctrl + Shift + P`)
2. **Type** "Export TraeChats"
3. **Select a workspace** from the list
4. **Choose a chat** to view its contents

The chat will open in a new editor tab with proper formatting and syntax highlighting.

## 📦 Installation

### Download and Install

1. **Download** the latest `.vsix` file from the [Releases](https://github.com/yuanjing001/trae-chats-exporter/releases) page

2. **Install the extension** using one of these methods:

   **Method A: VS Code Interface**
   - Open VS Code
   - Press `Cmd/Ctrl + Shift + P` to open Command Palette
   - Type `Extensions: Install from VSIX...`
   - Select the downloaded `.vsix` file
   
   **Method B: Drag and Drop**
   - Simply drag the `.vsix` file into VS Code window

   **Method C: Command Line**
   ```bash
   code --install-extension trae-chats-exporter-x.x.x.vsix
   ```

## 📋 Requirements

- Visual Studio Code 1.93.0 or higher
- Trae Editor installed locally
- Existing chat history in Trae

## ⚠️ Known Limitations

- Currently supports macOS paths only
- Requires local Trae installation

## 🔧 Troubleshooting

### No Workspaces Found
- Ensure Trae is installed and you have used it before
- Check if you have any chat history in Trae
- Verify the path exists: `~/Library/Application Support/Trae/User/workspaceStorage`

### Extension Not Working
- Make sure the extension is properly installed and enabled
- Restart VS Code after installation
- Check VS Code Developer Console for error messages (`Help > Toggle Developer Tools`)

## 🤝 Contributing

We welcome contributions! If you'd like to contribute to this project:

- **Report Issues**: Found a bug? [Open an issue](https://github.com/yuanjing001/trae-chats-exporter/issues)
- **Suggest Features**: Have an idea? [Start a discussion](https://github.com/yuanjing001/trae-chats-exporter/discussions)
- **Contribute Code**: See our [Development Guide](./docs/DEVELOPMENT.md) for setup instructions

## 📄 License

This extension is licensed under the [MIT License](./LICENSE).

---

**Enjoy browsing your Trae chat history! 🚀**
