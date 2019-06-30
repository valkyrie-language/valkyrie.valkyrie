# Valkyrie 项目工具集

这是 Valkyrie 编程语言项目的开发工具集，为整个项目的开发、构建、发布提供完整的工具链支持。

## 🎯 项目概述

Valkyrie 是一个多范式编程语言项目，包含：

- **valkyrie-bootstrap**: Valkyrie 语言的自举编译器（JavaScript 实现）
- **valkyrie-document**: Valkyrie 语言的官方文档站点（VitePress 构建）
- **开发工具集**: 完整的开发工作流工具（当前目录）

## 🛠️ 工具列表

### 1. 发布报告生成器

**文件**: `generate-release-report.js`

基于 emoji commit 规范自动生成发布报告的 Node.js 工具。

#### 功能特点

- 🎯 智能解析 emoji 提交记录
- 📊 按类型分组和优先级排序
- 📝 生成 pnpm changeset 风格的 Markdown 报告
- 👥 包含作者信息统计
- 📅 支持时间段筛选

#### 支持的 Emoji 类型

| Emoji | 类型         | 优先级 | 标签                       |
|-------|------------|-----|--------------------------|
| ✨     | feature    | 1   | Stable Features          |
| 🔮    | experiment | 2   | Experimental Features    |
| ☢️    | breaking   | 3   | Breaking Changes         |
| 🔧    | fix        | 4   | Bug Fixes                |
| ⚡️    | perf       | 5   | Performance Improvements |
| 📝    | docs       | 6   | Documentation Updates    |
| 🧪    | test       | 7   | Tests                    |
| 🚦    | ci         | 8   | CI/CD                    |
| 🎨    | style      | 9   | Style Improvements       |

#### 使用方式

```bash
# 基本用法
node scripts/generate-release-report.js

# 生成变更日志
npm run change-log

# 生成最新发布报告
npm run release:latest

# 指定版本和标签范围
node scripts/generate-release-report.js v1.0.0 v1.1.0
```

### 2. Emoji Commit 规范工具

#### 配置文件

- **commit-lint.config.js**: Commitlint 配置，定义 emoji 提交规范
- **commit-msg**: Git 钩子脚本，强制 emoji 提交格式

#### 设置脚本

- **setup-emoji-commit.sh**: Unix/Linux/macOS 设置脚本
- **setup-emoji-commit.bat**: Windows 设置脚本

#### 功能特点

- 🔒 强制所有提交以 emoji+空格 开头
- 📏 消息长度限制（72字符）
- 🎨 支持 18 种 emoji 类型
- 🛠️ 交互式提交支持

#### 快速设置

```bash
# Unix/Linux/macOS
bash scripts/setup-emoji-commit.sh

# Windows
scripts\setup-emoji-commit.bat

# 或使用 npm 脚本
npm run setup-commit
```

#### 使用示例

```bash
# 交互式提交
npm run commit

# 直接提交
git commit -m "✨ 添加新功能"
git commit -m "🔧 修复首页加载问题"
git commit -m "📝 更新API文档"
```

### 3. 发布脚本

**文件**: `publish.sh`

自动化发布脚本，用于发布 Rust crate 包。

#### 功能

- 📦 发布 nyar-ast crate
- 📦 发布 valkyrie-parser crate
- 🔄 自动处理发布失败和版本升级

#### 使用

```bash
cd scripts
./publish.sh
```

## 🚀 快速开始

### 1. 环境设置

```bash
# 安装依赖
npm install

# 设置 emoji commit 规范
npm run setup-commit
```

### 2. 开发工作流

```bash
# 启动自举编译器
npm run boot

# 运行测试
npm test

# 格式化代码
npm run fmt

# 生成发布报告
npm run release:report
```

### 3. 发布流程

```bash
# 生成发布报告
npm run release:latest

# 发布 crate
./scripts/publish.sh
```

## 📋 项目结构

```
valkyrie.valkyrie/
├── scripts/                    # 开发工具集
│   ├── generate-release-report.js
│   ├── commit-lint.config.js
│   ├── setup-emoji-commit.sh
│   ├── setup-emoji-commit.bat
│   ├── commit-msg
│   └── publish.sh
├── projects/
│   ├── valkyrie-bootstrap/     # 自举编译器
│   └── valkyrie-document/      # 官方文档
├── package.json               # 根项目配置
└── pnpm-workspace.yaml       # pnpm 工作区配置
```

## 🔧 技术栈

- **Node.js**: 工具脚本运行环境
- **JavaScript**: 工具脚本语言
- **Git Hooks**: 提交规范强制
- **Commitlint**: 提交消息检查
- **Commitizen**: 交互式提交工具
- **pnpm**: 包管理器和工作区管理

## 📖 相关文档

- [贡献指南](../CONTRIBUTING.md)
- [Valkyrie 自举编译器](../projects/valkyrie-bootstrap/readme.md)
- [Valkyrie 语言文档](../projects/valkyrie-document/readme.md)

## 🤝 贡献

1. 使用 emoji commit 规范进行提交
2. 运行测试确保代码质量
3. 生成发布报告记录变更
4. 遵循项目的代码风格指南

## 📄 许可证

本项目采用与主项目相同的许可证。详见项目根目录的 LICENSE.md 文件。