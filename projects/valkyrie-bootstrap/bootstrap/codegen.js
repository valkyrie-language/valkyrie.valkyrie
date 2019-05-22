// Bootstrap Code Generator - 手写的 JavaScript 版本

export function generateExpression(node) {
    if (node.type === "Number") {
        return node.value;
    }

    if (node.type === "String") {
        const escaped = node.value
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
        return `"${escaped}"`;
    }

    if (node.type === "Boolean") {
        return node.value;
    }

    if (node.type === "Identifier") {
        return node.name;
    }

    if (node.type === "BinaryOp") {
        const left = generateExpression(node.left);
        const right = generateExpression(node.right);
        return `(${left} ${node.operator} ${right})`;
    }

    if (node.type === "Assignment") {
        const left = generateExpression(node.left);
        const right = generateExpression(node.right);
        return left + " = " + right;
    }

    if (node.type === "FunctionCall") {
        const callee = generateExpression(node.callee);
        const args = [];
        for (let i = 0; i < node.arguments.length; i++) {
            args.push(generateExpression(node.arguments[i]));
        }
        return callee + "(" + args.join(", ") + ")";
    }

    if (node.type === "PropertyAccess") {
        const obj = typeof node.object === "string" ? node.object : generateExpression(node.object);
        return obj + "." + node.property;
    }

    if (node.type === "ArrayAccess") {
        const obj = typeof node.object === "string" ? node.object : generateExpression(node.object);
        const index = generateExpression(node.index);
        return obj + "[" + index + "]";
    }

    if (node.type === "ObjectLiteral") {
        return "{}";
    }

    if (node.type === "ArrayLiteral") {
        return "[]";
    }

    if (node.type === "UnaryOp") {
        const operand = generateExpression(node.operand);
        return node.operator + operand;
    }

    return "/* Unknown expression: " + node.type + " */";
}

export function generateStatement(node, isTopLevel = false) {
    if (node.type === "LetStatement") {
        const value = generateExpression(node.value);
        return "let " + node.name + " = " + value + ";";
    }

    if (node.type === "FunctionDeclaration") {
        const params = node.parameters.join(", ");
        const body = generateStatement(node.body, false);
        return "export function " + node.name + "(" + params + ") " + body;
    }

    if (node.type === "IfStatement") {
        const condition = generateExpression(node.condition);
        const thenBranch = generateStatement(node.thenBranch, false);
        let result = "if (" + condition + ") " + thenBranch;

        if (node.elseBranch && node.elseBranch.type) {
            const elseBranch = generateStatement(node.elseBranch, false);
            result = result + " else " + elseBranch;
        }

        return result;
    }

    if (node.type === "WhileStatement") {
        const condition = generateExpression(node.condition);
        const body = generateStatement(node.body, false);
        return "while (" + condition + ") " + body;
    }

    if (node.type === "ReturnStatement") {
        if (node.value && node.value.type) {
            const value = generateExpression(node.value);
            return "return " + value + ";";
        }
        return "return;";
    }

    if (node.type === "Block") {
        const statements = [];
        for (let i = 0; i < node.statements.length; i++) {
            statements.push(generateStatement(node.statements[i], false));
        }
        return "{\n" + statements.join("\n") + "\n}";
    }

    if (node.type === "ExpressionStatement") {
        return generateExpression(node.expression) + ";";
    }

    return "/* Unknown statement: " + node.type + " */";
}

export function generateProgram(node) {
    const statements = [];

    for (let i = 0; i < node.statements.length; i++) {
        const statementNode = node.statements[i];
        statements.push(generateStatement(statementNode, true));
    }

    return statements.join("\n");
}

export function generate(ast) {
    if (ast.type === "Program") {
        return generateProgram(ast);
    }

    if (ast.type === "ParseError") {
        return "// Parse Error: " + ast.message + " at line " + ast.line + ", column " + ast.column;
    }

    return "/* Unknown AST node: " + ast.type + " */";
}
