export class AppError {
  public readonly statusCode?: number;
  public readonly message: string;
  public readonly reason?: string;
  private readonly err: Error | any;

  constructor(message: string, statusCode = 400, reason = "") {
    this.message = message;
    this.statusCode = statusCode;
    this.reason = reason
  }
}
