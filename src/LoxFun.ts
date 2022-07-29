import { Environment } from './environment';
import { Interpreter } from './interpreter';
import { LoxCallable } from './loxCallable';
import { LoxInstance } from './LoxInstance';
import { Fun, Return } from './stmt';

export class LoxFunction implements LoxCallable {
  private declaration: Fun;
  private closure: Environment;
  private isInitializer: boolean;
  constructor(declaration: Fun, closure: Environment, isInitializer: boolean) {
    this.closure = closure;
    this.declaration = declaration;
    this.isInitializer = isInitializer;
  }

  bind(instance: LoxInstance) {
    const environment = new Environment(this.closure);
    environment.define('this', instance);
    return new LoxFunction(this.declaration, environment, this.isInitializer);
  }

  public call(interpreter: Interpreter, args: any[]) {
    const environment = new Environment(this.closure);
    for (let i = 0; i < this.declaration.params.length; i++) {
      environment.define(this.declaration.params[i].lexeme, args[i]);
    }

    try {
      interpreter.executeBlock(this.declaration.body, environment);
    } catch (returnValue) {
      if (this.isInitializer) return this.closure.getAt(0, 'this');
      return (returnValue as Return).value;
    }

    if (this.isInitializer) return this.closure.getAt(0, 'this');
  }
  arity(): number {
    return this.declaration.params.length;
  }
  public toString() {
    return '<fn ' + this.declaration.name.lexeme + '>';
  }
}
