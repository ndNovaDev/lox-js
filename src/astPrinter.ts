import { Binary, Expr, Grouping, Literal, Unary, Visitor } from './expr';

export class AstPrinter implements Visitor<string> {
  print(expr: Expr) {
    return expr.accept(this);
  }
  visitBinaryExpr(expr: Binary): string {
    return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
  }
  visitGroupingExpr(expr: Grouping): string {
    return this.parenthesize('group', expr.expression);
  }
  visitLiteralExpr(expr: Literal): string {
    if (expr.value == null) return 'nil';
    return expr.value.toString();
  }
  visitUnaryExpr(expr: Unary): string {
    return this.parenthesize(expr.operator.lexeme, expr.right);
  }
  parenthesize(name: string, ...exprs: Expr[]) {
    return `(${name} ${exprs
      .map(expr => {
        return expr.accept(this);
      })
      .join(' ')})`;
  }
}
