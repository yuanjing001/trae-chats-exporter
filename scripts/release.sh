#!/bin/bash

# 简化版本发布脚本
# 用法: ./scripts/release.sh

set -e

echo "🚀 开始发布流程..."

# 检查是否在 main 分支
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "❌ 错误: 请在 main 分支上执行发布"
    exit 1
fi

# 检查工作目录是否干净
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ 错误: 工作目录不干净，请先提交所有更改"
    exit 1
fi

# 拉取最新代码
echo "📥 拉取最新代码..."
git pull origin main

# 安装依赖
echo "📦 安装依赖..."
npm ci

# 运行测试
echo "🧪 运行测试..."
npm run lint
npm run compile

# 构建扩展
echo "🔨 构建扩展..."
npm install -g @vscode/vsce
vsce package --no-dependencies

echo "✅ 发布准备完成！"
echo "💡 提示: 推送到 main 分支将自动触发 CI/CD 流程"
echo "   执行: git push origin main"