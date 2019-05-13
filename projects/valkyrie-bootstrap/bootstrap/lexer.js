import fs from "fs";
import path from "path";

// Valkyrie Runtime Support
let ValkyrieRuntime = {
    print: console.log,
    assert: (condition, message) => {
        if (!condition) throw new Error(message || "Assertion failed");
    }
};

let Token = {type: "", value: "", line: 0, column: 0};
let TokenType = {
    LET: "LET",
    MICRO: "MICRO",
    IF: "IF",
    ELSE: "ELSE",
    WHILE: "WHILE",
    IDENTIFIER: "IDENTIFIER",
    NUMBER: "NUMBER",
    STRING: "STRING",
    BOOLEAN: "BOOLEAN",
    ASSIGN: "ASSIGN",
    PLUS: "PLUS",
    MINUS: "MINUS",
    MULTIPLY: "MULTIPLY",
    DIVIDE: "DIVIDE",
    MODULO: "MODULO",
    EQUAL: "EQUAL",
    NOT_EQUAL: "NOT_EQUAL",
    NOT: "NOT",
    LESS: "LESS",
    GREATER: "GREATER",
    LE: "LE",
    GE: "GE",
    AND: "AND",
    OR: "OR",
    LPAREN: "LPAREN",
    RPAREN: "RPAREN",
    LBRACE: "LBRACE",
    RBRACE: "RBRACE",
    LBRACKET: "LBRACKET",
    RBRACKET: "RBRACKET",
    COMMA: "COMMA",
    SEMICOLON: "SEMICOLON",
    COLON: "COLON",
    DOT: "DOT",
    ARROW: "ARROW",
    EOF: "EOF",
    COMMENT: "COMMENT"
};
let Lexer = {source: "", position: 0, line: 1, column: 1, tokens: [], keywords: {}};

function initLexer(source) {
    let lexer = {};
    lexer.source = source;
    lexer.position = 0;
    lexer.line = 1;
    lexer.column = 1;
    lexer.tokens = [];
    lexer.keywords = {
        "let": TokenType.LET,
        "micro": TokenType.MICRO,
        "if": TokenType.IF,
        "else": TokenType.ELSE,
        "while": TokenType.WHILE,
        "true": TokenType.BOOLEAN,
        "false": TokenType.BOOLEAN
    };
    return lexer;
}

function current(lexer) {
    if ((lexer.position >= lexer.source.length)) {
        return "";
    } else {
        return lexer.source[lexer.position];
    }
}

function peek(lexer, offset) {
    let pos = (lexer.position + offset);
    if ((pos >= lexer.source.length)) {
        return "";
    } else {
        return lexer.source[pos];
    }
}

function advance(lexer) {
    if ((lexer.position < lexer.source.length)) {
        if ((lexer.source[lexer.position] === "\n")) {
            lexer.line = (lexer.line + 1);
            lexer.column = 1;
        } else {
            lexer.column = (lexer.column + 1);
        }
        lexer.position = (lexer.position + 1);
    }
}

function skipWhitespace(lexer) {
    while (current(lexer) === " " ||
    current(lexer) === "\t" ||
    current(lexer) === "\r" ||
    current(lexer) === "\n" ||
    current(lexer).charCodeAt(0) === 65279) { // 跳过 BOM 字符
        advance(lexer);
    }
}

function readString(lexer) {
    let startLine = lexer.line;
    let startColumn = lexer.column;
    let value = "";

    // 跳过开始的引号
    advance(lexer);

    while (current(lexer) !== "\"" && current(lexer) !== "") {
        let char = current(lexer);
        if (char === "\\") {
            advance(lexer);
            let escaped = current(lexer);
            switch (escaped) {
                case "n":
                    value += "\n";
                    break;
                case "t":
                    value += "\t";
                    break;
                case "r":
                    value += "\r";
                    break;
                case "\\":
                    value += "\\";
                    break;
                case "\"":
                    value += "\"";
                    break;
                case "b":
                    value += "\b";
                    break;
                case "f":
                    value += "\f";
                    break;
                default:
                    value += escaped; // 未知转义序列，保持原样
            }
        } else {
            value += char;
        }
        advance(lexer);
    }

    if (current(lexer) === "") {
        throw new Error(`Unterminated string literal at line ${startLine}, column ${startColumn}`);
    }

    if (current(lexer) === "\"") {
        advance(lexer); // 跳过结束的引号
    }

    let token = {};
    token.type = TokenType.STRING;
    token.value = value;
    token.line = startLine;
    token.column = startColumn;
    return token;
}

function readNumber(lexer) {
    let startLine = lexer.line;
    let startColumn = lexer.column;
    let value = "";

    // 读取整数部分
    while (current(lexer) >= "0" && current(lexer) <= "9") {
        value += current(lexer);
        advance(lexer);
    }

    // 读取小数部分
    if (current(lexer) === ".") {
        value += ".";
        advance(lexer);

        while (current(lexer) >= "0" && current(lexer) <= "9") {
            value += current(lexer);
            advance(lexer);
        }
    }

    let token = {};
    token.type = TokenType.NUMBER;
    token.value = value;
    token.line = startLine;
    token.column = startColumn;
    return token;
}

function readIdentifier(lexer) {
    let startLine = lexer.line;
    let startColumn = lexer.column;
    let value = "";

    // 首字符可以是字母或下划线
    if ((current(lexer) >= "a" && current(lexer) <= "z") ||
        (current(lexer) >= "A" && current(lexer) <= "Z") ||
        current(lexer) === "_") {
        value += current(lexer);
        advance(lexer);
    }

    // 后续字符可以是字母、数字或下划线
    while ((current(lexer) >= "a" && current(lexer) <= "z") ||
    (current(lexer) >= "A" && current(lexer) <= "Z") ||
    (current(lexer) >= "0" && current(lexer) <= "9") ||
    current(lexer) === "_") {
        value += current(lexer);
        advance(lexer);
    }

    // 检查是否为关键字
    let tokenType = TokenType.IDENTIFIER;
    if (lexer.keywords.hasOwnProperty(value)) {
        tokenType = lexer.keywords[value];
    }
    let tokenValue = value;

    if (tokenType === TokenType.BOOLEAN) {
        tokenValue = value === "true";
    }

    let token = {};
    token.type = tokenType;
    token.value = tokenValue;
    token.line = startLine;
    token.column = startColumn;
    return token;
}

function readComment(lexer) {
    let startLine = lexer.line;
    let startColumn = lexer.column;
    let value = "";

    // 跳过 #
    advance(lexer);

    // 读取直到行尾
    while (current(lexer) !== "" && current(lexer) !== "\n") {
        value += current(lexer);
        advance(lexer);
    }

    let token = {};
    token.type = TokenType.COMMENT;
    token.value = value;
    token.line = startLine;
    token.column = startColumn;
    return token;
}

function createToken(type, value, line, column) {
    let token = {};
    token.type = type;
    token.value = value;
    token.line = line;
    token.column = column;
    return token;
}

function tokenize(lexer) {
    while (lexer.position < lexer.source.length) {
        skipWhitespace(lexer);
        let char = current(lexer);
        if (char === "") {
            break;
        }

        let line = lexer.line;
        let column = lexer.column;

        if (char === "#") {
            let comment = readComment(lexer);
            lexer.tokens.push(comment);
        } else if (char === "\"") {
            let str = readString(lexer);
            lexer.tokens.push(str);
        } else if (char >= "0" && char <= "9") {
            let num = readNumber(lexer);
            lexer.tokens.push(num);
        } else if ((char >= "a" && char <= "z") || (char >= "A" && char <= "Z") || char === "_") {
            let id = readIdentifier(lexer);
            lexer.tokens.push(id);
        } else if (char === "=" && peek(lexer, 1) === "=") {
            let token = createToken(TokenType.EQUAL, "==", line, column);
            lexer.tokens.push(token);
            advance(lexer);
            advance(lexer);
        } else if (char === "!" && peek(lexer, 1) === "=") {
            let token = createToken(TokenType.NOT_EQUAL, "!=", line, column);
            lexer.tokens.push(token);
            advance(lexer);
            advance(lexer);
        } else if (char === "!") {
            let token = createToken(TokenType.NOT, "!", line, column);
            lexer.tokens.push(token);
            advance(lexer);
        } else if (char === "-" && peek(lexer, 1) === ">") {
            let token = createToken(TokenType.ARROW, "->", line, column);
            lexer.tokens.push(token);
            advance(lexer);
            advance(lexer);
        } else if (char === "=") {
            let token = createToken(TokenType.ASSIGN, "=", line, column);
            lexer.tokens.push(token);
            advance(lexer);
        } else if (char === "+") {
            let token = createToken(TokenType.PLUS, "+", line, column);
            lexer.tokens.push(token);
            advance(lexer);
        } else if (char === "-") {
            let token = createToken(TokenType.MINUS, "-", line, column);
            lexer.tokens.push(token);
            advance(lexer);
        } else if (char === "*") {
            let token = createToken(TokenType.MULTIPLY, "*", line, column);
            lexer.tokens.push(token);
            advance(lexer);
        } else if (char === "/") {
            let token = createToken(TokenType.DIVIDE, "/", line, column);
            lexer.tokens.push(token);
            advance(lexer);
        } else if (char === "<") {
            if (peek(lexer, 1) === "=") {
                let token = createToken(TokenType.LE, "<=", line, column);
                lexer.tokens.push(token);
                advance(lexer);
                advance(lexer);
            } else {
                let token = createToken(TokenType.LESS, "<", line, column);
                lexer.tokens.push(token);
                advance(lexer);
            }
        } else if (char === ">") {
            if (peek(lexer, 1) === "=") {
                let token = createToken(TokenType.GE, ">=", line, column);
                lexer.tokens.push(token);
                advance(lexer);
                advance(lexer);
            } else {
                let token = createToken(TokenType.GREATER, ">", line, column);
                lexer.tokens.push(token);
                advance(lexer);
            }
        } else if (char === "&" && peek(lexer, 1) === "&") {
            let token = createToken(TokenType.AND, "&&", line, column);
            lexer.tokens.push(token);
            advance(lexer);
            advance(lexer);
        } else if (char === "|" && peek(lexer, 1) === "|") {
            let token = createToken(TokenType.OR, "||", line, column);
            lexer.tokens.push(token);
            advance(lexer);
            advance(lexer);
        } else if (char === "%") {
            let token = createToken(TokenType.MODULO, "%", line, column);
            lexer.tokens.push(token);
            advance(lexer);
        } else if (char === "(") {
            let token = createToken(TokenType.LPAREN, "(", line, column);
            lexer.tokens.push(token);
            advance(lexer);
        } else if (char === ")") {
            let token = createToken(TokenType.RPAREN, ")", line, column);
            lexer.tokens.push(token);
            advance(lexer);
        } else if (char === "{") {
            let token = createToken(TokenType.LBRACE, "{", line, column);
            lexer.tokens.push(token);
            advance(lexer);
        } else if (char === "}") {
            let token = createToken(TokenType.RBRACE, "}", line, column);
            lexer.tokens.push(token);
            advance(lexer);
        } else if (char === "[") {
            let token = createToken(TokenType.LBRACKET, "[", line, column);
            lexer.tokens.push(token);
            advance(lexer);
        } else if (char === "]") {
            let token = createToken(TokenType.RBRACKET, "]", line, column);
            lexer.tokens.push(token);
            advance(lexer);
        } else if (char === ",") {
            let token = createToken(TokenType.COMMA, ",", line, column);
            lexer.tokens.push(token);
            advance(lexer);
        } else if (char === ";") {
            let token = createToken(TokenType.SEMICOLON, ";", line, column);
            lexer.tokens.push(token);
            advance(lexer);
        } else if (char === ":") {
            let token = createToken(TokenType.COLON, ":", line, column);
            lexer.tokens.push(token);
            advance(lexer);
        } else if (char === ".") {
            let token = createToken(TokenType.DOT, ".", line, column);
            lexer.tokens.push(token);
            advance(lexer);
        } else {
            throw new Error(`Unexpected character '${char}' at line ${line}, column ${column}`);
        }
    }

    let eofToken = createToken(TokenType.EOF, "", lexer.line, lexer.column);
    lexer.tokens.push(eofToken);
    return lexer.tokens;
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

// 导出编译器实例
let compiler = new ValkyrieCompiler();
export {ValkyrieCompiler, compiler, initLexer, tokenize, TokenType};
