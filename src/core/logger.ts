export class MTNetLogger {
  log(...args: string[]): void {
    console.log(...args);
  }

  warn(...args: string[]): void {
    console.warn(...args);
  }

  error(...args: string[]): void {
    console.error(...args);
  }
}
