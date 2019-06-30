# 函数式编程 (Functional Programming)

## 概述

Valkyrie 支持丰富的函数式编程特性，包括一等函数、不可变数据结构、模式匹配、高阶函数等。函数式编程范式让代码更加简洁、可预测且易于测试。

## 核心概念

### 一等函数 (First-Class Functions)

在 Valkyrie 中，函数是一等公民，可以：
- 作为参数传递给其他函数
- 作为函数的返回值
- 存储在数据结构中
- 在运行时动态创建

```valkyrie
# 函数作为参数
micro apply_twice(f: micro(i32) -> i32, x: i32) -> i32 {
    f(f(x))
}

# 函数作为返回值
micro make_adder(n: i32) -> micro(i32) -> i32 {
    micro(x: i32) -> i32 { x + n }
}

# 存储在数据结构中
let operations = [
    micro(x: i32, y: i32) -> i32 { x + y },
    micro(x: i32, y: i32) -> i32 { x - y },
    micro(x: i32, y: i32) -> i32 { x * y }
]
```

### 不可变性 (Immutability)

默认情况下，Valkyrie 中的变量是不可变的：

```valkyrie
let x = 42      # 不可变
let mut y = 42  # 可变

x = 100  # 编译错误！
y = 100  # 正常
```

### 纯函数 (Pure Functions)

纯函数没有副作用，相同的输入总是产生相同的输出：

```valkyrie
# 纯函数
micro add(a: i32, b: i32) -> i32 {
    a + b
}

# 非纯函数（有副作用）
micro print_and_add(a: i32, b: i32) -> i32 {
    println("Adding {} and {}", a, b)
    a + b
}
```

## 函数组合

Valkyrie 支持函数组合，可以将多个函数组合成新的函数：

```valkyrie
micro compose<A, B, C>(f: micro(B) -> C, g: micro(A) -> B) -> micro(A) -> C {
    micro(x: A) -> C { f(g(x)) }
}

let double = micro(x: i32) -> i32 { x * 2 }
let add_one = micro(x: i32) -> i32 { x + 1 }
let double_and_add_one = compose(double, add_one)

# double_and_add_one(5) == 11
```

## 不可变数据结构

Valkyrie 提供了丰富的不可变数据结构：

### List

```valkyrie
let list = [1, 2, 3, 4, 5]

# 添加元素（返回新列表）
let new_list = list.push(6)  # [1, 2, 3, 4, 5, 6]

# 映射
let doubled = list.map(micro(x) -> x * 2)  # [2, 4, 6, 8, 10]

# 过滤
let evens = list.filter(micro(x) -> x % 2 == 0)  # [2, 4]

# 折叠
let sum = list.fold(0, micro(acc, x) -> acc + x)  # 15
```

### Map

```valkyrie
let map = #{"a": 1, "b": 2}

# 添加键值对
let new_map = map.insert("c", 3)  # #{"a": 1, "b": 2, "c": 3}

# 更新值
let updated_map = new_map.update("b", micro(x) -> x * 2)  # #{"a": 1, "b": 4, "c": 3}
```

## 惰性求值

Valkyrie 支持惰性求值，可以创建惰性序列：

```valkyrie
# 创建无限序列
let naturals = Stream::from_fn(0, micro(x) -> Some((x, x + 1)))

# 惰性操作
let squares = naturals.map(micro(x) -> x * x)
let even_squares = squares.filter(micro(x) -> x % 2 == 0)

# 只取需要的部分
let first_five = even_squares.take(5).collect::<Vector>()
# [0, 4, 16, 36, 64]
```

## 函数式错误处理

使用 `Option` 和 `Result` 类型进行函数式错误处理：

```valkyrie
# Option 类型
micro safe_divide(a: f64, b: f64) -> Option<f64> {
    if b == 0.0 {
        None
    } else {
        Some(a / b)
    }
}

# Result 类型
micro parse_int(s: String) -> Result<i32, String> {
    match s.parse::<i32>() {
        Some(n) => Ok(n),
        None => Err("Invalid integer")
    }
}

# 链式处理
let result = parse_int("42")
    .map(micro(n) -> n * 2)
    .and_then(micro(n) -> safe_divide(n as f64, 2.0))
```

## 递归和高阶函数

```valkyrie
# 递归函数
micro factorial(n: i32) -> i32 {
    if n <= 1 {
        1
    } else {
        n * factorial(n - 1)
    }
}

# 尾递归优化
micro tail_factorial(n: i32, acc: i32) -> i32 {
    if n <= 1 {
        acc
    } else {
        tail_factorial(n - 1, acc * n)
    }
}

# 高阶函数
micro filter_map<T, U>(list: Vector<T>, 
                       predicate: micro(&T) -> bool,
                       mapper: micro(T) -> U) -> Vector<U> {
    list.into_iter()
        .filter(predicate)
        .map(mapper)
        .collect()
}
```

## 部分应用和柯里化

```valkyrie
# 部分应用
micro partial_apply<A, B, C>(f: micro(A, B) -> C, a: A) -> micro(B) -> C {
    micro(b: B) -> C { f(a, b) }
}

# 柯里化
micro curry<A, B, C>(f: micro(A, B) -> C) -> micro(A) -> micro(B) -> C {
    micro(a: A) -> micro(B) -> C {
        micro(b: B) -> C { f(a, b) }
    }
}

# 使用示例
let add = micro(a: i32, b: i32) -> i32 { a + b }
let curried_add = curry(add)
let add_five = curried_add(5)

# add_five(3) == 8
```