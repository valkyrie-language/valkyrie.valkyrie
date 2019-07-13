#!/usr/bin/env node

// Valkyrie 语言自举编译器主程序
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 项目路径配置
const PATHS = {
    root: __dirname,
    library: path.join(__dirname, "library"),
    bootstrap: path.join(__dirname, "bootstrap"),
    dist: path.join(__dirname, "dist"),
    stage0: path.join(__dirname, "dist", "stage-0"),
    stage1: path.join(__dirname, "dist", "stage-1"),
    tests: path.join(__dirname, "test"),
};

// 日志函数
export function log(message) {
    console.log(`[Valkyrie Bootstrap] ${message}`);
}

export function error(message) {
    console.error(`[Valkyrie Bootstrap] ERROR: ${message}`);
}

// 确保目录存在
export function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        log(`Created directory: ${dirPath}`);
    }
}

// 清理目录
export function cleanDir(dirPath) {
    if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
        log(`Cleaned directory: ${dirPath}`);
    }
}

// 复制目录
export function copyDir(src, dest) {
    ensureDir(dest);
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// --- Compiler Logic ---

export function compileSource(source, compilerParts) {
    const { lexer, parser, codegen } = compilerParts;
    try {
        let tokens;

        if (typeof lexer.initLexer === "function") {
            // API for handwritten bootstrap/lexer.js
            const lexerInstance = lexer.initLexer(source);
            tokens = lexer.tokenize(lexerInstance);
        } else {
            throw new Error("initLexer function not found in lexer module");
        }

        if (tokens.length === 0) {
            // Handle empty files gracefully
            if (source.trim() === "") return { success: true, code: "" };
            return {
                success: false,
                error: "Lexical analysis failed: No tokens produced.",
            };
        }

        let ast;
        if (typeof parser.parse === "function") {
            ast = parser.parse(tokens);
        } else {
            throw new Error("parse function not found in parser module");
        }

        // 检查解析是否产生了错误
        if (!ast || !ast.type) {
            // Handle empty files gracefully
            if (source.trim() === "") return { success: true, code: "" };
            return {
                success: false,
                error: "Syntax analysis failed: Invalid AST produced.",
            };
        }

        // 检查 AST 是否包含解析错误
        const parseError = findFirstParseError(ast);
        if (parseError) {
            const { message, line, column } = parseError;
            return {
                success: false,
                error: `Parse error: ${message} at line ${line}, column ${column}`,
            };
        }

        let code;
        if (typeof codegen.generate === "function") {
            code = codegen.generate(ast);
        } else {
            throw new Error("generate function not found in codegen module");
        }

        return { success: true, code };
    } catch (err) {
        return {
            success: false,
            error: `Exception during compilation: ${err.message}\n${err.stack}`,
        };
    }
}

export function compileFile(inputPath, outputPath, compilerParts) {
    try {
        log(`Compiling file: ${path.relative(__dirname, inputPath)}`);
        const source = fs.readFileSync(inputPath, "utf8");
        const result = compileSource(source, compilerParts);

        if (!result.success) {
            error(
                `Failed to compile ${path.relative(__dirname, inputPath)}: ${result.error}`
            );
            return false;
        }

        fs.writeFileSync(outputPath, result.code, "utf8");
        return true;
    } catch (err) {
        error(
            `Exception while compiling file ${path.relative(__dirname, inputPath)}: ${err.message}`
        );
        return false;
    }
}

export function compileDirectory(inputDir, outputDir, compilerParts) {
    log(
        `Compiling directory: ${path.relative(__dirname, inputDir)} -> ${path.relative(__dirname, outputDir)}`
    );
    ensureDir(outputDir);

    const files = fs
        .readdirSync(inputDir)
        .filter((f) => f.endsWith(".valkyrie"));
    for (const file of files) {
        const inputPath = path.join(inputDir, file);
        const outputPath = path.join(
            outputDir,
            file.replace(".valkyrie", ".js")
        );
        if (!compileFile(inputPath, outputPath, compilerParts)) {
            error(
                `Failed to compile directory ${path.relative(__dirname, inputDir)}. Compilation stopped at ${file}.`
            );
            return false;
        }
    }

    log(
        `Compilation completed: ${files.length}/${files.length} files successful`
    );
    return true;
}

export function compileDirectoryIntegrated(
    inputDir,
    outputPath,
    compilerParts
) {
    log(
        `Compiling directory with namespace integration: ${path.relative(__dirname, inputDir)} -> ${path.relative(__dirname, outputPath)}`
    );

    const files = fs
        .readdirSync(inputDir)
        .filter((f) => f.endsWith(".valkyrie") || f.endsWith(".vk"));
    if (files.length === 0) {
        error(
            `No .valkyrie or .vk files found in ${path.relative(__dirname, inputDir)}`
        );
        return false;
    }

    try {
        const { lexer, parser, codegen } = compilerParts;

        // 第一阶段：解析所有文件，收集 namespace 信息
        const namespaces = {};
        const allStatements = [];
        const definitionStatements = [];
        const executionStatements = [];

        for (const file of files) {
            const filePath = path.join(inputDir, file);
            const source = fs.readFileSync(filePath, "utf8");

            if (source.trim() === "") continue;

            // 编译单个文件
            const result = compileSource(source, compilerParts);
            if (!result.success) {
                error(`Failed to compile ${file}: ${result.error}`);
                return false;
            }

            // 解析 AST 来提取 namespace 信息
            const lexerInstance = lexer.initLexer(source);
            const tokens = lexer.tokenize(lexerInstance);
            const ast = parser.parse(tokens);

            let currentNamespace = "";

            for (const stmt of ast.statements) {
                if (stmt.type === "NamespaceStatement") {
                    currentNamespace = stmt.path.join("::");
                } else if (stmt.type === "UsingStatement") {
                    // 记录 using 导入
                    continue;
                } else if (
                    stmt.type === "MicroFunctionDeclaration" ||
                    stmt.type === "ClassDeclaration" ||
                    stmt.type === "LetStatement"
                ) {
                    // 定义语句
                    definitionStatements.push(stmt);

                    // 记录到 namespace
                    if (!namespaces[currentNamespace]) {
                        namespaces[currentNamespace] = {};
                    }
                    namespaces[currentNamespace][stmt.name] = {
                        type: stmt.type,
                        statement: stmt,
                    };
                } else {
                    // 执行语句
                    executionStatements.push(stmt);
                }
            }
        }

        // 第二阶段：生成整合的代码
        const allOrderedStatements = [
            ...definitionStatements,
            ...executionStatements,
        ];
        const integratedAst = {
            type: "Program",
            statements: allOrderedStatements,
        };

        const integratedCode = codegen.generate(integratedAst);

        // 写入整合后的输出
        ensureDir(path.dirname(outputPath));
        fs.writeFileSync(outputPath, integratedCode, "utf8");
        log(
            `✅ Integrated compilation successful: ${files.length} files -> ${path.relative(__dirname, outputPath)}`
        );
        return true;
    } catch (err) {
        error(`Exception during integrated compilation: ${err.message}`);
        return false;
    }
}

// --- Comparison Logic ---

export function generateDetailedDiff(content1, content2, filename) {
    const lines1 = content1.split("\n");
    const lines2 = content2.split("\n");
    const maxLines = Math.max(lines1.length, lines2.length);

    let diffReport = [];
    diffReport.push(`\n📋 详细差异报告: ${filename}`);
    diffReport.push(`${"=".repeat(60)}`);
    diffReport.push(
        `Stage-0 行数: ${lines1.length}, Stage-1 行数: ${lines2.length}`
    );
    diffReport.push("");

    let differenceCount = 0;
    let contextLines = 2; // 显示差异前后的上下文行数

    for (let i = 0; i < maxLines; i++) {
        const line1 = lines1[i] || "";
        const line2 = lines2[i] || "";

        if (line1 !== line2) {
            differenceCount++;

            // 显示上下文
            const startContext = Math.max(0, i - contextLines);
            const endContext = Math.min(maxLines - 1, i + contextLines);

            if (differenceCount === 1 || i > 0) {
                diffReport.push(`📍 差异 #${differenceCount} 在行 ${i + 1}:`);
                diffReport.push(`${"-".repeat(40)}`);

                // 显示上下文
                for (let ctx = startContext; ctx <= endContext; ctx++) {
                    const ctxLine1 = lines1[ctx] || "";
                    const ctxLine2 = lines2[ctx] || "";

                    if (ctx === i) {
                        // 当前差异行
                        diffReport.push(
                            `❌ ${(ctx + 1).toString().padStart(4)}: Stage-0 | ${ctxLine1}`
                        );
                        diffReport.push(
                            `✅ ${(ctx + 1).toString().padStart(4)}: Stage-1 | ${ctxLine2}`
                        );

                        // 字符级别的差异分析
                        if (ctxLine1 && ctxLine2) {
                            const charDiff = findCharacterDifferences(
                                ctxLine1,
                                ctxLine2
                            );
                            if (charDiff.length > 0) {
                                diffReport.push(`   🔍 字符差异: ${charDiff}`);
                            }
                        }
                    } else if (ctxLine1 === ctxLine2) {
                        // 相同的上下文行
                        diffReport.push(
                            `   ${(ctx + 1).toString().padStart(4)}: ${ctxLine1}`
                        );
                    }
                }
                diffReport.push("");
            }
        }
    }

    if (differenceCount === 0) {
        diffReport.push("✅ 文件内容完全相同");
    } else {
        diffReport.push(`📊 总计发现 ${differenceCount} 处差异`);
    }

    return diffReport.join("\n");
}

export function findCharacterDifferences(str1, str2) {
    const maxLen = Math.max(str1.length, str2.length);
    let differences = [];

    for (let i = 0; i < maxLen; i++) {
        const char1 = str1[i] || "";
        const char2 = str2[i] || "";

        if (char1 !== char2) {
            differences.push(`位置${i + 1}: '${char1}' → '${char2}'`);
        }
    }

    return (
        differences.slice(0, 5).join(", ") +
        (differences.length > 5 ? "..." : "")
    );
}

export function compareDirectories(dir1, dir2) {
    log(
        `Comparing directories: ${path.relative(__dirname, dir1)} vs ${path.relative(__dirname, dir2)}`
    );

    if (!fs.existsSync(dir1) || !fs.existsSync(dir2)) {
        error(`❌ Directories differ: One or both directories do not exist`);
        return false;
    }

    const files1 = fs
        .readdirSync(dir1)
        .filter((f) => f.endsWith(".js"))
        .sort();
    const files2 = fs
        .readdirSync(dir2)
        .filter((f) => f.endsWith(".js"))
        .sort();

    if (files1.length !== files2.length) {
        error(
            `❌ Directories differ: Different number of files (${files1.length} vs ${files2.length})`
        );
        return false;
    }

    let hasAnyDifferences = false;

    for (let i = 0; i < files1.length; i++) {
        if (files1[i] !== files2[i]) {
            error(
                `❌ Directories differ: Different file names (${files1[i]} vs ${files2[i]})`
            );
            return false;
        }

        const content1 = fs
            .readFileSync(path.join(dir1, files1[i]), "utf8")
            .trim();
        const content2 = fs
            .readFileSync(path.join(dir2, files2[i]), "utf8")
            .trim();

        if (content1 !== content2) {
            hasAnyDifferences = true;
            error(`❌ Directories differ: File contents differ: ${files1[i]}`);

            // 生成详细的差异报告
            const detailedDiff = generateDetailedDiff(
                content1,
                content2,
                files1[i]
            );
            // console.log(detailedDiff);

            // 保存差异文件和报告
            const diffDir = path.join(PATHS.dist, "diff");
            ensureDir(diffDir);
            fs.writeFileSync(
                path.join(diffDir, `${files1[i]}.stage0`),
                content1
            );
            fs.writeFileSync(
                path.join(diffDir, `${files1[i]}.stage1`),
                content2
            );
            fs.writeFileSync(
                path.join(diffDir, `${files1[i]}.diff.txt`),
                detailedDiff
            );

            error(`  📁 差异文件保存到: ${path.relative(__dirname, diffDir)}`);
            error(`  📄 详细报告: ${files1[i]}.diff.txt`);
        }
    }

    if (hasAnyDifferences) {
        return false;
    }

    log(`✅ Directories are identical (${files1.length} files)`);
    return true;
}

// --- Bootstrap Process ---
async function loadThisGenerationCompiler() {
    log("Loading bootstrap compiler components...");
    const bootstrapLexer = await import(
        pathToFileURL(path.join(PATHS.bootstrap, "lexer.js")).href
    );
    const bootstrapParser = await import(
        pathToFileURL(path.join(PATHS.bootstrap, "parser.js")).href
    );
    const bootstrapCodegen = await import(
        pathToFileURL(path.join(PATHS.bootstrap, "codegen.js")).href
    );
    const bootstrapCompiler = await import(
        pathToFileURL(path.join(PATHS.bootstrap, "compiler.js")).href
    );
    log("Bootstrap compiler components loaded.");

    return {
        lexer: bootstrapLexer,
        parser: bootstrapParser,
        codegen: bootstrapCodegen,
        compiler: bootstrapCompiler,
    };
}

async function loadNextGenerationCompiler() {
    log("Loading stage-0 compiler components...");
    const stage0Lexer = await import(
        pathToFileURL(path.join(PATHS.stage0, "lexer.js")).href
    );
    const stage0Parser = await import(
        pathToFileURL(path.join(PATHS.stage0, "parser.js")).href
    );
    const stage0Codegen = await import(
        pathToFileURL(path.join(PATHS.stage0, "codegen.js")).href
    );
    const stage0Compiler = await import(
        pathToFileURL(path.join(PATHS.stage0, "compiler.js")).href
    );
    log("Stage-0 compiler components loaded.");

    return {
        lexer: stage0Lexer,
        parser: stage0Parser,
        codegen: stage0Codegen,
        compiler: stage0Compiler,
    };
}

async function loadIntegratedCompiler(compilerPath) {
    log(
        `Loading integrated compiler from: ${path.relative(__dirname, compilerPath)}`
    );
    const integratedCompiler = await import(pathToFileURL(compilerPath).href);
    log("Integrated compiler loaded.");

    return {
        lexer: integratedCompiler,
        parser: integratedCompiler,
        codegen: integratedCompiler,
        compiler: integratedCompiler,
    };
}

async function bootstrap() {
    log("Starting Valkyrie language bootstrap process...");

    try {
        // Load the initial compiler parts from the bootstrap directory
        const bootstrapCompilerParts = await loadThisGenerationCompiler();

        // Step 1: Clean output directories
        log("Step 1: Cleaning output directories");
        cleanDir(PATHS.dist);
        ensureDir(PATHS.dist);

        // TODO: remove step2, No longer generate separate js files
        // Step 2: Use bootstrap compiler to compile library to stage-0
        log("Step 2: Compiling library with bootstrap compiler to stage-0");
        if (
            !compileDirectory(
                PATHS.library,
                PATHS.stage0,
                bootstrapCompilerParts
            )
        ) {
            throw new Error("Stage-0 compilation failed");
        }
        // Step 2.1: Directly generate a single integrated js file

        // Step 2.5: Generate integrated stage-0 compiler
        log("Step 2.5: Generating integrated stage-0 compiler");
        const stage0OutputPath = path.join(PATHS.stage0, "integrated-compiler.js");
        if (
            !compileDirectoryIntegrated(
                PATHS.library,
                stage0OutputPath,
                bootstrapCompilerParts
            )
        ) {
            throw new Error("Stage-0 integrated compilation failed");
        }

        // Step 3: Use stage-0 compiler to compile library to stage-1
        log("Step 3: Compiling library with stage-0 compiler to stage-1");
        const stage0CompilerParts = await loadNextGenerationCompiler();

        if (
            !compileDirectory(PATHS.library, PATHS.stage1, stage0CompilerParts)
        ) {
            throw new Error("Stage-1 compilation failed");
        }

        // Step 3.5: Generate integrated stage-1 compiler
        log("Step 3.5: Generating integrated stage-1 compiler");
        const stage1OutputPath = path.join(PATHS.stage1, "integrated-compiler.js");
        if (
            !compileDirectoryIntegrated(PATHS.library, stage1OutputPath, stage0CompilerParts)
        ) {
            throw new Error("Stage-1 integrated compilation failed");
        }

        // Step 4: Compare stage-0 and stage-1
        log("Step 4: Comparing stage-0 and stage-1 outputs");
        if (!compareDirectories(PATHS.stage0, PATHS.stage1)) {
            throw new Error(
                "Bootstrap verification failed: stage-0 and stage-1 differ"
            );
        }

        // Step 4.5: Compare integrated compilers
        log("Step 4.5: Comparing integrated compilers");
        const stage0IntegratedContent = fs.readFileSync(stage0OutputPath, "utf8").trim();
        const stage1IntegratedContent = fs.readFileSync(stage1OutputPath, "utf8").trim();

        if (stage0IntegratedContent !== stage1IntegratedContent) {
            error("❌ Integrated compilers differ");

            // 生成详细的差异报告
            const detailedDiff = generateDetailedDiff(stage0IntegratedContent, stage1IntegratedContent, "integrated-compiler.js");
            const diffDir = path.join(PATHS.dist, "diff");
            ensureDir(diffDir);
            fs.writeFileSync(path.join(diffDir, "integrated-compiler.js.stage0"), stage0IntegratedContent);
            fs.writeFileSync(path.join(diffDir, "integrated-compiler.js.stage1"), stage1IntegratedContent);
            fs.writeFileSync(path.join(diffDir, "integrated-compiler.js.diff.txt"), detailedDiff);

            throw new Error("Bootstrap verification failed: integrated compilers differ");
        }

        log("✅ Integrated compilers are identical");

        // Step 5: Bootstrap successful, update bootstrap directory
        log("Step 5: Bootstrap successful! Updating bootstrap directory");

        const backupPath = path.join(
            __dirname,
            "bootstrap.backup." + Date.now()
        );
        log(
            `Backing up current bootstrap to: ${path.relative(__dirname, backupPath)}`
        );
        copyDir(PATHS.bootstrap, backupPath);

        cleanDir(PATHS.bootstrap);
        copyDir(PATHS.stage1, PATHS.bootstrap);

        log("🎉 Bootstrap completed successfully!");
        log("The Valkyrie compiler has successfully bootstrapped itself.");

        return true;
    } catch (err) {
        error(`Bootstrap failed: ${err.message}`);
        console.error(err.stack);
        return false;
    }
}

export function findFirstParseError(node) {
    if (!node || typeof node !== "object") {
        return null;
    }

    if (node.type === "ParseError") {
        return node;
    }

    for (const key in node) {
        if (Object.prototype.hasOwnProperty.call(node, key)) {
            const child = node[key];
            if (Array.isArray(child)) {
                for (const item of child) {
                    const error = findFirstParseError(item);
                    if (error) return error;
                }
            } else if (child && typeof child === "object") {
                const error = findFirstParseError(child);
                if (error) return error;
            }
        }
    }

    return null;
}

export function findParseErrors(node) {
    if (!node || typeof node !== "object") {
        return;
    }

    if (node.type === "Identifier" && node.name === "__PARSE_ERROR__") {
        console.error(
            `[Valkyrie Debug] Parse Error Found at ${node.line}:${node.column}`
        );
    }

    for (const key in node) {
        if (Object.prototype.hasOwnProperty.call(node, key)) {
            const child = node[key];
            if (Array.isArray(child)) {
                child.forEach(findParseErrors);
            } else if (child && typeof child === "object") {
                findParseErrors(child);
            }
        }
    }
}

// --- Command-Line Interface ---

export function showHelp() {
    console.log(`
Valkyrie Language Bootstrap Compiler

Usage:
  node bootstrap.js [command] [options]

Commands:
  bootstrap, boot    Run the complete bootstrap process.
  compile <file.vk>   Compile a single .vk file to JavaScript (output in same directory).
  test                Compile all .vk files in test directory.
  test-namespace      Test namespace integration functionality.
  compile-test        Alias for 'test' command (backward compatibility).
  help, -h, --help   Show this help message.

Options:
  --stage-0          Test stage-0 compiler instead of current bootstrap version.

Examples:
  node bootstrap.js bootstrap
  node bootstrap.js bootstrap --stage-0
  node bootstrap.js compile projects/valkyrie-bootstrap/test/class.vk
  node bootstrap.js compile projects/valkyrie-bootstrap/test/class.vk --stage-0
  node bootstrap.js test
  node bootstrap.js test --stage-0
  node bootstrap.js test-namespace
`);
}

async function compileTest() {
    log("Compiling parser.valkyrie for testing...");
    try {
        const bootstrapCompilerParts = await loadThisGenerationCompiler();
        const inputPath = path.join(PATHS.library, "parser.valkyrie");
        const outputPath = path.join(PATHS.dist, "parser.test.js");

        if (compileFile(inputPath, outputPath, bootstrapCompilerParts)) {
            log(
                `✅ Test compilation successful: ${path.relative(__dirname, outputPath)}`
            );
            return true;
        } else {
            error("❌ Test compilation failed");
            return false;
        }
    } catch (err) {
        error(`Test compilation failed: ${err.message}`);
        console.error(err.stack);
        return false;
    }
}

async function compileTestDirectory(useStage0 = false) {
    log("Compiling all test files...");
    try {
        // 确保测试输出目录存在
        ensureDir(PATHS.dist);

        // 获取编译器组件
        let compilerParts;
        if (useStage0) {
            log("Using stage-0 compiler for tests...");
            compilerParts = await loadNextGenerationCompiler();
        } else {
            compilerParts = await loadThisGenerationCompiler();
        }

        // 检查测试目录是否存在
        if (!fs.existsSync(PATHS.tests)) {
            error(`Test directory not found: ${PATHS.tests}`);
            return false;
        }

        // 获取所有 .vk 文件
        const testFiles = fs
            .readdirSync(PATHS.tests)
            .filter((f) => f.endsWith(".vk") || f.endsWith(".valkyrie"));

        if (testFiles.length === 0) {
            log("No test files found in test directory");
            return true;
        }

        log(`Found ${testFiles.length} test files to compile`);

        let successCount = 0;

        // 编译每个测试文件
        for (const testFile of testFiles) {
            const inputPath = path.join(PATHS.tests, testFile);
            const outputPath = path.join(
                PATHS.dist,
                testFile.replace(/\.vk$/, ".js").replace(/\.valkyrie$/, ".js")
            );

            log(`Compiling test file: ${testFile}`);

            if (compileFile(inputPath, outputPath, compilerParts)) {
                log(`✅ Test file compiled successfully: ${testFile}`);
                successCount++;
            } else {
                error(`❌ Failed to compile test file: ${testFile}`);
            }
        }

        log(
            `Test compilation completed: ${successCount}/${testFiles.length} files successful`
        );
        return successCount === testFiles.length;
    } catch (err) {
        error(`Test compilation failed: ${err.message}`);
        console.error(err.stack);
        return false;
    }
}

async function compileSingleFile(inputPath, useStage0 = false) {
    try {
        // 检查输入文件是否存在
        if (!fs.existsSync(inputPath)) {
            error(`Input file not found: ${inputPath}`);
            return false;
        }

        // 检查文件扩展名是否为 .vk
        if (inputPath.endsWith(".vk") || inputPath.endsWith(".valkyrie")) {
        } else {
            error(`Input file must have .vk extension: ${inputPath}`);
            return false;
        }

        // 生成输出文件路径（与源文件同目录，扩展名改为 .js）
        const outputPath = inputPath.replace(/\.vk$/, ".js");

        log(
            `Compiling single file: ${path.relative(process.cwd(), inputPath)}`
        );

        // 加载编译器组件
        let compilerParts;
        if (useStage0) {
            log("Using stage-0 compiler...");
            compilerParts = await loadNextGenerationCompiler();
        } else {
            compilerParts = await loadThisGenerationCompiler();
        }

        // 编译文件
        if (compileFile(inputPath, outputPath, compilerParts)) {
            log(
                `✅ Compilation successful: ${path.relative(process.cwd(), outputPath)}`
            );
            return true;
        } else {
            error(
                `❌ Compilation failed for: ${path.relative(process.cwd(), inputPath)}`
            );
            return false;
        }
    } catch (err) {
        error(`Exception during single file compilation: ${err.message}`);
        console.error(err.stack);
        return false;
    }
}

async function testNamespaceIntegration(useStage0 = false) {
    try {
        log("Testing namespace integration...");

        const testDir = path.join(PATHS.tests, "namespace_integration_test");
        if (!fs.existsSync(testDir)) {
            error(
                `Namespace integration test directory does not exist: ${testDir}`
            );
            return false;
        }

        const compilerParts = useStage0
            ? await loadNextGenerationCompiler()
            : await loadThisGenerationCompiler();

        // Test integrated compilation
        const outputPath = path.join(testDir, "integrated_output.js");
        const success = compileDirectoryIntegrated(
            testDir,
            outputPath,
            compilerParts
        );

        if (success) {
            log(
                `Successfully compiled namespace integration test to ${outputPath}`
            );

            // Try to run the generated JavaScript
            try {
                const { execSync } = await import("child_process");
                const result = execSync(`node "${outputPath}"`, {
                    encoding: "utf8",
                    cwd: testDir,
                });
                log("Namespace integration test output:");
                console.log(result);
            } catch (runError) {
                error(`Error running integrated output: ${runError.message}`);
                return false;
            }
        } else {
            error("Failed to compile namespace integration test");
        }

        return success;
    } catch (err) {
        error(`Error testing namespace integration: ${err.message}`);
        return false;
    }
}

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    // Parse options
    const options = {
        stage0: args.includes("--stage-0"),
    };

    switch (command) {
        case "bootstrap":
        case "boot":
            const success = await bootstrap(options);
            process.exit(success ? 0 : 1);
            break;
        case "compile":
            if (args.length < 2) {
                error("Please provide an input file path for compile command");
                console.log(
                    "\nUsage: node bootstrap.js compile <input-file.vk> [--stage-0]"
                );
                process.exit(1);
            }
            const inputPath = path.resolve(args[1]);
            const compileSuccess = await compileSingleFile(
                inputPath,
                options.stage0
            );
            process.exit(compileSuccess ? 0 : 1);
            break;
        case "test":
            const testSuccess = await compileTestDirectory(options.stage0);
            process.exit(testSuccess ? 0 : 1);
            break;
        case "compile-test":
            // 向后兼容
            const oldTestSuccess = await compileTestDirectory(options.stage0);
            process.exit(oldTestSuccess ? 0 : 1);
            break;
        case "test-namespace":
            const namespaceTestSuccess = await testNamespaceIntegration(
                options.stage0
            );
            process.exit(namespaceTestSuccess ? 0 : 1);
            break;
        case "help":
        case "-h":
        case "--help":
        case undefined:
            showHelp();
            break;

        default:
            error(`Unknown command: ${command}`);
            showHelp();
            process.exit(1);
    }
}

main().catch((err) => {
    error(`An unexpected error occurred: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
});
