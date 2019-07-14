// namespace package::lexer;
export function initLexer(source) {
    let lexer = {};
    lexer.source = source;
    lexer.position = 0;
    lexer.line = 1;
    lexer.column = 1;
    lexer.current_char = "";
    if (source.length > 0) {
        lexer.current_char = source.charAt(0);
    }
    return lexer;
}
class ValkyrieLexer {
    constructor(source) {
        this.source = source;
        this.position = 0;
        this.line = 1;
        this.column = 1;
        this.current_char = "";
        if (source.length > 0) {
            this.current_char = source.charAt(0);
        }
    }
}
class Token {
    constructor(type, value, line, column) {
        this.type = type;
        this.value = value;
        this.line = line;
        this.column = column;
    }
}
export function advance(lexer) {
    if (lexer.current_char == "\n") {
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
    while (lexer.current_char != "" && isWhitespace(lexer.current_char)) {
        advance(lexer);
    }
}
export function isWhitespace(ch) {
    return ch == " " || ch == "\t" || ch == "\n" || ch == "\r";
}
export function isAlpha(ch) {
    return (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch == "_";
}
export function isDigit(ch) {
    return ch >= "0" && ch <= "9";
}
export function isAlphaNumeric(ch) {
    return isAlpha(ch) || isDigit(ch);
}
export function readIdentifier(lexer) {
    let result = "";
    while (lexer.current_char != "" && isAlphaNumeric(lexer.current_char)) {
        result = result + lexer.current_char;
        advance(lexer);
    }
    return result;
}
export function readNumber(lexer) {
    let result = "";
    while (lexer.current_char != "" && isDigit(lexer.current_char)) {
        result = result + lexer.current_char;
        advance(lexer);
    }
    return result;
}
export function readString(lexer) {
    let result = "";
    advance(lexer);
    while (lexer.current_char != "" && lexer.current_char != '"') {
        if (lexer.current_char == "\\") {
            advance(lexer);
            if (lexer.current_char == "n") {
                result = result + "\n";
            } else {
                if (lexer.current_char == "t") {
                    result = result + "\t";
                } else {
                    if (lexer.current_char == "r") {
                        result = result + "\r";
                    } else {
                        if (lexer.current_char == '"') {
                            result = result + '"';
                        } else {
                            if (lexer.current_char == "\\") {
                                result = result + "\\";
                            } else {
                                result = result + "\\" + lexer.current_char;
                            }
                        }
                    }
                }
            }
        } else {
            result = result + lexer.current_char;
        }
        advance(lexer);
    }
    if (lexer.current_char == '"') {
        advance(lexer);
    }
    return result;
}
export function skipComment(lexer) {
    while (lexer.current_char != "" && lexer.current_char != "\n") {
        advance(lexer);
    }
}
export function getKeywordType(value) {
    if (value == "micro") {
        return "MICRO";
    }
    if (value == "let") {
        return "LET";
    }
    if (value == "if") {
        return "IF";
    }
    if (value == "else") {
        return "ELSE";
    }
    if (value == "while") {
        return "WHILE";
    }
    if (value == "return") {
        return "RETURN";
    }
    if (value == "true") {
        return "BOOLEAN";
    }
    if (value == "false") {
        return "BOOLEAN";
    }
    if (value == "namespace") {
        return "NAMESPACE";
    }
    if (value == "using") {
        return "USING";
    }
    if (value == "class") {
        return "CLASS";
    }
    if (value == "constructor") {
        return "CONSTRUCTOR";
    }
    if (value == "self") {
        return "SELF";
    }
    if (value == "extends") {
        return "EXTENDS";
    }
    if (value == "implements") {
        return "IMPLEMENTS";
    }
    if (value == "new") {
        return "NEW";
    }
    if (value == "default") {
        return "DEFAULT";
    }
    if (value == "await") {
        return "AWAIT";
    }
    return "IDENTIFIER";
}
export function nextToken(lexer) {
    while (lexer.current_char != "") {
        if (isWhitespace(lexer.current_char)) {
            skipWhitespace(lexer);
            continue;
        }
        if (lexer.current_char == "#") {
            skipComment(lexer);
            continue;
        }
        let line = lexer.line;
        let column = lexer.column;
        if (isAlpha(lexer.current_char)) {
            let value = readIdentifier(lexer);
            let tokenType = getKeywordType(value);
            return new Token(tokenType, value, line, column);
        }
        if (isDigit(lexer.current_char)) {
            let value = readNumber(lexer);
            return new Token("NUMBER", value, line, column);
        }
        if (lexer.current_char == '"') {
            let value = readString(lexer);
            return new Token("STRING", value, line, column);
        }
        let ch = lexer.current_char;
        advance(lexer);
        if (ch == "{") {
            return new Token("LBRACE", ch, line, column);
        }
        if (ch == "}") {
            return new Token("RBRACE", ch, line, column);
        }
        if (ch == "(") {
            return new Token("LPAREN", ch, line, column);
        }
        if (ch == ")") {
            return new Token("RPAREN", ch, line, column);
        }
        if (ch == "[") {
            return new Token("LBRACKET", ch, line, column);
        }
        if (ch == "]") {
            return new Token("RBRACKET", ch, line, column);
        }
        if (ch == ";") {
            return new Token("SEMICOLON", ch, line, column);
        }
        if (ch == ",") {
            return new Token("COMMA", ch, line, column);
        }
        if (ch == ":") {
            if (
                lexer.position < lexer.source.length &&
                lexer.source.charAt(lexer.position) == ":"
            ) {
                advance(lexer);
                return new Token("DOUBLE_COLON", "::", line, column);
            }
            return new Token("COLON", ch, line, column);
        }
        if (ch == "=") {
            if (
                lexer.position < lexer.source.length &&
                lexer.source.charAt(lexer.position) == "="
            ) {
                advance(lexer);
                return new Token("EQ", "==", line, column);
            }
            return new Token("ASSIGN", ch, line, column);
        }
        if (ch == "+") {
            return new Token("PLUS", ch, line, column);
        }
        if (ch == "-") {
            return new Token("MINUS", ch, line, column);
        }
        if (ch == "*") {
            return new Token("MULTIPLY", ch, line, column);
        }
        if (ch == "/") {
            return new Token("DIVIDE", ch, line, column);
        }
        if (ch == "%") {
            return new Token("MODULO", ch, line, column);
        }
        if (ch == "&") {
            if (
                lexer.position < lexer.source.length &&
                lexer.source.charAt(lexer.position) == "&"
            ) {
                advance(lexer);
                return new Token("AND", "&&", line, column);
            }
            return new Token("AMPERSAND", ch, line, column);
        }
        if (ch == "|") {
            if (
                lexer.position < lexer.source.length &&
                lexer.source.charAt(lexer.position) == "|"
            ) {
                advance(lexer);
                return new Token("OR", "||", line, column);
            }
            return new Token("PIPE", ch, line, column);
        }
        if (ch == ">") {
            if (
                lexer.position < lexer.source.length &&
                lexer.source.charAt(lexer.position) == "="
            ) {
                advance(lexer);
                return new Token("GTE", ">=", line, column);
            }
            return new Token("GT", ch, line, column);
        }
        if (ch == "<") {
            if (
                lexer.position < lexer.source.length &&
                lexer.source.charAt(lexer.position) == "="
            ) {
                advance(lexer);
                return new Token("LTE", "<=", line, column);
            }
            return new Token("LT", ch, line, column);
        }
        if (ch == "!") {
            if (
                lexer.position < lexer.source.length &&
                lexer.source.charAt(lexer.position) == "="
            ) {
                advance(lexer);
                return new Token("NE", "!=", line, column);
            }
            return new Token("BANG", ch, line, column);
        }
        if (ch == ".") {
            return new Token("DOT", ch, line, column);
        }
        if (ch == "↯") {
            return new Token("ATTRIBUTE", ch, line, column);
        }
        return new Token("ERROR", "Unknown character: " + ch, line, column);
    }
    return new Token("EOF", "", lexer.line, lexer.column);
}
export function tokenize(lexer) {
    let tokens = [];
    while (true) {
        let token = nextToken(lexer);
        tokens.push(token);
        if (token.type == "EOF") {
            break;
        }
    }
    return tokens;
}
