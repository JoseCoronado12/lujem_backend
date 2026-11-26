export interface CustomerAuthResponse {
  customer: {
    identificacion: string;
    correo: string;
    nombres: string;
    apellidos: string;
    emailVerificado?: boolean;
  };
  token: string;
  refreshToken?: string;
}
