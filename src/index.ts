import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Interpreter } from './interpreter';
import { Parser } from './parser';
import { Scanner } from './scanner';

let hadError = false;

const args = process.argv;
if (args.length === 3) {
  runFile(resolve(args[2]));
} else {
  throw 'pass .lox file path';
}

function runFile(path: string) {
  const source = readFileSync(path).toString();
  run(source);
  if (hadError) {
    throw 'error found';
  }
}

function run(source: string) {
  const scanner = new Scanner(source);
  const interpreter = new Interpreter();
  const tokens = scanner.scanTokens();
  const parser = new Parser(tokens);
  const statements = parser.parse();

  // Stop if there was a syntax error.
  if (hadError) return;
  interpreter.interpret(statements);
}
