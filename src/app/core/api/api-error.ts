import { HttpErrorResponse } from '@angular/common/http';

interface ApiErrorBody {
  error?: {
    message?: unknown;
  };
}

export function readApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    const body: unknown = error.error;

    if (isApiErrorBody(body) && typeof body.error?.message === 'string') {
      return body.error.message;
    }
  }

  return fallback;
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return typeof value === 'object' && value !== null;
}
