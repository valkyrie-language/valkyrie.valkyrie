export function initLexer(source) {
    let lexer = {};
    lexer.source = source;
    lexer.position = 0;
    lexer.line = 1;
    lexer.column = 1;
    lexer.current_char = "";
    if ((source.length > 0)) {
        lexer.current_char = source.charAt(0);
    }
    return lexer;
}

export function advance(lexer) {
    if ((lexer.current_char == "\n")) {
        lexer.line = (lexer.line + 1);
        lexer.column = 1;
    } else {
        lexer.column = (lexer.column + 1);
    }
    lexer.position = (lexer.position + 1);
    if ((lexer.position >= lexer.source.length)) {
        lexer.current_char = "";
    } else {
        lexer.current_char = lexer.source.charAt(lexer.position);
    }
}

export function skipWhitespace(lexer) {
    while (((lexer.current_char != "") && isWhitespace(lexer.current_char))) {
        advance(lexer);
    }
}

export function isWhitespace(ch) {
    return ((((ch == " ") || (ch == "\t")) || (ch == "\n")) || (ch == "\r"));
}

export function isAlpha(ch) {
    return ((((ch >= "a") && (ch <= "z")) || ((ch >= "A") && (ch <= "Z"))) || (ch == "_"));
}

export function isDigit(ch) {
    return ((ch >= "0") && (ch <= "9"));
}

export function isAlphaNumeric(ch) {
    return (isAlpha(ch) || isDigit(ch));
}

export function readIdentifier(lexer) {
    let result = "";
    while (((lexer.current_char != "") && isAlphaNumeric(lexer.current_char))) {
        result = (result + lexer.current_char);
        advance(lexer);
    }
    return result;
}

export function readNumber(lexer) {
    let result = "";
    while (((lexer.current_char != "") && isDigit(lexer.current_char))) {
        result = (result + lexer.current_char);
        advance(lexer);
    }
    return result;
}

export function readString(lexer) {
    let result = "";
    advance(lexer);
    while (((lexer.current_char != "") && (lexer.current_char != "\""))) {
        if ((lexer.current_char == "\\")) {
            advance(lexer);
            if ((lexer.current_char == "n")) {
                result = (result + "\n");
            } else {
                if ((lexer.current_char == "t")) {
                    result = (result + "\t");
                } else {
                    if ((lexer.current_char == "r")) {
                        result = (result + "\r");
                    } else {
                        if ((lexer.current_char == "\"")) {
                            result = (result + "\"");
                        } else {
                            if ((lexer.current_char == "\\")) {
                                result = (result + "\\");
                            } else {
                                result = ((result + "\\") + lexer.current_char);
                            }
                        }
                    }
                }
            }
        } else {
            result = (result + lexer.current_char);
        }
        advance(lexer);
    }
    if ((lexer.current_char == "\"")) {
        advance(lexer);
    }
    return result;
}

export function skipComment(lexer) {
    while (((lexer.current_char != "") && (lexer.current_char != "\n"))) {
        advance(lexer);
    }
}

export function getKeywordType(value) {
    if ((value == "micro")) {
        return "FUNCTION";
    }
    if ((value == "let")) {
        return "LET";
    }
    if ((value == "if")) {
        return "IF";
    }
    if ((value == "else")) {
        return "ELSE";
    }
    if ((value == "while")) {
        return "WHILE";
    }
    if ((value == "return")) {
        return "RETURN";
    }
    if ((value == "true")) {
        return "BOOLEAN";
    }
    if ((value == "false")) {
        return "BOOLEAN";
    }
    if ((value == "namespace")) {
        return "NAMESPACE";
    }
    if ((value == "using")) {
        return "USING";
    }
    return "IDENTIFIER";
}

export function makeToken(type, value, line, column) {
    let token = {};
    token.type = type;
    token.value = value;
    token.line = line;
    token.column = column;
    return token;
}

export function nextToken(lexer) {
    while ((lexer.current_char != "")) {
        if (isWhitespace(lexer.current_char)) {
            skipWhitespace(lexer);
            continue;
        }
        if ((lexer.current_char == "#")) {
            skipComment(lexer);
            continue;
        }
        let line = lexer.line;
        let column = lexer.column;
        if (isAlpha(lexer.current_char)) {
            let value = readIdentifier(lexer);
            let tokenType = getKeywordType(value);
            return makeToken(tokenType, value, line, column);
        }
        if (isDigit(lexer.current_char)) {
            let value = readNumber(lexer);
            return makeToken("NUMBER", value, line, column);
        }
        if ((lexer.current_char == "\"")) {
            let value = readString(lexer);
            return makeToken("STRING", value, line, column);
        }
        let ch = lexer.current_char;
        advance(lexer);
        if ((ch == "{")) {
            return makeToken("LBRACE", ch, line, column);
        }
        if ((ch == "}")) {
            return makeToken("RBRACE", ch, line, column);
        }
        if ((ch == "(")) {
            return makeToken("LPAREN", ch, line, column);
        }
        if ((ch == ")")) {
            return makeToken("RPAREN", ch, line, column);
        }
        if ((ch == "[")) {
            return makeToken("LBRACKET", ch, line, column);
        }
        if ((ch == "]")) {
            return makeToken("RBRACKET", ch, line, column);
        }
        if ((ch == ";")) {
            return makeToken("SEMICOLON", ch, line, column);
        }
        if ((ch == ",")) {
            return makeToken("COMMA", ch, line, column);
        }
        if ((ch == ":")) {
            if (((lexer.position < lexer.source.length) && (lexer.source.charAt(lexer.position) == ":"))) {
                advance(lexer);
                return makeToken("DOUBLE_COLON", "::", line, column);
            }
            return makeToken("COLON", ch, line, column);
        }
        if ((ch == "=")) {
            if (((lexer.position < lexer.source.length) && (lexer.source.charAt(lexer.position) == "="))) {
                advance(lexer);
                return makeToken("EQ", "==", line, column);
            }
            return makeToken("ASSIGN", ch, line, column);
        }
        if ((ch == "+")) {
            return makeToken("PLUS", ch, line, column);
        }
        if ((ch == "-")) {
            return makeToken("MINUS", ch, line, column);
        }
        if ((ch == "*")) {
            return makeToken("MULTIPLY", ch, line, column);
        }
        if ((ch == "/")) {
            return makeToken("DIVIDE", ch, line, column);
        }
        if ((ch == "&")) {
            if (((lexer.position < lexer.source.length) && (lexer.source.charAt(lexer.position) == "&"))) {
                advance(lexer);
                return makeToken("AND", "&&", line, column);
            }
            return makeToken("AMPERSAND", ch, line, column);
        }
        if ((ch == "|")) {
            if (((lexer.position < lexer.source.length) && (lexer.source.charAt(lexer.position) == "|"))) {
                advance(lexer);
                return makeToken("OR", "||", line, column);
            }
            return makeToken("PIPE", ch, line, column);
        }
        if ((ch == ">")) {
            if (((lexer.position < lexer.source.length) && (lexer.source.charAt(lexer.position) == "="))) {
                advance(lexer);
                return makeToken("GTE", ">=", line, column);
            }
            return makeToken("GT", ch, line, column);
        }
        if ((ch == "<")) {
            if (((lexer.position < lexer.source.length) && (lexer.source.charAt(lexer.position) == "="))) {
                advance(lexer);
                return makeToken("LTE", "<=", line, column);
            }
            return makeToken("LT", ch, line, column);
        }
        if ((ch == "!")) {
            if (((lexer.position < lexer.source.length) && (lexer.source.charAt(lexer.position) == "="))) {
                advance(lexer);
                return makeToken("NE", "!=", line, column);
            }
            return makeToken("NOT", ch, line, column);
        }
        if ((ch == ".")) {
            return makeToken("DOT", ch, line, column);
        }
        return makeToken("ERROR", ("Unknown character: " + ch), line, column);
    }
    return makeToken("EOF", "", lexer.line, lexer.column);
}

export function tokenize(lexer) {
    let tokens = [];
    while (true) {
        let token = nextToken(lexer);
        tokens.push(token);
        if ((token.type == "EOF")) {
            break;
        }
    }
    return tokens;
}
