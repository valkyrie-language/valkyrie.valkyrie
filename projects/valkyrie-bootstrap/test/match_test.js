export function test_test_basic_match() {
    let x = 5;
    if (x > 0) {
        let result = "positive";
    } else if (x < 0) {
        let result = "negative";
    } else {
        let result = "zero";
    }
}
export function test_test_match_branches() {
    let value = "hello";
    // TODO: Type branch not implemented yet
    // TODO: Case branch not implemented yet
    if (value.length > 0) {
        let msg = "Non-empty";
    } else {
        let msg = "Default case";
    }
}
export function test_test_nested_match() {
    let a = 10;
    let b = 20;
    if (a > 5) {
        if (b > 15) {
            let result = "both conditions met";
        } else {
            let result = "only first condition met";
        }
    } else {
        let result = "first condition not met";
    }
}
