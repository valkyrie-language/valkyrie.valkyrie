let calc = new Calculator();
class Calculator {
    constructor() {
        self.field = 0;
    }

    static add(n) {
        setValue(this.field + n);
        return this;
    }

    static setValue(v) {
        this.field = v;
    }

    static getValue() {
        return this.field;
    }

    static multiply(n) {
        let result = helper(this.field * n);
        this.field = result;
        return this;
    }

    static helper(v) {
        return v;
    }
}
calc.add(5).multiply(2);
