// import { Binary, Expr, Grouping, Literal, Unary, ExprVisitor } from './Expr';
// import { Token } from './token';
// import { TokenType } from './tokenType';

// export class AstPrinter implements ExprVisitor<string> {
//   print(expr: Expr) {
//     return expr.accept(this);
//   }
//   visitBinaryExpr(expr: Binary): string {
//     return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
//   }
//   visitGroupingExpr(expr: Grouping): string {
//     return this.parenthesize('group', expr.expression);
//   }
//   visitLiteralExpr(expr: Literal): string {
//     if (expr.value == null) return 'nil';
//     return expr.value.toString();
//   }
//   visitUnaryExpr(expr: Unary): string {
//     return this.parenthesize(expr.operator.lexeme, expr.right);
//   }
//   parenthesize(name: string, ...exprs: Expr[]) {
//     return `(${name} ${exprs
//       .map(expr => {
//         return expr.accept(this);
//       })
//       .join(' ')})`;
//   }
// }

// // const expression = new Binary(
// //   new Unary(new Token(TokenType.MINUS, '-', null, 1), new Literal(123)),
// //   new Token(TokenType.STAR, '*', null, 1),
// //   new Grouping(new Literal(45.67)),
// // );

// // console.log(new AstPrinter().print(expression));
