export function makeParser(tokens) {
    let parser = {};
    parser.tokens = tokens;
    parser.position = 0;
    parser.current_token = tokens[0];
    return parser;
}

export function advance(parser) {
    parser.position = (parser.position + 1);
    if ((parser.position < parser.tokens.length)) {
        parser.current_token = parser.tokens[parser.position];
    } else {
        parser.current_token = {};
        parser.current_token.type = "EOF";
    }
}

export function expect(parser, tokenType) {
    if ((parser.current_token.type != tokenType)) {
        let error = {};
        error.type = "ParseError";
        error.message = ((("Expected " + tokenType) + " but got ") + parser.current_token.type);
        error.line = parser.current_token.line;
        error.column = parser.current_token.column;
        return error;
    }
    let token = parser.current_token;
    advance(parser);
    return token;
}

export function makeNode(type) {
    let node = {};
    node.type = type;
    return node;
}

export function parseExpression(parser) {
    return parseAssignment(parser);
}

export function parseAssignment(parser) {
    let left = parseLogic(parser);
    if ((parser.current_token.type == "ASSIGN")) {
        advance(parser);
        let right = parseAssignment(parser);
        let node = makeNode("Assignment");
        node.left = left;
        node.right = right;
        return node;
    }
    return left;
}

export function parseLogic(parser) {
    let left = parseEquality(parser);
    while (((parser.current_token.type == "AND") || (parser.current_token.type == "OR"))) {
        let op = parser.current_token.value;
        advance(parser);
        let right = parseEquality(parser);
        let node = makeNode("BinaryOp");
        node.left = left;
        node.operator = op;
        node.right = right;
        left = node;
    }
    return left;
}

export function parseEquality(parser) {
    let left = parseComparison(parser);
    while (((parser.current_token.type == "EQ") || (parser.current_token.type == "NE"))) {
        let op = parser.current_token.value;
        advance(parser);
        let right = parseComparison(parser);
        let node = makeNode("BinaryOp");
        node.left = left;
        node.operator = op;
        node.right = right;
        left = node;
    }
    return left;
}

export function parseComparison(parser) {
    let left = parseArithmetic(parser);
    while (((((((parser.current_token.type == "GT") || (parser.current_token.type == "LT")) || (parser.current_token.type == "GTE")) || (parser.current_token.type == "LTE")) || (parser.current_token.type == "PIPE")) || (parser.current_token.type == "AMPERSAND"))) {
        let op = parser.current_token.value;
        advance(parser);
        let right = parseArithmetic(parser);
        let node = makeNode("BinaryOp");
        node.left = left;
        node.operator = op;
        node.right = right;
        left = node;
    }
    return left;
}

export function parseArithmetic(parser) {
    let left = parseTerm(parser);
    while (((parser.current_token.type == "PLUS") || (parser.current_token.type == "MINUS"))) {
        let op = parser.current_token.value;
        advance(parser);
        let right = parseTerm(parser);
        let node = makeNode("BinaryOp");
        node.left = left;
        node.operator = op;
        node.right = right;
        left = node;
    }
    return left;
}

export function parseTerm(parser) {
    let left = parseFactor(parser);
    while (((parser.current_token.type == "MULTIPLY") || (parser.current_token.type == "DIVIDE"))) {
        let op = parser.current_token.value;
        advance(parser);
        let right = parseFactor(parser);
        let node = makeNode("BinaryOp");
        node.left = left;
        node.operator = op;
        node.right = right;
        left = node;
    }
    return left;
}

export function parsePrimary(parser) {
    if ((parser.current_token.type == "NUMBER")) {
        let value = parser.current_token.value;
        advance(parser);
        let node = makeNode("Number");
        node.value = value;
        return node;
    }
    if ((parser.current_token.type == "STRING")) {
        let value = parser.current_token.value;
        advance(parser);
        let node = makeNode("String");
        node.value = value;
        return node;
    }
    if ((parser.current_token.type == "BOOLEAN")) {
        let value = parser.current_token.value;
        advance(parser);
        let node = makeNode("Boolean");
        node.value = value;
        return node;
    }
    if ((parser.current_token.type == "IDENTIFIER")) {
        let name = parser.current_token.value;
        advance(parser);
        let node = makeNode("Identifier");
        node.name = name;
        return node;
    }
    return parseCallMemberExpression(parser);
}

export function parseCallMemberExpression(parser) {
    let expr = parsePrimary(parser);
    while (true) {
        if ((parser.current_token.type == "LPAREN")) {
            advance(parser);
            let args = [];
            if ((parser.current_token.type != "RPAREN")) {
                args.push(parseExpression(parser));
                while ((parser.current_token.type == "COMMA")) {
                    advance(parser);
                    args.push(parseExpression(parser));
                }
            }
            expect(parser, "RPAREN");
            let callNode = makeNode("FunctionCall");
            callNode.callee = expr;
            callNode.arguments = args;
            expr = callNode;
        } else if ((parser.current_token.type == "DOT")) {
            advance(parser);
            let property = expect(parser, "IDENTIFIER");
            let accessNode = makeNode("PropertyAccess");
            accessNode.object = expr;
            accessNode.property = property.value;
            expr = accessNode;
        } else if ((parser.current_token.type == "LBRACKET")) {
            advance(parser);
            let index = parseExpression(parser);
            expect(parser, "RBRACKET");
            let accessNode = makeNode("ArrayAccess");
            accessNode.object = expr;
            accessNode.index = index;
            expr = accessNode;
        } else {
            break;
        }
    }
    return expr;
}

export function parseFactor(parser) {
    if ((parser.current_token.type == "NOT")) {
        advance(parser);
        let operand = parseFactor(parser);
        let node = makeNode("UnaryOp");
        node.operator = "!";
        node.operand = operand;
        return node;
    }
    if ((parser.current_token.type == "LPAREN")) {
        advance(parser);
        let expr = parseExpression(parser);
        expect(parser, "RPAREN");
        return expr;
    }
    if ((parser.current_token.type == "LBRACKET")) {
        advance(parser);
        let node = makeNode("ArrayLiteral");
        node.elements = [];
        if ((parser.current_token.type == "RBRACKET")) {
            advance(parser);
            return node;
        }
        while (((parser.current_token.type != "RBRACKET") && (parser.current_token.type != "EOF"))) {
            advance(parser);
        }
        if ((parser.current_token.type == "RBRACKET")) {
            advance(parser);
        }
        return node;
    }
    if ((parser.current_token.type == "LBRACE")) {
        advance(parser);
        let node = makeNode("ObjectLiteral");
        node.properties = [];
        if ((parser.current_token.type == "RBRACE")) {
            advance(parser);
            return node;
        }
        while (((parser.current_token.type != "RBRACE") && (parser.current_token.type != "EOF"))) {
            advance(parser);
        }
        if ((parser.current_token.type == "RBRACE")) {
            advance(parser);
        }
        return node;
    }
    return parseCallMemberExpression(parser);
}

export function parseStatement(parser) {
    if ((parser.current_token.type == "EOF")) {
        let error = {};
        error.type = "ParseError";
        error.message = "Unexpected EOF in statement";
        error.line = parser.current_token.line;
        error.column = parser.current_token.column;
        return error;
    }
    if ((parser.current_token.type == "NAMESPACE")) {
        return parseNamespaceStatement(parser);
    }
    if ((parser.current_token.type == "LET")) {
        return parseLetStatement(parser);
    }
    if ((parser.current_token.type == "FUNCTION")) {
        return parseFunctionDeclaration(parser);
    }
    if ((parser.current_token.type == "IF")) {
        return parseIfStatement(parser);
    }
    if ((parser.current_token.type == "WHILE")) {
        return parseWhileStatement(parser);
    }
    if ((parser.current_token.type == "RETURN")) {
        return parseReturnStatement(parser);
    }
    if ((parser.current_token.type == "LBRACE")) {
        return parseBlock(parser);
    }
    let expr = parseExpression(parser);
    if ((expr.type == "ParseError")) {
        return expr;
    }
    expect(parser, "SEMICOLON");
    let stmt = makeNode("ExpressionStatement");
    stmt.expression = expr;
    return stmt;
}

export function parseLetStatement(parser) {
    advance(parser);
    let name = expect(parser, "IDENTIFIER");
    if ((name && (name.type == "ParseError"))) {
        return name;
    }
    let assignToken = expect(parser, "ASSIGN");
    if ((assignToken && (assignToken.type == "ParseError"))) {
        return assignToken;
    }
    let value = parseExpression(parser);
    if ((value && (value.type == "ParseError"))) {
        return value;
    }
    expect(parser, "SEMICOLON");
    let node = makeNode("LetStatement");
    node.name = name.value;
    node.value = value;
    return node;
}

export function parseNamespaceStatement(parser) {
    advance(parser);
    let path = [];
    let identifier = expect(parser, "IDENTIFIER");
    if ((identifier.type == "ParseError")) {
        return identifier;
    }
    path.push(identifier.value);
    while ((parser.current_token.type == "DOUBLE_COLON")) {
        advance(parser);
        identifier = expect(parser, "IDENTIFIER");
        if ((identifier.type == "ParseError")) {
            return identifier;
        }
        path.push(identifier.value);
    }
    let semicolon = expect(parser, "SEMICOLON");
    if ((semicolon.type == "ParseError")) {
        return semicolon;
    }
    let node = makeNode("NamespaceStatement");
    node.path = path;
    return node;
}

export function parseFunctionDeclaration(parser) {
    advance(parser);
    let name = expect(parser, "IDENTIFIER");
    expect(parser, "LPAREN");
    let params = [];
    if ((parser.current_token.type != "RPAREN")) {
        params.push(expect(parser, "IDENTIFIER").value);
        while ((parser.current_token.type == "COMMA")) {
            advance(parser);
            params.push(expect(parser, "IDENTIFIER").value);
        }
    }
    expect(parser, "RPAREN");
    let body = parseBlock(parser);
    let node = makeNode("FunctionDeclaration");
    node.name = name.value;
    node.parameters = params;
    node.body = body;
    return node;
}

export function parseIfStatement(parser) {
    advance(parser);
    let condition = parseExpression(parser);
    let thenBranch = parseStatement(parser);
    let node = makeNode("IfStatement");
    node.condition = condition;
    node.thenBranch = thenBranch;
    node.elseBranch = null;
    if ((parser.current_token.type == "ELSE")) {
        advance(parser);
        node.elseBranch = parseStatement(parser);
    }
    return node;
}

export function parseWhileStatement(parser) {
    advance(parser);
    let condition = parseExpression(parser);
    let body = parseBlock(parser);
    let node = makeNode("WhileStatement");
    node.condition = condition;
    node.body = body;
    return node;
}

export function parseReturnStatement(parser) {
    advance(parser);
    let node = makeNode("ReturnStatement");
    if ((parser.current_token.type == "SEMICOLON")) {
        node.value = null;
    } else {
        node.value = parseExpression(parser);
    }
    expect(parser, "SEMICOLON");
    return node;
}

export function parseBlock(parser) {
    expect(parser, "LBRACE");
    let statements = [];
    while (((parser.current_token.type != "RBRACE") && (parser.current_token.type != "EOF"))) {
        let stmt = parseStatement(parser);
        statements.push(stmt);
    }
    expect(parser, "RBRACE");
    let node = makeNode("Block");
    node.statements = statements;
    return node;
}

export function parseProgram(parser) {
    let statements = [];
    while ((parser.current_token.type != "EOF")) {
        let stmt = parseStatement(parser);
        statements.push(stmt);
    }
    let node = makeNode("Program");
    node.statements = statements;
    return node;
}

export function parse(tokens) {
    let parser = makeParser(tokens);
    return parseProgram(parser);
}
