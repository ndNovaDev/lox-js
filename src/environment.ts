import { RuntimeError } from './runtimeError';
import { Token } from './token';

export class Environment {
  enclosing: Environment | undefined;
  private values = new Map<string, any>();
  constructor(enclosing?: Environment) {
    this.enclosing = enclosing;
  }
  get(name: Token): any {
    if (this.values.has(name.lexeme)) {
      return this.values.get(name.lexeme);
    }
    if (this.enclosing != null) return this.enclosing.get(name);
    throw new RuntimeError(name, "Undefined variable '" + name.lexeme + "'.");
  }
  assign(name: Token, value: any) {
    if (this.values.has(name.lexeme)) {
      this.values.set(name.lexeme, value);
      return;
    }
    if (this.enclosing != null) {
      this.enclosing.assign(name, value);
      return;
    }
    throw new RuntimeError(name, "Undefined variable '" + name.lexeme + "'.");
  }
  define(name: string, value: any) {
    this.values.set(name, value);
  }
  ancestor(distance: number) {
    let environment: Environment | undefined = this;
    for (let i = 0; i < distance; i++) {
      environment = environment?.enclosing;
    }

    return environment;
  }
  getAt(distance: number, name: string) {
    return this.ancestor(distance)?.values.get(name);
  }
  assignAt(distance: number, name: Token, value: any) {
    this.ancestor(distance)?.values.set(name.lexeme, value);
  }
}
