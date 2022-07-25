import { Environment } from './environment';
import { runtimeError } from './error';
import {
  Binary,
  Expr,
  Grouping,
  Literal,
  Unary,
  ExprVisitor,
  Variable,
  Assign,
  Logical,
  Call,
} from './expr';
import { LoxCallable } from './loxCallable';
import { LoxFunction } from './LoxFun';
import { ReturnException } from './Return';
import { RuntimeError } from './runtimeError';
import {
  Block,
  Expression,
  Fun,
  If,
  Print,
  Return,
  Stmt,
  StmtVisitor,
  Var,
  While,
} from './stmt';
import { Token } from './token';
import { TokenType } from './TokenType';

export class Interpreter implements ExprVisitor<any>, StmtVisitor<void> {
  globals = new Environment();
  private environment = this.globals;

  constructor() {
    this.globals.define('clock', {
      arity: () => 0,
      call: () => new Date().getTime() / 1000,
      toString: () => '<native fn>',
    });
  }

  interpret(statements: Stmt[]) {
    try {
      for (const statement of statements) {
        this.execute(statement);
      }
    } catch (error) {
      if ((error as any)?.isReturn) {
        throw error;
      } else {
        runtimeError(error as RuntimeError);
      }
    }
  }
  visitLiteralExpr(expr: Literal) {
    return expr.value;
  }
  visitLogicalExpr(expr: Logical): any {
    const left = this.evaluate(expr.left);

    if (expr.operator.type == TokenType.OR) {
      if (this.isTruthy(left)) return left;
    } else {
      if (!this.isTruthy(left)) return left;
    }

    return this.evaluate(expr.right);
  }
  visitGroupingExpr(expr: Grouping): any {
    return this.evaluate(expr.expression);
  }
  visitUnaryExpr(expr: Unary): any {
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.BANG:
        return !this.isTruthy(right);
      case TokenType.MINUS:
        return -Number(right);
    }

    // Unreachable.
    return null;
  }
  public visitVariableExpr(expr: Variable) {
    return this.environment.get(expr.name);
  }
  private checkNumberOperand(operator: Token, operand: any) {
    if (typeof operand === 'number') return;
    throw new RuntimeError(operator, 'Operand must be a number.');
  }
  private checkNumberOperands(operator: Token, left: any, right: any) {
    if (typeof left === 'number' && typeof right === 'number') return;

    throw new RuntimeError(operator, 'Operands must be numbers.');
  }
  isTruthy(object: any) {
    if (object == null) return false;
    if (typeof object === 'boolean') return object;
    return true;
  }
  private isEqual(a: any, b: any) {
    if (a == null && b == null) return true;
    if (a == null) return false;

    return a === b;
  }
  private stringify(object: any) {
    if (object == null) return 'nil';

    if (typeof object === 'number') {
      let text = object.toString();
      if (text.endsWith('.0')) {
        text = text.substring(0, text.length - 2);
      }
      return text;
    }

    return object.toString();
  }
  visitBinaryExpr(expr: Binary): any {
    const left = this.evaluate(expr.left);
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.GREATER:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) > Number(right);
      case TokenType.GREATER_EQUAL:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) >= Number(right);
      case TokenType.LESS:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) < Number(right);
      case TokenType.LESS_EQUAL:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) <= Number(right);
      case TokenType.MINUS:
        this.checkNumberOperands(expr.operator, left, right);
        this.checkNumberOperand(expr.operator, right);
        return left - right;
      case TokenType.PLUS:
        if (typeof left === 'number' && typeof right === 'number') {
          return Number(left) + Number(right);
        }
        if (typeof left === 'string' && typeof right === 'string') {
          return String(left) + String(right);
        }
        throw new RuntimeError(
          expr.operator,
          'Operands must be two numbers or two strings.',
        );
      case TokenType.SLASH:
        this.checkNumberOperands(expr.operator, left, right);
        return left / right;
      case TokenType.STAR:
        this.checkNumberOperands(expr.operator, left, right);
        return left * right;
      case TokenType.BANG_EQUAL:
        return !this.isEqual(left, right);
      case TokenType.EQUAL_EQUAL:
        return this.isEqual(left, right);
    }

    // Unreachable.
    return null;
  }
  public visitCallExpr(expr: Call) {
    const callee = this.evaluate(expr.callee);

    const args: any[] = [];
    for (const arg of expr.args) {
      args.push(this.evaluate(arg));
    }

    if (!callee.call) {
      throw new RuntimeError(
        expr.paren,
        'Can only call functions and classes.',
      );
    }

    const fun = callee as LoxCallable;

    if (args.length != fun.arity()) {
      throw new RuntimeError(
        expr.paren,
        'Expected ' + fun.arity() + ' args but got ' + args.length + '.',
      );
    }

    return fun.call(this, args);
  }
  private evaluate(expr: Expr) {
    return expr.accept(this);
  }

  private execute(stmt: Stmt) {
    stmt.accept(this);
  }

  executeBlock(statements: Stmt[], environment: Environment) {
    const previous = this.environment;
    try {
      this.environment = environment;
      for (let statement of statements) {
        this.execute(statement);
      }
    } finally {
      this.environment = previous;
    }
  }

  public visitBlockStmt(stmt: Block) {
    this.executeBlock(stmt.statements, new Environment(this.environment));
  }

  visitExpressionStmt(stmt: Expression): void {
    this.evaluate(stmt.expression);
  }
  public visitFunStmt(stmt: Fun) {
    const fun = new LoxFunction(stmt, this.environment);
    this.environment.define(stmt.name.lexeme, fun);
  }
  visitIfStmt(stmt: If): void {
    if (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.thenBranch);
    } else if (stmt.elseBranch != null) {
      this.execute(stmt.elseBranch);
    }
  }
  visitPrintStmt(stmt: Print): void {
    const value = this.evaluate(stmt.expression);
    console.log(this.stringify(value));
  }
  public visitReturnStmt(stmt: Return) {
    let value = null;
    if (stmt.value != null) value = this.evaluate(stmt.value);

    throw new ReturnException(value);
  }
  public visitVarStmt(stmt: Var) {
    let value = null;
    if (stmt.initializer) {
      value = this.evaluate(stmt.initializer);
    }

    this.environment.define(stmt.name.lexeme, value);
  }

  public visitWhileStmt(stmt: While) {
    while (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.body);
    }
    return null;
  }

  public visitAssignExpr(expr: Assign): any {
    const value = this.evaluate(expr.value);
    this.environment.assign(expr.name, value);
    return value;
  }
}
