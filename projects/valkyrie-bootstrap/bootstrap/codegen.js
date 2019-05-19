// Valkyrie Runtime Support
let ValkyrieRuntime = {
    print: console.log,
    assert: (condition, message) => {
        if (!condition) throw new Error(message || "Assertion failed");
    }
};

let CodeGenerator = {output: "", indentLevel: 0};

function initCodeGenerator() {
    let generator = {};
    generator.output = "";
    generator.indentLevel = 0;
    return generator;
}

function addIndent(generator) {
    let indent = "";
    let i = 0;
    while ((i < generator.indentLevel)) {
        indent = (indent + "  ");
        i = (i + 1);
    }
    return indent;
}

function write(generator, code) {
    generator.output = (generator.output + code);
    return generator;
}

function writeLine(generator, code) {
    let indent = addIndent(generator);
    generator.output = (((generator.output + indent) + code) + "\n");
    return generator;
}

function increaseIndent(generator) {
    generator.indentLevel = (generator.indentLevel + 1);
    return generator;
}

function decreaseIndent(generator) {
    if ((generator.indentLevel > 0)) {
        generator.indentLevel = (generator.indentLevel - 1);
    }
    return generator;
}

function generateProgram(generator, node) {
    // 生成运行时支持代码
    writeLine(generator, "// Valkyrie Runtime Support");
    writeLine(generator, "let ValkyrieRuntime = {");
    writeLine(generator, "    print: console.log,");
    writeLine(generator, "    assert: (condition, message) => {");
    writeLine(generator, "        if (!condition) throw new Error(message || \"Assertion failed\");");
    writeLine(generator, "    }");
    writeLine(generator, "};");
    writeLine(generator, "");
    writeLine(generator, "let CodeGenerator = {output: \"\", indentLevel: 0};");
    writeLine(generator, "");
    
    let i = 0;
    while ((i < node.statements.length)) {
        generateStatement(generator, node.statements[i]);
        i = (i + 1);
    }
    return generator;
}

function generateStatement(generator, node) {
    if ((node.type === "VariableDeclaration")) {
        generateVariableDeclaration(generator, node);
    } else if ((node.type === "FunctionDeclaration")) {
        generateFunctionDeclaration(generator, node);
    } else if ((node.type === "IfStatement")) {
        generateIfStatement(generator, node);
    } else if ((node.type === "WhileStatement")) {
        generateWhileStatement(generator, node);
    } else if ((node.type === "BlockStatement")) {
        generateBlockStatement(generator, node);
    } else if ((node.type === "ExpressionStatement")) {
        generateExpressionStatement(generator, node);
    } else if ((node.type === "ExportStatement")) {
        generateExportStatement(generator, node);
    } else if ((node.type === "ReturnStatement")) {
        generateReturnStatement(generator, node);
    }
    return generator;
}

function generateVariableDeclaration(generator, node) {
    let code = ("let " + node.name);

    // 检查是否有初始化表达式
    if (node.initializer || node.value) {
        code += " = ";
        write(generator, (addIndent(generator) + code));
        generateExpression(generator, node.initializer || node.value);
    } else {
        write(generator, (addIndent(generator) + code));
    }

    writeLine(generator, ";");
    return generator;
}

function generateFunctionDeclaration(generator, node) {
    let code = (("function " + node.name) + "(");
    write(generator, (addIndent(generator) + code));
    let i = 0;
    while ((i < node.parameters.length)) {
        if ((i > 0)) {
            write(generator, ", ");
        }
        write(generator, node.parameters[i].name);
        i = (i + 1);
    }
    writeLine(generator, ") {");
    increaseIndent(generator);
    generateFunctionBody(generator, node.body);
    decreaseIndent(generator);
    writeLine(generator, "}");
    writeLine(generator, "");
    return generator;
}

function generateIfStatement(generator, node) {
    write(generator, (addIndent(generator) + "if ("));
    generateExpression(generator, node.condition);
    writeLine(generator, ") {");
    increaseIndent(generator);
    generateStatement(generator, node.thenBranch);
    decreaseIndent(generator);

    if (node.elseBranch && node.elseBranch.type && node.elseBranch.type !== "") {
        if ((node.elseBranch.type === "IfStatement")) {
            write(generator, (addIndent(generator) + "} else "));
            generateIfStatement(generator, node.elseBranch);
        } else {
            writeLine(generator, "} else {");
            increaseIndent(generator);
            generateStatement(generator, node.elseBranch);
            decreaseIndent(generator);
            writeLine(generator, "}");
        }
    } else {
        writeLine(generator, "}");
    }
    return generator;
}

function generateWhileStatement(generator, node) {
    write(generator, addIndent(generator) + "while (");
    generateExpression(generator, node.condition);
    writeLine(generator, ") {");

    increaseIndent(generator);
    generateStatement(generator, node.body);
    decreaseIndent(generator);
    writeLine(generator, "}");

    return generator;
}

function generateBlockStatement(generator, node) {
    let i = 0;
    while ((i < node.statements.length)) {
        generateStatement(generator, node.statements[i]);
        i = (i + 1);
    }
    return generator;
}

function generateIfExpression(generator, node) {
    write(generator, (addIndent(generator) + "if ("));
    generateExpression(generator, node.condition);
    writeLine(generator, ") {");
    increaseIndent(generator);
    generateFunctionBody(generator, node.thenBranch);
    decreaseIndent(generator);

    if (node.elseBranch && node.elseBranch.type && node.elseBranch.type !== "") {
        if ((node.elseBranch.type === "IfStatement")) {
            write(generator, (addIndent(generator) + "} else "));
            generateIfExpression(generator, node.elseBranch);
        } else {
            writeLine(generator, "} else {");
            increaseIndent(generator);
            generateFunctionBody(generator, node.elseBranch);
            decreaseIndent(generator);
            writeLine(generator, "}");
        }
    } else {
        writeLine(generator, "}");
    }
    return generator;
}

function generateFunctionBody(generator, node) {
  let count = node.statements.length;
  let i = 0;
  while ((i < (count - 1))) {
    generateStatement(generator, node.statements[i]);
    i = (i + 1);
  }
  if ((count > 0)) {
    let last = node.statements[(count - 1)];
    if ((last.type == "ExpressionStatement")) {
      write(generator, (addIndent(generator) + "return "));
      generateExpression(generator, last.expression);
      writeLine(generator, ";");
    } else if ((last.type == "IfStatement")) {
      generateIfExpression(generator, last);
    } else if ((last.type == "ReturnStatement")) {
      generateReturnStatement(generator, last);
    } else {
      generateStatement(generator, last);
    }
  }
}

function generateExpressionStatement(generator, node) {
    write(generator, addIndent(generator));
    generateExpression(generator, node.expression);
    writeLine(generator, ";");
    return generator;
}

function generateExportStatement(generator, node) {
    write(generator, addIndent(generator) + "export ");
    if (node.declaration) {
        if (node.declaration.type === "VariableDeclaration") {
            generateVariableDeclaration(generator, node.declaration);
        } else if (node.declaration.type === "FunctionDeclaration") {
            generateFunctionDeclaration(generator, node.declaration);
        } else {
            generateStatement(generator, node.declaration);
        }
    } else if (node.specifiers && node.specifiers.length > 0) {
        write(generator, "{ ");
        let i = 0;
        while ((i < node.specifiers.length)) {
            if ((i > 0)) {
                write(generator, ", ");
            }
            generateIdentifier(generator, node.specifiers[i]);
            i = (i + 1);
        }
        writeLine(generator, " };");
    } else {
        writeLine(generator, "// Invalid export statement");
    }
    return generator;
}

function generateReturnStatement(generator, node) {
    write(generator, (addIndent(generator) + "return"));
    if (node.value) {
        write(generator, " ");
        generateExpression(generator, node.value);
    }
    writeLine(generator, ";");
    return generator;
}

function generateExpression(generator, node) {
    if (!node || !node.type) {
        console.error("Invalid node passed to generateExpression:", node);
        write(generator, "{}"); 
        return generator;
    }

    if ((node.type === "AssignmentExpression")) {
        generateAssignmentExpression(generator, node);
    } else if ((node.type === "BinaryExpression")) {
        generateBinaryExpression(generator, node);
    } else if ((node.type === "UnaryExpression")) {
        generateUnaryExpression(generator, node);
    } else if ((node.type === "CallExpression")) {
        generateCallExpression(generator, node);
    } else if ((node.type === "MemberExpression")) {
        generateMemberExpression(generator, node);
    } else if ((node.type === "Identifier")) {
        generateIdentifier(generator, node);
    } else if ((node.type === "NumberLiteral")) {
        generateNumberLiteral(generator, node);
    } else if ((node.type === "StringLiteral")) {
        generateStringLiteral(generator, node);
    } else if ((node.type === "BooleanLiteral")) {
        generateBooleanLiteral(generator, node);
    } else if ((node.type === "ObjectLiteral")) {
        generateObjectLiteral(generator, node);
    } else if ((node.type === "ArrayLiteral")) {
        generateArrayLiteral(generator, node);
    } else {
        write(generator, "{}");
    }
    return generator;
}

function generateAssignmentExpression(generator, node) {
    generateExpression(generator, node.left);
    write(generator, " = ");
    generateExpression(generator, node.right);
    return generator;
}

let operatorMap = {
    '+': '+', '-': '-', '*': '*', '/': '/', '%': '%',
    '==': '==', '!=': '!=', '<': '<', '<=': '<=', '>': '>', '>=': '>=',
    '&&': '&&', '||': '||', '!': '!', '=': '=',
    'PLUS': '+', 'MINUS': '-', 'MULTIPLY': '*', 'DIVIDE': '/', 'MODULO': '%',
    'EQUAL': '==', 'NOT_EQUAL': '!=', 'LESS': '<', 'GREATER': '>',
    'LESS_EQUAL': '<=', 'GREATER_EQUAL': '>=', 'AND': '&&', 'OR': '||',
    'NOT': '!', 'ASSIGN': '='
};

function getOperatorSymbol(operator) {
    return operatorMap[operator] || operator;
}

function generateBinaryExpression(generator, node) {
    write(generator, "(");
    generateExpression(generator, node.left);
    let opSymbol = getOperatorSymbol(node.operator);
    write(generator, " " + opSymbol + " ");
    generateExpression(generator, node.right);
    write(generator, ")");
    return generator;
}

function generateUnaryExpression(generator, node) {
    let opSymbol = getOperatorSymbol(node.operator);
    write(generator, opSymbol);
    generateExpression(generator, node.operand);
    return generator;
}

function generateCallExpression(generator, node) {
    generateExpression(generator, node.callee);
    write(generator, "(");
    let i = 0;
    while ((i < node.arguments.length)) {
        if ((i > 0)) {
            write(generator, ", ");
        }
        generateExpression(generator, node.arguments[i]);
        i = (i + 1);
    }
    write(generator, ")");
    return generator;
}

function generateMemberExpression(generator, node) {
    generateExpression(generator, node.object);
    if (node.computed) {
        write(generator, "[");
        generateExpression(generator, node.property);
        write(generator, "]");
    } else {
        write(generator, ".");
        generateExpression(generator, node.property);
    }
    return generator;
}

function generateIdentifier(generator, node) {
    write(generator, node.name);
    return generator;
}

function generateNumberLiteral(generator, node) {
    write(generator, node.value);
    return generator;
}

function generateStringLiteral(generator, node) {
    if (node.value === null || node.value === undefined) {
        write(generator, '""');
        return generator;
    }
    let escaped = node.value.replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
    write(generator, '"' + escaped + '"');
    return generator;
}

function generateBooleanLiteral(generator, node) {
    if (node.value) {
        write(generator, "true");
    } else {
        write(generator, "false");
    }
    return generator;
}

function generateObjectLiteral(generator, node) {
    write(generator, "{");
    let i = 0;
    while ((i < node.properties.length)) {
        if ((i > 0)) {
            write(generator, ", ");
        }
        let property = node.properties[i];
        write(generator, (("\"" + property.key) + "\""));
        write(generator, ": ");
        generateExpression(generator, property.value);
        i = (i + 1);
    }
    write(generator, "}");
    return generator;
}

function generateArrayLiteral(generator, node) {
    write(generator, "[");
    let i = 0;
    while ((i < node.elements.length)) {
        if ((i > 0)) {
            write(generator, ", ");
        }
        generateExpression(generator, node.elements[i]);
        i = (i + 1);
    }
    write(generator, "]");
    return generator;
}

function generate(ast) {
    let generator = initCodeGenerator();
    generateProgram(generator, ast);
    return generator.output;
}

export {generate};