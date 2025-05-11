const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const chalk = require('chalk');

const Lexer = require('./compiler/lexer');
const Parser = require('./compiler/parser');
const SemanticAnalyzer = require('./compiler/semantic');
const IntermediateGenerator = require('./compiler/intermediate');
const Optimizer = require('./compiler/optimizer');
const CodeGenerator = require('./compiler/generator');

// Check if source file is provided
if (process.argv.length < 3) {
  console.error(chalk.red('Error: Source file is required'));
  console.log(chalk.yellow('Usage: node index.js <source_file.txt>'));
  process.exit(1);
}

const sourceFile = process.argv[2];

// Check if source file exists
if (!fs.existsSync(sourceFile)) {
  console.error(chalk.red(`Error: Source file '${sourceFile}' not found`));
  process.exit(1);
}

try {
  // Read the source code
  const sourceCode = fs.readFileSync(sourceFile, 'utf8');
  
  console.log(chalk.blue('Starting compilation process for AkbariLang...'));
  
  // Step 1: Lexical Analysis
  console.log(chalk.cyan('Step 1: Lexical Analysis'));
  const lexer = new Lexer(sourceCode);
  const tokens = lexer.tokenize();
  
  // Step 2: Syntax Analysis
  console.log(chalk.cyan('Step 2: Syntax Analysis'));
  const parser = new Parser(tokens);
  const ast = parser.parse();
  
  // Step 3: Semantic Analysis
  console.log(chalk.cyan('Step 3: Semantic Analysis'));
  const semanticAnalyzer = new SemanticAnalyzer();
  semanticAnalyzer.analyze(ast);
  
  // Step 4: Intermediate Code Generation
  console.log(chalk.cyan('Step 4: Intermediate Code Generation'));
  const intermediateGenerator = new IntermediateGenerator();
  const intermediateCode = intermediateGenerator.generate(ast);
  
  // Step 5: Code Optimization
  console.log(chalk.cyan('Step 5: Code Optimization'));
  const optimizer = new Optimizer();
  const optimizedCode = optimizer.optimize(intermediateCode);
  
  // Step 6: Code Generation
  console.log(chalk.cyan('Step 6: Code Generation'));
  const codeGenerator = new CodeGenerator();
  const outputCode = codeGenerator.generate(optimizedCode);
  
  // Get the output filename by replacing the extension with .cpp
  const outputFile = path.basename(sourceFile, path.extname(sourceFile)) + '.cpp';
  
  // Write the output to a file
  fs.writeFileSync(outputFile, outputCode);
  console.log(chalk.green(`C++ code generated successfully: ${outputFile}`));
  
  // Compile and run the C++ code
  console.log(chalk.blue('Compiling and running the generated C++ code...'));
  
  // First check if g++ is available
  exec('g++ --version', (error) => {
    if (error) {
      console.log(chalk.yellow('Note: g++ compiler not found. Generated C++ code was saved but cannot be compiled and run.'));
      return;
    }
    
    // Compile the C++ code
    const executableFile = path.basename(sourceFile, path.extname(sourceFile));
    exec(`g++ ${outputFile} -o ${executableFile}`, (error, stdout, stderr) => {
      if (error) {
        console.error(chalk.red(`Error compiling C++ code: ${stderr}`));
        return;
      }
      
      console.log(chalk.green('C++ code compiled successfully'));
      
      // Run the executable
      exec(`./${executableFile}`, (error, stdout, stderr) => {
        if (error) {
          console.error(chalk.red(`Error running the executable: ${stderr}`));
          return;
        }
        
        console.log(chalk.green('Program output:'));
        console.log(stdout);
      });
    });
  });
  
} catch (error) {
  console.error(chalk.red(`Compilation error: ${error.message}`));
  if (error.lineNumber) {
    console.error(chalk.yellow(`Line ${error.lineNumber}: ${error.message}`));
  }
  process.exit(1);
}