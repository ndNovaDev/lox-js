import { writeFileSync } from 'fs';

class GenerateAst {
  public main() {
    this.defineAst('src', 'Expr', [
      'Binary   : Expr left, Token operator, Expr right',
      'Grouping : Expr expression',
      'Literal  : Object value',
      'Unary    : Token operator, Expr right',
    ]);
  }

  private defineAst(outputDir: string, baseName: string, types: string[]) {
    const fileName = outputDir + '/' + baseName + '.ts';
    const typeInfos = types.map(type => {
      const className = type.split(':')[0].trim();
      const fields = type.split(':')[1].trim();
      return { className, fields };
    });

    writeFileSync(
      fileName,
      `import { Token } from './token';

export interface ExprVisitor<R> {
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
  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visit${className}Expr(this);
  }
}`;
  }
}

const generateAst = new GenerateAst();
generateAst.main();
