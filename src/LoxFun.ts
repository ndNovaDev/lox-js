import { Environment } from './environment';
import { Interpreter } from './interpreter';
import { LoxCallable } from './loxCallable';
import { Fun, Return } from './stmt';

export class LoxFunction implements LoxCallable {
  private declaration: Fun;
  private closure: Environment;
  constructor(declaration: Fun, closure: Environment) {
    this.closure = closure;
    this.declaration = declaration;
  }
  public call(interpreter: Interpreter, args: any[]) {
    const environment = new Environment(this.closure);
    for (let i = 0; i < this.declaration.params.length; i++) {
      environment.define(this.declaration.params[i].lexeme, args[i]);
    }

    try {
      interpreter.executeBlock(this.declaration.body, environment);
    } catch (returnValue) {
      return (returnValue as Return).value;
    }
  }
  arity(): number {
    return this.declaration.params.length;
  }
  public toString() {
    return '<fn ' + this.declaration.name.lexeme + '>';
  }
}
