/**
 * Token class represents a token in the AkbariLang
 */
class Token {
  constructor(type, value, line, column) {
    this.type = type;
    this.value = value;
    this.line = line;
    this.column = column;
  }
}

/**
 * TokenType enum defines all possible token types for AkbariLang
 */
const TokenType = {
  // Keywords
  BEGIR: 'BEGIR',         // cin
  BENVIS: 'BENVIS',       // cout
  SAHIH: 'SAHIH',         // int
  ASHAR: 'ASHAR',         // float
  HARF: 'HARF',           // char
  AGE: 'AGE',             // if
  VALI_AGE: 'VALI_AGE',   // else if
  VAGARNA: 'VAGARNA',     // else
  BARAYE: 'BARAYE',       // for
  TA: 'TA',               // to (used in for loops)
  
  // Symbols
  EQUAL: 'EQUAL',             // =
  PLUS: 'PLUS',               // +
  MINUS: 'MINUS',             // -
  MULTIPLY: 'MULTIPLY',       // *
  DIVIDE: 'DIVIDE',           // /
  LESS_THAN: 'LESS_THAN',     // <
  GREATER_THAN: 'GREATER_THAN', // >
  LESS_EQUAL: 'LESS_EQUAL',   // <=
  GREATER_EQUAL: 'GREATER_EQUAL', // >=
  EQUAL_EQUAL: 'EQUAL_EQUAL', // ==
  NOT_EQUAL: 'NOT_EQUAL',     // !=
  
  // Punctuation
  LEFT_PAREN: 'LEFT_PAREN',   // (
  RIGHT_PAREN: 'RIGHT_PAREN', // )
  LEFT_BRACE: 'LEFT_BRACE',   // {
  RIGHT_BRACE: 'RIGHT_BRACE', // }
  SEMICOLON: 'SEMICOLON',     // ;
  COMMA: 'COMMA',             // ,
  QUOTE: 'QUOTE',             // "
  
  // Literals
  IDENTIFIER: 'IDENTIFIER',   // Variable names
  INTEGER: 'INTEGER',         // Integer literals
  FLOAT: 'FLOAT',             // Float literals
  STRING: 'STRING',           // String literals
  CHARACTER: 'CHARACTER',     // Character literals
  
  // Other
  EOF: 'EOF',                 // End of file
  UNKNOWN: 'UNKNOWN'          // Unknown token
};

/**
 * Keywords map for easy lookup
 */
const Keywords = {
  'begir': TokenType.BEGIR,
  'benvis': TokenType.BENVIS,
  'sahih': TokenType.SAHIH,
  'ashar': TokenType.ASHAR,
  'harf': TokenType.HARF,
  'age': TokenType.AGE,
  'vali': TokenType.VALI_AGE, // This is special handling, see lexer
  'vagarna': TokenType.VAGARNA,
  'baraye': TokenType.BARAYE,
  'ta': TokenType.TA
};

module.exports = {
  Token,
  TokenType,
  Keywords
};