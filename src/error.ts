import { RuntimeError } from './runtimeError';
import { Token } from './token';
import { TokenType } from './TokenType';

let hadRuntimeError = false;

export function showError(line: number, message: string) {
  reportError(line, '', message);
}
export function showErrorWithToken(token: Token, message: string) {
  if (token.type == TokenType.EOF) {
    reportError(token.line, ' at end', message);
  } else {
    reportError(token.line, " at '" + token.lexeme + "'", message);
  }
}
export function reportError(line: number, where: string, message: string) {
  console.log(`[line ${line}] Error ${where}: ${message}`);
}

export function runtimeError(error: RuntimeError) {
  console.error(error.message + '\n[line ' + error.token.line + ']');
  hadRuntimeError = true;
}
