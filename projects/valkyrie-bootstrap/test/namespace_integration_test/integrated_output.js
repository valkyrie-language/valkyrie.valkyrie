export function runApp() {
    let result = add(10, 20);
    let helper = new MathHelper();
    let result2 = helper.compute(5, 15);
    console.log("Result 1: " + result);
    console.log("Result 2: " + result2);
    return result + result2;
}
export function add(a, b) {
    return a + b;
}
export function subtract(a, b) {
    return a - b;
}
class MathHelper {
    compute(x, y) {
        return add(x, y);
    }
}
runApp();
