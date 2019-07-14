let lexer = await import("./lexer.js");
let parser = await import("./parser.js");
let codegen = await import("./codegen.js");
export function compiler_compile(source) {
    let tokens = lexer.tokenize(source);
    let ast = parser.parse(tokens);
    let output = codegen.generate(ast);
    return output;
}
export function compiler_createCompiler() {
    let compiler = {};
    compiler.compile = compile;
    return compiler;
}
