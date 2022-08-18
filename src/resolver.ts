import { Lox } from '.';
import {
  Assign,
  Binary,
  Call,
  Expr,
  ExprVisitor,
  Grouping,
  Literal,
  Logical,
  Unary,
  Variable,
} from './expr';
import { Interpreter } from './interpreter';
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

enum FunctionType {
  NONE,
  FUNCTION,
}

export class Resolver implements ExprVisitor<void>, StmtVisitor<void> {
  private scopes: Map<string, boolean>[] = [];
  private currentFunction = FunctionType.NONE;

  constructor(private interpreter: Interpreter) {}

  resolveStmts(statements: Stmt[]) {
    for (const statement of statements) {
      this.resolveStmt(statement);
    }
  }

  private beginScope() {
    this.scopes.push(new Map<string, boolean>());
  }

  private endScope() {
    this.scopes.pop();
  }

  private declare(name: Token) {
    if (this.scopes.length === 0) return;

    const scope = this.scopes[this.scopes.length - 1];
    if (scope.has(name.lexeme)) {
      Lox.errorWithToken(
        name,
        'Already variable with this name in this scope.',
      );
    }
    scope.set(name.lexeme, false);
  }

  private define(name: Token) {
    if (this.scopes.length === 0) return;
    this.scopes[this.scopes.length - 1].set(name.lexeme, true);
  }

  private resolveLocal(expr: Expr, name: Token) {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i].has(name.lexeme)) {
        this.interpreter.resolve(expr, this.scopes.length - 1 - i);
        return;
      }
    }
  }

  public visitBlockStmt(stmt: Block) {
    this.beginScope();
    this.resolveStmts(stmt.statements);
    this.endScope();
  }

  public visitExpressionStmt(stmt: Expression) {
    this.resolveExpr(stmt.expression);
  }

  public visitFunStmt(stmt: Fun) {
    this.declare(stmt.name);
    this.define(stmt.name);
    this.resolveFunction(stmt, FunctionType.FUNCTION);
  }

  public visitIfStmt(stmt: If) {
    this.resolveExpr(stmt.condition);
    this.resolveStmt(stmt.thenBranch);
    if (stmt.elseBranch != null) this.resolveStmt(stmt.elseBranch);
  }

  public visitPrintStmt(stmt: Print) {
    this.resolveExpr(stmt.expression);
  }

  public visitReturnStmt(stmt: Return) {
    if (this.currentFunction == FunctionType.NONE) {
      Lox.errorWithToken(stmt.keyword, "Can't return from top-level code.");
    }
    if (stmt.value != null) {
      this.resolveExpr(stmt.value);
    }
  }

  public visitVarStmt(stmt: Var) {
    this.declare(stmt.name);
    if (stmt.initializer != null) {
      this.resolveExpr(stmt.initializer);
    }
    this.define(stmt.name);
  }

  public visitWhileStmt(stmt: While) {
    this.resolveExpr(stmt.condition);
    this.resolveStmt(stmt.body);
  }

  public visitAssignExpr(expr: Assign) {
    this.resolveExpr(expr.value);
    this.resolveLocal(expr, expr.name);
  }

  public visitBinaryExpr(expr: Binary) {
    this.resolveExpr(expr.left);
    this.resolveExpr(expr.right);
  }

  public visitCallExpr(expr: Call) {
    this.resolveExpr(expr.callee);
    for (const argument of expr.args) {
      this.resolveExpr(argument);
    }
  }

  public visitGroupingExpr(expr: Grouping) {
    this.resolveExpr(expr.expression);
  }

  public visitLiteralExpr(_expr: Literal) {}

  public visitLogicalExpr(expr: Logical) {
    this.resolveExpr(expr.left);
    this.resolveExpr(expr.right);
  }

  public visitUnaryExpr(expr: Unary) {
    this.resolveExpr(expr.right);
  }

  public visitVariableExpr(expr: Variable) {
    if (
      this.scopes.length &&
      this.scopes[this.scopes.length - 1].get(expr.name.lexeme) === false
    ) {
      Lox.errorWithToken(
        expr.name,
        "Can't read local variable in its own initializer.",
      );
    }

    this.resolveLocal(expr, expr.name);
  }

  private resolveStmt(stmt: Stmt) {
    stmt.accept(this);
  }

  private resolveExpr(expr: Expr) {
    expr.accept(this);
  }

  private resolveFunction(fun: Fun, type: FunctionType) {
    const enclosingFunction = this.currentFunction;
    this.currentFunction = type;
    this.beginScope();
    for (const param of fun.params) {
      this.declare(param);
      this.define(param);
    }
    this.resolveStmts(fun.body);
    this.endScope();
    this.currentFunction = enclosingFunction;
  }
}
