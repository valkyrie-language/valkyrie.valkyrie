# 高阶类型 (Higher-Kinded Types)

高阶类型（HKT）是 Valkyrie 类型系统的高级特性，允许对类型构造器进行抽象，实现更强大的泛型编程模式。

## 基本概念

### 类型的种类 (Kinds)

在 Valkyrie 中，类型有不同的"种类"：

```valkyrie
# 种类 *：具体类型
let x: i32        # i32 的种类是 *
let y: String     # String 的种类是 *

# 种类 * -> *：一元类型构造器
type Vector<T>       # Vec 的种类是 * -> *
type Option<T>    # Option 的种类是 * -> *

# 种类 * -> * -> *：二元类型构造器
type Result<T, E> # Result 的种类是 * -> * -> *
type HashMap<K, V> # HashMap 的种类是 * -> * -> *

# 种类 (* -> *) -> *：高阶类型构造器
type Monad<M>     # M 的种类是 * -> *
```

### 类型构造器抽象

```valkyrie
# 定义高阶类型特征
trait Functor<F> where F: * -> * {
    map<A, B>(self: F<A>, f: micro(A) -> B) -> F<B>
}

# 为具体类型实现
imply Functor<Option> {
    map<A, B>(self: Option<A>, f: micro(A) -> B) -> Option<B> {
        match self {
            Some(value) => Some(f(value)),
            None => None,
        }
    }
}

imply Functor<Vec> {
    map<A, B>(self: Vector<A>, f: micro(A) -> B) -> Vector<B> {
        let mut result = Vec::new()
        for item in self {
            result.push(f(item))
        }
        result
    }
}
```

## 单子模式 (Monad Pattern)

### 单子特征定义

```valkyrie
# 单子特征
trait Monad<M> where M: * -> * {
    # 将值包装到单子中
    pure<A>(value: A) -> M<A>
    
    # 单子绑定操作
    bind<A, B>(self: M<A>, f: micro(A) -> M<B>) -> M<B>
    
    # 便利方法：map 可以通过 bind 和 pure 实现
    map<A, B>(self: M<A>, f: micro(A) -> B) -> M<B> {
        self.bind({ M::pure(f($x)) })
    }
}

# Option 单子实现
imply Monad<Option> {
    pure<A>(value: A) -> Option<A> {
        Some(value)
    }
    
    bind<A, B>(self: Option<A>, f: micro(A) -> Option<B>) -> Option<B> {
        match self {
            Some(value) => f(value),
            None => None,
        }
    }
}

# Result 单子实现
impl<E> Monad<Result<_, E>> {
    pure<A>(value: A) -> Result<A, E> {
        Fine { value }
    }
    
    bind<A, B>(self: Result<A, E>, f: micro(A) -> Result<B, E>) -> Result<B, E> {
        match self {
            Fine { value } => f(value),
Fail { error } => Fail { error },
        }
    }
}
```

### 单子组合子

```valkyrie
# 单子组合子库
namespace monad_combinators {
    # 序列操作
    sequence<M, A>(list: Vector<M<A>>) -> M<Vector<A>> 
    where M: Monad
    {
        list.iter().fold(
            M::pure(Vec::new()),
            { $acc, $item; $acc.bind({ $mut_vec;
     $item.map({ $x;
                    vec.push(x)
                    vec
                })
            )
        )
    }
    
    # 遍历操作
    traverse<M, A, B>(list: Vector<A>, f: micro(A) -> M<B>) -> M<Vector<B>>
    where M: Monad
    {
        sequence(list.into_iter().map(f).collect())
    }
    
    # 过滤操作
    filter_m<M, A>(list: Vector<A>, predicate: micro(A) -> M<bool>) -> M<Vector<A>>
    where M: Monad
    {
        list.into_iter().fold(
            M::pure(Vec::new()),
            { $acc, $item; $acc.bind({ $mut_vec;
     predicate($item).map({ $keep;
                    if keep {
                        vec.push(item)
                    }
                    vec
                })
            )
        )
    }
}
```

## 应用函子 (Applicative Functor)

### 应用函子特征

```valkyrie
# 应用函子特征
trait Applicative<F> where F: * -> *, F: Functor {
    # 将值包装到应用函子中
    pure<A>(value: A) -> F<A>
    
    # 应用操作
    apply<A, B>(self: F<micro(A) -> B>, arg: F<A>) -> F<B>
    
    # 便利方法：lift2
    lift2<A, B, C>(f: micro(A, B) -> C, a: F<A>, b: F<B>) -> F<C> {
        F::pure(f).apply(a).apply(b)
    }
}

# Option 应用函子实现
imply Applicative<Option> {
    pure<A>(value: A) -> Option<A> {
        Some(value)
    }
    
    apply<A, B>(self: Option<micro(A) -> B>, arg: Option<A>) -> Option<B> {
        match (self, arg) {
            (Some(f), Some(x)) => Some(f(x)),
            _ => None,
        }
    }
}

# 使用应用函子进行并行验证
micro validate_user(name: String, email: String, age: i32) -> Option<User> {
    let validate_name = { $n: String;
        if n.len() > 0 { Some(n) } else { None }
    }
    
    let validate_email = { $e: String;
        if e.contains('@') { Some(e) } else { None }
    }
    
    let validate_age = { $a: i32;
        if a >= 0 && a <= 150 { Some(a) } else { None }
    }
    
    Option::lift3(
        { User { name: $n, email: $e, age: $a } },
        validate_name(name),
        validate_email(email),
        validate_age(age)
    )
}
```

## 自由单子 (Free Monad)

### 自由单子定义

```valkyrie
# 自由单子数据结构
union Free<F, A> where F: * -> * {
    Pure { value: A },
    Free { fa: F<Free<F, A>> },
}

# 自由单子实现
impl<F> Monad<Free<F, _>> where F: Functor {
    pure<A>(value: A) -> Free<F, A> {
        Free::Pure { value }
    }
    
    bind<A, B>(self: Free<F, A>, f: micro(A) -> Free<F, B>) -> Free<F, B> {
        match self {
            Free::Pure { value } => f(value),
            Free::Free { fa } => Free::Free { 
                fa: fa.map({ $free_a.bind(f) })
            },
        }
    }
}

# DSL 示例：文件操作
union FileOp<A> {
    ReadFile { path: String, cont: micro(String) -> A },
    WriteFile { path: String, content: String, cont: micro(()) -> A },
}

imply Functor<FileOp> {
    map<A, B>(self: FileOp<A>, f: micro(A) -> B) -> FileOp<B> {
        match self {
            FileOp::ReadFile { path, cont } => 
                FileOp::ReadFile { path, cont: { f(cont($s)) } },
            FileOp::WriteFile { path, content, cont } => 
                FileOp::WriteFile { path, content, cont: { f(cont($unit)) } },
        }
    }
}

type FileProgram<A> = Free<FileOp, A>

# DSL 构造函数
micro read_file(path: String) -> FileProgram<String> {
    Free::Free { 
        fa: FileOp::ReadFile { 
            path, 
            cont: { $content => Free::Pure { value: $content } }
        }
    }
}

micro write_file(path: String, content: String) -> FileProgram<()> {
    Free::Free {
        fa: FileOp::WriteFile {
            path,
            content,
            cont: { $unit => Free::Pure { value: $unit } }
        }
    }
}

# 使用 DSL
micro copy_file(src: String, dst: String) -> FileProgram<()> {
    read_file(src).bind({ $content =>
        write_file(dst, content)
    )
}
```

## 类型级函数

### 类型族 (Type Families)

```valkyrie
# 开放类型族
type family Element(container: *) -> *

# 类型族实例
type instance Element(Vector<T>) = T
type instance Element([T; N]) = T
type instance Element(String) = char
type instance Element(HashMap<K, V>) = V

# 使用类型族的函数
micro first<C>(container: C) -> Option<Element(C)>
where
    C: IntoIterator<Item = Element(C)>
{
    container.into_iter().next()
}

# 关联类型族
trait Collection {
    type Element
    type Iterator: Iterator<Item = Self::Element>
    
    iter(&self) -> Self::Iterator
    len(&self) -> usize
}

# 实现关联类型族
impl<T> Collection for Vector<T> {
    type Element = T
    type Iterator = std::vec::IntoIter<T>
    
    iter(&self) -> Self::Iterator {
        self.clone().into_iter()
    }
    
    len(&self) -> usize {
        self.len()
    }
}
```

### 类型级计算

```valkyrie
# 类型级自然数
type Zero
type Succ<N>

# 类型级加法
type family Add(a: *, b: *) -> *
type instance Add(Zero, N) = N
type instance Add(Succ<M>, N) = Succ<Add(M, N)>

# 类型级列表
type Nil
type Cons<H, T>

# 类型级列表长度
type family Length(list: *) -> *
type instance Length(Nil) = Zero
type instance Length(Cons<H, T>) = Succ<Length(T)>

# 长度索引的向量
class Vector<T, N> {
    data: [T],
    _phantom: PhantomData<N>,
}

impl<T, N> Vector<T, N> {
    # 类型安全的连接
    append<M>(self, other: Vector<T, M>) -> Vector<T, Add(N, M)> {
        let mut result = self.data
        result.extend(other.data)
        Vec {
            data: result,
            _phantom: PhantomData,
        }
    }
    
    # 类型安全的头部
    head(self) -> Option<T> where N: NonZero {
        self.data.first().cloned()
    }
}

# 非零类型约束
trait NonZero {}
impl<N> NonZero for Succ<N> {}
```

## 实际应用

### 状态机类型

```valkyrie
# 状态机状态
class Closed
class Open
class Locked

# 状态机
class Door<S> {
    _state: PhantomData<S>,
}

# 状态转换
imply Door<Closed> {
    new() -> Self {
        Door { _state: PhantomData }
    }
    
    open(self) -> Door<Open> {
        println("Door opened")
        Door { _state: PhantomData }
    }
}

imply Door<Open> {
    close(self) -> Door<Closed> {
        println("Door closed")
        Door { _state: PhantomData }
    }
    
    lock(self) -> Door<Locked> {
        println("Door locked")
        Door { _state: PhantomData }
    }
}

imply Door<Locked> {
    unlock(self) -> Door<Closed> {
        println("Door unlocked")
        Door { _state: PhantomData }
    }
}

# 使用状态机
micro door_example() {
    let door = Door::new()      # Door<Closed>
    let door = door.open()      # Door<Open>
    let door = door.lock()      # Door<Locked>
    let door = door.unlock()    # Door<Closed>
    
    # 编译错误：不能从 Closed 状态直接锁定
    # let door = door.lock()
}
```

### 类型安全的 SQL 查询

```valkyrie
# 查询构建器状态
class NoTable
class HasTable<T>
class NoWhere
class HasWhere

# 查询构建器
class QueryBuilder<Table, Where> {
    query: String,
    _phantom: PhantomData<(Table, Where)>,
}

# 查询构建方法
imply QueryBuilder<NoTable, NoWhere> {
    new() -> Self {
        QueryBuilder {
            query: "SELECT",
            _phantom: PhantomData,
        }
    }
}

impl<W> QueryBuilder<NoTable, W> {
    from<T>(mut self, table: String) -> QueryBuilder<HasTable<T>, W> {
        self.query.push_str(&format!(" FROM {}", table))
        QueryBuilder {
            query: self.query,
            _phantom: PhantomData,
        }
    }
}

impl<T> QueryBuilder<HasTable<T>, NoWhere> {
    where_clause(mut self, condition: String) -> QueryBuilder<HasTable<T>, HasWhere> {
        self.query.push_str(&format!(" WHERE {}", condition))
        QueryBuilder {
            query: self.query,
            _phantom: PhantomData,
        }
    }
}

impl<T> QueryBuilder<HasTable<T>, HasWhere> {
    build(self) -> String {
        self.query
    }
}

# 使用类型安全的查询构建器
micro query_example() {
    let query = QueryBuilder::new()
        .from::<User>("users")
        .where_clause("age > 18")
        .build()
    
    # 编译错误：没有指定表
    # let invalid = QueryBuilder::new().where_clause("age > 18")
}
```

## 性能考虑

### 零成本抽象

```valkyrie
# 高阶类型在编译时完全消除
↯inline
micro map_option<A, B>(opt: Option<A>, f: micro(A) -> B) -> Option<B> {
    opt.map(f)  # 编译后等价于 match 语句
}

# 单态化确保没有运行时开销
↯specialize
micro generic_computation<M, A>(m: M<A>) -> M<i32>
where M: Monad
{
    m.bind({ $_ => M::pure(42) })
}

# 编译器为每个具体类型生成专门的版本
# generic_computation::<Option, String>
# generic_computation::<Result<_, Error>, i32>
```

### 编译时优化

```valkyrie
# 编译时展开单子链
@const_eval
micro compile_time_monad() -> Option<i32> {
    Some(1)
        .bind({ $x => Some($x + 1) })
    .bind({ $x => Some($x * 2) })
    .bind({ $x => Some($x - 1) })
    # 编译时计算结果：Some(3)
}

# 类型级计算在编译时完成
type Result = Add(Succ<Succ<Zero>>, Succ<Zero>)  # = Succ<Succ<Succ<Zero>>>
```

## 总结

高阶类型为 Valkyrie 提供了强大的抽象能力：

1. **类型构造器抽象**: 对容器类型进行统一抽象
2. **单子模式**: 优雅处理计算上下文
3. **应用函子**: 并行计算和验证
4. **自由单子**: 构建领域特定语言
5. **类型级编程**: 编译时计算和验证
6. **零成本抽象**: 高级抽象不影响性能

这些特性使得 Valkyrie 能够表达复杂的类型关系和计算模式，同时保持类型安全和性能。