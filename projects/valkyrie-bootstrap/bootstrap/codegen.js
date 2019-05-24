export function replaceAll(str, search, replace) {
    let result = "";
    let i = 0;
    while ((i < str.length)) {
        if ((str[i] == search)) {
            result = (result + replace);
        } else {
            result = (result + str[i]);
        }
        i = (i + 1);
    }
    return result;
}

export function generateExpression(node) {
    if ((node.type == "Number")) {
        return node.value;
    }
    if ((node.type == "String")) {
        let escaped = node.value;
        escaped = replaceAll(escaped, "\\", "\\\\");
        escaped = replaceAll(escaped, "\"", "\\\"");
        escaped = replaceAll(escaped, "\n", "\\n");
        escaped = replaceAll(escaped, "\r", "\\r");
        escaped = replaceAll(escaped, "\t", "\\t");
        return (("\"" + escaped) + "\"");
    }
    if ((node.type == "Boolean")) {
        return node.value;
    }
    if ((node.type == "Identifier")) {
        return node.name;
    }
    if ((node.type == "BinaryOp")) {
        let left = generateExpression(node.left);
        let right = generateExpression(node.right);
        let result = "(";
        result = (result + left);
        result = (result + " ");
        result = (result + node.operator);
        result = (result + " ");
        result = (result + right);
        result = (result + ")");
        return result;
    }
    if ((node.type == "Assignment")) {
        let left = generateExpression(node.left);
        let right = generateExpression(node.right);
        return ((left + " = ") + right);
    }
    if ((node.type == "FunctionCall")) {
        let callee = generateExpression(node.callee);
        let args = "";
        let i = 0;
        while ((i < node.arguments.length)) {
            let arg = generateExpression(node.arguments[i]);
            args = (args + arg);
            if ((i < (node.arguments.length - 1))) {
                args = (args + ", ");
            }
            i = (i + 1);
        }
        return (((callee + "(") + args) + ")");
    }
    if ((node.type == "PropertyAccess")) {
        if (node.object.type) {
            let obj = generateExpression(node.object);
            return ((obj + ".") + node.property);
        } else {
            return ((node.object + ".") + node.property);
        }
    }
    if ((node.type == "ArrayAccess")) {
        let obj = "";
        if (node.object.type) {
            obj = generateExpression(node.object);
        } else {
            obj = node.object;
        }
        let index = generateExpression(node.index);
        return (((obj + "[") + index) + "]");
    }
    if ((node.type == "ObjectLiteral")) {
        return "{}";
    }
    if ((node.type == "ArrayLiteral")) {
        return "[]";
    }
    if ((node.type == "UnaryOp")) {
        let operand = generateExpression(node.operand);
        return (node.operator + operand);
    }
    return (("/* Unknown expression: " + node.type) + " */");
}

export function generateStatement(node) {
    if ((node.type == "LetStatement")) {
        let value = generateExpression(node.value);
        return (((("let " + node.name) + " = ") + value) + ";");
    }
    if ((node.type == "FunctionDeclaration")) {
        let params = "";
        let i = 0;
        while ((i < node.parameters.length)) {
            if ((i > 0)) {
                params = (params + ", ");
            }
            params = (params + node.parameters[i]);
            i = (i + 1);
        }
        let body = generateStatement(node.body);
        return ((((("export function " + node.name) + "(") + params) + ") ") + body);
    }
    if ((node.type == "IfStatement")) {
        let condition = generateExpression(node.condition);
        let thenBranch = generateStatement(node.thenBranch);
        let result = ((("if (" + condition) + ") ") + thenBranch);
        if ((node.elseBranch && node.elseBranch.type)) {
            let elseBranch = generateStatement(node.elseBranch);
            result = ((result + " else ") + elseBranch);
        }
        return result;
    }
    if ((node.type == "WhileStatement")) {
        let condition = generateExpression(node.condition);
        let body = generateStatement(node.body);
        return ((("while (" + condition) + ") ") + body);
    }
    if ((node.type == "ReturnStatement")) {
        if ((node.value && node.value.type)) {
            let value = generateExpression(node.value);
            return (("return " + value) + ";");
        } else {
            return "return;";
        }
    }
    if ((node.type == "Block")) {
        let statements = "";
        let i = 0;
        while ((i < node.statements.length)) {
            let stmt = generateStatement(node.statements[i]);
            if ((i > 0)) {
                statements = (statements + "\n");
            }
            statements = (statements + stmt);
            i = (i + 1);
        }
        return (("{\n" + statements) + "\n}");
    }
    if ((node.type == "ExpressionStatement")) {
        return (generateExpression(node.expression) + ";");
    }
    return (("/* Unknown statement: " + node.type) + " */");
}

export function generate(ast) {
    if ((ast.type == "Program")) {
        let result = "";
        let i = 0;
        while ((i < ast.statements.length)) {
            let stmt = ast.statements[i];
            result = ((result + generateStatement(stmt)) + "\n");
            i = (i + 1);
        }
        return result;
    }
    if ((ast.type == "ParseError")) {
        return ((((("// Parse Error: " + ast.message) + " at line ") + ast.line) + ", column ") + ast.column);
    }
    return generateStatement(ast);
}
