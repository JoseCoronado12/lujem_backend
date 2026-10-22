<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Autenticación JWT

Configura `JWT_SECRET` en el entorno o en `.env` con un valor aleatorio largo antes
de iniciar la aplicación. Los tokens emitidos expiran en una hora.

- `POST /auth/register`: registra un usuario con `email`, `password` y `fullName`.
- `POST /auth/login`: recibe `email` y `password`; devuelve `user` y `token`.
- `GET /auth/me`: devuelve el perfil autenticado.
- Las rutas `/users` requieren `Authorization: Bearer <token>`.

Ejemplo de autenticación de una ruta protegida:

```http
Authorization: Bearer eyJ...
```

## Migraciones de base de datos

El backend no sincroniza automáticamente el esquema. Ejecuta
`npm run migration:run` para aplicar migraciones pendientes y consulta el estado
con `npm run migration:show`.

La migración inicial crea `users` en una base de datos nueva. Si `users` ya existe,
solo registra el baseline cuando verifica que las columnas, clave primaria e
índice único de correo coinciden con el esquema inicial; no altera la tabla.
Si el esquema difiere, se detiene para que se revise antes de migrar.

La migración de roles crea `USER` y `ADMIN`, separa nombres y apellidos y asocia
cada usuario a un rol. Por seguridad, se detiene si ya existen usuarios: sus
nombres requieren un mapeo confirmado antes de transformarlos. El registro asigna
`USER` automáticamente; las rutas `/users` son exclusivas de `ADMIN`. La PK
numérica se conserva temporalmente; la conversión a identificación queda pendiente.
Para provisionar el primer administrador, registra su cuenta y asígnale el rol
desde una sesión administrativa de MySQL:

```sql
UPDATE users
SET id_rol = (SELECT id_rol FROM roles WHERE nombre = 'ADMIN')
WHERE email = 'correo-del-administrador';
```

## Inventario y proveedores

`POST`, `GET`, `GET /:id`, `PATCH /:id` y `DELETE /:id` están disponibles en
`/products` y `/suppliers`; todas estas rutas requieren JWT de un administrador.
Los campos del modelo se validan como obligatorios, salvo valores de inventario
que tienen valor inicial cero. El precio debe ser positivo con hasta dos
decimales y el stock no puede ser negativo. Los productos se identifican por
código de barras y los proveedores por código autogenerado con NIT único.

## Órdenes de compra

Las rutas `/purchase-orders` requieren rol `ADMIN`. `POST` crea una orden
`BORRADOR` con uno o más detalles; el backend calcula subtotales y total a partir
de cantidad y costo unitario. `PATCH /purchase-orders/:id` permite editar detalles
solo durante `BORRADOR` y cambiar el estado según el flujo:
`BORRADOR` → `ENVIADA` → `RECIBIDA`, con cancelación permitida antes de recibir.
El inventario se incrementa únicamente al recibir, en una transacción que bloquea
los productos y evita aplicar dos veces la misma recepción. La FK de usuario usa
temporalmente el ID numérico actual, hasta que se defina la migración de
identificación del modelo ER.

## Clientes y ventas

Las rutas `/customers` y `/sales` requieren JWT con rol `ADMIN` durante esta
etapa. Los clientes admiten los tipos de documento `CC`, `CE`, `TI`, `PASAPORTE`,
`NIT` y `OTRO`; la contraseña es opcional para clientes presenciales. Las ventas
se crean en `PENDIENTE_PAGO`, usan el precio vigente del producto como snapshot
en cada detalle y calculan subtotal y total en el servidor. El descuento es un
monto fijo que no puede superar el subtotal. Las existencias se validan y
descuentan transaccionalmente cuando los pagos aprobados cubren el total.

## Pagos y comprobantes

Las rutas `/payments` requieren JWT de `ADMIN`. La migración crea `EFECTIVO` y
`TRANSFERENCIA` como métodos iniciales. Los pagos parciales están permitidos;
efectivo se aprueba al registrarlo y transferencia necesita comprobante antes de
pasar a revisión. Solo un administrador aprueba/rechaza transferencias; el
rechazo requiere motivo y conserva el archivo. El inventario se descuenta al
alcanzar el total de la venta con pagos aprobados, en la misma transacción.

Configura localmente, sin subir los valores al repositorio:
`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_UPLOAD_PRESET`,
`CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET`. El preset debe ser unsigned y
estar configurado para la carpeta `lujem`. Los comprobantes se guardan como
recursos públicos; cualquier persona con la URL puede acceder a ellos y los
enlaces no expiran. El endpoint
`GET /payments/:id/receipts/:receiptId/url` devuelve la URL pública y
`expiresInSeconds: null`. Se aceptan JPEG, PNG, WEBP y PDF de hasta 5 MB; el
servidor valida también la firma binaria del archivo y guarda su hash SHA-256.
Los archivos se conservan al rechazar un pago para mantener el historial.

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Observability

In production applications, observability is essential for understanding how your system behaves, detecting issues early, and maintaining reliable performance.

[NestJS Observe](https://observe.nestjs.com) automatically instruments your NestJS application, giving you deep visibility into your system with minimal setup:

- **Distributed tracing:** Follow requests across services and understand how they flow through your system.
- **Waterfall analysis:** Visualize request execution and identify slow operations, bottlenecks, and unexpected delays.
- **Performance analysis:** Analyze application performance in real time and quickly pinpoint areas that need optimization.
- **Metrics:** Track key application and infrastructure metrics to understand system health and performance trends.
- **Logging:** Centralize and correlate logs with traces and other telemetry to make debugging easier.
- **Error tracking:** Detect errors quickly and investigate their root causes with the surrounding context.
- **SLA monitoring:** Track service-level objectives and identify when your application is approaching or exceeding defined thresholds.
- **Alarms and alerts:** Set up alerts for critical errors, performance degradation, SLA violations, and other anomalies so your team can react quickly.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Auto-instrument your application with [NestJS Observer](https://observer.nestjs.com). Distributed tracing, metrics, and logging made easy. Error tracking and performance monitoring for your NestJS applications.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
