# Valkyrie Programming Language

一个现代化的多范式编程语言项目，专注于自举编译器技术和高性能运行时系统。

## 🎯 项目概述

Valkyrie 是一个实验性的编程语言项目，旨在探索现代编译器技术和语言设计理念。项目包含：

- **自举编译器**: 使用 JavaScript 实现的 Valkyrie 语言编译器，支持自举过程
- **文档系统**: 基于 VitePress 的完整文档站点，包含语言规范和教程
- **开发工具链**: 完整的开发工作流工具，包括自动化发布和代码规范

## 🏗️ 项目结构

```
valkyrie.valkyrie/
├── scripts/                    # 开发工具集
│   ├── generate-release-report.js    # 自动化发布报告生成器
│   ├── commit-lint.config.js         # Emoji 提交规范配置
│   ├── setup-emoji-commit.*          # 提交规范设置脚本
│   └── publish.sh                    # 发布脚本
├── projects/
│   ├── valkyrie-bootstrap/     # 自举编译器项目
│   └── valkyrie-document/      # 文档站点项目
├── package.json               # 根项目配置
├── pnpm-workspace.yaml       # pnpm 工作区配置
└── README.md                 # 项目文档
```

### 📦 核心子项目

#### [valkyrie-bootstrap](./projects/valkyrie-bootstrap)
Valkyrie 语言的自举编译器实现：
- 使用 JavaScript 编写的完整编译器
- 支持将 Valkyrie 代码编译为 JavaScript
- 实现完整的自举过程验证
- 包含词法分析、语法分析、代码生成等核心组件

#### [valkyrie-document](./projects/valkyrie-document)
Valkyrie 语言的官方文档站点：
- 基于 VitePress 构建的现代文档网站
- 包含语言规范、使用指南和示例代码
- 支持多平台部署（Netlify）
- 提供交互式代码示例和教程

## 🚀 快速开始

### 环境要求

- **Node.js**: >= 14.0.0
- **pnpm**: >= 10.17.0 (推荐使用 pnpm 作为包管理器)

### 安装依赖

```bash
# 安装根项目依赖
pnpm install

# 设置开发环境（包括提交规范）
pnpm run setup-commit
```

### 开发工作流

```bash
# 启动自举编译器
pnpm run boot

# 运行测试
pnpm test

# 格式化代码
pnpm run fmt

# 生成发布报告
pnpm run release:report

# 启动文档站点开发服务器
pnpm run help
```

## 📋 开发规范

### 🎯 提交规范

本项目采用 **Emoji 提交规范**，所有提交必须遵循以下格式：

```
[emoji] [空格] [提交消息]
```

#### 支持的 Emoji 类型

| Emoji | 类型 | 描述 |
|-------|------|------|
| ✨ | feature | 新功能 |
| 🔮 | experiment | 实验性功能 |
| ☢️ | breaking | 破坏性变更 |
| 🔧 | fix | Bug 修复 |
| ⚡️ | perf | 性能优化 |
| 📝 | docs | 文档更新 |
| 🧪 | test | 测试相关 |
| 🚦 | ci | CI/CD 配置 |
| 🎨 | style | 代码格式 |

#### 使用示例

```bash
# 交互式提交（推荐）
pnpm run commit

# 直接提交
git commit -m "✨ 添加新的语法分析功能"
git commit -m "🔧 修复编译器内存泄漏问题"
git commit -m "📝 更新语言规范文档"
```

### 🔄 分支管理

**重要原则：禁止使用 merge，必须使用 rebase**

```bash
# 拉取最新代码并 rebase
git pull --rebase origin main

# 合并特性分支
git checkout main
git pull --rebase origin main
git rebase feature-branch
```

## 🛠️ 技术栈

### 核心工具
- **Node.js**: 运行时环境
- **pnpm**: 包管理器和工作区管理
- **JavaScript**: 主要开发语言
- **VitePress**: 文档站点构建

### 开发工具
- **Prettier**: 代码格式化
- **Commitlint**: 提交消息验证
- **Commitizen**: 交互式提交工具
- **Git Hooks**: 自动化代码检查

## 📊 项目状态

### 当前进展
- ✅ 自举编译器基础功能完成
- ✅ 文档站点框架搭建完成
- ✅ 开发工具链集成完成
- 🔄 语言特性持续开发中
- 🔄 编译器优化进行中

### 近期计划
- 完善语言语法和语义
- 增强编译器性能和稳定性
- 扩展文档内容和示例
- 添加更多开发工具

## 🤝 贡献指南

我们欢迎所有形式的贡献！

1. **Fork** 本项目到您的账户
2. **创建特性分支** (`git checkout -b feature/amazing-feature`)
3. **遵循提交规范** 进行开发
4. **运行测试** 确保代码质量
5. **提交 Pull Request** 并描述您的变更

详细的贡献指南请参考 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 📞 社区与支持

- 📖 **文档**: [官方文档站点](https://valkyrie-document.netlify.app)
- 🐛 **问题反馈**: [GitHub Issues](https://github.com/nyar-lang/valkyrie-vm/issues)
- 💡 **功能建议**: [GitHub Discussions](https://github.com/nyar-lang/valkyrie-vm/discussions)
- 📧 **邮件联系**: 通过 GitHub 联系维护者

## 📄 许可证

本项目采用 **MIT 许可证** 开源 - 详见 [LICENSE.md](./LICENSE.md) 文件。

## 🙏 致谢

感谢所有贡献者和支持者！特别致谢：
- 现代编译器技术社区的启发
- 开源社区的贡献和支持
- 所有参与测试和反馈的用户

---

**准备好探索现代编译器技术了吗？** 立即开始您的 Valkyrie 之旅！