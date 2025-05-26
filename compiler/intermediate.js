/**
 * Intermediate code representation for AkbariLang
 * This provides a simpler structure for optimization and code generation
 */
class IntermediateInstruction {
  constructor(op, args = []) {
    this.op = op; // Operation code
    this.args = args; // Arguments for the operation
  }
}

/**
 * Intermediate code generator
 * Converts AST to intermediate code
 */
class IntermediateGenerator {
  constructor() {
    this.instructions = [];
    this.labelCount = 0;
    this.tempCount = 0;
  }

  /**
   * Generate intermediate code from AST
   * @param {ASTNode} ast The AST to convert
   * @returns {IntermediateInstruction[]} Array of intermediate instructions
   */
  generate(ast) {
    this.visitProgram(ast);
    return this.instructions;
  }

  /**
   * Visit a Program node
   * @param {Program} program The Program node
   */
  visitProgram(program) {
    // Include standard library
    this.instructions.push(
      new IntermediateInstruction("INCLUDE", ["iostream"])
    );
    this.instructions.push(new IntermediateInstruction("INCLUDE", ["string"]));

    // Begin main function
    this.instructions.push(new IntermediateInstruction("MAIN_BEGIN"));

    // Process all statements
    program.statements.forEach((statement) => {
      this.visitStatement(statement);
    });

    // End main function
    this.instructions.push(new IntermediateInstruction("MAIN_END"));
  }

  /**
   * Visit a Statement node
   * @param {ASTNode} statement The Statement node
   */
  visitStatement(statement) {
    if (statement.constructor.name === "VariableDeclaration") {
      this.visitVariableDeclaration(statement);
    } else if (statement.constructor.name === "ExpressionStatement") {
      this.visitExpressionStatement(statement);
    } else if (statement.constructor.name === "IfStatement") {
      this.visitIfStatement(statement);
    } else if (statement.constructor.name === "BlockStatement") {
      this.visitBlockStatement(statement);
    } else if (statement.constructor.name === "ForStatement") {
      this.visitForStatement(statement);
    }
  }

  /**
   * Visit a VariableDeclaration node
   * @param {VariableDeclaration} declaration The VariableDeclaration node
   */
  visitVariableDeclaration(declaration) {
    let cppType;

    // Map AkbariLang types to C++ types
    switch (declaration.type) {
      case "SAHIH":
        cppType = "int";
        break;
      case "ASHAR":
        cppType = "float";
        break;
      case "HARF":
        cppType = "char";
        break;
      default:
        cppType = "auto";
        break;
    }

    // Declaration without initialization
    if (!declaration.initializer) {
      this.instructions.push(
        new IntermediateInstruction("DECLARE", [cppType, declaration.name])
      );
      return;
    }

    // Declaration with initialization
    const valuePlace = this.visitExpression(declaration.initializer);
    this.instructions.push(
      new IntermediateInstruction("DECLARE_INIT", [
        cppType,
        declaration.name,
        valuePlace,
      ])
    );
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
    // Generate condition code
    const conditionPlace = this.visitExpression(statement.condition);

    this.instructions.push(
      new IntermediateInstruction("IF_BEGIN", [conditionPlace])
    );

    // Generate then branch code
    this.visitStatement(statement.thenBranch);

    if (statement.elseBranch) {
      this.instructions.push(new IntermediateInstruction("ELSE"));
      this.visitStatement(statement.elseBranch);
    }

    this.instructions.push(new IntermediateInstruction("IF_END"));
  }

  /**
   * Visit a BlockStatement node
   * @param {BlockStatement} statement The BlockStatement node
   */
  visitBlockStatement(statement) {
    // Begin a new scope
    this.instructions.push(new IntermediateInstruction("SCOPE_BEGIN"));

    // Process all statements in the block
    statement.statements.forEach((subStatement) => {
      this.visitStatement(subStatement);
    });

    // End the scope
    this.instructions.push(new IntermediateInstruction("SCOPE_END"));
  }

  /**
   * Visit a ForStatement node
   * @param {ForStatement} statement The ForStatement node
   */
  visitForStatement(statement) {
    const init = "int i = 1";
    const condition = "i <= n";
    const increment = "i = i + 1";

    this.instructions.push(
      new IntermediateInstruction("FOR_LOOP_START", [init, condition, increment])
    );

    // Visit the body statement directly without creating an extra scope
    if (statement.body.constructor.name === "BlockStatement") {
      // For block statements, visit each statement directly
      statement.body.statements.forEach(stmt => this.visitStatement(stmt));
    } else {
      // For single statements
      this.visitStatement(statement.body);
    }

    this.instructions.push(new IntermediateInstruction("FOR_LOOP_END"));
  }

  // Add these new methods to handle the jump instructions
  visitJump(instruction) {
    return `goto ${instruction.args[0]};`;
  }

  visitJumpFalse(instruction) {
    return `if (!(${instruction.args[0]})) goto ${instruction.args[1]};`;
  }

  visitLabel(instruction) {
    return `${instruction.args[0]}:`;
  }

  /**
   * Visit an Expression node
   * @param {ASTNode} expression The Expression node
   * @returns {string} The place where the result is stored
   */
  visitExpression(expression) {
    if (!expression) {
      console.log("return null in visitExpression");
      return null;
    }

    if (expression.constructor.name === "BinaryExpression") {
      return this.visitBinaryExpression(expression);
    } else if (expression.constructor.name === "UnaryExpression") {
      return this.visitUnaryExpression(expression);
    } else if (expression.constructor.name === "AssignmentExpression") {
      return this.visitAssignmentExpression(expression);
    } else if (expression.constructor.name === "VariableExpression") {
      return this.visitVariableExpression(expression);
    } else if (expression.constructor.name === "LiteralExpression") {
      return this.visitLiteralExpression(expression);
    } else if (expression.constructor.name === "InputExpression") {
      return this.visitInputExpression(expression);
    } else if (expression.constructor.name === "OutputExpression") {
      return this.visitOutputExpression(expression);
    }

    console.log("return null in visitExpression 2");
    return null;
  }

  /**
   * Visit a BinaryExpression node
   * @param {BinaryExpression} expression The BinaryExpression node
   * @returns {string} The place where the result is stored
   */
  visitBinaryExpression(expression) {
    const leftPlace = this.visitExpression(expression.left);
    const rightPlace = this.visitExpression(expression.right);
    const resultPlace = this.generateTemp();

    let op;
    switch (expression.operator.type) {
      case "PLUS":
        op = "ADD";
        break;
      case "MINUS":
        op = "SUB";
        break;
      case "MULTIPLY":
        op = "MUL";
        break;
      case "DIVIDE":
        op = "DIV";
        break;
      case "EQUAL_EQUAL":
        op = "EQ";
        break;
      case "NOT_EQUAL":
        op = "NEQ";
        break;
      case "LESS_THAN":
        op = "LT";
        break;
      case "GREATER_THAN":
        op = "GT";
        break;
      case "LESS_EQUAL":
        op = "LE";
        break;
      case "GREATER_EQUAL":
        op = "GE";
        break;
      case "VA":
        op = "AND";
        break;
      case "YA":
        op = "OR";
        break;
      default:
        op = "UNKNOWN";
        break;
    }

    this.instructions.push(
      new IntermediateInstruction(op, [resultPlace, leftPlace, rightPlace])
    );

    return resultPlace;
  }

  /**
   * Visit a UnaryExpression node
   * @param {UnaryExpression} expression The UnaryExpression node
   * @returns {string} The place where the result is stored
   */
  visitUnaryExpression(expression) {
    const rightPlace = this.visitExpression(expression.right);
    const resultPlace = this.generateTemp();

    if (expression.operator.type === "MINUS") {
      this.instructions.push(
        new IntermediateInstruction("NEG", [resultPlace, rightPlace])
      );
    }

    return resultPlace;
  }

  /**
   * Visit an AssignmentExpression node
   * @param {AssignmentExpression} expression The AssignmentExpression node
   * @returns {string} The place where the result is stored
   */
  visitAssignmentExpression(expression) {
    const valuePace = this.visitExpression(expression.value);

    this.instructions.push(
      new IntermediateInstruction("ASSIGN", [expression.name, valuePace])
    );

    return expression.name;
  }

  /**
   * Visit a VariableExpression node
   * @param {VariableExpression} expression The VariableExpression node
   * @returns {string} The place where the result is stored
   */
  visitVariableExpression(expression) {
    return expression.name;
  }

  /**
   * Visit a LiteralExpression node
   * @param {LiteralExpression} expression The LiteralExpression node
   * @returns {string} The place where the result is stored
   */
  visitLiteralExpression(expression) {
    const resultPlace = this.generateTemp();

    let valueStr;
    if (expression.type === "STRING") {
      valueStr = `"${expression.value}"`;
    } else if (expression.type === "CHARACTER") {
      valueStr = `'${expression.value}'`;
    } else {
      valueStr = expression.value.toString();
    }

    this.instructions.push(
      new IntermediateInstruction("LOAD", [resultPlace, valueStr])
    );

    return resultPlace;
  }

  /**
   * Visit an InputExpression node
   * @param {InputExpression} expression The InputExpression node
   * @returns {string} The place where the result is stored
   */
  visitInputExpression(expression) {
    this.instructions.push(
      new IntermediateInstruction("INPUT", [expression.variable])
    );

    return expression.variable;
  }

  /**
   * Visit an OutputExpression node
   * @param {OutputExpression} expression The OutputExpression node
   * @returns {string} The place where the result is stored
   */
  visitOutputExpression(expression) {
    const valuePace = this.visitExpression(expression.expression);

    this.instructions.push(new IntermediateInstruction("OUTPUT", [valuePace]));

    return valuePace;
  }

  /**
   * Generate a new temporary variable
   * @returns {string} A new unique temporary variable
   */
  generateTemp() {
    return `t${this.tempCount++}`;
  }
}

module.exports = IntermediateGenerator;
