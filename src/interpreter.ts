import { Lox } from '.';
import { Environment } from './environment';
import {
  Assign,
  Binary,
  Expr,
  ExprVisitor,
  Grouping,
  Literal,
  Logical,
  Unary,
  Variable,
} from './expr';
import { RuntimeError } from './runtimeError';
import {
  Block,
  Expression,
  If,
  Print,
  Stmt,
  StmtVisitor,
  Var,
  While,
} from './stmt';
import { Token } from './token';
import { TokenType } from './tokenType';

export class Interpreter implements ExprVisitor<any>, StmtVisitor<void> {
  private environment = new Environment();

  public interpret(statements: Stmt[]) {
    try {
      for (const statement of statements) {
        this.execute(statement);
      }
    } catch (error) {
      if (error instanceof RuntimeError) {
        Lox.runtimeError(error as RuntimeError);
      } else {
        throw error;
      }
    }
  }

  public visitLiteralExpr(expr: Literal) {
    return expr.value;
  }

  public visitLogicalExpr(expr: Logical) {
    const left = this.evaluate(expr.left);

    if (expr.operator.type == TokenType.OR) {
      if (left) return left;
    } else {
      if (!left) return left;
    }

    return this.evaluate(expr.right);
  }

  public visitGroupingExpr(expr: Grouping) {
    return this.evaluate(expr.expression);
  }

  public visitUnaryExpr(expr: Unary) {
    const right = this.evaluate(expr.right);
    switch (expr.operator.type) {
      case TokenType.BANG:
        return !right;
      case TokenType.MINUS:
        this.checkNumberOperand(expr.operator, right);
        return -right;
    }
    // Unreachable.
    return null;
  }

  public visitVariableExpr(expr: Variable) {
    return this.environment.get(expr.name);
  }

  public visitWhileStmt(stmt: While) {
    while (this.evaluate(stmt.condition)) {
      this.execute(stmt.body);
    }
  }

  public visitBinaryExpr(expr: Binary) {
    const left = this.evaluate(expr.left);
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.BANG_EQUAL:
        return !this.isEqual(left, right);
      case TokenType.EQUAL_EQUAL:
        return this.isEqual(left, right);
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
        return Number(left) - Number(right);
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
        return Number(left) / Number(right);
      case TokenType.STAR:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) * Number(right);
    }
    // Unreachable.
    return null;
  }

  private evaluate(expr: Expr): any {
    return expr.accept(this);
  }

  private execute(stmt: Stmt) {
    stmt.accept(this);
  }

  executeBlock(statements: Stmt[], environment: Environment) {
    const previous = this.environment;
    try {
      this.environment = environment;

      for (const statement of statements) {
        this.execute(statement);
      }
    } finally {
      this.environment = previous;
    }
  }

  public visitBlockStmt(stmt: Block) {
    this.executeBlock(stmt.statements, new Environment(this.environment));
    return null;
  }

  public visitExpressionStmt(stmt: Expression) {
    this.evaluate(stmt.expression);
  }

  public visitIfStmt(stmt: If) {
    if (this.evaluate(stmt.condition)) {
      this.execute(stmt.thenBranch);
    } else if (stmt.elseBranch) {
      this.execute(stmt.elseBranch);
    }
  }

  public visitPrintStmt(stmt: Print) {
    const value = this.evaluate(stmt.expression);
    console.log(this.stringify(value));
  }

  public visitVarStmt(stmt: Var) {
    let value = null;
    if (stmt.initializer != null) {
      value = this.evaluate(stmt.initializer);
    }
    this.environment.define(stmt.name.lexeme, value);
  }

  public visitAssignExpr(expr: Assign) {
    const value = this.evaluate(expr.value);
    this.environment.assign(expr.name, value);
    return value;
  }

  private isEqual(a: any, b: any) {
    if (a == null && b == null) return true;
    if (a == null) return false;
    return a.equals(b);
  }

  private checkNumberOperand(operator: Token, operand: any) {
    if (typeof operand === 'number') return;
    throw new RuntimeError(operator, 'Operand must be a number.');
  }

  private checkNumberOperands(operator: Token, left: any, right: any) {
    if (typeof left === 'number' && typeof right === 'number') return;
    throw new RuntimeError(operator, 'Operands must be numbers.');
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
}
