export function package_codegen_joinPath(pathArray, separator) {
    let result = "";
    for (let i = 0; i < pathArray.length; i++) {
        if (i > 0) {
            result += separator;
        }
        result += pathArray[i];
    }
    return result;
}
export function package_codegen_replaceAll(str, search, replace) {
    let result = "";
    for (let i = 0; i < str.length; ) {
        if (str[i] == search) {
            result += replace;
            i += search.length;
        } else {
            result += str[i];
            i++;
        }
    }
    return result;
}
export function package_codegen_generateExpression(node) {
    if (node.type == "Number") {
        return node.value;
    }
    if (node.type == "String") {
        let escaped = node.value;
        escaped = package_codegen_replaceAll(escaped, "\\", "\\\\");
        escaped = package_codegen_replaceAll(escaped, '"', '\\"');
        escaped = package_codegen_replaceAll(escaped, "\n", "\\n");
        escaped = package_codegen_replaceAll(escaped, "\r", "\\r");
        escaped = package_codegen_replaceAll(escaped, "\t", "\\t");
        return '"' + escaped + '"';
    }
    if (node.type == "Boolean") {
        return node.value;
    }
    if (node.type == "Identifier") {
        return node.name;
    }
    if (node.type == "BinaryOp") {
        let left = package_codegen_generateExpression(node.left);
        let right = package_codegen_generateExpression(node.right);
        let result = "(";
        result += left;
        result += " ";
        result += node.operator;
        result += " ";
        result += right;
        result += ")";
        return result;
    }
    if (node.type == "Assignment") {
        let left = package_codegen_generateExpression(node.left);
        let right = package_codegen_generateExpression(node.right);
        return left + " = " + right;
    }
    if (node.type == "MicroCall") {
        let callee = package_codegen_generateExpression(node.callee);
        let args = "";
        for (let i = 0; i < node.arguments.length; i++) {
            if (i > 0) {
                args += ", ";
            }
            args += package_codegen_generateExpression(node.arguments[i]);
        }
        return callee + "(" + args + ")";
    }
    if (node.type == "NewExpression") {
        let args = "";
        for (let i = 0; i < node.arguments.length; i++) {
            if (i > 0) {
                args += ", ";
            }
            args += package_codegen_generateExpression(node.arguments[i]);
        }
        return "new " + node.className + "(" + args + ")";
    }
    if (node.type == "AwaitExpression") {
        let argument = package_codegen_generateExpression(node.argument);
        return "await " + argument;
    }
    if (node.type == "PropertyAccess") {
        if (node.object.type) {
            let obj = package_codegen_generateExpression(node.object);
            return `${obj}.${node.property}`;
        } else {
            return `${node.object}.${node.property}`;
        }
    }
    if (node.type == "ArrayAccess") {
        let obj = "";
        if (node.object.type) {
            obj = package_codegen_generateExpression(node.object);
        } else {
            obj = node.object;
        }
        let index = package_codegen_generateExpression(node.index);
        return obj + "[" + index + "]";
    }
    if (node.type == "ObjectLiteral") {
        if (node.properties.length == 0) {
            return "{}";
        }
        let result = "{";
        let i = 0;
        while (i < node.properties.length) {
            let prop = node.properties[i];
            if (i > 0) {
                result += ", ";
            }
            result =
                result +
                '"' +
                prop.key +
                '": ' +
                package_codegen_generateExpression(prop.value);
            i++;
        }
        result += "}";
        return result;
    }
    if (node.type == "ArrayLiteral") {
        return "[]";
    }
    if (node.type == "UnaryOp") {
        let operand = package_codegen_generateExpression(node.operand);
        return node.operator + operand;
    }
    if (node.type == "ThisExpression") {
        return "this";
    }
    if (node.type == "DefaultValue") {
        return "undefined";
    }
    return "/* Unknown expression: " + node.type + " */";
}
export function package_codegen_generateStatement(node) {
    if (node.type == "LetStatement") {
        let value = package_codegen_generateExpression(node.value);
        return "let " + node.name + " = " + value + ";";
    }
    if (node.type == "NamespaceStatement") {
        let namespacePath = package_codegen_joinPath(node.path, "::");
        if (node.isMainNamespace) {
            return "// namespace! " + namespacePath + ";";
        } else {
            return "// namespace " + namespacePath + ";";
        }
    }
    if (node.type == "UsingStatement") {
        return "// using " + package_codegen_joinPath(node.path, "::") + ";";
    }
    if (node.type == "JSAttributeStatement") {
        return (
            "import { " +
            node.importName +
            " as " +
            node.functionName +
            ' } from "' +
            node.modulePath +
            '";'
        );
    }
    if (node.type == "ImportJsStatement") {
        return (
            "import { " +
            node.importName +
            " as " +
            node.localName +
            ' } from "' +
            node.module +
            '";'
        );
    }
    if (node.type == "MicroDeclaration") {
        let params = "";
        let i = 0;
        while (i < node.parameters.length) {
            if (i > 0) {
                params = params + ", ";
            }
            params = params + node.parameters[i];
            i++;
        }
        let body = package_codegen_generateStatement(node.body);
        let functionName = node.name;
        return "export function " + functionName + "(" + params + ") " + body;
    }
    if (node.type == "MemberStatement") {
        let params = "";
        let i = 0;
        while (i < node.parameters.length) {
            if (i > 0) {
                params = params + ", ";
            }
            params = params + node.parameters[i];
            i++;
        }
        let body = package_codegen_generateStatement(node.body);
        return "function " + node.name + "(" + params + ") " + body;
    }
    if (node.type == "IfStatement") {
        let condition = package_codegen_generateExpression(node.condition);
        let thenBranch = package_codegen_generateStatement(node.thenBranch);
        let result = "if (" + condition + ") " + thenBranch;
        if (node.elseBranch && node.elseBranch.type) {
            let elseBranch = package_codegen_generateStatement(node.elseBranch);
            result += " else " + elseBranch;
        }
        return result;
    }
    if (node.type == "WhileStatement") {
        let condition = package_codegen_generateExpression(node.condition);
        let body = package_codegen_generateStatement(node.body);
        return "while (" + condition + ") " + body;
    }
    if (node.type == "ReturnStatement") {
        if (node.value && node.value.type) {
            let value = package_codegen_generateExpression(node.value);
            return "return " + value + ";";
        } else {
            return "return;";
        }
    }
    if (node.type == "Block") {
        let statements = "";
        let i = 0;
        while (i < node.statements.length) {
            let stmt = package_codegen_generateStatement(node.statements[i]);
            if (i > 0) {
                statements = statements + "\n";
            }
            statements = statements + stmt;
            i++;
        }
        return "{\n" + statements + "\n}";
    }
    if (node.type == "ExpressionStatement") {
        return package_codegen_generateExpression(node.expression) + ";";
    }
    if (node.type == "NamespaceStatement") {
        return (
            "// namespace " + package_codegen_joinPath(node.path, "::") + ";"
        );
    }
    if (node.type == "UsingStatement") {
        return "// using " + package_codegen_joinPath(node.path, "::") + ";";
    }
    if (node.type == "JSAttributeStatement") {
        let cleanImportName = package_codegen_replaceAll(
            node.importName,
            "-",
            "_"
        );
        cleanImportName = package_codegen_replaceAll(cleanImportName, ".", "_");
        cleanImportName = package_codegen_replaceAll(cleanImportName, "/", "_");
        let uniqueName = node.functionName + "_" + cleanImportName;
        let importStatement =
            "import { " +
            node.importName +
            " as " +
            uniqueName +
            ' } from "' +
            node.modulePath +
            '";';
        let params = "";
        let i = 0;
        while (i < node.parameters.length) {
            if (i > 0) {
                params = params + ", ";
            }
            params = params + node.parameters[i];
            i++;
        }
        let functionDef =
            "export function " + node.functionName + "(" + params + ") {\n";
        functionDef =
            functionDef + "  return " + uniqueName + "(" + params + ");\n";
        functionDef = functionDef + "}";
        return importStatement + "\n" + functionDef;
    }
    if (node.type == "ClassDeclaration") {
        let className = node.name;
        let superClass = node.superClass;
        let members = node.members;
        let result = "class " + className;
        if (superClass) {
            result += " extends " + superClass;
        }
        result += " {\n";
        let hasExplicitConstructor = false;
        let explicitConstructor = null;
        let fieldInits = "";
        let i = 0;
        while (i < members.length) {
            let member = members[i];
            if (member.type == "ConstructorStatement") {
                hasExplicitConstructor = true;
                explicitConstructor = member;
            } else if (member.type == "Property") {
                if (member.initializer && member.initializer.type) {
                    let initValue = package_codegen_generateExpression(
                        member.initializer
                    );
                    fieldInits =
                        fieldInits +
                        "    self." +
                        member.name +
                        " = " +
                        initValue +
                        ";\n";
                } else {
                    fieldInits =
                        fieldInits +
                        "    self." +
                        member.name +
                        " = undefined;\n";
                }
            }
            i++;
        }
        if (hasExplicitConstructor) {
            let params = "";
            let j = 0;
            while (j < explicitConstructor.parameters.length) {
                if (j > 0) {
                    params = params + ", ";
                }
                params = params + explicitConstructor.parameters[j];
                j = j + 1;
            }
            result += "  constructor(" + params + ") {\n";
            if (superClass) {
                result += "    super();\n";
            }
            result += fieldInits;
            let ctorBody = package_codegen_generateStatement(
                explicitConstructor.body
            );
            if (ctorBody.startsWith("{\n") && ctorBody.endsWith("\n}")) {
                ctorBody = ctorBody.substring(2, ctorBody.length - 2);
            }
            result += ctorBody;
            result += "  }\n\n";
        } else if (fieldInits != "") {
            result += "  constructor() {\n";
            if (superClass) {
                result += "    super();\n";
            }
            result += fieldInits;
            result += "  }\n\n";
        }
        i = 0;
        while (i < members.length) {
            let member = members[i];
            if (member.type == "MemberStatement") {
                let methodName = member.name;
                let params = "";
                let j = 0;
                let paramCount = 0;
                while (j < member.parameters.length) {
                    if (member.parameters[j] != "self") {
                        if (paramCount > 0) {
                            params = params + ", ";
                        }
                        params = params + member.parameters[j];
                        paramCount = paramCount + 1;
                    }
                    j = j + 1;
                }
                let body = package_codegen_generateStatement(member.body);
                result =
                    result +
                    "  " +
                    methodName +
                    "(" +
                    params +
                    ") " +
                    body +
                    "\n\n";
            }
            i++;
        }
        result += "}";
        return result;
    }
    return "/* Unknown statement: " + node.type + " */";
}
export function package_codegen_generate(ast) {
    if (ast.type == "Program") {
        let result = "";
        let i = 0;
        while (i < ast.statements.length) {
            let stmt = ast.statements[i];
            result += package_codegen_generateStatement(stmt) + "\n";
            i++;
        }
        return result;
    }
    if (ast.type == "ParseError") {
        return (
            "// Parse Error: " +
            ast.message +
            " at line " +
            ast.line +
            ", column " +
            ast.column
        );
    }
    return package_codegen_generateStatement(ast);
}
export function package_compiler_compile(compiler) {
    let lexer = new package_lexer_ValkyrieLexer(compiler.source);
    let tokens = package_lexer_tokenize(lexer);
    if (tokens.length == 0) {
        if (compiler.source == "") {
            return "";
        }
        return "Error: Lexical analysis failed";
    }
    let ast = package_parser_parse(tokens);
    if (ast.type == "" || ast.type == "ParseError") {
        return "Error: Syntax analysis failed";
    }
    if (compiler.multiFile) {
        let resolvedAst = package_compiler_resolveMultipleNamespaces(ast);
        return package_codegen_generate(resolvedAst);
    }
    return package_codegen_generate(ast);
}
export function package_compiler_createError(message, line, column) {
    return {
        type: "CompilerError",
        message: message,
        line: line,
        column: column,
    };
}
export function package_compiler_reportError(error) {
    console.log(
        "Compiler Error: " +
            error.message +
            " at line " +
            error.line +
            ", column " +
            error.column
    );
}
export function package_compiler_createCompilerOptions(
    outputFormat,
    optimize,
    debug
) {
    return {
        outputFormat: outputFormat || "js",
        optimize: optimize || false,
        debug: debug || false,
    };
}
export function package_compiler_compileWithOptions(compiler, options) {
    compiler.options = options;
    if (options.debug) {
        console.log("Debug mode enabled");
    }
    let result = package_compiler_compile(compiler);
    if (options.optimize) {
        result = result;
    }
    return result;
}
export function package_compiler_createStats() {
    return {
        tokensCount: 0,
        astNodesCount: 0,
        compilationTime: 0,
        outputSize: 0,
    };
}
export function package_compiler_countASTNodes(node) {
    if (node == null) {
        return 0;
    }
    let count = 1;
    if (node.statements != null) {
        let i = 0;
        while (i < node.statements.length) {
            count = count + package_compiler_countASTNodes(node.statements[i]);
            i++;
        }
    }
    if (node.body != null) {
        count = count + package_compiler_countASTNodes(node.body);
    }
    if (node.left != null) {
        count = count + package_compiler_countASTNodes(node.left);
    }
    if (node.right != null) {
        count = count + package_compiler_countASTNodes(node.right);
    }
    if (node.expression != null) {
        count = count + package_compiler_countASTNodes(node.expression);
    }
    if (node.condition != null) {
        count = count + package_compiler_countASTNodes(node.condition);
    }
    if (node.thenBranch != null) {
        count = count + package_compiler_countASTNodes(node.thenBranch);
    }
    if (node.elseBranch != null) {
        count = count + package_compiler_countASTNodes(node.elseBranch);
    }
    return count;
}
export function package_compiler_compileWithStats(compiler, options) {
    let stats = package_compiler_createStats();
    let startTime = Date.now();
    let result = package_compiler_compileWithOptions(compiler, options);
    stats.compilationTime = Date.now() - startTime;
    stats.outputSize = result.length;
    return { result: result, stats: stats };
}
export function package_compiler_compileSource(source) {
    let compiler = { source: source, multiFile: false };
    return package_compiler_compile(compiler);
}
export function package_compiler_compileSourceWithOptions(
    source,
    outputFormat,
    optimize,
    debug
) {
    let compiler = { source: source, multiFile: false };
    let options = package_compiler_createCompilerOptions(
        outputFormat,
        optimize,
        debug
    );
    return package_compiler_compileWithOptions(compiler, options);
}
export function package_compiler_validateSyntax(source) {
    let lexer = new package_lexer_ValkyrieLexer(source);
    let tokens = package_lexer_tokenize(lexer);
    if (tokens.length == 0) {
        return { valid: false, error: "Lexical analysis failed" };
    }
    let ast = package_parser_parse(tokens);
    if (ast.type == "" || ast.type == "ParseError") {
        return { valid: false, error: "Syntax analysis failed" };
    }
    return { valid: true, error: null };
}
export function package_compiler_joinPath(pathArray, separator) {
    if (pathArray == null || pathArray.length == 0) {
        return "";
    }
    let result = pathArray[0];
    let i = 1;
    while (i < pathArray.length) {
        result += separator + pathArray[i];
        i++;
    }
    return result;
}
export function package_compiler_createNamespaceManager() {
    return {
        namespaces: {},
        usings: {},
        currentNamespace: "",
        currentFile: "",
        mode: "repl",
    };
}
export function package_compiler_setCompileMode(manager, mode) {
    manager.mode = mode;
}
export function package_compiler_isMainNamespace(namespacePath) {
    if (namespacePath == null) {
        return false;
    }
    return namespacePath.endsWith("!");
}
export function package_compiler_getMainNamespaceName(namespacePath) {
    if (package_compiler_isMainNamespace(namespacePath)) {
        return namespacePath.substring(0, namespacePath.length - 1);
    }
    return namespacePath;
}
export function package_compiler_addSymbolToNamespace(
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
        i++;
    }
    if (!fileExists) {
        namespaceData.files.push(filePath);
    }
}
export function package_compiler_addUsingImport(manager, usingPath, isGlobal) {
    if (manager.usings[manager.currentFile] == null) {
        manager.usings[manager.currentFile] = [];
    }
    let usingInfo = { namespace: usingPath, isGlobal: isGlobal };
    manager.usings[manager.currentFile].push(usingInfo);
}
export function package_compiler_resolveSymbol(
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
            i++;
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
export function package_compiler_findSymbolNamespace(
    manager,
    symbolName,
    symbolType
) {
    let namespaceKeys = Object.keys(manager.namespaces);
    let i = 0;
    while (i < namespaceKeys.length) {
        let namespaceName = namespaceKeys[i];
        let namespaceData = manager.namespaces[namespaceName];
        if (namespaceData != null && namespaceData.symbols != null) {
            let symbol = namespaceData.symbols[symbolName];
            if (symbol != null && symbol.type == symbolType) {
                return namespaceName;
            }
        }
        i++;
    }
    return "";
}
export function package_compiler_getFullyQualifiedName(
    manager,
    symbolName,
    namespacePath
) {
    if (namespacePath == "" || namespacePath == null) {
        return symbolName;
    }
    let cleanNamespace = package_compiler_getMainNamespaceName(namespacePath);
    return cleanNamespace.replace("::", "_") + "_" + symbolName;
}
export function package_compiler_compileSourceText(sourceText) {
    let lexer = new package_lexer_ValkyrieLexer(sourceText);
    let tokens = package_lexer_tokenize(lexer);
    if (tokens.length == 0) {
        if (sourceText == "") {
            return "";
        }
        return "Error: Lexical analysis failed";
    }
    let ast = package_parser_parse(tokens);
    if (ast.type == "" || ast.type == "ParseError") {
        return "Error: Syntax analysis failed";
    }
    return package_codegen_generate(ast);
}
export function package_compiler_resolveMultipleNamespaces(ast) {
    let manager = package_compiler_createNamespaceManager();
    let i = 0;
    while (i < ast.statements.length) {
        let stmt = ast.statements[i];
        if (stmt.type == "NamespaceStatement") {
            let namespacePath = package_codegen_joinPath(stmt.path, "::");
            if (stmt.isMainNamespace) {
                namespacePath = namespacePath + "!";
            }
            manager.currentNamespace = namespacePath;
        } else if (stmt.type == "UsingStatement") {
            let usingPath = package_codegen_joinPath(stmt.path, "::");
            let isGlobal = package_compiler_isMainNamespace(usingPath);
            package_compiler_addUsingImport(manager, usingPath, isGlobal);
        } else if (stmt.type == "MicroDeclaration") {
            package_compiler_addSymbolToNamespace(
                manager,
                manager.currentNamespace,
                stmt.name,
                "function",
                stmt,
                manager.currentFile
            );
        } else if (stmt.type == "ClassDeclaration") {
            package_compiler_addSymbolToNamespace(
                manager,
                manager.currentNamespace,
                stmt.name,
                "class",
                stmt,
                manager.currentFile
            );
        } else if (stmt.type == "LetStatement") {
            package_compiler_addSymbolToNamespace(
                manager,
                manager.currentNamespace,
                stmt.name,
                "variable",
                stmt,
                manager.currentFile
            );
        }
        i++;
    }
    let j = 0;
    while (j < ast.statements.length) {
        let stmt = ast.statements[j];
        if (stmt.type == "MicroDeclaration") {
            stmt.uniqueName = package_compiler_getFullyQualifiedName(
                manager,
                stmt.name,
                manager.currentNamespace
            );
        } else if (stmt.type == "ClassDeclaration") {
            stmt.uniqueName = package_compiler_getFullyQualifiedName(
                manager,
                stmt.name,
                manager.currentNamespace
            );
        } else if (stmt.type == "LetStatement") {
            stmt.uniqueName = package_compiler_getFullyQualifiedName(
                manager,
                stmt.name,
                manager.currentNamespace
            );
        }
        j = j + 1;
    }
    return ast;
}
export function package_compiler_compileFile(filePath, outputPath) {
    return "File compilation not implemented yet";
}
export function package_compiler_validateNamespaceRules(ast, mode) {
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
        i++;
    }
    if (mode == "standard" && !hasNamespace) {
        return "Error: Standard mode requires at least one namespace declaration";
    }
    if (mode == "standard" && !hasMainNamespace) {
        return "Error: Standard mode requires exactly one main namespace (ending with !)";
    }
    return "OK";
}
export function package_compiler_compileFolderWithMode(fileContents, mode) {
    let manager = package_compiler_createNamespaceManager();
    package_compiler_setCompileMode(manager, mode);
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
        let lexerInstance = new package_lexer_ValkyrieLexer(content);
        let tokens = package_lexer_tokenize(lexerInstance);
        if (tokens.length == 0) {
            i++;
            continue;
        }
        let ast = package_parser_parse(tokens);
        if (ast.type != "Program") {
            return "Error: Failed to parse " + fileName;
        }
        let validationResult = package_compiler_validateNamespaceRules(
            ast,
            mode
        );
        if (validationResult != "OK") {
            return validationResult;
        }
        let currentNamespace = "";
        let j = 0;
        while (j < ast.statements.length) {
            let stmt = ast.statements[j];
            if (stmt.type == "NamespaceStatement") {
                currentNamespace = package_codegen_joinPath(stmt.path, "::");
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
                let usingPath = package_codegen_joinPath(stmt.path, "::");
                let isGlobal = package_compiler_isMainNamespace(usingPath);
                package_compiler_addUsingImport(manager, usingPath, isGlobal);
            } else if (stmt.type == "JSImportStatement") {
                jsImportStatements.push(stmt);
            } else if (stmt.type == "LetStatement") {
                stmt.sourceNamespace = currentNamespace;
                variableStatements.push(stmt);
                package_compiler_addSymbolToNamespace(
                    manager,
                    currentNamespace,
                    stmt.name,
                    "variable",
                    stmt,
                    fileName
                );
            } else if (stmt.type == "MicroDeclaration") {
                stmt.sourceNamespace = currentNamespace;
                functionStatements.push(stmt);
                package_compiler_addSymbolToNamespace(
                    manager,
                    currentNamespace,
                    stmt.name,
                    "function",
                    stmt,
                    fileName
                );
            } else if (stmt.type == "ClassDeclaration") {
                stmt.sourceNamespace = currentNamespace;
                classStatements.push(stmt);
                package_compiler_addSymbolToNamespace(
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
        i++;
    }
    if (mode == "standard") {
        let mainNamespaces = [];
        let namespaceNames = Object.keys(manager.namespaces);
        let nsIndex = 0;
        while (nsIndex < namespaceNames.length) {
            let nsName = namespaceNames[nsIndex];
            if (package_compiler_isMainNamespace(nsName)) {
                let cleanName = package_compiler_getMainNamespaceName(nsName);
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
        funcStmt.uniqueName = package_compiler_getFullyQualifiedName(
            manager,
            funcStmt.name,
            funcStmt["namespace"] || ""
        );
        k = k + 1;
    }
    let l = 0;
    while (l < classStatements.length) {
        let classStmt = classStatements[l];
        classStmt.uniqueName = package_compiler_getFullyQualifiedName(
            manager,
            classStmt.name,
            classStmt["namespace"] || ""
        );
        l = l + 1;
    }
    let m = 0;
    while (m < variableStatements.length) {
        let varStmt = variableStatements[m];
        varStmt.uniqueName = package_compiler_getFullyQualifiedName(
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
    return package_codegen_generate(integratedAst);
}
export function package_compiler_compileFolder(fileContents) {
    return package_compiler_compileFolderWithMode(fileContents, "repl");
}
export function package_compiler_resolveMultipleNamespacesAndGenerate(ast) {
    let manager = package_compiler_createNamespaceManager();
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
            currentNamespace = package_codegen_joinPath(stmt.path, "::");
            if (stmt.isMainNamespace) {
                currentNamespace = currentNamespace + "!";
            }
            manager.currentNamespace = currentNamespace;
        } else if (stmt.type == "UsingStatement") {
            let usingPath = package_codegen_joinPath(stmt.path, "::");
            let isGlobal = package_compiler_isMainNamespace(usingPath);
            package_compiler_addUsingImport(manager, usingPath, isGlobal);
        } else if (stmt.type == "JSImportStatement") {
            jsImportStatements.push(stmt);
        } else if (stmt.type == "LetStatement") {
            variableStatements.push(stmt);
            package_compiler_addSymbolToNamespace(
                manager,
                currentNamespace,
                stmt.name,
                "variable",
                stmt,
                manager.currentFile
            );
        } else if (stmt.type == "MicroDeclaration") {
            functionStatements.push(stmt);
            package_compiler_addSymbolToNamespace(
                manager,
                currentNamespace,
                stmt.name,
                "function",
                stmt,
                manager.currentFile
            );
        } else if (stmt.type == "ClassDeclaration") {
            classStatements.push(stmt);
            package_compiler_addSymbolToNamespace(
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
        i++;
    }
    let j = 0;
    while (j < functionStatements.length) {
        let funcStmt = functionStatements[j];
        funcStmt.uniqueName = package_compiler_getFullyQualifiedName(
            manager,
            funcStmt.name,
            currentNamespace
        );
        j = j + 1;
    }
    let k = 0;
    while (k < classStatements.length) {
        let classStmt = classStatements[k];
        classStmt.uniqueName = package_compiler_getFullyQualifiedName(
            manager,
            classStmt.name,
            currentNamespace
        );
        k = k + 1;
    }
    let l = 0;
    while (l < variableStatements.length) {
        let varStmt = variableStatements[l];
        varStmt.uniqueName = package_compiler_getFullyQualifiedName(
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
    return package_codegen_generate(integratedAst);
}
export function package_compiler_generateSimpleBlock(blockStmt) {
    return "{\n  // Block statement placeholder\n  return null;\n}";
}
export function package_compiler_compileSingleFileWithImports(sourceText) {
    let lexerInstance = new package_lexer_ValkyrieLexer(sourceText);
    let tokens = package_lexer_tokenize(lexerInstance);
    if (tokens.length == 0) {
        if (sourceText == "") {
            return "";
        }
        return "Error: Lexical analysis failed";
    }
    let ast = package_parser_parse(tokens);
    if (ast.type == "" || ast.type == "ParseError") {
        return "Error: Syntax analysis failed";
    }
    let resolvedAst =
        package_compiler_resolveMultipleNamespacesAndGenerate(ast);
    return resolvedAst;
}
export function package_compiler_compileSingleFileComplete(sourceText) {
    let lexerInstance = new package_lexer_ValkyrieLexer(sourceText);
    let tokens = package_lexer_tokenize(lexerInstance);
    if (tokens.length == 0) {
        if (sourceText == "") {
            return "";
        }
        return "Error: Lexical analysis failed";
    }
    let ast = package_parser_parse(tokens);
    if (ast.type == "" || ast.type == "ParseError") {
        return "Error: Syntax analysis failed";
    }
    let manager = package_compiler_createNamespaceManager();
    package_compiler_setCompileMode(manager, "repl");
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
            currentNamespace = package_codegen_joinPath(stmt.path, "::");
            if (stmt.isMainNamespace) {
                currentNamespace = currentNamespace + "!";
            }
            manager.currentNamespace = currentNamespace;
            manager.currentFile = "single_file";
        } else if (stmt.type == "UsingStatement") {
            let usingPath = package_codegen_joinPath(stmt.path, "::");
            let isGlobal = package_compiler_isMainNamespace(usingPath);
            package_compiler_addUsingImport(manager, usingPath, isGlobal);
        } else if (stmt.type == "JSImportStatement") {
            jsImportStatements.push(stmt);
        } else if (stmt.type == "LetStatement") {
            stmt.sourceNamespace = currentNamespace;
            variableStatements.push(stmt);
        } else if (stmt.type == "MicroDeclaration") {
            stmt.sourceNamespace = currentNamespace;
            functionStatements.push(stmt);
        } else if (stmt.type == "ClassDeclaration") {
            stmt.sourceNamespace = currentNamespace;
            classStatements.push(stmt);
        } else {
            executionStatements.push(stmt);
        }
        i++;
    }
    let uniqueNames = {};
    let j = 0;
    while (j < functionStatements.length) {
        let funcStmt = functionStatements[j];
        let uniqueName = package_compiler_getFullyQualifiedName(
            manager,
            funcStmt.name,
            funcStmt.sourceNamespace
        );
        uniqueNames[funcStmt.name] = uniqueName;
        funcStmt.uniqueName = uniqueName;
        j = j + 1;
    }
    let k = 0;
    while (k < classStatements.length) {
        let classStmt = classStatements[k];
        let uniqueName = package_compiler_getFullyQualifiedName(
            manager,
            classStmt.name,
            classStmt.sourceNamespace
        );
        uniqueNames[classStmt.name] = uniqueName;
        classStmt.uniqueName = uniqueName;
        k = k + 1;
    }
    let l = 0;
    while (l < variableStatements.length) {
        let varStmt = variableStatements[l];
        let uniqueName = package_compiler_getFullyQualifiedName(
            manager,
            varStmt.name,
            varStmt.sourceNamespace
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
    return package_codegen_generate(integratedAst);
}
export function package_compiler_generateSingleJSFromAnalysis(
    fileContents,
    mode
) {
    let manager = package_compiler_createNamespaceManager();
    package_compiler_setCompileMode(manager, mode || "repl");
    let analyzer = package_compiler_createDependencyAnalyzer();
    let fileNames = Object.keys(fileContents);
    let i = 0;
    while (i < fileNames.length) {
        let fileName = fileNames[i];
        let content = fileContents[fileName];
        analyzer.dependencies[fileName] = [];
        let lexerInstance = new package_lexer_ValkyrieLexer(content);
        let tokens = package_lexer_tokenize(lexerInstance);
        if (tokens.length > 0) {
            let ast = package_parser_parse(tokens);
            if (ast.type == "Program") {
                let j = 0;
                while (j < ast.statements.length) {
                    let stmt = ast.statements[j];
                    if (stmt.type == "UsingStatement") {
                        let usingPath = package_codegen_joinPath(
                            stmt.path,
                            "::"
                        );
                        let providerFile =
                            package_compiler_findNamespaceProvider(
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
        i++;
    }
    let sortResult = package_compiler_topologicalSort(analyzer, fileContents);
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
        let lexerInstance = new package_lexer_ValkyrieLexer(content);
        let tokens = package_lexer_tokenize(lexerInstance);
        if (tokens.length == 0) {
            k = k + 1;
            continue;
        }
        let ast = package_parser_parse(tokens);
        if (ast.type != "Program") {
            return "Error: Failed to parse " + fileName;
        }
        let validationResult = package_compiler_validateNamespaceRules(
            ast,
            mode
        );
        if (validationResult != "OK") {
            return validationResult;
        }
        let currentNamespace = "";
        let l = 0;
        while (l < ast.statements.length) {
            let stmt = ast.statements[l];
            if (stmt.type == "NamespaceStatement") {
                currentNamespace = package_codegen_joinPath(stmt.path, "::");
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
                let usingPath = package_codegen_joinPath(stmt.path, "::");
                let isGlobal = package_compiler_isMainNamespace(usingPath);
                package_compiler_addUsingImport(manager, usingPath, isGlobal);
            } else if (stmt.type == "JSImportStatement") {
                jsImportStatements.push(stmt);
            } else if (stmt.type == "LetStatement") {
                stmt.sourceNamespace = currentNamespace;
                variableStatements.push(stmt);
                package_compiler_addSymbolToNamespace(
                    manager,
                    currentNamespace,
                    stmt.name,
                    "variable",
                    stmt,
                    fileName
                );
            } else if (stmt.type == "MicroDeclaration") {
                stmt.sourceNamespace = currentNamespace;
                functionStatements.push(stmt);
                package_compiler_addSymbolToNamespace(
                    manager,
                    currentNamespace,
                    stmt.name,
                    "function",
                    stmt,
                    fileName
                );
            } else if (stmt.type == "ClassDeclaration") {
                stmt.sourceNamespace = currentNamespace;
                classStatements.push(stmt);
                package_compiler_addSymbolToNamespace(
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
        funcStmt.uniqueName = package_compiler_getFullyQualifiedName(
            manager,
            funcStmt.name,
            funcStmt.sourceNamespace
        );
        m = m + 1;
    }
    let n = 0;
    while (n < classStatements.length) {
        let classStmt = classStatements[n];
        classStmt.uniqueName = package_compiler_getFullyQualifiedName(
            manager,
            classStmt.name,
            classStmt.sourceNamespace
        );
        n = n + 1;
    }
    let o = 0;
    while (o < variableStatements.length) {
        let varStmt = variableStatements[o];
        varStmt.uniqueName = package_compiler_getFullyQualifiedName(
            manager,
            varStmt.name,
            varStmt.sourceNamespace
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
        let varStmt = variableStatements[q];
        if (varStmt.uniqueName != null && varStmt.uniqueName != varStmt.name) {
            let modifiedStmt = Object.assign({}, varStmt);
            modifiedStmt.name = varStmt.uniqueName;
            integratedAst.statements.push(modifiedStmt);
        } else {
            integratedAst.statements.push(varStmt);
        }
        q = q + 1;
    }
    let r = 0;
    while (r < functionStatements.length) {
        let funcStmt = functionStatements[r];
        if (
            funcStmt.uniqueName != null &&
            funcStmt.uniqueName != funcStmt.name
        ) {
            let modifiedStmt = Object.assign({}, funcStmt);
            modifiedStmt.name = funcStmt.uniqueName;
            modifiedStmt.body = package_compiler_resolveIdentifiersInStatement(
                funcStmt.body,
                manager,
                functionStatements,
                variableStatements,
                classStatements
            );
            integratedAst.statements.push(modifiedStmt);
        } else {
            let modifiedStmt = Object.assign({}, funcStmt);
            modifiedStmt.body = package_compiler_resolveIdentifiersInStatement(
                funcStmt.body,
                manager,
                functionStatements,
                variableStatements,
                classStatements
            );
            integratedAst.statements.push(modifiedStmt);
        }
        r = r + 1;
    }
    let s = 0;
    while (s < classStatements.length) {
        let classStmt = classStatements[s];
        if (
            classStmt.uniqueName != null &&
            classStmt.uniqueName != classStmt.name
        ) {
            let modifiedStmt = Object.assign({}, classStmt);
            modifiedStmt.name = classStmt.uniqueName;
            integratedAst.statements.push(modifiedStmt);
        } else {
            integratedAst.statements.push(classStmt);
        }
        s = s + 1;
    }
    let t = 0;
    while (t < executionStatements.length) {
        let resolvedStmt = package_compiler_resolveIdentifiersInStatement(
            executionStatements[t],
            manager,
            functionStatements,
            variableStatements,
            classStatements
        );
        integratedAst.statements.push(resolvedStmt);
        t = t + 1;
    }
    return package_codegen_generate(integratedAst);
}
export function package_compiler_generateSingleJS(fileContents) {
    return package_compiler_generateSingleJSFromAnalysis(fileContents, "repl");
}
export function package_compiler_generateSingleJSStandard(fileContents) {
    return package_compiler_generateSingleJSFromAnalysis(
        fileContents,
        "standard"
    );
}
export function package_compiler_createDependencyAnalyzer() {
    return { dependencies: {}, reverseDependencies: {} };
}
export function package_compiler_findNamespaceProvider(
    namespacePath,
    fileContents
) {
    let fileNames = Object.keys(fileContents);
    let i = 0;
    while (i < fileNames.length) {
        let fileName = fileNames[i];
        let content = fileContents[fileName];
        let lexerInstance = new package_lexer_ValkyrieLexer(content);
        let tokens = package_lexer_tokenize(lexerInstance);
        if (tokens.length > 0) {
            let ast = package_parser_parse(tokens);
            if (ast.type == "Program") {
                let j = 0;
                while (j < ast.statements.length) {
                    let stmt = ast.statements[j];
                    if (stmt.type == "NamespaceStatement") {
                        let declaredNamespace = package_codegen_joinPath(
                            stmt.path,
                            "::"
                        );
                        if (declaredNamespace == namespacePath) {
                            return fileName;
                        }
                    }
                    j = j + 1;
                }
            }
        }
        i++;
    }
    return null;
}
export function package_compiler_topologicalSort(analyzer, fileContents) {
    let fileNames = Object.keys(fileContents);
    let visited = {};
    let sorted = [];
    let i = 0;
    while (i < fileNames.length) {
        visited[fileNames[i]] = false;
        i++;
    }
    let j = 0;
    while (j < fileNames.length) {
        let fileName = fileNames[j];
        if (!visited[fileName]) {
            package_compiler_simpleDfsVisit(
                fileName,
                analyzer,
                visited,
                sorted
            );
        }
        j = j + 1;
    }
    return { error: null, sorted: sorted };
}
export function package_compiler_resolveIdentifiersInExpression(
    expr,
    manager,
    functionStatements,
    variableStatements,
    classStatements
) {
    if (expr == null) {
        return expr;
    }
    if (expr.type == "Identifier") {
        let i = 0;
        while (i < functionStatements.length) {
            let funcStmt = functionStatements[i];
            if (funcStmt.name == expr.name && funcStmt.uniqueName != null) {
                let resolvedExpr = Object.assign({}, expr);
                resolvedExpr.name = funcStmt.uniqueName;
                return resolvedExpr;
            }
            i++;
        }
        let j = 0;
        while (j < variableStatements.length) {
            let varStmt = variableStatements[j];
            if (varStmt.name == expr.name && varStmt.uniqueName != null) {
                let resolvedExpr = Object.assign({}, expr);
                resolvedExpr.name = varStmt.uniqueName;
                return resolvedExpr;
            }
            j = j + 1;
        }
        return expr;
    }
    if (expr.type == "MicroCall") {
        let resolvedExpr = Object.assign({}, expr);
        if (expr.callee.type == "Identifier") {
            let functionName = expr.callee.name;
            let i = 0;
            while (i < functionStatements.length) {
                let funcStmt = functionStatements[i];
                if (
                    funcStmt.name == functionName &&
                    funcStmt.uniqueName != null
                ) {
                    let resolvedCallee = Object.assign({}, expr.callee);
                    resolvedCallee.name = funcStmt.uniqueName;
                    resolvedExpr.callee = resolvedCallee;
                    break;
                }
                i++;
            }
            if (i == functionStatements.length) {
                resolvedExpr.callee =
                    package_compiler_resolveIdentifiersInExpression(
                        expr.callee,
                        manager,
                        functionStatements,
                        variableStatements,
                        classStatements
                    );
            }
        } else {
            resolvedExpr.callee =
                package_compiler_resolveIdentifiersInExpression(
                    expr.callee,
                    manager,
                    functionStatements,
                    variableStatements,
                    classStatements
                );
        }
        let resolvedArgs = [];
        let k = 0;
        while (k < expr.arguments.length) {
            resolvedArgs.push(
                package_compiler_resolveIdentifiersInExpression(
                    expr.arguments[k],
                    manager,
                    functionStatements,
                    variableStatements,
                    classStatements
                )
            );
            k = k + 1;
        }
        resolvedExpr.arguments = resolvedArgs;
        return resolvedExpr;
    }
    if (expr.type == "BinaryOp") {
        let resolvedExpr = Object.assign({}, expr);
        resolvedExpr.left = package_compiler_resolveIdentifiersInExpression(
            expr.left,
            manager,
            functionStatements,
            variableStatements,
            classStatements
        );
        resolvedExpr.right = package_compiler_resolveIdentifiersInExpression(
            expr.right,
            manager,
            functionStatements,
            variableStatements,
            classStatements
        );
        return resolvedExpr;
    }
    if (expr.type == "Assignment") {
        let resolvedExpr = Object.assign({}, expr);
        resolvedExpr.left = package_compiler_resolveIdentifiersInExpression(
            expr.left,
            manager,
            functionStatements,
            variableStatements,
            classStatements
        );
        resolvedExpr.right = package_compiler_resolveIdentifiersInExpression(
            expr.right,
            manager,
            functionStatements,
            variableStatements,
            classStatements
        );
        return resolvedExpr;
    }
    if (expr.type == "PropertyAccess") {
        let resolvedExpr = Object.assign({}, expr);
        resolvedExpr.object = package_compiler_resolveIdentifiersInExpression(
            expr.object,
            manager,
            functionStatements,
            variableStatements,
            classStatements
        );
        return resolvedExpr;
    }
    if (expr.type == "NewExpression") {
        let resolvedExpr = Object.assign({}, expr);
        let m = 0;
        while (m < classStatements.length) {
            let classStmt = classStatements[m];
            if (
                classStmt.name == expr.className &&
                classStmt.uniqueName != null
            ) {
                resolvedExpr.className = classStmt.uniqueName;
                break;
            }
            m = m + 1;
        }
        let resolvedArgs = [];
        if (expr.arguments != null) {
            let n = 0;
            while (n < expr.arguments.length) {
                resolvedArgs.push(
                    package_compiler_resolveIdentifiersInExpression(
                        expr.arguments[n],
                        manager,
                        functionStatements,
                        variableStatements,
                        classStatements
                    )
                );
                n = n + 1;
            }
        }
        resolvedExpr.arguments = resolvedArgs;
        return resolvedExpr;
    }
    return expr;
}
export function package_compiler_resolveIdentifiersInStatement(
    stmt,
    manager,
    functionStatements,
    variableStatements,
    classStatements
) {
    if (stmt == null) {
        return stmt;
    }
    if (stmt.type == "LetStatement") {
        let resolvedStmt = Object.assign({}, stmt);
        resolvedStmt.value = package_compiler_resolveIdentifiersInExpression(
            stmt.value,
            manager,
            functionStatements,
            variableStatements,
            classStatements
        );
        return resolvedStmt;
    }
    if (stmt.type == "ExpressionStatement") {
        let resolvedStmt = Object.assign({}, stmt);
        resolvedStmt.expression =
            package_compiler_resolveIdentifiersInExpression(
                stmt.expression,
                manager,
                functionStatements,
                variableStatements,
                classStatements
            );
        return resolvedStmt;
    }
    if (stmt.type == "ReturnStatement") {
        let resolvedStmt = Object.assign({}, stmt);
        if (stmt.value != null) {
            resolvedStmt.value =
                package_compiler_resolveIdentifiersInExpression(
                    stmt.value,
                    manager,
                    functionStatements,
                    variableStatements,
                    classStatements
                );
        }
        return resolvedStmt;
    }
    if (stmt.type == "IfStatement") {
        let resolvedStmt = Object.assign({}, stmt);
        resolvedStmt.condition =
            package_compiler_resolveIdentifiersInExpression(
                stmt.condition,
                manager,
                functionStatements,
                variableStatements,
                classStatements
            );
        resolvedStmt.thenBranch =
            package_compiler_resolveIdentifiersInStatement(
                stmt.thenBranch,
                manager,
                functionStatements,
                variableStatements,
                classStatements
            );
        if (stmt.elseBranch != null) {
            resolvedStmt.elseBranch =
                package_compiler_resolveIdentifiersInStatement(
                    stmt.elseBranch,
                    manager,
                    functionStatements,
                    variableStatements,
                    classStatements
                );
        }
        return resolvedStmt;
    }
    if (stmt.type == "WhileStatement") {
        let resolvedStmt = Object.assign({}, stmt);
        resolvedStmt.condition =
            package_compiler_resolveIdentifiersInExpression(
                stmt.condition,
                manager,
                functionStatements,
                variableStatements,
                classStatements
            );
        resolvedStmt.body = package_compiler_resolveIdentifiersInStatement(
            stmt.body,
            manager,
            functionStatements,
            variableStatements,
            classStatements
        );
        return resolvedStmt;
    }
    if (stmt.type == "Block") {
        let resolvedStmt = Object.assign({}, stmt);
        let resolvedStatements = [];
        let i = 0;
        while (i < stmt.statements.length) {
            resolvedStatements.push(
                package_compiler_resolveIdentifiersInStatement(
                    stmt.statements[i],
                    manager,
                    functionStatements,
                    variableStatements,
                    classStatements
                )
            );
            i++;
        }
        resolvedStmt.statements = resolvedStatements;
        return resolvedStmt;
    }
    return stmt;
}
export function package_compiler_simpleDfsVisit(
    filePath,
    analyzer,
    visited,
    sorted
) {
    if (visited[filePath]) {
        return;
    }
    visited[filePath] = true;
    let dependencies = analyzer.dependencies[filePath];
    if (dependencies != null) {
        let i = 0;
        while (i < dependencies.length) {
            let depFile = dependencies[i];
            package_compiler_simpleDfsVisit(depFile, analyzer, visited, sorted);
            i++;
        }
    }
    sorted.push(filePath);
}
export function package_lexer_skipWhitespace(lexer) {
    while (
        lexer.current_char != "" &&
        package_lexer_isWhitespace(lexer.current_char)
    ) {
        lexer.advance();
    }
}
export function package_lexer_isWhitespace(ch) {
    return ch == " " || ch == "\t" || ch == "\n" || ch == "\r";
}
export function package_lexer_isAlpha(ch) {
    return (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch == "_";
}
export function package_lexer_isDigit(ch) {
    return ch >= "0" && ch <= "9";
}
export function package_lexer_isAlphaNumeric(ch) {
    return package_lexer_isAlpha(ch) || package_lexer_isDigit(ch);
}
export function package_lexer_readIdentifier(lexer) {
    let result = "";
    while (
        lexer.current_char != "" &&
        package_lexer_isAlphaNumeric(lexer.current_char)
    ) {
        result += lexer.current_char;
        lexer.advance();
    }
    return result;
}
export function package_lexer_readNumber(lexer) {
    let result = "";
    while (
        lexer.current_char != "" &&
        package_lexer_isDigit(lexer.current_char)
    ) {
        result += lexer.current_char;
        lexer.advance();
    }
    return result;
}
export function package_lexer_readString(lexer) {
    let result = "";
    lexer.advance();
    while (lexer.current_char != "" && lexer.current_char != '"') {
        if (lexer.current_char == "\\") {
            lexer.advance();
            if (lexer.current_char == "n") {
                result += "\n";
            } else {
                if (lexer.current_char == "t") {
                    result += "\t";
                } else {
                    if (lexer.current_char == "r") {
                        result += "\r";
                    } else {
                        if (lexer.current_char == '"') {
                            result += '"';
                        } else {
                            if (lexer.current_char == "\\") {
                                result += "\\";
                            } else {
                                result += "\\" + lexer.current_char;
                            }
                        }
                    }
                }
            }
        } else {
            result += lexer.current_char;
        }
        lexer.advance();
    }
    if (lexer.current_char == '"') {
        lexer.advance();
    }
    return result;
}
export function package_lexer_skipComment(lexer) {
    while (lexer.current_char != "" && lexer.current_char != "\n") {
        lexer.advance();
    }
}
export function package_lexer_getKeywordType(value) {
    if (value == "micro") {
        return "MICRO";
    }
    if (value == "let") {
        return "LET";
    }
    if (value == "if") {
        return "IF";
    }
    if (value == "else") {
        return "ELSE";
    }
    if (value == "while") {
        return "WHILE";
    }
    if (value == "return") {
        return "RETURN";
    }
    if (value == "true") {
        return "BOOLEAN";
    }
    if (value == "false") {
        return "BOOLEAN";
    }
    if (value == "namespace") {
        return "NAMESPACE";
    }
    if (value == "using") {
        return "USING";
    }
    if (value == "class") {
        return "CLASS";
    }
    if (value == "constructor") {
        return "CONSTRUCTOR";
    }
    if (value == "self") {
        return "SELF";
    }
    if (value == "extends") {
        return "EXTENDS";
    }
    if (value == "implements") {
        return "IMPLEMENTS";
    }
    if (value == "new") {
        return "NEW";
    }
    if (value == "default") {
        return "DEFAULT";
    }
    if (value == "await") {
        return "AWAIT";
    }
    return "IDENTIFIER";
}
export function package_lexer_nextToken(lexer) {
    while (lexer.current_char != "") {
        if (package_lexer_isWhitespace(lexer.current_char)) {
            package_lexer_skipWhitespace(lexer);
            continue;
        }
        if (lexer.current_char == "#") {
            package_lexer_skipComment(lexer);
            continue;
        }
        let line = lexer.line;
        let column = lexer.column;
        if (package_lexer_isAlpha(lexer.current_char)) {
            let value = package_lexer_readIdentifier(lexer);
            let tokenType = package_lexer_getKeywordType(value);
            return new package_lexer_Token(tokenType, value, line, column);
        }
        if (package_lexer_isDigit(lexer.current_char)) {
            let value = package_lexer_readNumber(lexer);
            return new package_lexer_Token("NUMBER", value, line, column);
        }
        if (lexer.current_char == '"') {
            let value = package_lexer_readString(lexer);
            return new package_lexer_Token("STRING", value, line, column);
        }
        let ch = lexer.current_char;
        lexer.advance();
        if (ch == "{") {
            return new package_lexer_Token("LBRACE", ch, line, column);
        }
        if (ch == "}") {
            return new package_lexer_Token("RBRACE", ch, line, column);
        }
        if (ch == "(") {
            return new package_lexer_Token("LPAREN", ch, line, column);
        }
        if (ch == ")") {
            return new package_lexer_Token("RPAREN", ch, line, column);
        }
        if (ch == "[") {
            return new package_lexer_Token("LBRACKET", ch, line, column);
        }
        if (ch == "]") {
            return new package_lexer_Token("RBRACKET", ch, line, column);
        }
        if (ch == ";") {
            return new package_lexer_Token("SEMICOLON", ch, line, column);
        }
        if (ch == ",") {
            return new package_lexer_Token("COMMA", ch, line, column);
        }
        if (ch == ":") {
            if (
                lexer.position < lexer.source.length &&
                lexer.source.charAt(lexer.position) == ":"
            ) {
                lexer.advance();
                return new package_lexer_Token(
                    "DOUBLE_COLON",
                    "::",
                    line,
                    column
                );
            }
            return new package_lexer_Token("COLON", ch, line, column);
        }
        if (ch == "=") {
            if (
                lexer.position < lexer.source.length &&
                lexer.source.charAt(lexer.position) == "="
            ) {
                lexer.advance();
                return new package_lexer_Token("EQ", "==", line, column);
            }
            return new package_lexer_Token("ASSIGN", ch, line, column);
        }
        if (ch == "+") {
            return new package_lexer_Token("PLUS", ch, line, column);
        }
        if (ch == "-") {
            return new package_lexer_Token("MINUS", ch, line, column);
        }
        if (ch == "*") {
            return new package_lexer_Token("MULTIPLY", ch, line, column);
        }
        if (ch == "/") {
            return new package_lexer_Token("DIVIDE", ch, line, column);
        }
        if (ch == "%") {
            return new package_lexer_Token("MODULO", ch, line, column);
        }
        if (ch == "&") {
            if (
                lexer.position < lexer.source.length &&
                lexer.source.charAt(lexer.position) == "&"
            ) {
                lexer.advance();
                return new package_lexer_Token("AND", "&&", line, column);
            }
            return new package_lexer_Token("AMPERSAND", ch, line, column);
        }
        if (ch == "|") {
            if (
                lexer.position < lexer.source.length &&
                lexer.source.charAt(lexer.position) == "|"
            ) {
                lexer.advance();
                return new package_lexer_Token("OR", "||", line, column);
            }
            return new package_lexer_Token("PIPE", ch, line, column);
        }
        if (ch == ">") {
            if (
                lexer.position < lexer.source.length &&
                lexer.source.charAt(lexer.position) == "="
            ) {
                lexer.advance();
                return new package_lexer_Token("GTE", ">=", line, column);
            }
            return new package_lexer_Token("GT", ch, line, column);
        }
        if (ch == "<") {
            if (
                lexer.position < lexer.source.length &&
                lexer.source.charAt(lexer.position) == "="
            ) {
                lexer.advance();
                return new package_lexer_Token("LTE", "<=", line, column);
            }
            return new package_lexer_Token("LT", ch, line, column);
        }
        if (ch == "!") {
            if (
                lexer.position < lexer.source.length &&
                lexer.source.charAt(lexer.position) == "="
            ) {
                lexer.advance();
                return new package_lexer_Token("NE", "!=", line, column);
            }
            return new package_lexer_Token("BANG", ch, line, column);
        }
        if (ch == ".") {
            return new package_lexer_Token("DOT", ch, line, column);
        }
        if (ch == "↯") {
            return new package_lexer_Token("ATTRIBUTE", ch, line, column);
        }
        return new package_lexer_Token(
            "ERROR",
            "Unknown character: " + ch,
            line,
            column
        );
    }
    return new package_lexer_Token("EOF", "", lexer.line, lexer.column);
}
export function package_lexer_tokenize(lexer) {
    let tokens = [];
    while (true) {
        let token = package_lexer_nextToken(lexer);
        tokens.push(token);
        if (token.type == "EOF") {
            break;
        }
    }
    return tokens;
}
export function package_parser_expect(parser, tokenType) {
    if (parser.current_token.type != tokenType) {
        let error = {};
        error.type = "ParseError";
        error.message =
            "Expected " + tokenType + " but got " + parser.current_token.type;
        error.line = parser.current_token.line;
        error.column = parser.current_token.column;
        return error;
    }
    let token = parser.current_token;
    parser.advance();
    return token;
}
export function package_parser_getOperatorPrecedence(tokenType) {
    if (tokenType == "ASSIGN") {
        return 1;
    }
    if (tokenType == "OR") {
        return 2;
    }
    if (tokenType == "AND") {
        return 3;
    }
    if (tokenType == "EQ") {
        return 4;
    }
    if (tokenType == "NE") {
        return 4;
    }
    if (tokenType == "GT") {
        return 5;
    }
    if (tokenType == "LT") {
        return 5;
    }
    if (tokenType == "GTE") {
        return 5;
    }
    if (tokenType == "LTE") {
        return 5;
    }
    if (tokenType == "PIPE") {
        return 6;
    }
    if (tokenType == "AMPERSAND") {
        return 6;
    }
    if (tokenType == "PLUS") {
        return 7;
    }
    if (tokenType == "MINUS") {
        return 7;
    }
    if (tokenType == "MULTIPLY") {
        return 8;
    }
    if (tokenType == "DIVIDE") {
        return 8;
    }
    if (tokenType == "MODULO") {
        return 8;
    }
    return -1;
}
export function package_parser_isRightAssociative(tokenType) {
    return tokenType == "ASSIGN";
}
export function package_parser_parseExpressionWithPrecedence(
    parser,
    minPrecedence
) {
    let left = package_parser_parseUnaryExpression(parser);
    if (left && left.type == "ParseError") {
        return left;
    }
    while (true) {
        let precedence = package_parser_getOperatorPrecedence(
            parser.current_token.type
        );
        if (precedence < minPrecedence) {
            break;
        }
        let op = parser.current_token.value;
        let tokenType = parser.current_token.type;
        parser.advance();
        let nextMinPrecedence = precedence;
        if (package_parser_isRightAssociative(tokenType)) {
        } else {
            nextMinPrecedence = precedence + 1;
        }
        let right = package_parser_parseExpressionWithPrecedence(
            parser,
            nextMinPrecedence
        );
        if (right && right.type == "ParseError") {
            return right;
        }
        if (tokenType == "ASSIGN") {
            let node = new package_parser_Node("Assignment");
            node.left = left;
            node.right = right;
            left = node;
        } else {
            let node = new package_parser_Node("BinaryOp");
            node.left = left;
            node.operator = op;
            node.right = right;
            left = node;
        }
    }
    return left;
}
export function package_parser_parseExpression(parser) {
    return package_parser_parseExpressionWithPrecedence(parser, 0);
}
export function package_parser_parseUnaryExpression(parser) {
    if (
        parser.current_token.type == "BANG" ||
        parser.current_token.type == "MINUS"
    ) {
        let op = parser.current_token.value;
        parser.advance();
        let operand = package_parser_parseUnaryExpression(parser);
        if (operand && operand.type == "ParseError") {
            return operand;
        }
        let node = new package_parser_Node("UnaryOp");
        node.operator = op;
        node.operand = operand;
        return node;
    }
    if (parser.current_token.type == "NEW") {
        return package_parser_parseNewExpression(parser);
    }
    return package_parser_parsePostfixExpression(parser);
}
export function package_parser_parseNewExpression(parser) {
    parser.advance();
    let className = package_parser_expect(parser, "IDENTIFIER");
    if (className.type == "ParseError") {
        return className;
    }
    let lparen = package_parser_expect(parser, "LPAREN");
    if (lparen.type == "ParseError") {
        return lparen;
    }
    let args = [];
    if (parser.current_token.type != "RPAREN") {
        let arg = package_parser_parseExpression(parser);
        if (arg.type == "ParseError") {
            return arg;
        }
        args.push(arg);
        while (parser.current_token.type == "COMMA") {
            parser.advance();
            arg = package_parser_parseExpression(parser);
            if (arg.type == "ParseError") {
                return arg;
            }
            args.push(arg);
        }
    }
    let rparen = package_parser_expect(parser, "RPAREN");
    if (rparen.type == "ParseError") {
        return rparen;
    }
    let node = new package_parser_Node("NewExpression");
    node.className = className.value;
    node.arguments = args;
    return node;
}
export function package_parser_parsePostfixExpression(parser) {
    let expr = package_parser_parseAtomicExpression(parser);
    if (expr && expr.type == "ParseError") {
        return expr;
    }
    while (true) {
        if (parser.current_token.type == "LPAREN") {
            parser.advance();
            let args = [];
            if (parser.current_token.type != "RPAREN") {
                let arg = package_parser_parseExpression(parser);
                if (arg && arg.type == "ParseError") {
                    return arg;
                }
                args.push(arg);
                while (parser.current_token.type == "COMMA") {
                    parser.advance();
                    arg = package_parser_parseExpression(parser);
                    if (arg && arg.type == "ParseError") {
                        return arg;
                    }
                    args.push(arg);
                }
            }
            let rparen = package_parser_expect(parser, "RPAREN");
            if (rparen && rparen.type == "ParseError") {
                return rparen;
            }
            let callNode = new package_parser_Node("MicroCall");
            callNode.callee = expr;
            callNode.arguments = args;
            expr = callNode;
        } else if (parser.current_token.type == "DOT") {
            parser.advance();
            if (parser.current_token.type == "AWAIT") {
                parser.advance();
                let awaitNode = new package_parser_Node("AwaitExpression");
                awaitNode.argument = expr;
                expr = awaitNode;
            } else {
                let property = package_parser_expect(parser, "IDENTIFIER");
                if (property && property.type == "ParseError") {
                    return property;
                }
                let accessNode = new package_parser_Node("PropertyAccess");
                accessNode.object = expr;
                accessNode.property = property.value;
                expr = accessNode;
            }
        } else if (parser.current_token.type == "LBRACKET") {
            parser.advance();
            let index = package_parser_parseExpression(parser);
            if (index && index.type == "ParseError") {
                return index;
            }
            let rbracket = package_parser_expect(parser, "RBRACKET");
            if (rbracket && rbracket.type == "ParseError") {
                return rbracket;
            }
            let accessNode = new package_parser_Node("ArrayAccess");
            accessNode.object = expr;
            accessNode.index = index;
            expr = accessNode;
        } else {
            break;
        }
    }
    return expr;
}
export function package_parser_parseAtomicExpression(parser) {
    if (parser.current_token.type == "NUMBER") {
        let value = parser.current_token.value;
        parser.advance();
        let node = new package_parser_Node("Number");
        node.value = value;
        return node;
    }
    if (parser.current_token.type == "STRING") {
        let value = parser.current_token.value;
        parser.advance();
        let node = new package_parser_Node("String");
        node.value = value;
        return node;
    }
    if (parser.current_token.type == "BOOLEAN") {
        let value = parser.current_token.value;
        parser.advance();
        let node = new package_parser_Node("Boolean");
        node.value = value;
        return node;
    }
    if (parser.current_token.type == "IDENTIFIER") {
        let name = parser.current_token.value;
        parser.advance();
        let node = new package_parser_Node("Identifier");
        node.name = name;
        return node;
    }
    if (parser.current_token.type == "SELF") {
        parser.advance();
        let node = new package_parser_Node("ThisExpression");
        return node;
    }
    if (parser.current_token.type == "NEW") {
        parser.advance();
        let className = package_parser_expect(parser, "IDENTIFIER");
        if (className && className.type == "ParseError") {
            return className;
        }
        let lparen = package_parser_expect(parser, "LPAREN");
        if (lparen && lparen.type == "ParseError") {
            return lparen;
        }
        let args = [];
        if (parser.current_token.type != "RPAREN") {
            let arg = package_parser_parseExpression(parser);
            if (arg && arg.type == "ParseError") {
                return arg;
            }
            args.push(arg);
            while (parser.current_token.type == "COMMA") {
                parser.advance();
                arg = package_parser_parseExpression(parser);
                if (arg && arg.type == "ParseError") {
                    return arg;
                }
                args.push(arg);
            }
        }
        let rparen = package_parser_expect(parser, "RPAREN");
        if (rparen && rparen.type == "ParseError") {
            return rparen;
        }
        let node = new package_parser_Node("NewExpression");
        node.className = className.value;
        node.arguments = args;
        return node;
    }
    if (parser.current_token.type == "LPAREN") {
        parser.advance();
        let expr = package_parser_parseExpression(parser);
        if (expr && expr.type == "ParseError") {
            return expr;
        }
        let rparen = package_parser_expect(parser, "RPAREN");
        if (rparen && rparen.type == "ParseError") {
            return rparen;
        }
        return expr;
    }
    if (parser.current_token.type == "LBRACKET") {
        parser.advance();
        let node = new package_parser_Node("ArrayLiteral");
        node.elements = [];
        if (parser.current_token.type != "RBRACKET") {
            let element = package_parser_parseExpression(parser);
            if (element && element.type == "ParseError") {
                return element;
            }
            node.elements.push(element);
            while (parser.current_token.type == "COMMA") {
                parser.advance();
                element = package_parser_parseExpression(parser);
                if (element && element.type == "ParseError") {
                    return element;
                }
                node.elements.push(element);
            }
        }
        let rbracket = package_parser_expect(parser, "RBRACKET");
        if (rbracket && rbracket.type == "ParseError") {
            return rbracket;
        }
        return node;
    }
    if (parser.current_token.type == "LBRACE") {
        parser.advance();
        let node = new package_parser_Node("ObjectLiteral");
        node.properties = [];
        if (parser.current_token.type != "RBRACE") {
            while (
                parser.current_token.type == "IDENTIFIER" ||
                parser.current_token.type == "STRING"
            ) {
                let key = parser.current_token.value;
                parser.advance();
                let colon = package_parser_expect(parser, "COLON");
                if (colon && colon.type == "ParseError") {
                    return colon;
                }
                let value = package_parser_parseExpression(parser);
                if (value && value.type == "ParseError") {
                    return value;
                }
                let propertyNode = new package_parser_Node("Property");
                propertyNode.key = key;
                propertyNode.value = value;
                node.properties.push(propertyNode);
                if (parser.current_token.type == "COMMA") {
                    parser.advance();
                } else {
                    break;
                }
            }
        }
        let rbrace = package_parser_expect(parser, "RBRACE");
        if (rbrace && rbrace.type == "ParseError") {
            return rbrace;
        }
        return node;
    }
    let error = {};
    error.type = "ParseError";
    error.message = "Expected expression but got " + parser.current_token.type;
    error.line = parser.current_token.line;
    error.column = parser.current_token.column;
    return error;
}
export function package_parser_parseTermParameters(parser) {
    let params = [];
    if (parser.current_token.type != "RPAREN") {
        let param = null;
        if (parser.current_token.type == "IDENTIFIER") {
            param = package_parser_expect(parser, "IDENTIFIER");
        } else if (parser.current_token.type == "SELF") {
            param = package_parser_expect(parser, "SELF");
        } else {
            param = package_parser_expect(parser, "IDENTIFIER");
        }
        if (param && param.type == "ParseError") {
            return param;
        }
        params.push(param.value);
        while (parser.current_token.type == "COMMA") {
            parser.advance();
            if (parser.current_token.type == "IDENTIFIER") {
                param = package_parser_expect(parser, "IDENTIFIER");
            } else if (parser.current_token.type == "SELF") {
                param = package_parser_expect(parser, "SELF");
            } else {
                param = package_parser_expect(parser, "IDENTIFIER");
            }
            if (param && param.type == "ParseError") {
                return param;
            }
            params.push(param.value);
        }
    }
    return params;
}
export function package_parser_parseStatement(parser) {
    if (parser.current_token.type == "EOF") {
        let error = {};
        error.type = "ParseError";
        error.message = "Unexpected EOF in statement";
        error.line = parser.current_token.line;
        error.column = parser.current_token.column;
        return error;
    }
    if (parser.current_token.type == "NAMESPACE") {
        return package_parser_parseNamespaceStatement(parser);
    }
    if (parser.current_token.type == "USING") {
        return package_parser_parseUsingStatement(parser);
    }
    if (parser.current_token.type == "ATTRIBUTE") {
        return package_parser_parseAttributeStatement(parser);
    }
    if (parser.current_token.type == "CLASS") {
        return package_parser_parseClassDeclaration(parser);
    }
    if (parser.current_token.type == "LET") {
        return package_parser_parseLetStatement(parser);
    }
    if (parser.current_token.type == "MICRO") {
        let nextIndex = parser.position + 1;
        if (
            nextIndex < parser.tokens.length &&
            parser.tokens[nextIndex].type == "IDENTIFIER"
        ) {
            let afterNameIndex = nextIndex + 1;
            if (
                afterNameIndex < parser.tokens.length &&
                parser.tokens[afterNameIndex].type == "LPAREN"
            ) {
                return package_parser_parseMicroFunctionDeclaration(parser);
            }
        }
        return package_parser_parseFunctionDeclaration(parser);
    }
    if (parser.current_token.type == "IF") {
        return package_parser_parseIfStatement(parser);
    }
    if (parser.current_token.type == "WHILE") {
        return package_parser_parseWhileStatement(parser);
    }
    if (parser.current_token.type == "RETURN") {
        return package_parser_parseReturnStatement(parser);
    }
    if (parser.current_token.type == "LBRACE") {
        return package_parser_parseFunctionBlock(parser);
    }
    let expr = package_parser_parseExpression(parser);
    if (expr && expr.type == "ParseError") {
        return expr;
    }
    let semicolon = package_parser_expect(parser, "SEMICOLON");
    if (semicolon && semicolon.type == "ParseError") {
        return semicolon;
    }
    let stmt = new package_parser_Node("ExpressionStatement");
    stmt.expression = expr;
    return stmt;
}
export function package_parser_parseLetStatement(parser) {
    parser.advance();
    let name = package_parser_expect(parser, "IDENTIFIER");
    if (name && name.type == "ParseError") {
        return name;
    }
    let assignToken = package_parser_expect(parser, "ASSIGN");
    if (assignToken && assignToken.type == "ParseError") {
        return assignToken;
    }
    let value = package_parser_parseExpression(parser);
    if (value && value.type == "ParseError") {
        return value;
    }
    let semicolon = package_parser_expect(parser, "SEMICOLON");
    if (semicolon && semicolon.type == "ParseError") {
        return semicolon;
    }
    let node = new package_parser_Node("LetStatement");
    node.name = name.value;
    node.value = value;
    return node;
}
export function package_parser_parseNamespaceStatement(parser) {
    parser.advance();
    let path = [];
    let isMainNamespace = false;
    if (parser.current_token.type == "BANG") {
        parser.advance();
        package_compiler_isMainNamespace = true;
    }
    let identifier = package_parser_expect(parser, "IDENTIFIER");
    if (identifier.type == "ParseError") {
        return identifier;
    }
    path.push(identifier.value);
    while (parser.current_token.type == "DOUBLE_COLON") {
        parser.advance();
        identifier = package_parser_expect(parser, "IDENTIFIER");
        if (identifier.type == "ParseError") {
            return identifier;
        }
        path.push(identifier.value);
    }
    let semicolon = package_parser_expect(parser, "SEMICOLON");
    if (semicolon.type == "ParseError") {
        return semicolon;
    }
    let node = new package_parser_Node("NamespaceStatement");
    node.path = path;
    node.isMainNamespace = package_compiler_isMainNamespace;
    return node;
}
export function package_parser_parseUsingStatement(parser) {
    parser.advance();
    let path = [];
    let identifier = package_parser_expect(parser, "IDENTIFIER");
    if (identifier.type == "ParseError") {
        return identifier;
    }
    path.push(identifier.value);
    while (parser.current_token.type == "DOUBLE_COLON") {
        parser.advance();
        identifier = package_parser_expect(parser, "IDENTIFIER");
        if (identifier.type == "ParseError") {
            return identifier;
        }
        path.push(identifier.value);
    }
    let semicolon = package_parser_expect(parser, "SEMICOLON");
    if (semicolon.type == "ParseError") {
        return semicolon;
    }
    let node = new package_parser_Node("UsingStatement");
    node.path = path;
    return node;
}
export function package_parser_parseAttributeStatement(parser) {
    parser.advance();
    let jsToken = package_parser_expect(parser, "IDENTIFIER");
    if (jsToken.type == "ParseError") {
        return jsToken;
    }
    if (jsToken.value != "js") {
        let error = {};
        error.type = "ParseError";
        error.message = "Expected 'js' after ↯";
        error.line = jsToken.line;
        error.column = jsToken.column;
        return error;
    }
    let lparen = package_parser_expect(parser, "LPAREN");
    if (lparen.type == "ParseError") {
        return lparen;
    }
    let modulePath = package_parser_expect(parser, "STRING");
    if (modulePath.type == "ParseError") {
        return modulePath;
    }
    let comma = package_parser_expect(parser, "COMMA");
    if (comma.type == "ParseError") {
        return comma;
    }
    let importName = package_parser_expect(parser, "STRING");
    if (importName.type == "ParseError") {
        return importName;
    }
    let rparen = package_parser_expect(parser, "RPAREN");
    if (rparen.type == "ParseError") {
        return rparen;
    }
    let microToken = package_parser_expect(parser, "MICRO");
    if (microToken.type == "ParseError") {
        return microToken;
    }
    let functionName = package_parser_expect(parser, "IDENTIFIER");
    if (functionName.type == "ParseError") {
        return functionName;
    }
    let paramLparen = package_parser_expect(parser, "LPAREN");
    if (paramLparen.type == "ParseError") {
        return paramLparen;
    }
    let parameters = [];
    if (parser.current_token.type != "RPAREN") {
        let param = package_parser_expect(parser, "IDENTIFIER");
        if (param.type == "ParseError") {
            return param;
        }
        parameters.push(param.value);
        while (parser.current_token.type == "COMMA") {
            parser.advance();
            param = package_parser_expect(parser, "IDENTIFIER");
            if (param.type == "ParseError") {
                return param;
            }
            parameters.push(param.value);
        }
    }
    let paramRparen = package_parser_expect(parser, "RPAREN");
    if (paramRparen.type == "ParseError") {
        return paramRparen;
    }
    let body = package_parser_parseStatement(parser);
    if (body.type == "ParseError") {
        return body;
    }
    let node = new package_parser_Node("JSAttributeStatement");
    node.modulePath = modulePath.value;
    node.importName = importName.value;
    node.functionName = functionName.value;
    node.parameters = parameters;
    node.body = body;
    return node;
}
export function package_parser_parseMicroFunctionDeclaration(parser) {
    parser.advance();
    let name = package_parser_expect(parser, "IDENTIFIER");
    if (name && name.type == "ParseError") {
        return name;
    }
    let lparen = package_parser_expect(parser, "LPAREN");
    if (lparen && lparen.type == "ParseError") {
        return lparen;
    }
    let params = package_parser_parseTermParameters(parser);
    if (params && params.type == "ParseError") {
        return params;
    }
    let rparen = package_parser_expect(parser, "RPAREN");
    if (rparen && rparen.type == "ParseError") {
        return rparen;
    }
    let body = package_parser_parseFunctionBlock(parser);
    if (body && body.type == "ParseError") {
        return body;
    }
    let node = new package_parser_Node("MicroDeclaration");
    node.name = name.value;
    node.parameters = params;
    node.body = body;
    return node;
}
export function package_parser_parseClassDeclaration(parser) {
    parser.advance();
    let name = package_parser_expect(parser, "IDENTIFIER");
    if (name && name.type == "ParseError") {
        return name;
    }
    let node = new package_parser_Node("ClassDeclaration");
    node.name = name.value;
    node.superClass = null;
    node.members = [];
    if (parser.current_token.type == "EXTENDS") {
        parser.advance();
        let superName = package_parser_expect(parser, "IDENTIFIER");
        if (superName && superName.type == "ParseError") {
            return superName;
        }
        node.superClass = superName.value;
    }
    let lbrace = package_parser_expect(parser, "LBRACE");
    if (lbrace && lbrace.type == "ParseError") {
        return lbrace;
    }
    while (
        parser.current_token.type != "RBRACE" &&
        parser.current_token.type != "EOF"
    ) {
        let member = package_parser_parseClassMember(parser);
        if (member && member.type != "ParseError") {
            node.members.push(member);
        } else if (member && member.type == "ParseError") {
            return member;
        }
    }
    let rbrace = package_parser_expect(parser, "RBRACE");
    if (rbrace && rbrace.type == "ParseError") {
        return rbrace;
    }
    return node;
}
export function package_parser_parseClassMember(parser) {
    if (parser.current_token.type == "CONSTRUCTOR") {
        parser.advance();
        let lparen = package_parser_expect(parser, "LPAREN");
        if (lparen && lparen.type == "ParseError") {
            return lparen;
        }
        let params = package_parser_parseTermParameters(parser);
        if (params && params.type == "ParseError") {
            return params;
        }
        let rparen = package_parser_expect(parser, "RPAREN");
        if (rparen && rparen.type == "ParseError") {
            return rparen;
        }
        let body = package_parser_parseFunctionBlock(parser);
        if (body && body.type == "ParseError") {
            return body;
        }
        let ctorNode = new package_parser_Node("ConstructorStatement");
        ctorNode.parameters = params;
        ctorNode.body = body;
        return ctorNode;
    }
    if (parser.current_token.type == "MICRO") {
        parser.advance();
        let name = package_parser_expect(parser, "IDENTIFIER");
        if (name && name.type == "ParseError") {
            return name;
        }
        let lparen = package_parser_expect(parser, "LPAREN");
        if (lparen && lparen.type == "ParseError") {
            return lparen;
        }
        let params = package_parser_parseTermParameters(parser);
        if (params && params.type == "ParseError") {
            return params;
        }
        let rparen = package_parser_expect(parser, "RPAREN");
        if (rparen && rparen.type == "ParseError") {
            return rparen;
        }
        let body = package_parser_parseFunctionBlock(parser);
        if (body && body.type == "ParseError") {
            return body;
        }
        let isInstanceMethod = false;
        let i = 0;
        while (i < params.length) {
            if (params[i] == "self") {
                isInstanceMethod = true;
                break;
            }
            i++;
        }
        let methodNode = new package_parser_Node("MemberStatement");
        methodNode.name = name.value;
        methodNode.parameters = params;
        methodNode.body = body;
        methodNode.isInstanceMethod = isInstanceMethod;
        methodNode.isStatic = !isInstanceMethod;
        return methodNode;
    }
    if (parser.current_token.type == "IDENTIFIER") {
        let nextIndex = parser.position + 1;
        if (nextIndex < parser.tokens.length) {
            let nextToken = parser.tokens[nextIndex];
            if (
                package_lexer_nextToken.type == "ASSIGN" ||
                package_lexer_nextToken.type == "SEMICOLON"
            ) {
                let name = package_parser_expect(parser, "IDENTIFIER");
                if (name && name.type == "ParseError") {
                    return name;
                }
                let initValue = null;
                if (parser.current_token.type == "ASSIGN") {
                    parser.advance();
                    initValue = package_parser_parseExpression(parser);
                    if (initValue && initValue.type == "ParseError") {
                        return initValue;
                    }
                }
                let semicolon = package_parser_expect(parser, "SEMICOLON");
                if (semicolon && semicolon.type == "ParseError") {
                    return semicolon;
                }
                let node = new package_parser_Node("Property");
                node.name = name.value;
                node.initializer = initValue;
                return node;
            }
        }
    }
    let error = {};
    error.type = "ParseError";
    error.message =
        "Expected class member (field or method) but got " +
        parser.current_token.type;
    error.line = parser.current_token.line;
    error.column = parser.current_token.column;
    return error;
}
export function package_parser_parseFunctionDeclaration(parser) {
    parser.advance();
    let name = package_parser_expect(parser, "IDENTIFIER");
    if (name && name.type == "ParseError") {
        return name;
    }
    let lparen = package_parser_expect(parser, "LPAREN");
    if (lparen && lparen.type == "ParseError") {
        return lparen;
    }
    let params = package_parser_parseTermParameters(parser);
    if (params && params.type == "ParseError") {
        return params;
    }
    let rparen = package_parser_expect(parser, "RPAREN");
    if (rparen && rparen.type == "ParseError") {
        return rparen;
    }
    let body = package_parser_parseFunctionBlock(parser);
    if (body && body.type == "ParseError") {
        return body;
    }
    let node = new package_parser_Node("MicroDeclaration");
    node.name = name.value;
    node.parameters = params;
    node.body = body;
    return node;
}
export function package_parser_parseIfStatement(parser) {
    parser.advance();
    let condition = package_parser_parseExpression(parser);
    if (condition && condition.type == "ParseError") {
        return condition;
    }
    let thenBranch = package_parser_parseStatement(parser);
    if (thenBranch && thenBranch.type == "ParseError") {
        return thenBranch;
    }
    let node = new package_parser_Node("IfStatement");
    node.condition = condition;
    node.thenBranch = thenBranch;
    node.elseBranch = null;
    if (parser.current_token.type == "ELSE") {
        parser.advance();
        let elseBranch = package_parser_parseStatement(parser);
        if (elseBranch && elseBranch.type == "ParseError") {
            return elseBranch;
        }
        node.elseBranch = elseBranch;
    }
    return node;
}
export function package_parser_parseWhileStatement(parser) {
    parser.advance();
    let condition = package_parser_parseExpression(parser);
    if (condition && condition.type == "ParseError") {
        return condition;
    }
    let body = package_parser_parseFunctionBlock(parser);
    if (body && body.type == "ParseError") {
        return body;
    }
    let node = new package_parser_Node("WhileStatement");
    node.condition = condition;
    node.body = body;
    return node;
}
export function package_parser_parseReturnStatement(parser) {
    parser.advance();
    let node = new package_parser_Node("ReturnStatement");
    if (parser.current_token.type == "SEMICOLON") {
        node.value = null;
    } else {
        let value = package_parser_parseExpression(parser);
        if (value && value.type == "ParseError") {
            return value;
        }
        node.value = value;
    }
    let semicolon = package_parser_expect(parser, "SEMICOLON");
    if (semicolon && semicolon.type == "ParseError") {
        return semicolon;
    }
    return node;
}
export function package_parser_parseFunctionBlock(parser) {
    let lbrace = package_parser_expect(parser, "LBRACE");
    if (lbrace && lbrace.type == "ParseError") {
        return lbrace;
    }
    let statements = [];
    while (
        parser.current_token.type != "RBRACE" &&
        parser.current_token.type != "EOF"
    ) {
        let stmt = package_parser_parseStatement(parser);
        if (stmt && stmt.type == "ParseError") {
            return stmt;
        }
        statements.push(stmt);
    }
    let rbrace = package_parser_expect(parser, "RBRACE");
    if (rbrace && rbrace.type == "ParseError") {
        return rbrace;
    }
    let node = new package_parser_Node("Block");
    node.statements = statements;
    return node;
}
export function package_parser_parseProgram(parser) {
    let statements = [];
    while (parser.current_token.type != "EOF") {
        let stmt = package_parser_parseStatement(parser);
        if (stmt && stmt.type == "ParseError") {
            return stmt;
        }
        statements.push(stmt);
    }
    let node = new package_parser_Node("Program");
    node.statements = statements;
    return node;
}
export function package_parser_parse(tokens) {
    let parser = new package_parser_ValkyrieParser(tokens);
    return package_parser_parseProgram(parser);
}
class package_lexer_ValkyrieLexer {
    constructor(source) {
        this.source = source;
        this.position = 0;
        this.line = 1;
        this.column = 1;
        this.current_char = "";
        if (source.length > 0) {
            this.current_char = source.charAt(0);
        }
    }

    advance() {
        if (this.current_char == "\n") {
            this.line = this.line + 1;
            this.column = 1;
        } else {
            this.column = this.column + 1;
        }
        this.position = this.position + 1;
        if (this.position >= this.source.length) {
            this.current_char = "";
        } else {
            this.current_char = this.source.charAt(this.position);
        }
    }
}
class package_lexer_Token {
    constructor(type, value, line, column) {
        this.type = type;
        this.value = value;
        this.line = line;
        this.column = column;
    }
}
class package_parser_ValkyrieParser {
    constructor(tokens) {
        this.tokens = tokens;
        this.position = 0;
        this.current_token = tokens[0];
    }

    advance() {
        this.position = this.position + 1;
        if (this.position < this.tokens.length) {
            this.current_token = this.tokens[this.position];
        } else {
            this.current_token = {};
            this.current_token.type = "EOF";
        }
    }
}
class package_parser_Node {
    constructor(type) {
        this.type = type;
    }
}
