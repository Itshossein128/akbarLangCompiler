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

  generate(instructions) {
    // First pass: analyze types and collect variables
    // Collect all temp variables (tN) as destinations in any instruction that produces a value
    for (const instr of instructions) {
      // If the instruction has a destination variable (first arg) and it matches tN
      if (instr.args && instr.args.length > 0 && /^t\d+$/.test(instr.args[0])) {
        // Determine type: string, double, or int
        let type = "int";
        if (instr.op === "LOAD") {
          const value = instr.args[1];
          if (typeof value === "string" && value.startsWith('"')) {
            type = "std::string";
          } else if (typeof value === "string" && value.includes(".")) {
            type = "double";
          } else {
            type = "int";
          }
        } else if (["ADD","SUB","MUL","DIV","EQ","NEQ","LT","GT","LE","GE","AND","OR","NEG"].includes(instr.op)) {
          type = "int";
        }
        // Only set if not already set (prefer string/double over int if already set)
        if (!this.tempVars.has(instr.args[0]) || type !== "int") {
          this.tempVars.set(instr.args[0], type);
        }
      }
      // Handle program variables
      if (instr.op === "DECLARE" || instr.op === "DECLARE_INIT") {
        this.variables.add(instr.args[1]);
      } else if (instr.op === "INPUT") {
        this.variables.add(instr.args[0]);
      }
    }

    // Generate includes
    this.addCode("#include <iostream>");
    this.addCode("#include <string>");
    this.addCode("");

    // Begin main function
    this.addCode("int main() {");
    this.indentLevel++;

    // Declare all variables first
    if (this.tempVars.size > 0 || this.variables.size > 0) {
      this.addCode("// Declare variables");
      // First declare program variables
      for (const variable of this.variables) {
        this.addCode(`int ${variable};`); // Assuming all program variables are int for now
      }
      // Then declare temporary variables
      for (const [name, type] of this.tempVars) {
        this.addCode(`${type} ${name};`);
      }
      this.addCode("");
    }

    // Process all instructions
    for (const instr of instructions) {
      this.processInstruction(instr);
    }

    // End main function
    this.addCode("return 0;");
    this.indentLevel--;
    this.addCode("}");

    return this.code.join("\n");
  }

  /**
   * Process a single intermediate instruction
   * @param {IntermediateInstruction} instr The intermediate instruction
   */
  processInstruction(instr) {
    switch (instr.op) {
      case "DECLARE":
        this.generateDeclare(instr.args[0], instr.args[1]);
        break;
      case "DECLARE_INIT":
        this.generateDeclareInit(instr.args[0], instr.args[1], instr.args[2]);
        break;
      case "ASSIGN":
        this.generateAssign(instr.args[0], instr.args[1]);
        break;
      case "LOAD":
        this.generateLoad(instr.args[0], instr.args[1]);
        break;
      case "ADD":
        this.generateBinaryOp(instr.args[0], instr.args[1], instr.args[2], "+");
        break;
      case "SUB":
        this.generateBinaryOp(instr.args[0], instr.args[1], instr.args[2], "-");
        break;
      case "MUL":
        this.generateBinaryOp(instr.args[0], instr.args[1], instr.args[2], "*");
        break;
      case "DIV":
        this.generateBinaryOp(instr.args[0], instr.args[1], instr.args[2], "/");
        break;
      case "EQ":
        this.generateBinaryOp(
          instr.args[0],
          instr.args[1],
          instr.args[2],
          "=="
        );
        break;
      case "NEQ":
        this.generateBinaryOp(
          instr.args[0],
          instr.args[1],
          instr.args[2],
          "!="
        );
        break;
      case "LT":
        this.generateBinaryOp(instr.args[0], instr.args[1], instr.args[2], "<");
        break;
      case "GT":
        this.generateBinaryOp(instr.args[0], instr.args[1], instr.args[2], ">");
        break;
      case "LE":
        this.generateBinaryOp(
          instr.args[0],
          instr.args[1],
          instr.args[2],
          "<="
        );
        break;
      case "GE":
        this.generateBinaryOp(
          instr.args[0],
          instr.args[1],
          instr.args[2],
          ">="
        );
        break;
      case "AND":
        this.generateBinaryOp(
          instr.args[0],
          instr.args[1],
          instr.args[2],
          "&&"
        );
        break;
      case "OR":
        this.generateBinaryOp(
          instr.args[0],
          instr.args[1],
          instr.args[2],
          "||"
        );
        break;
      case "NEG":
        this.generateUnaryOp(instr.args[0], instr.args[1], "-");
        break;
      case "INPUT":
        this.generateInput(instr.args[0]);
        break;
      case "OUTPUT":
        this.generateOutput(instr.args[0]);
        break;
      case "FOR_BEGIN":
        this.generateForBegin(instr.args[0], instr.args[1], instr.args[2]);
        break;
      case "FOR_END":
        this.generateForEnd();
        break;
      case "JUMP_IF_FALSE":
        this.generateJumpIfFalse(instr.args[0], instr.args[1]);
        break;
      case "SCOPE_BEGIN":
        this.generateScopeBegin();
        break;
      case "SCOPE_END":
        this.generateScopeEnd();
        break;
      case "FOR_LOOP_START": {
        const [init, cond, incr] = instr.args;
        this.addCode(`for (${init}; ${cond}; ${incr}) {`);
        this.indentLevel++;
        break;
      }
      
      case "FOR_LOOP_END": {
        this.indentLevel--;
        this.addCode("}");
        break;
      }
      case "LABEL":
        this.addCode(`${instr.args[0]}:`);
        break;
      case "JUMP_IF_FALSE":
        this.addCode(`if (!(${instr.args[0]})) goto ${instr.args[1]};`);
        break;
      case "JUMP":
        this.addCode(`goto ${instr.args[0]};`);
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

  generateForBegin(init, condition, increment) {
    this.addCode(`for (${init}; ${condition}; ${increment}) {`);
    this.indentLevel++;
  }

  generateForEnd() {
    this.indentLevel--;
    this.addCode("}");
  }

  generateJumpIfFalse(condition, label) {
    this.addCode(`if (!(${condition})) goto ${label};`);
  }

  generateScopeBegin() {
    this.addCode("{");
    this.indentLevel++;
  }

  generateScopeEnd() {
    this.indentLevel--;
    this.addCode("}");
  }

  // Remove these methods as they're not being used correctly
  generateForLoopStart() {
      return "for (";
  }
  
  generateForLoopCondition(condition) {
      return `${condition}; `;
  }
  
  generateForLoopIncrement(increment) {
      return `${increment}) `;
  }
  
  generateForLoopEnd() {
      return "}";
  }

  addCode(line, position = undefined) {
    const indentedLine = "  ".repeat(this.indentLevel) + line;

    if (position !== undefined) {
      this.code.splice(position, 0, indentedLine);
    } else {
      this.code.push(indentedLine);
    }
  }
}

module.exports = CodeGenerator;
