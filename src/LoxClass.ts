import { Interpreter } from './interpreter';
import { LoxCallable } from './loxCallable';
import { LoxInstance } from './LoxInstance';

export class LoxClass implements LoxCallable {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  public toString() {
    return this.name;
  }

  public call(interpreter: Interpreter, args: any[]) {
    const instance = new LoxInstance(this);
    return instance;
  }

  public arity() {
    return 0;
  }
}
