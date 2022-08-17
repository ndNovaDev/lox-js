import { Interpreter } from './interpreter';

export interface LoxCallable {
  arity(): number;
  call(interpreter: Interpreter, args: any[]): any;
}
