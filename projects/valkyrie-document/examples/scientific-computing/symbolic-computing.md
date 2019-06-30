# 符号计算 (Symbolic Computing)

Valkyrie 提供了强大的符号计算能力，支持代数表达式操作、微积分、方程求解和符号矩阵运算等高级数学功能。

## 符号表达式基础

### 创建符号变量

```valkyrie
using symbolic::*

# 创建符号变量
let x = Symbol("x")
let y = Symbol("y")
let z = Symbol("z")

# 创建符号表达式
let expr1 = 3*x + 2*y - 5
let expr2 = x^2 + 2*x + 1
let expr3 = (x + y)*(x - y)
```

### 表达式操作

```valkyrie
# 表达式展开
let expanded = expand(expr3)  # x^2 - y^2

# 表达式因式分解
let factored = factor(expr2)  # (x + 1)^2

# 表达式简化
let simplified = simplify(2*x + 3*x - x)  # 4*x

# 表达式替换
let substituted = expr1.subs(x, 5)  # 3*5 + 2*y - 5 = 10 + 2*y
```

## 代数运算

### 多项式操作

```valkyrie
# 多项式加法
let poly1 = x^3 + 2*x^2 + 3*x + 4
let poly2 = 2*x^3 - x^2 + x - 1
let poly_sum = poly1 + poly2  # 3*x^3 + x^2 + 4*x + 3

# 多项式乘法
let poly_product = poly1 * poly2

# 多项式除法
let (quotient, remainder) = div(poly1, poly2)

# 最大公约式
let gcd_poly = gcd(poly1, poly2)

# 最小公倍式
let lcm_poly = lcm(poly1, poly2)
```

### 有理表达式

```valkyrie
# 创建有理表达式
let rational = (x^2 + 1)/(x + 1)

# 有理表达式简化
let simplified_rational = simplify(rational)

# 通分
let common_denom = together(1/x + 1/y)  # (x + y)/(x*y)

# 部分分式分解
let partial_fractions = apart(rational)
```

## 微积分

### 微分

```valkyrie
# 单变量微分
let f = x^3 + 2*x^2 + 3*x + 4
let df_dx = diff(f, x)  # 3*x^2 + 4*x + 3

# 高阶导数
let d2f_dx2 = diff(f, x, 2)  # 6*x + 4
let d3f_dx3 = diff(f, x, 3)  # 6

# 多变量微分
let g = x^2*y + x*y^2 + z^3
let dg_dx = diff(g, x)  # 2*x*y + y^2
let dg_dy = diff(g, y)  # x^2 + 2*x*y
let dg_dz = diff(g, z)  # 3*z^2

# 全微分
let total_diff = diff(g)  # (2*x*y + y^2)*dx + (x^2 + 2*x*y)*dy + 3*z^2*dz
```

### 积分

```valkyrie
# 不定积分
let integral1 = integrate(2*x, x)  # x^2
let integral2 = integrate(x^2, x)  # x^3/3
let integral3 = integrate(exp(x), x)  # exp(x)

# 定积分
let definite_integral = integrate(x^2, x, 0, 1)  # 1/3

# 多重积分
let double_integral = integrate(integrate(x*y, x), y)

# 特殊函数积分
let sin_integral = integrate(sin(x), x)  # -cos(x)
let cos_integral = integrate(cos(x), x)  # sin(x)
```

### 极限

```valkyrie
# 计算极限
let limit1 = limit(sin(x)/x, x, 0)  # 1
let limit2 = limit((1 + 1/x)^x, x, ∞)  # e
let limit3 = limit(1/x, x, 0, "+")  # +∞
let limit4 = limit(1/x, x, 0, "-")  # -∞

# 左右极限
let left_limit = limit(abs(x)/x, x, 0, "-")  # -1
let right_limit = limit(abs(x)/x, x, 0, "+")  # 1
```

## 级数展开

### 泰勒级数

```valkyrie
# 泰勒展开
let taylor_sin = series(sin(x), x, 0, 5)  # x - x^3/6 + x^5/120
let taylor_exp = series(exp(x), x, 0, 4)  # 1 + x + x^2/2 + x^3/6

# 在指定点展开
let taylor_at_point = series(ln(x), x, 1, 3)  # (x-1) - (x-1)^2/2 + (x-1)^3/3

# 级数系数
let coeffs = series_coefficients(cos(x), x, 0, 6)
# [1, 0, -1/2, 0, 1/24, 0, -1/720]
```

### 傅里叶级数

```valkyrie
# 傅里叶级数展开
let fourier_square = fourier_series(square_wave(x), x, -π, π, 5)

# 傅里叶系数
let (a0, an, bn) = fourier_coefficients(f(x), x, -π, π)
```

## 方程求解

### 代数方程

```valkyrie
# 线性方程
let linear_eq = 2*x + 3 = 5
let linear_solution = solve(linear_eq, x)  # [1]

# 二次方程
let quadratic_eq = x^2 + 5*x + 6 = 0
let quadratic_solutions = solve(quadratic_eq, x)  # [-2, -3]

# 高次方程
let cubic_eq = x^3 - 6*x^2 + 11*x - 6 = 0
let cubic_solutions = solve(cubic_eq, x)  # [1, 2, 3]

# 方程组
let eq1 = x + y = 5
let eq2 = x - y = 1
let system_solutions = solve([eq1, eq2], [x, y])  # [(3, 2)]
```

### 微分方程

```valkyrie
# 一阶微分方程
let ode1 = diff(y(x), x) + y(x) = 0
let ode1_solution = dsolve(ode1, y(x))  # y(x) = C1*exp(-x)

# 二阶微分方程
let ode2 = diff(y(x), x, 2) + y(x) = 0
let ode2_solution = dsolve(ode2, y(x))  # y(x) = C1*cos(x) + C2*sin(x)

# 初始值问题
let ivp = [diff(y(x), x) = y(x), y(0) = 1]
let ivp_solution = dsolve(ivp, y(x))  # y(x) = exp(x)

# 偏微分方程
let pde = diff(u(x, t), t) = diff(u(x, t), x, 2)
let pde_solution = pdsolve(pde, u(x, t))
```

## 线性代数

### 符号矩阵

```valkyrie
# 创建符号矩阵
let matrix_a = Matrix([
    [1, x],
    [y, z]
])

let matrix_b = Matrix([
    [x^2, 0],
    [0, y^2]
])

# 矩阵运算
let matrix_sum = matrix_a + matrix_b
let matrix_product = matrix_a * matrix_b
let matrix_det = det(matrix_a)  # z - x*y

# 矩阵求逆
let matrix_inv = inv(matrix_a)

# 特征值和特征向量
let (eigenvals, eigenvecs) = eigen(matrix_a)
```

### 矩阵分解

```valkyrie
# LU分解
let (l, u) = lu_decomposition(matrix_a)

# QR分解
let (q, r) = qr_decomposition(matrix_a)

# 奇异值分解
let (u, s, v) = svd(matrix_a)

# 对角化
let (p, d) = diagonalize(matrix_a)
```

## 复变函数

```valkyrie
# 复数符号
let z = Symbol("z", complex=true)
let w = Symbol("w", complex=true)

# 复函数
let complex_func = exp(z) + sin(z)

# 复微分
let complex_derivative = diff(complex_func, z)

# 留数计算
let residue_at_pole = residue(1/z, z, 0)

# 共轭函数
let conjugate_expr = conjugate(z + w)
```

## 高级功能

### 假设系统

```valkyrie
# 创建带假设的符号变量
let x_positive = Symbol("x", positive=true)
let x_real = Symbol("x", real=true)
let x_integer = Symbol("x", integer=true)
let x_prime = Symbol("x", prime=true)

# 条件表达式
let conditional = piecewise(x > 0, x, x <= 0, -x, 0)

# 逻辑表达式
let logical_expr = and(x > 0, y > 0, z > 0)
let or_expr = or(x > 0, y > 0)
```

### 自定义函数

```valkyrie
# 定义自定义函数
let custom_func = Function("f")
let g = custom_func(x) + custom_func(y)

# 函数性质
let func_properties = {
    "even": custom_func(-x) = custom_func(x),
    "odd": custom_func(-x) = -custom_func(x),
    "periodic": custom_func(x + 2*π) = custom_func(x)
}
```

### 表达式树操作

```valkygree
# 遍历表达式树
let expr = x^2 + 2*x + 1
let tree = expr_tree(expr)

# 替换子表达式
let modified = replace_subexpr(expr, x^2, y)

# 收集同类项
let collected = collect(x*y + x*z + y*z, x)

# 展开嵌套表达式
let expanded_nested = expand_nested((x + (y + z))^2)
```

## 性能优化

```valkyrie
# 表达式缓存
let cached_expr = cache_expression(x^100 + y^100)

# 简化策略
let optimized = optimize_expression(complex_expr)

# 数值评估
let numerical_value = evalf(sin(π/3))  # 0.866025403784439

# 精度控制
let high_precision = evalf(π, 50)  # 50位精度
```

## 实际应用示例

### 物理方程推导

```valkyrie
# 简谐运动
let position = a * cos(ω*t + φ)
let velocity = diff(position, t)
let acceleration = diff(velocity, t)

# 验证运动方程
let equation = acceleration + ω^2 * position
# 结果应为0，验证简谐运动方程
```

### 电路分析

```valkyrie
# RLC电路阻抗
let z_r = r
let z_l = i*ω*l
let z_c = 1/(i*ω*c)
let z_total = z_r + z_l + z_c

# 谐振频率
let resonance_condition = imag(z_total) = 0
let resonance_freq = solve(resonance_condition, ω)
```

符号计算为科学计算提供了精确的数学工具，避免了数值计算中的舍入误差，是理论分析和公式推导的重要工具。