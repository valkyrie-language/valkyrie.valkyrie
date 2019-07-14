export function demo__showcase_demonstrateNamespace() {
    console.log("Namespace demo starting...");
    let calc = new SimpleCalculator();
    let result = calc.calculate(10, 5);
    console.log("Calculation result: " + result);
    return result;
}
class demo__showcase_SimpleCalculator {
    calculate(a, b) {
        return a + b;
    }

    getVersion() {
        return "1.0.0";
    }
}
let result = demonstrateNamespace();
console.log("Final result: " + result);
