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
    EXPORT: "EXPORT",
    IF: "IF",
    ELSE: "ELSE",
    WHILE: "WHILE",
    FUNCTION: "FUNCTION",
    RETURN: "RETURN",
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
    TRUE: "TRUE",
    FALSE: "FALSE",
    EOF: "EOF",
    COMMENT: "COMMENT",
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
        "let": "LET",
        "micro": "MICRO",
        "export": "EXPORT",
        "if": "IF",
        "else": "ELSE",
        "while": "WHILE",
        "function": "FUNCTION",
        "return": "RETURN",
        "true": "TRUE",
        "false": "FALSE"
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
    current(lexer).charCodeAt(0) === 65279) { // 跳过 BOM 字符和换行符
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
    token.type = "STRING";
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
    token.type = "NUMBER";
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
    let tokenType = "IDENTIFIER";
    if (lexer.keywords.hasOwnProperty(value)) {
        tokenType = lexer.keywords[value];
    }
    let tokenValue = value;

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
    token.type = "COMMENT";
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
            let token = createToken("EQUAL", "==", line, column);
            lexer.tokens.push(token);
            advance(lexer);
            advance(lexer);
        } else if (char === "!" && peek(lexer, 1) === "=") {
            let token = createToken("NOT_EQUAL", "!=", line, column);
            lexer.tokens.push(token);
            advance(lexer);
            advance(lexer);
        } else if (char === "!") {
            let token = createToken("NOT", "!", line, column);
            lexer.tokens.push(token);
            advance(lexer);
        } else if (char === "-" && peek(lexer, 1) === ">") {
            let token = createToken("ARROW", "->", line, column);
            lexer.tokens.push(token);
            advance(lexer);
            advance(lexer);
        } else if (char === "=") {
            let token = createToken("ASSIGN", "=", line, column);
            lexer.tokens.push(token);
            advance(lexer);
        } else if (char === "+") {
            let token = createToken("PLUS", "+", line, column);
            lexer.tokens.push(token);
            advance(lexer);
        } else if (char === "-") {
            let token = createToken("MINUS", "-", line, column);
            lexer.tokens.push(token);
            advance(lexer);
        } else if (char === "*") {
            let token = createToken("MULTIPLY", "*", line, column);
            lexer.tokens.push(token);
            advance(lexer);
        } else if (char === "/") {
            let token = createToken("DIVIDE", "/", line, column);
            lexer.tokens.push(token);
            advance(lexer);
        } else if (char === "<") {
            if (peek(lexer, 1) === "=") {
                let token = createToken("LE", "<=", line, column);
                lexer.tokens.push(token);
                advance(lexer);
                advance(lexer);
            } else {
                let token = createToken("LESS", "<", line, column);
                lexer.tokens.push(token);
                advance(lexer);
            }
        } else if (char === ">") {
            if (peek(lexer, 1) === "=") {
                let token = createToken("GE", ">=", line, column);
                lexer.tokens.push(token);
                advance(lexer);
                advance(lexer);
            } else {
                let token = createToken("GREATER", ">", line, column);
                lexer.tokens.push(token);
                advance(lexer);
            }
        } else if (char === "&" && peek(lexer, 1) === "&") {
            let token = createToken("AND", "&&", line, column);
            lexer.tokens.push(token);
            advance(lexer);
            advance(lexer);
        } else if (char === "|" && peek(lexer, 1) === "|") {
            let token = createToken("OR", "||", line, column);
            lexer.tokens.push(token);
            advance(lexer);
            advance(lexer);
        } else if (char === "%") {
            let token = createToken("MODULO", "%", line, column);
            lexer.tokens.push(token);
            advance(lexer);
        } else if (char === "(") {
            let token = createToken("LPAREN", "(", line, column);
            lexer.tokens.push(token);
            advance(lexer);
        } else if (char === ")") {
            let token = createToken("RPAREN", ")", line, column);
            lexer.tokens.push(token);
            advance(lexer);
        } else if (char === "{") {
            let token = createToken("LBRACE", "{", line, column);
            lexer.tokens.push(token);
            advance(lexer);
        } else if (char === "}") {
            let token = createToken("RBRACE", "}", line, column);
            lexer.tokens.push(token);
            advance(lexer);
        } else if (char === "[") {
            let token = createToken("LBRACKET", "[", line, column);
            lexer.tokens.push(token);
            advance(lexer);
        } else if (char === "]") {
            let token = createToken("RBRACKET", "]", line, column);
            lexer.tokens.push(token);
            advance(lexer);
        } else if (char === ",") {
            let token = createToken("COMMA", ",", line, column);
            lexer.tokens.push(token);
            advance(lexer);
        } else if (char === ";") {
            let token = createToken("SEMICOLON", ";", line, column);
            lexer.tokens.push(token);
            advance(lexer);
        } else if (char === ":") {
            let token = createToken("COLON", ":", line, column);
            lexer.tokens.push(token);
            advance(lexer);
        } else if (char === ".") {
            let token = createToken("DOT", ".", line, column);
            lexer.tokens.push(token);
            advance(lexer);
        } else {
            throw new Error(`Unexpected character '${char}' at line ${line}, column ${column}`);
        }
    }

    let eofToken = createToken("EOF", "", lexer.line, lexer.column);
    lexer.tokens.push(eofToken);
    return lexer.tokens;
}


// removed ValkyrieCompiler class and default instance; export only lexer API
export {initLexer, tokenize, TokenType};
