function greet(name) {
    return "Hello, " + name + "!";
}

function add(a, b) {
    return a + b;
}

function multiply(a, b) {
    return a * b;
}

function factorial(n) {
    if(n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}

function fibonacci(n) {
    if(n <= 1) {
        return n;
    }
    return fibonacci(n - 1) + fibonacci(n - 2);
}

function is_prime(n) {
    if(n <= 1) {
        return false;
    }
    if(n <= 3) {
        return true;
    }
    if(n % 2 == 0 || n % 3 == 0) {
        return false;
    }
    let i = 5;
    while(i * i <= n) {
        if(n % i == 0 || n % (i + 2) == 0) {
            return false;
        }
        i = i + 6;
    }
    return true;
}

// 导出模块
module.exports = {
    greet: greet,
    add: add,
    multiply: multiply,
    factorial: factorial,
    fibonacci: fibonacci,
    is_prime: is_prime
};