# akbarLang Documentation

akbarLang is a simple imperative programming language with Farsi keywords. It is designed to be easy to learn and use, especially for those who are new to programming and are more comfortable with Farsi. This document provides an overview of the akbarLang syntax, features, and usage.

## Syntax and Keywords

akbarLang uses Farsi keywords to make it more accessible for Farsi-speaking learners. Here's a list of the keywords and their English equivalents:

| akbarLang Keyword | English Equivalent | Description |
|---|---|---|
| `benvis` | print | Outputs data to the console. |
| `sahih` | integer | Declares an integer variable. |
| `ashar` | float | Declares a floating-point variable. |
| `harf` | character | Declares a character variable. |
| `begir` | input | Reads input from the user. |
| `age` | if | Starts an if conditional statement. |
| `vali` | else if / else | Starts an else if or else conditional statement. |
| `vagarna` | else | Starts an else conditional statement (alternative to `vali` for else). |
| `baraye` | for | Starts a for loop. |
| `vaghti` | while | Starts a while loop. |
| `ta` | to | Used in for loops to specify the upper limit. |

All statements in akbarLang must end with a semicolon (`;`).

## Data Types

akbarLang supports the following data types:

*   **`sahih` (Integer):** Used for whole numbers.
    ```akbarlang
    sahih myInteger = 10;
    sahih anotherInt = -5;
    ```
*   **`ashar` (Float):** Used for numbers with decimal points.
    ```akbarlang
    ashar myFloat = 3.14;
    ashar anotherFloat = -0.5;
    ```
*   **`harf` (Character):** Used for single characters. Character literals are enclosed in single quotes.
    ```akbarlang
    harf myChar = 'A';
    harf anotherChar = 'z';
    ```
*   **String:** Used for sequences of characters. String literals are enclosed in double quotes. There isn't a specific keyword to declare a string variable type; you can assign a string literal to a variable declared with `sahih`, `ashar`, or `harf`, though it's semantically more aligned with how text is handled. For clarity, it's often used directly with `benvis`.
    ```akbarlang
    benvis("This is a string.");
    // Variable assignment (less common for strings, but possible)
    sahih myString = "hello"; // The compiler allows this
    ```

Variables are declared using the type keyword followed by the variable name and an optional initializer.
    ```akbarlang
    sahih age = 25;
    ashar price = 19.99;
    harf initial = 'J';
    ```

## Control Flow Statements

akbarLang provides common control flow statements to manage the execution path of your program.

### `age` (If), `vali` (Else If/Else), `vagarna` (Else) Statements

Conditional statements allow you to execute blocks of code based on certain conditions.

*   **`age` (If):** Executes a block of code if a condition is true.
*   **`vali age` (Else If):** Executes a block of code if the preceding `age` (or `vali age`) condition was false, and its own condition is true.
*   **`vali` (Else):** Executes a block of code if all preceding `age` and `vali age` conditions were false.
*   **`vagarna` (Else):** An alternative to `vali` for a simple else block. Executes if the preceding `age` or `vali age` condition was false.

```akbarlang
sahih num = 10;

age (num > 0) {
  benvis("Number is positive.");
} vali age (num < 0) {
  benvis("Number is negative.");
} vali {
  benvis("Number is zero.");
};

sahih grade = 75;
age (grade >= 90) {
  benvis("Grade is A");
} vali age (grade >= 80) {
  benvis("Grade is B");
} vagarna {
  benvis("Grade is C or lower");
};
```

### `baraye` (For) Loop

The `baraye` loop is used to execute a block of code a specific number of times. The syntax is:
`baraye (initializer; condition; increment) { ... }`

```akbarlang
baraye (sahih i = 0; i < 5; i = i + 1) {
  benvis(i); // Prints numbers from 0 to 4
};

// The 'ta' keyword is mentioned in the lexer/parser but its exact usage in for loops
// based on the parser structure seems to be for the condition part directly.
// For example, a loop counting down:
baraye (sahih count = 10; count > 0; count = count - 1) {
  benvis(count);
};
```

### `vaghti` (While) Loop

The `vaghti` loop executes a block of code as long as a specified condition is true.

```akbarlang
sahih counter = 0;
vaghti (counter < 3) {
  benvis("Counter is: ");
  benvis(counter);
  counter = counter + 1;
};
// Output:
// Counter is: 0
// Counter is: 1
// Counter is: 2
```

## Operators

akbarLang supports various operators:

*   **Arithmetic Operators:**
    *   `+` (Addition)
    *   `-` (Subtraction)
    *   `*` (Multiplication)
    *   `/` (Division)
*   **Comparison Operators:**
    *   `==` (Equal to)
    *   `!=` (Not equal to)
    *   `<` (Less than)
    *   `>` (Greater than)
    *   `<=` (Less than or equal to)
    *   `>=` (Greater than or equal to)
*   **Logical Operators:**
    *   `va` (Logical AND)
    *   `ya` (Logical OR)
*   **Assignment Operator:**
    *   `=` (Assigns a value to a variable)

```akbarlang
sahih a = 10;
sahih b = 5;
sahih sum = a + b; // sum will be 15
benvis(sum);

ashar c = 7.5;
ashar d = 2.5;
ashar product = c * d; // product will be 18.75
benvis(product);

age (a > b va c != 0) {
  benvis("Condition is true!");
};
```

## Comments

Comments are used to explain code and are ignored by the compiler. In akbarLang, comments start with a `#` symbol and extend to the end of the line.

```akbarlang
# This is a single-line comment
sahih x = 10; # This is an inline comment explaining the variable

# benvis("This line will not be executed.");

# You can use comments to temporarily disable lines of code.
```

## Program Examples

Here are some complete examples of akbarLang programs:

### Hello, World!

This program prints "Hello, World!" to the console.

```akbarlang
benvis("Hello, World!");
```

### Factorial

This program calculates the factorial of a number (e.g., 5).

```akbarlang


sahih n;


benvis("Enter a number to calculate factorial: ");
begir(n);


sahih factorial = 1;


baraye(sahih i = 1; i <= n; i = i + 1) {
    factorial = factorial * i;
}


benvis("Factorial of ");
benvis(n);
benvis(" is: ");
benvis(factorial);
```

### Simple Calculator

This program takes two numbers and an operator as input and performs a simple calculation.

```akbarlang
sahih a;
sahih b;
sahih operation;
sahih result = 0;

benvis("Enter first number: ");
begir(a);

benvis("Enter second number: ");
begir(b);


benvis("Select operation: ");
benvis("1: Add");
benvis("2: Subtract");
benvis("3: Multiply");
benvis("4: Divide");
begir(operation);


age (operation == 1) {
    result = a + b;
    benvis("Result of addition: ");
} vali age (operation == 2) {
    result = a - b;
    benvis("Result of subtraction: ");
} vali age (operation == 3) {
    result = a * b;
    benvis("Result of multiplication: ");
} vali age (operation == 4) {
    age (b == 0) {
        benvis("Error: Division by zero");
    } vagarna {
        result = a / b;
        benvis("Result of division: ");
        benvis(result);
    }
} vagarna {
    benvis("Invalid operation selected");
}


age (operation >= 1) {
    age (operation <= 4) {
        age (operation != 4 ya b != 0) {
            benvis(result);
        }
    }
}
```

### While Loop Example

This program demonstrates the use of a `vaghti` (while) loop.

```akbarlang

sahih adad = 5;
sahih jam = 0;
vaghti (adad > 0) {
  jam = jam + adad;
  adad = adad - 1;
}

benvis(jam);
```

## Running akbarLang Programs

To run akbarLang programs, you typically need to use the compiler provided in this repository. The `index.js` file is likely the main entry point for the compiler.

```bash
node index.js <path_to_your_akbarlang_file.txt>
```

For example, to run the `hello_world.txt` example:

```bash
node index.js examples/hello_world.txt
```
This will execute the akbarLang code and produce the corresponding output (e.g., JavaScript code or direct execution).
