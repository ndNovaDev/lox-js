import { Expr } from './expr';
import { Token } from './token';

export interface StmtVisitor<R> {
  visitBlockStmt(stmt: Stmt): R;
  visitExpressionStmt(stmt: Stmt): R;
  visitPrintStmt(stmt: Stmt): R;
  visitVarStmt(stmt: Stmt): R;
}

export abstract class Stmt {
  abstract accept<R>(visitor: StmtVisitor<R>): R;
}

export class Block extends Stmt {
  constructor(public statements: Stmt[]) {
    super();
  }
  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitBlockStmt(this);
  }
}

export class Expression extends Stmt {
  constructor(public expression: Expr) {
    super();
  }
  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitExpressionStmt(this);
  }
}

export class Print extends Stmt {
  constructor(public expression: Expr) {
    super();
  }
  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitPrintStmt(this);
  }
}

export class Var extends Stmt {
  constructor(public name: Token, public initializer?: Expr) {
    super();
  }
  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitVarStmt(this);
  }
}
