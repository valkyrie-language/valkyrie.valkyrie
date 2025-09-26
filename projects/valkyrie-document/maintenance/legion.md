# Legion 包管理器 - 开发者文档

## 概述

Legion 是 Valkyrie 语言的官方包管理器和构建工具，采用纯 Valkyrie 实现，提供依赖管理、项目构建、代码编译等核心功能。

## 架构设计

### 核心组件

```
Legion Core
├── ConfigManager      # 配置管理器
├── DependencyManager  # 依赖管理器  
├── ValkyrieCompiler   # Valkyrie 编译器接口
├── WorkspaceManager   # 工作空间管理器
└── ProjectTemplate    # 项目模板引擎
```

### 包结构规范

Legion 采用标准化的包结构，支持以下目录类型：

#### 📚 Library 目录
- **位置**: `library/`
- **作用**: 库存放目录，包含可重用的函数和类型定义
- **编译输出**: `dist/index.js`
- **特性**: 自动生成模块导出，支持命名空间

#### ⚙️ Binary 目录  
- **位置**: `binary/`
- **作用**: 可执行程序代码
- **支持格式**:
  - `binary/cmd_name.vk` - 单文件程序
  - `binary/cmd_name/main.vk` - 目录程序
- **编译要求**: 必须包含 `main()` 函数作为入口点
- **编译输出**: `dist/cmd_name.js`

#### 🧪 Test 目录
- **位置**: `test/`
- **作用**: 测试代码存放目录
- **编译输出**: `dist/test/index.js`
- **依赖**: 自动依赖 library 中的函数

#### 📦 Dist 目录
- **位置**: `dist/`
- **作用**: 构建输出目录（自动生成）
- **内容结构**:
  ```
  dist/
  ├── index.js          # library 编译结果
  ├── cmd_name.js       # binary 编译结果  
  └── test/
      └── index.js      # test 编译结果
  ```

## 编译流程

### 编译阶段

1. **配置解析** - 读取 `legion.json` 配置文件
2. **依赖解析** - 分析和安装项目依赖
3. **源码编译** - 使用 valkyrie-bootstrap 编译 `.vk` 文件
4. **模块链接** - 处理包间依赖关系
5. **资源复制** - 复制非源码资源文件
6. **构建元数据** - 生成构建信息和映射文件

### 编译规则

#### Library 编译
- 扫描 `library/` 目录下所有 `.valkyrie` 文件
- 每个文件编译为独立模块
- 自动生成 `dist/index.js` 统一导出
- 支持命名空间自动解析

#### Binary 编译  
- 扫描 `binary/` 目录结构
- 验证 `main()` 函数存在性
- 自动注入 library 依赖导入
- 生成对应可执行文件

#### Test 编译
- 扫描 `test/` 目录下测试文件
- 自动链接 library 依赖
- 生成测试运行器

## 配置规范

### legion.json 结构

```json
{
  "name": "package-name",
  "version": "1.0.0",
  "description": "Package description",
  "main": "library/main.valkyrie",
  "bin": {
    "cmd-name": "binary/cmd-name.vk"
  },
  "dependencies": {
    "@valkyrie-lang/stdlib": "^1.0.0"
  },
  "devDependencies": {
    "@valkyrie-lang/test": "^1.0.0"  
  },
  "scripts": {
    "build": "legion build",
    "test": "legion test",
    "watch": "legion watch"
  }
}
```

### 约定大于配置

Legion 遵循**约定大于配置**原则：

- **自动识别**: 自动检测项目结构和文件类型
- **智能默认**: 提供合理的默认配置
- **最小配置**: 只在必要时要求用户配置
- **标准布局**: 推广标准化的项目布局

## 依赖管理

### 依赖类型

1. **运行时依赖** (`dependencies`)
   - 项目运行必需的核心依赖
   - 自动安装和版本管理
   
2. **开发依赖** (`devDependencies`) 
   - 开发阶段使用的工具和库
   - 不影响生产环境构建

3. **对等依赖** (`peerDependencies`)
   - 需要用户手动安装的依赖
   - 用于避免版本冲突

### 依赖解析算法

```
依赖解析流程:
1. 读取 legion.json 依赖声明
2. 查询包注册表获取版本信息
3. 解析版本范围和兼容性
4. 构建依赖树和冲突检测
5. 生成扁平化的 node_modules 结构
6. 创建依赖映射和链接
```

## 构建系统

### 构建命令

```bash
# 标准构建
legion build

# 开发模式（监听变化）
legion build --watch

# 生产构建（优化输出）
legion build --production

# 清理构建缓存
legion clean

# 详细输出
legion build --verbose
```

### 构建优化

1. **增量编译** - 只重新编译变更的文件
2. **并行构建** - 多核并行处理编译任务  
3. **缓存机制** - 缓存中间编译结果
4. **Tree Shaking** - 消除未使用的代码
5. **代码压缩** - 生产环境代码优化

## 模块系统

### 模块解析

Legion 实现标准的 Valkyrie 模块系统：

```valkyrie
// 标准库导入
using std::io;
using std::collections::List;

// 项目内导入
using mylib::utils;
using mylib::models::User;

// 外部包导入  
using @external::package::module;
```

### 命名空间处理

- **自动命名空间**: 基于文件路径自动生成
- **显式命名空间**: 支持 `namespace` 声明
- **命名空间合并**: 处理跨文件的命名空间合并
- **导出控制**: 控制模块的可见性

## 测试框架

### 测试结构

```
test/
├── unit/          # 单元测试
├── integration/   # 集成测试
└── e2e/          # 端到端测试
```

### 测试编写规范

```valkyrie
// test/unit/math_test.valkyrie
namespace test::unit::math;

using std::testing::{test, assert};

@test
micro test_addition() {
    assert.equal(2 + 2, 4);
}

@test  
micro test_multiplication() {
    assert.equal(3 * 4, 12);
}
```

### 测试运行

```bash
# 运行所有测试
legion test

# 运行单元测试
legion test --unit

# 运行集成测试
legion test --integration

# 生成测试报告
legion test --coverage
```

## 发布流程

### 版本管理

遵循语义化版本规范 (SemVer)：

- **MAJOR** - 不兼容的 API 变更
- **MINOR** - 向后兼容的功能添加  
- **PATCH** - 向后兼容的问题修复

### 发布步骤

1. **版本验证** - 检查版本号合法性
2. **构建验证** - 确保构建成功
3. **测试验证** - 所有测试通过
4. **依赖检查** - 验证依赖安全性
5. **打包发布** - 生成发布包
6. **注册表发布** - 上传到包注册表

## 性能优化

### 编译优化

1. **词法分析优化** - 高效的 token 生成
2. **语法分析优化** - 快速的 AST 构建
3. **语义分析优化** - 高效的类型检查
4. **代码生成优化** - 优化的 JavaScript 输出

### 运行时优化

1. **模块缓存** - 避免重复模块加载
2. **依赖预加载** - 智能的依赖预加载
3. **代码分割** - 按需加载代码块
4. **内存管理** - 高效的内存使用

## 调试支持

### 调试信息

- **源码映射** - 生成 JavaScript 源码映射
- **符号表** - 维护调试符号信息
- **错误追踪** - 提供详细的错误信息
- **堆栈跟踪** - 准确的错误位置

### 开发工具

```bash
# 启用调试模式
legion build --debug

# 生成调试信息
legion build --source-map

# 详细错误输出
legion build --debug-verbose
```

## 扩展机制

### 插件系统

Legion 支持插件扩展：

```javascript
// legion-plugin.js
module.exports = {
  name: 'my-plugin',
  version: '1.0.0',
  
  // 构建钩子
  hooks: {
    'before:build': async (context) => {
      // 构建前处理
    },
    'after:compile': async (context) => {
      // 编译后处理
    }
  }
};
```

### 自定义编译器

支持集成自定义编译器后端：

```javascript
// custom-compiler.js
module.exports = {
  name: 'custom-compiler',
  compile: async (source, options) => {
    // 自定义编译逻辑
    return compiledCode;
  }
};
```

## 安全考虑

### 依赖安全

1. **漏洞扫描** - 自动扫描依赖漏洞
2. **许可证检查** - 验证依赖许可证兼容性
3. **代码签名** - 验证包完整性
4. **沙箱执行** - 隔离执行不受信任代码

### 构建安全

1. **权限控制** - 最小权限原则
2. **输入验证** - 严格的输入验证
3. **输出清理** - 防止注入攻击
4. **审计日志** - 记录关键操作

## 故障排除

### 常见问题

1. **编译失败**
   ```
   错误: Cannot find module 'xxx'
   解决: 检查依赖安装和模块路径
   ```

2. **命名空间冲突**
   ```
   错误: Namespace 'xxx' already defined
   解决: 检查命名空间声明和文件结构
   ```

3. **循环依赖**
   ```
   错误: Circular dependency detected
   解决: 重构代码结构，消除循环依赖
   ```

### 调试技巧

1. **启用详细输出** - `legion build --verbose`
2. **检查中间文件** - 查看 `.legion/cache/` 目录
3. **验证配置文件** - 使用 JSON 验证工具
4. **分析依赖树** - `legion deps --tree`

## 开发指南

### 代码规范

1. **命名规范** - 使用小写和连字符命名
2. **模块组织** - 按功能组织模块文件
3. **错误处理** - 提供清晰的错误信息
4. **文档注释** - 添加详细的代码注释

### 测试要求

1. **单元测试覆盖率** - 核心功能 > 90%
2. **集成测试** - 验证组件间交互
3. **性能测试** - 基准性能测试
4. **兼容性测试** - 多平台兼容性

### 贡献流程

1. **Fork 项目** - 创建个人分支
2. **功能开发** - 遵循代码规范
3. **测试验证** - 确保测试通过
4. **文档更新** - 同步更新文档
5. **提交 PR** - 详细的变更说明

## 未来规划

### 短期目标 (3-6 个月)

- [ ] 完整的错误处理和调试支持
- [ ] 性能优化和基准测试
- [ ] 插件系统完善
- [ ] 多平台构建支持

### 中期目标 (6-12 个月)

- [ ] 完整的包注册表集成
- [ ] 高级优化功能
- [ ] IDE 集成支持
- [ ] 企业级安全特性

### 长期愿景 (1-2 年)

- [ ] 成为 Valkyrie 生态的标准工具
- [ ] 支持多语言编译后端
- [ ] 云原生构建支持
- [ ] AI 辅助代码优化

---

**Legion: 为 Valkyrie 语言而生的现代化包管理器**