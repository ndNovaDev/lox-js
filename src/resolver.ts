import { showErrorWithToken } from './error';
import {
  Expr,
  ExprVisitor,
  Variable,
  Assign,
  Binary,
  Call,
  Grouping,
  Literal,
  Logical,
  Unary,
  Get,
  Sett,
  This,
} from './expr';
import { Interpreter } from './interpreter';
import {
  Block,
  Class,
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
  INITIALIZER,
  METHOD,
}
enum ClassType {
  NONE,
  CLASS,
}

export class Resolver implements ExprVisitor<any>, StmtVisitor<void> {
  private interpreter: Interpreter;
  private scopes: Map<string, boolean>[] = [];
  private currentFunction = FunctionType.NONE;
  private currentClass = ClassType.NONE;
  constructor(interpreter: Interpreter) {
    this.interpreter = interpreter;
  }

  resolveStatements(statements: Stmt[]) {
    for (let statement of statements) {
      this.resolveStmt(statement);
    }
  }

  public visitBlockStmt(stmt: Block) {
    this.beginScope();
    this.resolveStatements(stmt.statements);
    this.endScope();
  }

  public visitClassStmt(stmt: Class) {
    const enclosingClass = this.currentClass;
    this.currentClass = ClassType.CLASS;
    this.declare(stmt.name);
    this.define(stmt.name);
    this.beginScope();
    this.scopes[0].set('this', true);
    for (const method of stmt.methods) {
      let declaration = FunctionType.METHOD;
      if (method.name.lexeme === 'init') {
        declaration = FunctionType.INITIALIZER;
      }
      this.resolveFunction(method, declaration);
    }
    this.endScope();
    this.currentClass = enclosingClass;
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
      showErrorWithToken(stmt.keyword, "Can't return from top-level code.");
    }
    if (stmt.value != null) {
      if (this.currentFunction == FunctionType.INITIALIZER) {
        showErrorWithToken(
          stmt.keyword,
          "Can't return a value from an initializer.",
        );
      }
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

  public visitGetExpr(expr: Get) {
    this.resolveExpr(expr.object);
  }

  public visitGroupingExpr(expr: Grouping) {
    this.resolveExpr(expr.expression);
  }

  public visitLiteralExpr(_expr: Literal) {}

  public visitLogicalExpr(expr: Logical) {
    this.resolveExpr(expr.left);
    this.resolveExpr(expr.right);
  }

  public visitSettExpr(expr: Sett) {
    this.resolveExpr(expr.value);
    this.resolveExpr(expr.object);
  }

  public visitThisExpr(expr: This) {
    if (this.currentClass == ClassType.NONE) {
      showErrorWithToken(expr.keyword, "Can't use 'this' outside of a class.");
      return null;
    }
    this.resolveLocal(expr, expr.keyword);
  }

  public visitUnaryExpr(expr: Unary) {
    this.resolveExpr(expr.right);
  }

  public visitVariableExpr(expr: Variable) {
    if (this.scopes.length && this.scopes[0].get(expr.name.lexeme) === false) {
      showErrorWithToken(
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
    this.resolveStatements(fun.body);
    this.endScope();
    this.currentFunction = enclosingFunction;
  }

  private beginScope() {
    this.scopes.push(new Map<string, boolean>());
  }
  private endScope() {
    this.scopes.pop();
  }

  private declare(name: Token) {
    if (this.scopes.length === 0) return;

    const scope = this.scopes[0];
    if (scope.has(name.lexeme)) {
      showErrorWithToken(
        name,
        'Already variable with this name in this scope.',
      );
    }
    scope.set(name.lexeme, false);
  }

  private define(name: Token) {
    if (this.scopes.length === 0) return;
    this.scopes[0].set(name.lexeme, true);
  }

  private resolveLocal(expr: Expr, name: Token) {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i].has(name.lexeme)) {
        this.interpreter.resolve(expr, this.scopes.length - 1 - i);
        return;
      }
    }
  }
}
