// Valkyrie Runtime Support
let ValkyrieRuntime = {
    print: console.log,
    assert: (condition, message) => {
        if (!condition) throw new Error(message || "Assertion failed");
    }
};

function createProgram(statements, line, column) {
    let node = {};
    node.type = "Program";
    node.statements = statements;
    node.line = line;
    node.column = column;
    return node;
}

function createVariableDeclaration(name, value, mutable, typeAnnotation, line, column) {
    let node = {};
    node.type = "VariableDeclaration";
    node.name = name;
    node.value = value;
    node.mutable = mutable;
    node.typeAnnotation = typeAnnotation;
    node.line = line;
    node.column = column;
    return node;
}

function createFunctionDeclaration(name, parameters, body, returnType, line, column) {
    let node = {};
    node.type = "FunctionDeclaration";
    node.name = name;
    node.parameters = parameters;
    node.body = body;
    node.returnType = returnType;
    node.line = line;
    node.column = column;
    return node;
}

function createIfStatement(condition, thenBranch, elseBranch, line, column) {
    let node = {};
    node.type = "IfStatement";
    node.condition = condition;
    node.thenBranch = thenBranch;
    node.elseBranch = elseBranch;
    node.line = line;
    node.column = column;
    return node;
}

function createWhileStatement(condition, body, line, column) {
    let node = {};
    node.type = "WhileStatement";
    node.condition = condition;
    node.body = body;
    node.line = line;
    node.column = column;
    return node;
}

function createExportStatement(declaration, specifiers, line, column) {
    let node = {};
    node.type = "ExportStatement";
    node.declaration = declaration;
    node.specifiers = specifiers;
    node.line = line;
    node.column = column;
    return node;
}

function createIfExpression(condition, thenExpr, elseExpr, line, column) {
    let node = {};
    node.type = "IfExpression";
    node.condition = condition;
    node.thenExpr = thenExpr;
    node.elseExpr = elseExpr;
    node.line = line;
    node.column = column;
    return node;
}

function createBlockStatement(statements, line, column) {
    let node = {};
    node.type = "BlockStatement";
    node.statements = statements;
    node.line = line;
    node.column = column;
    return node;
}

function createExpressionStatement(expression, line, column) {
    let node = {};
    node.type = "ExpressionStatement";
    node.expression = expression;
    node.line = line;
    node.column = column;
    return node;
}

function createAssignmentExpression(left, right, line, column) {
    let node = {};
    node.type = "AssignmentExpression";
    node.left = left;
    node.right = right;
    node.line = line;
    node.column = column;
    return node;
}

function createBinaryExpression(left, operator, right, line, column) {
    let node = {};
    node.type = "BinaryExpression";
    node.left = left;
    node.operator = operator;
    node.right = right;
    node.line = line;
    node.column = column;
    return node;
}

function createUnaryExpression(operator, operand, line, column) {
    let node = {};
    node.type = "UnaryExpression";
    node.operator = operator;
    node.operand = operand;
    node.line = line;
    node.column = column;
    return node;
}

function createCallExpression(callee, args, line, column) {
    let node = {};
    node.type = "CallExpression";
    node.callee = callee;
    node.arguments = args;
    node.line = line;
    node.column = column;
    return node;
}

function createIdentifier(name, line, column) {
    let node = {};
    node.type = "Identifier";
    node.name = name;
    node.line = line;
    node.column = column;
    return node;
}

function createNumberLiteral(value, line, column) {
    let node = {};
    node.type = "NumberLiteral";
    node.value = value;
    node.line = line;
    node.column = column;
    return node;
}

function createStringLiteral(value, line, column) {
    let node = {};
    node.type = "StringLiteral";
    node.value = value;
    node.line = line;
    node.column = column;
    return node;
}

function createBooleanLiteral(value, line, column) {
    let node = {};
    node.type = "BooleanLiteral";
    node.value = value;
    node.line = line;
    node.column = column;
    return node;
}

function createParameter(name, line, column) {
    let node = {};
    node.type = "Parameter";
    node.name = name;
    node.line = line;
    node.column = column;
    return node;
}

function createObjectLiteral(properties, line, column) {
    let node = {};
    node.type = "ObjectLiteral";
    node.properties = properties;
    node.line = line;
    node.column = column;
    return node;
}


function createArrayLiteral(elements, line, column) {
    let node = {};
    node.type = "ArrayLiteral";
    node.elements = elements;
    node.line = line;
    node.column = column;
    return node;
}

// removed ValkyrieCompiler class and default instance; export only AST helpers
export {
    createProgram,
    createVariableDeclaration,
    createFunctionDeclaration,
    createIfStatement,
    createWhileStatement,
    createExportStatement,
    createIfExpression,
    createBlockStatement,
    createExpressionStatement,
    createAssignmentExpression,
    createBinaryExpression,
    createUnaryExpression,
    createCallExpression,
    createIdentifier,
    createNumberLiteral,
    createStringLiteral,
    createBooleanLiteral,
    createParameter,
    createObjectLiteral,
    createArrayLiteral,
    createMemberExpression,
    createReturnStatement
};

function createMemberExpression(object, property, computed, line, column) {
    let node = {};
    node.type = "MemberExpression";
    node.object = object;
    node.property = property;
    node.computed = computed;
    node.line = line;
    node.column = column;
    return node;
}

function createReturnStatement(value, line, column) {
    let node = {};
    node.type = "ReturnStatement";
    node.value = value;
    node.line = line;
    node.column = column;
    return node;
}
