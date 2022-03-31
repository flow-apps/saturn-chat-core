export class AppError {
  public readonly statusCode?: number;
  public readonly message: string;
  private readonly err: Error | any;

  constructor(message: string, statusCode = 400) {
    this.message = message;
    this.statusCode = statusCode;
  }
}
