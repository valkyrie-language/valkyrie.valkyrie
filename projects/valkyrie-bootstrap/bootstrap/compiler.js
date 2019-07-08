export function initCompiler(source) {
    let compiler = {};
    compiler.source = source;
    compiler.tokens = [];
    compiler.ast = {};
    compiler.output = "";
    return compiler;
}

export function compile(compiler) {
    let lexer = initLexer(compiler.source);
    compiler.tokens = tokenize(lexer);
    if ((compiler.tokens.length == 0)) {
        compiler.output = "Error: Lexical analysis failed";
        return compiler;
    } else {
        compiler.ast = parse(compiler.tokens);
        if ((compiler.ast.type == "")) {
            compiler.output = "Error: Syntax analysis failed";
            return compiler;
        } else {
            compiler.output = generate(compiler.ast);
            return compiler;
        }
    }
}

export function createError(message, line, column) {
    let error = {};
    error.message = message;
    error.line = line;
    error.column = column;
    return error;
}

export function reportError(error) {
    let errorMessage = ((((("Error at line " + error.line) + ", column ") + error.column) + ": ") + error.message);
    return errorMessage;
}

export function createCompilerOptions(outputFormat, optimize, debug) {
    let options = {};
    options.outputFormat = "javascript";
    options.optimize = optimize;
    options.debug = debug;
    return options;
}

export function compileWithOptions(compiler, options) {
    let lexer = initLexer(compiler.source);
    compiler.tokens = tokenize(lexer);
    if ((compiler.tokens.length == 0)) {
        let error = createCompilerError("Lexical analysis failed", 1, 1);
        compiler.output = reportError(error);
        return compiler;
    } else {
        compiler.ast = parse(compiler.tokens);
        if ((compiler.ast.type == "")) {
            let error = createCompilerError("Syntax analysis failed", 1, 1);
            compiler.output = reportError(error);
            return compiler;
        } else {
            if ((options.outputFormat == "javascript")) {
                compiler.output = generate(compiler.ast);
            } else {
                let error = createCompilerError(("Unsupported output format: " + options.outputFormat), 1, 1);
                compiler.output = reportError(error);
            }
            if (options.debug) {
                compiler.output = ("// Debug mode enabled\n" + compiler.output);
            }
            return compiler;
        }
    }
}

export function createStats() {
    let stats = {};
    stats.tokensCount = 0;
    stats.astNodesCount = 0;
    stats.outputSize = 0;
    stats.compileTime = 0;
    return stats;
}

export function countASTNodes(node) {
    if ((node.type == "")) {
        return 0;
    } else if ((node.type == "Program")) {
        let count = 1;
        let i = 0;
        while ((i < node.statements.length)) {
            count = (count + countASTNodes(node.statements[i]));
            i = (i + 1);
        }
        return count;
    } else if ((node.type == "BlockStatement")) {
        let count = 1;
        let i = 0;
        while ((i < node.statements.length)) {
            count = (count + countASTNodes(node.statements[i]));
            i = (i + 1);
        }
        return count;
    } else if ((node.type == "IfStatement")) {
        let count = 1;
        count = (count + countASTNodes(node.condition));
        count = (count + countASTNodes(node.thenBranch));
        if ((node.elseBranch.type != "")) {
            count = (count + countASTNodes(node.elseBranch));
        }
        return count;
    } else if ((node.type == "BinaryExpression")) {
        let count = 1;
        count = (count + countASTNodes(node.left));
        count = (count + countASTNodes(node.right));
        return count;
    } else if ((node.type == "UnaryExpression")) {
        let count = 1;
        count = (count + countASTNodes(node.operand));
        return count;
    } else if ((node.type == "CallExpression")) {
        let count = 1;
        count = (count + countASTNodes(node.callee));
        let i = 0;
        while ((i < node.arguments.length)) {
            count = (count + countASTNodes(node.arguments[i]));
            i = (i + 1);
        }
        return count;
    } else {
        return 1;
    }
}

export function compileWithStats(compiler, options) {
    let stats = createCompilerStats();
    let startTime = 0;
    compileWithOptions(compiler, options);
    stats.tokensCount = compiler.tokens.length;
    stats.astNodesCount = countASTNodes(compiler.ast);
    stats.outputSize = compiler.output.length;
    stats.compileTime = 1;
    if (options.debug) {
        let statsInfo = "\n# Compilation Statistics:\n";
        statsInfo = (((statsInfo + "// Tokens: ") + stats.tokensCount) + "\n");
        statsInfo = (((statsInfo + "// AST Nodes: ") + stats.astNodesCount) + "\n");
        statsInfo = (((statsInfo + "// Output Size: ") + stats.outputSize) + " characters\n");
        statsInfo = (((statsInfo + "// Compile Time: ") + stats.compileTime) + " ms\n");
        compiler.output = (compiler.output + statsInfo);
    }
    return compiler;
}

export function compileSource(source) {
    let compiler = initCompiler(source);
    compile(compiler);
    return compiler.output;
}

export function compileSourceWithOptions(source, outputFormat, optimize, debug) {
    let compiler = initCompiler(source);
    let options = createCompilerOptions(outputFormat, optimize, debug);
    compileWithStats(compiler, options);
    return compiler.output;
}

export function validateSyntax(source) {
    let compiler = initCompiler(source);
    let lexer = initLexer(compiler.source);
    compiler.tokens = tokenize(lexer);
    if ((compiler.tokens.length == 0)) {
        return false;
    } else {
        compiler.ast = parse(compiler.tokens);
        return (compiler.ast.type != "");
    }
}
