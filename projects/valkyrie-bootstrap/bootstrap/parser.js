// Bootstrap Parser - 手写的 JavaScript 版本

export function makeParser(tokens) {
    return {
        tokens: tokens,
        position: 0,
        current_token: tokens[0] || {type: "EOF"}
    };
}

export function advance(parser) {
    parser.position = parser.position + 1;
    if (parser.position < parser.tokens.length) {
        parser.current_token = parser.tokens[parser.position];
    } else {
        parser.current_token = {type: "EOF"};
    }
}

export function expect(parser, tokenType) {
    if (parser.current_token.type !== tokenType) {
        return {
            type: "ParseError",
            message: "Expected " + tokenType + " but got " + parser.current_token.type,
            line: parser.current_token.line || 0,
            column: parser.current_token.column || 0
        };
    }
    const token = parser.current_token;
    advance(parser);
    return token;
}

export function makeNode(type) {
    return {type: type};
}

export function parseExpression(parser) {
    return parseAssignment(parser);
}

export function parseAssignment(parser) {
    let left = parseLogic(parser);

    if (parser.current_token.type === "ASSIGN") {
        advance(parser);
        const right = parseAssignment(parser); // Right-associative for assignment
        const node = makeNode("Assignment");
        node.left = left;
        node.right = right;
        return node;
    }

    return left;
}

export function parseLogic(parser) {
    let left = parseEquality(parser);

    while (parser.current_token.type === "AND" || parser.current_token.type === "OR") {
        const op = parser.current_token.value;
        advance(parser);
        const right = parseEquality(parser);
        const node = makeNode("BinaryOp");
        node.left = left;
        node.operator = op;
        node.right = right;
        left = node;
    }

    return left;
}

export function parseEquality(parser) {
    let left = parseComparison(parser);

    while (parser.current_token.type === "EQ" || parser.current_token.type === "NE") {
        const op = parser.current_token.value;
        advance(parser);
        const right = parseComparison(parser);
        const node = makeNode("BinaryOp");
        node.left = left;
        node.operator = op;
        node.right = right;
        left = node;
    }

    return left;
}

export function parseComparison(parser) {
    let left = parseArithmetic(parser);

    while (parser.current_token.type === "GT" || parser.current_token.type === "LT" ||
    parser.current_token.type === "GTE" || parser.current_token.type === "LTE" ||
    parser.current_token.type === "PIPE" || parser.current_token.type === "AMPERSAND") {
        const op = parser.current_token.value;
        advance(parser);
        const right = parseArithmetic(parser);
        const node = makeNode("BinaryOp");
        node.left = left;
        node.operator = op;
        node.right = right;
        left = node;
    }

    return left;
}

export function parseArithmetic(parser) {
    let left = parseTerm(parser);

    while (parser.current_token.type === "PLUS" || parser.current_token.type === "MINUS") {
        const op = parser.current_token.value;
        advance(parser);
        const right = parseTerm(parser);
        const node = makeNode("BinaryOp");
        node.left = left;
        node.operator = op;
        node.right = right;
        left = node;
    }

    return left;
}

export function parseTerm(parser) {
    let left = parseFactor(parser);

    while (parser.current_token.type === "MULTIPLY" || parser.current_token.type === "DIVIDE") {
        const op = parser.current_token.value;
        advance(parser);
        const right = parseFactor(parser);
        const node = makeNode("BinaryOp");
        node.left = left;
        node.operator = op;
        node.right = right;
        left = node;
    }

    return left;
}

export function parsePrimary(parser) {
    const token = parser.current_token;
    switch (token.type) {
        case "NUMBER": {
            const node = makeNode("Number");
            node.value = token.value;
            advance(parser);
            return node;
        }
        case "STRING": {
            const node = makeNode("String");
            node.value = token.value;
            advance(parser);
            return node;
        }
        case "BOOLEAN": {
            const node = makeNode("Boolean");
            node.value = token.value;
            advance(parser);
            return node;
        }
        case "IDENTIFIER": {
            const node = makeNode("Identifier");
            node.name = token.value;
            advance(parser);
            return node;
        }
        case "LPAREN": {
            advance(parser);
            const expr = parseExpression(parser);
            if (expr.type === "ParseError") return expr;
            expect(parser, "RPAREN");
            return expr;
        }
        case "LBRACKET": { // Array literal
            advance(parser);
            const node = makeNode("ArrayLiteral");
            node.elements = [];
            if (parser.current_token.type !== "RBRACKET") {
                // In the bootstrap, we only need to support empty arrays for now
            }
            expect(parser, "RBRACKET");
            return node;
        }
        case "LBRACE": { // Object literal
            advance(parser);
            const node = makeNode("ObjectLiteral");
            node.properties = [];
            if (parser.current_token.type !== "RBRACE") {
                // In the bootstrap, we only need to support empty objects for now
            }
            expect(parser, "RBRACE");
            return node;
        }
        default:
            return {
                type: "ParseError",
                message: "Unexpected token in primary expression: " + token.type,
                line: token.line || 0,
                column: token.column || 0
            };
    }
}

export function parseCallMemberExpression(parser) {
    let expr = parsePrimary(parser);
    if (expr.type === "ParseError") return expr;

    while (true) {
        if (parser.current_token.type === "LPAREN") {
            advance(parser); // consume '('
            const args = [];
            if (parser.current_token.type !== "RPAREN") {
                args.push(parseExpression(parser));
                while (parser.current_token.type === "COMMA") {
                    advance(parser);
                    args.push(parseExpression(parser));
                }
            }
            expect(parser, "RPAREN");

            const callNode = makeNode("FunctionCall");
            callNode.callee = expr;
            callNode.arguments = args;
            expr = callNode;
        } else if (parser.current_token.type === "DOT") {
            advance(parser);
            const property = expect(parser, "IDENTIFIER");
            if (property.type === "ParseError") return property;

            const accessNode = makeNode("PropertyAccess");
            accessNode.object = expr;
            accessNode.property = property.value;
            expr = accessNode;
        } else if (parser.current_token.type === "LBRACKET") {
            advance(parser);
            const index = parseExpression(parser);
            if (index.type === "ParseError") return index;
            expect(parser, "RBRACKET");

            const accessNode = makeNode("ArrayAccess");
            accessNode.object = expr;
            accessNode.index = index;
            expr = accessNode;
        } else {
            break;
        }
    }
    return expr;
}

export function parseUnary(parser) {
    if (parser.current_token.type === "NOT") {
        advance(parser);
        const operand = parseUnary(parser);
        if (operand.type === "ParseError") return operand;
        const node = makeNode("UnaryOp");
        node.operator = "!";
        node.operand = operand;
        return node;
    }
    return parseCallMemberExpression(parser);
}

export function parseFactor(parser) {
    return parseUnary(parser);
}

export function parseStatement(parser) {
    // 添加安全检查
    if (parser.current_token.type === "EOF") {
        return {
            type: "ParseError",
            message: "Unexpected end of file",
            line: 0,
            column: 0
        };
    }

    if (parser.current_token.type === "LET") {
        return parseLetStatement(parser);
    }

    if (parser.current_token.type === "FUNCTION") {
        return parseFunctionDeclaration(parser);
    }

    if (parser.current_token.type === "IF") {
        return parseIfStatement(parser);
    }

    if (parser.current_token.type === "WHILE") {
        return parseWhileStatement(parser);
    }

    if (parser.current_token.type === "RETURN") {
        return parseReturnStatement(parser);
    }

    if (parser.current_token.type === "LBRACE") {
        return parseBlock(parser);
    }


    // 表达式语句
    const expr = parseExpression(parser);

    // 检查表达式是否是错误
    if (expr && expr.type === "ParseError") {
        return expr;
    }

    expect(parser, "SEMICOLON");
    const stmt = makeNode("ExpressionStatement");
    stmt.expression = expr;
    return stmt;
}


export function parseLetStatement(parser) {
    advance(parser); // skip 'let'
    const name = expect(parser, "IDENTIFIER");

    // 检查 expect 是否返回错误
    if (name && name.type === "ParseError") {
        return name;
    }

    const assignToken = expect(parser, "ASSIGN");
    if (assignToken && assignToken.type === "ParseError") {
        return assignToken;
    }

    const value = parseExpression(parser);
    if (value && value.type === "ParseError") {
        return value;
    }

    expect(parser, "SEMICOLON");

    const node = makeNode("LetStatement");
    node.name = name.value;
    node.value = value;
    return node;
}

export function parseFunctionDeclaration(parser) {
    advance(parser); // skip 'fn'
    const name = expect(parser, "IDENTIFIER");
    expect(parser, "LPAREN");

    const params = [];
    if (parser.current_token.type !== "RPAREN") {
        params.push(expect(parser, "IDENTIFIER").value);

        while (parser.current_token.type === "COMMA") {
            advance(parser);
            params.push(expect(parser, "IDENTIFIER").value);
        }
    }

    expect(parser, "RPAREN");
    const body = parseBlock(parser);

    const node = makeNode("FunctionDeclaration");
    node.name = name.value;
    node.parameters = params;
    node.body = body;
    return node;
}

export function parseIfStatement(parser) {
    advance(parser); // skip 'if'
    const condition = parseExpression(parser);
    const thenBranch = parseBlock(parser);
    let elseBranch = {};

    if (parser.current_token.type === "ELSE") {
        advance(parser);
        elseBranch = parseStatement(parser);
    }

    const node = makeNode("IfStatement");
    node.condition = condition;
    node.thenBranch = thenBranch;
    node.elseBranch = elseBranch;
    return node;
}

export function parseWhileStatement(parser) {
    advance(parser); // skip 'while'
    const condition = parseExpression(parser);
    const body = parseBlock(parser);

    const node = makeNode("WhileStatement");
    node.condition = condition;
    node.body = body;
    return node;
}

export function parseReturnStatement(parser) {
    advance(parser); // skip 'return'
    let value = {};

    if (parser.current_token.type !== "SEMICOLON") {
        value = parseExpression(parser);
    }

    expect(parser, "SEMICOLON");

    const node = makeNode("ReturnStatement");
    node.value = value;
    return node;
}

export function parseBlock(parser) {
    expect(parser, "LBRACE");
    const statements = [];

    while (parser.current_token.type !== "RBRACE" && parser.current_token.type !== "EOF") {
        const prevPosition = parser.position;
        const stmt = parseStatement(parser);

        // 检查是否有错误
        if (stmt && stmt.type === "ParseError") {
            console.log("Parse error in block:", stmt.message);
            return stmt; // 返回错误
        }

        if (stmt) {
            statements.push(stmt);
        }

        // 防止死循环：如果位置没有推进，强制推进一个token
        if (parser.position === prevPosition) {
            console.log("Warning: No progress in parseBlock, advancing token");
            advance(parser);
        }
    }

    expect(parser, "RBRACE");

    const node = makeNode("Block");
    node.statements = statements;
    return node;
}

export function parseProgram(parser) {
    const statements = [];

    while (parser.current_token.type !== "EOF") {
        const prevPosition = parser.position;
        const stmt = parseStatement(parser);

        // 检查是否有错误
        if (stmt && stmt.type === "ParseError") {
            return stmt; // 返回错误
        }

        statements.push(stmt);

        // 防止死循环：如果位置没有推进，强制推进一个token
        if (parser.position === prevPosition) {
            advance(parser);
        }
    }

    const node = makeNode("Program");
    node.statements = statements;
    return node;
}

export function parse(tokens) {
    const parser = makeParser(tokens);
    return parseProgram(parser);
}
