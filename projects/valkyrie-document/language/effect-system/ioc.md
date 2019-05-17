# 控制反转 (Inversion of Control)

控制反转（IoC）是一种设计原则，通过将对象的创建和依赖关系的管理从对象本身转移到外部容器或框架中，实现了松耦合的设计。在 Valkyrie 中，IoC 通过 Effect 系统实现，提供了强大的依赖注入和服务定位能力。

## 基本概念

### 依赖注入 (Dependency Injection)
依赖注入是 IoC 的一种实现方式，通过外部注入依赖对象，而不是在对象内部创建依赖。

### 服务定位 (Service Locator)
服务定位器是一个中央注册表，用于查找和获取服务实例。

### 生命周期管理
容器负责管理对象的生命周期，包括创建、初始化、销毁等。

## Effect 系统中的 IoC

### 定义依赖注入 Effect

```valkyrie
# 定义依赖注入 Effect
effect DependencyInjection {
    resolve<T>(service_type: Type<T>) -> T
    resolve_named<T>(service_type: Type<T>, name: String) -> T
    register<T>(service_type: Type<T>, instance: T): Unit
    register_factory<T>(service_type: Type<T>, factory: { -> T }): Unit
    register_singleton<T>(service_type: Type<T>, factory: { -> T }): Unit
}

# 定义服务生命周期 Effect
effect ServiceLifecycle {
    create<T>(service_type: Type<T>) -> T
    initialize<T>(instance: T): T
    dispose<T>(instance: T): Unit
}
```

### 实现 IoC 容器

```valkyrie
# IoC 容器实现
class IoCContainer {
    private mut services: {Type: Any} = {}
    private mut factories: {Type: { -> Any }} = {}
    private mut singletons: {Type: Any} = {}
    private mut named_services: {String: {Type: Any}} = {}
    
    handle DependencyInjection {
        resolve<T>(service_type) -> T {
            # 首先检查单例
            if let Some(instance) = self.singletons.get(service_type) {
                return instance as T
            }
            
            # 检查工厂方法
            if let Some(factory) = self.factories.get(service_type) {
                let instance = factory()
                return instance as T
            }
            
            # 检查已注册的实例
            if let Some(instance) = self.services.get(service_type) {
                return instance as T
            }
            
            # 尝试自动装配
            self.auto_wire(service_type)
        }
        
        resolve_named<T>(service_type, name) -> T {
            if let Some(named_map) = self.named_services.get(name) {
                if let Some(instance) = named_map.get(service_type) {
                    return instance as T
                }
            }
            
            raise ServiceNotFoundError { service_type, name }
        }
        
        register<T>(service_type, instance) {
            self.services[service_type] = instance
        }
        
        register_factory<T>(service_type, factory) {
            self.factories[service_type] = factory
        }
        
        register_singleton<T>(service_type, factory) {
            let instance = factory()
            self.singletons[service_type] = instance
        }
    }
    
    handle ServiceLifecycle {
        create<T>(service_type) -> T {
            # 使用反射或编译时信息创建实例
            let constructor = service_type.get_constructor()
            let dependencies = constructor.get_parameters().map({ 
            perform DependencyInjection.resolve($param.type)
        })
            constructor.invoke(dependencies)
        }
        
        initialize<T>(instance) -> T {
            # 执行初始化逻辑
            if instance implements Initializable {
                instance.initialize()
            }
            instance
        }
        
        dispose<T>(instance) {
            # 执行清理逻辑
            if instance implements Disposable {
                instance.dispose()
            }
        }
    }
    
    private micro auto_wire<T>(self, service_type: Type<T>) -> T {
        let instance = perform ServiceLifecycle.create(service_type)
        let initialized = perform ServiceLifecycle.initialize(instance)
        self.services[service_type] = initialized
        initialized
    }
}
```

### 使用依赖注入注解

```valkyrie
# 定义服务接口
trait UserRepository {
    find_by_id(self, id: String) -> Option<User>
    save(self, user: User) -> Unit
    delete(self, id: String) -> Unit
}

trait EmailService {
    send_email(self, to: String, subject: String, body: String) -> Unit
}

# 实现服务
class DatabaseUserRepository {
    private connection: DatabaseConnection
    
    # 构造函数注入
    new(↯inject connection: DatabaseConnection) {
        self.connection = connection
    }
    
    imply UserRepository {
        find_by_id(self, id) -> Option<User> {
            self.connection.query("SELECT * FROM users WHERE id = ?", [id])
                .map({ User::from_row($row) })
        }
        
        save(self, user) {
            self.connection.execute(
                "INSERT INTO users (id, name, email) VALUES (?, ?, ?)",
                [user.id, user.name, user.email]
            )
        }
        
        delete(self, id) {
            self.connection.execute("DELETE FROM users WHERE id = ?", [id])
        }
    }
}

class SmtpEmailService {
    private config: EmailConfig
    
    new(↯inject config: EmailConfig) {
        self.config = config
    }
    
    imply EmailService {
        send_email(self, to, subject, body) {
            # SMTP 发送逻辑
            let smtp_client = SmtpClient::new(self.config)
            smtp_client.send(to, subject, body)
        }
    }
}
```

### 服务类使用依赖注入

```valkyrie
# 用户服务类
class UserService {
    private user_repository: UserRepository
    private email_service: EmailService
    
    # 构造函数注入
    new(
        ↯inject user_repository: UserRepository,
        ↯inject email_service: EmailService
    ) {
        self.user_repository = user_repository
        self.email_service = email_service
    }
    
    ↯transactional
    create_user(self, name: String, email: String) -> User {
        let user = User {
            id: generate_id(),
            name,
            email,
            created_at: now()
        }
        
        self.user_repository.save(user)
        
        # 发送欢迎邮件
        self.email_service.send_email(
            user.email,
            "Welcome!",
            f"Welcome {user.name}!"
        )
        
        user
    }
    
    get_user(self, id: String) -> Option<User> {
        self.user_repository.find_by_id(id)
    }
    
    ↯authorized("admin")
    delete_user(self, id: String) -> Unit {
        if let Some(user) = self.user_repository.find_by_id(id) {
            self.user_repository.delete(id)
            
            # 发送账户删除通知
            self.email_service.send_email(
                user.email,
                "Account Deleted",
                "Your account has been deleted."
            )
        }
    }
}
```

### 配置和启动

```valkyrie
# 应用程序配置
class ApplicationConfig {
    configure_services(self, container: IoCContainer) {
        # 注册配置
        container.register(EmailConfig, EmailConfig {
            smtp_host: "smtp.example.com",
            smtp_port: 587,
            username: "app@example.com",
            password: "password"
        })
        
        # 注册数据库连接
        container.register_singleton(DatabaseConnection, {
            DatabaseConnection::new("postgresql://localhost/myapp")
        })
        
        # 注册服务实现
        container.register_factory(UserRepository, {
            let connection = perform DependencyInjection.resolve(DatabaseConnection)
            DatabaseUserRepository::new(connection)
        })
        
        container.register_factory(EmailService, {
            let config = perform DependencyInjection.resolve(EmailConfig)
            SmtpEmailService::new(config)
        })
        
        # 注册应用服务
        container.register_factory(UserService, {
            let user_repo = perform DependencyInjection.resolve(UserRepository)
            let email_service = perform DependencyInjection.resolve(EmailService)
            UserService::new(user_repo, email_service)
        })
    }
}

# 应用程序启动
class Application {
    private container: IoCContainer
    
    new() {
        self.container = new IoCContainer {}
        let config = new ApplicationConfig {}
        config.configure_services(self.container)
    }
    
    run(self) {
        with self.container {
            let user_service = perform DependencyInjection.resolve(UserService)
            
            # 使用服务
            let user = user_service.create_user("Alice", "alice@example.com")
            println(f"Created user: {user.id}")
            
            let found_user = user_service.get_user(user.id)
            println(f"Found user: {found_user}")
        }
    }
}
```

### 作用域和生命周期

```valkyrie
# 定义服务作用域
union ServiceScope {
    Singleton,    # 单例
    Transient,    # 瞬态
    Scoped,       # 作用域
    Request       # 请求作用域
}

# 作用域管理器
class ScopeManager {
    private mut scoped_services: {String: {Type: Any}} = {}
    private mut current_scope: Option<String> = None
    
    begin_scope(mut self, scope_id: String) {
        self.current_scope = Some(scope_id)
        self.scoped_services[scope_id] = {}
    }
    
    end_scope(mut self, scope_id: String) {
        if let Some(services) = self.scoped_services.remove(scope_id) {
            # 清理作用域内的服务
            for (_, service) in services {
                perform ServiceLifecycle.dispose(service)
            }
        }
        
        if self.current_scope == Some(scope_id) {
            self.current_scope = None
        }
    }
    
    get_scoped_service<T>(self, service_type: Type<T>) -> Option<T> {
        if let Some(scope_id) = self.current_scope {
            if let Some(services) = self.scoped_services.get(scope_id) {
                services.get(service_type).map({ $service as T })
            } else {
                None
            }
        } else {
            None
        }
    }
    
    set_scoped_service<T>(mut self, service_type: Type<T>, instance: T) {
        if let Some(scope_id) = self.current_scope {
            self.scoped_services.get_mut(scope_id).unwrap()[service_type] = instance
        }
    }
}
```

### 条件注册

```valkyrie
# 条件注册
class ConditionalRegistration {
    register_if<T>(
        self,
        container: IoCContainer,
        service_type: Type<T>,
        factory: { -> T },
        condition: { -> bool }
    ) {
        if condition() {
            container.register_factory(service_type, factory)
        }
    }
    
    register_profile<T>(
        self,
        container: IoCContainer,
        service_type: Type<T>,
        implementations: {String: { -> T }},
        active_profile: String
    ) {
        if let Some(factory) = implementations.get(active_profile) {
            container.register_factory(service_type, factory)
        }
    }
}

# 使用示例
let conditional = new ConditionalRegistration {}
let container = new IoCContainer {}

# 根据环境注册不同实现
conditional.register_profile(
    container,
    EmailService,
    {
        "development": { new MockEmailService {} },
        "production": { new SmtpEmailService {} },
        "testing": { new InMemoryEmailService {} }
    },
    get_active_profile()
)
```

### 装饰器模式

```valkyrie
# 服务装饰器
class ServiceDecorator<T> {
    private inner: T
    
    new(inner: T) {
        self.inner = inner
    }
    
    get_inner(self) -> T {
        self.inner
    }
}

# 缓存装饰器
class CachedUserRepository {
    private inner: UserRepository
    private mut cache: {String: User} = {}
    
    new(↯inject inner: UserRepository) {
        self.inner = inner
    }
    
    imply UserRepository {
        find_by_id(self, id) -> Option<User> {
            if let Some(cached) = self.cache.get(id) {
                return Some(cached)
            }
            
            let user = self.inner.find_by_id(id)
            if let Some(u) = user {
                self.cache[id] = u
            }
            user
        }
        
        save(self, user) {
            self.inner.save(user)
            self.cache[user.id] = user
        }
        
        delete(self, id) {
            self.inner.delete(id)
            self.cache.remove(id)
        }
    }
}

# 注册装饰器
container.register_factory(UserRepository, {
    let base_repo = DatabaseUserRepository::new(
        perform DependencyInjection.resolve(DatabaseConnection)
    )
    CachedUserRepository::new(base_repo)
})
```

## 最佳实践

### 1. 接口隔离
定义小而专注的接口，避免大而全的接口。

### 2. 单一职责
每个服务应该只有一个职责，避免服务过于复杂。

### 3. 生命周期管理
合理选择服务的生命周期，避免内存泄漏和资源浪费。

### 4. 循环依赖检测
在容器中实现循环依赖检测，避免无限递归。

```valkyrie
# 完整示例：Web 应用程序
class WebApplication {
    private container: IoCContainer
    private scope_manager: ScopeManager
    
    new() {
        self.container = new IoCContainer {}
        self.scope_manager = new ScopeManager {}
        self.configure_services()
    }
    
    private micro configure_services(self) {
        # 基础设施服务
        self.container.register_singleton(DatabaseConnection, {
            DatabaseConnection::new(get_connection_string())
        })
        
        # 仓储层
        self.container.register_factory(UserRepository, {
            let conn = perform DependencyInjection.resolve(DatabaseConnection)
            let base_repo = DatabaseUserRepository::new(conn)
            CachedUserRepository::new(base_repo)
        })
        
        # 应用服务层
        self.container.register_scoped(UserService, {
            let user_repo = perform DependencyInjection.resolve(UserRepository)
            let email_service = perform DependencyInjection.resolve(EmailService)
            UserService::new(user_repo, email_service)
        })
        
        # 控制器层
        self.container.register_scoped(UserController, {
            let user_service = perform DependencyInjection.resolve(UserService)
            UserController::new(user_service)
        })
    }
    
    handle_request(self, request: HttpRequest) -> HttpResponse {
        let request_id = generate_request_id()
        
        self.scope_manager.begin_scope(request_id)
        
        try {
            with self.container, self.scope_manager {
                let controller = perform DependencyInjection.resolve(UserController)
                controller.handle(request)
            }
        } finally {
            self.scope_manager.end_scope(request_id)
        }
    }
}
```

通过 Effect 系统实现的 IoC 提供了类型安全、灵活配置、易于测试的依赖注入能力，使得应用程序的架构更加清晰和可维护。