/**
 * C++ code generator
 * Converts intermediate code to C++ code
 */
class CodeGenerator {
  constructor() {
    this.code = [];
    this.indentLevel = 0;
    this.tempVars = new Map(); // Map to store temporary variables and their types
    this.usedTempVars = new Set(); // Set to track used temporary variables
  }

  /**
   * Register a temporary variable
   * @param {string} temp The temporary variable name
   */
  registerTemp(temp) {
    if (this.isTempVar(temp) && !this.tempVars.has(temp)) {
      this.tempVars.set(temp, null); // Register temp without type initially
    }
    this.usedTempVars.add(temp); // Mark temp as used
  }

  /**
   * Generate C++ code from intermediate instructions
   * @param {IntermediateInstruction[]} instructions The intermediate instructions
   * @returns {string} The generated C++ code
   */
  generate(instructions) {
    // First pass: analyze types of temporary variables
    for (const instr of instructions) {
      if (instr.op === 'LOAD') {
        const value = instr.args[1];
        if (typeof value === 'string' && value.startsWith('"')) {
          this.tempVars.set(instr.args[0], 'std::string');
        } else if (typeof value === 'string' && value.includes('.')) {
          this.tempVars.set(instr.args[0], 'double');
        } else {
          this.tempVars.set(instr.args[0], 'int');
        }
      }
    }

    // Remove unused temporary variables
    for (const temp of this.tempVars.keys()) {
      if (!this.usedTempVars.has(temp)) {
        this.tempVars.delete(temp);
      }
    }

    // Process all instructions
    for (const instr of instructions) {
      this.processInstruction(instr);
    }

    return this.code.join('\n');
  }

  /**
   * Process a single intermediate instruction
   * @param {IntermediateInstruction} instr The intermediate instruction
   */
  processInstruction(instr) {
    switch (instr.op) {
      case 'INCLUDE':
        this.generateInclude(instr.args[0]);
        break;
      case 'MAIN_BEGIN':
        this.generateMainBegin();
        break;
      case 'MAIN_END':
        this.generateMainEnd();
        break;
      case 'DECLARE':
        this.generateDeclare(instr.args[0], instr.args[1]);
        break;
      case 'DECLARE_INIT':
        this.generateDeclareInit(instr.args[0], instr.args[1], instr.args[2]);
        break;
      case 'ASSIGN':
        this.generateAssign(instr.args[0], instr.args[1]);
        break;
      case 'LOAD':
        this.generateLoad(instr.args[0], instr.args[1]);
        break;
      case 'ADD':
        this.generateBinaryOp(instr.args[0], instr.args[1], instr.args[2], '+');
        break;
      case 'SUB':
        this.generateBinaryOp(instr.args[0], instr.args[1], instr.args[2], '-');
        break;
      case 'MUL':
        this.generateBinaryOp(instr.args[0], instr.args[1], instr.args[2], '*');
        break;
      case 'DIV':
        this.generateBinaryOp(instr.args[0], instr.args[1], instr.args[2], '/');
        break;
      case 'EQ':
        this.generateBinaryOp(instr.args[0], instr.args[1], instr.args[2], '==');
        break;
      case 'NEQ':
        this.generateBinaryOp(instr.args[0], instr.args[1], instr.args[2], '!=');
        break;
      case 'LT':
        this.generateBinaryOp(instr.args[0], instr.args[1], instr.args[2], '<');
        break;
      case 'GT':
        this.generateBinaryOp(instr.args[0], instr.args[1], instr.args[2], '>');
        break;
      case 'LE':
        this.generateBinaryOp(instr.args[0], instr.args[1], instr.args[2], '<=');
        break;
      case 'GE':
        this.generateBinaryOp(instr.args[0], instr.args[1], instr.args[2], '>=');
        break;
      case 'NEG':
        this.generateUnaryOp(instr.args[0], instr.args[1], '-');
        break;
      case 'INPUT':
        this.generateInput(instr.args[0]);
        break;
      case 'OUTPUT':
        this.generateOutput(instr.args[0]);
        break;
      case 'JUMP':
        this.generateJump(instr.args[0]);
        break;
      case 'JUMP_IF_FALSE':
        this.generateJumpIfFalse(instr.args[0], instr.args[1]);
        break;
      case 'LABEL':
        this.generateLabel(instr.args[0]);
        break;
      case 'SCOPE_BEGIN':
        this.generateScopeBegin();
        break;
      case 'SCOPE_END':
        this.generateScopeEnd();
        break;
      default:
        this.addCode(`// Unknown instruction: ${instr.op}`);
        break;
    }
  }

  /**
   * Generate an include directive
   * @param {string} header The header to include
   */
  generateInclude(header) {
    this.addCode(`#include <${header}>`);
  }

  /**
   * Generate the beginning of the main function
   */
  generateMainBegin() {
    this.addCode('');
    this.addCode('using namespace std;');
    this.addCode('int main() {');
    this.indentLevel++;

    // Declare only used temporary variables with their proper types
    if (this.tempVars.size > 0) {
      this.addCode('// Declare temporary variables');
      for (const [name, type] of this.tempVars) {
        this.addCode(`${type} ${name};`);
      }
      this.addCode('');
    }
  }

  /**
   * Generate the end of the main function
   */
  generateMainEnd() {
    this.addCode('return 0;');
    this.indentLevel--;
    this.addCode('}');
  }

  /**
   * Generate a variable declaration
   * @param {string} type The type of the variable
   * @param {string} name The name of the variable
   */
  generateDeclare(type, name) {
    this.addCode(`${type} ${name};`);
  }

  /**
   * Generate a variable declaration with initialization
   * @param {string} type The type of the variable
   * @param {string} name The name of the variable
   * @param {string} value The initial value
   */
  generateDeclareInit(type, name, value) {
    this.addCode(`${type} ${name} = ${value};`);
  }

  /**
   * Generate an assignment
   * @param {string} name The name of the variable
   * @param {string} value The value to assign
   */
  generateAssign(name, value) {
    this.addCode(`${name} = ${value};`);
  }

  /**
   * Generate a load operation
   * @param {string} dest The destination variable
   * @param {string} value The value to load
   */
  generateLoad(dest, value) {
    this.addCode(`${dest} = ${value};`);
  }

  /**
   * Generate a binary operation
   * @param {string} dest The destination variable
   * @param {string} left The left operand
   * @param {string} right The right operand
   * @param {string} op The operator
   */
  generateBinaryOp(dest, left, right, op) {
    this.addCode(`${dest} = ${left} ${op} ${right};`);
  }

  /**
   * Generate a unary operation
   * @param {string} dest The destination variable
   * @param {string} operand The operand
   * @param {string} op The operator
   */
  generateUnaryOp(dest, operand, op) {
    this.addCode(`${dest} = ${op}${operand};`);
  }

  /**
   * Generate an input operation
   * @param {string} variable The variable to store the input
   */
  generateInput(variable) {
    this.addCode(`cin >> ${variable};`);
  }

  /**
   * Generate an output operation
   * @param {string} value The value to output
   */
  generateOutput(value) {
    this.addCode(`cout << ${value} << endl;`);
  }

  /**
   * Generate an unconditional jump
   * @param {string} label The label to jump to
   */
  generateJump(label) {
    this.addCode(`goto ${label};`);
  }

  /**
   * Generate a conditional jump
   * @param {string} condition The condition variable
   * @param {string} label The label to jump to if the condition is false
   */
  generateJumpIfFalse(condition, label) {
    this.addCode(`if (!(${condition})) goto ${label};`);
  }

  /**
   * Generate a label
   * @param {string} label The label name
   */
  generateLabel(label) {
    this.indentLevel--;
    this.addCode(`${label}:`);
    this.indentLevel++;
  }

  /**
   * Generate the beginning of a scope
   */
  generateScopeBegin() {
    this.addCode('{');
    this.indentLevel++;
  }

  /**
   * Generate the end of a scope
   */
  generateScopeEnd() {
    this.indentLevel--;
    this.addCode('}');
  }

  /**
   * Add a line of code
   * @param {string} line The line of code
   * @param {number} [position] The position to add the line (default: end)
   */
  addCode(line, position = undefined) {
    const indentedLine = '  '.repeat(this.indentLevel) + line;

    if (position !== undefined) {
      this.code.splice(position, 0, indentedLine);
    } else {
      this.code.push(indentedLine);
    }
  }

  /**
   * Check if a variable is a temporary variable
   * @param {string} name The variable name
   * @returns {boolean} True if the variable is temporary
   */
  isTempVar(name) {
    return typeof name === 'string' && name.startsWith('t') && /^t\d+$/.test(name);
  }
}

module.exports = CodeGenerator;