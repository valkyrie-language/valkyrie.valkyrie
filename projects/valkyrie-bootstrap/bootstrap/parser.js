// namespace package::parser;
class ValkyrieParser {
    constructor(tokens) {
        this.tokens = tokens;
        this.position = 0;
        this.current_token = tokens[0];
    }
}
class Node {
    constructor(type) {
        this.type = type;
    }
}
export function advance(parser) {
    parser.position = parser.position + 1;
    if (parser.position < parser.tokens.length) {
        parser.current_token = parser.tokens[parser.position];
    } else {
        parser.current_token = {};
        parser.current_token.type = "EOF";
    }
}
export function expect(parser, tokenType) {
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
    advance(parser);
    return token;
}
export function getOperatorPrecedence(tokenType) {
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
export function isRightAssociative(tokenType) {
    return tokenType == "ASSIGN";
}
export function parseExpressionWithPrecedence(parser, minPrecedence) {
    let left = parseUnaryExpression(parser);
    if (left && left.type == "ParseError") {
        return left;
    }
    while (true) {
        let precedence = getOperatorPrecedence(parser.current_token.type);
        if (precedence < minPrecedence) {
            break;
        }
        let op = parser.current_token.value;
        let tokenType = parser.current_token.type;
        advance(parser);
        let nextMinPrecedence = precedence;
        if (!isRightAssociative(tokenType)) {
            nextMinPrecedence = precedence + 1;
        }
        let right = parseExpressionWithPrecedence(parser, nextMinPrecedence);
        if (right && right.type == "ParseError") {
            return right;
        }
        if (tokenType == "ASSIGN") {
            let node = new Node("Assignment");
            node.left = left;
            node.right = right;
            left = node;
        } else {
            let node = new Node("BinaryOp");
            node.left = left;
            node.operator = op;
            node.right = right;
            left = node;
        }
    }
    return left;
}
export function parseExpression(parser) {
    return parseExpressionWithPrecedence(parser, 0);
}
export function parseUnaryExpression(parser) {
    if (
        parser.current_token.type == "BANG" ||
        parser.current_token.type == "MINUS"
    ) {
        let op = parser.current_token.value;
        advance(parser);
        let operand = parseUnaryExpression(parser);
        if (operand && operand.type == "ParseError") {
            return operand;
        }
        let node = new Node("UnaryOp");
        node.operator = op;
        node.operand = operand;
        return node;
    }
    if (parser.current_token.type == "NEW") {
        return parseNewExpression(parser);
    }
    return parsePostfixExpression(parser);
}
export function parseNewExpression(parser) {
    advance(parser);
    let className = expect(parser, "IDENTIFIER");
    if (className.type == "ParseError") {
        return className;
    }
    let lparen = expect(parser, "LPAREN");
    if (lparen.type == "ParseError") {
        return lparen;
    }
    let args = [];
    if (parser.current_token.type != "RPAREN") {
        let arg = parseExpression(parser);
        if (arg.type == "ParseError") {
            return arg;
        }
        args.push(arg);
        while (parser.current_token.type == "COMMA") {
            advance(parser);
            arg = parseExpression(parser);
            if (arg.type == "ParseError") {
                return arg;
            }
            args.push(arg);
        }
    }
    let rparen = expect(parser, "RPAREN");
    if (rparen.type == "ParseError") {
        return rparen;
    }
    let node = new Node("NewExpression");
    node.className = className.value;
    node.arguments = args;
    return node;
}
export function parsePostfixExpression(parser) {
    let expr = parseAtomicExpression(parser);
    if (expr && expr.type == "ParseError") {
        return expr;
    }
    while (true) {
        if (parser.current_token.type == "LPAREN") {
            advance(parser);
            let args = [];
            if (parser.current_token.type != "RPAREN") {
                let arg = parseExpression(parser);
                if (arg && arg.type == "ParseError") {
                    return arg;
                }
                args.push(arg);
                while (parser.current_token.type == "COMMA") {
                    advance(parser);
                    arg = parseExpression(parser);
                    if (arg && arg.type == "ParseError") {
                        return arg;
                    }
                    args.push(arg);
                }
            }
            let rparen = expect(parser, "RPAREN");
            if (rparen && rparen.type == "ParseError") {
                return rparen;
            }
            let callNode = new Node("MicroCall");
            callNode.callee = expr;
            callNode.arguments = args;
            expr = callNode;
        } else if (parser.current_token.type == "DOT") {
            advance(parser);
            if (parser.current_token.type == "AWAIT") {
                advance(parser);
                let awaitNode = new Node("AwaitExpression");
                awaitNode.argument = expr;
                expr = awaitNode;
            } else {
                let property = expect(parser, "IDENTIFIER");
                if (property && property.type == "ParseError") {
                    return property;
                }
                let accessNode = new Node("PropertyAccess");
                accessNode.object = expr;
                accessNode.property = property.value;
                expr = accessNode;
            }
        } else if (parser.current_token.type == "LBRACKET") {
            advance(parser);
            let index = parseExpression(parser);
            if (index && index.type == "ParseError") {
                return index;
            }
            let rbracket = expect(parser, "RBRACKET");
            if (rbracket && rbracket.type == "ParseError") {
                return rbracket;
            }
            let accessNode = new Node("ArrayAccess");
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
    if (parser.current_token.type == "NUMBER") {
        let value = parser.current_token.value;
        advance(parser);
        let node = new Node("Number");
        node.value = value;
        return node;
    }
    if (parser.current_token.type == "STRING") {
        let value = parser.current_token.value;
        advance(parser);
        let node = new Node("String");
        node.value = value;
        return node;
    }
    if (parser.current_token.type == "BOOLEAN") {
        let value = parser.current_token.value;
        advance(parser);
        let node = new Node("Boolean");
        node.value = value;
        return node;
    }
    if (parser.current_token.type == "IDENTIFIER") {
        let name = parser.current_token.value;
        advance(parser);
        let node = new Node("Identifier");
        node.name = name;
        return node;
    }
    if (parser.current_token.type == "SELF") {
        advance(parser);
        let node = new Node("ThisExpression");
        return node;
    }
    if (parser.current_token.type == "NEW") {
        advance(parser);
        let className = expect(parser, "IDENTIFIER");
        if (className && className.type == "ParseError") {
            return className;
        }
        let lparen = expect(parser, "LPAREN");
        if (lparen && lparen.type == "ParseError") {
            return lparen;
        }
        let args = [];
        if (parser.current_token.type != "RPAREN") {
            let arg = parseExpression(parser);
            if (arg && arg.type == "ParseError") {
                return arg;
            }
            args.push(arg);
            while (parser.current_token.type == "COMMA") {
                advance(parser);
                arg = parseExpression(parser);
                if (arg && arg.type == "ParseError") {
                    return arg;
                }
                args.push(arg);
            }
        }
        let rparen = expect(parser, "RPAREN");
        if (rparen && rparen.type == "ParseError") {
            return rparen;
        }
        let node = new Node("NewExpression");
        node.className = className.value;
        node.arguments = args;
        return node;
    }
    if (parser.current_token.type == "LPAREN") {
        advance(parser);
        let expr = parseExpression(parser);
        if (expr && expr.type == "ParseError") {
            return expr;
        }
        let rparen = expect(parser, "RPAREN");
        if (rparen && rparen.type == "ParseError") {
            return rparen;
        }
        return expr;
    }
    if (parser.current_token.type == "LBRACKET") {
        advance(parser);
        let node = new Node("ArrayLiteral");
        node.elements = [];
        if (parser.current_token.type != "RBRACKET") {
            let element = parseExpression(parser);
            if (element && element.type == "ParseError") {
                return element;
            }
            node.elements.push(element);
            while (parser.current_token.type == "COMMA") {
                advance(parser);
                element = parseExpression(parser);
                if (element && element.type == "ParseError") {
                    return element;
                }
                node.elements.push(element);
            }
        }
        let rbracket = expect(parser, "RBRACKET");
        if (rbracket && rbracket.type == "ParseError") {
            return rbracket;
        }
        return node;
    }
    if (parser.current_token.type == "LBRACE") {
        advance(parser);
        let node = new Node("ObjectLiteral");
        node.properties = [];
        if (parser.current_token.type != "RBRACE") {
            while (
                parser.current_token.type == "IDENTIFIER" ||
                parser.current_token.type == "STRING"
            ) {
                let key = parser.current_token.value;
                advance(parser);
                let colon = expect(parser, "COLON");
                if (colon && colon.type == "ParseError") {
                    return colon;
                }
                let value = parseExpression(parser);
                if (value && value.type == "ParseError") {
                    return value;
                }
                let propertyNode = new Node("Property");
                propertyNode.key = key;
                propertyNode.value = value;
                node.properties.push(propertyNode);
                if (parser.current_token.type == "COMMA") {
                    advance(parser);
                } else {
                    break;
                }
            }
        }
        let rbrace = expect(parser, "RBRACE");
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
export function parseTermParameters(parser) {
    let params = [];
    if (parser.current_token.type != "RPAREN") {
        let param = null;
        if (parser.current_token.type == "IDENTIFIER") {
            param = expect(parser, "IDENTIFIER");
        } else if (parser.current_token.type == "SELF") {
            param = expect(parser, "SELF");
        } else {
            param = expect(parser, "IDENTIFIER");
        }
        if (param && param.type == "ParseError") {
            return param;
        }
        params.push(param.value);
        while (parser.current_token.type == "COMMA") {
            advance(parser);
            if (parser.current_token.type == "IDENTIFIER") {
                param = expect(parser, "IDENTIFIER");
            } else if (parser.current_token.type == "SELF") {
                param = expect(parser, "SELF");
            } else {
                param = expect(parser, "IDENTIFIER");
            }
            if (param && param.type == "ParseError") {
                return param;
            }
            params.push(param.value);
        }
    }
    return params;
}
export function parseStatement(parser) {
    if (parser.current_token.type == "EOF") {
        let error = {};
        error.type = "ParseError";
        error.message = "Unexpected EOF in statement";
        error.line = parser.current_token.line;
        error.column = parser.current_token.column;
        return error;
    }
    if (parser.current_token.type == "NAMESPACE") {
        return parseNamespaceStatement(parser);
    }
    if (parser.current_token.type == "USING") {
        return parseUsingStatement(parser);
    }
    if (parser.current_token.type == "ATTRIBUTE") {
        return parseAttributeStatement(parser);
    }
    if (parser.current_token.type == "CLASS") {
        return parseClassDeclaration(parser);
    }
    if (parser.current_token.type == "LET") {
        return parseLetStatement(parser);
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
                return parseMicroFunctionDeclaration(parser);
            }
        }
        return parseFunctionDeclaration(parser);
    }
    if (parser.current_token.type == "IF") {
        return parseIfStatement(parser);
    }
    if (parser.current_token.type == "WHILE") {
        return parseWhileStatement(parser);
    }
    if (parser.current_token.type == "RETURN") {
        return parseReturnStatement(parser);
    }
    if (parser.current_token.type == "LBRACE") {
        return parseFunctionBlock(parser);
    }
    let expr = parseExpression(parser);
    if (expr && expr.type == "ParseError") {
        return expr;
    }
    let semicolon = expect(parser, "SEMICOLON");
    if (semicolon && semicolon.type == "ParseError") {
        return semicolon;
    }
    let stmt = new Node("ExpressionStatement");
    stmt.expression = expr;
    return stmt;
}
export function parseLetStatement(parser) {
    advance(parser);
    let name = expect(parser, "IDENTIFIER");
    if (name && name.type == "ParseError") {
        return name;
    }
    let assignToken = expect(parser, "ASSIGN");
    if (assignToken && assignToken.type == "ParseError") {
        return assignToken;
    }
    let value = parseExpression(parser);
    if (value && value.type == "ParseError") {
        return value;
    }
    let semicolon = expect(parser, "SEMICOLON");
    if (semicolon && semicolon.type == "ParseError") {
        return semicolon;
    }
    let node = new Node("LetStatement");
    node.name = name.value;
    node.value = value;
    return node;
}
export function parseNamespaceStatement(parser) {
    advance(parser);
    let path = [];
    let isMainNamespace = false;
    if (parser.current_token.type == "BANG") {
        advance(parser);
        isMainNamespace = true;
    }
    let identifier = expect(parser, "IDENTIFIER");
    if (identifier.type == "ParseError") {
        return identifier;
    }
    path.push(identifier.value);
    while (parser.current_token.type == "DOUBLE_COLON") {
        advance(parser);
        identifier = expect(parser, "IDENTIFIER");
        if (identifier.type == "ParseError") {
            return identifier;
        }
        path.push(identifier.value);
    }
    let semicolon = expect(parser, "SEMICOLON");
    if (semicolon.type == "ParseError") {
        return semicolon;
    }
    let node = new Node("NamespaceStatement");
    node.path = path;
    node.isMainNamespace = isMainNamespace;
    return node;
}
export function parseUsingStatement(parser) {
    advance(parser);
    let path = [];
    let identifier = expect(parser, "IDENTIFIER");
    if (identifier.type == "ParseError") {
        return identifier;
    }
    path.push(identifier.value);
    while (parser.current_token.type == "DOUBLE_COLON") {
        advance(parser);
        identifier = expect(parser, "IDENTIFIER");
        if (identifier.type == "ParseError") {
            return identifier;
        }
        path.push(identifier.value);
    }
    let semicolon = expect(parser, "SEMICOLON");
    if (semicolon.type == "ParseError") {
        return semicolon;
    }
    let node = new Node("UsingStatement");
    node.path = path;
    return node;
}
export function parseAttributeStatement(parser) {
    advance(parser);
    let jsToken = expect(parser, "IDENTIFIER");
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
    let lparen = expect(parser, "LPAREN");
    if (lparen.type == "ParseError") {
        return lparen;
    }
    let modulePath = expect(parser, "STRING");
    if (modulePath.type == "ParseError") {
        return modulePath;
    }
    let comma = expect(parser, "COMMA");
    if (comma.type == "ParseError") {
        return comma;
    }
    let importName = expect(parser, "STRING");
    if (importName.type == "ParseError") {
        return importName;
    }
    let rparen = expect(parser, "RPAREN");
    if (rparen.type == "ParseError") {
        return rparen;
    }
    let microToken = expect(parser, "MICRO");
    if (microToken.type == "ParseError") {
        return microToken;
    }
    let functionName = expect(parser, "IDENTIFIER");
    if (functionName.type == "ParseError") {
        return functionName;
    }
    let paramLparen = expect(parser, "LPAREN");
    if (paramLparen.type == "ParseError") {
        return paramLparen;
    }
    let parameters = [];
    if (parser.current_token.type != "RPAREN") {
        let param = expect(parser, "IDENTIFIER");
        if (param.type == "ParseError") {
            return param;
        }
        parameters.push(param.value);
        while (parser.current_token.type == "COMMA") {
            advance(parser);
            param = expect(parser, "IDENTIFIER");
            if (param.type == "ParseError") {
                return param;
            }
            parameters.push(param.value);
        }
    }
    let paramRparen = expect(parser, "RPAREN");
    if (paramRparen.type == "ParseError") {
        return paramRparen;
    }
    let body = parseStatement(parser);
    if (body.type == "ParseError") {
        return body;
    }
    let node = new Node("JSAttributeStatement");
    node.modulePath = modulePath.value;
    node.importName = importName.value;
    node.functionName = functionName.value;
    node.parameters = parameters;
    node.body = body;
    return node;
}
export function parseMicroFunctionDeclaration(parser) {
    advance(parser);
    let name = expect(parser, "IDENTIFIER");
    if (name && name.type == "ParseError") {
        return name;
    }
    let lparen = expect(parser, "LPAREN");
    if (lparen && lparen.type == "ParseError") {
        return lparen;
    }
    let params = parseTermParameters(parser);
    if (params && params.type == "ParseError") {
        return params;
    }
    let rparen = expect(parser, "RPAREN");
    if (rparen && rparen.type == "ParseError") {
        return rparen;
    }
    let body = parseFunctionBlock(parser);
    if (body && body.type == "ParseError") {
        return body;
    }
    let node = new Node("MicroDeclaration");
    node.name = name.value;
    node.parameters = params;
    node.body = body;
    return node;
}
export function parseClassDeclaration(parser) {
    advance(parser);
    let name = expect(parser, "IDENTIFIER");
    if (name && name.type == "ParseError") {
        return name;
    }
    let node = new Node("ClassDeclaration");
    node.name = name.value;
    node.superClass = null;
    node.members = [];
    if (parser.current_token.type == "EXTENDS") {
        advance(parser);
        let superName = expect(parser, "IDENTIFIER");
        if (superName && superName.type == "ParseError") {
            return superName;
        }
        node.superClass = superName.value;
    }
    let lbrace = expect(parser, "LBRACE");
    if (lbrace && lbrace.type == "ParseError") {
        return lbrace;
    }
    while (
        parser.current_token.type != "RBRACE" &&
        parser.current_token.type != "EOF"
    ) {
        let member = parseClassMember(parser);
        if (member && member.type != "ParseError") {
            node.members.push(member);
        } else if (member && member.type == "ParseError") {
            return member;
        }
    }
    let rbrace = expect(parser, "RBRACE");
    if (rbrace && rbrace.type == "ParseError") {
        return rbrace;
    }
    return node;
}
export function parseClassMember(parser) {
    if (parser.current_token.type == "CONSTRUCTOR") {
        advance(parser);
        let lparen = expect(parser, "LPAREN");
        if (lparen && lparen.type == "ParseError") {
            return lparen;
        }
        let params = parseTermParameters(parser);
        if (params && params.type == "ParseError") {
            return params;
        }
        let rparen = expect(parser, "RPAREN");
        if (rparen && rparen.type == "ParseError") {
            return rparen;
        }
        let body = parseFunctionBlock(parser);
        if (body && body.type == "ParseError") {
            return body;
        }
        let ctorNode = new Node("ConstructorStatement");
        ctorNode.parameters = params;
        ctorNode.body = body;
        return ctorNode;
    }
    if (parser.current_token.type == "MICRO") {
        advance(parser);
        let name = expect(parser, "IDENTIFIER");
        if (name && name.type == "ParseError") {
            return name;
        }
        let lparen = expect(parser, "LPAREN");
        if (lparen && lparen.type == "ParseError") {
            return lparen;
        }
        let params = parseTermParameters(parser);
        if (params && params.type == "ParseError") {
            return params;
        }
        let rparen = expect(parser, "RPAREN");
        if (rparen && rparen.type == "ParseError") {
            return rparen;
        }
        let body = parseFunctionBlock(parser);
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
            i = i + 1;
        }
        let methodNode = new Node("MemberStatement");
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
            if (nextToken.type == "ASSIGN" || nextToken.type == "SEMICOLON") {
                let name = expect(parser, "IDENTIFIER");
                if (name && name.type == "ParseError") {
                    return name;
                }
                let initValue = null;
                if (parser.current_token.type == "ASSIGN") {
                    advance(parser);
                    initValue = parseExpression(parser);
                    if (initValue && initValue.type == "ParseError") {
                        return initValue;
                    }
                }
                let semicolon = expect(parser, "SEMICOLON");
                if (semicolon && semicolon.type == "ParseError") {
                    return semicolon;
                }
                let node = new Node("Property");
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
export function parseFunctionDeclaration(parser) {
    advance(parser);
    let name = expect(parser, "IDENTIFIER");
    if (name && name.type == "ParseError") {
        return name;
    }
    let lparen = expect(parser, "LPAREN");
    if (lparen && lparen.type == "ParseError") {
        return lparen;
    }
    let params = parseTermParameters(parser);
    if (params && params.type == "ParseError") {
        return params;
    }
    let rparen = expect(parser, "RPAREN");
    if (rparen && rparen.type == "ParseError") {
        return rparen;
    }
    let body = parseFunctionBlock(parser);
    if (body && body.type == "ParseError") {
        return body;
    }
    let node = new Node("MicroDeclaration");
    node.name = name.value;
    node.parameters = params;
    node.body = body;
    return node;
}
export function parseIfStatement(parser) {
    advance(parser);
    let condition = parseExpression(parser);
    if (condition && condition.type == "ParseError") {
        return condition;
    }
    let thenBranch = parseStatement(parser);
    if (thenBranch && thenBranch.type == "ParseError") {
        return thenBranch;
    }
    let node = new Node("IfStatement");
    node.condition = condition;
    node.thenBranch = thenBranch;
    node.elseBranch = null;
    if (parser.current_token.type == "ELSE") {
        advance(parser);
        let elseBranch = parseStatement(parser);
        if (elseBranch && elseBranch.type == "ParseError") {
            return elseBranch;
        }
        node.elseBranch = elseBranch;
    }
    return node;
}
export function parseWhileStatement(parser) {
    advance(parser);
    let condition = parseExpression(parser);
    if (condition && condition.type == "ParseError") {
        return condition;
    }
    let body = parseFunctionBlock(parser);
    if (body && body.type == "ParseError") {
        return body;
    }
    let node = new Node("WhileStatement");
    node.condition = condition;
    node.body = body;
    return node;
}
export function parseReturnStatement(parser) {
    advance(parser);
    let node = new Node("ReturnStatement");
    if (parser.current_token.type == "SEMICOLON") {
        node.value = null;
    } else {
        let value = parseExpression(parser);
        if (value && value.type == "ParseError") {
            return value;
        }
        node.value = value;
    }
    let semicolon = expect(parser, "SEMICOLON");
    if (semicolon && semicolon.type == "ParseError") {
        return semicolon;
    }
    return node;
}
export function parseFunctionBlock(parser) {
    let lbrace = expect(parser, "LBRACE");
    if (lbrace && lbrace.type == "ParseError") {
        return lbrace;
    }
    let statements = [];
    while (
        parser.current_token.type != "RBRACE" &&
        parser.current_token.type != "EOF"
    ) {
        let stmt = parseStatement(parser);
        if (stmt && stmt.type == "ParseError") {
            return stmt;
        }
        statements.push(stmt);
    }
    let rbrace = expect(parser, "RBRACE");
    if (rbrace && rbrace.type == "ParseError") {
        return rbrace;
    }
    let node = new Node("Block");
    node.statements = statements;
    return node;
}
export function parseProgram(parser) {
    let statements = [];
    while (parser.current_token.type != "EOF") {
        let stmt = parseStatement(parser);
        if (stmt && stmt.type == "ParseError") {
            return stmt;
        }
        statements.push(stmt);
    }
    let node = new Node("Program");
    node.statements = statements;
    return node;
}
export function parse(tokens) {
    let parser = new ValkyrieParser(tokens);
    return parseProgram(parser);
}
