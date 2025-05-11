/**
 * Abstract Syntax Tree nodes for AkbariLang
 */

// Base AST node
class ASTNode {
  constructor(line, column) {
    this.line = line;
    this.column = column;
  }
}

// Program node (the root of the AST)
class Program extends ASTNode {
  constructor(statements, line = 1, column = 1) {
    super(line, column);
    this.statements = statements || [];
  }
}

// Statement nodes
class VariableDeclaration extends ASTNode {
  constructor(type, name, initializer, line, column) {
    super(line, column);
    this.type = type;     // Data type (sahih, ashar, harf)
    this.name = name;     // Variable name
    this.initializer = initializer; // Initial value, can be null
  }
}

class ExpressionStatement extends ASTNode {
  constructor(expression, line, column) {
    super(line, column);
    this.expression = expression;
  }
}

class IfStatement extends ASTNode {
  constructor(condition, thenBranch, elseBranch, line, column) {
    super(line, column);
    this.condition = condition;     // Expression
    this.thenBranch = thenBranch;   // Statement
    this.elseBranch = elseBranch;   // Statement or null
  }
}

class BlockStatement extends ASTNode {
  constructor(statements, line, column) {
    super(line, column);
    this.statements = statements || [];
  }
}

class ForStatement extends ASTNode {
  constructor(initializer, condition, increment, body, line, column) {
    super(line, column);
    this.initializer = initializer; // Variable declaration or expression statement
    this.condition = condition;     // Expression
    this.increment = increment;     // Expression
    this.body = body;               // Statement
  }
}

// Expression nodes
class BinaryExpression extends ASTNode {
  constructor(left, operator, right, line, column) {
    super(line, column);
    this.left = left;       // Expression
    this.operator = operator; // Token
    this.right = right;      // Expression
  }
}

class UnaryExpression extends ASTNode {
  constructor(operator, right, line, column) {
    super(line, column);
    this.operator = operator; // Token
    this.right = right;      // Expression
  }
}

class AssignmentExpression extends ASTNode {
  constructor(name, value, line, column) {
    super(line, column);
    this.name = name;  // Identifier
    this.value = value; // Expression
  }
}

class VariableExpression extends ASTNode {
  constructor(name, line, column) {
    super(line, column);
    this.name = name; // Identifier
  }
}

class LiteralExpression extends ASTNode {
  constructor(value, type, line, column) {
    super(line, column);
    this.value = value; // Literal value
    this.type = type;   // Type of literal (INTEGER, FLOAT, STRING, CHARACTER)
  }
}

class InputExpression extends ASTNode {
  constructor(variable, line, column) {
    super(line, column);
    this.variable = variable; // Variable to store input
  }
}

class OutputExpression extends ASTNode {
  constructor(expression, line, column) {
    super(line, column);
    this.expression = expression; // Expression to output
  }
}

module.exports = {
  ASTNode,
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
  OutputExpression
};