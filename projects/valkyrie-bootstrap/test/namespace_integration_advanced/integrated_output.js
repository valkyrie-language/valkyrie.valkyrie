export function process(value1, value2) {
    let sum = add(value1, value2);
    return sum * 2;
}
export function transform(data) {
    return data + 100;
}
export function runAdvancedTest() {
    let result1 = add(10, 20);
    let calc = new Calculator();
    let result2 = calc.compute(5, 15);
    let result3 = process(result1, result2);
    console.log("Advanced test results:");
    console.log("Result 1: " + result1);
    console.log("Result 2: " + result2);
    console.log("Result 3: " + result3);
    return result3;
}
export function add(a, b) {
    return a + b;
}
export function subtract(a, b) {
    return a - b;
}
class Calculator {
    compute(x, y) {
        return add(x, y);
    }

    computeAdvanced(x, y, z) {
        return add(add(x, y), z);
    }
}
runAdvancedTest();
