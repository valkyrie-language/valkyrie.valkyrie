// namespace package::codegen;
// using package::compiler::joinPath;
export function joinPath(pathArray, separator) {
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
export function replaceAll(str, search, replace) {
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
export function generateExpression(node) {
    if (node.type == "Number") {
        return node.value;
    }
    if (node.type == "String") {
        let escaped = node.value;
        escaped = replaceAll(escaped, "\\", "\\\\");
        escaped = replaceAll(escaped, '"', '\\"');
        escaped = replaceAll(escaped, "\n", "\\n");
        escaped = replaceAll(escaped, "\r", "\\r");
        escaped = replaceAll(escaped, "\t", "\\t");
        return '"' + escaped + '"';
    }
    if (node.type == "Boolean") {
        return node.value;
    }
    if (node.type == "Identifier") {
        return node.name;
    }
    if (node.type == "BinaryOp") {
        let left = generateExpression(node.left);
        let right = generateExpression(node.right);
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
        let left = generateExpression(node.left);
        let right = generateExpression(node.right);
        return left + " = " + right;
    }
    if (node.type == "MicroCall") {
        let callee = generateExpression(node.callee);
        let args = "";
        let i = 0;
        while (i < node.arguments.length) {
            if (i > 0) {
                args = args + ", ";
            }
            args = args + generateExpression(node.arguments[i]);
            i = i + 1;
        }
        return callee + "(" + args + ")";
    }
    if (node.type == "NewExpression") {
        let args = "";
        let i = 0;
        while (i < node.arguments.length) {
            if (i > 0) {
                args = args + ", ";
            }
            args = args + generateExpression(node.arguments[i]);
            i = i + 1;
        }
        return "new " + node.className + "(" + args + ")";
    }
    if (node.type == "AwaitExpression") {
        let argument = generateExpression(node.argument);
        return "await " + argument;
    }
    if (node.type == "PropertyAccess") {
        if (node.object.type) {
            let obj = generateExpression(node.object);
            return obj + "." + node.property;
        } else {
            return node.object + "." + node.property;
        }
    }
    if (node.type == "ArrayAccess") {
        let obj = "";
        if (node.object.type) {
            obj = generateExpression(node.object);
        } else {
            obj = node.object;
        }
        let index = generateExpression(node.index);
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
                generateExpression(prop.value);
            i = i + 1;
        }
        result = result + "}";
        return result;
    }
    if (node.type == "ArrayLiteral") {
        return "[]";
    }
    if (node.type == "UnaryOp") {
        let operand = generateExpression(node.operand);
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
export function generateStatement(node) {
    if (node.type == "LetStatement") {
        let value = generateExpression(node.value);
        return "let " + node.name + " = " + value + ";";
    }
    if (node.type == "NamespaceStatement") {
        let namespacePath = joinPath(node.path, "::");
        if (node.isMainNamespace) {
            return "// namespace! " + namespacePath + ";";
        } else {
            return "// namespace " + namespacePath + ";";
        }
    }
    if (node.type == "UsingStatement") {
        return "// using " + joinPath(node.path, "::") + ";";
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
            i = i + 1;
        }
        let body = generateStatement(node.body);
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
            i = i + 1;
        }
        let body = generateStatement(node.body);
        return "function " + node.name + "(" + params + ") " + body;
    }
    if (node.type == "IfStatement") {
        let condition = generateExpression(node.condition);
        let thenBranch = generateStatement(node.thenBranch);
        let result = "if (" + condition + ") " + thenBranch;
        if (node.elseBranch && node.elseBranch.type) {
            let elseBranch = generateStatement(node.elseBranch);
            result = result + " else " + elseBranch;
        }
        return result;
    }
    if (node.type == "WhileStatement") {
        let condition = generateExpression(node.condition);
        let body = generateStatement(node.body);
        return "while (" + condition + ") " + body;
    }
    if (node.type == "ReturnStatement") {
        if (node.value && node.value.type) {
            let value = generateExpression(node.value);
            return "return " + value + ";";
        } else {
            return "return;";
        }
    }
    if (node.type == "Block") {
        let statements = "";
        let i = 0;
        while (i < node.statements.length) {
            let stmt = generateStatement(node.statements[i]);
            if (i > 0) {
                statements = statements + "\n";
            }
            statements = statements + stmt;
            i = i + 1;
        }
        return "{\n" + statements + "\n}";
    }
    if (node.type == "ExpressionStatement") {
        return generateExpression(node.expression) + ";";
    }
    if (node.type == "NamespaceStatement") {
        return "// namespace " + joinPath(node.path, "::") + ";";
    }
    if (node.type == "UsingStatement") {
        return "// using " + joinPath(node.path, "::") + ";";
    }
    if (node.type == "JSAttributeStatement") {
        let cleanImportName = replaceAll(node.importName, "-", "_");
        cleanImportName = replaceAll(cleanImportName, ".", "_");
        cleanImportName = replaceAll(cleanImportName, "/", "_");
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
                    let initValue = generateExpression(member.initializer);
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
                params = params + explicitConstructor.parameters[j];
                j = j + 1;
            }
            result = result + "  constructor(" + params + ") {\n";
            if (superClass) {
                result = result + "    super();\n";
            }
            result = result + fieldInits;
            let ctorBody = generateStatement(explicitConstructor.body);
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
                    if (member.parameters[j] != "self") {
                        if (paramCount > 0) {
                            params = params + ", ";
                        }
                        params = params + member.parameters[j];
                        paramCount = paramCount + 1;
                    }
                    j = j + 1;
                }
                let body = generateStatement(member.body);
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
            i = i + 1;
        }
        result = result + "}";
        return result;
    }
    return "/* Unknown statement: " + node.type + " */";
}
export function generate(ast) {
    if (ast.type == "Program") {
        let result = "";
        let i = 0;
        while (i < ast.statements.length) {
            let stmt = ast.statements[i];
            result = result + generateStatement(stmt) + "\n";
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
    return generateStatement(ast);
}
