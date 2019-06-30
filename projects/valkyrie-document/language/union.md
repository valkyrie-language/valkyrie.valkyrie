# 联合类型 (Union Types)

联合类型是 Valkyrie 中表示多种可能值的强大类型系统特性。它允许一个值在多个不同的变体中选择一个，每个变体可以携带不同类型的数据。

## 基本联合类型

### 简单联合类型

```valkyrie
# 结果类型 - 表示操作可能成功或失败
union Result<T, E> {
    Fine { value: T },
    Fail { error: E }
}

# 选项类型 - 表示值可能存在或不存在
union Option<T> {
    Some { value: T },
    None
}

# 布尔包装类型
union Bool {
    True,
    False
}
```

### 复杂联合类型

```valkyrie
# JSON 值类型
union JsonValue {
    Null,
    Bool { value: bool },
    Number { value: f64 },
    String { value: String },
    Array { items: [JsonValue] },
    Object { fields: {String: JsonValue} }
}

# 表达式抽象语法树
union Expression {
    Literal { value: i32 },
    Variable { name: String },
    Binary {
        left: Box<Expression>,
        operator: String,
        right: Box<Expression>
    }
}
```

## 联合类型的使用

### 模式匹配

```valkyrie
# 基本模式匹配
let result: Result<i32, String> = new Fine { value: 42 }
match result {
    case Fine { value }: print("成功: ${value}")
    case Fail { error }: print("失败: ${error}")
}

# 嵌套模式匹配
let nested: Result<Option<i32>, String> = new Fine { value: new Some { value: 42 } }
match nested {
    case Fine { value: Some { value } }: print("值: ${value}")
    case Fine { value: None }: print("无值")
    case Fail { error }: print("错误: ${error}")
}
```

### if let 表达式

```valkyrie
# 简化的模式匹配
if let Fine { value } = result {
    print("成功获得值: ${value}")
}

# 带 else 分支
if let Some { value } = option {
    process(value)
} else {
    print("选项为空")
}
```

## 联合类型方法

### 关联方法

```valkyrie
union Result<T, E> {
    Fine { value: T },
    Fail { error: E },
    
    # 检查是否成功
    is_ok(self) -> bool {
        if let Fine { .. } = self {
            true
        } else {
            false
        }
    }
    
    # 检查是否失败
    is_err(self) -> bool {
        if let Fail { .. } = self {
            true
        } else {
            false
        }
    }
    
    # 获取值（可能 panic）
    unwrap(self) -> T {
        if let Fine { value } = self {
            value
        } else {
            panic("Called unwrap on Fail")
        }
    }
    
    # 安全获取值
    unwrap_or(self, default: T) -> T {
        if let Fine { value } = self {
            value
        } else {
            default
        }
    }
    
    # 映射成功值
    map<U>(self, f: micro(T) -> U) -> Result<U, E> {
        if let Fine { value } = self {
            new Fine { value: f(value) }
        } else if let Fail { error } = self {
            new Fail { error }
        }
    }
    
    # 映射错误值
    map_err<F>(self, f: micro(E) -> F) -> Result<T, F> {
        if let Fine { value } = self {
            new Fine { value }
        } else if let Fail { error } = self {
            new Fail { error: f(error) }
        }
    }
}
```

### Option 类型方法

```valkyrie
union Option<T> {
    Some { value: T },
    None,
    
    # 检查是否有值
    is_some(self) -> bool {
        if let Some { .. } = self {
            true
        } else {
            false
        }
    }
    
    # 检查是否为空
    is_none(self) -> bool {
        if let None = self {
            true
        } else {
            false
        }
    }
    
    # 映射值
    map<U>(self, f: micro(T) -> U) -> Option<U> {
        if let Some { value } = self {
            new Some { value: f(value) }
        } else {
            None
        }
    }
    
    # 过滤值
    filter(self, predicate: micro(T) -> bool) -> Option<T> {
        if let Some { value } = self {
            if predicate(value) {
                new Some { value }
            } else {
                None
            }
        } else {
            None
        }
    }
}
```

## 高级特性

### 泛型联合类型

```valkyrie
# 多参数泛型
union Either<L, R> {
    Left { value: L },
    Right { value: R }
}

# 带约束的泛型
union Container<T> where T: Clone {
    Single { item: T },
    Multiple { items: [T] }
}
```

### 递归联合类型

```valkyrie
# 链表
union List<T> {
    Empty,
    Node {
        value: T,
        next: Box<List<T>>
    }
}

# 二叉树
union Tree<T> {
    Leaf { value: T },
    Branch {
        left: Box<Tree<T>>,
        right: Box<Tree<T>>
    }
}
```

## 最佳实践

### 1. 使用描述性的变体名称

```valkyrie
# 好的命名
union HttpResponse {
    Success { data: String, status: u16 },
    ClientError { message: String, code: u16 },
    ServerError { message: String, code: u16 },
    NetworkError { reason: String }
}

# 避免过于简单的命名
union Bad {
    A { x: i32 },
    B { y: String }
}
```

### 2. 合理使用字段命名

```valkyrie
# 当只有一个字段时，使用 value
union Option<T> {
    Some { value: T },
    None
}

# 多个字段时使用描述性名称
union Person {
    Student { name: String, grade: i32 },
    Teacher { name: String, subject: String }
}
```

### 3. 提供便利方法

```valkyrie
union ValidationResult<T> {
    Valid { data: T },
    Invalid { errors: [String] },
    
    # 便利方法
    is_valid(self) -> bool {
        @matches(self, Valid { .. })
    }
    
    get_errors(self) -> [String] {
        if let Invalid { errors } = self {
            errors
        } else {
            []
        }
    }
}
```

### 4. 错误处理模式

```valkyrie
# 使用 Result 进行错误处理
micro divide(a: f64, b: f64) -> Result<f64, String> {
    if b == 0.0 {
        new Fail { error: "除零错误" }
    } else {
        new Fine { value: a / b }
    }
}

# 链式错误处理
micro process_data(input: String) -> Result<ProcessedData, Error> {
    input
        .parse()
        .map_err({ |e| Error::ParseError(e) })?
        .validate()
        .map_err({ |e| Error::ValidationError(e) })?
        .transform()
        .map_err({ |e| Error::TransformError(e) })
}
```

联合类型是 Valkyrie 类型系统的核心特性，它提供了类型安全的方式来处理多种可能的值，特别适合错误处理、状态表示和数据建模等场景。