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

export function parseFactor(parser) {
    if ((parser.current_token.type == "NOT")) {
        advance(parser);
        let operand = parseFactor(parser);
        let node = makeNode("UnaryOp");
        node.operator = "!";
        node.operand = operand;
        return node;
    }
    return parseCallMemberExpression(parser);
}

export function parseCallMemberExpression(parser) {
    let expr = parseAtomicExpression(parser);
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
            let callNode = makeNode("MicroCall");
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

export function parseAtomicExpression(parser) {
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
    if ((parser.current_token.type == "SELF")) {
        advance(parser);
        let node = makeNode("ThisExpression");
        return node;
    }
    if ((parser.current_token.type == "NEW")) {
        advance(parser);
        let className = expect(parser, "IDENTIFIER");
        expect(parser, "LPAREN");
        let args = [];
        if ((parser.current_token.type != "RPAREN")) {
            args.push(parseAssignment(parser));
            while ((parser.current_token.type == "COMMA")) {
                advance(parser);
                args.push(parseAssignment(parser));
            }
        }
        expect(parser, "RPAREN");
        let node = makeNode("NewExpression");
        node.className = className.value;
        node.arguments = args;
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
        if ((parser.current_token.type != "RBRACKET")) {
            node.elements.push(parseAssignment(parser));
            while ((parser.current_token.type == "COMMA")) {
                advance(parser);
                node.elements.push(parseAssignment(parser));
            }
        }
        expect(parser, "RBRACKET");
        return node;
    }
    if ((parser.current_token.type == "LBRACE")) {
        advance(parser);
        let node = makeNode("ObjectLiteral");
        node.properties = [];
        if ((parser.current_token.type != "RBRACE")) {
            while (((parser.current_token.type == "IDENTIFIER") || (parser.current_token.type == "STRING"))) {
                let key = parser.current_token.value;
                advance(parser);
                expect(parser, "COLON");
                let value = parseAssignment(parser);
                let propertyNode = makeNode("Property");
                propertyNode.key = key;
                propertyNode.value = value;
                node.properties.push(propertyNode);
                if ((parser.current_token.type == "COMMA")) {
                    advance(parser);
                } else {
                    break;
                }
            }
        }
        expect(parser, "RBRACE");
        return node;
    }
    let error = {};
    error.type = "ParseError";
    error.message = ("Unexpected token: " + parser.current_token.type);
    error.line = parser.current_token.line;
    error.column = parser.current_token.column;
    return error;
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
    if ((parser.current_token.type == "USING")) {
        return parseUsingStatement(parser);
    }
    if ((parser.current_token.type == "CLASS")) {
        return parseClassDeclaration(parser);
    }
    if ((parser.current_token.type == "LET")) {
        return parseLetStatement(parser);
    }
    if ((parser.current_token.type == "MICRO")) {
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
    if ((expr && (expr.type == "ParseError"))) {
        return expr;
    }
    let semicolon = expect(parser, "SEMICOLON");
    if ((semicolon && (semicolon.type == "ParseError"))) {
        return semicolon;
    }
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

export function parseUsingStatement(parser) {
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
    let node = makeNode("UsingStatement");
    node.path = path;
    return node;
}

export function parseClassDeclaration(parser) {
    advance(parser);
    let name = expect(parser, "IDENTIFIER");
    let node = makeNode("ClassDeclaration");
    node.name = name.value;
    node.superClass = null;
    node.members = [];
    if ((parser.current_token.type == "EXTENDS")) {
        advance(parser);
        let superName = expect(parser, "IDENTIFIER");
        node.superClass = superName.value;
    }
    expect(parser, "LBRACE");
    while (((parser.current_token.type != "RBRACE") && (parser.current_token.type != "EOF"))) {
        let member = parseClassMember(parser);
        if ((member && (member.type != "ParseError"))) {
            node.members.push(member);
        } else if ((member && (member.type == "ParseError"))) {
            return member;
        }
    }
    expect(parser, "RBRACE");
    return node;
}

export function parseClassMember(parser) {
    if ((parser.current_token.type == "MICRO")) {
        advance(parser);
        let name = expect(parser, "IDENTIFIER");
        if ((name && (name.type == "ParseError"))) {
            return name;
        }
        let lparen = expect(parser, "LPAREN");
        if ((lparen && (lparen.type == "ParseError"))) {
            return lparen;
        }
        let params = [];
        if ((parser.current_token.type != "RPAREN")) {
            let param = null;
            if ((parser.current_token.type == "IDENTIFIER")) {
                param = expect(parser, "IDENTIFIER");
            } else if ((parser.current_token.type == "SELF")) {
                param = expect(parser, "SELF");
                param.value = "self";
            } else {
                let error = {};
                error.type = "ParseError";
                error.message = ("Expected parameter name but got " + parser.current_token.type);
                error.line = parser.current_token.line;
                error.column = parser.current_token.column;
                return error;
            }
            if ((param && (param.type == "ParseError"))) {
                return param;
            }
            params.push(param.value);
            while ((parser.current_token.type == "COMMA")) {
                advance(parser);
                if ((parser.current_token.type == "IDENTIFIER")) {
                    param = expect(parser, "IDENTIFIER");
                } else if ((parser.current_token.type == "SELF")) {
                    param = expect(parser, "SELF");
                    param.value = "self";
                } else {
                    let error = {};
                    error.type = "ParseError";
                    error.message = ("Expected parameter name but got " + parser.current_token.type);
                    error.line = parser.current_token.line;
                    error.column = parser.current_token.column;
                    return error;
                }
                if ((param && (param.type == "ParseError"))) {
                    return param;
                }
                params.push(param.value);
            }
        }
        let rparen = expect(parser, "RPAREN");
        if ((rparen && (rparen.type == "ParseError"))) {
            return rparen;
        }
        let body = parseBlock(parser);
        if ((body && (body.type == "ParseError"))) {
            return body;
        }
        let isInstanceMethod = false;
        if (((params.length > 0) && (params[0] == "self"))) {
            isInstanceMethod = true;
        }
        let methodNode = makeNode("MemberStatement");
        methodNode.name = name.value;
        methodNode.parameters = params;
        methodNode.body = body;
        methodNode.isInstanceMethod = isInstanceMethod;
        methodNode.isStatic = !isInstanceMethod;
        return methodNode;
    }
    if ((parser.current_token.type == "IDENTIFIER")) {
        let name = expect(parser, "IDENTIFIER");
        if ((name && (name.type == "ParseError"))) {
            return name;
        }
        let initValue = null;
        if ((parser.current_token.type == "ASSIGN")) {
            advance(parser);
            initValue = parseExpression(parser);
            if ((initValue && (initValue.type == "ParseError"))) {
                return initValue;
            }
        }
        let semicolon = expect(parser, "SEMICOLON");
        if ((semicolon && (semicolon.type == "ParseError"))) {
            return semicolon;
        }
        let node = makeNode("Property");
        node.name = name.value;
        node.initializer = initValue;
        return node;
    }
    let error = {};
    error.type = "ParseError";
    error.message = ("Expected class member (field or method) but got " + parser.current_token.type);
    error.line = parser.current_token.line;
    error.column = parser.current_token.column;
    return error;
}

export function parseFunctionDeclaration(parser) {
    advance(parser);
    let name = expect(parser, "IDENTIFIER");
    if ((name && (name.type == "ParseError"))) {
        return name;
    }
    let lparen = expect(parser, "LPAREN");
    if ((lparen && (lparen.type == "ParseError"))) {
        return lparen;
    }
    let params = [];
    if ((parser.current_token.type != "RPAREN")) {
        let param = null;
        if ((parser.current_token.type == "IDENTIFIER")) {
            param = expect(parser, "IDENTIFIER");
        } else if ((parser.current_token.type == "SELF")) {
            param = expect(parser, "SELF");
            param.value = "self";
        } else {
            let error = {};
            error.type = "ParseError";
            error.message = ("Expected parameter name but got " + parser.current_token.type);
            error.line = parser.current_token.line;
            error.column = parser.current_token.column;
            return error;
        }
        if ((param && (param.type == "ParseError"))) {
            return param;
        }
        params.push(param.value);
        while ((parser.current_token.type == "COMMA")) {
            advance(parser);
            if ((parser.current_token.type == "IDENTIFIER")) {
                param = expect(parser, "IDENTIFIER");
            } else if ((parser.current_token.type == "SELF")) {
                param = expect(parser, "SELF");
                param.value = "self";
            } else {
                let error = {};
                error.type = "ParseError";
                error.message = ("Expected parameter name but got " + parser.current_token.type);
                error.line = parser.current_token.line;
                error.column = parser.current_token.column;
                return error;
            }
            if ((param && (param.type == "ParseError"))) {
                return param;
            }
            params.push(param.value);
        }
    }
    let rparen = expect(parser, "RPAREN");
    if ((rparen && (rparen.type == "ParseError"))) {
        return rparen;
    }
    let body = parseBlock(parser);
    if ((body && (body.type == "ParseError"))) {
        return body;
    }
    let node = makeNode("MicroDeclaration");
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
        if ((stmt && (stmt.type == "ParseError"))) {
            return stmt;
        }
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
        if ((stmt && (stmt.type == "ParseError"))) {
            return stmt;
        }
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
