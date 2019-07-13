function C() {
    this.field = 42;
}
C.prototype.a = function () {
    return 0;
};
C.prototype.b = function (self) {
    return 1;
};

let c = new C();
console.log(c.a());
console.log(c.b());
