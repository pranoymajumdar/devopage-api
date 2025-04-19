export interface SuccessResponse<T> {
  status: true;
  message: string;
  data?: T;
}

export interface ErrorResponse<
  T = string[] | string | Record<string, unknown>,
> {
  status: false;
  message: string;
  errors?: T;
}

export type ApiResponse<T, E = string[] | string | Record<string, unknown>> =
  | SuccessResponse<T>
  | ErrorResponse<E>;
