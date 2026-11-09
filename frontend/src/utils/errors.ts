/** Minimal shape of an axios-style error, used to read API error details safely. */
export interface ApiError {
  message?: string;
  code?: string;
  response?: {
    status?: number;
    data?: {
      detail?: string | { message?: string; error?: { message?: string }; [key: string]: unknown };
      error?: { message?: string };
      [key: string]: unknown;
    };
  };
}
