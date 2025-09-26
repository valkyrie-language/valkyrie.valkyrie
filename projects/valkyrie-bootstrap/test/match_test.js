export function test_test_basic_match() {
    let x = 5;
    (function () {
        let __match_value = x;
        if (x > 0) {
            let result = "positive";
        }
        if (x < 0) {
            let result = "negative";
        }
        {
            let result = "zero";
        }
    })();
}
export function test_test_match_branches() {
    let value = "hello";
    (function () {
        let __match_value = value;
        // TODO: Type branch not implemented yet
        // TODO: Case branch not implemented yet
        if (value.length > 0) {
            let msg = "Non-empty";
        }
        {
            let msg = "Default case";
        }
    })();
}
export function test_test_nested_match() {
    let a = 10;
    let b = 20;
    (function () {
        let __match_value = a;
        if (a > 5) {
            (function () {
                let __match_value = b;
                if (b > 15) {
                    let result = "both conditions met";
                }
                {
                    let result = "only first condition met";
                }
            })();
        }
        {
            let result = "first condition not met";
        }
    })();
}
