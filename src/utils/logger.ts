/**
 * Simple logging utility with color coding for better visibility
 */

export class Logger {
  constructor(private verbose: boolean = true) {}

  info(message: string, ...args: any[]) {
    if (this.verbose) {
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  success(message: string, ...args: any[]) {
    if (this.verbose) {
      console.log(`[SUCCESS] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]) {
    console.warn(`[WARN] ${message}`, ...args);
  }

  error(message: string, ...args: any[]) {
    console.error(`[ERROR] ${message}`, ...args);
  }

  debug(message: string, ...args: any[]) {
    if (this.verbose) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  step(stepNumber: number, totalSteps: number, description: string) {
    if (this.verbose) {
      console.log(`\n[STEP ${stepNumber}/${totalSteps}] ${description}`);
    }
  }
}

// Export a default instance
export const logger = new Logger(true);
