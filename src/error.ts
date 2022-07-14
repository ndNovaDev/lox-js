export function showError(line: number, message: string) {
  reportError(line, '', message);
}
export function reportError(line: number, where: string, message: string) {
  console.log(`[line ${line}] Error ${where}: ${message}`);
}
