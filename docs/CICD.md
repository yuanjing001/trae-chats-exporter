# CI/CD 自动化流程

## 概述

本项目采用简化的 CI/CD 流程，每次推送到 `main` 分支时自动执行编译、打包和发布。

## 工作流程

### 自动触发条件
- 推送代码到 `main` 分支

### 执行步骤
1. **代码检出** - 获取最新代码
2. **环境设置** - 安装 Node.js 和依赖
3. **代码检查** - 运行 ESLint 检查
4. **编译构建** - TypeScript 编译
5. **版本更新** - 基于时间戳自动生成新版本号
6. **扩展打包** - 生成 `.vsix` 文件
7. **提交版本** - 自动提交版本号更新
8. **创建发布** - 在 GitHub 创建 Release 并上传 `.vsix` 文件

## 版本号规则

版本号格式：`主版本.次版本.时间戳`

例如：
- 当前版本：`1.0.0`
- 新版本：`1.0.202412151430` (2024年12月15日14:30)

## 发布文件

每次构建会生成：
- `.vsix` 扩展安装包
- GitHub Release 页面
- 详细的发布说明

## 使用方法

### 开发者
1. 在本地开发完成后
2. 提交代码：`git commit -m "feat: 新功能"`
3. 推送到主分支：`git push origin main`
4. 自动触发 CI/CD 流程

### 用户下载
1. 访问项目的 [Releases 页面](https://github.com/yuanjing001/trae-chats-exporter/releases)
2. 下载最新的 `.vsix` 文件
3. 在 VS Code 中安装：
   - 按 `Ctrl+Shift+P` (或 `Cmd+Shift+P`)
   - 输入 "Extensions: Install from VSIX"
   - 选择下载的文件

## 本地测试

使用提供的脚本进行本地测试：

```bash
# 运行发布前检查
./scripts/release.sh

# 手动构建扩展
npm run compile
vsce package --no-dependencies
```

## 故障排除

### 常见问题

1. **构建失败**
   - 检查代码是否通过 ESLint
   - 确保 TypeScript 编译无错误

2. **版本冲突**
   - CI/CD 会自动处理版本号，无需手动修改

3. **权限问题**
   - 确保 GitHub Actions 有足够权限创建 Release

### 查看构建状态

访问 [GitHub Actions](https://github.com/yuanjing001/trae-chats-exporter/actions) 页面查看构建日志。