import { writeFileSync } from 'fs';

class GenerateAst {
  public main() {
    this.defineAst(
      'src',
      'Expr',
      [
        'Assign   : Token name, Expr value',
        'Binary   : Expr left, Token operator, Expr right',
        'Call     : Expr callee, Token paren, Expr[] args',
        'Grouping : Expr expression',
        'Literal  : Object value',
        'Logical  : Expr left, Token operator, Expr right',
        'Unary    : Token operator, Expr right',
        'Variable : Token name',
      ],
      "import { Token } from './token';",
    );
    this.defineAst(
      'src',
      'Stmt',
      [
        'Block      : Stmt[] statements',
        'Expression : Expr expression',
        'Fun        : Token name, Token[] params,' + ' Stmt[] body',
        'If         : Expr condition, Stmt thenBranch,' + ' Stmt elseBranch?',
        'Print      : Expr expression',
        'Return     : Token keyword, Expr value?',
        'Var        : Token name, Expr initializer?',
        'While      : Expr condition, Stmt body',
      ],
      "import { Expr } from './expr';\nimport { Token } from './token';",
    );
  }

  private defineAst(
    outputDir: string,
    baseName: string,
    types: string[],
    importStr: string,
  ) {
    const fileName = outputDir + '/' + baseName.toLowerCase() + '.ts';
    const typeInfos = types.map(type => {
      const className = type.split(':')[0].trim();
      const fields = type.split(':')[1].trim();
      return { className, fields };
    });

    writeFileSync(
      fileName,
      `${importStr}

export interface ${baseName}Visitor<R> {
  ${typeInfos
    .map(({ className }) => {
      return `visit${className}${baseName}(${baseName.toLowerCase()}: ${baseName}): R;`;
    })
    .join('\n  ')}
}

export abstract class ${baseName} {
  abstract accept<R>(visitor: ${baseName}Visitor<R>): R;
}
    ${typeInfos
      .map(({ className, fields }) => {
        return this.defineType(baseName, className, fields);
      })
      .join('\n')}
`,
    );
  }

  private defineType(baseName: string, className: string, fieldsStr: string) {
    const fields = fieldsStr.split(',').map(fieldStr => {
      const [type, name] = fieldStr
        .trim()
        .split(' ')
        .map(str => str.trim());
      return { name, type: type === 'Object' ? 'any' : type };
    });
    const fieldParams = fields
      .map(field => {
        return `public ${field.name}: ${field.type}`;
      })
      .join(', ');
    return `
export class ${className} extends ${baseName} {
  constructor(${fieldParams}) {
    super();
  }
  accept<R>(visitor: ${baseName}Visitor<R>): R {
    return visitor.visit${className}${baseName}(this);
  }
}`;
  }
}

const generateAst = new GenerateAst();
generateAst.main();
