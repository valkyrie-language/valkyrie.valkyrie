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

// --- New Compiler Logic using compiler.valkyrie functions ---

export async function compileSourceWithCompiler(source, compilerParts) {
    const { compiler } = compilerParts;
    try {
        // Use the existing compiler function
        if (typeof compiler.package_compiler_compileSourceText === "function") {
            const result = compiler.package_compiler_compileSourceText(source);
            if (result.startsWith("Error:")) {
                return {
                    success: false,
                    error: result,
                };
            }
            return { success: true, code: result };
        } else {
            throw new Error(
                "compileSourceText function not found in compiler module"
            );
        }
    } catch (err) {
        return {
            success: false,
            error: `Exception during compilation: ${err.message}\n${err.stack}`,
        };
    }
}

export async function compileFileWithCompiler(
    inputPath,
    outputPath,
    compilerParts
) {
    try {
        log(`Compiling file: ${path.relative(__dirname, inputPath)}`);
        const source = fs.readFileSync(inputPath, "utf8");
        const result = await compileSourceWithCompiler(source, compilerParts);

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

// --- Single File Compilation Functions ---

export function readLibraryFiles(libraryDir) {
    const files = fs
        .readdirSync(libraryDir)
        .filter((f) => f.endsWith(".valkyrie"));
    const fileContents = {};

    for (const file of files) {
        const filePath = path.join(libraryDir, file);
        const content = fs.readFileSync(filePath, "utf8");
        fileContents[file] = content;
    }

    return fileContents;
}

export async function generateSingleFileWithCompiler(
    libraryDir,
    outputPath,
    compilerParts
) {
    try {
        log(
            `Generating single file from library: ${path.relative(__dirname, libraryDir)} -> ${path.relative(__dirname, outputPath)}`
        );

        const fileContents = readLibraryFiles(libraryDir);
        const { compiler } = compilerParts;

        // Use generateSingleJS function from the compiler
        if (typeof compiler.package_compiler_generateSingleJS === "function") {
            const result =
                compiler.package_compiler_generateSingleJS(fileContents);

            ensureDir(path.dirname(outputPath));
            fs.writeFileSync(outputPath, result, "utf8");

            const stats = fs.statSync(outputPath);
            log(`Single file generated successfully (${stats.size} bytes)`);
            return true;
        } else {
            throw new Error(
                "package_compiler_generateSingleJS function not found in compiler module"
            );
        }
    } catch (err) {
        error(`Failed to generate single file: ${err.message}`);
        return false;
    }
}

// --- Directory Compilation using Compiler.js ---

export async function compileDirectory(inputDir, outputDir, compilerParts) {
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
        if (
            !(await compileFileWithCompiler(
                inputPath,
                outputPath,
                compilerParts
            ))
        ) {
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
    log("Loading bootstrap compiler from compiled index.js...");
    const bootstrapCompiler = await import(
        pathToFileURL(path.join(PATHS.bootstrap, "index.js")).href
    );
    log("Bootstrap compiler loaded.");

    return {
        compiler: bootstrapCompiler,
    };
}

async function loadNextGenerationCompiler() {
    log("Loading stage-0 compiler from single-file index.js...");
    const stage0Compiler = await import(
        pathToFileURL(path.join(PATHS.stage0, "index.js")).href
    );
    log("Stage-0 compiler loaded.");

    return {
        compiler: stage0Compiler,
    };
}

async function bootstrap() {
    log("Starting Valkyrie language bootstrap process...");

    try {
        // Load the initial compiler from the bootstrap directory
        const bootstrapCompilerParts = await loadThisGenerationCompiler();

        // Step 1: Clean output directories
        log("Step 1: Cleaning output directories");
        cleanDir(PATHS.dist);
        ensureDir(PATHS.dist);
        ensureDir(PATHS.stage0);
        ensureDir(PATHS.stage1);

        // Step 2: Use bootstrap compiler to generate stage-0 single file
        log("Step 2: Generating stage-0 single file with bootstrap compiler");
        const stage0OutputPath = path.join(PATHS.stage0, "index.js");
        if (
            !(await generateSingleFileWithCompiler(
                PATHS.library,
                stage0OutputPath,
                bootstrapCompilerParts
            ))
        ) {
            throw new Error("Stage-0 compilation failed");
        }

        // Step 3: Use stage-0 compiler to generate stage-1 single file
        log("Step 3: Generating stage-1 single file with stage-0 compiler");
        const stage0CompilerParts = await loadNextGenerationCompiler();
        const stage1OutputPath = path.join(PATHS.stage1, "index.js");
        if (
            !(await generateSingleFileWithCompiler(
                PATHS.library,
                stage1OutputPath,
                stage0CompilerParts
            ))
        ) {
            throw new Error("Stage-1 compilation failed");
        }

        // Step 4: Compare stage-0 and stage-1 single files
        log("Step 4: Comparing stage-0 and stage-1 outputs");
        const stage0Content = fs.readFileSync(stage0OutputPath, "utf8");
        const stage1Content = fs.readFileSync(stage1OutputPath, "utf8");

        if (stage0Content !== stage1Content) {
            const diffPath = path.join(PATHS.dist, "bootstrap_diff.txt");
            const diffContent = generateDetailedDiff(
                stage0Content,
                stage1Content,
                "index.js"
            );
            fs.writeFileSync(diffPath, diffContent, "utf8");

            log(`Stage-0 size: ${stage0Content.length} bytes`);
            log(`Stage-1 size: ${stage1Content.length} bytes`);
            log(`Diff saved to: ${path.relative(__dirname, diffPath)}`);

            throw new Error(
                "Bootstrap verification failed: stage-0 and stage-1 differ"
            );
        }

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

        // Copy the new single file to bootstrap directory
        const newBootstrapPath = path.join(PATHS.bootstrap, "index.js");
        fs.copyFileSync(stage1OutputPath, newBootstrapPath);

        log("🎉 Bootstrap completed successfully!");
        log("The Valkyrie compiler has successfully bootstrapped itself.");
        log(
            `New bootstrap compiler: ${path.relative(__dirname, newBootstrapPath)}`
        );

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

            if (
                await compileFileWithCompiler(
                    inputPath,
                    outputPath,
                    compilerParts
                )
            ) {
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
        if (
            await compileFileWithCompiler(inputPath, outputPath, compilerParts)
        ) {
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
