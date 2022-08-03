import { Expr, Variable } from './expr';
import { Token } from './token';

export interface StmtVisitor<R> {
  visitExpressionStmt(stmt: Stmt): R;
  visitFunStmt(stmt: Stmt): R;
  visitIfStmt(stmt: Stmt): R;
  visitPrintStmt(stmt: Stmt): R;
  visitReturnStmt(stmt: Stmt): R;
  visitVarStmt(stmt: Stmt): R;
  visitBlockStmt(stmt: Stmt): R;
  visitClassStmt(stmt: Stmt): R;
  visitWhileStmt(stmt: Stmt): R;
}

export abstract class Stmt {
  abstract accept<R>(visitor: StmtVisitor<R>): R;
}

export class Block extends Stmt {
  statements: Stmt[];
  constructor(statements: Stmt[]) {
    super();
    this.statements = statements;
  }
  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitBlockStmt(this);
  }
}
export class Class extends Stmt {
  name: Token;
  superclass?: Variable;
  methods: Fun[];
  constructor(name: Token, methods: Fun[], superclass?: Variable) {
    super();
    this.name = name;
    this.superclass = superclass;
    this.methods = methods;
  }
  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitClassStmt(this);
  }
}
export class Expression extends Stmt {
  expression: Expr;
  constructor(expression: Expr) {
    super();
    this.expression = expression;
  }
  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitExpressionStmt(this);
  }
}

export class Fun extends Stmt {
  name: Token;
  params: Token[];
  body: Stmt[];
  constructor(name: Token, params: Token[], body: Stmt[]) {
    super();
    this.name = name;
    this.params = params;
    this.body = body;
  }
  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitFunStmt(this);
  }
}
export class If extends Stmt {
  condition: Expr;
  thenBranch: Stmt;
  elseBranch: Stmt;
  constructor(condition: Expr, thenBranch: Stmt, elseBranch: Stmt) {
    super();
    this.condition = condition;
    this.thenBranch = thenBranch;
    this.elseBranch = elseBranch;
  }
  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitIfStmt(this);
  }
}

export class Print extends Stmt {
  expression: Expr;
  constructor(expression: Expr) {
    super();
    this.expression = expression;
  }
  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitPrintStmt(this);
  }
}

export class Return extends Stmt {
  keyword: Token;
  value?: Expr;
  constructor(keyword: Token, value?: Expr) {
    super();
    this.keyword = keyword;
    this.value = value;
  }
  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitReturnStmt(this);
  }
}

export class Var extends Stmt {
  name: Token;
  initializer?: Expr;
  constructor(name: Token, initializer?: Expr) {
    super();
    this.name = name;
    this.initializer = initializer;
  }
  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitVarStmt(this);
  }
}

export class While extends Stmt {
  body: Stmt;
  condition: Expr;
  constructor(condition: Expr, body: Stmt) {
    super();
    this.body = body;
    this.condition = condition;
  }
  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitWhileStmt(this);
  }
}
