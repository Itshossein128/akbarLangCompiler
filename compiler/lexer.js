const { Token, TokenType, Keywords } = require("./token");

class Lexer {
  constructor(source) {
    this.source = source;
    this.tokens = [];
    this.start = 0;
    this.current = 0;
    this.line = 1;
    this.column = 1;
  }

  tokenize() {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.scanToken();
    }

    this.tokens.push(new Token(TokenType.EOF, "", this.line, this.column));
    return this.tokens;
  }

  /**
   * Scan a single token
   */
  scanToken() {
    const c = this.advance();

    switch (c) {
      // Single character tokens
      case "(":
        this.addToken(TokenType.LEFT_PAREN);
        break;
      case ")":
        this.addToken(TokenType.RIGHT_PAREN);
        break;
      case "{":
        this.addToken(TokenType.LEFT_BRACE);
        break;
      case "}":
        this.addToken(TokenType.RIGHT_BRACE);
        break;
      case ";":
        this.addToken(TokenType.SEMICOLON);
        break;
      case ",":
        this.addToken(TokenType.COMMA);
        break;
      case "+":
        this.addToken(TokenType.PLUS);
        break;
      case "-":
        this.addToken(TokenType.MINUS);
        break;
      case "*":
        this.addToken(TokenType.MULTIPLY);
        break;
      case "/":
        this.addToken(TokenType.DIVIDE);
        break;

      // Two-character tokens
      case "=":
        if (this.match("=")) {
          this.addToken(TokenType.EQUAL_EQUAL);
        } else {
          this.addToken(TokenType.EQUAL);
        }
        break;
      case "<":
        if (this.match("=")) {
          this.addToken(TokenType.LESS_EQUAL);
        } else {
          this.addToken(TokenType.LESS_THAN);
        }
        break;
      case ">":
        if (this.match("=")) {
          this.addToken(TokenType.GREATER_EQUAL);
        } else {
          this.addToken(TokenType.GREATER_THAN);
        }
        break;
      case "!":
        if (this.match("=")) {
          this.addToken(TokenType.NOT_EQUAL);
        } else {
          this.addToken(TokenType.UNKNOWN);
        }
        break;
      case "v":
        if (this.match("a") && this.match("l") && this.match("i")) {
          this.addToken(TokenType.VALI);
        } else if (this.match("a")) {
          this.addToken(TokenType.VA);
        } else {
          this.identifier();
        }
        break;
      case "y":
        if (this.match("a")) {
          this.addToken(TokenType.YA);
        } else {
          this.identifier();
        }
        break;

      // String literals
      case '"':
        this.string();
        break;

      // Comments starting with '#'
      case '#':
        // Skip until end of line
        while (this.peek() !== '\n' && !this.isAtEnd()) {
          this.advance();
        }
        break;

      // Character literals
      case "'":
        this.character();
        break;

      // Whitespace
      case " ":
      case "\r":
      case "\t":
        // Ignore whitespace
        this.column++;
        break;
      case "\n":
        this.line++;
        this.column = 1;
        break;

      // Default case: identifiers, keywords, or numbers
      default:
        if (this.isDigit(c)) {
          this.number();
        } else if (this.isAlpha(c)) {
          this.identifier();
        } else {
          this.error(`Unexpected character: ${c}`);
        }
        break;
    }
  }

  /**
   * Process an identifier or keyword
   */
  identifier() {
    while (this.isAlphaNumeric(this.peek())) {
      this.advance();
    }

    const text = this.source.substring(this.start, this.current);

    // Special case for 'vali age' which is two words but one token
    if (
      text === "vali" &&
      this.peek() === " " &&
      this.source.substring(this.current + 1, this.current + 4) === "age"
    ) {
      this.advance(); // consume the space
      this.advance(); // consume 'a'
      this.advance(); // consume 'g'
      this.advance(); // consume 'e'
      this.addToken(TokenType.VALI);
      return;
    }

    let type = Keywords[text];
    if (!type) {
      type = TokenType.IDENTIFIER;
    }

    this.addToken(type);
  }

  /**
   * Process a number (integer or float)
   */
  number() {
    let isFloat = false;

    while (this.isDigit(this.peek())) {
      this.advance();
    }

    // Look for a decimal part
    if (this.peek() === "." && this.isDigit(this.peekNext())) {
      isFloat = true;

      // Consume the '.'
      this.advance();

      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    const value = this.source.substring(this.start, this.current);
    this.addToken(
      isFloat ? TokenType.FLOAT : TokenType.INTEGER,
      isFloat ? parseFloat(value) : parseInt(value, 10)
    );
  }

  /**
   * Process a string literal
   */
  string() {
    while (this.peek() !== '"' && !this.isAtEnd()) {
      if (this.peek() === "\n") {
        this.line++;
        this.column = 1;
      }
      this.advance();
    }

    if (this.isAtEnd()) {
      this.error("Unterminated string");
      return;
    }

    // Consume the closing "
    this.advance();

    // Trim the quotes
    const value = this.source.substring(this.start + 1, this.current - 1);
    this.addToken(TokenType.STRING, value);
  }

  /**
   * Process a character literal
   */
  character() {
    if (this.isAtEnd()) {
      this.error("Unterminated character");
      return;
    }

    const charValue = this.advance();

    if (this.peek() !== "'") {
      this.error("Character literal can only contain one character");
      return;
    }

    // Consume the closing '
    this.advance();

    this.addToken(TokenType.CHARACTER, charValue);
  }

  /**
   * Add a token to the tokens list
   */
  addToken(type, literal = null) {
    const text = this.source.substring(this.start, this.current);
    this.tokens.push(
      new Token(type, literal !== null ? literal : text, this.line, this.column)
    );
    this.column += this.current - this.start;
  }

  /**
   * Check if the current character matches the expected character
   */
  match(expected) {
    if (this.isAtEnd()) return false;
    if (this.source.charAt(this.current) !== expected) return false;

    this.current++;
    return true;
  }

  /**
   * Advance to the next character
   */
  advance() {
    return this.source.charAt(this.current++);
  }

  /**
   * Peek at the current character without advancing
   */
  peek() {
    if (this.isAtEnd()) return "\0";
    return this.source.charAt(this.current);
  }

  /**
   * Peek at the next character without advancing
   */
  peekNext() {
    if (this.current + 1 >= this.source.length) return "\0";
    return this.source.charAt(this.current + 1);
  }

  /**
   * Check if a character is a digit
   */
  isDigit(c) {
    return c >= "0" && c <= "9";
  }

  /**
   * Check if a character is alphabetic
   */
  isAlpha(c) {
    return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c === "_";
  }

  /**
   * Check if a character is alphanumeric
   */
  isAlphaNumeric(c) {
    return this.isAlpha(c) || this.isDigit(c);
  }

  /**
   * Check if the lexer has reached the end of the source
   */
  isAtEnd() {
    return this.current >= this.source.length;
  }

  /**
   * Report an error
   */
  error(message) {
    const err = new Error(
      `Lexical error at line ${this.line}, column ${this.column}: ${message}`
    );
    err.lineNumber = this.line;
    err.columnNumber = this.column;
    throw err;
  }
}

module.exports = Lexer;
