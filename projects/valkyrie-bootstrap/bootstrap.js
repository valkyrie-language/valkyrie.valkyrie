#!/usr/bin/env node

// Valkyrie 语言自举编译器主程序
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 项目路径配置
const PATHS = {
    root: __dirname,
    library: path.join(__dirname, 'library'),
    bootstrap: path.join(__dirname, 'bootstrap'),
    dist: path.join(__dirname, 'dist'),
    stage0: path.join(__dirname, 'dist', 'stage-0'),
    stage1: path.join(__dirname, 'dist', 'stage-1'),
    tests: path.join(__dirname, 'tests')
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
        
        if (typeof lexer.initLexer === 'function') {
            // API for handwritten bootstrap/lexer.js
            const lexerInstance = lexer.initLexer(source);
            tokens = lexer.tokenize(lexerInstance);
        } else {
            throw new Error('initLexer function not found in lexer module');
        }

        if (tokens.length === 0) {
            // Handle empty files gracefully
            if (source.trim() === '') return { success: true, code: '' };
            return { success: false, error: "Lexical analysis failed: No tokens produced." };
        }
        
        let ast;
        if (typeof parser.parse === 'function') {
            ast = parser.parse(tokens);
        } else {
            throw new Error('parse function not found in parser module');
        }
        
        // 检查解析是否产生了错误
        if (!ast || !ast.type) {
            // Handle empty files gracefully
            if (source.trim() === '') return { success: true, code: '' };
            return { success: false, error: "Syntax analysis failed: Invalid AST produced." };
        }
        
        // 检查 AST 是否包含解析错误
        const parseError = findFirstParseError(ast);
        if (parseError) {
            const { message, line, column } = parseError;
            return { success: false, error: `Parse error: ${message} at line ${line}, column ${column}` };
        }
        
        let code;
        if (typeof codegen.generate === 'function') {
            code = codegen.generate(ast);
        } else {
            throw new Error('generate function not found in codegen module');
        }
        
        return { success: true, code };
    } catch (err) {
        return { success: false, error: `Exception during compilation: ${err.message}\n${err.stack}` };
    }
}

export function compileFile(inputPath, outputPath, compilerParts) {
    try {
        log(`Compiling file: ${path.relative(__dirname, inputPath)}`);
        const source = fs.readFileSync(inputPath, 'utf8');
        const result = compileSource(source, compilerParts);
        
        if (!result.success) {
            error(`Failed to compile ${path.relative(__dirname, inputPath)}: ${result.error}`);
            return false;
        }
        
        fs.writeFileSync(outputPath, result.code, 'utf8');
        return true;
    } catch (err) {
        error(`Exception while compiling file ${path.relative(__dirname, inputPath)}: ${err.message}`);
        return false;
    }
}

export function compileDirectory(inputDir, outputDir, compilerParts) {
    log(`Compiling directory: ${path.relative(__dirname, inputDir)} -> ${path.relative(__dirname, outputDir)}`);
    ensureDir(outputDir);

    const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.valkyrie'));
    for (const file of files) {
        const inputPath = path.join(inputDir, file);
        const outputPath = path.join(outputDir, file.replace('.valkyrie', '.js'));
        if (!compileFile(inputPath, outputPath, compilerParts)) {
            error(`Failed to compile directory ${path.relative(__dirname, inputDir)}. Compilation stopped at ${file}.`);
            return false;
        }
    }

    log(`Compilation completed: ${files.length}/${files.length} files successful`);
    return true;
}

// --- Comparison Logic ---

export function generateDetailedDiff(content1, content2, filename) {
    const lines1 = content1.split('\n');
    const lines2 = content2.split('\n');
    const maxLines = Math.max(lines1.length, lines2.length);
    
    let diffReport = [];
    diffReport.push(`\n📋 详细差异报告: ${filename}`);
    diffReport.push(`${'='.repeat(60)}`);
    diffReport.push(`Stage-0 行数: ${lines1.length}, Stage-1 行数: ${lines2.length}`);
    diffReport.push('');
    
    let differenceCount = 0;
    let contextLines = 2; // 显示差异前后的上下文行数
    
    for (let i = 0; i < maxLines; i++) {
        const line1 = lines1[i] || '';
        const line2 = lines2[i] || '';
        
        if (line1 !== line2) {
            differenceCount++;
            
            // 显示上下文
            const startContext = Math.max(0, i - contextLines);
            const endContext = Math.min(maxLines - 1, i + contextLines);
            
            if (differenceCount === 1 || i > 0) {
                diffReport.push(`📍 差异 #${differenceCount} 在行 ${i + 1}:`);
                diffReport.push(`${'-'.repeat(40)}`);
                
                // 显示上下文
                for (let ctx = startContext; ctx <= endContext; ctx++) {
                    const ctxLine1 = lines1[ctx] || '';
                    const ctxLine2 = lines2[ctx] || '';
                    
                    if (ctx === i) {
                        // 当前差异行
                        diffReport.push(`❌ ${(ctx + 1).toString().padStart(4)}: Stage-0 | ${ctxLine1}`);
                        diffReport.push(`✅ ${(ctx + 1).toString().padStart(4)}: Stage-1 | ${ctxLine2}`);
                        
                        // 字符级别的差异分析
                        if (ctxLine1 && ctxLine2) {
                            const charDiff = findCharacterDifferences(ctxLine1, ctxLine2);
                            if (charDiff.length > 0) {
                                diffReport.push(`   🔍 字符差异: ${charDiff}`);
                            }
                        }
                    } else if (ctxLine1 === ctxLine2) {
                        // 相同的上下文行
                        diffReport.push(`   ${(ctx + 1).toString().padStart(4)}: ${ctxLine1}`);
                    }
                }
                diffReport.push('');
            }
        }
    }
    
    if (differenceCount === 0) {
        diffReport.push('✅ 文件内容完全相同');
    } else {
        diffReport.push(`📊 总计发现 ${differenceCount} 处差异`);
    }
    
    return diffReport.join('\n');
}

export function findCharacterDifferences(str1, str2) {
    const maxLen = Math.max(str1.length, str2.length);
    let differences = [];
    
    for (let i = 0; i < maxLen; i++) {
        const char1 = str1[i] || '';
        const char2 = str2[i] || '';
        
        if (char1 !== char2) {
            differences.push(`位置${i + 1}: '${char1}' → '${char2}'`);
        }
    }
    
    return differences.slice(0, 5).join(', ') + (differences.length > 5 ? '...' : '');
}

export function compareDirectories(dir1, dir2) {
    log(`Comparing directories: ${path.relative(__dirname, dir1)} vs ${path.relative(__dirname, dir2)}`);
    
    if (!fs.existsSync(dir1) || !fs.existsSync(dir2)) {
        error(`❌ Directories differ: One or both directories do not exist`);
        return false;
    }
    
    const files1 = fs.readdirSync(dir1).filter(f => f.endsWith('.js')).sort();
    const files2 = fs.readdirSync(dir2).filter(f => f.endsWith('.js')).sort();
    
    if (files1.length !== files2.length) {
        error(`❌ Directories differ: Different number of files (${files1.length} vs ${files2.length})`);
        return false;
    }
    
    let hasAnyDifferences = false;
    
    for (let i = 0; i < files1.length; i++) {
        if (files1[i] !== files2[i]) {
            error(`❌ Directories differ: Different file names (${files1[i]} vs ${files2[i]})`);
            return false;
        }
        
        const content1 = fs.readFileSync(path.join(dir1, files1[i]), 'utf8').trim();
        const content2 = fs.readFileSync(path.join(dir2, files2[i]), 'utf8').trim();
        
        if (content1 !== content2) {
            hasAnyDifferences = true;
            error(`❌ Directories differ: File contents differ: ${files1[i]}`);
            
            // 生成详细的差异报告
            const detailedDiff = generateDetailedDiff(content1, content2, files1[i]);
            // console.log(detailedDiff);
            
            // 保存差异文件和报告
            const diffDir = path.join(PATHS.dist, 'diff');
            ensureDir(diffDir);
            fs.writeFileSync(path.join(diffDir, `${files1[i]}.stage0`), content1);
            fs.writeFileSync(path.join(diffDir, `${files1[i]}.stage1`), content2);
            fs.writeFileSync(path.join(diffDir, `${files1[i]}.diff.txt`), detailedDiff);
            
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

// --- Bootstrap Process ---

async function loadBootstrapCompiler() {
    log('Loading bootstrap compiler components...');
    const bootstrapLexer = await import(pathToFileURL(path.join(PATHS.bootstrap, 'lexer.js')).href);
    const bootstrapParser = await import(pathToFileURL(path.join(PATHS.bootstrap, 'parser.js')).href);
    const bootstrapCodegen = await import(pathToFileURL(path.join(PATHS.bootstrap, 'codegen.js')).href);
    log('Bootstrap compiler components loaded.');
    
    return { 
        lexer: bootstrapLexer, 
        parser: bootstrapParser, 
        codegen: bootstrapCodegen 
    };
}

async function bootstrap() {
    log("Starting Valkyrie language bootstrap process...");

    try {
        // Load the initial compiler parts from the bootstrap directory
        const bootstrapCompilerParts = await loadBootstrapCompiler();

        // Step 1: Clean output directories
        log("Step 1: Cleaning output directories");
        cleanDir(PATHS.dist);
        ensureDir(PATHS.dist);

        // Step 2: Use bootstrap compiler to compile library to stage-0
        log("Step 2: Compiling library with bootstrap compiler to stage-0");
        if (!compileDirectory(PATHS.library, PATHS.stage0, bootstrapCompilerParts)) {
            throw new Error("Stage-0 compilation failed");
        }

        // Step 3: Use stage-0 compiler to compile library to stage-1
        log("Step 3: Compiling library with stage-0 compiler to stage-1");

        log('Loading stage-0 compiler components...');
        const stage0Lexer = await import(pathToFileURL(path.join(PATHS.stage0, 'lexer.js')).href);
        const stage0Parser = await import(pathToFileURL(path.join(PATHS.stage0, 'parser.js')).href);
        const stage0Codegen = await import(pathToFileURL(path.join(PATHS.stage0, 'codegen.js')).href);
        const stage0CompilerParts = { 
            lexer: stage0Lexer, 
            parser: stage0Parser, 
            codegen: stage0Codegen 
        };
        log('Stage-0 compiler components loaded.');

        if (!compileDirectory(PATHS.library, PATHS.stage1, stage0CompilerParts)) {
            throw new Error("Stage-1 compilation failed");
        }

        // Step 4: Compare stage-0 and stage-1
        log("Step 4: Comparing stage-0 and stage-1 outputs");
        if (!compareDirectories(PATHS.stage0, PATHS.stage1)) {
            throw new Error("Bootstrap verification failed: stage-0 and stage-1 differ");
        }

        // Step 5: Bootstrap successful, update bootstrap directory
        log("Step 5: Bootstrap successful! Updating bootstrap directory");

        const backupPath = path.join(__dirname, 'bootstrap.backup.' + Date.now());
        log(`Backing up current bootstrap to: ${path.relative(__dirname, backupPath)}`);
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
    if (!node || typeof node !== 'object') {
        return null;
    }

    if (node.type === 'ParseError') {
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
            } else if (child && typeof child === 'object') {
                const error = findFirstParseError(child);
                if (error) return error;
            }
        }
    }

    return null;
}

export function findParseErrors(node) {
    if (!node || typeof node !== 'object') {
        return;
    }

    if (node.type === 'Identifier' && node.name === '__PARSE_ERROR__') {
        console.error(`[Valkyrie Debug] Parse Error Found at ${node.line}:${node.column}`);
    }

    for (const key in node) {
        if (Object.prototype.hasOwnProperty.call(node, key)) {
            const child = node[key];
            if (Array.isArray(child)) {
                child.forEach(findParseErrors);
            } else if (child && typeof child === 'object') {
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
  help, -h, --help   Show this help message.

Examples:
  node bootstrap.js bootstrap
  node bootstrap.js compile-test
`);
}

async function compileTest() {
    log("Compiling parser.valkyrie for testing...");
    try {
        const bootstrapCompilerParts = await loadBootstrapCompiler();
        const inputPath = path.join(PATHS.library, 'parser.valkyrie');
        const outputPath = path.join(PATHS.dist, 'parser.test.js');
        
        if (compileFile(inputPath, outputPath, bootstrapCompilerParts)) {
            log(`✅ Test compilation successful: ${path.relative(__dirname, outputPath)}`);
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

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    
    switch (command) {
        case 'bootstrap':
        case 'boot':
            const success = await bootstrap();
            process.exit(success ? 0 : 1);
            break;
        case 'compile-test':
            const testSuccess = await compileTest();
            process.exit(testSuccess ? 0 : 1);
            break;
        case 'help':
        case '-h':
        case '--help':
        case undefined:
            showHelp();
            break;
            
        default:
            error(`Unknown command: ${command}`);
            showHelp();
            process.exit(1);
    }
}

main().catch(err => {
    error(`An unexpected error occurred: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
});