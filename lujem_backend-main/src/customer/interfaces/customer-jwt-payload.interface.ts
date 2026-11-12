export interface CustomerJwtPayload {
  sub: string;
  correo: string;
  kind: 'customer';
}
