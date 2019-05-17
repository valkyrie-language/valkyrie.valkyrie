# 模块系统

Valkyrie 采用基于命名空间（namespace）和导入（using）的模块系统，提供灵活的代码组织和依赖管理方式。

## 命名空间声明

### 基本命名空间

```valkyrie
# 声明命名空间
namespace math.geometry {
    class Point {
        x: f64,
        y: f64,
    }
    
    distance(p1: Point, p2: Point) -> f64 {
        let dx = p1.x - p2.x
        let dy = p1.y - p2.y
        (dx * dx + dy * dy).sqrt()
    }
}
```

### 嵌套命名空间

```valkyrie
namespace graphics {
    namespace shapes {
        class Circle {
            center: Point,
            radius: f64,
        }
        
        class Rectangle {
            top_left: Point,
            width: f64,
            height: f64,
        }
    }
    
    namespace colors {
        class RGB {
            r: u8,
            g: u8,
            b: u8,
        }
        
        let RED: RGB = class { r = 255, g = 0, b = 0 }
        let GREEN: RGB = class { r = 0, g = 255, b = 0 }
        let BLUE: RGB = class { r = 0, g = 0, b = 255 }
    }
}
```

## 导入系统

### 基本导入

```valkyrie
# 导入整个命名空间
using math.geometry.*

micro main() {
    let p1 = new Point { x: 0.0, y: 0.0 }
    let p2 = new Point { x: 3.0, y: 4.0 }
    let dist = distance(p1, p2)
    println("Distance: ${dist}")
}
```

### 选择性导入

```valkyrie
# 导入特定项目
using math.geometry.{Point, distance}
using graphics.colors.{RED, GREEN, BLUE}

# 导入并重命名
using math.geometry.Point as GeomPoint
using graphics.shapes.Point as ShapePoint

micro create_points() {
    let geom_point = new GeomPoint { x: 1.0, y: 2.0 }
    let shape_point = new ShapePoint { x: 3.0, y: 4.0 }
}
```

### 通配符导入

```valkyrie
# 导入命名空间中的所有公开项目
using math.geometry.*
using graphics.colors.*

# 谨慎使用，可能导致命名冲突
micro example() {
    let point = new Point { x: 0.0, y: 0.0 }
    let color = RED
}
```

## 可见性控制

### 访问修饰符

```valkyrie
namespace database {
    # 公开结构体
    class Connection {
        # 私有字段
        host: String,
        port: u16,
        # 公开字段（显式声明）
        public timeout: Duration,
    }
    
    # 包内可见
    class InternalConfig {
        secret_key: String,
    }
    
    # 私有函数（默认就是私有的）
    validate_connection(conn: &Connection) -> bool {
        # 内部验证逻辑
        true
    }
    
    # 公开函数
    connect(host: String, port: u16) -> Result<Connection, Error> {
        let conn = new Connection { host, port, timeout: Duration::seconds(30) }
        if validate_connection(&conn) {
            Fine(conn)
        } else {
            Fail(Error::InvalidConnection)
        }
    }
}
```

### 重新导出

```valkyrie
namespace api {
    # 重新导出其他模块的类型
    using database.{Connection, Error}
    using auth.{User, Session}
    
    # 提供统一的 API 接口
    create_authenticated_connection(credentials: Credentials) -> Result<(Connection, Session), Error> {
        let session = auth::login(credentials)?
        let connection = database::connect("localhost", 5432)?
        Fine((connection, session))
    }
}
```

## 文件路径无关的模块

### 逻辑模块组织

Valkyrie 的模块系统不依赖文件路径，而是基于逻辑命名空间：

```valkyrie
# 文件: src/geometry.val
namespace math.geometry {
    class Point { x: f64, y: f64 }
}

# 文件: src/algebra.val  
namespace math.algebra {
    class Matrix { data: [[f64]] }
}

# 文件: src/utils.val
namespace math.geometry {  # 扩展已存在的命名空间
    origin() -> Point {
        new Point { x: 0.0, y: 0.0 }
    }
}
```

### 模块声明文件

```valkyrie
# 文件: math.module.val
# 声明模块的公开接口
module math {
    namespace geometry {
        class Point
        distance(Point, Point) -> f64
        origin() -> Point
    }
    
    namespace algebra {
        class Matrix
        multiply(Matrix, Matrix) -> Matrix
    }
}
```

## 条件编译和特性

### 特性门控

```valkyrie
namespace network {
    # 基础网络功能
    class TcpStream { /* ... */ }
    
    # 异步功能（需要 async 特性）
    ↯cfg(feature = "async")
    namespace async {
        class AsyncTcpStream { /* ... */ }
        
        connect_async(addr: SocketAddr) -> Future<Result<AsyncTcpStream, Error>> {
            # 异步连接实现
        }
    }
    
    # TLS 支持（需要 tls 特性）
    ↯cfg(feature = "tls")
    namespace tls {
        class TlsStream { /* ... */ }
        
        wrap_tls(stream: TcpStream, config: TlsConfig) -> Result<TlsStream, TlsError> {
            # TLS 包装实现
        }
    }
}
```

### 平台特定代码

```valkyrie
namespace platform {
    # 通用接口
    trait FileSystem {
        read_file(path: String) -> Result<String, IoError>
        write_file(path: String, content: String) -> Result<(), IoError>
    }
    
    # Windows 实现
    ↯cfg(target_os = "windows")
    namespace windows {
        class WindowsFileSystem
        
        imply FileSystem for WindowsFileSystem {
            read_file(path: String) -> Result<String, IoError> {
                # Windows 特定实现
            }
        }
    }
    
    # Unix 实现
    ↯cfg(any(target_os = "linux", target_os = "macos"))
    namespace unix {
        class UnixFileSystem
        
        imply FileSystem for UnixFileSystem {
            read_file(path: String) -> Result<String, IoError> {
                # Unix 特定实现
            }
        }
    }
}
```

## 依赖管理

### 外部依赖

```valkyrie
# 项目配置文件: valkyrie.toml
[dependencies]
serde = "1.0"
tokio = { version = "1.0", features = ["full"] }
log = "0.4"

[dev-dependencies]
tokio-test = "0.4"

# 在代码中使用外部依赖
using serde.{Serialize, Deserialize}
using tokio.runtime.Runtime
using log.{info, warn, error}

↯derive(Serialize, Deserialize)
class Config {
    host: String,
    port: u16,
}

micro main() {
    let rt = Runtime::new().unwrap()
    rt.block_on(async_main())
}

async micro async_main() {
    info("Starting application")
    # 异步逻辑
}
```

### 工作空间

```valkyrie
# 工作空间配置: Workspace.toml
[workspace]
members = [
    "core",
    "api",
    "cli",
    "web"
]

# 共享依赖
[workspace.dependencies]
serde = "1.0"
tokio = "1.0"

# 在子项目中引用工作空间依赖
# core/valkyrie.toml
[dependencies]
serde = { workspace = true }
tokio = { workspace = true }

# 内部依赖
api = { path = "../api" }
```

## 模块初始化

### 静态初始化

```valkyrie
namespace config {
    # 静态配置
    static DATABASE_URL: String = @env("DATABASE_URL")
    static MAX_CONNECTIONS: i32 = 100
    
    # 延迟初始化
    static LOGGER: Lazy<Logger> = Lazy::new({
        Logger::new()
            .with_level(LogLevel::Info)
            .with_output(Output::Stdout)
    })
}
```

### 动态初始化

```valkyrie
namespace database {
    static mut CONNECTION_POOL: Option<ConnectionPool> = None
    
    # 初始化函数
    initialize(config: DatabaseConfig) -> Result<(), Error> {
        unsafe {
            if CONNECTION_POOL.is_some() {
                return Fail(Error::AlreadyInitialized)
            }
            
            let pool = ConnectionPool::new(config)?
            CONNECTION_POOL = Some(pool)
            Fine { value: () }
        }
    }
    
    # 获取连接函数
    get_connection() -> Result<Connection, Error> {
        unsafe {
            CONNECTION_POOL
                .as_ref()
                .ok_or(Error::NotInitialized)?
                .get_connection()
        }
    }
}
```

## 测试模块

### 单元测试

```valkyrie
namespace math.geometry {
    # 距离函数
    distance(p1: Point, p2: Point) -> f64 {
        let dx = p1.x - p2.x
        let dy = p1.y - p2.y
        (dx * dx + dy * dy).sqrt()
    }
    
    # 测试模块
    ↯cfg(test)
    namespace tests {
        using super.*
        
        ↯test
        test_distance_same_point() {
            let p = new Point { x: 1.0, y: 2.0 }
            let dist = distance(p, p)
            @assert_equal(dist, 0.0)
        }
        
        ↯test
        test_distance_different_points() {
            let p1 = new Point { x: 0.0, y: 0.0 }
            let p2 = new Point { x: 3.0, y: 4.0 }
            let dist = distance(p1, p2)
            @assert_equal(dist, 5.0)
        }
    }
}
```

### 集成测试

```valkyrie
# 文件: tests/integration.val
using myapp.api.*
using myapp.database.*

↯test
micro test_full_workflow() {
    # 设置测试环境
    let config = TestConfig::default()
    initialize_test_database(config)
    
    # 执行测试
    let user = create_user("alice", "alice@example.com")
    ↯assert_true(user.is_ok())
    
    let found_user = find_user_by_email("alice@example.com")
    ↯assert_true(found_user.is_some())
    
    # 清理
    cleanup_test_database()
}
```

## 最佳实践

### 模块设计原则

1. **单一职责**: 每个模块应该有明确的职责
2. **低耦合**: 模块间依赖应该最小化
3. **高内聚**: 相关功能应该组织在同一模块中
4. **接口稳定**: 公开接口应该保持稳定

### 命名约定

```valkyrie
# 好的命名空间组织
namespace myapp {
    namespace core {        # 核心功能
        namespace types     # 基础类型
        namespace traits    # 特征定义
        namespace utils     # 工具函数
    }
    
    namespace services {    # 业务服务
        namespace user      # 用户服务
        namespace auth      # 认证服务
        namespace payment   # 支付服务
    }
    
    namespace adapters {    # 适配器层
        namespace database  # 数据库适配器
        namespace http      # HTTP 适配器
        namespace cache     # 缓存适配器
    }
}
```

### 版本兼容性

```valkyrie
namespace api {
    # 版本化 API
    namespace v1 {
        class User {
            id: i64,
            name: String,
        }
        
        get_user(id: i64) -> Option<User> {
            # v1 实现
        }
    }
    
    namespace v2 {
        class User {
            id: i64,
            name: String,
            email: String,  # 新增字段
        }
        
        get_user(id: i64) -> Option<User> {
            # v2 实现
        }
        
        # 向后兼容
        get_user_v1(id: i64) -> Option<v1::User> {
            get_user(id).map({ v1::User {
                id: u.id,
                name: u.name,
            })
        }
    }
    
    # 当前版本别名
    using v2.*
}
```