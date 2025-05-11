/**
 * Semantic Analyzer
 * Checks the AST for semantic errors
 */
class SemanticAnalyzer {
  constructor() {
    this.variables = new Map();
    this.errors = [];
  }

  /**
   * Analyze the AST for semantic errors
   * @param {ASTNode} ast The AST to analyze
   */
  analyze(ast) {
    this.visitProgram(ast);
    
    if (this.errors.length > 0) {
      const errorMsg = this.errors.map(e => e.message).join('\n');
      const error = new Error(`Semantic errors:\n${errorMsg}`);
      error.lineNumber = this.errors[0].line;
      throw error;
    }
  }

  /**
   * Visit a Program node
   * @param {Program} program The Program node
   */
  visitProgram(program) {
    program.statements.forEach(statement => {
      this.visitStatement(statement);
    });
  }

  /**
   * Visit a Statement node
   * @param {ASTNode} statement The Statement node
   */
  visitStatement(statement) {
    if (statement.constructor.name === 'VariableDeclaration') {
      this.visitVariableDeclaration(statement);
    } else if (statement.constructor.name === 'ExpressionStatement') {
      this.visitExpressionStatement(statement);
    } else if (statement.constructor.name === 'IfStatement') {
      this.visitIfStatement(statement);
    } else if (statement.constructor.name === 'BlockStatement') {
      this.visitBlockStatement(statement);
    } else if (statement.constructor.name === 'ForStatement') {
      this.visitForStatement(statement);
    }
  }

  /**
   * Visit a VariableDeclaration node
   * @param {VariableDeclaration} declaration The VariableDeclaration node
   */
  visitVariableDeclaration(declaration) {
    // Check if the variable is already declared
    if (this.variables.has(declaration.name)) {
      this.addError(
        `Variable '${declaration.name}' is already declared`,
        declaration.line
      );
    }
    
    // Add the variable to the scope
    this.variables.set(declaration.name, {
      type: declaration.type,
      initialized: declaration.initializer !== null
    });
    
    // Check the initializer if it exists
    if (declaration.initializer) {
      this.visitExpression(declaration.initializer);
      
      // Type checking for initialization
      const initializerType = this.getExpressionType(declaration.initializer);
      if (initializerType && !this.isTypeCompatible(declaration.type, initializerType)) {
        this.addError(
          `Cannot initialize variable of type '${declaration.type}' with a value of type '${initializerType}'`,
          declaration.line
        );
      }
    }
  }

  /**
   * Visit an ExpressionStatement node
   * @param {ExpressionStatement} statement The ExpressionStatement node
   */
  visitExpressionStatement(statement) {
    this.visitExpression(statement.expression);
  }

  /**
   * Visit an IfStatement node
   * @param {IfStatement} statement The IfStatement node
   */
  visitIfStatement(statement) {
    // Visit the condition
    this.visitExpression(statement.condition);
    
    // Check that the condition is a boolean expression
    const conditionType = this.getExpressionType(statement.condition);
    if (conditionType && !this.isBoolean(conditionType)) {
      this.addError(
        `Condition must be a boolean expression`,
        statement.line
      );
    }
    
    // Visit the then branch
    this.visitStatement(statement.thenBranch);
    
    // Visit the else branch if it exists
    if (statement.elseBranch) {
      this.visitStatement(statement.elseBranch);
    }
  }

  /**
   * Visit a BlockStatement node
   * @param {BlockStatement} statement The BlockStatement node
   */
  visitBlockStatement(statement) {
    // Visit each statement in the block
    statement.statements.forEach(subStatement => {
      this.visitStatement(subStatement);
    });
  }

  /**
   * Visit a ForStatement node
   * @param {ForStatement} statement The ForStatement node
   */
  visitForStatement(statement) {
    // Visit the initializer
    this.visitStatement(statement.initializer);
    
    // Visit the condition
    this.visitExpression(statement.condition);
    
    // Check that the condition is a boolean expression
    const conditionType = this.getExpressionType(statement.condition);
    if (conditionType && !this.isBoolean(conditionType)) {
      this.addError(
        `For loop condition must be a boolean expression`,
        statement.line
      );
    }
    
    // Visit the increment
    this.visitExpression(statement.increment);
    
    // Visit the body
    this.visitStatement(statement.body);
  }

  /**
   * Visit an Expression node
   * @param {ASTNode} expression The Expression node
   */
  visitExpression(expression) {
    if (!expression) return;
    
    if (expression.constructor.name === 'BinaryExpression') {
      this.visitBinaryExpression(expression);
    } else if (expression.constructor.name === 'UnaryExpression') {
      this.visitUnaryExpression(expression);
    } else if (expression.constructor.name === 'AssignmentExpression') {
      this.visitAssignmentExpression(expression);
    } else if (expression.constructor.name === 'VariableExpression') {
      this.visitVariableExpression(expression);
    } else if (expression.constructor.name === 'LiteralExpression') {
      // Nothing to do for literals
    } else if (expression.constructor.name === 'InputExpression') {
      this.visitInputExpression(expression);
    } else if (expression.constructor.name === 'OutputExpression') {
      this.visitOutputExpression(expression);
    }
  }

  /**
   * Visit a BinaryExpression node
   * @param {BinaryExpression} expression The BinaryExpression node
   */
  visitBinaryExpression(expression) {
    this.visitExpression(expression.left);
    this.visitExpression(expression.right);
    
    // Type checking for binary expressions
    const leftType = this.getExpressionType(expression.left);
    const rightType = this.getExpressionType(expression.right);
    
    if (leftType && rightType) {
      // Check for type compatibility based on the operator
      switch (expression.operator.type) {
        case 'PLUS':
        case 'MINUS':
        case 'MULTIPLY':
        case 'DIVIDE':
          if (!this.isNumeric(leftType) || !this.isNumeric(rightType)) {
            this.addError(
              `Operator '${expression.operator.value}' requires numeric operands`,
              expression.line
            );
          }
          break;
        case 'EQUAL_EQUAL':
        case 'NOT_EQUAL':
          // These operators can work with any type, but both sides should be compatible
          if (!this.isTypeCompatible(leftType, rightType)) {
            this.addError(
              `Cannot compare values of types '${leftType}' and '${rightType}'`,
              expression.line
            );
          }
          break;
        case 'LESS_THAN':
        case 'GREATER_THAN':
        case 'LESS_EQUAL':
        case 'GREATER_EQUAL':
          if (!this.isNumeric(leftType) || !this.isNumeric(rightType)) {
            this.addError(
              `Operator '${expression.operator.value}' requires numeric operands`,
              expression.line
            );
          }
          break;
      }
    }
  }

  /**
   * Visit a UnaryExpression node
   * @param {UnaryExpression} expression The UnaryExpression node
   */
  visitUnaryExpression(expression) {
    this.visitExpression(expression.right);
    
    // Type checking for unary expressions
    const rightType = this.getExpressionType(expression.right);
    
    if (rightType) {
      // Check for type compatibility based on the operator
      if (expression.operator.type === 'MINUS' && !this.isNumeric(rightType)) {
        this.addError(
          `Unary operator '-' requires a numeric operand`,
          expression.line
        );
      }
    }
  }

  /**
   * Visit an AssignmentExpression node
   * @param {AssignmentExpression} expression The AssignmentExpression node
   */
  visitAssignmentExpression(expression) {
    // Check if the variable is declared
    if (!this.variables.has(expression.name)) {
      this.addError(
        `Variable '${expression.name}' is not declared`,
        expression.line
      );
    } else {
      // Mark the variable as initialized
      const variable = this.variables.get(expression.name);
      variable.initialized = true;
      this.variables.set(expression.name, variable);
    }
    
    this.visitExpression(expression.value);
    
    // Type checking for assignment
    if (this.variables.has(expression.name)) {
      const variableType = this.variables.get(expression.name).type;
      const valueType = this.getExpressionType(expression.value);
      
      if (valueType && !this.isTypeCompatible(variableType, valueType)) {
        this.addError(
          `Cannot assign a value of type '${valueType}' to a variable of type '${variableType}'`,
          expression.line
        );
      }
    }
  }

  /**
   * Visit a VariableExpression node
   * @param {VariableExpression} expression The VariableExpression node
   */
  visitVariableExpression(expression) {
    // Check if the variable is declared
    if (!this.variables.has(expression.name)) {
      this.addError(
        `Variable '${expression.name}' is not declared`,
        expression.line
      );
    } else {
      // Check if the variable is initialized
      const variable = this.variables.get(expression.name);
      if (!variable.initialized) {
        this.addError(
          `Variable '${expression.name}' is not initialized`,
          expression.line
        );
      }
    }
  }

  /**
   * Visit an InputExpression node
   * @param {InputExpression} expression The InputExpression node
   */
  visitInputExpression(expression) {
    // Check if the variable is declared
    if (!this.variables.has(expression.variable)) {
      this.addError(
        `Variable '${expression.variable}' is not declared`,
        expression.line
      );
    } else {
      // Mark the variable as initialized
      const variable = this.variables.get(expression.variable);
      variable.initialized = true;
      this.variables.set(expression.variable, variable);
    }
  }

  /**
   * Visit an OutputExpression node
   * @param {OutputExpression} expression The OutputExpression node
   */
  visitOutputExpression(expression) {
    this.visitExpression(expression.expression);
  }

  /**
   * Get the type of an expression
   * @param {ASTNode} expression The expression
   * @returns {string|null} The type of the expression
   */
  getExpressionType(expression) {
    if (!expression) return null;
    
    if (expression.constructor.name === 'LiteralExpression') {
      return this.getLiteralType(expression);
    } else if (expression.constructor.name === 'VariableExpression') {
      return this.getVariableType(expression);
    } else if (expression.constructor.name === 'BinaryExpression') {
      return this.getBinaryExpressionType(expression);
    } else if (expression.constructor.name === 'UnaryExpression') {
      return this.getUnaryExpressionType(expression);
    }
    
    return null;
  }

  /**
   * Get the type of a literal expression
   * @param {LiteralExpression} expression The literal expression
   * @returns {string} The type of the literal
   */
  getLiteralType(expression) {
    return expression.type;
  }

  /**
   * Get the type of a variable expression
   * @param {VariableExpression} expression The variable expression
   * @returns {string|null} The type of the variable
   */
  getVariableType(expression) {
    if (this.variables.has(expression.name)) {
      return this.variables.get(expression.name).type;
    }
    return null;
  }

  /**
   * Get the type of a binary expression
   * @param {BinaryExpression} expression The binary expression
   * @returns {string|null} The type of the binary expression
   */
  getBinaryExpressionType(expression) {
    const leftType = this.getExpressionType(expression.left);
    const rightType = this.getExpressionType(expression.right);
    
    if (!leftType || !rightType) return null;
    
    switch (expression.operator.type) {
      case 'PLUS':
      case 'MINUS':
      case 'MULTIPLY':
      case 'DIVIDE':
        if (leftType === 'FLOAT' || rightType === 'FLOAT') {
          return 'FLOAT';
        }
        return 'INTEGER';
      case 'EQUAL_EQUAL':
      case 'NOT_EQUAL':
      case 'LESS_THAN':
      case 'GREATER_THAN':
      case 'LESS_EQUAL':
      case 'GREATER_EQUAL':
        return 'INTEGER'; // Boolean expressions are represented as integers
    }
    
    return null;
  }

  /**
   * Get the type of a unary expression
   * @param {UnaryExpression} expression The unary expression
   * @returns {string|null} The type of the unary expression
   */
  getUnaryExpressionType(expression) {
    const rightType = this.getExpressionType(expression.right);
    
    if (!rightType) return null;
    
    if (expression.operator.type === 'MINUS') {
      return rightType;
    }
    
    return null;
  }

  /**
   * Check if a type is numeric
   * @param {string} type The type to check
   * @returns {boolean} True if the type is numeric
   */
  isNumeric(type) {
    return type === 'INTEGER' || type === 'FLOAT' || type === 'SAHIH' || type === 'ASHAR';
  }

  /**
   * Check if a type is boolean
   * @param {string} type The type to check
   * @returns {boolean} True if the type is boolean
   */
  isBoolean(type) {
    // In our simple language, any type can be used in a boolean context
    return true;
  }

  /**
   * Check if two types are compatible for assignment and comparison
   * @param {string} targetType The target type
   * @param {string} sourceType The source type
   * @returns {boolean} True if the types are compatible
   */
  isTypeCompatible(targetType, sourceType) {
    // If the types are the same, they are compatible
    if (targetType === sourceType) return true;
    
    // SAHIH is compatible with INTEGER
    if (targetType === 'SAHIH' && sourceType === 'INTEGER') return true;
    if (targetType === 'INTEGER' && sourceType === 'SAHIH') return true;
    
    // ASHAR is compatible with FLOAT
    if (targetType === 'ASHAR' && sourceType === 'FLOAT') return true;
    if (targetType === 'FLOAT' && sourceType === 'ASHAR') return true;
    
    // ASHAR (float) can accept SAHIH (int) values
    if (targetType === 'ASHAR' && (sourceType === 'SAHIH' || sourceType === 'INTEGER')) return true;
    if (targetType === 'FLOAT' && (sourceType === 'SAHIH' || sourceType === 'INTEGER')) return true;
    
    // HARF is compatible with CHARACTER
    if (targetType === 'HARF' && sourceType === 'CHARACTER') return true;
    if (targetType === 'CHARACTER' && sourceType === 'HARF') return true;
    
    return false;
  }

  /**
   * Add an error
   * @param {string} message The error message
   * @param {number} line The line number where the error occurred
   */
  addError(message, line) {
    this.errors.push({ message, line });
  }
}

module.exports = SemanticAnalyzer;