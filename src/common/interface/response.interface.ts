export interface IApiResponse<T> {
  success: true;
  message: string;
  data?: T;
}
