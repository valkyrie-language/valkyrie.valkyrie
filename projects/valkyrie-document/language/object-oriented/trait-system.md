# Trait 系统 (Trait System)

## 概述

Valkyrie 的 trait 系统提供了强大的抽象机制，支持接口定义、默认实现、多重继承和匿名 trait。Trait 系统是 Valkyrie 面向对象编程的核心组成部分。

## 基本 Trait 定义

### 简单 Trait

```valkyrie
trait Display {
    fmt(self) -> String
}

trait Clone {
    clone(self) -> Self
}

trait Debug {
    debug_fmt(self) -> String {
        # 默认实现
        @format("{}@{:p}", self.type_name(), &self)
    }
}
```

### 带关联类型的 Trait

```valkyrie
trait Iterator {
    type Item
    
    next(mut self) -> Option<Self::Item>
    
    collect<C: FromIterator<Self::Item>>(self) -> C {
        C::from_iter(self)
    }
}

trait FromIterator<T> {
    from_iter<I: Iterator<Item = T>>(iter: I) -> Self
}
```

### 带约束的 Trait

```valkyrie
trait PartialEq<Rhs = Self> {
    eq(self, other: &Rhs) -> bool
    
    ne(self, other: &Rhs) -> bool {
        !self.eq(other)
    }
}

trait Ord: PartialEq + PartialOrd {
    cmp(self, other: &Self) -> Ordering
}
```

## Trait 实现

### 基本实现

```valkyrie
class Point {
    x: f64,
    y: f64,
}

imply Display for Point {
    fmt(self) -> String {
        @format("Point({}, {})", self.x, self.y)
    }
}

imply Clone for Point {
    clone(self) -> Self {
        new Point { x: self.x, y: self.y }
    }
}
```

### 泛型实现

```valkyrie
impl<T: Display> Display for Vector<T> {
    fmt(self) -> String {
        let items = self.iter()
            .map({ $item.fmt() })
            .collect::<Vector<String>>()
            .join(", ")
        @format("[{}]", items)
    }
}

impl<T: Clone> Clone for Vector<T> {
    clone(self) -> Self {
        self.iter().map({ $item.clone() }).collect()
    }
}
```

### 条件实现

```valkyrie
impl<T: PartialEq> PartialEq for Vector<T> {
    eq(self, other: &Self) -> bool {
        self.len() == other.len() && 
        self.iter().zip(other.iter()).all({ $a.eq($b) })
    }
}
```

## 匿名 Trait

Valkyrie 支持匿名 trait，可以在函数参数中直接定义：

```valkyrie
# 匿名 trait 作为参数
micro process_drawable(drawable: ftrait {
    draw(self)
    get_bounds(self) -> Rectangle
}) {
    let bounds = drawable.get_bounds()
    println("Drawing object with bounds: {}", bounds)
    drawable.draw()
}

# 使用匿名 trait
let circle = class {
    radius: f64,
    
    draw(self) {
        println("Drawing circle with radius {}", self.radius)
    }
    
    get_bounds(self) -> Rectangle {
        Rectangle::new(-self.radius, -self.radius, 
                      self.radius * 2, self.radius * 2)
    }
}

process_drawable(new circle { radius: 5.0 })
```

### 匿名 Trait 继承

```valkyrie
# 继承现有 trait 的匿名 trait
micro handle_serializable(obj: ftrait(Display, Clone) {
    Encode(self) -> String
}) {
    println("Object: {}", obj.fmt())
    let cloned = obj.clone()
    let Encoded = obj.Encode()
    println("Encoded: {}", Encoded)
}
```

## Trait 对象

### 动态分发

```valkyrie
trait Animal {
    make_sound(self)
    name(self) -> String
}

class Dog {
    name: String,
}

imply Animal for Dog {
    make_sound(self) {
        println("Woof!")
    }
    
    name(self) -> String {
        self.name.clone()
    }
}

class Cat {
    name: String,
}

imply Animal for Cat {
    make_sound(self) {
        println("Meow!")
    }
    
    name(self) -> String {
        self.name.clone()
    }
}

# 使用 trait 对象
let animals: Vector<Box<dyn Animal>> = vec![
    Box::new(new Dog { name: "Buddy" }),
    Box::new(new Cat { name: "Whiskers" }),
]

for animal in animals {
    println("{} says:", animal.name())
    animal.make_sound()
}
```

### Trait 对象安全

```valkyrie
# 对象安全的 trait
trait Draw {
    draw(self)  # 接收 self，对象安全
}

# 非对象安全的 trait
trait Clone {
    clone(self) -> Self  # 返回 Self，非对象安全
}

# 使用 where 子句限制
trait Container {
    type Item
    
    get(self, index: usize) -> Option<&Self::Item>
    
    # 只有当 Self::Item 实现了 Display 时才能调用
    display_item(self, index: usize) 
    where Self::Item: Display {
        if let Some(item) = self.get(index) {
            println("{}", item.fmt())
        }
    }
}
```

## 高级特性

### 关联常量

```valkyrie
trait MathConstants {
    const PI: f64 = 3.14159265359
    const E: f64 = 2.71828182846
    
    circle_area(radius: f64) -> f64 {
        Self::PI * radius * radius
    }
}

class Calculator {}

imply MathConstants for Calculator {}

let area = Calculator::circle_area(5.0)
```

### 高阶 Trait 边界

```valkyrie
# 高阶 trait 边界
micro map_closure<F, T, U>(items: Vector<T>, f: F) -> Vector<U>
where
    F: Fn(&T) -> U,
{
    items.iter().map(f).collect()
}

# 使用示例
let numbers = vec![1, 2, 3, 4, 5]
let doubled = map_closure(numbers, { $x * 2 })
```

### Trait 别名

```valkyrie
# 定义 trait 别名
trait Printable = Display + Debug + Clone

# 使用 trait 别名
micro print_info<T: Printable>(item: T) {
    println("Display: {}", item.fmt())
    println("Debug: {}", item.debug_fmt())
    let cloned = item.clone()
    println("Cloned: {}", cloned.fmt())
}
```

## 派生宏

Valkyrie 提供了自动派生常用 trait 的宏：

```valkyrie
↯derive(Debug, Clone, PartialEq, Eq, Hash)
class User {
    id: u64,
    name: String,
    email: String,
}

↯derive(Display)
class Point {
    x: f64,
    y: f64,
}

# 自定义派生行为
↯derive(Debug, Clone)
↯derive_display(format = "User({})", field = "name")
class SimpleUser {
    name: String,
    internal_id: u64,  # 不会在 Display 中显示
}
```

## 最佳实践

### 1. Trait 设计原则

```valkyrie
# 好的设计：单一职责
trait Readable {
    read(self, buffer: &mut [u8]) -> Result<usize, Error>
}

trait Writable {
    write(self, data: &[u8]) -> Result<usize, Error>
}

# 组合使用
trait ReadWrite: Readable + Writable {}

# 避免：过于复杂的 trait
# trait FileOperations {
#     read(...) -> ...
#     write(...) -> ...
#     seek(...) -> ...
#     metadata(...) -> ...
#     permissions(...) -> ...
# }
```

### 2. 使用关联类型 vs 泛型参数

```valkyrie
# 使用关联类型：每个类型只有一个实现
trait Iterator {
    type Item
    next(mut self) -> Option<Self::Item>
}

# 使用泛型参数：可以有多个实现
trait From<T> {
    from(value: T) -> Self
}

# String 可以从多种类型转换
imply From<&str> for String { ... }
imply From<char> for String { ... }
imply From<Vector<char>> for String { ... }
```

### 3. 错误处理

```valkyrie
trait TryFrom<T> {
    type Error
    
    try_from(value: T) -> Result<Self, Self::Error>
}

trait TryInto<T> {
    type Error
    
    try_into(self) -> Result<T, Self::Error>
}

# 自动实现
impl<T, U> TryInto<U> for T 
where U: TryFrom<T> {
    type Error = U::Error
    
    try_into(self) -> Result<U, Self::Error> {
        U::try_from(self)
    }
}
```

## 总结

Valkyrie 的 trait 系统提供了：

1. **灵活的抽象**：通过 trait 定义行为接口
2. **代码复用**：通过默认实现和泛型
3. **类型安全**：编译时检查 trait 边界
4. **动态分发**：通过 trait 对象支持运行时多态
5. **匿名 trait**：支持临时的行为定义
6. **组合能力**：通过 trait 边界组合多个能力

正确使用 trait 系统可以编写出既灵活又类型安全的代码。