import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Scanner } from './scanner';
import prompts from 'prompts';

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
    tokens.forEach(token => {
      console.log(token.toString());
    });
  }

  static error(line: number, message: string) {
    Lox.report(line, '', message);
  }

  static report(line: number, where: string, message: string) {
    console.log('[line ' + line + '] Error' + where + ': ' + message);
    Lox.hadError = true;
  }
}

const lox = new Lox();
lox.main();
