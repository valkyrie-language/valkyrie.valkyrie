// Bootstrap Lexer - 手写的 JavaScript 版本

export function initLexer(source) {
    return {
        source: source,
        position: 0,
        line: 1,
        column: 1,
        current_char: source.length > 0 ? source[0] : ""
    };
}

export function advance(lexer) {
    if (lexer.current_char === "\n") {
        lexer.line = lexer.line + 1;
        lexer.column = 1;
    } else {
        lexer.column = lexer.column + 1;
    }

    lexer.position = lexer.position + 1;

    if (lexer.position >= lexer.source.length) {
        lexer.current_char = "";
    } else {
        lexer.current_char = lexer.source.charAt(lexer.position);
    }
}

export function skipWhitespace(lexer) {
    while (lexer.current_char !== "" && isWhitespace(lexer.current_char)) {
        advance(lexer);
    }
}

export function isWhitespace(ch) {
    return ch === " " || ch === "\t" || ch === "\n" || ch === "\r";
}

export function isAlpha(ch) {
    return (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch === "_";
}

export function isDigit(ch) {
    return ch >= "0" && ch <= "9";
}

export function isAlphaNumeric(ch) {
    return isAlpha(ch) || isDigit(ch);
}

export function readIdentifier(lexer) {
    let result = "";

    while (lexer.current_char !== "" && isAlphaNumeric(lexer.current_char)) {
        result = result + lexer.current_char;
        advance(lexer);
    }

    return result;
}

export function readNumber(lexer) {
    let result = "";

    while (lexer.current_char !== "" && isDigit(lexer.current_char)) {
        result = result + lexer.current_char;
        advance(lexer);
    }

    return result;
}

export function readString(lexer) {
    let result = "";
    advance(lexer); // skip opening quote

    while (lexer.current_char !== '' && lexer.current_char !== '"') {
        if (lexer.current_char === '\\') {
            advance(lexer); // consume '\'
            if (lexer.current_char === 'n') {
                result += '\n';
            } else {
                if (lexer.current_char === 't') {
                    result += '\t';
                } else {
                    if (lexer.current_char === 'r') {
                        result += '\r';
                    } else {
                        if (lexer.current_char === '"') {
                            result += '"';
                        } else {
                            if (lexer.current_char === '\\') {
                                result += '\\';
                            } else {
                                result += '\\' + lexer.current_char;
                            }
                        }
                    }
                }
            }
        } else {
            result += lexer.current_char;
        }
        advance(lexer);
    }

    if (lexer.current_char === '"') {
        advance(lexer); // skip closing quote
    }

    return result;
}

export function skipComment(lexer) {
    while (lexer.current_char !== "" && lexer.current_char !== "\n") {
        advance(lexer);
    }
}

export function getKeywordType(value) {
    if (value === "fn") {
        return "FUNCTION";
    }
    if (value === "let") {
        return "LET";
    }
    if (value === "if") {
        return "IF";
    }
    if (value === "else") {
        return "ELSE";
    }
    if (value === "while") {
        return "WHILE";
    }
    if (value === "return") {
        return "RETURN";
    }
    if (value === "true") {
        return "BOOLEAN";
    }
    if (value === "false") {
        return "BOOLEAN";
    }

    return "IDENTIFIER";
}

export function makeToken(type, value, line, column) {
    return {
        type: type,
        value: value,
        line: line,
        column: column
    };
}

export function nextToken(lexer) {
    while (lexer.current_char !== "") {
        if (isWhitespace(lexer.current_char)) {
            skipWhitespace(lexer);
            continue;
        }

        if (lexer.current_char === "/" && lexer.position + 1 < lexer.source.length && lexer.source.charAt(lexer.position + 1) === "/") {
            skipComment(lexer);
            continue;
        }

        const line = lexer.line;
        const column = lexer.column;

        if (isAlpha(lexer.current_char)) {
            const value = readIdentifier(lexer);
            const tokenType = getKeywordType(value);
            return makeToken(tokenType, value, line, column);
        }

        if (isDigit(lexer.current_char)) {
            const value = readNumber(lexer);
            return makeToken("NUMBER", value, line, column);
        }

        if (lexer.current_char === "\"") {
            const value = readString(lexer);
            return makeToken("STRING", value, line, column);
        }

        // Single character tokens
        const ch = lexer.current_char;
        advance(lexer);

        if (ch === "{") {
            return makeToken("LBRACE", ch, line, column);
        }
        if (ch === "}") {
            return makeToken("RBRACE", ch, line, column);
        }
        if (ch === "(") {
            return makeToken("LPAREN", ch, line, column);
        }
        if (ch === ")") {
            return makeToken("RPAREN", ch, line, column);
        }
        if (ch === "[") {
            return makeToken("LBRACKET", ch, line, column);
        }
        if (ch === "]") {
            return makeToken("RBRACKET", ch, line, column);
        }
        if (ch === ";") {
            return makeToken("SEMICOLON", ch, line, column);
        }
        if (ch === ",") {
            return makeToken("COMMA", ch, line, column);
        }
        if (ch === ":") {
            return makeToken("COLON", ch, line, column);
        }
        if (ch === "=") {
            // 检查是否是 == 操作符
            if (lexer.position < lexer.source.length && lexer.source.charAt(lexer.position) === "=") {
                advance(lexer);
                return makeToken("EQ", "==", line, column);
            }
            return makeToken("ASSIGN", ch, line, column);
        }
        if (ch === "+") {
            return makeToken("PLUS", ch, line, column);
        }
        if (ch === "-") {
            return makeToken("MINUS", ch, line, column);
        }
        if (ch === "*") {
            return makeToken("MULTIPLY", ch, line, column);
        }
        if (ch === "/") {
            return makeToken("DIVIDE", ch, line, column);
        }
        if (ch === "&") {
            // 检查是否是 &&
            if (lexer.position < lexer.source.length && lexer.source.charAt(lexer.position) === "&") {
                advance(lexer); // 跳过第二个 &
                return makeToken("AND", "&&", line, column);
            }
            return makeToken("AMPERSAND", ch, line, column);
        }
        if (ch === "|") {
            // 检查是否是 ||
            if (lexer.position < lexer.source.length && lexer.source.charAt(lexer.position) === "|") {
                advance(lexer); // 跳过第二个 |
                return makeToken("OR", "||", line, column);
            }
            return makeToken("PIPE", ch, line, column);
        }
        if (ch === ">") {
            // 检查是否是 >=
            if (lexer.position < lexer.source.length && lexer.source.charAt(lexer.position) === "=") {
                advance(lexer); // 跳过 =
                return makeToken("GTE", ">=", line, column);
            }
            return makeToken("GT", ch, line, column);
        }
        if (ch === "<") {
            // 检查是否是 <=
            if (lexer.position < lexer.source.length && lexer.source.charAt(lexer.position) === "=") {
                advance(lexer); // 跳过 =
                return makeToken("LTE", "<=", line, column);
            }
            return makeToken("LT", ch, line, column);
        }
        if (ch === "!") {
            // 检查是否是 !=
            if (lexer.position < lexer.source.length && lexer.source.charAt(lexer.position) === "=") {
                advance(lexer); // 跳过 =
                return makeToken("NE", "!=", line, column);
            }
            return makeToken("NOT", ch, line, column);
        }
        if (ch === ".") {
            return makeToken("DOT", ch, line, column);
        }

        // Unknown character
        return makeToken("ERROR", "Unknown character: " + ch, line, column);
    }

    return makeToken("EOF", "", lexer.line, lexer.column);
}

export function tokenize(lexer) {
    const tokens = [];

    while (true) {
        const token = nextToken(lexer);
        tokens.push(token);

        if (token.type === "EOF") {
            break;
        }
    }

    return tokens;
}
