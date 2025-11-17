export type DomainErrorCode =
  | 'NOT_FOUND'
  | 'VALIDATION_FAILED'
  | 'INVALID_TRANSITION'
  | 'ALREADY_CLOSED'
  | 'UNAUTHORIZED'
  | 'CONFLICT';

export class DomainError extends Error {
  constructor(
    public code: DomainErrorCode,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
  }
}

export const notFound = (message: string) => new DomainError('NOT_FOUND', message);
export const invalidTransition = (message: string, details?: Record<string, unknown>) =>
  new DomainError('INVALID_TRANSITION', message, details);
export const alreadyClosed = (message: string) => new DomainError('ALREADY_CLOSED', message);
