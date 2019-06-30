# Valkyrie Language

一个现代化的编程语言项目，包含自举编译器和文档站点。

## 🚀 项目结构

此项目包含以下主要组件：

### 📦 子项目

- **[valkyrie-bootstrap](./projects/valkyrie-bootstrap)** - Valkyrie 语言的自举编译器
    - 用 JavaScript 编写的自举编译器
    - 支持将 Valkyrie 代码编译为目标代码
    - 提供命令行工具 `valkyrie` 和 `valkyrie-bootstrap`

- **[valkyrie-document](./projects/valkyrie-document)** - Valkyrie 语言文档站点
    - 基于 VitePress 构建的文档网站
    - 包含语言规范、使用指南和示例
    - 部署在 Netlify 上

## 🛠️ 开发环境

### 前置要求

- Node.js >= 14.0.0
- pnpm >= 10.17.0

### 安装依赖

```bash
# 安装根项目依赖
pnpm install

# 安装子项目依赖
cd projects/valkyrie-document
pnpm install
```

## 📋 开发规范

### 提交规范

本项目使用 emoji 提交规范，所有提交必须遵循以下格式：

```
[emoji] [空格] [commit消息]
```

#### 常用 Emoji 类型

- ✨ `feat`: 新功能
- 🔧 `fix`: 修复bug
- 📝 `docs`: 文档更新
- 🎨 `style`: 代码格式调整
- 🔁 `refactor`: 重构代码
- 🧪 `test`: 测试相关
- 🔨 `config`: 配置文件修改
- ⚡️ `perf`: 性能优化
- 🚀 `release`: 发布版本

### 分支管理

**禁止使用 merge，必须使用 rebase：**

```bash
# 拉取最新代码并 rebase
git pull --rebase origin main

# 合并特性分支
git checkout main
git pull --rebase origin main
git rebase feature-branch
```

## 🎯 快速开始

### 文档站点开发

```bash
cd projects/valkyrie-document

# 启动开发服务器
pnpm run dev

# 构建文档
pnpm run build

# 预览构建结果
pnpm run preview
```

### 自举编译器

```bash
cd projects/valkyrie-bootstrap

# 运行自举过程
pnpm run bootstrap

# 编译 Valkyrie 代码
pnpm run compile

# 运行测试
pnpm run test
```

## 🚦 CI/CD

本项目使用 GitHub Actions 进行持续集成，配置包括：

- 提交消息验证
- 自动构建和测试
- 文档站点自动部署到 Netlify

## 🤝 贡献指南

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 确保所有提交遵循 emoji 提交规范
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开 Pull Request

详细的贡献指南请查看 [CONTRIBUTING.md](./CONTRIBUTING.md)

## 📄 许可证

MIT License - 详见 [LICENSE.md](./LICENSE.md) 文件