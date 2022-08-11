import { RuntimeError } from './runtimeError';
import { Token } from './token';

export class Environment {
  enclosing?: Environment;
  private values: Map<string, any> = new Map();

  constructor(enclosing?: Environment) {
    this.enclosing = enclosing;
  }

  get(name: Token): any {
    if (this.values.has(name.lexeme)) {
      return this.values.get(name.lexeme);
    }
    if (this.enclosing) return this.enclosing.get(name);

    throw new RuntimeError(name, "Undefined variable '" + name.lexeme + "'.");
  }
  assign(name: Token, value: any) {
    if (this.values.has(name.lexeme)) {
      this.values.set(name.lexeme, value);
      return;
    }
    if (this.enclosing) {
      this.enclosing.assign(name, value);
      return;
    }
    throw new RuntimeError(name, "Undefined variable '" + name.lexeme + "'.");
  }
  define(name: string, value: any) {
    this.values.set(name, value);
  }
}
