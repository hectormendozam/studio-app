# Pixel Shot - Studio Shop

Pixel Shot es una aplicacion movil hibrida y web movil para la venta de productos y servicios de un estudio fotografico. El proyecto esta construido con Apache Cordova, JavaScript modular, Tailwind CSS y Firebase. La misma base de codigo se utiliza para generar una version web desplegable en Firebase Hosting y una version Android que puede ejecutarse en emulador o instalarse mediante APK.

El objetivo principal de la aplicacion es permitir que un cliente consulte un catalogo de productos fotograficos, agregue productos al carrito, registre pedidos y mantenga una cuenta dentro de la app. Tambien incluye una vista administrativa protegida por rol, desde la cual un usuario administrador puede crear, consultar, actualizar y eliminar productos del inventario almacenado en Firestore.

## Descripcion general

La aplicacion fue desarrollada para el tema "Venta de productos de un Estudio Fotografico". Su diseno esta pensado para verse como una aplicacion movil, con navegacion inferior, pantallas separadas, formularios validados, catalogo dinamico, carrito de compra, registro de pedidos y conexion con una base de datos en la nube.

Pixel Shot maneja dos tipos de usuarios:

- Cliente: puede iniciar sesion, registrarse, ver el catalogo, buscar productos, consultar informacion del negocio, agregar productos al carrito y registrar pedidos.
- Administrador: puede hacer todo lo anterior y, adicionalmente, ver la pestana de inventario para administrar los productos del catalogo.

La interfaz utiliza una paleta visual en tonos cafe y crema para mantener una identidad coherente con el concepto de estudio fotografico. Tambien se incorporan animaciones suaves, transiciones entre pantallas, carrusel de imagenes, menu de hamburguesa, iconos y componentes adaptados a pantallas moviles.

## Tecnologias usadas

### Apache Cordova

Cordova permite empaquetar la aplicacion web como una aplicacion Android. El codigo principal vive en la carpeta `www`, y Cordova lo utiliza para generar la version ejecutable en Android.

Se eligio Cordova porque permite cumplir con el enfoque de aplicacion movil hibrida usando tecnologias web conocidas: HTML, CSS y JavaScript.

### Firebase

Firebase se utiliza como backend principal:

- Firebase Authentication: registro e inicio de sesion de clientes y administradores.
- Cloud Firestore: almacenamiento de productos, clientes y pedidos.
- Firebase Hosting: despliegue de la version web movil.

La aplicacion usa el SDK modular de Firebase desde CDN, lo cual permite importar solamente las funciones necesarias.

### Firestore

Firestore funciona como base de datos NoSQL en tiempo real. El catalogo se escucha mediante `onSnapshot`, por lo que los cambios realizados desde inventario pueden reflejarse en la aplicacion sin recargar manualmente toda la pagina.

Tambien se usa una transaccion para registrar pedidos y descontar stock de forma consistente. Esto evita que el stock quede incorrecto cuando se crea un pedido.

### JavaScript modular

El proyecto esta separado en modulos:

- `firebase-init.js`: inicializa Firebase.
- `database.js`: concentra operaciones de Firestore.
- `auth.js`: concentra operaciones de autenticacion.
- `app.js`: controla estado, eventos, navegacion y renderizado de interfaz.

Esta separacion permite que la app sea mas facil de mantener y evita mezclar toda la logica en un solo archivo.

### Tailwind CSS

Tailwind CSS se usa para estilos rapidos y consistentes mediante clases utilitarias. Ademas, el archivo `index.html` contiene estilos personalizados para adaptar mejor la experiencia movil, las animaciones, el login, el catalogo y la navegacion.

### Font Awesome

Font Awesome se usa para iconos de navegacion, botones, menu, carrito, cuenta, inventario y formularios.

## Estructura del proyecto

```text
studio-app/
  config.xml
  firebase.json
  package.json
  package-lock.json
  README.md
  .gitignore
  www/
    index.html
    app.js
    firebase-init.js
    database.js
    auth.js
  platforms/
    android/
    browser/
```

### Archivos principales

`config.xml`

Archivo de configuracion de Cordova. Define el nombre de la aplicacion, identificador, descripcion y permisos de navegacion necesarios para conectarse con Firebase, Google APIs, Tailwind, Font Awesome e imagenes externas.

`firebase.json`

Configuracion de Firebase Hosting. Actualmente la carpeta publica configurada es `www`, por lo que el despliegue web toma directamente los archivos principales de la aplicacion.

`package.json`

Define las plataformas Cordova utilizadas por el proyecto:

- `cordova-android`
- `cordova-browser`

`www/index.html`

Contiene la estructura visual de la aplicacion, las pantallas, formularios, barra de navegacion inferior, menu, catalogo, carrito, pedido, informacion, cuenta e inventario.

`www/app.js`

Es el controlador principal de la aplicacion. Administra el estado general, la navegacion entre pantallas, los eventos de botones y formularios, la renderizacion del catalogo, el carrito, el pedido, el inventario y la sesion activa.

`www/database.js`

Contiene las funciones para interactuar con Firestore:

- Crear producto.
- Consultar productos en tiempo real.
- Consultar productos una vez.
- Actualizar producto.
- Eliminar producto.
- Guardar perfil de cliente.
- Obtener perfil de cliente.
- Crear pedido y descontar stock mediante transaccion.

`www/auth.js`

Contiene las funciones relacionadas con Firebase Auth:

- Registrar usuario.
- Iniciar sesion.
- Cerrar sesion.
- Escuchar cambios de autenticacion.

`www/firebase-init.js`

Inicializa la aplicacion Firebase con la configuracion del proyecto.

## Pantallas de la aplicacion

La aplicacion cuenta con mas de cinco pantallas o secciones funcionales:

1. Inicio de sesion y registro.
2. Catalogo de productos.
3. Detalle de producto.
4. Carrito.
5. Confirmacion de pedido.
6. Informacion del negocio.
7. Cuenta.
8. Inventario administrativo.

## Funcionalidades principales

### Inicio de sesion y registro

La primera pantalla solicita que el usuario inicie sesion o cree una cuenta. Esto permite que la aplicacion identifique si el usuario es cliente o administrador.

El formulario de inicio de sesion valida:

- Correo electronico requerido.
- Formato correcto de correo electronico.
- Contrasena requerida.
- Longitud minima de contrasena.

El formulario de registro valida:

- Nombre completo.
- Correo electronico.
- Telefono de 10 digitos.
- Contrasena minima de 6 caracteres.

Cuando se registra un cliente, se crea el usuario en Firebase Authentication y tambien se guarda su perfil en Firestore dentro de la coleccion `clientes`.

### Catalogo

El catalogo muestra los productos obtenidos desde Firestore. No depende de productos hardcodeados para el funcionamiento principal.

Incluye:

- Imagen del producto.
- Nombre.
- Precio.
- Stock disponible.
- Categoria.
- Busqueda en tiempo real por nombre, categoria o descripcion.
- Boton de actualizar.
- Mensajes cuando no hay productos o no hay coincidencias.

### Detalle de producto

Permite revisar la informacion completa de un producto y seleccionar cantidad antes de agregarlo al carrito. La cantidad se limita segun el stock disponible.

### Carrito

El carrito permite:

- Ver productos agregados.
- Aumentar o disminuir cantidades.
- Eliminar productos.
- Revisar subtotal.
- Continuar al formulario de pedido.

### Pedido

El formulario de pedido guarda una orden en Firestore y descuenta el stock real del producto mediante una transaccion. Esto significa que cada pedido afecta el inventario almacenado en la base de datos.

### Informacion del negocio

La seccion de informacion contiene datos generales del estudio fotografico y un carrusel de imagenes del estudio. Esta pantalla ayuda a cumplir con elementos visuales no relacionados con formularios.

### Cuenta

La pantalla de cuenta muestra la sesion activa, el correo del usuario y la opcion para cerrar sesion.

### Inventario administrativo

La pestana de inventario solo aparece si el usuario autenticado tiene rol de administrador. Desde esta pantalla se pueden administrar los productos del catalogo.

El administrador puede:

- Insertar productos.
- Consultar productos actuales.
- Editar productos.
- Eliminar productos.

## Estructura de Firestore

La aplicacion usa tres colecciones principales.

### Coleccion `productos`

Cada documento representa un producto o servicio del estudio fotografico.

Ejemplo:

```js
{
  nombre: "Sesion Fotografica",
  precio: 450,
  categoria: "Servicios",
  descripcion: "Sesion fotografica en exterior.",
  imagenUrl: "https://...",
  stock: 5,
  variantes: ["Basica", "Premium"],
  creadoEn: serverTimestamp(),
  actualizadoEn: serverTimestamp()
}
```

Campos principales:

- `nombre`: texto con el nombre del producto.
- `precio`: numero con el precio.
- `categoria`: texto con la categoria.
- `descripcion`: texto descriptivo.
- `imagenUrl`: URL HTTPS de la imagen.
- `stock`: numero entero con unidades disponibles.
- `variantes`: arreglo opcional de variantes.
- `creadoEn`: fecha de creacion.
- `actualizadoEn`: fecha de ultima actualizacion.

### Coleccion `clientes`

Cada documento tiene como ID el UID generado por Firebase Authentication.

Ejemplo de cliente:

```js
{
  nombre: "Cliente Demo",
  email: "cliente@correo.com",
  telefono: "2221234567",
  tipo: "cliente",
  creadoEn: serverTimestamp(),
  actualizadoEn: serverTimestamp()
}
```

Ejemplo de administrador:

```js
{
  nombre: "Administrador Pixel Shot",
  email: "admin@pixelshot.com",
  telefono: "0000000000",
  tipo: "admin",
  creadoEn: serverTimestamp(),
  actualizadoEn: serverTimestamp()
}
```

El campo `tipo` determina el rol del usuario:

- `cliente`: usuario normal.
- `admin`: usuario con acceso a inventario.

### Coleccion `pedidos`

Cada documento representa una compra o pedido realizado.

Ejemplo:

```js
{
  clienteId: "uid-del-cliente",
  cliente: {
    nombre: "Cliente Demo",
    email: "cliente@correo.com",
    telefono: "2221234567"
  },
  direccion: "Direccion de entrega",
  metodoPago: "Efectivo",
  notas: "Notas del cliente",
  items: [
    {
      productoId: "id-producto",
      nombre: "Sesion Fotografica",
      precio: 450,
      cantidad: 1,
      variante: "Basica",
      subtotal: 450
    }
  ],
  total: 450,
  estado: "pendiente",
  creadoEn: serverTimestamp()
}
```

Cuando se crea un pedido, la aplicacion descuenta automaticamente del campo `stock` de cada producto incluido.

## Configuracion necesaria en Firebase

### 1. Crear proyecto Firebase

Desde Firebase Console se debe crear o seleccionar el proyecto usado por la aplicacion.

### 2. Registrar una app web

En la configuracion del proyecto se debe registrar una app web y copiar los datos de configuracion en:

```text
www/firebase-init.js
```

### 3. Activar Authentication

En Firebase Console:

1. Entrar a Authentication.
2. Abrir la pestana Sign-in method.
3. Activar Email/Password.

### 4. Crear Cloud Firestore

En Firebase Console:

1. Entrar a Firestore Database.
2. Crear base de datos.
3. Seleccionar una ubicacion.
4. Configurar reglas de seguridad.

### 5. Crear usuario administrador

Para que aparezca la pestana de inventario, se necesita un usuario con rol de administrador:

1. Crear un usuario en Firebase Authentication.
2. Copiar su UID.
3. Crear un documento en Firestore en `clientes/{UID}`.
4. Agregar el campo `tipo: "admin"`.

Ejemplo:

```js
{
  nombre: "Administrador Pixel Shot",
  email: "admin@pixelshot.com",
  telefono: "0000000000",
  tipo: "admin"
}
```

### 6. Reglas recomendadas de Firestore

La interfaz oculta el inventario a usuarios que no son administradores, pero la seguridad real debe reforzarse con reglas de Firestore.

Ejemplo base:

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }

    function isAdmin() {
      return signedIn()
        && get(/databases/$(database)/documents/clientes/$(request.auth.uid)).data.tipo == "admin";
    }

    match /productos/{productoId} {
      allow read: if signedIn();
      allow create, update, delete: if isAdmin();
    }

    match /clientes/{clienteId} {
      allow read, update: if signedIn() && request.auth.uid == clienteId;
      allow create: if signedIn() && request.auth.uid == clienteId;
      allow read, write: if isAdmin();
    }

    match /pedidos/{pedidoId} {
      allow create: if signedIn();
      allow read: if isAdmin();
      allow update, delete: if isAdmin();
    }
  }
}
```

Estas reglas pueden ajustarse segun los requisitos del curso o del proyecto.

## Instalacion del proyecto

### Requisitos

Se necesita:

- Node.js.
- npm.
- Apache Cordova.
- Android Studio.
- Android SDK.
- Un emulador Android creado.
- JDK configurado.
- Firebase CLI si se desea desplegar a Hosting.

### Instalar dependencias

Desde PowerShell, dentro de la carpeta del proyecto:

```powershell
cd "D:\Verano 2026\studio-app"
npm install
```

Si Cordova no esta instalado globalmente:

```powershell
npm install -g cordova
```

Tambien se puede usar:

```powershell
npx cordova --version
```

## Ejecutar en navegador con Cordova Browser

```powershell
cordova platform add browser
cordova run browser
```

Si la plataforma ya existe, solo se necesita:

```powershell
cordova run browser
```

## Ejecutar en emulador Android

Primero revisar requisitos:

```powershell
cordova requirements android
```

Despues ejecutar:

```powershell
cordova run android --emulator
```

Si se hacen cambios en `www`, Cordova los copia a la plataforma Android cuando se vuelve a ejecutar `cordova run android` o `cordova build android`.

## Generar APK

Para generar un APK de prueba:

```powershell
cordova build android
```

El APK debug se genera normalmente en:

```text
platforms/android/app/build/outputs/apk/debug/app-debug.apk
```

Para abrir la carpeta desde PowerShell:

```powershell
explorer "D:\Verano 2026\studio-app\platforms\android\app\build\outputs\apk\debug"
```

El archivo `app-debug.apk` se puede enviar para pruebas. Para publicacion formal se recomienda generar una version firmada.

## Desplegar en Firebase Hosting

La configuracion actual usa `www` como carpeta publica:

```json
{
  "hosting": {
    "public": "www"
  }
}
```

Para iniciar sesion:

```powershell
firebase login
```

Para inicializar Hosting si no se ha hecho:

```powershell
firebase init hosting
```

Opciones recomendadas:

- Use an existing project.
- Public directory: `www`.
- Configure as single-page app: `N`, porque la navegacion principal se maneja dentro del mismo `index.html` sin rutas externas.
- Set up GitHub deploys: `N`, si no se necesita.
- Overwrite index.html: `N`.

Para desplegar:

```powershell
firebase deploy --only hosting
```

## Como reflejar cambios en web y Android

### Version web

Editar archivos en `www` y ejecutar:

```powershell
firebase deploy --only hosting
```

Despues recargar la pagina. Si el navegador conserva una version anterior, se recomienda hacer una recarga forzada o abrir en modo incognito.

### Version Android en emulador

Editar archivos en `www` y ejecutar:

```powershell
cordova run android --emulator
```

Si solo se construye el APK:

```powershell
cordova build android
```

Luego instalar el APK generado en el emulador o dispositivo.

## Validaciones de formularios

La aplicacion incluye validaciones tanto por atributos HTML como por JavaScript.

Ejemplos:

- Email: se valida formato de correo.
- Telefono: se limita a 10 digitos.
- Password: minimo 6 caracteres.
- Stock: entero positivo.
- Precio: numero valido mayor a 0.
- URL de imagen: URL HTTPS valida.
- Cantidades de carrito: enteros y no mayores al stock.
- Pedido: requiere datos completos del cliente y direccion.

Estas validaciones mejoran la experiencia del usuario y reducen errores antes de enviar datos a Firebase.

## Manejo de inventario

La administracion del inventario se encuentra en una pantalla exclusiva para usuarios administradores. Esta pantalla no aparece para clientes normales.

El CRUD de productos se realiza contra Firestore:

- Insertar: crea un documento en `productos`.
- Consultar: lee productos desde Firestore en tiempo real.
- Actualizar: modifica el documento del producto.
- Eliminar: borra el documento del producto.

Cuando un cliente crea un pedido, la aplicacion usa una transaccion para descontar el stock de los productos comprados. Esto mantiene sincronizado el inventario real.

## Arquitectura del proyecto

La arquitectura del proyecto es sencilla y adecuada para una aplicacion movil hibrida pequena o mediana.

### Capa de presentacion

Esta capa se encuentra en `www/index.html`. Contiene las pantallas y componentes visuales:

- Login y registro.
- Catalogo.
- Detalle.
- Carrito.
- Pedido.
- Informacion.
- Cuenta.
- Inventario.

### Capa de control de interfaz

Esta capa se encuentra en `www/app.js`. Maneja:

- Estado de la aplicacion.
- Navegacion.
- Eventos.
- Renderizado dinamico.
- Validaciones.
- Carrito.
- Sesion.
- Roles.
- Comunicacion con modulos de datos.

### Capa de autenticacion

Esta capa se encuentra en `www/auth.js`. Encapsula Firebase Authentication para evitar que la logica de login y registro quede mezclada con la interfaz.

### Capa de datos

Esta capa se encuentra en `www/database.js`. Encapsula Firestore y concentra las operaciones de base de datos.

### Capa de configuracion

Esta capa esta formada por:

- `www/firebase-init.js`
- `config.xml`
- `firebase.json`
- `package.json`

Estas configuraciones permiten conectar Firebase, compilar con Cordova y desplegar la version web.

## Decisiones arquitectonicas

### Separar Firebase en modulos

Se separo la inicializacion, autenticacion y base de datos para mantener responsabilidades claras. Esto facilita encontrar errores y modificar una parte sin afectar toda la aplicacion.

### Usar Firestore en tiempo real

El catalogo utiliza escucha en tiempo real para que los cambios en inventario se reflejen rapidamente. Esto es util para una tienda, ya que stock, precios o productos pueden cambiar.

### Usar transacciones para pedidos

El descuento de stock se realiza con una transaccion. Esta decision evita que se cree un pedido sin actualizar inventario o que se venda mas stock del disponible.

### Controlar roles desde Firestore

El rol del usuario se guarda en el documento de cliente. Esto permite que la aplicacion decida si debe mostrar la pestana de inventario. Para seguridad completa, esta decision debe complementarse con reglas de Firestore.

### Mantener una sola base de codigo

La carpeta `www` funciona como fuente principal para web y Android. Esto evita duplicar logica y permite que los cambios se reflejen en ambas versiones al compilar o desplegar.

## Cumplimiento de la rubrica

### 1. Minimo 5 actividades o pantallas

La aplicacion cumple este punto porque incluye mas de cinco pantallas funcionales:

- Login y registro.
- Catalogo.
- Detalle de producto.
- Carrito.
- Pedido.
- Informacion del negocio.
- Cuenta.
- Inventario administrativo.

Cada pantalla tiene una funcion distinta dentro del flujo de compra y administracion.

### 2. Uso de estilos

La aplicacion cumple este punto mediante:

- Tailwind CSS.
- Clases personalizadas en `index.html`.
- Paleta visual cafe y crema.
- Componentes con sombras, bordes, espaciados y jerarquia visual.
- Diseno adaptado a pantallas moviles.
- Transiciones y animaciones suaves.

### 3. Uso de minimo 5 elementos no formulario

La aplicacion incluye varios elementos no formulario:

- Tarjetas de productos.
- Carrusel de fotos del estudio.
- Barra de navegacion inferior.
- Menu de hamburguesa.
- Contador del carrito.
- Imagenes de productos.
- Toasts de notificacion.
- Botones con iconos.
- Indicadores de stock y precio.

### 4. Uso de controles de formulario

La aplicacion cumple este punto con distintos controles:

- Inputs de texto.
- Inputs de email.
- Inputs de password.
- Inputs numericos.
- Inputs de telefono.
- Textarea.
- Select.
- Botones submit.
- Controles de cantidad.

Ademas, los formularios tienen validaciones para evitar datos incorrectos.

### 5. Uso de base de datos

La aplicacion cumple este punto usando Cloud Firestore. Las colecciones principales son:

- `productos`
- `clientes`
- `pedidos`

La aplicacion lee y escribe datos reales desde Firebase.

### 6. Implementacion CRUD en la base de datos

La aplicacion cumple el CRUD principalmente en la coleccion `productos`:

- Insertar: el administrador agrega productos.
- Consultar: el catalogo y el inventario leen productos.
- Actualizar: el administrador edita productos.
- Eliminar: el administrador elimina productos.

Tambien se insertan pedidos en `pedidos` y se registran clientes en `clientes`.

### 7. Version web movil

La aplicacion cumple este punto porque puede desplegarse en Firebase Hosting desde la carpeta `www`. La interfaz esta disenada para visualizarse correctamente como web movil y tambien puede ejecutarse como app Android mediante Cordova.

## Seguridad y consideraciones importantes

El control visual de roles en la aplicacion ayuda a que un cliente no vea el inventario. Sin embargo, para una aplicacion real, la seguridad debe depender tambien de reglas de Firestore.

No se recomienda dejar reglas de Firestore abiertas en produccion. Las reglas deben validar que:

- Solo usuarios autenticados lean productos.
- Solo administradores creen, editen o eliminen productos.
- Los clientes solo puedan crear sus pedidos.
- Los administradores puedan consultar pedidos.

## Problemas comunes

### Cordova no reconoce Android SDK

Ejecutar:

```powershell
cordova requirements android
```

Revisar variables como:

- `JAVA_HOME`
- `ANDROID_HOME`
- `ANDROID_SDK_ROOT`

### No se actualiza Firebase Hosting

Verificar que `firebase.json` tenga:

```json
"public": "www"
```

Luego ejecutar:

```powershell
firebase deploy --only hosting
```

Si sigue apareciendo una version anterior, borrar cache del navegador o abrir en modo incognito.

### No aparece la pestana de inventario

Verificar que el usuario:

1. Exista en Firebase Authentication.
2. Tenga documento en `clientes`.
3. Tenga `tipo: "admin"`.
4. Haya iniciado sesion con ese correo.

### El catalogo aparece vacio

Verificar:

- Que Firestore tenga documentos en `productos`.
- Que las reglas permitan lectura al usuario autenticado.
- Que `firebase-init.js` tenga la configuracion correcta.

## Comandos utiles

Instalar dependencias:

```powershell
npm install
```

Verificar Cordova:

```powershell
cordova --version
```

Verificar Android:

```powershell
cordova requirements android
```

Ejecutar en navegador:

```powershell
cordova run browser
```

Ejecutar en emulador:

```powershell
cordova run android --emulator
```

Generar APK:

```powershell
cordova build android
```

Desplegar web:

```powershell
firebase deploy --only hosting
```

## Estado actual del proyecto

El proyecto cuenta con:

- Catalogo conectado a Firestore.
- Busqueda en catalogo.
- Registro e inicio de sesion con Firebase Auth.
- Manejo de clientes.
- Roles de cliente y administrador.
- Inventario protegido para administrador.
- CRUD de productos.
- Carrito.
- Registro de pedidos.
- Descuento de stock en Firestore al crear pedidos.
- Informacion del negocio con carrusel.
- Version web desplegable.
- Version Android compilable con Cordova.

## Nombre del proyecto

Pixel Shot - Studio Shop

## Autor

Proyecto academico de aplicacion movil hibrida para venta de productos y servicios de un estudio fotografico.
