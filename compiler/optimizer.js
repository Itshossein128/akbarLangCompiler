/**
 * Optimizer for the intermediate code
 * Performs various optimizations to improve the generated code
 */
class Optimizer {
  constructor() {
    this.optimizedInstructions = [];
  }

  /**
   * Optimize the intermediate code
   * @param {IntermediateInstruction[]} instructions The intermediate instructions to optimize
   * @returns {IntermediateInstruction[]} The optimized intermediate instructions
   */
  optimize(instructions) {
    // Apply a series of optimization passes
    const constantFolded = this.constantFolding(instructions);
    const deadCodeRemoved = this.removeDeadCode(constantFolded);
    const controlFlowOptimized = this.optimizeControlFlow(deadCodeRemoved);
    
    return controlFlowOptimized;
  }

  /**
   * Perform constant folding optimization
   * @param {IntermediateInstruction[]} instructions The intermediate instructions
   * @returns {IntermediateInstruction[]} The optimized instructions
   */
  constantFolding(instructions) {
    const constants = new Map();
    const result = [];
    
    for (const instr of instructions) {
      // Check if the instruction can be folded
      if (this.isArithmeticOp(instr.op)) {
        const arg1 = instr.args[1];
        const arg2 = instr.args[2];
        
        // If both operands are constants, compute the result at compile time
        if (this.isConstant(arg1) && this.isConstant(arg2)) {
          const value1 = this.getConstantValue(arg1);
          const value2 = this.getConstantValue(arg2);
          let resultValue;
          
          switch (instr.op) {
            case 'ADD': resultValue = value1 + value2; break;
            case 'SUB': resultValue = value1 - value2; break;
            case 'MUL': resultValue = value1 * value2; break;
            case 'DIV': resultValue = value1 / value2; break;
            case 'EQ': resultValue = value1 === value2 ? 1 : 0; break;
            case 'NEQ': resultValue = value1 !== value2 ? 1 : 0; break;
            case 'LT': resultValue = value1 < value2 ? 1 : 0; break;
            case 'GT': resultValue = value1 > value2 ? 1 : 0; break;
            case 'LE': resultValue = value1 <= value2 ? 1 : 0; break;
            case 'GE': resultValue = value1 >= value2 ? 1 : 0; break;
            default: resultValue = null; break;
          }
          
          if (resultValue !== null) {
            // Replace the instruction with a LOAD instruction
            result.push({
              op: 'LOAD',
              args: [instr.args[0], resultValue.toString()]
            });
            
            // Remember this result for possible future use
            constants.set(instr.args[0], resultValue);
            continue;
          }
        } else if (constants.has(arg1) && constants.has(arg2)) {
          // If both operands are variables with known constant values
          const value1 = constants.get(arg1);
          const value2 = constants.get(arg2);
          let resultValue;
          
          switch (instr.op) {
            case 'ADD': resultValue = value1 + value2; break;
            case 'SUB': resultValue = value1 - value2; break;
            case 'MUL': resultValue = value1 * value2; break;
            case 'DIV': resultValue = value1 / value2; break;
            case 'EQ': resultValue = value1 === value2 ? 1 : 0; break;
            case 'NEQ': resultValue = value1 !== value2 ? 1 : 0; break;
            case 'LT': resultValue = value1 < value2 ? 1 : 0; break;
            case 'GT': resultValue = value1 > value2 ? 1 : 0; break;
            case 'LE': resultValue = value1 <= value2 ? 1 : 0; break;
            case 'GE': resultValue = value1 >= value2 ? 1 : 0; break;
            default: resultValue = null; break;
          }
          
          if (resultValue !== null) {
            // Replace the instruction with a LOAD instruction
            result.push({
              op: 'LOAD',
              args: [instr.args[0], resultValue.toString()]
            });
            
            // Remember this result for possible future use
            constants.set(instr.args[0], resultValue);
            continue;
          }
        }
      } else if (instr.op === 'LOAD') {
        // If loading a constant, remember its value
        if (this.isConstant(instr.args[1])) {
          constants.set(instr.args[0], this.getConstantValue(instr.args[1]));
        }
      } else if (instr.op === 'ASSIGN') {
        // If assigning a constant, remember its value
        if (constants.has(instr.args[1])) {
          constants.set(instr.args[0], constants.get(instr.args[1]));
        }
      } else if (instr.op === 'NEG') {
        // Handle unary negation
        const arg = instr.args[1];
        if (this.isConstant(arg)) {
          const value = -this.getConstantValue(arg);
          result.push({
            op: 'LOAD',
            args: [instr.args[0], value.toString()]
          });
          constants.set(instr.args[0], value);
          continue;
        } else if (constants.has(arg)) {
          const value = -constants.get(arg);
          result.push({
            op: 'LOAD',
            args: [instr.args[0], value.toString()]
          });
          constants.set(instr.args[0], value);
          continue;
        }
      }
      
      // If we reach here, the instruction couldn't be folded
      result.push(instr);
    }
    
    return result;
  }

  /**
   * Remove dead code (unused variables and unreachable code)
   * @param {IntermediateInstruction[]} instructions The intermediate instructions
   * @returns {IntermediateInstruction[]} The optimized instructions
   */
  removeDeadCode(instructions) {
    const result = [];
    const usedVars = new Set();
    const jumpTargets = new Set();
    
    // First pass: collect used variables and jump targets
    for (const instr of instructions) {
      if (instr.op === 'OUTPUT' || instr.op === 'ASSIGN') {
        // Output and assignments use variables
        for (let i = 1; i < instr.args.length; i++) {
          if (this.isVariable(instr.args[i])) {
            usedVars.add(instr.args[i]);
          }
        }
      } else if (instr.op === 'JUMP' || instr.op === 'JUMP_IF_FALSE') {
        // Collect jump targets
        jumpTargets.add(instr.args[instr.args.length - 1]);
      }
    }
    
    // Second pass: remove unused variables and unreachable code
    let reachable = true;
    for (let i = 0; i < instructions.length; i++) {
      const instr = instructions[i];
      
      // Reset reachability at labels that are jump targets
      if (instr.op === 'LABEL' && jumpTargets.has(instr.args[0])) {
        reachable = true;
      }
      
      // If the current instruction is unreachable, skip it
      if (!reachable && instr.op !== 'LABEL') {
        continue;
      }
      
      // Check if this instruction is an unused variable declaration
      if (instr.op === 'DECLARE' && !usedVars.has(instr.args[1])) {
        continue;
      }
      
      // After an unconditional jump, code is unreachable until the next label
      if (instr.op === 'JUMP') {
        reachable = false;
      }
      
      result.push(instr);
    }
    
    return result;
  }

  /**
   * Optimize control flow (eliminate unnecessary jumps and labels)
   * @param {IntermediateInstruction[]} instructions The intermediate instructions
   * @returns {IntermediateInstruction[]} The optimized instructions
   */
  optimizeControlFlow(instructions) {
    const result = [];
    const usedLabels = new Set();
    
    // First pass: collect used labels
    for (const instr of instructions) {
      if (instr.op === 'JUMP' || instr.op === 'JUMP_IF_FALSE') {
        usedLabels.add(instr.args[instr.args.length - 1]);
      }
    }
    
    // Second pass: remove unused labels and consecutive jumps
    for (let i = 0; i < instructions.length; i++) {
      const instr = instructions[i];
      
      // Skip unused labels
      if (instr.op === 'LABEL' && !usedLabels.has(instr.args[0])) {
        continue;
      }
      
      // Jump to the next instruction can be eliminated
      if (instr.op === 'JUMP' && i + 1 < instructions.length && 
          instructions[i + 1].op === 'LABEL' && 
          instr.args[0] === instructions[i + 1].args[0]) {
        continue;
      }
      
      // Jump to a jump can be short-circuited
      if (instr.op === 'JUMP') {
        let targetLabel = instr.args[0];
        let targetIndex = -1;
        
        // Find the target label
        for (let j = 0; j < instructions.length; j++) {
          if (instructions[j].op === 'LABEL' && instructions[j].args[0] === targetLabel) {
            targetIndex = j;
            break;
          }
        }
        
        // If the target label is followed by a jump, update this jump to go directly to that destination
        if (targetIndex !== -1 && targetIndex + 1 < instructions.length && 
            instructions[targetIndex + 1].op === 'JUMP') {
          instr.args[0] = instructions[targetIndex + 1].args[0];
        }
      }
      
      result.push(instr);
    }
    
    return result;
  }

  /**
   * Check if an operation is an arithmetic operation
   * @param {string} op The operation
   * @returns {boolean} True if the operation is arithmetic
   */
  isArithmeticOp(op) {
    return op === 'ADD' || op === 'SUB' || op === 'MUL' || op === 'DIV' ||
           op === 'EQ' || op === 'NEQ' || op === 'LT' || op === 'GT' ||
           op === 'LE' || op === 'GE';
  }

  /**
   * Check if a value is a constant
   * @param {string} value The value
   * @returns {boolean} True if the value is a constant
   */
  isConstant(value) {
    if (typeof value !== 'string') {
      return false;
    }
    
    // Check if it's a numeric literal, string literal, or character literal
    return /^-?\d+(\.\d+)?$/.test(value) ||  // Numeric literal
           /^".*"$/.test(value) ||           // String literal
           /^'.'$/.test(value);              // Character literal
  }

  /**
   * Get the value of a constant
   * @param {string} value The constant
   * @returns {number|string} The value of the constant
   */
  getConstantValue(value) {
    if (/^-?\d+$/.test(value)) {
      return parseInt(value, 10);
    } else if (/^-?\d+\.\d+$/.test(value)) {
      return parseFloat(value);
    } else if (/^".*"$/.test(value)) {
      if (value.length <= 2) {
        return "";
      }
      return value.slice(1, -1);
    } else if (/^'.'$/.test(value)) {
      if (value.length <= 2) {
        return "";
      }
      return value.slice(1, -1);
    }
    
    return value;
  }

  /**
   * Check if a value is a variable
   * @param {string} value The value
   * @returns {boolean} True if the value is a variable
   */
  isVariable(value) {
    if (typeof value !== 'string') {
      return false;
    }
    
    // Check if it's a variable name (not a constant)
    return !this.isConstant(value);
  }
}

module.exports = Optimizer;