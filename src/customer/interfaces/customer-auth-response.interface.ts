export interface CustomerAuthResponse {
  customer: {
    identificacion: string;
    correo: string;
    nombres: string;
    apellidos: string;
  };
  token: string;
}
