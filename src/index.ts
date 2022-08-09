import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Scanner } from './scanner';
import prompts from 'prompts';
import { Token } from './token';
import { TokenType } from './tokenType';
import { Parser } from './parser';
import { AstPrinter } from './astPrinter';

export class Lox {
  static hadError = false;

  public main() {
    const args = process.argv;
    if (args.length > 3) {
      throw 'Usage: jlox [script]';
    } else if (args.length === 3) {
      this.runFile(resolve(args[2]));
    } else {
      this.runPrompt();
    }
  }

  async runPrompt() {
    while (true) {
      const { line } = await prompts({
        type: 'text',
        name: 'line',
        message: '>',
      });
      if (!line) {
        break;
      }
      this.run(line);
      Lox.hadError = false;
    }
  }

  runFile(path: string) {
    const source = readFileSync(path).toString();
    this.run(source);
    if (Lox.hadError) {
      throw 'error found';
    }
  }

  run(source: string) {
    const scanner = new Scanner(source);
    const tokens = scanner.scanTokens();
    const parser = new Parser(tokens);
    const expression = parser.parse();

    // Stop if there was a syntax error.
    if (Lox.hadError) return;
    if (expression) {
      console.log(new AstPrinter().print(expression));
    }
  }

  static errorWithLine(line: number, message: string) {
    Lox.report(line, '', message);
  }

  static report(line: number, where: string, message: string) {
    console.log('[line ' + line + '] Error' + where + ': ' + message);
    Lox.hadError = true;
  }

  static errorWithToken(token: Token, message: string) {
    if (token.type == TokenType.EOF) {
      Lox.report(token.line, ' at end', message);
    } else {
      Lox.report(token.line, " at '" + token.lexeme + "'", message);
    }
  }
}

const lox = new Lox();
lox.main();
