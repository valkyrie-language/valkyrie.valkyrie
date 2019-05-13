import fs from "fs";
import path from "path";
import {initLexer, tokenize} from './lexer.js';
import {parse} from './parser.js';
import {generate} from './codegen.js';

// Valkyrie Runtime Support
let ValkyrieRuntime = {
    print: console.log,
    assert: (condition, message) => {
        if (!condition) throw new Error(message || "Assertion failed");
    }
};

let Compiler = {source: "", tokens: [], ast: {}, output: ""};

function initCompiler(source) {
    let compiler = {};
    compiler.source = source;
    compiler.tokens = [];
    compiler.ast = {};
    compiler.output = "";
    return compiler;
}

function compile(compiler) {
    try {
        let lexer = initLexer(compiler.source);
        compiler.tokens = tokenize(lexer);
        if ((compiler.tokens.length === 0)) {
            compiler.output = "Error: Lexical analysis failed";
            return compiler;
        } else {
            compiler.ast = parse(compiler.tokens);
            if (!compiler.ast || (compiler.ast.type === "")) {
                compiler.output = "Error: Syntax analysis failed";
                return compiler;
            } else {
                compiler.output = generate(compiler.ast);
                return compiler;
            }
        }
    } catch (error) {
        compiler.output = `Error: ${error.message}`;
        return compiler;
    }
}

let CompilerError = {type: "CompilerError", message: "", line: 0, column: 0};

function createError(message, line, column) {
    let error = {};
    error.message = message;
    error.line = line;
    error.column = column;
    return error;
}

function reportError(error) {
    let errorMessage = ((((("Error at line " + error.line) + ", column ") + error.column) + ": ") + error.message);
    return errorMessage;
}

let CompilerOptions = {outputFormat: "javascript", optimize: false, debug: false};

function createCompilerOptions(outputFormat, optimize, debug) {
    let options = {};
    options.outputFormat = outputFormat;
    options.optimize = optimize;
    options.debug = debug;
    return options;
}

function compileWithOptions(compiler, options) {
    let lexer = initLexer(compiler.source);
    compiler.tokens = tokenize(lexer);
    if ((compiler.tokens.length === 0)) {
        let error = createCompilerError("Lexical analysis failed", 1, 1);
        compiler.output = reportError(error);
        return compiler;
    } else {
        compiler.ast = parse(compiler.tokens);
        if ((compiler.ast.type === "")) {
            let error = createCompilerError("Syntax analysis failed", 1, 1);
            compiler.output = reportError(error);
            return compiler;
        } else {
            if ((options.outputFormat === "javascript")) {
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

let CompilerStats = {tokensCount: 0, astNodesCount: 0, outputSize: 0, compileTime: 0};

function createCompilerStats() {
    let stats = {};
    stats.tokensCount = 0;
    stats.astNodesCount = 0;
    stats.outputSize = 0;
    stats.compileTime = 0;
    return stats;
}

function countASTNodes(node) {
    if ((node.type === "")) {
        return 0;
    } else {
        if ((node.type === "Program")) {
            let count = 1;
            let i = 0;
            while ((i < node.statements.length)) {
                count = (count + countASTNodes(node.statements[i]));
                i = (i + 1);
            }
            return count;
        } else {
            if ((node.type === "BlockStatement")) {
                let count = 1;
                let i = 0;
                while ((i < node.statements.length)) {
                    count = (count + countASTNodes(node.statements[i]));
                    i = (i + 1);
                }
                return count;
            } else {
                if ((node.type === "IfStatement")) {
                    let count = 1;
                    count = (count + countASTNodes(node.condition));
                    count = (count + countASTNodes(node.thenBranch));
                    if ((node.elseBranch.type !== "")) {
                        count = (count + countASTNodes(node.elseBranch));
                    }
                    return count;
                } else {
                    if ((node.type === "BinaryExpression")) {
                        let count = 1;
                        count = (count + countASTNodes(node.left));
                        count = (count + countASTNodes(node.right));
                        return count;
                    } else {
                        if ((node.type === "UnaryExpression")) {
                            let count = 1;
                            count = (count + countASTNodes(node.operand));
                            return count;
                        } else {
                            if ((node.type === "CallExpression")) {
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
                    }
                }
            }
        }
    }
}

function compileWithStats(compiler, options) {
    let stats = createCompilerStats();
    let startTime = 0;
    compileWithOptions(compiler, options);
    stats.tokensCount = compiler.tokens.length;
    stats.astNodesCount = countASTNodes(compiler.ast);
    stats.outputSize = compiler.output.length;
    stats.compileTime = 1;
    if (options.debug) {
        let statsInfo = "\n// Compilation Statistics:\n";
        statsInfo = (((statsInfo + "// Tokens: ") + stats.tokensCount) + "\n");
        statsInfo = (((statsInfo + "// AST Nodes: ") + stats.astNodesCount) + "\n");
        statsInfo = (((statsInfo + "// Output Size: ") + stats.outputSize) + " characters\n");
        statsInfo = (((statsInfo + "// Compile Time: ") + stats.compileTime) + " ms\n");
        compiler.output = (compiler.output + statsInfo);
    }
    return compiler;
}

function compileSource(source) {
    let compiler = initCompiler(source);
    compile(compiler);
    return compiler.output;
}

function compileSourceWithOptions(source, outputFormat, optimize, debug) {
    let compiler = initCompiler(source);
    let options = createCompilerOptions(outputFormat, optimize, debug);
    compileWithStats(compiler, options);
    return compiler.output;
}

function validateSyntax(source) {
    let compiler = initCompiler(source);
    let lexer = initLexer(compiler.source);
    compiler.tokens = tokenize(lexer);
    if ((compiler.tokens.length === 0)) {
        return false;
    } else {
        compiler.ast = parse(compiler.tokens);
        return (compiler.ast.type !== "");
    }
}


// ValkyrieCompiler �?
class ValkyrieCompiler {
    // 静态方法：比较两个目录的内容
    static compareDirectories(dir1, dir2) {
        try {
            if (!fs.existsSync(dir1)) {
                return {equal: false, reason: `Directory does not exist: ${dir1}`, fileCount: 0};
            }
            if (!fs.existsSync(dir2)) {
                return {equal: false, reason: `Directory does not exist: ${dir2}`, fileCount: 0};
            }

            const files1 = fs.readdirSync(dir1).filter(file => file.endsWith('.js')).sort();
            const files2 = fs.readdirSync(dir2).filter(file => file.endsWith('.js')).sort();

            if (files1.length !== files2.length) {
                return {
                    equal: false,
                    reason: `Different number of files: ${files1.length} vs ${files2.length}`,
                    fileCount: Math.max(files1.length, files2.length)
                };
            }

            for (let i = 0; i < files1.length; i++) {
                const file = files1[i];
                if (files2[i] !== file) {
                    return {
                        equal: false,
                        reason: `Different files: ${file} vs ${files2[i]}`,
                        fileCount: files1.length,
                        file: file
                    };
                }

                const content1 = fs.readFileSync(path.join(dir1, file), 'utf8');
                const content2 = fs.readFileSync(path.join(dir2, file), 'utf8');

                if (content1 !== content2) {
                    return {
                        equal: false,
                        reason: `File contents differ: ${file}`,
                        fileCount: files1.length,
                        file: file
                    };
                }
            }

            return {equal: true, fileCount: files1.length};
        } catch (error) {
            return {
                equal: false,
                reason: `Error comparing directories: ${error.message}`,
                fileCount: 0
            };
        }
    }

    compile(source, options = {}) {
        let compiler = initCompiler(source);
        let result = compile(compiler);

        // 检查编译是否成�?
        if (result.output.startsWith("Error:")) {
            return {
                success: false,
                error: result.output,
                code: null,
                ast: result.ast,
                tokens: result.tokens
            };
        }

        return {
            success: true,
            code: result.output,
            ast: result.ast,
            tokens: result.tokens
        };
    }

    compileFile(filePath, options = {}) {
        let source = fs.readFileSync(filePath, "utf8");
        return this.compile(source, options);
    }

    compileDirectory(dirPath, outputDir) {
        console.log(`[DEBUG] compileDirectory called with dirPath: ${dirPath}, outputDir: ${outputDir}`);
        let results = [];
        let successCount = 0;
        let errorCount = 0;

        if (!fs.existsSync(dirPath)) {
            let error = `Input directory does not exist: ${dirPath}`;
            console.log(`[DEBUG] Directory check failed: ${error}`);
            return {
                success: false,
                error: error,
                results: [],
                successCount: 0,
                errorCount: 1,
                totalFiles: 0
            };
        }

        // 确保输出目录存在
        if (!fs.existsSync(outputDir)) {
            console.log(`[DEBUG] Creating output directory: ${outputDir}`);
            fs.mkdirSync(outputDir, {recursive: true});
        }

        let files = fs.readdirSync(dirPath);
        console.log(`[DEBUG] Found files in directory: ${files.join(', ')}`);
        let valkyrieFiles = files.filter(file => file.endsWith(".valkyrie"));
        console.log(`[DEBUG] Valkyrie files to compile: ${valkyrieFiles.join(', ')}`);

        for (const file of valkyrieFiles) {
            let inputPath = path.join(dirPath, file);
            let outputPath = path.join(outputDir, file.replace('.valkyrie', '.js'));
            console.log(`[DEBUG] Compiling ${inputPath} -> ${outputPath}`);

            try {
                let compileResult = this.compileFile(inputPath);
                console.log(`[DEBUG] Compile result for ${file}:`, compileResult.success);

                if (compileResult && compileResult.success) {
                    // 写入编译结果到输出文件
                    fs.writeFileSync(outputPath, compileResult.code, 'utf8');
                    successCount++;
                    results.push({
                        inputPath,
                        outputPath,
                        result: {success: true, code: compileResult.code}
                    });
                    console.log(`[DEBUG] Successfully compiled ${file}`);
                } else {
                    errorCount++;
                    let errorMsg = compileResult ? (compileResult.error || 'Compilation failed') : 'compileFile returned undefined';
                    results.push({
                        inputPath,
                        outputPath,
                        result: {success: false, error: errorMsg}
                    });
                    console.log(`[DEBUG] Failed to compile ${file}: ${errorMsg}`);
                }
            } catch (error) {
                errorCount++;
                console.log(`[DEBUG] Exception while compiling ${file}:`, error);
                results.push({
                    inputPath,
                    outputPath,
                    result: {success: false, error: error.message}
                });
            }
        }

        let finalResult = {
            success: errorCount === 0,
            results,
            successCount,
            errorCount,
            totalFiles: valkyrieFiles.length
        };

        console.log(`[DEBUG] Final compileDirectory result:`, finalResult);
        return finalResult;
    }
}

// 导出编译器实例
let compiler = new ValkyrieCompiler();
export {ValkyrieCompiler, compiler, initCompiler, compile};