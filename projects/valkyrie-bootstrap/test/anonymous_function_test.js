let add = function (a, b) {
    return a + b;
};
export function forEach(arr, callback) {
    let i = 0;
    while (i < arr.length) {
        callback(arr[i]);
        i = i + 1;
    }
}
export function doSomething(callback) {
    callback();
}
export function main() {
    let numbers = [];
    let result = add(10, 20);
    forEach(numbers, function () {
        let doubled = numbers[0] * 2;
    });
    doSomething(function () {
        let message = "Hello from closure!";
    });
}
