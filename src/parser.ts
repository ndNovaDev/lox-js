// expression     → equality ;
// equality       → comparison ( ( "!=" | "==" ) comparison )* ;
// comparison     → term ( ( ">" | ">=" | "<" | "<=" ) term )* ;
// term           → factor ( ( "-" | "+" ) factor )* ;
// factor         → unary ( ( "/" | "*" ) unary )* ;
// unary          → ( "!" | "-" ) unary | primary ;
// primary        → NUMBER | STRING | "true" | "false" | "nil" | "(" expression ")" ;

import { showError, showErrorWithToken } from './error';
import {
  Assign,
  Binary,
  Call,
  Expr,
  Get,
  Grouping,
  Literal,
  Logical,
  Sett,
  This,
  Unary,
  Variable,
} from './expr';
import {
  Block,
  Class,
  Expression,
  Fun,
  If,
  Print,
  Return,
  Stmt,
  Var,
  While,
} from './stmt';
import { Token } from './token';
import { TokenType } from './TokenType';

export class Parser {
  tokens: Token[];
  current = 0;
  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse() {
    const statements: Stmt[] = [];
    while (!this.isAtEnd()) {
      const statement = this.declaration();
      if (statement) {
        statements.push(statement);
      }
    }
    return statements;
  }

  expression() {
    return this.assignment();
  }

  private declaration() {
    try {
      if (this.match(TokenType.CLASS)) return this.classDeclaration();
      if (this.match(TokenType.FUN)) return this.fun('function');
      if (this.match(TokenType.VAR)) return this.varDeclaration();
      return this.statement();
    } catch (error) {
      this.synchronize();
    }
  }

  private classDeclaration() {
    const name = this.consume(TokenType.IDENTIFIER, 'Expect class name.');
    this.consume(TokenType.LEFT_BRACE, "Expect '{' before class body.");

    const methods: Fun[] = [];
    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      methods.push(this.fun('method'));
    }

    this.consume(TokenType.RIGHT_BRACE, "Expect '}' after class body.");

    return new Class(name, methods);
  }

  statement() {
    if (this.match(TokenType.FOR)) return this.forStatement();
    if (this.match(TokenType.IF)) return this.ifStatement();
    if (this.match(TokenType.PRINT)) return this.printStatement();
    if (this.match(TokenType.RETURN)) return this.returnStatement();
    if (this.match(TokenType.WHILE)) return this.whileStatement();
    if (this.match(TokenType.LEFT_BRACE)) return new Block(this.block());
    return this.expressionStatement();
  }

  private forStatement() {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'for'.");
    let initializer: Stmt | undefined;
    if (this.match(TokenType.SEMICOLON)) {
    } else if (this.match(TokenType.VAR)) {
      initializer = this.varDeclaration();
    } else {
      initializer = this.expressionStatement();
    }

    let condition: Expr | undefined;
    if (!this.check(TokenType.SEMICOLON)) {
      condition = this.expression();
    }
    this.consume(TokenType.SEMICOLON, "Expect ';' after loop condition.");

    let increment: Expr | undefined;
    if (!this.check(TokenType.RIGHT_PAREN)) {
      increment = this.expression();
    }
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after for clauses.");

    let body: Stmt = this.statement();

    if (increment) {
      body = new Block([body, new Expression(increment)]);
    }
    if (!condition) condition = new Literal(true);
    body = new While(condition, body);

    if (initializer != null) {
      body = new Block([initializer, body]);
    }
    return body;
  }

  private ifStatement(): If {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'if'.");
    const condition = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after if condition.");

    const thenBranch = this.statement();
    let elseBranch: any;
    if (this.match(TokenType.ELSE)) {
      elseBranch = this.statement();
    }

    return new If(condition, thenBranch, elseBranch);
  }

  printStatement() {
    const value = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after value.");
    return new Print(value);
  }

  private returnStatement() {
    const keyword = this.previous();
    let value: Expr | undefined = undefined;
    if (!this.check(TokenType.SEMICOLON)) {
      value = this.expression();
    }

    this.consume(TokenType.SEMICOLON, "Expect ';' after return value.");
    return new Return(keyword, value);
  }

  private assignment(): Expr {
    const expr = this.or();

    if (this.match(TokenType.EQUAL)) {
      const equals = this.previous();
      const value = this.assignment();

      if (expr instanceof Variable) {
        const name = expr.name;
        return new Assign(name, value);
      } else if (expr instanceof Get) {
        const get = expr;
        return new Sett(get.object, get.name, value);
      }
      this.error(equals, 'Invalid assignment target.');
    }

    return expr;
  }

  private or() {
    let expr = this.and();

    while (this.match(TokenType.OR)) {
      const operator = this.previous();
      const right = this.and();
      expr = new Logical(expr, operator, right);
    }

    return expr;
  }

  private and() {
    let expr = this.equality();

    while (this.match(TokenType.AND)) {
      const operator = this.previous();
      const right = this.equality();
      expr = new Logical(expr, operator, right);
    }

    return expr;
  }

  private varDeclaration() {
    const name = this.consume(TokenType.IDENTIFIER, 'Expect variable name.');

    let initializer: Expr | undefined;
    if (this.match(TokenType.EQUAL)) {
      initializer = this.expression();
    }

    this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration.");
    return new Var(name, initializer);
  }

  private whileStatement(): While {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'while'.");
    const condition = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after condition.");
    const body = this.statement();

    return new While(condition, body);
  }

  expressionStatement() {
    const expr = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after expression.");
    return new Expression(expr);
  }

  private fun(kind: string) {
    const name = this.consume(
      TokenType.IDENTIFIER,
      'Expect ' + kind + ' name.',
    );
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after " + kind + ' name.');
    const parameters: Token[] = [];
    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        if (parameters.length >= 255) {
          showErrorWithToken(
            this.peek(),
            "Can't have more than 255 parameters.",
          );
        }

        parameters.push(
          this.consume(TokenType.IDENTIFIER, 'Expect parameter name.'),
        );
      } while (this.match(TokenType.COMMA));
    }
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after parameters.");
    this.consume(TokenType.LEFT_BRACE, "Expect '{' before " + kind + ' body.');
    const body = this.block();
    return new Fun(name, parameters, body);
  }

  private block() {
    const statements: Stmt[] = [];

    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      const statement = this.declaration();
      if (statement) {
        statements.push(statement);
      }
    }

    this.consume(TokenType.RIGHT_BRACE, "Expect '}' after block.");
    return statements;
  }

  equality() {
    let expr = this.comparison();

    while (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
      const operator = this.previous();
      const right = this.comparison();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }

  private comparison() {
    let expr = this.term();

    while (
      this.match(
        TokenType.GREATER,
        TokenType.GREATER_EQUAL,
        TokenType.LESS,
        TokenType.LESS_EQUAL,
      )
    ) {
      const operator = this.previous();
      const right = this.term();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }

  private term() {
    let expr = this.factor();

    while (this.match(TokenType.MINUS, TokenType.PLUS)) {
      const operator = this.previous();
      const right = this.factor();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }

  private factor() {
    let expr = this.unary();

    while (this.match(TokenType.SLASH, TokenType.STAR)) {
      const operator = this.previous();
      const right = this.unary();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }

  private unary(): Expr {
    if (this.match(TokenType.BANG, TokenType.MINUS)) {
      const operator = this.previous();
      const right = this.unary();
      return new Unary(operator, right);
    }

    return this.call();
  }

  private finishCall(callee: Expr) {
    const args: Expr[] = [];
    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        if (arguments.length >= 255) {
          showErrorWithToken(
            this.peek(),
            "Can't have more than 255 arguments.",
          );
        }
        args.push(this.expression());
      } while (this.match(TokenType.COMMA));
    }

    const paren = this.consume(TokenType.RIGHT_PAREN, "Expect ')' after args.");

    return new Call(callee, paren, args);
  }

  private call() {
    let expr: Expr = this.primary();

    while (true) {
      if (this.match(TokenType.LEFT_PAREN)) {
        expr = this.finishCall(expr);
      } else if (this.match(TokenType.DOT)) {
        const name = this.consume(
          TokenType.IDENTIFIER,
          "Expect property name after '.'.",
        );
        expr = new Get(expr, name);
      } else {
        break;
      }
    }

    return expr;
  }

  private primary() {
    if (this.match(TokenType.FALSE)) return new Literal(false);
    if (this.match(TokenType.TRUE)) return new Literal(true);
    if (this.match(TokenType.NIL)) return new Literal(null);

    if (this.match(TokenType.NUMBER, TokenType.STRING)) {
      return new Literal(this.previous().literal);
    }

    if (this.match(TokenType.THIS)) return new This(this.previous());
    if (this.match(TokenType.IDENTIFIER)) {
      return new Variable(this.previous());
    }

    if (this.match(TokenType.LEFT_PAREN)) {
      const expr = this.expression();
      this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.");
      return new Grouping(expr);
    }

    throw this.error(this.peek(), 'Expect expression.');
  }

  match(...types: TokenType[]) {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private consume(type: TokenType, message: string) {
    if (this.check(type)) return this.advance();

    throw this.error(this.peek(), message);
  }

  check(type: TokenType) {
    if (this.isAtEnd()) {
      return false;
    }
    return this.peek().type === type;
  }

  advance() {
    if (!this.isAtEnd()) {
      this.current++;
    }
    return this.previous();
  }

  isAtEnd() {
    return this.peek().type == TokenType.EOF;
  }

  peek() {
    return this.tokens[this.current];
  }

  previous() {
    return this.tokens[this.current - 1];
  }

  private error(token: Token, message: string) {
    showErrorWithToken(token, message);
    return new Error();
  }

  private synchronize() {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type == TokenType.SEMICOLON) return;

      switch (this.peek().type) {
        case TokenType.CLASS:
        case TokenType.FUN:
        case TokenType.VAR:
        case TokenType.FOR:
        case TokenType.IF:
        case TokenType.WHILE:
        case TokenType.PRINT:
        case TokenType.RETURN:
          return;
      }

      this.advance();
    }
  }
}
