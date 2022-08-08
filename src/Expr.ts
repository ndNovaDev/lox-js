import { Token } from './token';

export interface ExprVisitor<R> {
  visitBinaryExpr(expr: Expr): R;
  visitGroupingExpr(expr: Expr): R;
  visitLiteralExpr(expr: Expr): R;
  visitUnaryExpr(expr: Expr): R;
}

export abstract class Expr {
  abstract accept<R>(visitor: ExprVisitor<R>): R;
}

export class Binary extends Expr {
  constructor(public left: Expr, public operator: Token, public right: Expr) {
    super();
  }
  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitBinaryExpr(this);
  }
}

export class Grouping extends Expr {
  constructor(public expression: Expr) {
    super();
  }
  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitGroupingExpr(this);
  }
}

export class Literal extends Expr {
  constructor(public value: any) {
    super();
  }
  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitLiteralExpr(this);
  }
}

export class Unary extends Expr {
  constructor(public operator: Token, public right: Expr) {
    super();
  }
  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitUnaryExpr(this);
  }
}
