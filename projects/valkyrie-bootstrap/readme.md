# Valkyrie Bootstrap

Valkyrie 语言自举编译器 - 使用 JavaScript 实现的一个完整的自举编译系统。

## 自举逻辑 (Bootstrap Logic)

### 项目结构

```tree
valkyrie-bootstrap/
├── bootstrap/          # 初始的引导编译器（手写 JavaScript）
│   ├── lexer.js       # 词法分析器
│   ├── parser.js      # 语法分析器
│   └── codegen.js     # 代码生成器
├── library/           # Valkyrie 语言编写的标准库源代码
│   ├── lexer.valkyrie
│   ├── parser.valkyrie
│   ├── codegen.valkyrie
│   └── compiler.valkyrie
├── dist/              # 编译输出目录
│   ├── stage-0/       # 第一阶段编译结果
│   └── stage-1/       # 第二阶段编译结果
├── bootstrap.js       # 主引导程序
└── package.json
```

### 自举流程

#### 阶段 0: 初始引导
使用手写的 JavaScript 编译器（`bootstrap/` 目录）来编译 Valkyrie 语言编写的标准库：

```javascript
// 加载引导编译器组件
const bootstrapLexer = await import('./bootstrap/lexer.js');
const bootstrapParser = await import('./bootstrap/parser.js');
const bootstrapCodegen = await import('./bootstrap/codegen.js');

// 编译 library/ 目录到 dist/stage-0/
compileDirectory(PATHS.library, PATHS.stage0, {
    lexer: bootstrapLexer,
    parser: bootstrapParser, 
    codegen: bootstrapCodegen
});
```

#### 阶段 1: 自举验证
使用阶段 0 生成的编译器再次编译相同的源代码：

```javascript
// 加载阶段 0 编译器
const stage0Lexer = await import('./dist/stage-0/lexer.js');
const stage0Parser = await import('./dist/stage-0/parser.js');
const stage0Codegen = await import('./dist/stage-0/codegen.js');

// 再次编译 library/ 目录到 dist/stage-1/
compileDirectory(PATHS.library, PATHS.stage1, {
    lexer: stage0Lexer,
    parser: stage0Parser,
    codegen: stage0Codegen
});
```

#### 阶段 2: 一致性验证
比较阶段 0 和阶段 1 的输出，确保它们完全一致：

```javascript
// 比较两个阶段的输出
if (compareDirectories(PATHS.stage0, PATHS.stage1)) {
    // 自举成功！用新生成的编译器替换旧的
    copyDir(PATHS.stage1, PATHS.bootstrap);
}
```

### 使用方式

#### 运行完整的自举过程
```bash
node bootstrap.js bootstrap
```

#### 编译测试
```bash
node bootstrap.js compile-test
```

#### 查看帮助
```bash
node bootstrap.js help
```

### 自举成功的条件

1. **语法一致性**: 手写的引导编译器必须能正确解析 Valkyrie 语言
2. **语义一致性**: 生成的代码必须保持相同的语义
3. **输出一致性**: 两个阶段的编译结果必须完全相同
4. **功能完整性**: 新生成的编译器必须能处理所有语言特性

### 技术特点

- **纯 JavaScript 实现**: 不依赖外部工具链
- **模块化设计**: 词法分析、语法分析、代码生成独立
- **详细的错误报告**: 包含行号、列号和上下文信息
- **差异分析**: 自动生成详细的差异报告文件
- **备份机制**: 自举前自动备份旧的编译器

### 相关文件

- `bootstrap.js` - 主引导程序
- `bootstrap/*.js` - 手写的初始编译器
- `library/*.valkyrie` - Valkyrie 语言编写的标准库
- `dist/` - 编译输出和差异报告