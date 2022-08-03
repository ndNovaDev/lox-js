import { LoxFunction } from './LoxFun';
import { Interpreter } from './interpreter';
import { LoxCallable } from './loxCallable';
import { LoxInstance } from './LoxInstance';

export class LoxClass implements LoxCallable {
  name: string;
  superclass?: LoxClass;
  methods: Map<string, LoxFunction>;

  constructor(
    name: string,
    methods: Map<string, LoxFunction>,
    superclass?: LoxClass,
  ) {
    this.name = name;
    this.superclass = superclass;
    this.methods = methods;
  }

  findMethod(name: string): LoxFunction | undefined {
    if (this.methods.has(name)) {
      return this.methods.get(name);
    }
    if (this.superclass) {
      return this.superclass.findMethod(name);
    }
  }

  public toString() {
    return this.name;
  }

  public call(interpreter: Interpreter, args: any[]) {
    const instance = new LoxInstance(this);
    const initializer = this.findMethod('init');
    if (initializer != null) {
      initializer.bind(instance).call(interpreter, args);
    }
    return instance;
  }

  public arity() {
    const initializer = this.findMethod('init');
    if (initializer == null) return 0;
    return initializer.arity();
  }
}
