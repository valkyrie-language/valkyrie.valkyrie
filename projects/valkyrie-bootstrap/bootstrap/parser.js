import fs from "fs";
import path from "path";
import {
    createArrayLiteral,
    createAssignmentExpression,
    createBinaryExpression,
    createBlockStatement,
    createBooleanLiteral,
    createCallExpression,
    createExpressionStatement,
    createFunctionDeclaration,
    createIdentifier,
    createIfExpression,
    createIfStatement,
    createMemberExpression,
    createNumberLiteral,
    createObjectLiteral,
    createParameter,
    createProgram,
    createStringLiteral,
    createUnaryExpression,
    createVariableDeclaration,
    createWhileStatement
} from './ast.js';
import {TokenType} from './lexer.js';

// Valkyrie Runtime Support
let ValkyrieRuntime = {
    print: console.log,
    assert: (condition, message) => {
        if (!condition) throw new Error(message || "Assertion failed");
    }
};

let Parser = {tokens: [], current: 0};

function initParser(tokens) {
    let parser = {};
    parser.tokens = tokens;
    parser.current = 0;
    return parser;
}

function currentToken(parser) {
    if ((parser.current >= parser.tokens.length)) {
        return parser.tokens[(parser.tokens.length - 1)];
    } else {
        return parser.tokens[parser.current];
    }
}

function peekToken(parser) {
    if (((parser.current + 1) >= parser.tokens.length)) {
        return parser.tokens[(parser.tokens.length - 1)];
    } else {
        return parser.tokens[(parser.current + 1)];
    }
}

function advance(parser) {
    if ((parser.current < (parser.tokens.length - 1))) {
        parser.current = (parser.current + 1);
    }
    return parser;
}

function check(parser, tokenType) {
    let token = currentToken(parser);
    return (token.type === tokenType);
}

function match(parser, tokenType) {
    if (check(parser, tokenType)) {
        let token = currentToken(parser);
        advance(parser);
        return token;
    } else {
        return null;
    }
}

function expect(parser, tokenType) {
    let token = match(parser, tokenType);
    if ((token === null)) {
        let current = currentToken(parser);
        console.log(`[DEBUG] Expected ${tokenType} but got ${current.type} at line ${current.line}, value: ${current.value}`);
        throw new Error(`Expected ${tokenType} but got ${current.type} at line ${current.line}`);
    } else {
        return token;
    }
}

function parseProgram(parser) {
    let statements = [];
    while ((!check(parser, "EOF"))) {
        let stmt = parseStatement(parser);
        if ((stmt.type !== "")) {
            statements.push(stmt);
        }
    }
    return createProgram(statements, 1, 1);
}

function parseStatement(parser) {
    let token = currentToken(parser);
    if ((token.type === "COMMENT")) {
        advance(parser);
        return {type: ""};
    } else if ((token.type === "LET")) {
        return parseVariableDeclaration(parser);
    } else {
        if ((token.type === "MICRO")) {
            return parseFunctionDeclaration(parser);
        } else {
            if ((token.type === "IF")) {
                return parseIfStatement(parser);
            } else {
                if ((token.type === "WHILE")) {
                    return parseWhileStatement(parser);
                } else {
                    if ((token.type === "LBRACE")) {
                        return parseBlockStatement(parser);
                    } else {
                        return parseExpressionStatement(parser);
                    }
                }
            }
        }
    }
}

function parseVariableDeclaration(parser) {
    let letToken = expect(parser, "LET");
    let nameToken = expect(parser, "IDENTIFIER");
    expect(parser, "ASSIGN");
    // 直接解析逻辑或表达式，避免递归到赋值表达式
    let initializer = parseLogicalOr(parser);
    return createVariableDeclaration(nameToken.value, initializer, 2, 1, letToken.line, letToken.column);
}

function parseFunctionDeclaration(parser) {
    let microToken = expect(parser, "MICRO");
    let nameToken = expect(parser, "IDENTIFIER");
    expect(parser, "LPAREN");
    let parameters = [];
    if ((!check(parser, "RPAREN"))) {
        let param = expect(parser, "IDENTIFIER");
        parameters.push(createParameter(param.value, param.line, param.column));
        while (check(parser, "COMMA")) {
            advance(parser);
            param = expect(parser, "IDENTIFIER");
            parameters.push(createParameter(param.value, param.line, param.column));
        }
    }
    expect(parser, "RPAREN");
    let body = parseBlockStatement(parser);
    return createFunctionDeclaration(nameToken.value, parameters, body, microToken.line, microToken.column);
}

function parseIfStatement(parser) {
    let ifToken = expect(parser, "IF");
    let condition = parseExpression(parser);
    let thenBranch = parseBlockStatement(parser);
    let elseBranch = {};
    if (check(parser, "ELSE")) {
        advance(parser);
        if (check(parser, "IF")) {
            elseBranch = parseIfStatement(parser);
        } else {
            elseBranch = parseBlockStatement(parser);
        }
    }
    return createIfStatement(condition, thenBranch, elseBranch, ifToken.line, ifToken.column);
}

function parseWhileStatement(parser) {
    let whileToken = expect(parser, "WHILE");
    let condition = parseExpression(parser);
    let body = parseBlockStatement(parser);
    return createWhileStatement(condition, body, whileToken.line, whileToken.column);
}

function parseBlockStatement(parser) {
    let lbraceToken = expect(parser, "LBRACE");
    let statements = [];
    while (((!check(parser, "RBRACE")) && (!check(parser, "EOF")))) {
        let stmt = parseStatement(parser);
        if ((stmt.type !== "")) {
            statements.push(stmt);
        }
    }
    expect(parser, "RBRACE");
    return createBlockStatement(statements, lbraceToken.line, lbraceToken.column);
}

// 从块语句中提取表达式（用于if表达式）
function extractExpressionFromBlock(blockStatement) {
    if (blockStatement.statements.length === 0) {
        throw new Error("Block statement cannot be empty in expression context");
    }

    let lastStatement = blockStatement.statements[blockStatement.statements.length - 1];
    if (lastStatement.type === "ExpressionStatement") {
        return lastStatement.expression;
    } else {
        throw new Error("Last statement in block must be an expression statement");
    }
}

function parseExpressionStatement(parser) {
    let expr = parseExpression(parser);
    return createExpressionStatement(expr, expr.line, expr.column);
}

function parseExpression(parser) {
    return parseAssignment(parser);
}

function parseAssignment(parser) {
    let expr = parseLogicalOr(parser);

    if (check(parser, "ASSIGN")) {
        let assignToken = advance(parser);
        let right = parseAssignment(parser);
        return createAssignmentExpression(expr, right, assignToken.line, assignToken.column);
    }

    return expr;
}

function parseObjectValue(parser) {
    let currentTok = currentToken(parser);

    if (currentTok.type === "STRING") {
        let value = createStringLiteral(currentTok.value, currentTok.line, currentTok.column);
        advance(parser);
        return value;
    } else if (currentTok.type === "NUMBER") {
        let value = createNumberLiteral(currentTok.value, currentTok.line, currentTok.column);
        advance(parser);
        return value;
    } else if (currentTok.type === "TRUE") {
        let value = createBooleanLiteral(true, currentTok.line, currentTok.column);
        advance(parser);
        return value;
    } else if (currentTok.type === "FALSE") {
        let value = createBooleanLiteral(false, currentTok.line, currentTok.column);
        advance(parser);
        return value;
    } else if (currentTok.type === "IDENTIFIER") {
        let value = createIdentifier(currentTok.value, currentTok.line, currentTok.column);
        advance(parser);
        return value;
    } else if (currentTok.type === "LBRACKET") {
        // 处理数组字面量
        return parseArrayLiteral(parser);
    } else if (currentTok.type === "LBRACE") {
        // 处理嵌套对象字面量
        return parseObjectLiteral(parser);
    } else {
        // 对于其他情况，使用逻辑或表达式解析（避免递归到赋值）
        return parseLogicalOr(parser);
    }
}

function parseArrayLiteral(parser) {
    let lbracketToken = expect(parser, "LBRACKET");
    let elements = [];

    if (check(parser, "RBRACKET")) {
        expect(parser, "RBRACKET");
        return createArrayLiteral([], lbracketToken.line, lbracketToken.column);
    }

    while (!check(parser, "RBRACKET") && !check(parser, "EOF")) {
        let element = parseObjectValue(parser);
        elements.push(element);

        if (check(parser, "COMMA")) {
            advance(parser);
            // 允许尾随逗号
            if (check(parser, "RBRACKET")) {
                break;
            }
        } else if (!check(parser, "RBRACKET")) {
            throw new Error(`Expected ',' or ']' in array literal at line ${currentToken(parser).line}`);
        }
    }

    expect(parser, "RBRACKET");
    return createArrayLiteral(elements, lbracketToken.line, lbracketToken.column);
}

function parseObjectLiteral(parser) {
    let lbraceToken = expect(parser, "LBRACE");
    let properties = [];

    // 处理空对象
    if (check(parser, "RBRACE")) {
        expect(parser, "RBRACE");
        return createObjectLiteral([], lbraceToken.line, lbraceToken.column);
    }

    // 解析对象属性
    while (!check(parser, "RBRACE") && !check(parser, "EOF")) {
        // 跳过注释
        while (check(parser, "COMMENT")) {
            advance(parser);
        }

        // 如果跳完注释后遇到右大括号，直接结束
        if (check(parser, "RBRACE")) {
            break;
        }

        // 解析键 - 支持标识符或字符串作为键
        let keyToken;
        if (check(parser, "IDENTIFIER")) {
            keyToken = expect(parser, "IDENTIFIER");
        } else if (check(parser, "STRING")) {
            keyToken = expect(parser, "STRING");
        } else {
            throw new Error(`Expected identifier or string as object key at line ${currentToken(parser).line}`);
        }
        expect(parser, "ASSIGN");

        // 解析值
        let value = parseObjectValue(parser);

        // 创建属性
        let property = {
            key: keyToken.value,
            value: value
        };
        properties.push(property);

        // 处理逗号分隔符
        if (check(parser, "COMMA")) {
            advance(parser);
            // 允许尾随逗号
            if (check(parser, "RBRACE")) {
                break;
            }
        } else if (!check(parser, "RBRACE")) {
            // 如果不是逗号也不是右大括号，则报错
            throw new Error(`Expected ',' or '}' after object property at line ${currentToken(parser).line}`);
        }
    }

    expect(parser, "RBRACE");
    return createObjectLiteral(properties, lbraceToken.line, lbraceToken.column);
}

function parseLogicalOr(parser) {
    let expr = parseLogicalAnd(parser);
    while (check(parser, "OR")) {
        let operator = advance(parser);
        let right = parseLogicalAnd(parser);
        expr = createBinaryExpression(expr, operator.value, right, operator.line, operator.column);
    }
    return expr;
}

function parseLogicalAnd(parser) {
    let expr = parseEquality(parser);
    while (check(parser, "AND")) {
        let operator = advance(parser);
        let right = parseEquality(parser);
        expr = createBinaryExpression(expr, operator.value, right, operator.line, operator.column);
    }
    return expr;
}

function parseEquality(parser) {
    let expr = parseComparison(parser);
    while ((check(parser, TokenType.EQUAL) || check(parser, TokenType.NOT_EQUAL))) {
        let operator = advance(parser);
        let right = parseComparison(parser);
        expr = createBinaryExpression(expr, operator.value, right, operator.line, operator.column);
    }
    return expr;
}

function parseComparison(parser) {
    let expr = parseAddition(parser);
    while ((((check(parser, TokenType.LESS) || check(parser, TokenType.LE)) || check(parser, TokenType.GREATER)) || check(parser, TokenType.GE))) {
        let operator = advance(parser);
        let right = parseAddition(parser);
        expr = createBinaryExpression(expr, operator.value, right, operator.line, operator.column);
    }
    return expr;
}

function parseAddition(parser) {
    let expr = parseMultiplication(parser);
    while ((check(parser, "PLUS") || check(parser, "MINUS"))) {
        let operator = advance(parser);
        let right = parseMultiplication(parser);
        expr = createBinaryExpression(expr, operator.value, right, operator.line, operator.column);
    }
    return expr;
}

function parseMultiplication(parser) {
    let expr = parseUnary(parser);
    while (((check(parser, "MULTIPLY") || check(parser, "DIVIDE")) || check(parser, "MODULO"))) {
        let operator = advance(parser);
        let right = parseUnary(parser);
        expr = createBinaryExpression(expr, operator.value, right, operator.line, operator.column);
    }
    return expr;
}

function parseUnary(parser) {
    if ((check(parser, TokenType.NOT) || check(parser, TokenType.MINUS))) {
        let operator = advance(parser);
        let operand = parseUnary(parser);
        return createUnaryExpression(operator.value, operand, operator.line, operator.column);
    } else {
        return parseCall(parser);
    }
}

function parseCall(parser) {
    let expr = parsePrimary(parser);
    while (check(parser, TokenType.LPAREN) || check(parser, TokenType.DOT) || check(parser, TokenType.LBRACKET)) {
        if (check(parser, TokenType.DOT)) {
            advance(parser); // consume DOT
            let property = expect(parser, TokenType.IDENTIFIER);
            expr = createMemberExpression(expr, createIdentifier(property.value, property.line, property.column), false, expr.line, expr.column);
        } else if (check(parser, TokenType.LBRACKET)) {
            advance(parser); // consume LBRACKET
            let index = parseExpression(parser);
            expect(parser, "RBRACKET");
            expr = createMemberExpression(expr, index, true, expr.line, expr.column);
        } else {
            advance(parser); // consume LPAREN
            let args = [];
            if ((!check(parser, "RPAREN"))) {
                args.push(parseExpression(parser));
                while (check(parser, "COMMA")) {
                    advance(parser);
                    args.push(parseExpression(parser));
                }
            }
            let rparenToken = expect(parser, "RPAREN");
            expr = createCallExpression(expr, args, expr.line, expr.column);
        }
    }
    return expr;
}

function parsePrimary(parser) {
    let token = currentToken(parser);
    if ((token.type === "NUMBER")) {
        advance(parser);
        return createNumberLiteral(token.value, token.line, token.column);
    } else {
        if ((token.type === "STRING")) {
            advance(parser);
            return createStringLiteral(token.value, token.line, token.column);
        } else {
            if ((token.type === "BOOLEAN")) {
                advance(parser);
                return createBooleanLiteral(token.value, token.line, token.column);
            } else {
                if ((token.type === "IDENTIFIER")) {
                    advance(parser);
                    return createIdentifier(token.value, token.line, token.column);
                } else {
                    if ((token.type === "IF")) {
                        advance(parser);
                        let condition = parseExpression(parser);
                        let thenBlock = parseBlockStatement(parser);
                        expect(parser, "ELSE");
                        let elseBlock = parseBlockStatement(parser);

                        // 从块中提取表达式
                        let thenExpr = extractExpressionFromBlock(thenBlock);
                        let elseExpr = extractExpressionFromBlock(elseBlock);

                        return createIfExpression(condition, thenExpr, elseExpr, token.line, token.column);
                    } else {
                        if ((token.type === "LBRACE")) {
                            return parseObjectLiteral(parser);
                        } else {
                            if ((token.type === "LBRACKET")) {
                                return parseArrayLiteral(parser);
                            } else {
                                if ((token.type === "LPAREN")) {
                                    advance(parser);
                                    let expr = parseExpression(parser);
                                    expect(parser, "RPAREN");
                                    return expr;
                                } else {
                                    throw new Error(`Unexpected token ${token.type} at line ${token.line}`);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

function parse(tokens) {
    let parser = initParser(tokens);
    return parseProgram(parser);
}


// ValkyrieCompiler �?
class ValkyrieCompiler {
    compile(source, options = {}) {
        let compiler = initCompiler(source);
        let result = compile(compiler);
        return {success: true, code: result, ast: compiler.ast, tokens: compiler.tokens};
    }

    compileFile(filePath, options = {}) {
        let source = fs.readFileSync(filePath, "utf8");
        return this.compile(source, options);
    }

    compileDirectory(dirPath, options = {}) {
        let results = [];
        let files = fs.readdirSync(dirPath);
        for (const file of files) {
            if (file.endsWith(".valkyrie")) {
                let filePath = path.join(dirPath, file);
                results.push(this.compileFile(filePath, options));
            }
        }
        return results;
    }
}

// 导出编译器实现
let compiler = new ValkyrieCompiler();
export {ValkyrieCompiler, compiler, parse};