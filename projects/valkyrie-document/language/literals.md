# 字面量

Valkyrie 支持多种字面量类型，用于表示程序中的常量值。

## 数值字面量

### 整数字面量

```valkyrie
# 十进制整数
42
-17
0

# 十六进制整数
0xFF
0x1A2B

# 二进制整数
0b1010
0b11110000

# 八进制整数
0o755
0o644

# 带下划线分隔符的整数（提高可读性）
1_000_000
0xFF_FF_FF
0b1010_1010
```

### 浮点数字面量

```valkyrie
# 标准浮点数
3.14
-2.5
0.0

# 科学计数法
1.23e4
-5.67E-3
2.0e+10

# 带下划线分隔符
3.141_592_653
1.234_567e-8
```

## 字符串字面量

### 普通字符串

```valkyrie
# 双引号字符串
"Hello, World!"
"这是一个中文字符串"

# 单引号字符串
'Hello, World!'
'单引号字符串'

# 空字符串
""
''
```

### 转义序列

```valkyrie
# 常见转义序列
"换行符：\n"
"制表符：\t"
"回车符：\r"
"反斜杠：\\"
"双引号：\""
"单引号：\'"

# Unicode 转义
"\u{1F600}"  # 😀 表情符号
"\u{4E2D}"   # 中文字符 "中"
```

### 原始字符串

```valkyrie
# 原始字符串（不处理转义序列）
r"C:\Users\Name\Documents"
r'这是原始字符串 \n 不会换行'

# 多行原始字符串
r"""
这是一个
多行原始字符串
不处理 \n 转义
"""
```

### 多行字符串

```valkyrie
# 三引号多行字符串
"""
这是一个
多行字符串
可以包含换行符
"""

'''
另一种多行字符串
使用三个单引号
'''
```

### 字符串插值

```valkyrie
# 基本字符串插值
let name = "Alice"
let age = 30
let message = "Hello, #{ name }! You are #{ age } years old."

# 表达式插值
let x = 10
let y = 20
let result = "The sum of #{ x } and #{ y } is #{ x + y }"

# 复杂表达式插值
let user = { name: "Bob", score: 95 }
let status = "User #{ user.name } has a score of #{ user.score }%"

# 方法调用插值
let items = ["apple", "banana", "cherry"]
let info = "We have #{ items.length() } items: #{ items.join(", ") }"

# 条件表达式插值
let temperature = 25
let weather = "It's #{ if temperature > 20 { "warm" } else { "cool" } } today"
```

## 字符字面量

```valkyrie
# 单个字符
'a'
'中'
'1'

# 转义字符
'\n'
'\t'
'\\'
'\"'

# Unicode 字符
'\u{1F600}'  # 😀
'\u{4E2D}'   # 中
```

## 布尔字面量

```valkyrie
# 布尔值
true
false
```

## 空值字面量

```valkyrie
# 空值
null
```

## 数组字面量

```valkyrie
# 空数组
[]

# 整数数组
[1, 2, 3, 4, 5]

# 字符串数组
["apple", "banana", "cherry"]

# 混合类型数组
[1, "hello", true, null]

# 嵌套数组
[[1, 2], [3, 4], [5, 6]]

# 多行数组
[
    "first",
    "second",
    "third"
]
```

## 对象字面量

Valkyrie 支持两种对象字面量语法：传统对象字面量和匿名类语法。推荐使用匿名类语法，它与类定义语法保持一致。

### 匿名类语法（推荐）

```valkyrie
# 空对象 - 使用匿名类语法
class { }

# 简单对象 - 与类定义语法相同
class {
    name = "Alice",
    age = 30,
    active = true
}

# 嵌套对象
class {
    user = class {
        name = "Bob",
        profile = class {
            email = "bob@example.com",
            phone = "123-456-7890"
        }
    },
    settings = class {
        theme = "dark",
        notifications = true
    }
}

# 带引号的键名
class {
    "first-name" = "Charlie",
    "last-name" = "Brown",
    "age" = 25
}
```

### 泛型匿名类

```valkyrie
# 泛型匿名类
class<T> {
    value = T,
    count = i32
}

# 带继承的匿名类
class(Shape): Drawable {
    radius = f64,
    
    area(self) -> f64 {
        3.14159 * self.radius * self.radius
    }
}

# 多重继承的匿名类
class(BaseClass): Trait1 + Trait2 {
    field1 = String,
    field2 = i32
}
```

### 传统对象字面量语法（兼容）

```valkyrie
# 空对象
{}

# 简单对象
{
    name: "Alice",
    age: 30,
    active: true
}

# 嵌套对象
{
    user: {
        name: "Bob",
        profile: {
            email: "bob@example.com",
            phone: "123-456-7890"
        }
    },
    settings: {
        theme: "dark",
        notifications: true
    }
}

# 带引号的键名
{
    "first-name": "Charlie",
    "last-name": "Brown",
    "age": 25
}
```

### 语法对比

| 特性 | 匿名类语法 | 传统语法 |
|------|------------|----------|
| 空对象 | `class { }` | `{}` |
| 字段定义 | `field: value` | `field: value` |
| 方法定义 | 支持 | 不支持 |
| 继承 | 支持 `class(Base): Trait { }` | 不支持 |
| 泛型 | 支持 `class<T> { }` | 不支持 |
| 类型一致性 | 与类定义完全一致 | 独立语法 |

### 使用场景

```valkyrie
# 匿名类语法适用于需要方法的对象
let obj = class {
    name = "Test",
    value = 42,
    
    get_name(self) -> String {
        self.name.clone()
    }
    
    calculate(self, x: i32) -> i32 {
        self.value + x
    }
}

# 传统语法适用于简单的数据结构
let data = {
    id: 1,
    name: "Simple",
    active: true
}
```

## 元组字面量

```valkyrie
# 空元组
()

# 单元素元组（需要逗号）
(42,)

# 多元素元组
(1, 2, 3)
("name", 30, true)

# 嵌套元组
((1, 2), (3, 4))

# 多行元组
(
    "first",
    "second",
    "third"
)
```

## 范围字面量

```valkyrie
# 包含范围（推荐语法）
0..=100    # 0 到 100（包含 100）
1..=10     # 1 到 10（包含 10）

# 排除范围
1..<10     # 1 到 9（不包含 10）

# 注意：以下语法已被禁止
# 1..10      # 错误：不明确是否包含结束值
# 1..        # 错误：开放范围语法不支持
# ..10       # 错误：开放范围语法不支持
```

## 闭包字面量

```valkyrie
# 基本闭包语法
{ $x * $x }                    # 单参数闭包
{ $x + $y }                    # 多参数闭包
{ println("Hello") }           # 无参数闭包

# 显式参数类型
{ $x: i32 -> $x * 2 }
{ $x: String, $y: i32 -> "$x: $y" }

# 多语句闭包
{
    let result = $x * 2
    result + 1
}

# 尾随闭包语法
numbers.map { $x * $x }        # 尾随闭包
numbers.filter { $x > 10 }     # 条件过滤

# 传统函数式闭包
numbers.map(micro(x) { x * x })  # 显式函数语法
numbers.filter(micro(x) { x > 10 })
```

## 正则表达式字面量

```valkyrie
# 基本正则表达式
re"hello"
re"\d+"
re"[a-zA-Z]+"

# 带标志的正则表达式
# 正则表达式修饰符（已禁止）
# re"hello"i      # 忽略大小写 - 禁止语法
# re"\s+"g        # 全局匹配 - 禁止语法
# re"test"im      # 多行模式 + 忽略大小写 - 禁止语法

# 推荐使用标准正则表达式
re"hello"         # 标准正则表达式
re"\s+"          # 标准正则表达式
re"test"         # 标准正则表达式
```

## 注释

Valkyrie 使用 `#` 作为行注释，`<# #>` 作为块注释：

```valkyrie
# 这是行注释
let x = 42  # 行尾注释

<# 
这是块注释
可以跨越多行
#>

let y = <# 内联块注释 #> 100
```

## 字面量类型推断

Valkyrie 会根据上下文自动推断字面量的类型：

```valkyrie
let integer = 42        # 推断为 i32
let float = 3.14        # 推断为 f64
let string = "hello"    # 推断为 String
let boolean = true      # 推断为 bool
let array = [1, 2, 3]   # 推断为 [i32; 3]
```

也可以显式指定类型：

```valkyrie
let big_int: i64 = 42
let precise_float: f32 = 3.14
let char_array: [char; 3] = ['a', 'b', 'c']
```