let result = runComplexDependencyTest();
export function runComplexDependencyTest() {
    let app = Application();
    app.initialize();
    return app.run();
}
export function isEven(number) {
    return number % 2 == 0;
}
export function isOdd(number) {
    return number % 2 == 1;
}
export function max(a, b) {
    if (a > b) {
        return a;
    }
    return b;
}
export function min(a, b) {
    if (a < b) {
        return a;
    }
    return b;
}
export function concat(str1, str2) {
    return str1 + str2;
}
export function repeat(str, times) {
    let result = "";
    let i = 0;
    while (i < times) {
        result = concat(result, str);
        i = i + 1;
    }
    return result;
}
export function formatMessage(prefix, message, suffix) {
    let temp = concat(prefix, message);
    return concat(temp, suffix);
}
export function createBanner(text, char) {
    let border = repeat(char, text.length + 4);
    let middle = concat(char + " ", concat(text, " " + char));
    let result = concat(border, "\\n");
    result = concat(result, middle);
    result = concat(result, "\\n");
    result = concat(result, border);
    return result;
}
class Application {
    constructor() {
        this.arrayService = ArrayService();
        this.name = "Complex Dependency Test App";
    }

    initialize() {
        this.arrayService.add(1);
        this.arrayService.add(2);
        this.arrayService.add(3);
        this.arrayService.add(4);
        this.arrayService.add(5);
        this.arrayService.add(6);
        this.arrayService.add(7);
        this.arrayService.add(8);
        this.arrayService.add(9);
        this.arrayService.add(10);
    }

    run() {
        let banner = createBanner(this.name, "*");
        console.log(banner);
        let evens = this.arrayService.getEvenNumbers();
        let odds = this.arrayService.getOddNumbers();
        let maxVal = this.arrayService.getMaxValue();
        let evenMsg = formatMessage("Even numbers: [", evens.join(", "), "]");
        let oddMsg = formatMessage("Odd numbers: [", odds.join(", "), "]");
        let maxMsg = formatMessage("Maximum value: ", maxVal, "");
        console.log(evenMsg);
        console.log(oddMsg);
        console.log(maxMsg);
        return concat(concat(evenMsg, " | "), concat(oddMsg, " | " + maxMsg));
    }
}
class ArrayService {
    constructor() {
        this.data = [];
    }

    add(item) {
        this.data.push(item);
    }

    getEvenNumbers() {
        let evens = [];
        let i = 0;
        while (i < this.data.length) {
            if (isEven(this.data[i])) {
                evens.push(this.data[i]);
            }
            i = i + 1;
        }
        return evens;
    }

    getOddNumbers() {
        let odds = [];
        let i = 0;
        while (i < this.data.length) {
            if (isOdd(this.data[i])) {
                odds.push(this.data[i]);
            }
            i = i + 1;
        }
        return odds;
    }

    getMaxValue() {
        if (this.data.length == 0) {
            return 0;
        }
        let maxVal = this.data[0];
        let i = 1;
        while (i < this.data.length) {
            maxVal = max(maxVal, this.data[i]);
            i = i + 1;
        }
        return maxVal;
    }
}
console.log("Complex dependency test completed: " + result);
