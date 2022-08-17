import { Environment } from './environment';
import { Interpreter } from './interpreter';
import { LoxCallable } from './loxCallable';
import { ReturnException } from './return ';
import { Fun } from './stmt';

export class LoxFunction implements LoxCallable {
  constructor(private declaration: Fun, private closure: Environment) {}
  public call(interpreter: Interpreter, args: any[]) {
    const environment = new Environment(this.closure);
    for (let i = 0; i < this.declaration.params.length; i++) {
      environment.define(this.declaration.params[i].lexeme, args[i]);
    }
    try {
      interpreter.executeBlock(this.declaration.body, environment);
    } catch (ret) {
      if (ret instanceof ReturnException) {
        return ret.value;
      } else {
        throw ret;
      }
    }
  }
  arity(): number {
    return this.declaration.params.length;
  }
  public toString() {
    return '<fn ' + this.declaration.name.lexeme + '>';
  }
}
