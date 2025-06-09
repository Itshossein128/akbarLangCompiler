const { TokenType, Token } = require("./token");
const {
  Program,
  VariableDeclaration,
  ExpressionStatement,
  IfStatement,
  BlockStatement,
  ForStatement,
  BinaryExpression,
  UnaryExpression,
  AssignmentExpression,
  VariableExpression,
  LiteralExpression,
  InputExpression,
  OutputExpression,
} = require("./ast");

/**
 * Parser class for syntax analysis
 * Converts tokens into an abstract syntax tree (AST)
 */
class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.current = 0;
  }

  /**
   * Parse the tokens into an AST
   * @returns {Program} The root AST node
   */
  parse() {
    const statements = [];

    // Skip any comments at the start of the file
    while (!this.isAtEnd() && this.check(TokenType.COMMENT)) {
      this.advance();
    }

    while (!this.isAtEnd()) {
      // Skip any comments between statements
      while (this.check(TokenType.COMMENT)) {
        this.advance();
      }

      if (!this.isAtEnd()) {
        statements.push(this.statement());
      }
    }

    return new Program(statements);
  }

  /**
   * Parse a statement
   * @returns {ASTNode} Statement node
   */
  statement() {
    // Skip any comments before the statement
    while (this.check(TokenType.COMMENT)) {
      this.advance();
    }

    if (this.match(TokenType.SAHIH, TokenType.ASHAR, TokenType.HARF)) {
      return this.variableDeclaration();
    }

    if (this.match(TokenType.BEGIR)) {
      return this.inputStatement();
    }

    if (this.match(TokenType.BENVIS)) {
      return this.outputStatement();
    }

    if (this.match(TokenType.AGE, TokenType.VALI, TokenType.VAGARNA)) {
      return this.ifStatement();
    }

    if (this.match(TokenType.BARAYE)) {
      return this.forStatement();
    }

    if (this.match(TokenType.VAGHTI)) {
      return this.whileStatement();
    }

    if (this.match(TokenType.LEFT_BRACE)) {
      return this.blockStatement();
    }

    return this.expressionStatement();
  }

  /**
   * Parse a variable declaration
   * @returns {VariableDeclaration} Variable declaration node
   */
  variableDeclaration() {
    const type = this.previous();
    const name = this.consume(TokenType.IDENTIFIER, "Expect variable name.");

    let initializer = null;
    if (this.match(TokenType.EQUAL)) {
      initializer = this.expression();
    }

    this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration.");
    return new VariableDeclaration(
      type.type,
      name.value,
      initializer,
      name.line,
      name.column
    );
  }

  /**
   * Parse an input statement
   * @returns {ExpressionStatement} Expression statement with input
   */
  inputStatement() {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'begir'.");
    const variable = this.consume(
      TokenType.IDENTIFIER,
      "Expect variable name in input statement."
    );
    this.consume(
      TokenType.RIGHT_PAREN,
      "Expect ')' after variable name in input statement."
    );
    this.consume(TokenType.SEMICOLON, "Expect ';' after input statement.");

    return new ExpressionStatement(
      new InputExpression(variable.value, variable.line, variable.column),
      variable.line,
      variable.column
    );
  }

  /**
   * Parse an output statement
   * @returns {ExpressionStatement} Expression statement with output
   */
  outputStatement() {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'benvis'.");
    const expr = this.expression();
    this.consume(
      TokenType.RIGHT_PAREN,
      "Expect ')' after expression in output statement."
    );
    this.consume(TokenType.SEMICOLON, "Expect ';' after output statement.");

    return new ExpressionStatement(
      new OutputExpression(expr, expr.line, expr.column),
      expr.line,
      expr.column
    );
  }

  /**
   * Parse an if statement
   * @returns {IfStatement} If statement node
   */
  ifStatement() {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'age'.");
    const condition = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after if condition.");

    const thenBranch = this.statement();
    let elseBranch = null;

    // Check for else-if or else
    // let i = 0

    if (this.check(TokenType.VALI)) {
      this.advance(); // Consume 'vali'
      if (this.match(TokenType.AGE)) {
        elseBranch = this.ifStatement();
      } else {
        elseBranch = this.statement();
      }
    } else if (this.check(TokenType.VAGARNA)) {
      this.advance(); // Consume 'vagarna'
      elseBranch = this.statement();
    }

    return new IfStatement(
      condition,
      thenBranch,
      elseBranch,
      condition.line,
      condition.column
    );
  }

  /**
   * Parse a for statement
   * @returns {ForStatement} For statement node
   */
  forStatement() {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'baraye'.");

    // Parse initializer
    let initializer;
    if (this.match(TokenType.SAHIH, TokenType.ASHAR, TokenType.HARF)) {
      initializer = this.variableDeclaration();
    } else {
      initializer = this.expressionStatement();
    }

    // Parse condition
    // this.consume(TokenType.TA, "Expect 'ta' after initializer in for loop.");
    const condition = this.expression();
    this.consume(
      TokenType.SEMICOLON,
      "Expect ';' after condition in for loop."
    );

    // Parse increment
    const increment = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after for loop clauses.");

    // Parse body
    const body = this.statement();

    return new ForStatement(
      initializer,
      condition,
      increment,
      body,
      initializer.line,
      initializer.column
    );
  }

  /**
   * Parse a block statement
   * @returns {BlockStatement} Block statement node
   */
  blockStatement() {
    const statements = [];
    const line = this.previous().line;
    const column = this.previous().column;

    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      
      // Skip any comments inside blocks
      while (this.check(TokenType.COMMENT)) {
        this.advance();
      }

      if (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
        statements.push(this.statement());
      }
    }

    this.consume(TokenType.RIGHT_BRACE, "Expect '}' after block.");

    return new BlockStatement(statements, line, column);
  }

  /**
   * Parse an expression statement
   * @returns {ExpressionStatement} Expression statement node
   */
  expressionStatement() {
    const expr = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after expression.");
    return new ExpressionStatement(expr, expr.line, expr.column);
  }

  /**
   * Parse an expression
   * @returns {ASTNode} Expression node
   */
  expression() {
    // Skip any comments before the expression
    while (this.check(TokenType.COMMENT)) {
      this.advance();
    }

    // If it's an assignment
    if (this.checkNext(TokenType.EQUAL)) {
      const variable = this.consume(
        TokenType.IDENTIFIER,
        "Expect variable name."
      );
      this.consume(TokenType.EQUAL, "Expect '=' after variable name.");
      const value = this.expression();

      return new AssignmentExpression(
        variable.value,
        value,
        variable.line,
        variable.column
      );
    }

    return this.logical();
  }

  /**
   * Parse logical expressions (va, ya)
   * @returns {ASTNode} Expression node
   */
  logical() {
    let expr = this.equality();

    while (this.match(TokenType.VA, TokenType.YA)) {
      const operator = this.previous();
      const right = this.equality();
      expr = new BinaryExpression(
        expr,
        operator,
        right,
        operator.line,
        operator.column
      );
    }

    return expr;
  }

  /**
   * Parse equality expressions (==, !=)
   * @returns {ASTNode} Expression node
   */
  equality() {
    let expr = this.comparison();

    while (this.match(TokenType.EQUAL_EQUAL, TokenType.NOT_EQUAL)) {
      const operator = this.previous();
      const right = this.comparison();
      expr = new BinaryExpression(
        expr,
        operator,
        right,
        operator.line,
        operator.column
      );
    }

    return expr;
  }

  /**
   * Parse comparison expressions (<, >, <=, >=)
   * @returns {ASTNode} Expression node
   */
  comparison() {
    let expr = this.term();

    while (
      this.match(
        TokenType.LESS_THAN,
        TokenType.GREATER_THAN,
        TokenType.LESS_EQUAL,
        TokenType.GREATER_EQUAL
      )
    ) {
      const operator = this.previous();
      const right = this.term();
      expr = new BinaryExpression(
        expr,
        operator,
        right,
        operator.line,
        operator.column
      );
    }

    return expr;
  }

  /**
   * Parse term expressions (+, -)
   * @returns {ASTNode} Expression node
   */
  term() {
    let expr = this.factor();

    while (this.match(TokenType.PLUS, TokenType.MINUS)) {
      const operator = this.previous();
      const right = this.factor();
      expr = new BinaryExpression(
        expr,
        operator,
        right,
        operator.line,
        operator.column
      );
    }

    return expr;
  }

  /**
   * Parse factor expressions (*, /)
   * @returns {ASTNode} Expression node
   */
  factor() {
    let expr = this.unary();

    while (this.match(TokenType.MULTIPLY, TokenType.DIVIDE)) {
      const operator = this.previous();
      const right = this.unary();
      expr = new BinaryExpression(
        expr,
        operator,
        right,
        operator.line,
        operator.column
      );
    }

    return expr;
  }

  /**
   * Parse unary expressions (-, !)
   * @returns {ASTNode} Expression node
   */
  unary() {
    if (this.match(TokenType.MINUS) || this.match(TokenType.BANG)) {
      const operator = this.previous();
      const right = this.unary();
      return new UnaryExpression(
        operator,
        right,
        operator.line,
        operator.column
      );
    }

    return this.primary();
  }

  /**
   * Parse primary expressions (literals, parentheses, identifiers)
   * @returns {ASTNode} Expression node
   */
  primary() {
    // Skip any comments before the primary expression
    while (this.check(TokenType.COMMENT)) {
      this.advance();
    }

    if (this.match(TokenType.INTEGER)) {
      const token = this.previous();
      return new LiteralExpression(
        token.value,
        TokenType.INTEGER,
        token.line,
        token.column
      );
    }

    if (this.match(TokenType.FLOAT)) {
      const token = this.previous();
      return new LiteralExpression(
        token.value,
        TokenType.FLOAT,
        token.line,
        token.column
      );
    }

    if (this.match(TokenType.STRING)) {
      const token = this.previous();
      return new LiteralExpression(
        token.value,
        TokenType.STRING,
        token.line,
        token.column
      );
    }

    if (this.match(TokenType.CHARACTER)) {
      const token = this.previous();
      return new LiteralExpression(
        token.value,
        TokenType.CHARACTER,
        token.line,
        token.column
      );
    }

    if (this.match(TokenType.IDENTIFIER)) {
      const token = this.previous();
      return new VariableExpression(token.value, token.line, token.column);
    }

    if (this.match(TokenType.LEFT_PAREN)) {
      const expr = this.expression();
      this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.");
      return expr;
    }
    console.log(this.peek().type == TokenType.EOF);
    if(this.peek().type == TokenType.EOF){
      console.log('shod');
      return 0;
    }
    this.error(this.peek(), "Expect expression.");
  }

  /**
   * Check if the current token matches any of the given types
   * @param {...TokenType} types Token types to match
   * @returns {boolean} True if the current token matches any of the types
   */
  match(...types) {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }

    return false;
  }

  /**
   * Check if the current token is of the given type
   * @param {TokenType} type Token type to check
   * @returns {boolean} True if the current token is of the given type
   */
  check(type) {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  /**
   * Check if the next token is of the given type
   * @param {TokenType} type Token type to check
   * @returns {boolean} True if the next token is of the given type
   */
  checkNext(type) {
    if (this.isAtEnd()) return false;
    if (this.current + 1 >= this.tokens.length) return false;
    return this.tokens[this.current + 1].type === type;
  }

  /**
   * Advance to the next token
   * @returns {Token} The previous token
   */
  advance() {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  /**
   * Check if we have reached the end of the tokens
   * @returns {boolean} True if we have reached the end
   */
  isAtEnd() {
    return this.peek().type === TokenType.EOF;
  }

  /**
   * Get the current token
   * @returns {Token} The current token
   */
  peek() {
    return this.tokens[this.current];
  }

  /**
   * Get the previous token
   * @returns {Token} The previous token
   */
  previous() {
    return this.tokens[this.current - 1];
  }

  /**
   * Consume a token of the expected type
   * @param {TokenType} type Expected token type
   * @param {string} message Error message if the token doesn't match
   * @returns {Token} The consumed token
   */
  consume(type, message) {
    if (this.check(type)) return this.advance();

    this.error(this.peek(), message);
  }

  /**
   * Report an error
   * @param {Token} token Token where the error occurred
   * @param {string} message Error message
   */
  error(token, message) {
    const err = new Error(
      `Parse error at line ${token.line}, column ${token.column}: ${message}`
    );
    err.lineNumber = token.line;
    err.columnNumber = token.column;
    throw err;
  }

  /**
   * Parse a while statement (vaghti)
   * @returns {WhileStatement} While statement node
   */
  whileStatement() {
    const TokenType = require("./token").TokenType;
    const { WhileStatement } = require("./ast");
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'vaghti'.");
    const condition = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after while condition.");
    const body = this.statement();
    return new WhileStatement(condition, body, condition.line, condition.column);
  }
}

module.exports = Parser;
