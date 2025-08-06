#!/bin/bash

# 开发环境设置脚本

set -e

echo "🚀 设置 TraeChats Exporter 开发环境..."

# 检查 Node.js 版本
echo "📋 检查 Node.js 版本..."
NODE_VERSION=$(node --version)
echo "Node.js 版本: $NODE_VERSION"

if ! node -e "process.exit(parseInt(process.version.slice(1)) >= 18 ? 0 : 1)"; then
    echo "❌ 错误: 需要 Node.js 18 或更高版本"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
npm install

# 安装全局工具
echo "🔧 安装开发工具..."
npm install -g @vscode/vsce

# 编译项目
echo "🔨 编译项目..."
npm run compile

# 运行测试
echo "🧪 运行测试..."
npm run test

# 设置 Git hooks
echo "🪝 设置 Git hooks..."
mkdir -p .git/hooks

cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Pre-commit hook

echo "🔍 运行 pre-commit 检查..."

# 运行 linting
npm run lint
if [ $? -ne 0 ]; then
    echo "❌ Linting 失败"
    exit 1
fi

# 编译检查
npm run compile
if [ $? -ne 0 ]; then
    echo "❌ 编译失败"
    exit 1
fi

echo "✅ Pre-commit 检查通过"
EOF

chmod +x .git/hooks/pre-commit

# 创建开发配置文件
echo "⚙️ 创建开发配置..."
cat > .vscode/launch.json << 'EOF'
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Run Extension",
            "type": "extensionHost",
            "request": "launch",
            "args": [
                "--extensionDevelopmentPath=${workspaceFolder}"
            ],
            "outFiles": [
                "${workspaceFolder}/out/**/*.js"
            ],
            "preLaunchTask": "${workspaceFolder}/npm: compile"
        },
        {
            "name": "Extension Tests",
            "type": "extensionHost",
            "request": "launch",
            "args": [
                "--extensionDevelopmentPath=${workspaceFolder}",
                "--extensionTestsPath=${workspaceFolder}/out/test"
            ],
            "outFiles": [
                "${workspaceFolder}/out/test/**/*.js"
            ],
            "preLaunchTask": "${workspaceFolder}/npm: compile"
        }
    ]
}
EOF

echo "✅ 开发环境设置完成!"
echo ""
echo "📝 下一步:"
echo "1. 在 VS Code 中打开项目"
echo "2. 按 F5 启动扩展开发"
echo "3. 使用 'npm run watch' 进行实时编译"
echo "4. 使用 './scripts/release.sh patch' 发布新版本"