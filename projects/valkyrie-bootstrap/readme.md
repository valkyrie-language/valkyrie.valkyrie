# Valkyrie Bootstrap

Valkyrie 语言自举编译器 - 使用 JavaScript 实现的 Valkyrie 语言编译器自举系统。

## 项目概述

本项目实现了一个完整的 Valkyrie 语言编译器自举系统，能够用 Valkyrie 语言自身来编写编译器，并通过自举过程验证编译器的正确性。

### 项目结构

```tree
valkyrie-bootstrap/
├── bootstrap/          # 当前编译器（单个 JavaScript 文件）
│   └── index.js       # 编译器入口文件
├── library/           # Valkyrie 语言编写的编译器源代码
│   ├── lexer/         # 词法分析器模块
│   ├── parser/        # 语法分析器模块
│   ├── codegen/       # 代码生成器模块
│   └── compiler/      # 编译器核心模块
├── dist/              # 编译输出目录
│   ├── stage-0/       # 第一阶段编译结果
│   ├── stage-1/       # 第二阶段编译结果
│   └── diff/          # 差异分析结果
├── test/              # 测试文件目录
├── bootstrap.js       # 主引导程序
├── .npmignore         # npm 发布忽略文件
└── package.json
```

### 自举流程

#### 阶段 0: 初始编译
使用当前的编译器（`bootstrap/index.js`）来编译 `library/` 目录中的 Valkyrie 语言源代码，生成单个编译器文件：

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

### 使用方式

#### 运行完整的自举过程
```bash
node bootstrap.js bootstrap
```

#### 编译单个文件
```bash
node bootstrap.js compile <file.vk>
node bootstrap.js compile <file.valkyrie>
```

#### 运行测试
```bash
node bootstrap.js test
```

#### 使用 stage-0 编译器进行测试
```bash
node bootstrap.js test --stage-0
```

#### 查看帮助
```bash
node bootstrap.js help
```

### 自举成功的条件

1. **语法一致性**: 当前编译器必须能正确解析 Valkyrie 语言源代码
2. **语义一致性**: 生成的编译器必须保持相同的语义
3. **输出一致性**: 两个阶段生成的编译器文件必须完全相同
4. **功能完整性**: 新生成的编译器必须能处理所有语言特性并正确编译测试文件

### 技术特点

- **单文件编译器**: 使用单个 JavaScript 文件作为编译器
- **Valkyrie 语言实现**: 编译器核心组件使用 Valkyrie 语言编写
- **模块化设计**: 词法分析、语法分析、代码生成、编译器核心分离
- **详细的错误报告**: 包含行号、列号和上下文信息
- **差异分析**: 自动生成详细的差异报告文件
- **备份机制**: 自举前自动备份旧的编译器
- **npm 包支持**: 可以作为 npm 包发布和使用

### 相关文件

- `bootstrap.js` - 主引导程序
- `bootstrap/index.js` - 当前编译器
- `library/` - Valkyrie 语言编写的编译器源代码
  - `lexer/` - 词法分析器模块
  - `parser/` - 语法分析器模块
  - `codegen/` - 代码生成器模块
  - `compiler/` - 编译器核心模块
- `dist/` - 编译输出和差异报告
- `test/` - 测试文件
- `.npmignore` - npm 发布忽略文件