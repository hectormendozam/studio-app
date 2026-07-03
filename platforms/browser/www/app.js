import {
  createOrderAndUpdateStock,
  createProduct,
  deleteProduct,
  getClientProfile,
  getProductsOnce,
  getServerTimestamp,
  isDatabaseReady,
  saveClientProfile,
  subscribeToProducts,
  updateProduct
} from './database.js';
import {
  isAuthReady,
  loginClient,
  logoutClient,
  registerClient,
  subscribeToClientAuth
} from './auth.js';

let productos = [];
let carrito = [];
let productoSeleccionado = null;
let unsubscribeProductos = null;
let unsubscribeCliente = null;
let firebaseDisponible = false;
let adminDesbloqueado = false;
let clienteActual = null;
let clientePerfil = null;
let carouselIndex = 0;
let cargandoProductos = true;
let ultimoTotalArticulos = 0;
let modoCuenta = 'login';
let busquedaCatalogo = '';

const fotosEstudio = [
  {
    titulo: 'Set principal',
    descripcion: 'Area de retrato con iluminacion continua y fondos editoriales.',
    imagenUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=80'
  },
  {
    titulo: 'Zona de producto',
    descripcion: 'Mesa de producto, fondos neutros y luz suave para catalogos.',
    imagenUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80'
  },
  {
    titulo: 'Estacion de edicion',
    descripcion: 'Flujo digital para seleccion, color y entrega de archivos finales.',
    imagenUrl: 'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?auto=format&fit=crop&w=900&q=80'
  }
];

const formatoMoneda = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN'
});

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const pantallas = [
  'pantalla-login',
  'pantalla-catalogo',
  'pantalla-detalle',
  'pantalla-carrito',
  'pantalla-pedido',
  'pantalla-info',
  'pantalla-registro',
  'pantalla-admin'
];

const elementos = {};
let pantallaActual = 'pantalla-login';

function iniciarApp() {
  configurarEntornoVisual();
  guardarReferenciasDom();
  configurarEventos();
  iniciarFirebase();
  escucharProductosEnTiempoReal();
  navegarA('pantalla-login');
  actualizarCarritoUI();
}

function configurarEntornoVisual() {
  const esCordova = Boolean(window.cordova);
  document.documentElement.classList.toggle('cordova-webview', esCordova);
  document.body.classList.toggle('cordova-webview', esCordova);
}

function guardarReferenciasDom() {
  elementos.productosGrid = $('#productos-grid');
  elementos.catalogoEstado = $('#catalogo-estado');
  elementos.catalogoLoading = $('#catalogo-loading');
  elementos.catalogoBusqueda = $('#catalogo-busqueda');
  elementos.btnLimpiarBusqueda = $('#btn-limpiar-busqueda');
  elementos.detalleImagen = $('#detalle-imagen');
  elementos.detalleCategoria = $('#detalle-categoria');
  elementos.detalleTitulo = $('#detalle-titulo');
  elementos.detalleDescripcion = $('#detalle-descripcion');
  elementos.detallePrecio = $('#detalle-precio');
  elementos.detalleStock = $('#detalle-stock');
  elementos.detalleVariante = $('#detalle-variante');
  elementos.detalleCantidad = $('#detalle-cantidad');
  elementos.carritoLista = $('#carrito-lista');
  elementos.carritoVacio = $('#carrito-vacio');
  elementos.carritoTotal = $('#carrito-total');
  elementos.carritoProgreso = $('#carrito-progreso');
  elementos.pedidoTotal = $('#pedido-total');
  elementos.contadorCarrito = $('#contador-carrito');
  elementos.btnProcederPago = $('#btn-proceder-pago');
  elementos.adminLista = $('#admin-lista');
  elementos.adminEstado = $('#admin-estado');
  elementos.carouselImagen = $('#carousel-imagen');
  elementos.carouselTitulo = $('#carousel-titulo');
  elementos.carouselDescripcion = $('#carousel-descripcion');
  elementos.carouselContador = $('#carousel-contador');
  elementos.carouselProgreso = $('#carousel-progreso');
  elementos.clienteSesion = $('#cliente-sesion');
  elementos.clienteSesionEmail = $('#cliente-sesion-email');
  elementos.cuentaAuthPanel = $('#cuenta-auth-panel');
  elementos.formLoginCliente = $('#form-login-cliente');
  elementos.formRegistroCliente = $('#form-registro-cliente');
  elementos.btnModoLogin = $('#btn-modo-login');
  elementos.btnModoRegistro = $('#btn-modo-registro');
  elementos.bottomNav = $('#bottom-nav');
  elementos.navInventario = $('#nav-inventario');
  elementos.appHeader = $('#app-header');
  elementos.toast = $('#toast');
}

function configurarEventos() {
  $('#btn-home-logo').addEventListener('click', () => navegarA('pantalla-catalogo'));
  $('#btn-refrescar-productos').addEventListener('click', cargarProductosUnaVez);
  $('#catalogo-busqueda').addEventListener('input', manejarBusquedaCatalogo);
  $('#btn-limpiar-busqueda').addEventListener('click', limpiarBusquedaCatalogo);
  $('#fab-carrito').addEventListener('click', () => navegarA('pantalla-carrito'));
  $('#btn-volver-detalle').addEventListener('click', () => navegarA('pantalla-catalogo'));
  $('#btn-volver-carrito').addEventListener('click', () => navegarA('pantalla-catalogo'));
  $('#btn-ir-catalogo-vacio').addEventListener('click', () => navegarA('pantalla-catalogo'));
  $('#btn-volver-pedido').addEventListener('click', () => navegarA('pantalla-carrito'));
  $('#btn-volver-admin').addEventListener('click', () => navegarA('pantalla-catalogo'));
  $('#btn-proceder-pago').addEventListener('click', () => navegarA('pantalla-pedido'));
  $('#btn-menu').addEventListener('click', alternarMenu);
  $('#btn-carousel-prev').addEventListener('click', () => moverCarousel(-1));
  $('#btn-carousel-next').addEventListener('click', () => moverCarousel(1));
  $('#btn-cliente-logout').addEventListener('click', manejarCerrarSesionCliente);
  $('#btn-modo-login').addEventListener('click', () => mostrarFormularioCuenta('login'));
  $('#btn-modo-registro').addEventListener('click', () => mostrarFormularioCuenta('registro'));
  $('#form-agregar-carrito').addEventListener('submit', manejarAgregarCarrito);
  $('#form-pedido').addEventListener('submit', manejarConfirmarPedido);
  $('#form-login-cliente').addEventListener('submit', manejarLoginCliente);
  $('#form-registro-cliente').addEventListener('submit', manejarRegistroCliente);
  $('#form-admin-producto').addEventListener('submit', manejarGuardarProductoAdmin);
  $('#btn-limpiar-admin').addEventListener('click', limpiarFormularioAdmin);

  $$('.nav-btn').forEach((boton) => {
    boton.addEventListener('click', () => navegarA(boton.dataset.nav));
  });

  $$('.menu-link').forEach((boton) => {
    boton.addEventListener('click', () => {
      navegarA(boton.dataset.menuNav);
      cerrarMenu();
    });
  });

  renderizarCarousel();
}

function iniciarFirebase() {
  if (!isDatabaseReady()) {
    firebaseDisponible = false;
    cargandoProductos = false;
    productos = [];
    elementos.catalogoEstado.textContent = 'Firebase no esta configurado.';
    mostrarToast('Configura firebase-init.js para conectar Firestore.');
    renderizarCatalogo();
    renderizarAdmin();
    return;
  }

  firebaseDisponible = true;
  iniciarSesionCliente();
}

function iniciarSesionCliente() {
  if (!isAuthReady()) return;

  unsubscribeCliente = subscribeToClientAuth(async (user) => {
    clienteActual = user;
    clientePerfil = null;

    if (user && firebaseDisponible) {
      clientePerfil = await obtenerPerfilCliente(user);
      adminDesbloqueado = esPerfilAdmin(clientePerfil);
      completarPedidoConCliente();
    } else {
      adminDesbloqueado = false;
    }

    actualizarClienteUI();
    actualizarAdminUI();

    if (user) {
      if (pantallaActual === 'pantalla-login') {
        navegarA('pantalla-catalogo');
      }
    } else {
      navegarA('pantalla-login');
    }
  });
}

function escucharProductosEnTiempoReal() {
  if (!firebaseDisponible) {
    productos = [];
    cargandoProductos = false;
    renderizarCatalogo();
    renderizarAdmin();
    return;
  }

  unsubscribeProductos = subscribeToProducts(
    (productosFirestore) => {
      cargandoProductos = false;
      productos = productosFirestore.map((producto) => normalizarProducto(producto.id, producto));

      if (productos.length === 0) {
        elementos.catalogoEstado.textContent = 'No hay productos en Firestore. Puedes crearlos desde Admin.';
      } else {
        elementos.catalogoEstado.textContent = `${productos.length} productos disponibles`;
      }

      renderizarCatalogo();
      renderizarAdmin();
    },
    (error) => {
      console.error('Error al escuchar productos:', error);
      cargandoProductos = false;
      productos = [];
      mostrarToast('No se pudo leer Firestore. Revisa reglas y conexion.');
      renderizarCatalogo();
      renderizarAdmin();
    }
  );
}

async function cargarProductosUnaVez() {
  if (!firebaseDisponible) {
    productos = [];
    cargandoProductos = false;
    renderizarCatalogo();
    mostrarToast('Firebase no esta configurado.');
    return;
  }

  try {
    cargandoProductos = true;
    renderizarCatalogo();
    const productosFirestore = await getProductsOnce();
    cargandoProductos = false;
    productos = productosFirestore.map((producto) => normalizarProducto(producto.id, producto));
    renderizarCatalogo();
    renderizarAdmin();
    mostrarToast('Productos consultados desde Firestore.');
  } catch (error) {
    console.error('Error al consultar productos:', error);
    cargandoProductos = false;
    renderizarCatalogo();
    mostrarToast('No se pudieron consultar los productos.');
  }
}

function normalizarProducto(id, data) {
  return {
    id,
    nombre: data.nombre || 'Producto sin nombre',
    categoria: data.categoria || 'Estudio',
    precio: Number(data.precio || 0),
    stock: Number(data.stock || 0),
    descripcion: data.descripcion || 'Producto fotografico premium del estudio.',
    imagenUrl: data.imagenUrl || data.imagen || crearImagenFallback(data.nombre || 'Producto', data.categoria || 'Estudio'),
    variantes: Array.isArray(data.variantes) && data.variantes.length > 0
      ? data.variantes
      : ['Estandar', 'Premium', 'Coleccion']
  };
}

function manejarBusquedaCatalogo(evento) {
  busquedaCatalogo = normalizarTextoBusqueda(evento.target.value);
  elementos.btnLimpiarBusqueda.classList.toggle('hidden', busquedaCatalogo.length === 0);
  renderizarCatalogo(false);
}

function limpiarBusquedaCatalogo() {
  busquedaCatalogo = '';
  elementos.catalogoBusqueda.value = '';
  elementos.btnLimpiarBusqueda.classList.add('hidden');
  renderizarCatalogo(false);
  elementos.catalogoBusqueda.focus();
}

function renderizarCatalogo(animarTarjetas = true) {
  elementos.catalogoLoading.classList.toggle('hidden', !cargandoProductos);
  elementos.productosGrid.innerHTML = '';

  if (cargandoProductos) {
    elementos.catalogoEstado.textContent = 'Sincronizando catalogo...';
    return;
  }

  if (!productos.length) {
    elementos.catalogoEstado.textContent = 'Sin productos disponibles.';
    elementos.productosGrid.innerHTML = `
      <div class="col-span-2 rounded-lg bg-white p-6 text-center shadow-sm">
        <p class="font-semibold text-cafe">No hay productos para mostrar.</p>
        <p class="mt-1 text-sm text-cafe/70">El catalogo se llenara cuando agregues productos en Firestore.</p>
      </div>
    `;
    return;
  }

  const productosVisibles = filtrarProductosCatalogo();
  const terminoVisible = elementos.catalogoBusqueda.value.trim();

  if (!productosVisibles.length) {
    elementos.catalogoEstado.textContent = `Sin coincidencias para "${terminoVisible}".`;
    elementos.productosGrid.innerHTML = `
      <div class="col-span-2 rounded-lg bg-white p-6 text-center shadow-sm">
        <i class="fa-solid fa-magnifying-glass text-2xl text-tierra"></i>
        <p class="mt-3 font-semibold text-cafe">No encontramos productos.</p>
        <p class="mt-1 text-sm text-cafe/70">Prueba con otro nombre, categoria o descripcion.</p>
      </div>
    `;
    return;
  }

  elementos.catalogoEstado.textContent = busquedaCatalogo
    ? `${productosVisibles.length} coincidencias de ${productos.length} productos`
    : `${productos.length} productos disponibles`;

  productosVisibles.forEach((producto, index) => {
    const tarjeta = document.createElement('article');
    tarjeta.className = `${animarTarjetas ? 'animated-card ' : ''}overflow-hidden rounded-lg bg-white shadow-sm active:scale-[0.99]`;
    if (animarTarjetas) {
      tarjeta.style.animationDelay = `${Math.min(index * 35, 180)}ms`;
    }
    tarjeta.innerHTML = `
      <button class="block w-full text-left" type="button" aria-label="Ver detalle de ${escaparHtml(producto.nombre)}">
        <div class="relative aspect-[4/3] bg-[#eadfcd]">
          <img class="h-full w-full object-cover" src="${escaparAtributo(producto.imagenUrl)}" alt="${escaparAtributo(producto.nombre)}">
          <span class="absolute left-2 top-2 rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase text-tierra">${escaparHtml(producto.categoria)}</span>
        </div>
        <div class="p-3">
          <h2 class="min-h-10 font-display text-lg leading-5 text-cafe">${escaparHtml(producto.nombre)}</h2>
          <p class="mt-2 text-lg font-bold text-cafe">${formatoMoneda.format(producto.precio)}</p>
          <p class="mt-1 text-xs font-semibold ${producto.stock > 0 ? 'text-oliva' : 'text-vino'}">
            ${producto.stock > 0 ? `${producto.stock} disponibles` : 'Sin stock'}
          </p>
        </div>
      </button>
    `;

    const imagen = tarjeta.querySelector('img');
    imagen.addEventListener('error', () => {
      imagen.src = crearImagenFallback(producto.nombre, producto.categoria);
    });

    tarjeta.querySelector('button').addEventListener('click', () => abrirDetalleProducto(producto.id));
    elementos.productosGrid.appendChild(tarjeta);
  });
}

function filtrarProductosCatalogo() {
  if (!busquedaCatalogo) return productos;

  return productos.filter((producto) => {
    const textoBusqueda = normalizarTextoBusqueda([
      producto.nombre,
      producto.categoria,
      producto.descripcion,
      ...(producto.variantes || [])
    ].join(' '));

    return textoBusqueda.includes(busquedaCatalogo);
  });
}

function normalizarTextoBusqueda(valor) {
  return String(valor || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function abrirDetalleProducto(productoId) {
  const producto = productos.find((item) => item.id === productoId);
  if (!producto) {
    mostrarToast('El producto seleccionado ya no esta disponible.');
    return;
  }

  productoSeleccionado = producto;
  elementos.detalleImagen.src = producto.imagenUrl;
  elementos.detalleImagen.alt = producto.nombre;
  elementos.detalleImagen.onerror = () => {
    elementos.detalleImagen.src = crearImagenFallback(producto.nombre, producto.categoria);
  };
  elementos.detalleCategoria.textContent = producto.categoria;
  elementos.detalleTitulo.textContent = producto.nombre;
  elementos.detalleDescripcion.textContent = producto.descripcion;
  elementos.detallePrecio.textContent = formatoMoneda.format(producto.precio);
  elementos.detalleStock.textContent = producto.stock > 0 ? `Stock disponible: ${producto.stock}` : 'Producto agotado';
  elementos.detalleCantidad.value = 1;
  elementos.detalleCantidad.max = Math.max(producto.stock, 1);
  elementos.detalleVariante.innerHTML = producto.variantes
    .map((variante) => `<option value="${escaparAtributo(variante)}">${escaparHtml(variante)}</option>`)
    .join('');

  navegarA('pantalla-detalle');
}

function manejarAgregarCarrito(evento) {
  evento.preventDefault();
  const formulario = evento.currentTarget;

  if (!formulario.checkValidity()) {
    formulario.reportValidity();
    return;
  }

  if (!productoSeleccionado) {
    mostrarToast('Selecciona un producto antes de agregarlo.');
    return;
  }

  if (productoSeleccionado.stock <= 0) {
    mostrarToast('Este producto no tiene stock disponible.');
    return;
  }

  const cantidad = Number(elementos.detalleCantidad.value);
  const variante = elementos.detalleVariante.value;

  if (!esEnteroEnRango(cantidad, 1, productoSeleccionado.stock)) {
    mostrarToast('Ingresa una cantidad valida.');
    return;
  }

  const cantidadActual = carrito
    .filter((item) => item.productoId === productoSeleccionado.id)
    .reduce((total, item) => total + item.cantidad, 0);

  if (cantidadActual + cantidad > productoSeleccionado.stock) {
    mostrarToast('La cantidad supera el stock disponible.');
    return;
  }

  const itemExistente = carrito.find((item) => item.productoId === productoSeleccionado.id && item.variante === variante);

  if (itemExistente) {
    itemExistente.cantidad += cantidad;
  } else {
    carrito.push({
      key: crearIdLocal(productoSeleccionado.id),
      productoId: productoSeleccionado.id,
      nombre: productoSeleccionado.nombre,
      categoria: productoSeleccionado.categoria,
      precio: productoSeleccionado.precio,
      imagenUrl: productoSeleccionado.imagenUrl,
      variante,
      cantidad
    });
  }

  actualizarCarritoUI();
  mostrarToast('Producto agregado al carrito.');
  navegarA('pantalla-carrito');
}

async function manejarLoginCliente(evento) {
  evento.preventDefault();
  const formulario = evento.currentTarget;
  const botonSubmit = formulario.querySelector('button[type="submit"]');

  if (!formulario.checkValidity()) {
    formulario.reportValidity();
    return;
  }

  if (!firebaseDisponible || !isAuthReady()) {
    mostrarToast('Firebase Auth o Firestore no estan disponibles.');
    return;
  }

  const email = $('#login-email').value.trim();
  const password = $('#login-password').value;

  if (!emailValido(email)) {
    mostrarToast('Ingresa un correo valido.');
    return;
  }

  if (!textoEnRango(password, 6, 64)) {
    mostrarToast('La contrasena debe tener minimo 6 caracteres.');
    return;
  }

  try {
    cambiarEstadoEnvio(botonSubmit, true, 'Iniciando...');
    const user = await loginClient(email, password);
    clienteActual = user;
    clientePerfil = await obtenerPerfilCliente(user);
    adminDesbloqueado = esPerfilAdmin(clientePerfil);
    completarPedidoConCliente();
    actualizarClienteUI();
    actualizarAdminUI();
    formulario.reset();
    mostrarToast('Sesion iniciada.');
    navegarA('pantalla-catalogo');
  } catch (error) {
    console.error('Error al iniciar sesion:', error);
    mostrarToast(obtenerMensajeAuth(error, 'No se pudo iniciar sesion.'));
  } finally {
    cambiarEstadoEnvio(botonSubmit, false);
  }
}

async function manejarRegistroCliente(evento) {
  evento.preventDefault();
  const formulario = evento.currentTarget;
  const botonSubmit = formulario.querySelector('button[type="submit"]');

  if (!formulario.checkValidity()) {
    formulario.reportValidity();
    return;
  }

  if (!firebaseDisponible || !isAuthReady()) {
    mostrarToast('Firebase Auth o Firestore no estan disponibles.');
    return;
  }

  const nombre = $('#registro-nombre').value.trim();
  const email = $('#registro-email').value.trim();
  const telefono = $('#registro-telefono').value.trim();
  const password = $('#registro-password').value;

  if (!textoEnRango(nombre, 3, 80)) {
    mostrarToast('Ingresa un nombre valido.');
    return;
  }

  if (!emailValido(email)) {
    mostrarToast('Ingresa un correo valido.');
    return;
  }

  if (!telefonoValido(telefono)) {
    mostrarToast('Ingresa un telefono de 10 digitos.');
    return;
  }

  if (!textoEnRango(password, 6, 64)) {
    mostrarToast('La contrasena debe tener minimo 6 caracteres.');
    return;
  }

  try {
    cambiarEstadoEnvio(botonSubmit, true, 'Creando cuenta...');
    const user = await registerClient(email, password);

    await saveClientProfile(user.uid, {
      nombre,
      email,
      telefono,
      tipo: 'cliente',
      creadoEn: getServerTimestamp()
    });

    clientePerfil = { id: user.uid, nombre, email, telefono, tipo: 'cliente' };
    adminDesbloqueado = false;
    completarPedidoConCliente();
    actualizarClienteUI();
    actualizarAdminUI();
    formulario.reset();
    mostrarToast('Cliente registrado correctamente.');
    navegarA('pantalla-catalogo');
  } catch (error) {
    console.error('Error al registrar cliente:', error);
    if (error.code === 'auth/email-already-in-use') {
      mostrarFormularioCuenta('login');
      $('#login-email').value = email;
      mostrarToast('Esta cuenta ya existe. Inicia sesion.');
    } else {
      mostrarToast(obtenerMensajeAuth(error, 'No se pudo registrar el cliente.'));
    }
  } finally {
    cambiarEstadoEnvio(botonSubmit, false);
  }
}

async function manejarCerrarSesionCliente() {
  try {
    await logoutClient();
    clienteActual = null;
    clientePerfil = null;
    adminDesbloqueado = false;
    actualizarClienteUI();
    actualizarAdminUI();
    mostrarToast('Sesion de cliente cerrada.');
    navegarA('pantalla-login');
  } catch (error) {
    console.error('Error al cerrar sesion:', error);
    mostrarToast('No se pudo cerrar la sesion.');
  }
}

function actualizarClienteUI() {
  const hayCliente = Boolean(clienteActual);
  elementos.clienteSesion.classList.toggle('hidden', !hayCliente);
  elementos.cuentaAuthPanel.classList.toggle('hidden', hayCliente);
  elementos.clienteSesionEmail.textContent = clientePerfil?.email || clienteActual?.email || '';

  if (!hayCliente) {
    mostrarFormularioCuenta(modoCuenta);
  }
}

function actualizarAdminUI() {
  const puedeAdministrar = puedeEditarInventario();
  elementos.navInventario.classList.toggle('hidden', !puedeAdministrar);
  elementos.bottomNav.classList.toggle('grid-cols-5', puedeAdministrar);
  elementos.bottomNav.classList.toggle('grid-cols-4', !puedeAdministrar);
  elementos.bottomNav.style.gridTemplateColumns = puedeAdministrar
    ? 'repeat(5, minmax(0, 1fr))'
    : 'repeat(4, minmax(0, 1fr))';

  if (!puedeAdministrar && !$('#pantalla-admin').classList.contains('hidden')) {
    navegarA('pantalla-catalogo');
  }
}

async function obtenerPerfilCliente(user) {
  try {
    const perfil = await getClientProfile(user.uid);
    return perfil || {
      id: user.uid,
      email: user.email || ''
    };
  } catch (error) {
    console.error('Error al consultar perfil de cliente:', error);
    return {
      id: user.uid,
      email: user.email || ''
    };
  }
}

function esPerfilAdmin(perfil) {
  const tipo = String(perfil?.tipo || perfil?.rol || perfil?.role || '').trim().toLowerCase();
  return tipo === 'admin' || tipo === 'administrador';
}

function mostrarFormularioCuenta(modo) {
  modoCuenta = modo === 'registro' ? 'registro' : 'login';
  const mostrarLogin = modoCuenta === 'login';

  elementos.formLoginCliente.classList.toggle('hidden', !mostrarLogin);
  elementos.formRegistroCliente.classList.toggle('hidden', mostrarLogin);
  actualizarBotonModoCuenta(elementos.btnModoLogin, mostrarLogin);
  actualizarBotonModoCuenta(elementos.btnModoRegistro, !mostrarLogin);
}

function actualizarBotonModoCuenta(boton, activo) {
  boton.classList.toggle('bg-crema', activo);
  boton.classList.toggle('text-cafe', activo);
  boton.classList.toggle('shadow-sm', activo);
  boton.classList.toggle('text-crema', !activo);
}

function obtenerMensajeAuth(error, mensajePorDefecto) {
  const mensajes = {
    'auth/invalid-credential': 'Correo o contrasena incorrectos.',
    'auth/user-not-found': 'No existe una cuenta con ese correo.',
    'auth/wrong-password': 'Contrasena incorrecta.',
    'auth/email-already-in-use': 'Esta cuenta ya existe.',
    'auth/weak-password': 'La contrasena debe tener minimo 6 caracteres.'
  };

  return mensajes[error.code] || mensajePorDefecto;
}

function completarPedidoConCliente() {
  if (!clientePerfil) return;
  $('#cliente-nombre').value = clientePerfil.nombre || '';
  $('#cliente-email').value = clientePerfil.email || '';
}

function actualizarCarritoUI() {
  const totalArticulos = carrito.reduce((total, item) => total + item.cantidad, 0);
  const total = calcularTotalCarrito();

  elementos.contadorCarrito.textContent = totalArticulos;
  elementos.carritoTotal.textContent = formatoMoneda.format(total);
  elementos.pedidoTotal.textContent = formatoMoneda.format(total);
  elementos.btnProcederPago.disabled = carrito.length === 0;
  elementos.carritoProgreso.style.width = carrito.length === 0 ? '0%' : '66%';

  if (totalArticulos !== ultimoTotalArticulos) {
    animarCarrito();
    ultimoTotalArticulos = totalArticulos;
  }

  renderizarCarrito();
}

function renderizarCarrito() {
  elementos.carritoLista.innerHTML = '';
  elementos.carritoVacio.classList.toggle('hidden', carrito.length > 0);

  carrito.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = 'animated-card rounded-lg bg-white p-3 shadow-sm';
    li.style.animationDelay = `${Math.min(index * 35, 160)}ms`;
    li.innerHTML = `
      <div class="flex gap-3">
        <img class="h-20 w-20 rounded-lg object-cover" src="${escaparAtributo(item.imagenUrl)}" alt="${escaparAtributo(item.nombre)}">
        <div class="min-w-0 flex-1">
          <h3 class="font-display text-lg leading-5 text-cafe">${escaparHtml(item.nombre)}</h3>
          <p class="mt-1 truncate text-xs font-semibold uppercase text-tierra">${escaparHtml(item.variante)}</p>
          <p class="mt-2 text-sm font-bold text-cafe">${formatoMoneda.format(item.precio * item.cantidad)}</p>
        </div>
      </div>
      <div class="mt-3 flex items-center justify-between gap-3">
        <div class="flex items-center rounded-full border border-[#dfd1bd] bg-crema">
          <button class="btn-decrementar grid h-9 w-9 place-items-center text-cafe" type="button" aria-label="Disminuir cantidad">
            <i class="fa-solid fa-minus"></i>
          </button>
          <span class="min-w-8 text-center text-sm font-bold text-cafe">${item.cantidad}</span>
          <button class="btn-incrementar grid h-9 w-9 place-items-center text-cafe" type="button" aria-label="Incrementar cantidad">
            <i class="fa-solid fa-plus"></i>
          </button>
        </div>
        <button class="btn-eliminar grid h-9 w-9 place-items-center rounded-full bg-[#F6EDEA] text-vino" type="button" aria-label="Eliminar producto">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `;

    const imagen = li.querySelector('img');
    imagen.addEventListener('error', () => {
      imagen.src = crearImagenFallback(item.nombre, item.categoria);
    });

    li.querySelector('.btn-decrementar').addEventListener('click', () => cambiarCantidadCarrito(item.key, -1));
    li.querySelector('.btn-incrementar').addEventListener('click', () => cambiarCantidadCarrito(item.key, 1));
    li.querySelector('.btn-eliminar').addEventListener('click', () => eliminarItemCarrito(item.key));
    elementos.carritoLista.appendChild(li);
  });
}

function cambiarCantidadCarrito(key, delta) {
  const item = carrito.find((productoCarrito) => productoCarrito.key === key);
  if (!item) return;

  const productoInventario = productos.find((producto) => producto.id === item.productoId);
  const stockDisponible = productoInventario ? productoInventario.stock : item.cantidad;
  const nuevaCantidad = item.cantidad + delta;

  if (nuevaCantidad < 1) {
    eliminarItemCarrito(key);
    return;
  }

  if (nuevaCantidad > stockDisponible) {
    mostrarToast('No hay mas stock disponible.');
    return;
  }

  item.cantidad = nuevaCantidad;
  actualizarCarritoUI();
}

function eliminarItemCarrito(key) {
  carrito = carrito.filter((item) => item.key !== key);
  actualizarCarritoUI();
  mostrarToast('Producto eliminado del carrito.');
}

function calcularTotalCarrito() {
  return carrito.reduce((total, item) => total + item.precio * item.cantidad, 0);
}

function crearIdLocal(prefijo) {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }

  return `${prefijo}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

async function manejarConfirmarPedido(evento) {
  evento.preventDefault();
  const formulario = evento.currentTarget;
  const botonSubmit = formulario.querySelector('button[type="submit"]');

  if (carrito.length === 0) {
    mostrarToast('El carrito esta vacio.');
    navegarA('pantalla-catalogo');
    return;
  }

  if (!formulario.checkValidity()) {
    formulario.reportValidity();
    return;
  }

  const nombreCliente = $('#cliente-nombre').value.trim();
  const emailCliente = $('#cliente-email').value.trim();
  const direccionCliente = $('#cliente-direccion').value.trim();

  if (!textoEnRango(nombreCliente, 3, 80)) {
    mostrarToast('Ingresa un nombre valido.');
    return;
  }

  if (!emailValido(emailCliente)) {
    mostrarToast('Ingresa un correo valido.');
    return;
  }

  if (!textoEnRango(direccionCliente, 8, 160)) {
    mostrarToast('Ingresa una direccion valida.');
    return;
  }

  const pedido = {
    clienteId: clienteActual ? clienteActual.uid : null,
    cliente: {
      nombre: nombreCliente,
      email: emailCliente,
      direccion: direccionCliente
    },
    metodoEntrega: formulario.querySelector('input[name="metodoEntrega"]:checked').value,
    aceptaTerminos: $('#aceptar-terminos').checked,
    items: carrito.map((item) => ({
      productoId: item.productoId,
      nombre: item.nombre,
      variante: item.variante,
      precio: item.precio,
      cantidad: item.cantidad,
      subtotal: item.precio * item.cantidad
    })),
    total: calcularTotalCarrito(),
    estado: 'pendiente',
    creadoEn: getServerTimestamp()
  };

  try {
    cambiarEstadoEnvio(botonSubmit, true, 'Guardando pedido...');
    await guardarPedido(pedido);
    carrito = [];
    formulario.reset();
    actualizarCarritoUI();
    mostrarToast('Pedido guardado correctamente.');
    navegarA('pantalla-catalogo');
  } catch (error) {
    console.error('Error al guardar pedido:', error);
    mostrarToast(error.message || 'No se pudo guardar el pedido.');
  } finally {
    cambiarEstadoEnvio(botonSubmit, false);
  }
}

async function guardarPedido(pedido) {
  if (!firebaseDisponible) {
    throw new Error('Firestore no esta disponible para guardar pedidos.');
  }

  await createOrderAndUpdateStock(pedido);
}

async function manejarGuardarProductoAdmin(evento) {
  evento.preventDefault();
  const formulario = evento.currentTarget;
  const botonSubmit = $('#btn-guardar-producto');
  let guardadoCompleto = false;

  if (!formulario.checkValidity()) {
    formulario.reportValidity();
    return;
  }

  const productoId = $('#admin-producto-id').value;
  const nombre = $('#admin-nombre').value.trim();
  const precio = Number($('#admin-precio').value);
  const categoria = $('#admin-categoria').value.trim();
  const descripcion = $('#admin-descripcion').value.trim();
  const imagenUrl = $('#admin-imagen').value.trim();
  const stock = Number($('#admin-stock').value);

  const producto = {
    nombre,
    precio,
    categoria,
    descripcion,
    imagenUrl,
    stock,
    variantes: ['Estandar', 'Premium', 'Coleccion'],
    actualizadoEn: getServerTimestamp()
  };

  if (!validarProducto(producto)) {
    return;
  }

  try {
    cambiarEstadoEnvio(botonSubmit, true, productoId ? 'Actualizando...' : 'Guardando...');
    if (productoId) {
      await actualizarProductoAdmin(productoId, producto);
      mostrarToast('Producto actualizado.');
    } else {
      await insertarProductoAdmin(producto);
      mostrarToast('Producto insertado.');
    }

    limpiarFormularioAdmin();
    renderizarCatalogo();
    renderizarAdmin();
    guardadoCompleto = true;
  } catch (error) {
    console.error('Error al guardar producto:', error);
    mostrarToast('No se pudo guardar el producto.');
  } finally {
    cambiarEstadoEnvio(botonSubmit, false);
    if (guardadoCompleto) {
      botonSubmit.textContent = 'Guardar';
    }
  }
}

async function insertarProductoAdmin(producto) {
  if (!puedeEditarInventario()) {
    mostrarToast('Inicia sesion como administrador para editar inventario.');
    return;
  }

  if (!firebaseDisponible) {
    throw new Error('Firestore no esta disponible para insertar productos.');
  }

  await createProduct({
    ...producto,
    creadoEn: getServerTimestamp()
  });
}

async function actualizarProductoAdmin(productoId, producto) {
  if (!puedeEditarInventario()) {
    mostrarToast('Inicia sesion como administrador para editar inventario.');
    return;
  }

  if (!firebaseDisponible) {
    throw new Error('Firestore no esta disponible para actualizar productos.');
  }

  await updateProduct(productoId, producto);
}

async function eliminarProductoAdmin(productoId) {
  if (!puedeEditarInventario()) {
    mostrarToast('Inicia sesion como administrador para editar inventario.');
    return;
  }

  const producto = productos.find((item) => item.id === productoId);
  const nombre = producto ? producto.nombre : 'este producto';
  const confirmado = confirm(`Seguro que deseas eliminar permanentemente "${nombre}"?`);

  if (!confirmado) return;

  try {
    if (!firebaseDisponible) {
      throw new Error('Firestore no esta disponible para eliminar productos.');
    }

    await deleteProduct(productoId);

    carrito = carrito.filter((item) => item.productoId !== productoId);
    actualizarCarritoUI();
    renderizarCatalogo();
    renderizarAdmin();
    mostrarToast('Producto eliminado.');
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    mostrarToast('No se pudo eliminar el producto.');
  }
}

function renderizarAdmin() {
  elementos.adminLista.innerHTML = '';
  elementos.adminEstado.textContent = firebaseDisponible ? 'Firestore' : 'Sin conexion';

  if (!productos.length) {
    elementos.adminLista.innerHTML = `
      <div class="rounded-lg bg-white p-4 text-sm text-cafe/70 shadow-sm">
        No hay productos registrados en inventario.
      </div>
    `;
    return;
  }

  productos.forEach((producto, index) => {
    const fila = document.createElement('article');
    fila.className = 'animated-card rounded-lg bg-white p-3 shadow-sm';
    fila.style.animationDelay = `${Math.min(index * 35, 160)}ms`;
    fila.innerHTML = `
      <div class="flex items-center gap-3">
        <img class="h-14 w-14 flex-none rounded-lg object-cover" src="${escaparAtributo(producto.imagenUrl)}" alt="${escaparAtributo(producto.nombre)}">
        <div class="min-w-0 flex-1">
          <h4 class="truncate font-display text-lg leading-5 text-cafe">${escaparHtml(producto.nombre)}</h4>
          <p class="mt-1 truncate text-[11px] font-semibold uppercase text-tierra">${escaparHtml(producto.categoria)}</p>
          <p class="mt-1 text-sm font-bold text-cafe">${formatoMoneda.format(producto.precio)} - Stock ${producto.stock}</p>
        </div>
        <div class="flex flex-none flex-col gap-2">
          <button class="btn-editar grid h-9 w-9 place-items-center rounded-lg border border-[#dfd1bd] bg-crema text-cafe" type="button" aria-label="Editar ${escaparAtributo(producto.nombre)}" title="Editar">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn-borrar grid h-9 w-9 place-items-center rounded-lg bg-[#F6EDEA] text-vino" type="button" aria-label="Eliminar ${escaparAtributo(producto.nombre)}" title="Eliminar">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `;

    const imagen = fila.querySelector('img');
    imagen.addEventListener('error', () => {
      imagen.src = crearImagenFallback(producto.nombre, producto.categoria);
    });

    fila.querySelector('.btn-editar').addEventListener('click', () => cargarProductoEnFormularioAdmin(producto));
    fila.querySelector('.btn-borrar').addEventListener('click', () => eliminarProductoAdmin(producto.id));
    elementos.adminLista.appendChild(fila);
  });
}

function alternarMenu() {
  const menu = $('#menu-panel');
  const estaAbierto = menu.classList.toggle('hidden') === false;
  $('#btn-menu').setAttribute('aria-expanded', String(estaAbierto));
}

function cerrarMenu() {
  $('#menu-panel').classList.add('hidden');
  $('#btn-menu').setAttribute('aria-expanded', 'false');
}

function moverCarousel(delta) {
  carouselIndex = (carouselIndex + delta + fotosEstudio.length) % fotosEstudio.length;
  renderizarCarousel();
}

function renderizarCarousel() {
  const foto = fotosEstudio[carouselIndex];
  elementos.carouselImagen.src = foto.imagenUrl;
  elementos.carouselImagen.alt = foto.titulo;
  elementos.carouselImagen.classList.remove('slide-in');
  void elementos.carouselImagen.offsetWidth;
  elementos.carouselImagen.classList.add('slide-in');
  elementos.carouselTitulo.textContent = foto.titulo;
  elementos.carouselDescripcion.textContent = foto.descripcion;
  elementos.carouselContador.textContent = `${carouselIndex + 1} / ${fotosEstudio.length}`;
  elementos.carouselProgreso.style.width = `${((carouselIndex + 1) / fotosEstudio.length) * 100}%`;
}

function puedeEditarInventario() {
  return Boolean(clienteActual && adminDesbloqueado && esPerfilAdmin(clientePerfil));
}

function cargarProductoEnFormularioAdmin(producto) {
  $('#admin-producto-id').value = producto.id;
  $('#admin-nombre').value = producto.nombre;
  $('#admin-precio').value = producto.precio;
  $('#admin-categoria').value = producto.categoria;
  $('#admin-descripcion').value = producto.descripcion;
  $('#admin-imagen').value = producto.imagenUrl;
  $('#admin-stock').value = producto.stock;
  $('#btn-guardar-producto').textContent = 'Actualizar';
  desplazarContenidoAlInicio();
}

function limpiarFormularioAdmin() {
  $('#form-admin-producto').reset();
  $('#admin-producto-id').value = '';
  $('#btn-guardar-producto').textContent = 'Guardar';
}

function navegarA(pantallaId) {
  quitarFocoActivo();

  if (!clienteActual && pantallaId !== 'pantalla-login') {
    navegarA('pantalla-login');
    return;
  }

  if (clienteActual && pantallaId === 'pantalla-login') {
    pantallaId = 'pantalla-catalogo';
  }

  if (pantallaId === 'pantalla-admin' && !puedeEditarInventario()) {
    navegarA(clienteActual ? 'pantalla-catalogo' : 'pantalla-login');
    return;
  }

  cerrarMenu();
  pantallaActual = pantallaId;

  pantallas.forEach((id) => {
    const pantalla = $(`#${id}`);
    const activa = id === pantallaId;
    pantalla.classList.toggle('hidden', !activa);
    pantalla.classList.toggle('fade-in', activa);
  });

  $$('.nav-btn').forEach((boton) => {
    const activo = boton.dataset.nav === pantallaId;
    boton.classList.toggle('text-tierra', activo);
    boton.classList.toggle('text-cafe/60', !activo);
    boton.classList.toggle('bg-crema', activo);
  });

  const esLogin = pantallaId === 'pantalla-login';
  elementos.appHeader.classList.toggle('hidden', esLogin);
  elementos.bottomNav.classList.toggle('hidden', esLogin);

  const ocultarFab = [
    'pantalla-login',
    'pantalla-catalogo',
    'pantalla-carrito',
    'pantalla-pedido',
    'pantalla-info',
    'pantalla-registro',
    'pantalla-admin'
  ].includes(pantallaId);
  $('#fab-carrito').classList.toggle('hidden', ocultarFab);
  desplazarContenidoAlInicio();
}

function quitarFocoActivo() {
  const elementoActivo = document.activeElement;

  if (elementoActivo && typeof elementoActivo.blur === 'function') {
    elementoActivo.blur();
  }
}

function desplazarContenidoAlInicio() {
  const contenedor = $('#app > main');

  if (contenedor) {
    contenedor.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cambiarEstadoEnvio(boton, enviando, textoTemporal) {
  if (!boton) return;

  if (enviando) {
    boton.dataset.textoOriginal = boton.innerHTML;
    boton.disabled = true;
    boton.classList.add('opacity-70');
    boton.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i>${textoTemporal}`;
    return;
  }

  boton.disabled = false;
  boton.classList.remove('opacity-70');
  if (boton.dataset.textoOriginal) {
    boton.innerHTML = boton.dataset.textoOriginal;
    delete boton.dataset.textoOriginal;
  }
}

function mostrarToast(mensaje) {
  elementos.toast.textContent = mensaje;
  elementos.toast.classList.add('hidden');
  void elementos.toast.offsetWidth;
  elementos.toast.classList.remove('hidden');

  clearTimeout(mostrarToast.timeout);
  mostrarToast.timeout = setTimeout(() => {
    elementos.toast.classList.add('hidden');
  }, 2800);
}

function animarCarrito() {
  const fab = $('#fab-carrito');
  const contador = elementos.contadorCarrito;

  fab.classList.remove('cart-pop');
  contador.classList.remove('cart-pop');
  void fab.offsetWidth;
  fab.classList.add('cart-pop');
  contador.classList.add('cart-pop');
}

function textoEnRango(valor, min, max) {
  const texto = String(valor || '').trim();
  return texto.length >= min && texto.length <= max;
}

function emailValido(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(valor || '').trim());
}

function telefonoValido(valor) {
  return /^\d{10}$/.test(String(valor || '').trim());
}

function urlHttpsValida(valor) {
  try {
    const url = new URL(String(valor || '').trim());
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

function esEnteroEnRango(valor, min, max = Number.MAX_SAFE_INTEGER) {
  return Number.isInteger(valor) && valor >= min && valor <= max;
}

function validarProducto(producto) {
  if (!textoEnRango(producto.nombre, 3, 80)) {
    mostrarToast('Ingresa un nombre de producto valido.');
    return false;
  }

  if (!Number.isFinite(producto.precio) || producto.precio <= 0) {
    mostrarToast('Ingresa un precio mayor a cero.');
    return false;
  }

  if (!textoEnRango(producto.categoria, 3, 60)) {
    mostrarToast('Ingresa una categoria valida.');
    return false;
  }

  if (!textoEnRango(producto.descripcion, 10, 300)) {
    mostrarToast('La descripcion debe tener entre 10 y 300 caracteres.');
    return false;
  }

  if (!urlHttpsValida(producto.imagenUrl)) {
    mostrarToast('Ingresa una URL de imagen https valida.');
    return false;
  }

  if (!esEnteroEnRango(producto.stock, 0)) {
    mostrarToast('El stock debe ser un numero entero mayor o igual a cero.');
    return false;
  }

  return true;
}

function crearImagenFallback(nombre, categoria) {
  const inicial = (nombre || 'S').trim().charAt(0).toUpperCase();
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="650" viewBox="0 0 900 650">
      <rect width="900" height="650" fill="#FFFAF1"/>
      <rect x="54" y="54" width="792" height="542" rx="28" fill="#FFFFFF" stroke="#D9CBB8" stroke-width="4"/>
      <circle cx="450" cy="270" r="96" fill="#7A6E5D"/>
      <circle cx="450" cy="270" r="48" fill="#FFFAF1"/>
      <rect x="330" y="390" width="240" height="18" rx="9" fill="#4A3F35" opacity="0.78"/>
      <text x="450" y="472" text-anchor="middle" font-family="Georgia, serif" font-size="72" fill="#4A3F35">${inicial}</text>
      <text x="450" y="530" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#7A6E5D">${escaparSvg(categoria || 'Studio')}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function escaparHtml(valor) {
  return String(valor)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escaparAtributo(valor) {
  return escaparHtml(valor).replaceAll('`', '&#096;');
}

function escaparSvg(valor) {
  return String(valor)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

window.addEventListener('beforeunload', () => {
  if (typeof unsubscribeProductos === 'function') {
    unsubscribeProductos();
  }
  if (typeof unsubscribeCliente === 'function') {
    unsubscribeCliente();
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciarApp);
} else {
  iniciarApp();
}
