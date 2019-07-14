let logLevel = "INFO";
let logCount = 0;
let testResult = runComplexTest();
export function log(message) {
    let timestamp = getCurrentTimestamp();
    let formattedMessage = "[" + timestamp + "] " + logLevel + ": " + message;
    console.log(formattedMessage);
}
export function logError(message) {
    let timestamp = getCurrentTimestamp();
    let formattedMessage = "[" + timestamp + "] ERROR: " + message;
    console.error(formattedMessage);
}
export function logWarning(message) {
    let timestamp = getCurrentTimestamp();
    let formattedMessage = "[" + timestamp + "] WARNING: " + message;
    console.warn(formattedMessage);
}
export function logDebug(message) {
    if (logLevel == "DEBUG") {
        let timestamp = getCurrentTimestamp();
        let formattedMessage = "[" + timestamp + "] DEBUG: " + message;
        console.log(formattedMessage);
    }
}
export function setLogLevel(level) {
    logLevel = level;
    log("Log level set to: " + level);
}
export function getCurrentTimestamp() {
    return "2024-01-01 12:00:00";
}
export function incrementLogCount() {
    logCount = logCount + 1;
}
export function getLogCount() {
    return logCount;
}
export function add(a, b) {
    let result = a + b;
    log("Addition: " + a + " + " + b + " = " + result);
    return result;
}
export function multiply(a, b) {
    let result = a * b;
    log("Multiplication: " + a + " * " + b + " = " + result);
    return result;
}
export function divide(a, b) {
    if (b == 0) {
        log("Error: Division by zero!");
        return 0;
    }
    let result = a / b;
    log("Division: " + a + " / " + b + " = " + result);
    return result;
}
export function subtract(a, b) {
    let result = a - b;
    log("Subtraction: " + a + " - " + b + " = " + result);
    return result;
}
export function power(base, exponent) {
    let result = 1;
    let i = 0;
    while (i < exponent) {
        result = result * base;
        i = i + 1;
    }
    log("Power: " + base + "^" + exponent + " = " + result);
    return result;
}
export function testCalculations() {
    let result1 = add(10, 20);
    let result2 = multiply(5, 6);
    let result3 = divide(100, 4);
    log("Calculation results:");
    log("10 + 20 = " + result1);
    log("5 * 6 = " + result2);
    log("100 / 4 = " + result3);
    return result1 + result2 + result3;
}
export function testDataProcessing() {
    let processor = DataProcessor();
    processor.addData(42);
    processor.addData(84);
    processor.addData(126);
    let average = processor.getAverage();
    log("Average of data: " + average);
    return average;
}
export function runComplexTest() {
    log("Starting enhanced multifile test...");
    let calcResult = testCalculations();
    let dataResult = testDataProcessing();
    let finalResult = calcResult + dataResult;
    log("Final combined result: " + finalResult);
    return finalResult;
}
class DataProcessor {
    constructor() {
        this.data = [];
        this.count = 0;
        log("DataProcessor initialized");
    }

    addData(value) {
        this.data.push(value);
        this.count = this.count + 1;
        log("Added data: " + value + " (total count: " + this.count + ")");
    }

    getCount() {
        return this.count;
    }

    getAllData() {
        return this.data;
    }

    getAverage() {
        if (this.count == 0) {
            logError("Cannot calculate average of empty dataset");
            return 0;
        }
        let sum = 0;
        let i = 0;
        while (i < this.data.length) {
            sum = add(sum, this.data[i]);
            i = i + 1;
        }
        let average = divide(sum, this.count);
        log("Calculated average: " + average);
        return average;
    }

    getMax() {
        if (this.count == 0) {
            logError("Cannot find max of empty dataset");
            return 0;
        }
        let max = this.data[0];
        let i = 1;
        while (i < this.data.length) {
            if (this.data[i] > max) {
                max = this.data[i];
            }
            i = i + 1;
        }
        log("Found maximum value: " + max);
        return max;
    }

    getMin() {
        if (this.count == 0) {
            logError("Cannot find min of empty dataset");
            return 0;
        }
        let min = this.data[0];
        let i = 1;
        while (i < this.data.length) {
            if (this.data[i] < min) {
                min = this.data[i];
            }
            i = i + 1;
        }
        log("Found minimum value: " + min);
        return min;
    }

    clear() {
        this.data = [];
        this.count = 0;
        log("DataProcessor cleared");
    }

    getSummary() {
        if (this.count == 0) {
            return "No data available";
        }
        let avg = this.getAverage();
        let max = this.getMax();
        let min = this.getMin();
        let summary =
            "Data Summary - Count: " +
            this.count +
            ", Average: " +
            avg +
            ", Max: " +
            max +
            ", Min: " +
            min;
        log(summary);
        return summary;
    }
}
console.log("Enhanced multifile test completed with result: " + testResult);
