class C {
    constructor() {
        self.field = 42;
    }

    a() {
        return 0;
    }

    b() {
        return 1;
    }
}
let c = new C();
console.log(c.a());
console.log(c.b());
