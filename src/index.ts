import { readFileSync } from 'fs';
import { resolve } from 'path';

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
  // const scanner = new Scanner(source);
  // const tokens: Token[] = scanner.scanTokens();
  // console.log(tokens);
}

function error(line: number, message: string) {
  report(line, '', message);
}
function report(line: number, where: string, message: string) {
  console.log(`[line ${line}] Error ${where}: ${message}`);
}
