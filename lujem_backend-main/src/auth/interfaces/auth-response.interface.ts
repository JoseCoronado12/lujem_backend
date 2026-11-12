// Datos públicos del usuario que se devuelven al autenticarse
export interface AuthUser {
  id: number;
  email: string;
  nombres: string;
  apellidos: string;
  role: string;
}

// Respuesta de los endpoints /auth/register y /auth/login
export interface AuthResponse {
  user: AuthUser;
  token: string;
}