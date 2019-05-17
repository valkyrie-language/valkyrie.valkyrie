# 匿名类 (Anonymous Classes)

## 概述

Valkyrie 支持匿名类，允许在需要时临时定义类而无需显式声明。匿名类特别适用于回调函数、临时对象创建和函数式编程场景。匿名类的语法与具名类定义完全一致，只是没有类名。

## 基本匿名类语法

### 语法一致性

匿名类与具名类使用完全相同的语法，唯一的区别是匿名类没有类名：

| 语法特性  | 具名类                                         | 匿名类                                    |
|-------|---------------------------------------------|----------------------------------------|
| 基本定义  | `class Name { ... }`                        | `class { ... }`                        |
| 继承    | `class Name(Base) { ... }`                  | `class(Base) { ... }`                  |
| 多重继承  | `class Name(Base): Trait1 + Trait2 { ... }` | `class(Base): Trait1 + Trait2 { ... }` |
| 泛型    | `class Name<T> { ... }`                     | `class<T> { ... }`                     |
| 带约束泛型 | `class Name<T: Bound> { ... }`              | `class<T: Bound> { ... }`              |
| 方法定义  | `micro method(self) { ... }`                | `micro method(self) { ... }`           |
| 字段定义  | `field: Type`                               | `field: Type`                          |

### 语法一致性

匿名类的语法与具名类定义完全相同：

```valkyrie
# 具名类定义
class Point {
    x: f64,
    y: f64,
    
    distance_from_origin(self) -> f64 {
        (self.x * self.x + self.y * self.y).sqrt()
    }
}

# 匿名类定义 - 与具名类语法完全一致
class {
    x: f64,
    y: f64,
    
    distance_from_origin(self) -> f64 {
        (self.x * self.x + self.y * self.y).sqrt()
    }
}
```

### 简单匿名类

```valkyrie
# 使用 trait 定义接口
trait Point {
    x: f64,
    y: f64,
    
    distance_from_origin(self) -> f64
}

# 匿名类实现 trait - 注意：匿名类不能作为返回类型
micro create_point() -> Point {
    new Point {
        x: 10.0,
        y: 20.0,
        
        distance_from_origin(self) -> f64 {
            (self.x * self.x + self.y * self.y).sqrt()
        }
    }
}

# 使用匿名类
let point = create_point()
let distance = point.distance_from_origin()
println("Distance: {}", distance)
```

### 匿名类作为参数

```valkyrie
# 接受匿名类作为参数
micro process_drawable(drawable: class {
    draw(self)
    get_area(self) -> f64
}) {
    println("Area: {}", drawable.get_area())
    drawable.draw()
}

# 传递匿名类实例
process_drawable(class {
    radius: f64,
    
    draw(self) {
        println("Drawing circle with radius {}", self.radius)
    }
    
    get_area(self) -> f64 {
        3.14159 * self.radius * self.radius
    }
} { radius = 5.0 })
```

### 匿名类与闭包的区别

```valkyrie
# 闭包语法：{ 参数 表达式 }
let closure = { $x $x * 2 }
let result = closure(5)  # 结果：10

# 匿名类语法：class { 字段和方法 }
let anonymous_obj = class {
    multiplier: i32,
    
    multiply(self, x: i32) -> i32 {
        x * self.multiplier
    }
} { multiplier = 2 }

let result = anonymous_obj.multiply(5)  # 结果：10
```

## 匿名类继承

匿名类支持完整的继承语法，与具名类定义完全一致：

### 继承具名类

```valkyrie
class Shape {
    color: String,
    
    set_color(mut self, color: String) {
        self.color = color
    }
    
    get_color(self) -> String {
        self.color.clone()
    }
}

# 匿名类继承具名类 - 语法：class(BaseClass) { ... }
micro create_circle(radius: f64) -> class(Shape) {
    radius: f64,
    
    area(self) -> f64 {
        3.14159 * self.radius * self.radius
    }
    
    draw(self) {
        println("Drawing {} circle with radius {}", 
                self.get_color(), self.radius)
    }
} {
    class(Shape) {
        color = "red",
        radius = radius,
        
        area(self) -> f64 {
            3.14159 * self.radius * self.radius
        }
        
        draw(self) {
            println("Drawing {} circle with radius {}", 
                    self.get_color(), self.radius)
        }
    }
}
```

### 多重继承的匿名类

```valkyrie
trait Drawable {
    draw(self)
}

trait Movable {
    move_to(mut self, x: f64, y: f64)
    get_position(self) -> (f64, f64)
}

class GameObject {
    id: u32,
    
    get_id(self) -> u32 {
        self.id
    }
}

# 匿名类多重继承
micro create_sprite() -> class(GameObject): Drawable + Movable {
    x: f64,
    y: f64,
    sprite_name: String,
} {
    class(GameObject): Drawable + Movable {
        id = 1001,
        x = 0.0,
        y = 0.0,
        sprite_name = "player",
        
        draw(self) {
            println("Drawing sprite '{}' at ({}, {})", 
                    self.sprite_name, self.x, self.y)
        }
        
        move_to(mut self, x: f64, y: f64) {
            self.x = x
            self.y = y
        }
        
        get_position(self) -> (f64, f64) {
            (self.x, self.y)
        }
    }
}
```

## 匿名类的高级用法

### 工厂模式

```valkyrie
# 使用匿名类实现工厂模式
micro create_handler(handler_type: String) -> class {
    handle(self, request: String) -> String
} {
    match handler_type {
        case "json" => class {
            handle(self, request: String) -> String {
                @format("{{\"response\": \"{}\"}}", request)
            }
        },
        case "xml" => class {
            handle(self, request: String) -> String {
                @format("<response>{}</response>", request)
            }
        },
        case _ => class {
            handle(self, request: String) -> String {
                @format("Plain response: {}", request)
            }
        }
    }
}

let json_handler = create_handler("json")
let response = json_handler.handle("Hello World")
```

### 策略模式

```valkyrie
# 策略接口
trait SortStrategy {
    sort(self, data: &mut Vector<i32>)
}

# 使用匿名类实现不同策略
micro get_sort_strategy(strategy_name: String) -> class: SortStrategy {
    match strategy_name {
        case "bubble" => class: SortStrategy {
            sort(self, data: &mut Vector<i32>) {
                # 冒泡排序实现
                for i in 0..data.len() {
                    for j in 0..(data.len() - 1 - i) {
                        if data[j] > data[j + 1] {
                            data.swap(j, j + 1)
                        }
                    }
                }
            }
        },
        case "quick" => class: SortStrategy {
            sort(self, data: &mut Vector<i32>) {
                # 快速排序实现
                self.quick_sort(data, 0, data.len() as i32 - 1)
            }
            
            quick_sort(self, data: &mut Vector<i32>, low: i32, high: i32) {
                if low < high {
                    let pi = self.partition(data, low, high)
                    self.quick_sort(data, low, pi - 1)
                    self.quick_sort(data, pi + 1, high)
                }
            }
            
            partition(self, data: &mut Vector<i32>, low: i32, high: i32) -> i32 {
                # 分区实现
                let pivot = data[high as usize]
                let mut i = low - 1
                
                for j in low..high {
                    if data[j as usize] <= pivot {
                        i += 1
                        data.swap(i as usize, j as usize)
                    }
                }
                data.swap((i + 1) as usize, high as usize)
                i + 1
            }
        },
        case _ => class: SortStrategy {
            sort(self, data: &mut Vector<i32>) {
                data.sort()  # 使用默认排序
            }
        }
    }
}
```

### 建造者模式

```valkyrie
# 使用匿名类实现建造者模式
micro create_config_builder() -> class {
    host: Option<String>,
    port: Option<u16>,
    timeout: Option<u32>,
    
    set_host(mut self, host: String) -> Self {
        self.host = Some(host)
        self
    }
    
    set_port(mut self, port: u16) -> Self {
        self.port = Some(port)
        self
    }
    
    set_timeout(mut self, timeout: u32) -> Self {
        self.timeout = Some(timeout)
        self
    }
    
    build(self) -> Config {
        Config {
            host: self.host.unwrap_or("localhost"),
            port: self.port.unwrap_or(8080),
            timeout: self.timeout.unwrap_or(30),
        }
    }
} {
    class {
        host = None,
        port = None,
        timeout = None,
        
        set_host(mut self, host: String) -> Self {
            self.host = Some(host)
            self
        }
        
        set_port(mut self, port: u16) -> Self {
            self.port = Some(port)
            self
        }
        
        set_timeout(mut self, timeout: u32) -> Self {
            self.timeout = Some(timeout)
            self
        }
        
        build(self) -> Config {
            Config {
                host: self.host.unwrap_or("localhost"),
                port: self.port.unwrap_or(8080),
                timeout: self.timeout.unwrap_or(30),
            }
        }
    }
}

# 使用建造者
let config = create_config_builder()
    .set_host("example.com")
    .set_port(9000)
    .set_timeout(60)
    .build()
```

## 匿名类与泛型

### 泛型匿名类

匿名类支持完整的泛型语法，与具名类定义完全一致：

```valkyrie
# 泛型匿名类 - 语法：class<T> { ... }
micro create_container<T>(value: T) -> class {
    value: T,
    
    get(self) -> &T {
        &self.value
    }
    
    set(mut self, new_value: T) {
        self.value = new_value
    }
} {
    class {
        value = value,
        
        get(self) -> &T {
            &self.value
        }
        
        set(mut self, new_value: T) {
            self.value = new_value
        }
    }
}

let string_container = create_container("Hello")
let number_container = create_container(42)
```

### 带约束的泛型匿名类

```valkyrie
# 带约束的泛型匿名类 - 语法：class<T: Bound> { ... }
micro create_comparable_pair<T: PartialOrd + Clone>(a: T, b: T) -> class {
    first: T,
    second: T,
    
    max(self) -> T {
        if self.first > self.second {
            self.first.clone()
        } else {
            self.second.clone()
        }
    }
    
    min(self) -> T {
        if self.first < self.second {
            self.first.clone()
        } else {
            self.second.clone()
        }
    }
} {
    class {
        first = a,
        second = b,
        
        max(self) -> T {
            if self.first > self.second {
                self.first.clone()
            } else {
                self.second.clone()
            }
        }
        
        min(self) -> T {
            if self.first < self.second {
                self.first.clone()
            } else {
                self.second.clone()
            }
        }
    }
}
```

### 约束泛型匿名类

```valkyrie
# 带约束的泛型匿名类
micro create_comparable_pair<T: PartialOrd + Clone>(a: T, b: T) -> class {
    first: T,
    second: T,
    
    max(self) -> T {
        if self.first > self.second {
            self.first.clone()
        } else {
            self.second.clone()
        }
    }
    
    min(self) -> T {
        if self.first < self.second {
            self.first.clone()
        } else {
            self.second.clone()
        }
    }
} {
    class {
        first = a,
        second = b,
        
        max(self) -> T {
            if self.first > self.second {
                self.first.clone()
            } else {
                self.second.clone()
            }
        }
        
        min(self) -> T {
            if self.first < self.second {
                self.first.clone()
            } else {
                self.second.clone()
            }
        }
    }
}
```

## 匿名类的生命周期

### 捕获外部变量

```valkyrie
micro create_counter(initial: i32) -> class {
    count = i32,
    
    increment(mut self) -> i32 {
        self.count += 1
        self.count
    }
    
    get_count(self) -> i32 {
        self.count
    }
} {
    class {
        count = initial,  # 捕获外部变量
        
        increment(mut self) -> i32 {
            self.count += 1
            self.count
        }
        
        get_count(self) -> i32 {
            self.count
        }
    }
}

let counter = create_counter(10)
let value1 = counter.increment()  # 11
let value2 = counter.increment()  # 12
```

## 限制和注意事项

### 返回值限制

**重要**：匿名类不能作为函数的返回值类型，这会导致类型推断错误和编译问题。

```valkyrie
# ❌ 错误：不能返回匿名类
micro create_handler() -> ? {
    return new {
        handle(data: String) {
            print("Handling: ${ data }")
        }
    }
}

# ✅ 正确：使用具名类或 trait
trait Handler {
    handle(data: String)
}

micro create_handler() -> Handler {
    return new Handler {
        handle(data: String) {
            print("Handling: ${ data }")
        }
    }
}
```

### 类型推断问题

匿名类的类型信息在编译时难以确定，因此：

1. **避免作为返回值**：会导致类型系统混乱
2. **限制泛型使用**：在泛型上下文中使用需谨慎
3. **接口约束**：优先使用 trait 来约束匿名类

## 最佳实践

### 设计原则

1. **单一职责**：匿名类应该只负责一个特定的功能
2. **简洁性**：避免在匿名类中实现过于复杂的逻辑
3. **可读性**：确保匿名类的用途清晰明了
4. **生命周期管理**：注意匿名类实例的生命周期
5. **类型安全**：避免将匿名类用作返回值类型

### 性能考虑

1. **内存使用**：匿名类会创建新的类型，注意内存开销
2. **编译时间**：大量使用匿名类可能影响编译性能
3. **运行时性能**：匿名类的方法调用与普通类相同
4. **类型检查开销**：匿名类的类型检查可能更复杂

### 推荐使用场景

- **局部回调**：在方法内部创建临时回调对象
- **策略实现**：实现特定的策略接口
- **适配器模式**：适配不同的接口（但不作为返回值）
- **测试桩对象**：在测试中创建模拟对象

### 避免的场景

- **函数返回值**：永远不要将匿名类作为返回值
- **公共 API**：避免在公共接口中暴露匿名类
- **长期存储**：不要将匿名类实例长期保存
- **复杂继承**：避免复杂的匿名类继承链

### 1. 适当使用匿名类

```valkyrie
# 好的用法：临时对象
micro process_data(processor: class {
    process(self, data: String) -> String
}) -> String {
    processor.process("input data")
}

# 避免：复杂的匿名类
# 如果匿名类过于复杂，应该定义为具名类
```

### 2. 保持匿名类简洁

```valkyrie
# 好的设计：简洁的匿名类
let validator = class {
    validate(self, input: String) -> bool {
        !input.is_empty() && input.len() <= 100
    }
}

# 避免：过于复杂的匿名类
# class {
#     # 大量字段和方法
# }
```

### 3. 明确类型注解

```valkyrie
# 好的做法：明确类型
micro create_handler() -> class {
    handle(self, request: String) -> Result<String, Error>
} {
    # 实现
}

# 避免：模糊的类型
# micro create_handler() -> class { ... }  # 不清楚接口
```

## 总结

Valkyrie 的匿名类特性：

1. **灵活性**：无需预先定义类即可创建对象
2. **继承支持**：支持继承具名类和实现 trait
3. **泛型支持**：支持泛型参数和约束
4. **闭包区分**：与闭包语法明确区分
5. **模式支持**：适用于工厂、策略、建造者等设计模式

匿名类特别适用于需要临时对象、回调处理和函数式编程的场景。