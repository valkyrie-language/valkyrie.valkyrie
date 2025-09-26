// 导入库文件
const example = require('./library/example.js');

// using legion::example;
function main() {
    console.log("=== Legion Binary Example ===");
    console.log("");
    
    console.log("Testing greet function:");
    console.log(example.greet("World"));
    console.log(example.greet("Valkyrie"));
    console.log("");
    
    console.log("Testing math functions:");
    console.log("5 + 3 = " + example.add(5, 3));
    console.log("4 * 7 = " + example.multiply(4, 7));
    console.log("");
    
    console.log("Testing factorial:");
    console.log("5! = " + example.factorial(5));
    console.log("7! = " + example.factorial(7));
    console.log("");
    
    console.log("Testing fibonacci:");
    console.log("fib(10) = " + example.fibonacci(10));
    console.log("fib(15) = " + example.fibonacci(15));
    console.log("");
    
    console.log("Testing prime numbers:");
    console.log("Is 17 prime? " + example.is_prime(17));
    console.log("Is 25 prime? " + example.is_prime(25));
    console.log("Is 29 prime? " + example.is_prime(29));
    console.log("");
    
    console.log("=== Example completed ===");
}

// 直接执行主函数
main();