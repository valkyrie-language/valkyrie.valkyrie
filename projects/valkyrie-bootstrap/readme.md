# Valkyrie Bootstrap Compiler

Valkyrie 语言自举编译器 - 使用 JavaScript 实现的 Valkyrie 语言编译器自举系统。

## 🎯 项目概述

本项目实现了一个完整的 Valkyrie 语言编译器自举系统，能够用 Valkyrie 语言自身来编写编译器，并通过自举过程验证编译器的正确性和一致性。

### 🏗️ 项目结构

```tree
valkyrie-bootstrap/
├── bootstrap/          # 当前编译器（单个 JavaScript 文件）
│   └── index.js       # 编译器入口文件
├── library/           # Valkyrie 语言编写的编译器源代码
│   ├── lexer/         # 词法分析器模块
│   ├── parser/        # 语法分析器模块
│   ├── generation/    # 代码生成器模块
│   └── compiler/      # 编译器核心模块
├── dist/              # 编译输出目录
│   ├── stage-0/       # 第一阶段编译结果
│   ├── stage-1/       # 第二阶段编译结果
│   └── *.js           # 测试编译输出文件
├── test/              # 测试文件目录
│   ├── *.vk           # Valkyrie 测试源文件
│   ├── *.js           # 预期编译输出
│   └── */             # 复杂测试场景目录
├── bootstrap.js       # 主引导程序
├── package.json       # 项目配置
└── README.md         # 项目文档
```

## 🚀 核心功能

### 自举编译流程

#### 阶段 0: 初始编译
使用当前的编译器（`bootstrap/index.js`）来编译 `library/` 目录中的 Valkyrie 语言源代码：

```javascript
// 加载当前编译器
const bootstrapCompiler = await import('./bootstrap/index.js');

// 使用 generateSingleJS 函数生成 stage-0 编译器
const result = bootstrapCompiler.package_compiler_generate_single_js(libraryFiles);
fs.writeFileSync('./dist/stage-0/index.js', result);
```

#### 阶段 1: 自举验证
使用阶段 0 生成的编译器再次编译相同的源代码：

```javascript
// 加载阶段 0 编译器
const stage0Compiler = await import('./dist/stage-0/index.js');

// 再次编译 library/ 目录生成 stage-1 编译器
const result = stage0Compiler.package_compiler_generate_single_js(libraryFiles);
fs.writeFileSync('./dist/stage-1/index.js', result);
```

#### 阶段 2: 一致性验证
比较阶段 0 和阶段 1 生成的编译器文件，确保它们完全一致：

```javascript
// 比较两个阶段的输出
const stage0Content = fs.readFileSync('./dist/stage-0/index.js', 'utf8');
const stage1Content = fs.readFileSync('./dist/stage-1/index.js', 'utf8');

if (stage0Content === stage1Content) {
    // 自举成功！用新生成的编译器替换旧的
    fs.copyFileSync('./dist/stage-1/index.js', './bootstrap/index.js');
}
```

### 编译器架构

#### 核心模块

1. **词法分析器 (Lexer)**
   - `library/lexer/ValkyrieLexer.valkyrie` - 主词法分析器
   - `library/lexer/Token.valkyrie` - 词法单元定义
   - 支持 Unicode 标识符和现代语法特性

2. **语法分析器 (Parser)**
   - `library/parser/ValkyrieParser.valkyrie` - 主语法分析器
   - `library/parser/Node.valkyrie` - AST 节点定义
   - 支持递归下降解析和错误恢复

3. **代码生成器 (Code Generation)**
   - `library/generation/JsCodeGeneration.valkyrie` - JavaScript 代码生成
   - 支持 ES6+ 语法和现代 JavaScript 特性

4. **编译器核心 (Compiler Core)**
   - `library/compiler/Compiler.valkyrie` - 主编译器类
   - `library/compiler/CompilerOptions.valkyrie` - 编译选项
   - `library/compiler/CompilerDiagnostics.valkyrie` - 诊断系统
   - `library/compiler/DependencyAnalyzer.valkyrie` - 依赖分析
   - `library/compiler/NamespaceManager.valkyrie` - 命名空间管理

## 🛠️ 使用方式

### 运行完整的自举过程

```bash
# 在项目根目录
pnpm run boot

# 或者在项目目录内
node bootstrap.js bootstrap
```

### 编译单个文件

```bash
# 编译 Valkyrie 源文件
node bootstrap.js compile <file.vk>
node bootstrap.js compile <file.valkyrie>

# 输出到指定文件
node bootstrap.js compile input.vk -o output.js
```

### 运行测试套件

```bash
# 运行所有测试
node bootstrap.js test

# 使用 stage-0 编译器测试
node bootstrap.js test --stage-0

# 测试特定文件
node bootstrap.js test test/simple.vk
```

### 查看帮助信息

```bash
node bootstrap.js help
```

## 📊 测试覆盖

项目包含全面的测试套件，覆盖以下场景：

### 基础功能测试
- `test/simple.vk` - 基础语法测试
- `test/variables.vk` - 变量声明和作用域
- `test/function.vk` - 函数定义和调用
- `test/class.vk` - 类和对象系统

### 高级特性测试
- `test/namespace_*.vk` - 命名空间系统
- `test/import_test.vk` - 模块导入
- `test/anonymous_function_test.vk` - 匿名函数
- `test/implicit_member_call_test.vk` - 隐式成员调用

### 复杂场景测试
- `test/multifile_analysis_test.vk` - 多文件分析
- `test/circular_dependency_test/` - 循环依赖处理
- `test/complex_dependency_test/` - 复杂依赖关系
- `test/enhanced_multifile_test/` - 增强多文件支持

## 🎯 自举成功条件

1. **语法一致性**: 当前编译器必须能正确解析所有 Valkyrie 语言源代码
2. **语义一致性**: 生成的编译器必须保持相同的语义行为
3. **输出一致性**: 两个阶段生成的编译器文件必须完全相同
4. **功能完整性**: 新生成的编译器必须能处理所有语言特性
5. **测试通过**: 所有测试用例必须在新编译器下正常通过

## 🔧 技术特点

### 单文件编译器设计
- **自包含**: 所有功能打包在单个 JavaScript 文件中
- **零依赖**: 不依赖外部库或运行时
- **可移植**: 可以在任何支持 JavaScript 的环境中运行

### Valkyrie 语言实现
- **自描述**: 编译器用目标语言自身编写
- **模块化**: 清晰的模块分离和职责划分
- **可扩展**: 易于添加新特性和优化

### 错误处理和诊断
- **详细错误信息**: 包含行列号和上下文
- **错误恢复**: 语法错误后继续解析
- **诊断报告**: 编译过程和结果的详细统计

## 📈 当前状态

### ✅ 已完成功能
- 基础词法分析和语法分析
- 类、函数、变量声明
- 命名空间和模块系统
- JavaScript 代码生成
- 自举编译流程
- 完整的测试套件

### 🔄 开发中功能
- 类型系统增强
- 性能优化
- 更多目标语言支持
- IDE 集成支持

### 📋 未来计划
- WebAssembly 目标支持
- LLVM 后端集成
- 高级优化技术
- 标准库完善

## 🐛 故障排除

### 常见问题

1. **自举失败**
   - 检查 `library/` 目录中的语法错误
   - 验证当前编译器的完整性
   - 查看 `dist/` 目录中的差异文件

2. **测试失败**
   - 确认测试文件语法正确
   - 检查预期输出文件是否匹配
   - 使用 `--stage-0` 选项对比不同编译器版本

3. **编译错误**
   - 验证输入文件语法
   - 检查依赖关系是否正确
   - 查看详细的错误诊断信息

## 🤝 贡献指南

我们欢迎所有形式的贡献！

1. **报告问题**: 在 GitHub Issues 中提交 bug 报告
2. **提交改进**: 创建 Pull Request 改进代码
3. **添加测试**: 为新的语言特性添加测试用例
4. **文档完善**: 改进文档和注释

## 📞 联系方式

- **项目主页**: [GitHub Repository](https://github.com/nyar-lang/valkyrie-vm)
- **问题反馈**: [GitHub Issues](https://github.com/nyar-lang/valkyrie-vm/issues)
- **文档站点**: [Valkyrie Documentation](https://valkyrie-document.netlify.app)

## 📄 许可证

本项目采用 MIT 许可证开源 - 详见项目根目录的 [LICENSE.md](../LICENSE.md) 文件。

---

**准备好探索编译器自举技术了吗？** 立即开始您的 Valkyrie 编译器之旅！