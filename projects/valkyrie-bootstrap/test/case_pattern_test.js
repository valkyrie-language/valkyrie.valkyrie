export function test_test_string_pattern() {
    let value = "hello";
    if (value === "hello") {
        let result = "matched hello";
    } else if (value === "world") {
        let result = "matched world";
    } else {
        let result = "no match";
    }
}
export function test_test_number_pattern() {
    let value = 42;
    if (value === 42) {
        let result = "matched 42";
    } else if (value === 100) {
        let result = "matched 100";
    } else {
        let result = "no match";
    }
}
export function test_test_boolean_pattern() {
    let value = true;
    if (value === true) {
        let result = "matched true";
    } else if (value === false) {
        let result = "matched false";
    } else {
        let result = "no match";
    }
}
export function test_test_mixed_patterns() {
    let value = "test";
    if (value === "test") {
        let result = "string match";
    } else if (value === 123) {
        let result = "number match";
    } else if (value === true) {
        let result = "boolean match";
    } else {
        let result = "no match";
    }
}
export function test_test_no_else_branch() {
    let value = "unknown";
    if (value === "known") {
        console.log("found known");
    } else if (value === "other") {
        console.log("found other");
    }
}
