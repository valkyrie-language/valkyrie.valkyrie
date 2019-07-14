let lexerNS = await import("./lexer.js");
let parserNS = await import("./parser.js");
let codegenNS = await import("./codegen.js");
export function compile(compiler) {
    let lexer = lexerNS.initLexer(compiler.source);
    let tokens = lexerNS.tokenize(lexer);
    if (tokens.length == 0) {
        if (compiler.source == "") {
            return "";
        }
        return "Error: Lexical analysis failed";
    }
    let ast = parserNS.parse(tokens);
    if (ast.type == "" || ast.type == "ParseError") {
        return "Error: Syntax analysis failed";
    }
    if (compiler.multiFile) {
        let resolvedAst = resolveMultipleNamespaces(ast);
        return codegenNS.generate(resolvedAst);
    }
    return codegenNS.generate(ast);
}
export function createError(message, line, column) {
    return {
        type: "CompilerError",
        message: message,
        line: line,
        column: column,
    };
}
export function reportError(error) {
    console.log(
        "Compiler Error: " +
            error.message +
            " at line " +
            error.line +
            ", column " +
            error.column
    );
}
export function createCompilerOptions(outputFormat, optimize, debug) {
    return {
        outputFormat: outputFormat || "js",
        optimize: optimize || false,
        debug: debug || false,
    };
}
export function compileWithOptions(compiler, options) {
    compiler.options = options;
    if (options.debug) {
        console.log("Debug mode enabled");
    }
    let result = compile(compiler);
    if (options.optimize) {
        result = result;
    }
    return result;
}
export function createStats() {
    return {
        tokensCount: 0,
        astNodesCount: 0,
        compilationTime: 0,
        outputSize: 0,
    };
}
export function countASTNodes(node) {
    if (node == null) {
        return 0;
    }
    let count = 1;
    if (node.statements != null) {
        let i = 0;
        while (i < node.statements.length) {
            count = count + countASTNodes(node.statements[i]);
            i = i + 1;
        }
    }
    if (node.body != null) {
        count = count + countASTNodes(node.body);
    }
    if (node.left != null) {
        count = count + countASTNodes(node.left);
    }
    if (node.right != null) {
        count = count + countASTNodes(node.right);
    }
    if (node.expression != null) {
        count = count + countASTNodes(node.expression);
    }
    if (node.condition != null) {
        count = count + countASTNodes(node.condition);
    }
    if (node.thenBranch != null) {
        count = count + countASTNodes(node.thenBranch);
    }
    if (node.elseBranch != null) {
        count = count + countASTNodes(node.elseBranch);
    }
    return count;
}
export function compileWithStats(compiler, options) {
    let stats = createStats();
    let startTime = Date.now();
    let result = compileWithOptions(compiler, options);
    stats.compilationTime = Date.now() - startTime;
    stats.outputSize = result.length;
    return { result: result, stats: stats };
}
export function compileSource(source) {
    let compiler = { source: source, multiFile: false };
    return compile(compiler);
}
export function compileSourceWithOptions(
    source,
    outputFormat,
    optimize,
    debug
) {
    let compiler = { source: source, multiFile: false };
    let options = createCompilerOptions(outputFormat, optimize, debug);
    return compileWithOptions(compiler, options);
}
export function validateSyntax(source) {
    let lexer = lexerNS.initLexer(source);
    let tokens = lexerNS.tokenize(lexer);
    if (tokens.length == 0) {
        return { valid: false, error: "Lexical analysis failed" };
    }
    let ast = parserNS.parse(tokens);
    if (ast.type == "" || ast.type == "ParseError") {
        return { valid: false, error: "Syntax analysis failed" };
    }
    return { valid: true, error: null };
}
export function joinPath(pathArray, separator) {
    if (pathArray == null || pathArray.length == 0) {
        return "";
    }
    let result = pathArray[0];
    let i = 1;
    while (i < pathArray.length) {
        result = result + separator + pathArray[i];
        i = i + 1;
    }
    return result;
}
export function createNamespaceManager() {
    return {
        namespaces: {},
        usings: {},
        currentNamespace: "",
        currentFile: "",
        mode: "repl",
    };
}
export function setCompileMode(manager, mode) {
    manager.mode = mode;
}
export function isMainNamespace(namespacePath) {
    return namespacePath.endsWith("!");
}
export function getMainNamespaceName(namespacePath) {
    if (isMainNamespace(namespacePath)) {
        return namespacePath.substring(0, namespacePath.length - 1);
    }
    return namespacePath;
}
export function addSymbolToNamespace(
    manager,
    namespacePath,
    symbolName,
    symbolType,
    symbolData,
    filePath
) {
    if (manager.namespaces[namespacePath] == null) {
        manager.namespaces[namespacePath] = { symbols: {}, files: [] };
    }
    let namespaceData = manager.namespaces[namespacePath];
    namespaceData.symbols[symbolName] = {
        type: symbolType,
        data: symbolData,
        filePath: filePath,
    };
    let fileExists = false;
    let i = 0;
    while (i < namespaceData.files.length) {
        if (namespaceData.files[i] == filePath) {
            fileExists = true;
            break;
        }
        i = i + 1;
    }
    if (!fileExists) {
        namespaceData.files.push(filePath);
    }
}
export function addUsingImport(manager, usingPath, isGlobal) {
    if (manager.usings[manager.currentFile] == null) {
        manager.usings[manager.currentFile] = [];
    }
    let usingInfo = { namespace: usingPath, isGlobal: isGlobal };
    manager.usings[manager.currentFile].push(usingInfo);
}
export function resolveSymbol(
    manager,
    symbolName,
    currentNamespace,
    currentFile
) {
    let currentNamespaceData = manager.namespaces[currentNamespace];
    if (currentNamespaceData != null && currentNamespaceData.symbols != null) {
        let symbol = currentNamespaceData.symbols[symbolName];
        if (symbol != null) {
            return { found: true, symbol: symbol, namespace: currentNamespace };
        }
    }
    let fileUsings = manager.usings[currentFile];
    if (fileUsings != null) {
        let i = 0;
        while (i < fileUsings.length) {
            let usingInfo = fileUsings[i];
            let usingNamespace = usingInfo["namespace"];
            let usingNamespaceData = manager.namespaces[usingNamespace];
            if (
                usingNamespaceData != null &&
                usingNamespaceData.symbols != null
            ) {
                let symbol = usingNamespaceData.symbols[symbolName];
                if (symbol != null) {
                    return {
                        found: true,
                        symbol: symbol,
                        namespace: usingNamespace,
                    };
                }
            }
            i = i + 1;
        }
    }
    let globalNamespaceData = manager.namespaces[""];
    if (globalNamespaceData != null && globalNamespaceData.symbols != null) {
        let symbol = globalNamespaceData.symbols[symbolName];
        if (symbol != null) {
            return { found: true, symbol: symbol, namespace: "" };
        }
    }
    return { found: false, symbol: null, namespace: null };
}
export function getFullyQualifiedName(manager, symbolName, namespacePath) {
    if (namespacePath == "") {
        return symbolName;
    }
    let cleanNamespace = getMainNamespaceName(namespacePath);
    return cleanNamespace.replace("::", "_") + "_" + symbolName;
}
export function compileSourceText(sourceText) {
    let lexer = lexerNS.initLexer(sourceText);
    let tokens = lexerNS.tokenize(lexer);
    if (tokens.length == 0) {
        if (sourceText == "") {
            return "";
        }
        return "Error: Lexical analysis failed";
    }
    let ast = parserNS.parse(tokens);
    if (ast.type == "" || ast.type == "ParseError") {
        return "Error: Syntax analysis failed";
    }
    return codegenNS.generate(ast);
}
export function resolveMultipleNamespaces(ast) {
    let manager = createNamespaceManager();
    let i = 0;
    while (i < ast.statements.length) {
        let stmt = ast.statements[i];
        if (stmt.type == "NamespaceStatement") {
            let namespacePath = joinPath(stmt.path, "::");
            if (stmt.isMainNamespace) {
                namespacePath = namespacePath + "!";
            }
            manager.currentNamespace = namespacePath;
        } else if (stmt.type == "UsingStatement") {
            let usingPath = joinPath(stmt.path, "::");
            let isGlobal = isMainNamespace(usingPath);
            addUsingImport(manager, usingPath, isGlobal);
        } else if (stmt.type == "MicroDeclaration") {
            addSymbolToNamespace(
                manager,
                manager.currentNamespace,
                stmt.name,
                "function",
                stmt,
                manager.currentFile
            );
        } else if (stmt.type == "ClassDeclaration") {
            addSymbolToNamespace(
                manager,
                manager.currentNamespace,
                stmt.name,
                "class",
                stmt,
                manager.currentFile
            );
        } else if (stmt.type == "LetStatement") {
            addSymbolToNamespace(
                manager,
                manager.currentNamespace,
                stmt.name,
                "variable",
                stmt,
                manager.currentFile
            );
        }
        i = i + 1;
    }
    let j = 0;
    while (j < ast.statements.length) {
        let stmt = ast.statements[j];
        if (stmt.type == "MicroDeclaration") {
            stmt.uniqueName = getFullyQualifiedName(
                manager,
                stmt.name,
                manager.currentNamespace
            );
        } else if (stmt.type == "ClassDeclaration") {
            stmt.uniqueName = getFullyQualifiedName(
                manager,
                stmt.name,
                manager.currentNamespace
            );
        } else if (stmt.type == "LetStatement") {
            stmt.uniqueName = getFullyQualifiedName(
                manager,
                stmt.name,
                manager.currentNamespace
            );
        }
        j = j + 1;
    }
    return ast;
}
export function compileFile(filePath, outputPath) {
    return "File compilation not implemented yet";
}
export function validateNamespaceRules(ast, mode) {
    let hasNamespace = false;
    let hasMainNamespace = false;
    let i = 0;
    while (i < ast.statements.length) {
        let stmt = ast.statements[i];
        if (stmt.type == "NamespaceStatement") {
            hasNamespace = true;
            if (stmt.isMainNamespace) {
                hasMainNamespace = true;
            }
        }
        i = i + 1;
    }
    if (mode == "standard" && !hasNamespace) {
        return "Error: Standard mode requires at least one namespace declaration";
    }
    if (mode == "standard" && !hasMainNamespace) {
        return "Error: Standard mode requires exactly one main namespace (ending with !)";
    }
    return "OK";
}
export function compileFolderWithMode(fileContents, mode) {
    let manager = createNamespaceManager();
    setCompileMode(manager, mode);
    let jsImportStatements = [];
    let variableStatements = [];
    let functionStatements = [];
    let classStatements = [];
    let executionStatements = [];
    let fileNames = Object.keys(fileContents);
    let i = 0;
    while (i < fileNames.length) {
        let fileName = fileNames[i];
        let content = fileContents[fileName];
        manager.currentFile = fileName;
        let lexerInstance = lexerNS.initLexer(content);
        let tokens = lexerNS.tokenize(lexerInstance);
        if (tokens.length == 0) {
            i = i + 1;
            continue;
        }
        let ast = parserNS.parse(tokens);
        if (ast.type != "Program") {
            return "Error: Failed to parse " + fileName;
        }
        let validationResult = validateNamespaceRules(ast, mode);
        if (validationResult != "OK") {
            return validationResult;
        }
        let currentNamespace = "";
        let j = 0;
        while (j < ast.statements.length) {
            let stmt = ast.statements[j];
            if (stmt.type == "NamespaceStatement") {
                currentNamespace = joinPath(stmt.path, "::");
                if (stmt.isMainNamespace) {
                    currentNamespace = currentNamespace + "!";
                    if (mode == "standard") {
                        console.log("🔍 检查主命名空间: " + currentNamespace);
                        console.log(
                            "📋 当前管理器中的命名空间: " +
                                Object.keys(manager.namespaces).join(", ")
                        );
                        if (manager.namespaces[currentNamespace] != null) {
                            let cleanName = currentNamespace.substring(
                                0,
                                currentNamespace.length - 1
                            );
                            console.log(
                                "❌ 发现重复的主命名空间: " + cleanName
                            );
                            return (
                                "Error: Duplicate main namespace '" +
                                cleanName +
                                "' found. Each main namespace must have a unique name."
                            );
                        } else {
                            console.log(
                                "✅ 主命名空间检查通过: " + currentNamespace
                            );
                        }
                    }
                }
                manager.currentNamespace = currentNamespace;
                if (manager.namespaces[currentNamespace] == null) {
                    manager.namespaces[currentNamespace] = {
                        symbols: {},
                        files: [],
                    };
                }
            } else if (stmt.type == "UsingStatement") {
                let usingPath = joinPath(stmt.path, "::");
                let isGlobal = isMainNamespace(usingPath);
                addUsingImport(manager, usingPath, isGlobal);
            } else if (stmt.type == "JSImportStatement") {
                jsImportStatements.push(stmt);
            } else if (stmt.type == "LetStatement") {
                variableStatements.push(stmt);
                addSymbolToNamespace(
                    manager,
                    currentNamespace,
                    stmt.name,
                    "variable",
                    stmt,
                    fileName
                );
            } else if (stmt.type == "MicroDeclaration") {
                functionStatements.push(stmt);
                addSymbolToNamespace(
                    manager,
                    currentNamespace,
                    stmt.name,
                    "function",
                    stmt,
                    fileName
                );
            } else if (stmt.type == "ClassDeclaration") {
                classStatements.push(stmt);
                addSymbolToNamespace(
                    manager,
                    currentNamespace,
                    stmt.name,
                    "class",
                    stmt,
                    fileName
                );
            } else {
                executionStatements.push(stmt);
            }
            j = j + 1;
        }
        i = i + 1;
    }
    if (mode == "standard") {
        let mainNamespaces = [];
        let namespaceNames = Object.keys(manager.namespaces);
        let nsIndex = 0;
        while (nsIndex < namespaceNames.length) {
            let nsName = namespaceNames[nsIndex];
            if (isMainNamespace(nsName)) {
                let cleanName = getMainNamespaceName(nsName);
                let duplicateIndex = 0;
                let isDuplicate = false;
                while (duplicateIndex < mainNamespaces.length) {
                    if (mainNamespaces[duplicateIndex] == cleanName) {
                        isDuplicate = true;
                        break;
                    }
                    duplicateIndex = duplicateIndex + 1;
                }
                if (isDuplicate) {
                    return (
                        "Error: Duplicate main namespace '" +
                        cleanName +
                        "' found"
                    );
                }
                mainNamespaces.push(cleanName);
            }
            nsIndex = nsIndex + 1;
        }
    }
    let k = 0;
    while (k < functionStatements.length) {
        let funcStmt = functionStatements[k];
        funcStmt.uniqueName = getFullyQualifiedName(
            manager,
            funcStmt.name,
            funcStmt["namespace"] || ""
        );
        k = k + 1;
    }
    let l = 0;
    while (l < classStatements.length) {
        let classStmt = classStatements[l];
        classStmt.uniqueName = getFullyQualifiedName(
            manager,
            classStmt.name,
            classStmt["namespace"] || ""
        );
        l = l + 1;
    }
    let m = 0;
    while (m < variableStatements.length) {
        let varStmt = variableStatements[m];
        varStmt.uniqueName = getFullyQualifiedName(
            manager,
            varStmt.name,
            varStmt["namespace"] || ""
        );
        m = m + 1;
    }
    let integratedAst = { type: "Program", statements: [] };
    let n = 0;
    while (n < jsImportStatements.length) {
        integratedAst.statements.push(jsImportStatements[n]);
        n = n + 1;
    }
    let o = 0;
    while (o < variableStatements.length) {
        integratedAst.statements.push(variableStatements[o]);
        o = o + 1;
    }
    let p = 0;
    while (p < functionStatements.length) {
        integratedAst.statements.push(functionStatements[p]);
        p = p + 1;
    }
    let q = 0;
    while (q < classStatements.length) {
        integratedAst.statements.push(classStatements[q]);
        q = q + 1;
    }
    let r = 0;
    while (r < executionStatements.length) {
        integratedAst.statements.push(executionStatements[r]);
        r = r + 1;
    }
    return codegenNS.generate(integratedAst);
}
export function compileFolder(fileContents) {
    return compileFolderWithMode(fileContents, "repl");
}
export function resolveMultipleNamespacesAndGenerate(ast) {
    let manager = createNamespaceManager();
    let jsImportStatements = [];
    let variableStatements = [];
    let functionStatements = [];
    let classStatements = [];
    let executionStatements = [];
    let currentNamespace = "";
    let i = 0;
    while (i < ast.statements.length) {
        let stmt = ast.statements[i];
        if (stmt.type == "NamespaceStatement") {
            currentNamespace = joinPath(stmt.path, "::");
            if (stmt.isMainNamespace) {
                currentNamespace = currentNamespace + "!";
            }
            manager.currentNamespace = currentNamespace;
        } else if (stmt.type == "UsingStatement") {
            let usingPath = joinPath(stmt.path, "::");
            let isGlobal = isMainNamespace(usingPath);
            addUsingImport(manager, usingPath, isGlobal);
        } else if (stmt.type == "JSImportStatement") {
            jsImportStatements.push(stmt);
        } else if (stmt.type == "LetStatement") {
            variableStatements.push(stmt);
            addSymbolToNamespace(
                manager,
                currentNamespace,
                stmt.name,
                "variable",
                stmt,
                manager.currentFile
            );
        } else if (stmt.type == "MicroDeclaration") {
            functionStatements.push(stmt);
            addSymbolToNamespace(
                manager,
                currentNamespace,
                stmt.name,
                "function",
                stmt,
                manager.currentFile
            );
        } else if (stmt.type == "ClassDeclaration") {
            classStatements.push(stmt);
            addSymbolToNamespace(
                manager,
                currentNamespace,
                stmt.name,
                "class",
                stmt,
                manager.currentFile
            );
        } else {
            executionStatements.push(stmt);
        }
        i = i + 1;
    }
    let j = 0;
    while (j < functionStatements.length) {
        let funcStmt = functionStatements[j];
        funcStmt.uniqueName = getFullyQualifiedName(
            manager,
            funcStmt.name,
            currentNamespace
        );
        j = j + 1;
    }
    let k = 0;
    while (k < classStatements.length) {
        let classStmt = classStatements[k];
        classStmt.uniqueName = getFullyQualifiedName(
            manager,
            classStmt.name,
            currentNamespace
        );
        k = k + 1;
    }
    let l = 0;
    while (l < variableStatements.length) {
        let varStmt = variableStatements[l];
        varStmt.uniqueName = getFullyQualifiedName(
            manager,
            varStmt.name,
            currentNamespace
        );
        l = l + 1;
    }
    let integratedAst = { type: "Program", statements: [] };
    let m = 0;
    while (m < jsImportStatements.length) {
        integratedAst.statements.push(jsImportStatements[m]);
        m = m + 1;
    }
    let n = 0;
    while (n < variableStatements.length) {
        integratedAst.statements.push(variableStatements[n]);
        n = n + 1;
    }
    let o = 0;
    while (o < functionStatements.length) {
        integratedAst.statements.push(functionStatements[o]);
        o = o + 1;
    }
    let p = 0;
    while (p < classStatements.length) {
        integratedAst.statements.push(classStatements[p]);
        p = p + 1;
    }
    let q = 0;
    while (q < executionStatements.length) {
        integratedAst.statements.push(executionStatements[q]);
        q = q + 1;
    }
    return codegenNS.generate(integratedAst);
}
export function generateSimpleBlock(blockStmt) {
    return "{\n  // Block statement placeholder\n  return null;\n}";
}
export function compileSingleFileWithImports(sourceText) {
    let lexerInstance = lexerNS.initLexer(sourceText);
    let tokens = lexerNS.tokenize(lexerInstance);
    if (tokens.length == 0) {
        if (sourceText == "") {
            return "";
        }
        return "Error: Lexical analysis failed";
    }
    let ast = parserNS.parse(tokens);
    if (ast.type == "" || ast.type == "ParseError") {
        return "Error: Syntax analysis failed";
    }
    let resolvedAst = resolveMultipleNamespacesAndGenerate(ast);
    return resolvedAst;
}
export function compileSingleFileComplete(sourceText) {
    let lexerInstance = lexerNS.initLexer(sourceText);
    let tokens = lexerNS.tokenize(lexerInstance);
    if (tokens.length == 0) {
        if (sourceText == "") {
            return "";
        }
        return "Error: Lexical analysis failed";
    }
    let ast = parserNS.parse(tokens);
    if (ast.type == "" || ast.type == "ParseError") {
        return "Error: Syntax analysis failed";
    }
    let manager = createNamespaceManager();
    setCompileMode(manager, "repl");
    let jsImportStatements = [];
    let variableStatements = [];
    let functionStatements = [];
    let classStatements = [];
    let executionStatements = [];
    let currentNamespace = "";
    let i = 0;
    while (i < ast.statements.length) {
        let stmt = ast.statements[i];
        if (stmt.type == "NamespaceStatement") {
            currentNamespace = joinPath(stmt.path, "::");
            if (stmt.isMainNamespace) {
                currentNamespace = currentNamespace + "!";
            }
            manager.currentNamespace = currentNamespace;
            manager.currentFile = "single_file";
        } else if (stmt.type == "UsingStatement") {
            let usingPath = joinPath(stmt.path, "::");
            let isGlobal = isMainNamespace(usingPath);
            addUsingImport(manager, usingPath, isGlobal);
        } else if (stmt.type == "JSImportStatement") {
            jsImportStatements.push(stmt);
        } else if (stmt.type == "LetStatement") {
            variableStatements.push(stmt);
        } else if (stmt.type == "MicroDeclaration") {
            functionStatements.push(stmt);
        } else if (stmt.type == "ClassDeclaration") {
            classStatements.push(stmt);
        } else {
            executionStatements.push(stmt);
        }
        i = i + 1;
    }
    let uniqueNames = {};
    let j = 0;
    while (j < functionStatements.length) {
        let funcStmt = functionStatements[j];
        let uniqueName = getFullyQualifiedName(
            manager,
            funcStmt.name,
            currentNamespace
        );
        uniqueNames[funcStmt.name] = uniqueName;
        funcStmt.uniqueName = uniqueName;
        j = j + 1;
    }
    let k = 0;
    while (k < classStatements.length) {
        let classStmt = classStatements[k];
        let uniqueName = getFullyQualifiedName(
            manager,
            classStmt.name,
            currentNamespace
        );
        uniqueNames[classStmt.name] = uniqueName;
        classStmt.uniqueName = uniqueName;
        k = k + 1;
    }
    let l = 0;
    while (l < variableStatements.length) {
        let varStmt = variableStatements[l];
        let uniqueName = getFullyQualifiedName(
            manager,
            varStmt.name,
            currentNamespace
        );
        uniqueNames[varStmt.name] = uniqueName;
        varStmt.uniqueName = uniqueName;
        l = l + 1;
    }
    let integratedAst = { type: "Program", statements: [] };
    let m = 0;
    while (m < jsImportStatements.length) {
        integratedAst.statements.push(jsImportStatements[m]);
        m = m + 1;
    }
    let n = 0;
    while (n < variableStatements.length) {
        integratedAst.statements.push(variableStatements[n]);
        n = n + 1;
    }
    let o = 0;
    while (o < functionStatements.length) {
        integratedAst.statements.push(functionStatements[o]);
        o = o + 1;
    }
    let p = 0;
    while (p < classStatements.length) {
        integratedAst.statements.push(classStatements[p]);
        p = p + 1;
    }
    let q = 0;
    while (q < executionStatements.length) {
        integratedAst.statements.push(executionStatements[q]);
        q = q + 1;
    }
    return codegenNS.generate(integratedAst);
}
export function generateSingleJSFromAnalysis(fileContents, mode) {
    let manager = createNamespaceManager();
    setCompileMode(manager, mode || "repl");
    let analyzer = createDependencyAnalyzer();
    let fileNames = Object.keys(fileContents);
    let i = 0;
    while (i < fileNames.length) {
        let fileName = fileNames[i];
        let content = fileContents[fileName];
        analyzer.dependencies[fileName] = [];
        let lexerInstance = lexerNS.initLexer(content);
        let tokens = lexerNS.tokenize(lexerInstance);
        if (tokens.length > 0) {
            let ast = parserNS.parse(tokens);
            if (ast.type == "Program") {
                let j = 0;
                while (j < ast.statements.length) {
                    let stmt = ast.statements[j];
                    if (stmt.type == "UsingStatement") {
                        let usingPath = joinPath(stmt.path, "::");
                        let providerFile = findNamespaceProvider(
                            usingPath,
                            fileContents
                        );
                        if (providerFile != null && providerFile != fileName) {
                            analyzer.dependencies[fileName].push(providerFile);
                        }
                    }
                    j = j + 1;
                }
            }
        }
        i = i + 1;
    }
    let sortResult = topologicalSort(analyzer, fileContents);
    if (sortResult.error != null) {
        return "Error: " + sortResult.error;
    }
    let sortedFiles = sortResult.sorted;
    let jsImportStatements = [];
    let variableStatements = [];
    let functionStatements = [];
    let classStatements = [];
    let executionStatements = [];
    let k = 0;
    while (k < sortedFiles.length) {
        let fileName = sortedFiles[k];
        let content = fileContents[fileName];
        manager.currentFile = fileName;
        let lexerInstance = lexerNS.initLexer(content);
        let tokens = lexerNS.tokenize(lexerInstance);
        if (tokens.length == 0) {
            k = k + 1;
            continue;
        }
        let ast = parserNS.parse(tokens);
        if (ast.type != "Program") {
            return "Error: Failed to parse " + fileName;
        }
        let validationResult = validateNamespaceRules(ast, mode);
        if (validationResult != "OK") {
            return validationResult;
        }
        let currentNamespace = "";
        let l = 0;
        while (l < ast.statements.length) {
            let stmt = ast.statements[l];
            if (stmt.type == "NamespaceStatement") {
                currentNamespace = joinPath(stmt.path, "::");
                if (stmt.isMainNamespace) {
                    currentNamespace = currentNamespace + "!";
                    if (mode == "standard") {
                        console.log("🔍 检查主命名空间: " + currentNamespace);
                        console.log(
                            "📋 当前管理器中的命名空间: " +
                                Object.keys(manager.namespaces).join(", ")
                        );
                        if (manager.namespaces[currentNamespace] != null) {
                            let cleanName = currentNamespace.substring(
                                0,
                                currentNamespace.length - 1
                            );
                            console.log(
                                "❌ 发现重复的主命名空间: " + cleanName
                            );
                            return (
                                "Error: Duplicate main namespace '" +
                                cleanName +
                                "' found. Each main namespace must have a unique name."
                            );
                        } else {
                            console.log(
                                "✅ 主命名空间检查通过: " + currentNamespace
                            );
                        }
                    }
                }
                manager.currentNamespace = currentNamespace;
            } else if (stmt.type == "UsingStatement") {
                let usingPath = joinPath(stmt.path, "::");
                let isGlobal = isMainNamespace(usingPath);
                addUsingImport(manager, usingPath, isGlobal);
            } else if (stmt.type == "JSImportStatement") {
                jsImportStatements.push(stmt);
            } else if (stmt.type == "LetStatement") {
                variableStatements.push(stmt);
                addSymbolToNamespace(
                    manager,
                    currentNamespace,
                    stmt.name,
                    "variable",
                    stmt,
                    fileName
                );
            } else if (stmt.type == "MicroDeclaration") {
                functionStatements.push(stmt);
                addSymbolToNamespace(
                    manager,
                    currentNamespace,
                    stmt.name,
                    "function",
                    stmt,
                    fileName
                );
            } else if (stmt.type == "ClassDeclaration") {
                classStatements.push(stmt);
                addSymbolToNamespace(
                    manager,
                    currentNamespace,
                    stmt.name,
                    "class",
                    stmt,
                    fileName
                );
            } else {
                executionStatements.push(stmt);
            }
            l = l + 1;
        }
        k = k + 1;
    }
    if (mode == "standard") {
        let mainNamespaces = [];
        let mainNamespaceNames = [];
        let namespaceKeys = Object.keys(manager.namespaces);
        let nsIndex = 0;
        while (nsIndex < namespaceKeys.length) {
            let nsName = namespaceKeys[nsIndex];
            if (nsName.endsWith("!")) {
                mainNamespaces.push(nsName);
                let cleanName = nsName.substring(0, nsName.length - 1);
                mainNamespaceNames.push(cleanName);
            }
            nsIndex = nsIndex + 1;
        }
        let duplicateIndex = 0;
        while (duplicateIndex < mainNamespaceNames.length) {
            let currentName = mainNamespaceNames[duplicateIndex];
            let checkIndex = duplicateIndex + 1;
            while (checkIndex < mainNamespaceNames.length) {
                if (mainNamespaceNames[checkIndex] == currentName) {
                    return (
                        "Error: Duplicate main namespace '" +
                        currentName +
                        "' found. Each main namespace must have a unique name."
                    );
                }
                checkIndex = checkIndex + 1;
            }
            duplicateIndex = duplicateIndex + 1;
        }
    }
    let m = 0;
    while (m < functionStatements.length) {
        let funcStmt = functionStatements[m];
        funcStmt.uniqueName = getFullyQualifiedName(
            manager,
            funcStmt.name,
            funcStmt["namespace"] || ""
        );
        m = m + 1;
    }
    let n = 0;
    while (n < classStatements.length) {
        let classStmt = classStatements[n];
        classStmt.uniqueName = getFullyQualifiedName(
            manager,
            classStmt.name,
            classStmt["namespace"] || ""
        );
        n = n + 1;
    }
    let o = 0;
    while (o < variableStatements.length) {
        let varStmt = variableStatements[o];
        varStmt.uniqueName = getFullyQualifiedName(
            manager,
            varStmt.name,
            varStmt["namespace"] || ""
        );
        o = o + 1;
    }
    let integratedAst = { type: "Program", statements: [] };
    let p = 0;
    while (p < jsImportStatements.length) {
        integratedAst.statements.push(jsImportStatements[p]);
        p = p + 1;
    }
    let q = 0;
    while (q < variableStatements.length) {
        integratedAst.statements.push(variableStatements[q]);
        q = q + 1;
    }
    let r = 0;
    while (r < functionStatements.length) {
        integratedAst.statements.push(functionStatements[r]);
        r = r + 1;
    }
    let s = 0;
    while (s < classStatements.length) {
        integratedAst.statements.push(classStatements[s]);
        s = s + 1;
    }
    let t = 0;
    while (t < executionStatements.length) {
        integratedAst.statements.push(executionStatements[t]);
        t = t + 1;
    }
    return codegenNS.generate(integratedAst);
}
export function generateSingleJS(fileContents) {
    return generateSingleJSFromAnalysis(fileContents, "repl");
}
export function generateSingleJSStandard(fileContents) {
    return generateSingleJSFromAnalysis(fileContents, "standard");
}
export function createDependencyAnalyzer() {
    return { dependencies: {}, reverseDependencies: {} };
}
export function findNamespaceProvider(namespacePath, fileContents) {
    let fileNames = Object.keys(fileContents);
    let i = 0;
    while (i < fileNames.length) {
        let fileName = fileNames[i];
        let content = fileContents[fileName];
        let lexerInstance = lexerNS.initLexer(content);
        let tokens = lexerNS.tokenize(lexerInstance);
        if (tokens.length > 0) {
            let ast = parserNS.parse(tokens);
            if (ast.type == "Program") {
                let j = 0;
                while (j < ast.statements.length) {
                    let stmt = ast.statements[j];
                    if (stmt.type == "NamespaceStatement") {
                        let declaredNamespace = joinPath(stmt.path, "::");
                        if (declaredNamespace == namespacePath) {
                            return fileName;
                        }
                    }
                    j = j + 1;
                }
            }
        }
        i = i + 1;
    }
    return null;
}
export function topologicalSort(analyzer, fileContents) {
    let fileNames = Object.keys(fileContents);
    let visited = {};
    let sorted = [];
    let i = 0;
    while (i < fileNames.length) {
        visited[fileNames[i]] = false;
        i = i + 1;
    }
    let j = 0;
    while (j < fileNames.length) {
        let fileName = fileNames[j];
        if (!visited[fileName]) {
            simpleDfsVisit(fileName, analyzer, visited, sorted);
        }
        j = j + 1;
    }
    return { error: null, sorted: sorted };
}
export function simpleDfsVisit(filePath, analyzer, visited, sorted) {
    if (visited[filePath]) {
        return;
    }
    visited[filePath] = true;
    let dependencies = analyzer.dependencies[filePath];
    if (dependencies != null) {
        let i = 0;
        while (i < dependencies.length) {
            let depFile = dependencies[i];
            simpleDfsVisit(depFile, analyzer, visited, sorted);
            i = i + 1;
        }
    }
    sorted.push(filePath);
}
