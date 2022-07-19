import { runtimeError } from './error';
import { Binary, Expr, Grouping, Literal, Unary, Visitor } from './expr';
import { RuntimeError } from './runtimeError';
import { Token } from './token';
import { TokenType } from './TokenType';

export class Interpreter implements Visitor<any> {
  interpret(expression: Expr) {
    try {
      const value = this.evaluate(expression);
      console.log(this.stringify(value));
    } catch (error) {
      console.log(error);
      console.log(runtimeError);
      runtimeError(error as RuntimeError);
    }
  }
  visitLiteralExpr(expr: Literal) {
    return expr.value;
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
  private evaluate(expr: Expr) {
    return expr.accept(this);
  }
}
