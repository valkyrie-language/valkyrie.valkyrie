export function package_codegen_joinPath(pathArray, separator) {
    let result = "";
    let i = 0;
    while (i < pathArray.length) {
        if (i > 0) {
            result = result + separator;
        }
        result = result + pathArray[i];
        i = i + 1;
    }
    return result;
}
export function package_codegen_replaceAll(str, search, replace) {
    let result = "";
    let i = 0;
    while (i < str.length) {
        if (str[i] == search) {
            result = result + replace;
            i = i + search.length;
        } else {
            result = result + str[i];
            i = i + 1;
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
        result = result + left;
        result = result + " ";
        result = result + node.operator;
        result = result + " ";
        result = result + right;
        result = result + ")";
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
        let i = 0;
        while (i < node.arguments.length) {
            if (i > 0) {
                args = args + ", ";
            }
            args = args + package_codegen_generateExpression(node.arguments[i]);
            i = i + 1;
        }
        if (node.closure) {
            let closureParams = "";
            let closureBody = "";
            if (node.closure) {
                closureBody = package_codegen_generateStatement(node.closure);
            }
            if (args.length > 0) {
                args = args + ", ";
            }
            args = args + "function(" + closureParams + ") " + closureBody;
        }
        return callee + "(" + args + ")";
    }
    if (node.type == "AnonymousFunction") {
        let params = "";
        let i = 0;
        while (i < node.parameters.length) {
            if (i > 0) {
                params = params + ", ";
            }
            let param = node.parameters[i];
            if (param && param.name) {
                params = params + param.name;
            } else {
                params = params + param;
            }
            i = i + 1;
        }
        let body = "";
        if (node.body) {
            body = package_codegen_generateStatement(node.body);
        }
        return "function(" + params + ") " + body;
    }
    if (node.type == "NewExpression") {
        let args = "";
        let i = 0;
        while (i < node.arguments.length) {
            if (i > 0) {
                args = args + ", ";
            }
            args = args + package_codegen_generateExpression(node.arguments[i]);
            i = i + 1;
        }
        let className = node.className;
        if (node.resolvedClassName) {
            className = node.resolvedClassName;
        }
        return "new " + className + "(" + args + ")";
    }
    if (node.type == "AwaitExpression") {
        let argument = package_codegen_generateExpression(node.argument);
        return "await " + argument;
    }
    if (node.type == "PropertyAccess") {
        if (node.object.type) {
            let obj = package_codegen_generateExpression(node.object);
            return obj + "." + node.property;
        } else {
            return node.object + "." + node.property;
        }
    }
    if (node.type == "StaticMethodCall") {
        let className = "";
        if (node.namespacePath) {
            if (node.namespacePath.length >= 2) {
                className = node.namespacePath[node.namespacePath.length - 2];
            } else {
                className = node.namespacePath[0];
            }
        } else if (node.className.type) {
            className = package_codegen_generateExpression(node.className);
        } else {
            className = node.className;
        }
        let args = "";
        let i = 0;
        while (i < node.arguments.length) {
            if (i > 0) {
                args = args + ", ";
            }
            args = args + package_codegen_generateExpression(node.arguments[i]);
            i = i + 1;
        }
        return className + "." + node.methodName + "(" + args + ")";
    }
    if (node.type == "StaticPropertyAccess") {
        let className = "";
        if (node.namespacePath) {
            if (node.namespacePath.length >= 2) {
                className = node.namespacePath[node.namespacePath.length - 2];
            } else {
                className = node.namespacePath[0];
            }
        } else if (node.className.type) {
            className = package_codegen_generateExpression(node.className);
        } else {
            className = node.className;
        }
        return className + "." + node.property;
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
                result = result + ", ";
            }
            result =
                result +
                '"' +
                prop.key +
                '": ' +
                package_codegen_generateExpression(prop.value);
            i = i + 1;
        }
        result = result + "}";
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
            let param = node.parameters[i];
            if (param && param.name) {
                params = params + param.name;
            } else {
                params = params + param;
            }
            i = i + 1;
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
            let param = node.parameters[i];
            if (param && param.name) {
                params = params + param.name;
            } else {
                params = params + param;
            }
            i = i + 1;
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
            result = result + " else " + elseBranch;
        }
        return result;
    }
    if (node.type == "WhileStatement") {
        let condition = package_codegen_generateExpression(node.condition);
        let body = package_codegen_generateStatement(node.body);
        return "while (" + condition + ") " + body;
    }
    if (node.type == "UntilStatement") {
        let condition = package_codegen_generateExpression(node.condition);
        let body = package_codegen_generateStatement(node.body);
        return "while (!(" + condition + ")) " + body;
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
            i = i + 1;
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
            i = i + 1;
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
            result = result + " extends " + superClass;
        }
        result = result + " {\n";
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
            i = i + 1;
        }
        if (hasExplicitConstructor) {
            let params = "";
            let j = 0;
            while (j < explicitConstructor.parameters.length) {
                if (j > 0) {
                    params = params + ", ";
                }
                let param = explicitConstructor.parameters[j];
                if (param && param.name) {
                    params = params + param.name;
                } else {
                    params = params + param;
                }
                j = j + 1;
            }
            result = result + "  constructor(" + params + ") {\n";
            if (superClass) {
                result = result + "    super();\n";
            }
            result = result + fieldInits;
            let ctorBody = package_codegen_generateStatement(
                explicitConstructor.body
            );
            if (ctorBody.startsWith("{\n") && ctorBody.endsWith("\n}")) {
                ctorBody = ctorBody.substring(2, ctorBody.length - 2);
            }
            result = result + ctorBody;
            result = result + "  }\n\n";
        } else if (fieldInits != "") {
            result = result + "  constructor() {\n";
            if (superClass) {
                result = result + "    super();\n";
            }
            result = result + fieldInits;
            result = result + "  }\n\n";
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
                    let param = member.parameters[j];
                    let paramName = "";
                    if (param && param.name) {
                        paramName = param.name;
                    } else {
                        paramName = param;
                    }
                    if (paramName != "self") {
                        if (paramCount > 0) {
                            params = params + ", ";
                        }
                        params = params + paramName;
                        paramCount = paramCount + 1;
                    }
                    j = j + 1;
                }
                let body = package_codegen_generateStatement(member.body);
                if (member.isStatic) {
                    result =
                        result +
                        "  static " +
                        methodName +
                        "(" +
                        params +
                        ") " +
                        body +
                        "\n\n";
                } else {
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
            }
            i = i + 1;
        }
        result = result + "}";
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
            result = result + package_codegen_generateStatement(stmt) + "\n";
            i = i + 1;
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
export function package_compiler_topological_sort(analyzer, file_contents) {
    let file_names = Object.keys(file_contents);
    let visited = {};
    let sorted = [];
    let i = 0;
    while (i < file_names.length) {
        visited[file_names[i]] = false;
        i = i + 1;
    }
    let j = 0;
    while (j < file_names.length) {
        package_compiler_simple_dfs_visit(
            file_names[j],
            analyzer,
            visited,
            sorted
        );
        j = j + 1;
    }
    return { sorted: sorted, error: null };
}
export function package_compiler_compile_asts(file_contents, mode) {
    return package_compiler_compile_asts_with_options(
        file_contents,
        mode,
        null
    );
}
export function package_compiler_compile_asts_with_options(
    file_contents,
    mode,
    options
) {
    let manager = new package_compiler_NamespaceManager();
    package_compiler_set_compile_mode(manager, mode || "repl");
    let analyzer = new package_compiler_DependencyAnalyzer();
    let file_names = Object.keys(file_contents);
    let i = 0;
    while (i < file_names.length) {
        let file_name = file_names[i];
        let content = file_contents[file_name];
        analyzer.dependencies[file_name] = [];
        let lexer_instance = new package_lexer_ValkyrieLexer(content);
        let tokens = lexer_instance.tokenize();
        if (tokens.length > 0) {
            let ast = package_parser_parse(tokens);
            if (ast.type == "Program") {
                let j = 0;
                while (j < ast.statements.length) {
                    let stmt = ast.statements[j];
                    if (stmt.type == "UsingStatement") {
                        let using_path = package_compiler_join_path(
                            stmt.path,
                            "::"
                        );
                        let provider_file =
                            package_compiler_find_namespace_provider(
                                using_path,
                                file_contents
                            );
                        if (
                            provider_file != null &&
                            provider_file != file_name
                        ) {
                            analyzer.dependencies[file_name].push(
                                provider_file
                            );
                        }
                    }
                    j = j + 1;
                }
            }
        }
        i = i + 1;
    }
    let sort_result = package_compiler_topological_sort(
        analyzer,
        file_contents
    );
    if (sort_result.error != null) {
        return { success: false, error: sort_result.error };
    }
    let sorted_files = sort_result.sorted;
    let js_import_statements = [];
    let variable_statements = [];
    let function_statements = [];
    let class_statements = [];
    let execution_statements = [];
    let k = 0;
    while (k < sorted_files.length) {
        let file_name = sorted_files[k];
        let content = file_contents[file_name];
        manager.current_file = file_name;
        let lexer_instance = new package_lexer_ValkyrieLexer(content);
        let tokens = lexer_instance.tokenize();
        if (tokens.length == 0) {
            k = k + 1;
            continue;
        }
        let ast = package_parser_parse(tokens);
        if (ast.type != "Program") {
            return {
                success: false,
                error:
                    "Failed to parse " +
                    file_name +
                    " at " +
                    JSON.stringify(ast),
            };
        }
        let validation_result = package_compiler_validate_namespace_rules(
            ast,
            mode
        );
        if (!validation_result.success) {
            return validation_result;
        }
        let current_namespace = "";
        let l = 0;
        while (l < ast.statements.length) {
            let stmt = ast.statements[l];
            if (stmt.type == "NamespaceStatement") {
                current_namespace = package_compiler_join_path(stmt.path, "::");
                if (stmt.isMainNamespace) {
                    current_namespace = current_namespace + "!";
                    if (mode == "standard") {
                        console.log("🔍 检查主命名空间: " + current_namespace);
                        console.log(
                            "📋 当前管理器中的命名空间: " +
                                Object.keys(manager.namespaces).join(", ")
                        );
                        if (manager.namespaces[current_namespace] != null) {
                            let clean_name = current_namespace.substring(
                                0,
                                current_namespace.length - 1
                            );
                            console.log(
                                "❌ 发现重复的主命名空间: " + clean_name
                            );
                            return {
                                success: false,
                                error:
                                    "Duplicate main namespace '" +
                                    clean_name +
                                    "' found. Each main namespace must have a unique name.",
                            };
                        } else {
                            console.log(
                                "✅ 主命名空间检查通过: " + current_namespace
                            );
                        }
                    }
                }
                manager.current_namespace = current_namespace;
            } else if (stmt.type == "UsingStatement") {
                let using_path = package_compiler_join_path(stmt.path, "::");
                let is_global = package_compiler_is_main_namespace(using_path);
                package_compiler_add_using_import(
                    manager,
                    using_path,
                    is_global
                );
            } else if (stmt.type == "JSImportStatement") {
                js_import_statements.push(stmt);
            } else if (stmt.type == "LetStatement") {
                stmt.sourceNamespace = current_namespace;
                variable_statements.push(stmt);
                package_compiler_add_symbol_to_namespace(
                    manager,
                    current_namespace,
                    stmt.name,
                    "variable",
                    stmt,
                    file_name
                );
            } else if (stmt.type == "MicroDeclaration") {
                stmt.sourceNamespace = current_namespace;
                function_statements.push(stmt);
                package_compiler_add_symbol_to_namespace(
                    manager,
                    current_namespace,
                    stmt.name,
                    "function",
                    stmt,
                    file_name
                );
            } else if (stmt.type == "ClassDeclaration") {
                stmt.sourceNamespace = current_namespace;
                class_statements.push(stmt);
                package_compiler_add_symbol_to_namespace(
                    manager,
                    current_namespace,
                    stmt.name,
                    "class",
                    stmt,
                    file_name
                );
            } else {
                execution_statements.push(stmt);
            }
            l = l + 1;
        }
        k = k + 1;
    }
    if (mode == "standard") {
        let main_namespaces = [];
        let main_namespace_names = [];
        let namespace_keys = Object.keys(manager.namespaces);
        let ns_index = 0;
        while (ns_index < namespace_keys.length) {
            let ns_name = namespace_keys[ns_index];
            if (ns_name.endsWith("!")) {
                main_namespaces.push(ns_name);
                let clean_name = ns_name.substring(0, ns_name.length - 1);
                main_namespace_names.push(clean_name);
            }
            ns_index = ns_index + 1;
        }
        let duplicate_index = 0;
        while (duplicate_index < main_namespace_names.length) {
            let current_name = main_namespace_names[duplicate_index];
            let check_index = duplicate_index + 1;
            while (check_index < main_namespace_names.length) {
                if (main_namespace_names[check_index] == current_name) {
                    return {
                        success: false,
                        error:
                            "Duplicate main namespace '" +
                            current_name +
                            "' found. Each main namespace must have a unique name.",
                    };
                }
                check_index = check_index + 1;
            }
            duplicate_index = duplicate_index + 1;
        }
    }
    let m = 0;
    while (m < function_statements.length) {
        let func_stmt = function_statements[m];
        func_stmt.uniqueName = package_compiler_get_fully_qualified_name(
            manager,
            func_stmt.name,
            func_stmt.sourceNamespace
        );
        m = m + 1;
    }
    let n = 0;
    while (n < class_statements.length) {
        let class_stmt = class_statements[n];
        class_stmt.uniqueName = package_compiler_get_fully_qualified_name(
            manager,
            class_stmt.name,
            class_stmt.sourceNamespace
        );
        n = n + 1;
    }
    let o = 0;
    while (o < variable_statements.length) {
        let var_stmt = variable_statements[o];
        var_stmt.uniqueName = package_compiler_get_fully_qualified_name(
            manager,
            var_stmt.name,
            var_stmt.sourceNamespace
        );
        o = o + 1;
    }
    let integrated_ast = { type: "Program", statements: [] };
    let p = 0;
    while (p < js_import_statements.length) {
        integrated_ast.statements.push(js_import_statements[p]);
        p = p + 1;
    }
    let q = 0;
    while (q < variable_statements.length) {
        let var_stmt = variable_statements[q];
        if (
            var_stmt.uniqueName != null &&
            var_stmt.uniqueName != var_stmt.name
        ) {
            let modified_stmt = Object.assign({}, var_stmt);
            modified_stmt.name = var_stmt.uniqueName;
            integrated_ast.statements.push(modified_stmt);
        } else {
            integrated_ast.statements.push(var_stmt);
        }
        q = q + 1;
    }
    let r = 0;
    while (r < function_statements.length) {
        let func_stmt = function_statements[r];
        if (
            func_stmt.uniqueName != null &&
            func_stmt.uniqueName != func_stmt.name
        ) {
            let modified_stmt = Object.assign({}, func_stmt);
            modified_stmt.name = func_stmt.uniqueName;
            modified_stmt.body =
                package_compiler_resolve_identifiers_in_statement_with_options(
                    func_stmt.body,
                    manager,
                    function_statements,
                    variable_statements,
                    class_statements,
                    options
                );
            integrated_ast.statements.push(modified_stmt);
        } else {
            let modified_stmt = Object.assign({}, func_stmt);
            modified_stmt.body =
                package_compiler_resolve_identifiers_in_statement_with_options(
                    func_stmt.body,
                    manager,
                    function_statements,
                    variable_statements,
                    class_statements,
                    options
                );
            integrated_ast.statements.push(modified_stmt);
        }
        r = r + 1;
    }
    let s = 0;
    while (s < class_statements.length) {
        let class_stmt = class_statements[s];
        let modified_stmt = Object.assign({}, class_stmt);
        if (
            class_stmt.uniqueName != null &&
            class_stmt.uniqueName != class_stmt.name
        ) {
            modified_stmt.name = class_stmt.uniqueName;
        }
        if (class_stmt.members != null) {
            let resolved_members = [];
            let m = 0;
            while (m < class_stmt.members.length) {
                let member = class_stmt.members[m];
                let resolved_member = Object.assign({}, member);
                if (
                    (member.type == "MemberStatement" ||
                        member.type == "ConstructorStatement") &&
                    member.body != null
                ) {
                    resolved_member.body =
                        package_compiler_resolve_identifiers_in_statement_with_options(
                            member.body,
                            manager,
                            function_statements,
                            variable_statements,
                            class_statements,
                            options
                        );
                }
                resolved_members.push(resolved_member);
                m = m + 1;
            }
            modified_stmt.members = resolved_members;
        }
        integrated_ast.statements.push(modified_stmt);
        s = s + 1;
    }
    let t = 0;
    while (t < execution_statements.length) {
        let resolved_stmt =
            package_compiler_resolve_identifiers_in_statement_with_options(
                execution_statements[t],
                manager,
                function_statements,
                variable_statements,
                class_statements,
                options
            );
        integrated_ast.statements.push(resolved_stmt);
        t = t + 1;
    }
    let generated = package_codegen_generate(integrated_ast);
    return { success: true, code: generated, error: null };
}
export function package_compiler_resolve_multiple_namespaces(ast) {
    let manager = new package_compiler_NamespaceManager();
    let i = 0;
    while (i < ast.statements.length) {
        let stmt = ast.statements[i];
        if (stmt.type == "NamespaceStatement") {
            let namespace_path = package_compiler_join_path(stmt.path, "::");
            if (stmt.isMainNamespace) {
                namespace_path = namespace_path + "!";
            }
            manager.current_namespace = namespace_path;
        } else if (stmt.type == "UsingStatement") {
            let using_path = package_compiler_join_path(stmt.path, "::");
            let is_global = package_compiler_is_main_namespace(using_path);
            package_compiler_add_using_import(manager, using_path, is_global);
        } else if (stmt.type == "MicroDeclaration") {
            package_compiler_add_symbol_to_namespace(
                manager,
                manager.current_namespace,
                stmt.name,
                "function",
                stmt,
                manager.current_file
            );
        } else if (stmt.type == "ClassDeclaration") {
            package_compiler_add_symbol_to_namespace(
                manager,
                manager.current_namespace,
                stmt.name,
                "class",
                stmt,
                manager.current_file
            );
        } else if (stmt.type == "LetStatement") {
            package_compiler_add_symbol_to_namespace(
                manager,
                manager.current_namespace,
                stmt.name,
                "variable",
                stmt,
                manager.current_file
            );
        }
        i = i + 1;
    }
    let j = 0;
    while (j < ast.statements.length) {
        let stmt = ast.statements[j];
        if (stmt.type == "MicroDeclaration") {
            stmt.uniqueName = package_compiler_get_fully_qualified_name(
                manager,
                stmt.name,
                manager.current_namespace
            );
        } else if (stmt.type == "ClassDeclaration") {
            stmt.uniqueName = package_compiler_get_fully_qualified_name(
                manager,
                stmt.name,
                manager.current_namespace
            );
        } else if (stmt.type == "LetStatement") {
            stmt.uniqueName = package_compiler_get_fully_qualified_name(
                manager,
                stmt.name,
                manager.current_namespace
            );
        }
        j = j + 1;
    }
    return ast;
}
export function package_compiler_resolve_symbol(
    manager,
    symbol_name,
    current_namespace,
    current_file
) {
    let current_namespace_data = manager.namespaces[current_namespace];
    if (
        current_namespace_data != null &&
        current_namespace_data.symbols != null
    ) {
        let symbol = current_namespace_data.symbols[symbol_name];
        if (symbol != null) {
            return {
                found: true,
                symbol: symbol,
                namespace: current_namespace,
            };
        }
    }
    let file_usings = manager.usings[current_file];
    if (file_usings != null) {
        let i = 0;
        while (i < file_usings.length) {
            let using_info = file_usings[i];
            let using_namespace = using_info["namespace"];
            let using_namespace_data = manager.namespaces[using_namespace];
            if (
                using_namespace_data != null &&
                using_namespace_data.symbols != null
            ) {
                let symbol = using_namespace_data.symbols[symbol_name];
                if (symbol != null) {
                    return {
                        found: true,
                        symbol: symbol,
                        namespace: using_namespace,
                    };
                }
            }
            i = i + 1;
        }
    }
    let global_namespace_data = manager.namespaces[""];
    if (
        global_namespace_data != null &&
        global_namespace_data.symbols != null
    ) {
        let symbol = global_namespace_data.symbols[symbol_name];
        if (symbol != null) {
            return { found: true, symbol: symbol, namespace: "" };
        }
    }
    return { found: false, symbol: null, namespace: null };
}
export function package_compiler_resolve_identifiers_in_expression(
    expr,
    manager,
    function_statements,
    variable_statements,
    class_statements
) {
    return package_compiler_resolve_identifiers_in_expression_with_options(
        expr,
        manager,
        function_statements,
        variable_statements,
        class_statements,
        null
    );
}
export function package_compiler_resolve_identifiers_in_expression_with_options(
    expr,
    manager,
    function_statements,
    variable_statements,
    class_statements,
    options
) {
    if (expr == null) {
        return expr;
    }
    if (expr.type == "Identifier") {
        let i = 0;
        while (i < function_statements.length) {
            let func_stmt = function_statements[i];
            if (func_stmt.name == expr.name && func_stmt.uniqueName != null) {
                let resolved_expr = Object.assign({}, expr);
                resolved_expr.name = func_stmt.uniqueName;
                return resolved_expr;
            }
            i = i + 1;
        }
        let j = 0;
        while (j < variable_statements.length) {
            let var_stmt = variable_statements[j];
            if (var_stmt.name == expr.name && var_stmt.uniqueName != null) {
                let resolved_expr = Object.assign({}, expr);
                resolved_expr.name = var_stmt.uniqueName;
                return resolved_expr;
            }
            j = j + 1;
        }
        return expr;
    }
    if (expr.type == "MicroCall") {
        let resolved_expr = Object.assign({}, expr);
        if (expr.callee.type == "Identifier") {
            let function_name = expr.callee.name;
            let found_function = false;
            let i = 0;
            while (i < function_statements.length) {
                let func_stmt = function_statements[i];
                if (
                    func_stmt.name == function_name &&
                    func_stmt.uniqueName != null
                ) {
                    let resolved_callee = Object.assign({}, expr.callee);
                    resolved_callee.name = func_stmt.uniqueName;
                    resolved_expr.callee = resolved_callee;
                    found_function = true;
                    break;
                }
                i = i + 1;
            }
            if (
                !found_function &&
                options != null &&
                options.implicit_member_call == "warning"
            ) {
                let k = 0;
                while (k < class_statements.length) {
                    let class_stmt = class_statements[k];
                    if (class_stmt.members != null) {
                        let m = 0;
                        while (m < class_stmt.members.length) {
                            let member = class_stmt.members[m];
                            if (
                                member.type == "MemberStatement" &&
                                member.name == function_name
                            ) {
                                let warning = package_compiler_create_warning(
                                    "Implicit member call detected for '" +
                                        function_name +
                                        "'. Consider using 'Self::" +
                                        function_name +
                                        "()' for static methods or 'self." +
                                        function_name +
                                        "()' for instance methods.",
                                    expr.line || 0,
                                    expr.column || 0
                                );
                                package_compiler_report_warning(warning);
                                break;
                            }
                            m = m + 1;
                        }
                    }
                    k = k + 1;
                }
            }
            if (!found_function) {
                resolved_expr.callee =
                    package_compiler_resolve_identifiers_in_expression_with_options(
                        expr.callee,
                        manager,
                        function_statements,
                        variable_statements,
                        class_statements,
                        options
                    );
            }
        } else {
            resolved_expr.callee =
                package_compiler_resolve_identifiers_in_expression_with_options(
                    expr.callee,
                    manager,
                    function_statements,
                    variable_statements,
                    class_statements,
                    options
                );
        }
        let resolved_args = [];
        let k = 0;
        while (k < expr.arguments.length) {
            resolved_args.push(
                package_compiler_resolve_identifiers_in_expression_with_options(
                    expr.arguments[k],
                    manager,
                    function_statements,
                    variable_statements,
                    class_statements,
                    options
                )
            );
            k = k + 1;
        }
        resolved_expr.arguments = resolved_args;
        return resolved_expr;
    }
    if (expr.type == "BinaryOp") {
        let resolved_expr = Object.assign({}, expr);
        resolved_expr.left =
            package_compiler_resolve_identifiers_in_expression_with_options(
                expr.left,
                manager,
                function_statements,
                variable_statements,
                class_statements,
                options
            );
        resolved_expr.right =
            package_compiler_resolve_identifiers_in_expression_with_options(
                expr.right,
                manager,
                function_statements,
                variable_statements,
                class_statements,
                options
            );
        return resolved_expr;
    }
    if (expr.type == "Assignment") {
        let resolved_expr = Object.assign({}, expr);
        resolved_expr.left =
            package_compiler_resolve_identifiers_in_expression_with_options(
                expr.left,
                manager,
                function_statements,
                variable_statements,
                class_statements,
                options
            );
        resolved_expr.right =
            package_compiler_resolve_identifiers_in_expression_with_options(
                expr.right,
                manager,
                function_statements,
                variable_statements,
                class_statements,
                options
            );
        return resolved_expr;
    }
    if (expr.type == "PropertyAccess") {
        let resolved_expr = Object.assign({}, expr);
        resolved_expr.object =
            package_compiler_resolve_identifiers_in_expression_with_options(
                expr.object,
                manager,
                function_statements,
                variable_statements,
                class_statements,
                options
            );
        return resolved_expr;
    }
    if (expr.type == "NewExpression") {
        let resolved_expr = Object.assign({}, expr);
        let m = 0;
        while (m < class_statements.length) {
            let class_stmt = class_statements[m];
            if (
                class_stmt.name == expr.className &&
                class_stmt.uniqueName != null
            ) {
                resolved_expr.className = class_stmt.uniqueName;
                break;
            }
            m = m + 1;
        }
        let resolved_args = [];
        if (expr.arguments != null) {
            let n = 0;
            while (n < expr.arguments.length) {
                resolved_args.push(
                    package_compiler_resolve_identifiers_in_expression_with_options(
                        expr.arguments[n],
                        manager,
                        function_statements,
                        variable_statements,
                        class_statements,
                        options
                    )
                );
                n = n + 1;
            }
        }
        resolved_expr.arguments = resolved_args;
        return resolved_expr;
    }
    return expr;
}
export function package_compiler_resolve_identifiers_in_statement(
    stmt,
    manager,
    function_statements,
    variable_statements,
    class_statements
) {
    return package_compiler_resolve_identifiers_in_statement_with_options(
        stmt,
        manager,
        function_statements,
        variable_statements,
        class_statements,
        null
    );
}
export function package_compiler_resolve_identifiers_in_statement_with_options(
    stmt,
    manager,
    function_statements,
    variable_statements,
    class_statements,
    options
) {
    if (stmt == null) {
        return stmt;
    }
    if (stmt.type == "LetStatement") {
        let resolved_stmt = Object.assign({}, stmt);
        resolved_stmt.value =
            package_compiler_resolve_identifiers_in_expression_with_options(
                stmt.value,
                manager,
                function_statements,
                variable_statements,
                class_statements,
                options
            );
        return resolved_stmt;
    }
    if (stmt.type == "ExpressionStatement") {
        let resolved_stmt = Object.assign({}, stmt);
        resolved_stmt.expression =
            package_compiler_resolve_identifiers_in_expression_with_options(
                stmt.expression,
                manager,
                function_statements,
                variable_statements,
                class_statements,
                options
            );
        return resolved_stmt;
    }
    if (stmt.type == "ReturnStatement") {
        let resolved_stmt = Object.assign({}, stmt);
        if (stmt.value != null) {
            resolved_stmt.value =
                package_compiler_resolve_identifiers_in_expression_with_options(
                    stmt.value,
                    manager,
                    function_statements,
                    variable_statements,
                    class_statements,
                    options
                );
        }
        return resolved_stmt;
    }
    if (stmt.type == "IfStatement") {
        let resolved_stmt = Object.assign({}, stmt);
        resolved_stmt.condition =
            package_compiler_resolve_identifiers_in_expression_with_options(
                stmt.condition,
                manager,
                function_statements,
                variable_statements,
                class_statements,
                options
            );
        resolved_stmt.thenBranch =
            package_compiler_resolve_identifiers_in_statement_with_options(
                stmt.thenBranch,
                manager,
                function_statements,
                variable_statements,
                class_statements,
                options
            );
        if (stmt.elseBranch != null) {
            resolved_stmt.elseBranch =
                package_compiler_resolve_identifiers_in_statement_with_options(
                    stmt.elseBranch,
                    manager,
                    function_statements,
                    variable_statements,
                    class_statements,
                    options
                );
        }
        return resolved_stmt;
    }
    if (stmt.type == "WhileStatement") {
        let resolved_stmt = Object.assign({}, stmt);
        resolved_stmt.condition =
            package_compiler_resolve_identifiers_in_expression_with_options(
                stmt.condition,
                manager,
                function_statements,
                variable_statements,
                class_statements,
                options
            );
        resolved_stmt.body =
            package_compiler_resolve_identifiers_in_statement_with_options(
                stmt.body,
                manager,
                function_statements,
                variable_statements,
                class_statements,
                options
            );
        return resolved_stmt;
    }
    if (stmt.type == "UntilStatement") {
        let resolved_stmt = Object.assign({}, stmt);
        resolved_stmt.condition =
            package_compiler_resolve_identifiers_in_expression_with_options(
                stmt.condition,
                manager,
                function_statements,
                variable_statements,
                class_statements,
                options
            );
        resolved_stmt.body =
            package_compiler_resolve_identifiers_in_statement_with_options(
                stmt.body,
                manager,
                function_statements,
                variable_statements,
                class_statements,
                options
            );
        return resolved_stmt;
    }
    if (stmt.type == "Block") {
        let resolved_stmt = Object.assign({}, stmt);
        let resolved_statements = [];
        let i = 0;
        while (i < stmt.statements.length) {
            resolved_statements.push(
                package_compiler_resolve_identifiers_in_statement_with_options(
                    stmt.statements[i],
                    manager,
                    function_statements,
                    variable_statements,
                    class_statements,
                    options
                )
            );
            i = i + 1;
        }
        resolved_stmt.statements = resolved_statements;
        return resolved_stmt;
    }
    return stmt;
}
export function package_compiler_is_main_namespace(namespace_path) {
    if (namespace_path == null) {
        return false;
    }
    return namespace_path.endsWith("!");
}
export function package_compiler_get_main_namespace_name(namespace_path) {
    if (package_compiler_is_main_namespace(namespace_path)) {
        return namespace_path.substring(0, namespace_path.length - 1);
    }
    return namespace_path;
}
export function package_compiler_add_symbol_to_namespace(
    manager,
    namespace_path,
    symbol_name,
    symbol_type,
    symbol_data,
    file_path
) {
    if (manager.namespaces[namespace_path] == null) {
        manager.namespaces[namespace_path] = { symbols: {}, files: [] };
    }
    let namespace_data = manager.namespaces[namespace_path];
    namespace_data.symbols[symbol_name] = {
        type: symbol_type,
        data: symbol_data,
        filePath: file_path,
    };
    let file_exists = false;
    let i = 0;
    while (i < namespace_data.files.length) {
        if (namespace_data.files[i] == file_path) {
            file_exists = true;
            break;
        }
        i = i + 1;
    }
    if (!file_exists) {
        namespace_data.files.push(file_path);
    }
}
export function package_compiler_add_using_import(
    manager,
    using_path,
    is_global
) {
    if (manager.usings[manager.current_file] == null) {
        manager.usings[manager.current_file] = [];
    }
    let using_info = { namespace: using_path, isGlobal: is_global };
    manager.usings[manager.current_file].push(using_info);
}
export function package_compiler_find_symbol_namespace(
    manager,
    symbol_name,
    symbol_type
) {
    let namespace_keys = Object.keys(manager.namespaces);
    let i = 0;
    while (i < namespace_keys.length) {
        let namespace_name = namespace_keys[i];
        let namespace_data = manager.namespaces[namespace_name];
        if (namespace_data != null && namespace_data.symbols != null) {
            let symbol = namespace_data.symbols[symbol_name];
            if (symbol != null && symbol.type == symbol_type) {
                return namespace_name;
            }
        }
        i = i + 1;
    }
    return "";
}
export function package_compiler_get_fully_qualified_name(
    manager,
    symbol_name,
    namespace_path
) {
    if (namespace_path == "" || namespace_path == null) {
        return symbol_name;
    }
    let clean_namespace =
        package_compiler_get_main_namespace_name(namespace_path);
    return clean_namespace.replace("::", "_") + "_" + symbol_name;
}
export function package_compiler_validate_namespace_rules(ast, mode) {
    let has_namespace = false;
    let has_main_namespace = false;
    let i = 0;
    while (i < ast.statements.length) {
        let stmt = ast.statements[i];
        if (stmt.type == "NamespaceStatement") {
            has_namespace = true;
            if (stmt.isMainNamespace) {
                has_main_namespace = true;
            }
        }
        i = i + 1;
    }
    if (mode == "standard" && !has_namespace) {
        return {
            success: false,
            error: "Standard mode requires at least one namespace declaration",
        };
    }
    if (mode == "standard" && !has_main_namespace) {
        return {
            success: false,
            error: "Standard mode requires exactly one main namespace (ending with !)",
        };
    }
    return { success: true, error: null };
}
export function package_compiler_find_namespace_provider(
    namespace_path,
    file_contents
) {
    let file_names = Object.keys(file_contents);
    let i = 0;
    while (i < file_names.length) {
        let file_name = file_names[i];
        let content = file_contents[file_name];
        if (content.indexOf("namespace " + namespace_path) >= 0) {
            return file_name;
        }
        i = i + 1;
    }
    return null;
}
export function package_compiler_create_error(message, line, column) {
    return {
        type: "CompilerError",
        message: message,
        line: line,
        column: column,
    };
}
export function package_compiler_create_warning(message, line, column) {
    return {
        type: "CompilerWarning",
        message: message,
        line: line,
        column: column,
    };
}
export function package_compiler_report_error(error) {
    console.log(
        "Compiler Error: " +
            error.message +
            " at line " +
            error.line +
            ", column " +
            error.column
    );
}
export function package_compiler_report_warning(warning) {
    console.log(
        "Compiler Warning: " +
            warning.message +
            " at line " +
            warning.line +
            ", column " +
            warning.column
    );
}
export function package_compiler_count_ast_nodes(node) {
    if (node == null) {
        return 0;
    }
    let count = 1;
    if (node.statements != null) {
        let i = 0;
        while (i < node.statements.length) {
            count =
                count + package_compiler_count_ast_nodes(node.statements[i]);
            i = i + 1;
        }
    }
    if (node.body != null) {
        count = count + package_compiler_count_ast_nodes(node.body);
    }
    if (node.left != null) {
        count = count + package_compiler_count_ast_nodes(node.left);
    }
    if (node.right != null) {
        count = count + package_compiler_count_ast_nodes(node.right);
    }
    if (node.expression != null) {
        count = count + package_compiler_count_ast_nodes(node.expression);
    }
    if (node.condition != null) {
        count = count + package_compiler_count_ast_nodes(node.condition);
    }
    if (node.thenBranch != null) {
        count = count + package_compiler_count_ast_nodes(node.thenBranch);
    }
    if (node.elseBranch != null) {
        count = count + package_compiler_count_ast_nodes(node.elseBranch);
    }
    return count;
}
export function package_compiler_validate_syntax(source) {
    let lexer = new package_lexer_ValkyrieLexer(source);
    let tokens = lexer.tokenize();
    if (tokens.length == 0) {
        return { valid: false, error: "Lexical analysis failed" };
    }
    let ast = package_parser_parse(tokens);
    if (ast.type == "" || ast.type == "ParseError") {
        return { valid: false, error: "Syntax analysis failed" };
    }
    return { valid: true, error: null };
}
export function package_compiler_join_path(path_array, separator) {
    if (path_array == null || path_array.length == 0) {
        return "";
    }
    let result = path_array[0];
    let i = 1;
    while (i < path_array.length) {
        result = result + separator + path_array[i];
        i = i + 1;
    }
    return result;
}
export function package_compiler_set_compile_mode(manager, mode) {
    manager.mode = mode;
}
export function package_compiler_simple_dfs_visit(
    file_path,
    analyzer,
    visited,
    sorted
) {
    if (visited[file_path]) {
        return;
    }
    visited[file_path] = true;
    let dependencies = analyzer.dependencies[file_path];
    if (dependencies != null) {
        let i = 0;
        while (i < dependencies.length) {
            package_compiler_simple_dfs_visit(
                dependencies[i],
                analyzer,
                visited,
                sorted
            );
            i = i + 1;
        }
    }
    sorted.push(file_path);
}
export function package_compiler_generate_single_js(file_contents) {
    return package_compiler_compile_asts(file_contents, "repl");
}
export function package_compiler_generate_single_js_standard(file_contents) {
    return package_compiler_compile_asts(file_contents, "standard");
}
export function package_compiler_generate_single_js_with_options(
    file_contents,
    options
) {
    return package_compiler_compile_asts_with_options(
        file_contents,
        "repl",
        options
    );
}
export function package_compiler_generate_single_js_standard_with_options(
    file_contents,
    options
) {
    return package_compiler_compile_asts_with_options(
        file_contents,
        "standard",
        options
    );
}
export function package_compiler_package_compiler_compile_text(source_text) {
    let file_contents = { "main.valkyrie": source_text };
    return package_compiler_compile_asts(file_contents, "repl");
}
export function package_compiler_package_compiler_compile_text_with_options(
    source_text,
    options
) {
    let file_contents = { "main.valkyrie": source_text };
    return package_compiler_compile_asts_with_options(
        file_contents,
        "repl",
        options
    );
}
export function package_lexer_is_whitespace(ch) {
    return ch == " " || ch == "\t" || ch == "\n" || ch == "\r";
}
export function package_lexer_is_alpha_numeric(ch) {
    return package_lexer_is_alpha(ch) || package_lexer_is_digit(ch);
}
export function package_lexer_is_alpha(ch) {
    return (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch == "_";
}
export function package_lexer_is_digit(ch) {
    return ch >= "0" && ch <= "9";
}
export function package_lexer_get_keyword_type(value) {
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
    if (value == "until") {
        return "UNTIL";
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
    if (value == "Self") {
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
    minPrecedence,
    inline
) {
    let left = package_parser_parseUnaryExpression(parser, inline);
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
            nextMinPrecedence,
            inline
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
    return package_parser_parseExpressionWithPrecedence(parser, 0, false);
}
export function package_parser_parseInlineExpression(parser) {
    return package_parser_parseExpressionWithPrecedence(parser, 0, true);
}
export function package_parser_parseUnaryExpression(parser, inline) {
    if (
        parser.current_token.type == "BANG" ||
        parser.current_token.type == "MINUS"
    ) {
        let op = parser.current_token.value;
        parser.advance();
        let operand = package_parser_parseUnaryExpression(parser, inline);
        if (operand && operand.type == "ParseError") {
            return operand;
        }
        let node = new package_parser_Node("UnaryOp");
        node.operator = op;
        node.operand = operand;
        return node;
    }
    if (parser.current_token.type == "NEW") {
        return package_parser_parseNewExpression(parser, inline);
    }
    return package_parser_parsePostfixExpression(parser, inline);
}
export function package_parser_parseNewExpression(parser, inline) {
    parser.advance();
    let className = parser.expect("IDENTIFIER");
    if (className.type == "ParseError") {
        return className;
    }
    let lparen = parser.expect("LPAREN");
    if (lparen.type == "ParseError") {
        return lparen;
    }
    let args = [];
    if (parser.current_token.type != "RPAREN") {
        let arg = package_parser_parseExpressionWithPrecedence(
            parser,
            0,
            inline
        );
        if (arg.type == "ParseError") {
            return arg;
        }
        args.push(arg);
        while (parser.current_token.type == "COMMA") {
            parser.advance();
            arg = package_parser_parseExpressionWithPrecedence(
                parser,
                0,
                inline
            );
            if (arg.type == "ParseError") {
                return arg;
            }
            args.push(arg);
        }
    }
    let rparen = parser.expect("RPAREN");
    if (rparen.type == "ParseError") {
        return rparen;
    }
    let node = new package_parser_Node("NewExpression");
    node.className = className.value;
    node.arguments = args;
    return node;
}
export function package_parser_parsePostfixExpression(parser, inline) {
    let expr = package_parser_parseAtomicExpression(parser, inline);
    if (expr && expr.type == "ParseError") {
        return expr;
    }
    while (true) {
        if (parser.current_token.type == "LPAREN") {
            let nextIndex = parser.position + 1;
            let hasTrailingClosure = false;
            parser.advance();
            let args = [];
            if (parser.current_token.type != "RPAREN") {
                let arg = package_parser_parseExpressionWithPrecedence(
                    parser,
                    0,
                    inline
                );
                if (arg && arg.type == "ParseError") {
                    return arg;
                }
                args.push(arg);
                while (parser.current_token.type == "COMMA") {
                    parser.advance();
                    arg = package_parser_parseExpressionWithPrecedence(
                        parser,
                        0,
                        inline
                    );
                    if (arg && arg.type == "ParseError") {
                        return arg;
                    }
                    args.push(arg);
                }
            }
            let rparen = parser.expect("RPAREN");
            if (rparen && rparen.type == "ParseError") {
                return rparen;
            }
            let closure = null;
            if (parser.current_token.type == "LBRACE" && !inline) {
                closure = package_parser_parse_function_block(parser);
                if (closure && closure.type == "ParseError") {
                    return closure;
                }
                hasTrailingClosure = true;
            }
            let callNode = new package_parser_Node("MicroCall");
            callNode.callee = expr;
            callNode.arguments = args;
            if (hasTrailingClosure) {
                callNode.closure = closure;
            }
            expr = callNode;
        } else if (parser.current_token.type == "DOT") {
            parser.advance();
            if (parser.current_token.type == "AWAIT") {
                parser.advance();
                let awaitNode = new package_parser_Node("AwaitExpression");
                awaitNode.argument = expr;
                expr = awaitNode;
            } else {
                let property = parser.expect("IDENTIFIER");
                if (property && property.type == "ParseError") {
                    return property;
                }
                let accessNode = new package_parser_Node("PropertyAccess");
                accessNode.object = expr;
                accessNode.property = property.value;
                expr = accessNode;
            }
        } else if (parser.current_token.type == "DOUBLE_COLON") {
            parser.advance();
            let methodName = parser.expect("IDENTIFIER");
            if (methodName && methodName.type == "ParseError") {
                return methodName;
            }
            let namespacePath = [];
            namespacePath.push(methodName.value);
            while (parser.current_token.type == "DOUBLE_COLON") {
                parser.advance();
                let nextName = parser.expect("IDENTIFIER");
                if (nextName && nextName.type == "ParseError") {
                    return nextName;
                }
                namespacePath.push(nextName.value);
            }
            if (parser.current_token.type == "LPAREN") {
                parser.advance();
                let args = [];
                if (parser.current_token.type != "RPAREN") {
                    let arg = package_parser_parseExpressionWithPrecedence(
                        parser,
                        0,
                        inline
                    );
                    if (arg && arg.type == "ParseError") {
                        return arg;
                    }
                    args.push(arg);
                    while (parser.current_token.type == "COMMA") {
                        parser.advance();
                        arg = package_parser_parseExpressionWithPrecedence(
                            parser,
                            0,
                            inline
                        );
                        if (arg && arg.type == "ParseError") {
                            return arg;
                        }
                        args.push(arg);
                    }
                }
                let rparen = parser.expect("RPAREN");
                if (rparen && rparen.type == "ParseError") {
                    return rparen;
                }
                let staticCallNode = new package_parser_Node(
                    "StaticMethodCall"
                );
                staticCallNode.namespacePath = namespacePath;
                staticCallNode.methodName =
                    namespacePath[namespacePath.length - 1];
                staticCallNode.className =
                    namespacePath[namespacePath.length - 2];
                staticCallNode.arguments = args;
                expr = staticCallNode;
            } else {
                let staticAccessNode = new package_parser_Node(
                    "StaticPropertyAccess"
                );
                staticAccessNode.namespacePath = namespacePath;
                staticAccessNode.property =
                    namespacePath[namespacePath.length - 1];
                staticAccessNode.className =
                    namespacePath[namespacePath.length - 2];
                expr = staticAccessNode;
            }
        } else if (parser.current_token.type == "LBRACKET") {
            parser.advance();
            let index = package_parser_parseExpressionWithPrecedence(
                parser,
                0,
                inline
            );
            if (index && index.type == "ParseError") {
                return index;
            }
            let rbracket = parser.expect("RBRACKET");
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
export function package_parser_parseAtomicExpression(parser, inline) {
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
        if (parser.current_token.type == "LBRACE" && !inline) {
            let closure = package_parser_parse_function_block(parser);
            if (closure && closure.type == "ParseError") {
                return closure;
            }
            let callNode = new package_parser_Node("MicroCall");
            let identifierNode = new package_parser_Node("Identifier");
            identifierNode.name = name;
            callNode.callee = identifierNode;
            callNode.arguments = [];
            callNode.closure = closure;
            return callNode;
        }
        let node = new package_parser_Node("Identifier");
        node.name = name;
        return node;
    }
    if (parser.current_token.type == "MICRO") {
        parser.advance();
        let lparen = parser.expect("LPAREN");
        if (lparen.type == "ParseError") {
            return lparen;
        }
        let params = package_parser_parseTermParameters(parser);
        if (params && params.type == "ParseError") {
            return params;
        }
        let rparen = parser.expect("RPAREN");
        if (rparen.type == "ParseError") {
            return rparen;
        }
        let body = package_parser_parse_function_block(parser);
        if (body && body.type == "ParseError") {
            return body;
        }
        let node = new package_parser_Node("AnonymousFunction");
        node.parameters = params;
        node.body = body;
        return node;
    }
    if (parser.current_token.type == "SELF") {
        let nextIndex = parser.position + 1;
        if (
            nextIndex < parser.tokens.length &&
            parser.tokens[nextIndex].type == "DOUBLE_COLON"
        ) {
            let name = "Self";
            parser.advance();
            let node = new package_parser_Node("Identifier");
            node.name = name;
            return node;
        } else {
            parser.advance();
            let node = new package_parser_Node("ThisExpression");
            return node;
        }
    }
    if (parser.current_token.type == "NEW") {
        parser.advance();
        let className = parser.expect("IDENTIFIER");
        if (className && className.type == "ParseError") {
            return className;
        }
        let lparen = parser.expect("LPAREN");
        if (lparen && lparen.type == "ParseError") {
            return lparen;
        }
        let args = [];
        if (parser.current_token.type != "RPAREN") {
            let arg = package_parser_parseExpressionWithPrecedence(
                parser,
                0,
                inline
            );
            if (arg && arg.type == "ParseError") {
                return arg;
            }
            args.push(arg);
            while (parser.current_token.type == "COMMA") {
                parser.advance();
                arg = package_parser_parseExpressionWithPrecedence(
                    parser,
                    0,
                    inline
                );
                if (arg && arg.type == "ParseError") {
                    return arg;
                }
                args.push(arg);
            }
        }
        let rparen = parser.expect("RPAREN");
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
        let expr = package_parser_parseExpressionWithPrecedence(
            parser,
            0,
            inline
        );
        if (expr && expr.type == "ParseError") {
            return expr;
        }
        let rparen = parser.expect("RPAREN");
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
            let element = package_parser_parseExpressionWithPrecedence(
                parser,
                0,
                inline
            );
            if (element && element.type == "ParseError") {
                return element;
            }
            node.elements.push(element);
            while (parser.current_token.type == "COMMA") {
                parser.advance();
                element = package_parser_parseExpressionWithPrecedence(
                    parser,
                    0,
                    inline
                );
                if (element && element.type == "ParseError") {
                    return element;
                }
                node.elements.push(element);
            }
        }
        let rbracket = parser.expect("RBRACKET");
        if (rbracket && rbracket.type == "ParseError") {
            return rbracket;
        }
        return node;
    }
    if (parser.current_token.type == "LBRACE" && !inline) {
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
                let colon = parser.expect("COLON");
                if (colon && colon.type == "ParseError") {
                    return colon;
                }
                let value = package_parser_parseExpressionWithPrecedence(
                    parser,
                    0,
                    inline
                );
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
        let rbrace = parser.expect("RBRACE");
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
        let param = package_parser_parseTypedParameter(parser);
        if (param && param.type == "ParseError") {
            return param;
        }
        params.push(param);
        while (parser.current_token.type == "COMMA") {
            parser.advance();
            param = package_parser_parseTypedParameter(parser);
            if (param && param.type == "ParseError") {
                return param;
            }
            params.push(param);
        }
    }
    return params;
}
export function package_parser_parseTypedParameter(parser) {
    let paramName = null;
    if (parser.current_token.type == "IDENTIFIER") {
        paramName = parser.expect("IDENTIFIER");
    } else if (parser.current_token.type == "SELF") {
        paramName = parser.expect("SELF");
    } else {
        paramName = parser.expect("IDENTIFIER");
    }
    if (paramName && paramName.type == "ParseError") {
        return paramName;
    }
    let node = new package_parser_Node("Parameter");
    node.name = paramName.value;
    node.typeAnnotation = null;
    node.defaultValue = null;
    if (parser.current_token.type == "COLON") {
        parser.advance();
        let typeExpr = package_parser_parseTypeExpression(parser);
        if (typeExpr && typeExpr.type == "ParseError") {
            return typeExpr;
        }
        node.typeAnnotation = typeExpr;
    }
    if (parser.current_token.type == "ASSIGN") {
        parser.advance();
        let defaultExpr = package_parser_parseExpression(parser);
        if (defaultExpr && defaultExpr.type == "ParseError") {
            return defaultExpr;
        }
        node.defaultValue = defaultExpr;
    }
    return node;
}
export function package_parser_getTypeOperatorPrecedence(tokenType) {
    if (tokenType == "ARROW") {
        return 1;
    }
    if (tokenType == "PIPE") {
        return 2;
    }
    if (tokenType == "AMPERSAND") {
        return 3;
    }
    if (tokenType == "PLUS") {
        return 4;
    }
    if (tokenType == "MINUS") {
        return 4;
    }
    return -1;
}
export function package_parser_isTypeRightAssociative(tokenType) {
    return tokenType == "ARROW";
}
export function package_parser_parseTypeExpressionWithPrecedence(
    parser,
    minPrecedence
) {
    let left = package_parser_parseUnaryTypeExpression(parser);
    if (left && left.type == "ParseError") {
        return left;
    }
    while (true) {
        let precedence = package_parser_getTypeOperatorPrecedence(
            parser.current_token.type
        );
        if (precedence < minPrecedence) {
            break;
        }
        let op = parser.current_token.value;
        let tokenType = parser.current_token.type;
        parser.advance();
        let nextMinPrecedence = precedence;
        if (package_parser_isTypeRightAssociative(tokenType)) {
        } else {
            nextMinPrecedence = precedence + 1;
        }
        let right = package_parser_parseTypeExpressionWithPrecedence(
            parser,
            nextMinPrecedence
        );
        if (right && right.type == "ParseError") {
            return right;
        }
        if (tokenType == "ARROW") {
            let node = new package_parser_Node("FunctionType");
            node.parameterType = left;
            node.returnType = right;
            left = node;
        } else if (tokenType == "PIPE") {
            let node = new package_parser_Node("UnionType");
            node.left = left;
            node.right = right;
            left = node;
        } else if (tokenType == "AMPERSAND") {
            let node = new package_parser_Node("IntersectionType");
            node.left = left;
            node.right = right;
            left = node;
        } else {
            let node = new package_parser_Node("BinaryTypeOp");
            node.left = left;
            node.operator = op;
            node.right = right;
            left = node;
        }
    }
    return left;
}
export function package_parser_parseTypeExpression(parser) {
    return package_parser_parseTypeExpressionWithPrecedence(parser, 0);
}
export function package_parser_parseUnaryTypeExpression(parser) {
    if (
        parser.current_token.type == "PLUS" ||
        parser.current_token.type == "MINUS"
    ) {
        let op = parser.current_token.value;
        parser.advance();
        let operand = package_parser_parseUnaryTypeExpression(parser);
        if (operand && operand.type == "ParseError") {
            return operand;
        }
        let node = new package_parser_Node("VarianceType");
        node.variance = op;
        node.operand = operand;
        return node;
    }
    return package_parser_parsePostfixTypeExpression(parser);
}
export function package_parser_parsePostfixTypeExpression(parser) {
    let expr = package_parser_parseAtomicTypeExpression(parser);
    if (expr && expr.type == "ParseError") {
        return expr;
    }
    while (true) {
        if (parser.current_token.type == "QUESTION") {
            parser.advance();
            let node = new package_parser_Node("NullableType");
            node.baseType = expr;
            expr = node;
        } else if (parser.current_token.type == "BANG") {
            parser.advance();
            let node = new package_parser_Node("NonNullType");
            node.baseType = expr;
            expr = node;
        } else if (parser.current_token.type == "LT") {
            parser.advance();
            let typeArgs = [];
            if (parser.current_token.type != "GT") {
                let arg = package_parser_parseTypeExpression(parser);
                if (arg && arg.type == "ParseError") {
                    return arg;
                }
                typeArgs.push(arg);
                while (parser.current_token.type == "COMMA") {
                    parser.advance();
                    arg = package_parser_parseTypeExpression(parser);
                    if (arg && arg.type == "ParseError") {
                        return arg;
                    }
                    typeArgs.push(arg);
                }
            }
            let gt = parser.expect("GT");
            if (gt && gt.type == "ParseError") {
                return gt;
            }
            let node = new package_parser_Node("GenericType");
            node.baseType = expr;
            node.typeArguments = typeArgs;
            expr = node;
        } else if (parser.current_token.type == "LBRACKET") {
            parser.advance();
            let rbracket = parser.expect("RBRACKET");
            if (rbracket && rbracket.type == "ParseError") {
                return rbracket;
            }
            let node = new package_parser_Node("ArrayType");
            node.elementType = expr;
            expr = node;
        } else {
            break;
        }
    }
    return expr;
}
export function package_parser_parseAtomicTypeExpression(parser) {
    if (parser.current_token.type == "IDENTIFIER") {
        let name = parser.current_token.value;
        parser.advance();
        let node = new package_parser_Node("TypeIdentifier");
        node.name = name;
        return node;
    }
    if (parser.current_token.type == "LPAREN") {
        parser.advance();
        let expr = package_parser_parseTypeExpression(parser);
        if (expr && expr.type == "ParseError") {
            return expr;
        }
        let rparen = parser.expect("RPAREN");
        if (rparen && rparen.type == "ParseError") {
            return rparen;
        }
        return expr;
    }
    if (parser.current_token.type == "LPAREN") {
        parser.advance();
        let elements = [];
        if (parser.current_token.type != "RPAREN") {
            let element = package_parser_parseTypeExpression(parser);
            if (element && element.type == "ParseError") {
                return element;
            }
            elements.push(element);
            while (parser.current_token.type == "COMMA") {
                parser.advance();
                element = package_parser_parseTypeExpression(parser);
                if (element && element.type == "ParseError") {
                    return element;
                }
                elements.push(element);
            }
        }
        let rparen = parser.expect("RPAREN");
        if (rparen && rparen.type == "ParseError") {
            return rparen;
        }
        if (elements.length == 1) {
            return elements[0];
        } else {
            let node = new package_parser_Node("TupleType");
            node.elements = elements;
            return node;
        }
    }
    if (parser.current_token.type == "LBRACE") {
        parser.advance();
        let properties = [];
        if (parser.current_token.type != "RBRACE") {
            while (
                parser.current_token.type == "IDENTIFIER" ||
                parser.current_token.type == "STRING"
            ) {
                let key = parser.current_token.value;
                parser.advance();
                let colon = parser.expect("COLON");
                if (colon && colon.type == "ParseError") {
                    return colon;
                }
                let valueType = package_parser_parseTypeExpression(parser);
                if (valueType && valueType.type == "ParseError") {
                    return valueType;
                }
                let propertyNode = new package_parser_Node("TypeProperty");
                propertyNode.key = key;
                propertyNode.valueType = valueType;
                properties.push(propertyNode);
                if (parser.current_token.type == "COMMA") {
                    parser.advance();
                } else {
                    break;
                }
            }
        }
        let rbrace = parser.expect("RBRACE");
        if (rbrace && rbrace.type == "ParseError") {
            return rbrace;
        }
        let node = new package_parser_Node("ObjectType");
        node.properties = properties;
        return node;
    }
    if (parser.current_token.type == "STRING") {
        let value = parser.current_token.value;
        parser.advance();
        let node = new package_parser_Node("LiteralType");
        node.value = value;
        node.literalType = "string";
        return node;
    }
    if (parser.current_token.type == "NUMBER") {
        let value = parser.current_token.value;
        parser.advance();
        let node = new package_parser_Node("LiteralType");
        node.value = value;
        node.literalType = "number";
        return node;
    }
    if (parser.current_token.type == "BOOLEAN") {
        let value = parser.current_token.value;
        parser.advance();
        let node = new package_parser_Node("LiteralType");
        node.value = value;
        node.literalType = "boolean";
        return node;
    }
    let error = {};
    error.type = "ParseError";
    error.message =
        "Expected type expression but got " + parser.current_token.type;
    error.line = parser.current_token.line;
    error.column = parser.current_token.column;
    return error;
}
export function package_parser_parseTypedParameters(parser) {
    let params = [];
    if (parser.current_token.type != "RPAREN") {
        let param = package_parser_parseTypedParameter(parser);
        if (param && param.type == "ParseError") {
            return param;
        }
        params.push(param);
        while (parser.current_token.type == "COMMA") {
            parser.advance();
            param = package_parser_parseTypedParameter(parser);
            if (param && param.type == "ParseError") {
                return param;
            }
            params.push(param);
        }
    }
    return params;
}
export function package_parser_parseTypeHint(parser) {
    if (parser.currentToken.type == "Colon") {
        parser.advance();
        return parser.parseTypeExpression();
    }
    return null;
}
export function package_parser_parseReturnType(parser) {
    if (parser.currentToken.type == "Arrow") {
        parser.advance();
        return this.parseTypeExpression();
    }
    return null;
}
export function package_parser_parseEffectType(parser) {
    if (parser.currentToken.type == "Slash") {
        parser.advance();
        return parser.parseTypeExpression();
    }
    return null;
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
        return package_parser_parse_function_declaration(parser);
    }
    if (parser.current_token.type == "IF") {
        return package_parser_parseIfStatement(parser);
    }
    if (parser.current_token.type == "WHILE") {
        return package_parser_parseWhileStatement(parser);
    }
    if (parser.current_token.type == "UNTIL") {
        return package_parser_parseUntilStatement(parser);
    }
    if (parser.current_token.type == "RETURN") {
        return package_parser_parseReturnStatement(parser);
    }
    if (parser.current_token.type == "LBRACE") {
        return package_parser_parse_function_block(parser);
    }
    let expr = package_parser_parseExpression(parser);
    if (expr && expr.type == "ParseError") {
        return expr;
    }
    let semicolon = parser.expect("SEMICOLON");
    if (semicolon && semicolon.type == "ParseError") {
        return semicolon;
    }
    let stmt = new package_parser_Node("ExpressionStatement");
    stmt.expression = expr;
    return stmt;
}
export function package_parser_parseLetStatement(parser) {
    parser.advance();
    let name = parser.expect("IDENTIFIER");
    if (name && name.type == "ParseError") {
        return name;
    }
    let assignToken = parser.expect("ASSIGN");
    if (assignToken && assignToken.type == "ParseError") {
        return assignToken;
    }
    let value = package_parser_parseExpression(parser);
    if (value && value.type == "ParseError") {
        return value;
    }
    let semicolon = parser.expect("SEMICOLON");
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
        isMainNamespace = true;
    }
    let identifier = parser.expect("IDENTIFIER");
    if (identifier.type == "ParseError") {
        return identifier;
    }
    path.push(identifier.value);
    while (parser.current_token.type == "DOUBLE_COLON") {
        parser.advance();
        identifier = parser.expect("IDENTIFIER");
        if (identifier.type == "ParseError") {
            return identifier;
        }
        path.push(identifier.value);
    }
    let semicolon = parser.expect("SEMICOLON");
    if (semicolon.type == "ParseError") {
        return semicolon;
    }
    let node = new package_parser_Node("NamespaceStatement");
    node.path = path;
    node.isMainNamespace = isMainNamespace;
    return node;
}
export function package_parser_parseUsingStatement(parser) {
    parser.advance();
    let path = [];
    let identifier = parser.expect("IDENTIFIER");
    if (identifier.type == "ParseError") {
        return identifier;
    }
    path.push(identifier.value);
    while (parser.current_token.type == "DOUBLE_COLON") {
        parser.advance();
        identifier = parser.expect("IDENTIFIER");
        if (identifier.type == "ParseError") {
            return identifier;
        }
        path.push(identifier.value);
    }
    let semicolon = parser.expect("SEMICOLON");
    if (semicolon.type == "ParseError") {
        return semicolon;
    }
    let node = new package_parser_Node("UsingStatement");
    node.path = path;
    return node;
}
export function package_parser_parseAttributeStatement(parser) {
    parser.advance();
    let jsToken = parser.expect("IDENTIFIER");
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
    let lparen = parser.expect("LPAREN");
    if (lparen.type == "ParseError") {
        return lparen;
    }
    let modulePath = parser.expect("STRING");
    if (modulePath.type == "ParseError") {
        return modulePath;
    }
    let comma = parser.expect("COMMA");
    if (comma.type == "ParseError") {
        return comma;
    }
    let importName = parser.expect("STRING");
    if (importName.type == "ParseError") {
        return importName;
    }
    let rparen = parser.expect("RPAREN");
    if (rparen.type == "ParseError") {
        return rparen;
    }
    let microToken = parser.expect("MICRO");
    if (microToken.type == "ParseError") {
        return microToken;
    }
    let functionName = parser.expect("IDENTIFIER");
    if (functionName.type == "ParseError") {
        return functionName;
    }
    let paramLparen = parser.expect("LPAREN");
    if (paramLparen.type == "ParseError") {
        return paramLparen;
    }
    let parameters = [];
    if (parser.current_token.type != "RPAREN") {
        let param = parser.expect("IDENTIFIER");
        if (param.type == "ParseError") {
            return param;
        }
        parameters.push(param.value);
        while (parser.current_token.type == "COMMA") {
            parser.advance();
            param = parser.expect("IDENTIFIER");
            if (param.type == "ParseError") {
                return param;
            }
            parameters.push(param.value);
        }
    }
    let paramRparen = parser.expect("RPAREN");
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
    let name = parser.expect("IDENTIFIER");
    if (name && name.type == "ParseError") {
        return name;
    }
    let lparen = parser.expect("LPAREN");
    if (lparen && lparen.type == "ParseError") {
        return lparen;
    }
    let params = package_parser_parseTermParameters(parser);
    if (params && params.type == "ParseError") {
        return params;
    }
    let rparen = parser.expect("RPAREN");
    if (rparen && rparen.type == "ParseError") {
        return rparen;
    }
    let returnType = null;
    if (parser.current_token.type == "ARROW") {
        parser.advance();
        returnType = package_parser_parseTypeExpression(parser);
        if (returnType && returnType.type == "ParseError") {
            return returnType;
        }
    }
    let effectType = null;
    if (parser.current_token.type == "DIVIDE") {
        parser.advance();
        effectType = package_parser_parseTypeExpression(parser);
        if (effectType && effectType.type == "ParseError") {
            return effectType;
        }
    }
    let body = package_parser_parse_function_block(parser);
    if (body && body.type == "ParseError") {
        return body;
    }
    let node = new package_parser_Node("MicroDeclaration");
    node.name = name.value;
    node.parameters = params;
    node.returnType = returnType;
    node.effectType = effectType;
    node.body = body;
    return node;
}
export function package_parser_parseClassDeclaration(parser) {
    parser.advance();
    let name = parser.expect("IDENTIFIER");
    if (name && name.type == "ParseError") {
        return name;
    }
    let node = new package_parser_Node("ClassDeclaration");
    node.name = name.value;
    node.superClass = null;
    node.members = [];
    if (parser.current_token.type == "EXTENDS") {
        parser.advance();
        let superName = parser.expect("IDENTIFIER");
        if (superName && superName.type == "ParseError") {
            return superName;
        }
        node.superClass = superName.value;
    }
    let lbrace = parser.expect("LBRACE");
    if (lbrace && lbrace.type == "ParseError") {
        return lbrace;
    }
    while (
        parser.current_token.type != "RBRACE" &&
        parser.current_token.type != "EOF"
    ) {
        if (parser.current_token.type == "SEMICOLON") {
            parser.advance();
            continue;
        }
        let member = package_parser_parseClassMember(parser);
        if (member && member.type != "ParseError") {
            node.members.push(member);
        } else if (member && member.type == "ParseError") {
            return member;
        }
    }
    let rbrace = parser.expect("RBRACE");
    if (rbrace && rbrace.type == "ParseError") {
        return rbrace;
    }
    return node;
}
export function package_parser_parseClassMember(parser) {
    if (parser.current_token.type == "CONSTRUCTOR") {
        parser.advance();
        let lparen = parser.expect("LPAREN");
        if (lparen && lparen.type == "ParseError") {
            return lparen;
        }
        let params = package_parser_parseTermParameters(parser);
        if (params && params.type == "ParseError") {
            return params;
        }
        let rparen = parser.expect("RPAREN");
        if (rparen && rparen.type == "ParseError") {
            return rparen;
        }
        let body = package_parser_parse_function_block(parser);
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
        let name = parser.expect("IDENTIFIER");
        if (name && name.type == "ParseError") {
            return name;
        }
        let lparen = parser.expect("LPAREN");
        if (lparen && lparen.type == "ParseError") {
            return lparen;
        }
        let params = package_parser_parseTermParameters(parser);
        if (params && params.type == "ParseError") {
            return params;
        }
        let rparen = parser.expect("RPAREN");
        if (rparen && rparen.type == "ParseError") {
            return rparen;
        }
        let returnType = null;
        if (parser.current_token.type == "ARROW") {
            parser.advance();
            returnType = package_parser_parseTypeExpression(parser);
            if (returnType && returnType.type == "ParseError") {
                return returnType;
            }
        }
        let effectType = null;
        if (parser.current_token.type == "DIVIDE") {
            parser.advance();
            effectType = package_parser_parseTypeExpression(parser);
            if (effectType && effectType.type == "ParseError") {
                return effectType;
            }
        }
        let body = package_parser_parse_function_block(parser);
        if (body && body.type == "ParseError") {
            return body;
        }
        let isInstanceMethod = false;
        let i = 0;
        while (i < params.length) {
            let param = params[i];
            let paramName = "";
            if (param && param.name) {
                paramName = param.name;
            } else {
                paramName = param;
            }
            if (paramName == "self") {
                isInstanceMethod = true;
                break;
            }
            i = i + 1;
        }
        let methodNode = new package_parser_Node("MemberStatement");
        methodNode.name = name.value;
        methodNode.parameters = params;
        methodNode.returnType = returnType;
        methodNode.effectType = effectType;
        methodNode.body = body;
        methodNode.isInstanceMethod = isInstanceMethod;
        methodNode.isStatic = !isInstanceMethod;
        return methodNode;
    }
    if (parser.current_token.type == "IDENTIFIER") {
        let nextIndex = parser.position + 1;
        if (nextIndex < parser.tokens.length) {
            let next_token = parser.tokens[nextIndex];
            if (
                next_token.type == "COLON" ||
                next_token.type == "ASSIGN" ||
                next_token.type == "SEMICOLON"
            ) {
                let name = parser.expect("IDENTIFIER");
                if (name && name.type == "ParseError") {
                    return name;
                }
                let typeAnnotation = null;
                if (parser.current_token.type == "COLON") {
                    parser.advance();
                    typeAnnotation = package_parser_parseTypeExpression(parser);
                    if (typeAnnotation && typeAnnotation.type == "ParseError") {
                        return typeAnnotation;
                    }
                }
                let initValue = null;
                if (parser.current_token.type == "ASSIGN") {
                    parser.advance();
                    initValue = package_parser_parseExpression(parser);
                    if (initValue && initValue.type == "ParseError") {
                        return initValue;
                    }
                }
                let semicolon = parser.expect("SEMICOLON");
                if (semicolon && semicolon.type == "ParseError") {
                    return semicolon;
                }
                let node = new package_parser_Node("Property");
                node.name = name.value;
                node.typeAnnotation = typeAnnotation;
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
export function package_parser_parse_function_declaration(parser) {
    parser.advance();
    let name = parser.expect("IDENTIFIER");
    if (name && name.type == "ParseError") {
        return name;
    }
    let lparen = parser.expect("LPAREN");
    if (lparen && lparen.type == "ParseError") {
        return lparen;
    }
    let params = package_parser_parseTermParameters(parser);
    if (params && params.type == "ParseError") {
        return params;
    }
    let rparen = parser.expect("RPAREN");
    if (rparen && rparen.type == "ParseError") {
        return rparen;
    }
    let body = package_parser_parse_function_block(parser);
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
    let condition = package_parser_parseInlineExpression(parser);
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
    let condition = package_parser_parseInlineExpression(parser);
    if (condition && condition.type == "ParseError") {
        return condition;
    }
    let body = package_parser_parse_function_block(parser);
    if (body && body.type == "ParseError") {
        return body;
    }
    let node = new package_parser_Node("WhileStatement");
    node.condition = condition;
    node.body = body;
    return node;
}
export function package_parser_parseUntilStatement(parser) {
    parser.advance();
    let condition = package_parser_parseInlineExpression(parser);
    if (condition && condition.type == "ParseError") {
        return condition;
    }
    let body = package_parser_parse_function_block(parser);
    if (body && body.type == "ParseError") {
        return body;
    }
    let node = new package_parser_Node("UntilStatement");
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
    let semicolon = parser.expect("SEMICOLON");
    if (semicolon && semicolon.type == "ParseError") {
        return semicolon;
    }
    return node;
}
export function package_parser_parse_function_block(parser) {
    let lbrace = parser.expect("LBRACE");
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
    let rbrace = parser.expect("RBRACE");
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
class package_compiler_CompilerOptions {
    constructor(output_format, optimize, debug, implicit_member_call) {
        this.output_format = output_format || "js";
        this.optimize = optimize || false;
        this.debug = debug || false;
        this.implicit_member_call = implicit_member_call || "warning";
    }
}
class package_compiler_CompilerStatistics {
    constructor() {
        self.output_size = undefined;
        this.tokensCount = 0;
        this.astNodesCount = 0;
        this.compilationTime = 0;
        this.output_size = 0;
    }
}
class package_compiler_DependencyAnalyzer {
    constructor() {
        this.dependencies = {};
        this.reverseDependencies = {};
    }
}
class package_compiler_NamespaceManager {
    constructor(source) {
        this.namespaces = {};
        this.usings = {};
        this.current_namespace = "";
        this.current_file = "";
        this.mode = "repl";
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

    skip_whitespace() {
        while (
            this.current_char != "" &&
            package_lexer_is_whitespace(this.current_char)
        ) {
            this.advance();
        }
    }

    read_number() {
        let result = "";
        while (
            this.current_char != "" &&
            package_lexer_is_digit(this.current_char)
        ) {
            result = result + this.current_char;
            this.advance();
        }
        return result;
    }

    read_identifier() {
        let result = "";
        while (
            this.current_char != "" &&
            package_lexer_is_alpha_numeric(this.current_char)
        ) {
            result = result + this.current_char;
            this.advance();
        }
        return result;
    }

    read_string() {
        let result = "";
        this.advance();
        while (this.current_char != "" && this.current_char != '"') {
            if (this.current_char == "\\") {
                this.advance();
                if (this.current_char == "n") {
                    result = result + "\n";
                } else {
                    if (this.current_char == "t") {
                        result = result + "\t";
                    } else {
                        if (this.current_char == "r") {
                            result = result + "\r";
                        } else {
                            if (this.current_char == '"') {
                                result = result + '"';
                            } else {
                                if (this.current_char == "\\") {
                                    result = result + "\\";
                                } else {
                                    result = result + "\\" + this.current_char;
                                }
                            }
                        }
                    }
                }
            } else {
                result = result + this.current_char;
            }
            this.advance();
        }
        if (this.current_char == '"') {
            this.advance();
        }
        return result;
    }

    skip_comment() {
        while (this.current_char != "" && this.current_char != "\n") {
            this.advance();
        }
    }

    next_token() {
        while (this.current_char != "") {
            if (package_lexer_is_whitespace(this.current_char)) {
                this.skip_whitespace();
                continue;
            }
            if (this.current_char == "#") {
                this.skip_comment();
                continue;
            }
            let line = this.line;
            let column = this.column;
            if (package_lexer_is_alpha(this.current_char)) {
                let value = this.read_identifier();
                let tokenType = package_lexer_get_keyword_type(value);
                return new package_lexer_Token(tokenType, value, line, column);
            }
            if (package_lexer_is_digit(this.current_char)) {
                let value = this.read_number();
                return new package_lexer_Token("NUMBER", value, line, column);
            }
            if (this.current_char == '"') {
                let value = this.read_string();
                return new package_lexer_Token("STRING", value, line, column);
            }
            let ch = this.current_char;
            this.advance();
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
                    this.position < this.source.length &&
                    this.source.charAt(this.position) == ":"
                ) {
                    this.advance();
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
                    this.position < this.source.length &&
                    this.source.charAt(this.position) == "="
                ) {
                    this.advance();
                    return new package_lexer_Token("EQ", "==", line, column);
                }
                return new package_lexer_Token("ASSIGN", ch, line, column);
            }
            if (ch == "+") {
                return new package_lexer_Token("PLUS", ch, line, column);
            }
            if (ch == "-") {
                if (
                    this.position < this.source.length &&
                    this.source.charAt(this.position) == ">"
                ) {
                    this.advance();
                    return new package_lexer_Token("ARROW", "->", line, column);
                }
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
                    this.position < this.source.length &&
                    this.source.charAt(this.position) == "&"
                ) {
                    this.advance();
                    return new package_lexer_Token("AND", "&&", line, column);
                }
                return new package_lexer_Token("AMPERSAND", ch, line, column);
            }
            if (ch == "|") {
                if (
                    this.position < this.source.length &&
                    this.source.charAt(this.position) == "|"
                ) {
                    this.advance();
                    return new package_lexer_Token("OR", "||", line, column);
                }
                return new package_lexer_Token("PIPE", ch, line, column);
            }
            if (ch == ">") {
                if (
                    this.position < this.source.length &&
                    this.source.charAt(this.position) == "="
                ) {
                    this.advance();
                    return new package_lexer_Token("GTE", ">=", line, column);
                }
                return new package_lexer_Token("GT", ch, line, column);
            }
            if (ch == "<") {
                if (
                    this.position < this.source.length &&
                    this.source.charAt(this.position) == "="
                ) {
                    this.advance();
                    return new package_lexer_Token("LTE", "<=", line, column);
                }
                return new package_lexer_Token("LT", ch, line, column);
            }
            if (ch == "!") {
                if (
                    this.position < this.source.length &&
                    this.source.charAt(this.position) == "="
                ) {
                    this.advance();
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
        return new package_lexer_Token("EOF", "", this.line, this.column);
    }

    tokenize() {
        let tokens = [];
        while (true) {
            let token = this.next_token();
            tokens.push(token);
            if (token.type == "EOF") {
                break;
            }
        }
        return tokens;
    }
}
class package_parser_Node {
    constructor(type) {
        this.type = type;
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

    expect(tokenType) {
        if (this.current_token.type != tokenType) {
            let error = {};
            error.type = "ParseError";
            error.message =
                "Expected " + tokenType + " but got " + this.current_token.type;
            error.line = this.current_token.line;
            error.column = this.current_token.column;
            return error;
        }
        let token = this.current_token;
        this.advance();
        return token;
    }
}
