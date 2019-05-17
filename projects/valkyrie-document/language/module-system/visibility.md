# 可见性控制

## 概述

Valkyrie 采用简化的可见性模型，默认所有声明都是公开的，只在需要时显式标记为私有。这种设计减少了样板代码，提高了开发效率。

## 基本原则

### 默认公开

在 Valkyrie 中，所有声明默认都是公开的，不需要任何修饰符：

```valkyrie
# 这是一个公开的函数
micro greet(name: String) {
    print("Hello, ${name}!")
}

# 这是一个公开的类
class User {
    name: String
    email: String
}

# 这是一个公开的常量
let MAX_USERS = 1000

# 这是一个公开的枚举
enum Status {
    Active,
    Inactive,
    Pending
}
```

### 显式私有

当需要限制访问时，使用 `private` 关键字：

```valkyrie
class BankAccount {
    # 公开字段（默认）
    owner: String
    account_number: String
    
    # 私有字段
    private balance: f64
    private transaction_history: [Transaction]
    
    # 私有方法
    private validate_transaction(amount: f64) -> bool {
        amount > 0 && amount <= self.balance
    }
    
    # 公开方法（默认）
    deposit(amount: f64) {
        if self.validate_transaction(amount) {
            self.balance += amount
        }
    }
}
```

### 包内可见性

对于需要在整个包内可见但不对外公开的成员，使用 `internal` 关键字：

```valkyrie
# 在包内部使用
namespace myapp.internal {
    internal class InternalConfig {
        api_key: String
        secret_key: String
    }
    
    internal micro log_internal(message: String) {
        # 内部日志记录
        print("[INTERNAL] ${message}")
    }
}

# 包的其他部分可以访问 internal 成员
namespace myapp.api {
    setup_api() {
        let config = myapp.internal.InternalConfig {
            api_key: "test-key",
            secret_key: "test-secret"
        }
        myapp.internal.log_internal("API setup complete")
    }
}
```

## 可见性规则

### 类成员可见性

```valkyrie
class Example {
    # 公开字段（默认）
    public_field: String
    
    # 私有字段
    private private_field: i32
    
    # 包内可见字段
    internal internal_field: bool
    
    # 公开方法（默认）
    public_method() {
        # 可以访问所有成员
        self.private_method()
        self.internal_method()
    }
    
    # 私有方法
    private private_method() {
        # 只能在类内部访问
    }
    
    # 包内可见方法
    internal internal_method() {
        # 可以在整个包内访问
    }
}
```

### 模块可见性

```valkyrie
namespace myapp {
    # 公开的命名空间（默认）
    namespace public_module {
        # 默认公开的内容
        class PublicClass {
            field: String
        }
    }
    
    # 私有命名空间
    private namespace private_module {
        # 只能在当前文件访问
        class PrivateClass {
            field: String
        }
    }
    
    # 包内可见命名空间
    internal namespace internal_module {
        # 可以在整个包内访问
        class InternalClass {
            field: String
        }
    }
}
```

### 导入和重新导出

```valkyrie
namespace myapp.utils {
    # 内部工具函数
    internal micro helper_function() -> String {
        "helper"
    }
    
    # 公开工具函数
    public_function() -> String {
        helper_function() + "_public"
    }
}

# 重新导出控制
namespace myapp.api {
    # 只重新导出需要的部分
    using myapp.utils.public_function
    
    # 无法访问 helper_function，因为它是 internal
}
```

## 与 Rust 的区别

Valkyrie 的可见性系统与 Rust 有显著区别：

| Rust 语法      | Valkyrie 语法 | 说明   |
|--------------|-------------|------|
| `pub`        | 默认（无修饰符）    | 公开访问 |
| 无修饰符         | `private`   | 私有访问 |
| `pub(crate)` | `internal`  | 包内可见 |
| `pub(super)` | `internal`  | 包内可见 |
| `pub(mod)`   | `internal`  | 包内可见 |

### 错误示例

```valkyrie
# ❌ 错误：Rust 风格的可见性修饰符
class MyClass {           # pub 是不存在的
    fn method() {}      # pub 是不存在的
    internal fn func() {} # internal 是正确的
}

# ✅ 正确：Valkyrie 风格
class MyClass {             # 默认公开
    method() {}             # 默认公开
    internal func() {}      # 包内可见
}
```

## 最佳实践

### 1. 保持简单

由于默认是公开的，只在真正需要时才添加可见性修饰符：

```valkyrie
# ✅ 好：只在需要时使用 private
class SimpleService {
    private cache: {String: Any}
    
    process_data(data: String) -> Any {
        # 默认公开的方法
    }
}
```

### 2. 使用 internal 进行封装

对于库作者，`internal` 提供了良好的封装边界：

```valkyrie
namespace mylibrary {
    # 公开 API
    class PublicAPI {
        public_method() {
            internal_helper.internal_work()
        }
    }
    
    # 内部实现细节
    internal namespace internal_helper {
        internal internal_work() {
            # 内部实现
        }
    }
}
```

### 3. 文档化可见性决策

对于公共 API，文档中说明可见性选择：

```valkyrie
namespace myapp.api {
    ⍝ 用户管理服务
    ⍝ 
    ⍝ 这是一个公开的 API 类，提供了用户管理的核心功能。
    ⍝ 内部实现细节被封装在 internal 模块中。
    class UserService {
        private users: {String: User}
        
        ⍝ 创建新用户
        ⍝ 这是一个公开的方法，所有用户都可以调用
        create_user(name: String, email: String) -> User {
            # 实现细节...
        }
    }
}
```

## 常见模式

### 外观模式

使用可见性控制实现外观模式：

```valkyrie
namespace myapp {
    # 复杂的内部实现
    internal namespace internal {
        internal complex_calculation(data: [f64]) -> f64 {
            # 复杂的计算逻辑
        }
        
        internal validate_input(data: [f64]) -> bool {
            # 输入验证
        }
    }
    
    # 简单的公开接口
    namespace api {
        simple_calculate(data: [f64]) -> Result<f64, String> {
            if !internal.validate_input(data) {
                return Err("Invalid input")
            }
            Ok(internal.complex_calculation(data))
        }
    }
}
```

### 配置管理

使用 internal 管理配置：

```valkyrie
namespace myapp.config {
    internal class InternalConfig {
        api_keys: {String: String}
        database_url: String
        debug_mode: bool
    }
    
    internal let CONFIG = InternalConfig {
        api_keys: {},
        database_url: "localhost:5432",
        debug_mode: true
    }
    
    # 公开的 API 只暴露必要的信息
    get_config_value(key: String) -> Option<String> {
        match key {
            "debug_mode" => Some(CONFIG.debug_mode),
            _ => None
        }
    }
}
```

## 迁移指南

### 从 Rust 迁移

如果你从 Rust 迁移代码，需要修改可见性修饰符：

```rust
# Rust 代码
struct User {
    name: String,
    internal_id: u64,
    private_field: String,
}

imply User {
    fn new(name: String) -> Self {
        # ...
    }
    
    fn internal_method(&self) {
        # ...
    }
    
    fn private_method(&self) {
        # ...
    }
}
```

转换为 Valkyrie：

```valkyrie
# Valkyrie 代码
class User {
    name: String                    # 默认公开
    internal internal_id: u64     # 包内可见
    private private_field: String # 私有
    
    new(name: String) -> Self {
        # 默认公开的构造函数
    }
    
    internal internal_method() {
        # 包内可见的方法
    }
    
    private private_method() {
        # 私有的方法
    }
}
```

## 总结

Valkyrie 的可见性系统通过"默认公开，需要时私有"的哲学，简化了代码编写，同时提供了足够的封装能力。记住：

- 不需要 `pub` - 默认就是公开的
- 使用 `private` 来限制访问
- 使用 `internal` 来实现包内可见性
- 没有 `pub(crate)` 或其他复杂的可见性修饰符