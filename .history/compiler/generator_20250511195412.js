/**
 * C++ code generator
 * Converts intermediate code to C++ code
 */
class CodeGenerator {
  constructor() {
    this.code = [];
    this.indentLevel = 0;
    this.tempVars = new Map(); // Maps temp vars to their types
    this.variables = new Set(); // Tracks all variables
  }

  /**
   * Generate C++ code from intermediate instructions
   * @param {IntermediateInstruction[]} instructions The intermediate instructions
   * @returns {string} The generated C++ code
   */
  generate(instructions) {
    // First pass: analyze types and collect variables
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
      } else if (instr.op === 'DECLARE' || instr.op === 'DECLARE_INIT') {
        this.variables.add(instr.args[1]); // Store variable name
      }
    }

    // Generate includes
    this.addCode('#include <iostream>');
    this.addCode('#include <string>');
    this.addCode('');

    // Begin main function
    this.addCode('int main() {');
    this.indentLevel++;

    // Declare all variables first
    if (this.tempVars.size > 0 || this.variables.size > 0) {
      this.addCode('// Declare variables');
      // First declare program variables
      for (const variable of this.variables) {
        this.addCode(`int ${variable};`); // Assuming all program variables are int for now
      }
      // Then declare temporary variables
      for (const [name, type] of this.tempVars) {
        this.addCode(`${type} ${name};`);
      }
      this.addCode('');
    }

    // Process all instructions
    for (const instr of instructions) {
      this.processInstruction(instr);
    }

    // End main function
    this.addCode('return 0;');
    this.indentLevel--;
    this.addCode('}');

    return this.code.join('\n');
  }

  /**
   * Process a single intermediate instruction
   * @param {IntermediateInstruction} instr The intermediate instruction
   */
  processInstruction(instr) {
    switch (instr.op) {
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
    }
  }

  generateDeclare(type, name) {
    // Skip declaration as we've already declared all variables at the start
  }

  generateDeclareInit(type, name, value) {
    this.addCode(`${name} = ${value};`);
  }

  generateAssign(name, value) {
    this.addCode(`${name} = ${value};`);
  }

  generateLoad(dest, value) {
    this.addCode(`${dest} = ${value};`);
  }

  generateBinaryOp(dest, left, right, op) {
    this.addCode(`${dest} = ${left} ${op} ${right};`);
  }

  generateUnaryOp(dest, operand, op) {
    this.addCode(`${dest} = ${op}${operand};`);
  }

  generateInput(variable) {
    this.addCode(`std::cin >> ${variable};`);
  }

  generateOutput(value) {
    this.addCode(`std::cout << ${value} << std::endl;`);
  }

  generateJump(label) {
    this.addCode(`goto ${label};`);
  }

  generateJumpIfFalse(condition, label) {
    this.addCode(`if (!(${condition})) goto ${label};`);
  }

  generateLabel(label) {
    this.indentLevel--;
    this.addCode(`${label}:`);
    this.indentLevel++;
  }

  generateScopeBegin() {
    this.addCode('{');
    this.indentLevel++;
  }

  generateScopeEnd() {
    this.indentLevel--;
    this.addCode('}');
  }

  addCode(line, position = undefined) {
    const indentedLine = '  '.repeat(this.indentLevel) + line;
    
    if (position !== undefined) {
      this.code.splice(position, 0, indentedLine);
    } else {
      this.code.push(indentedLine);
    }
  }
}

module.exports = CodeGenerator;