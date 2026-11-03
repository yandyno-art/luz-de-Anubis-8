let chatActivoId = null; // Variable para saber en qué chat estamos

// --- CONTROL DEL BOTÓN FÍSICO "ATRÁS" (ANDROID) ---
history.pushState({ view: 'home' }, '');
window.addEventListener('popstate', function(event) {
    if (document.getElementById('modal-chat').classList.contains('translate-x-0')) {
        cerrarChat();
        history.pushState({ view: 'chat' }, '');
    } 
    else if (!document.getElementById('modal-fondos').classList.contains('hidden')) {
        cerrarFondos();
        history.pushState({ view: 'fondos' }, '');
    }
    else if (!document.getElementById('modal-preview').classList.contains('hidden')) {
        cerrarPreview();
        history.pushState({ view: 'preview' }, '');
    }
    else if (document.getElementById('vista-ajustes').classList.contains('block')) {
        cambiarVista('chats', document.querySelector('.nav-btn'));
        history.pushState({ view: 'home' }, '');
    }
});

function togglePassword() {
  const input = document.getElementById('password-input');
  const icon = document.getElementById('eye-icon');
  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
  } else {
    input.type = 'password';
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
  }
}

function entrarApp() {
  document.getElementById('pantalla-login').classList.add('hidden');
  document.getElementById('app-principal').classList.remove('hidden');
  history.pushState({ view: 'app' }, '');
}

function cerrarSesion() {
  if(confirm('¿Seguro que quieres salir?')) { location.reload(); }
}

function cambiarVista(vista, btn) {
  document.querySelectorAll('.vista').forEach(v => {
    v.classList.add('hidden');
    v.classList.remove('block');
  });
  const el = document.getElementById('vista-' + vista);
  el.classList.remove('hidden');
  el.classList.add('block');

  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.remove('text-gold');
    b.classList.add('text-gray-500');
  });
  if (btn && btn.classList.contains('nav-btn')) {
      btn.classList.remove('text-gray-500');
      btn.classList.add('text-gold');
  }
}

// --- LÓGICA DE ABRIR Y CERRAR CHATS ---
function abrirChat(nombre, id) {
  chatActivoId = id; // Guardamos que estamos en este chat (ej: 'general' o 'estudio')
  document.getElementById('titulo-chat').innerText = nombre;
  
  aplicarFondo(); // Aplica la foto de fondo
  cargarMensajes(); // Carga solo los mensajes de este chat
  
  const modal = document.getElementById('modal-chat');
  modal.classList.remove('translate-x-full');
  modal.classList.add('translate-x-0');
}

function cerrarChat() {
  const modal = document.getElementById('modal-chat');
  modal.classList.remove('translate-x-0');
  modal.classList.add('translate-x-full');
  chatActivoId = null; // Limpiamos el chat activo al salir
}

// --- CARGAR MENSAJES EN PANTALLA ---
function cargarMensajes() {
  const contenedor = document.getElementById('chat-mensajes');
  contenedor.innerHTML = ''; // Limpiamos la pantalla
  
  // Buscamos los mensajes guardados de ESTE chat específico en la memoria
  const mensajesGuardados = JSON.parse(localStorage.getItem('logia_msgs_' + chatActivoId) || '[]');

  if(mensajesGuardados.length === 0) {
    contenedor.innerHTML = `
      <div class="self-center max-w-[90%] bg-black/50 text-gray-400 p-2 px-4 rounded-xl text-xs text-center border border-gray-700/50 fade-in mt-4">
        No hay mensajes aún. Escribe algo para empezar.
      </div>
    `;
  } else {
    mensajesGuardados.forEach(msg => {
      const div = document.createElement('div');
      if(msg.esMio) {
        div.className = 'self-end max-w-[85%] bg-[#005c4b] text-white p-2.5 px-3 rounded-2xl rounded-tr-sm text-[15px] shadow-sm relative fade-in border border-turquoise/20';
        div.innerHTML = `<p>${msg.texto}</p><span class="block text-[10px] text-turquoise text-right mt-1">${msg.hora} <i class="fa-solid fa-check-double"></i></span>`;
      } else {
        div.className = 'self-start max-w-[85%] bg-[#202c33] text-gray-200 p-2.5 px-3 rounded-2xl rounded-tl-sm text-[15px] shadow-sm relative fade-in border border-gray-700/50';
        div.innerHTML = `<p>${msg.texto}</p><span class="block text-[10px] text-gray-500 text-right mt-1">${msg.hora}</span>`;
      }
      contenedor.appendChild(div);
    });
  }
  // Hacemos scroll automático al último mensaje
  contenedor.scrollTop = contenedor.scrollHeight;
}

// --- ENVIAR MENSAJE ---
function enviarMensaje() {
  const input = document.getElementById('input-mensaje');
  const texto = input.value.trim();
  if (!texto || !chatActivoId) return;

  input.value = ''; // Limpiamos el input
  const hora = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  
  // 1. Leemos los mensajes que ya había en ESTE chat
  const mensajesGuardados = JSON.parse(localStorage.getItem('logia_msgs_' + chatActivoId) || '[]');
  
  // 2. Agregamos el nuevo mensaje
  mensajesGuardados.push({ texto: texto, esMio: true, hora: hora });
  
  // 3. Lo guardamos de nuevo en la memoria del teléfono, separado por chat
  localStorage.setItem('logia_msgs_' + chatActivoId, JSON.stringify(mensajesGuardados));
  
  // 4. Recargamos la pantalla para ver el mensaje
  cargarMensajes();
}

// --- LÓGICA DE LA GALERÍA DE FONDOS ---
let fondoSeleccionadoTemporal = "";

function abrirFondos() {
  document.getElementById('modal-fondos').classList.remove('hidden');
  generarGridFondos();
}

function cerrarFondos() {
  document.getElementById('modal-fondos').classList.add('hidden');
}

function generarGridFondos() {
  const grid = document.getElementById('grid-fondos');
  grid.innerHTML = ''; 
  
  const fondoActual = localStorage.getItem('logia_fondo');
  const fondoPersonalizado = localStorage.getItem('logia_fondo_custom');

  // 1. FOTO PERSONALIZADA
  if (fondoPersonalizado) {
    const divCustom = document.createElement('div');
    divCustom.className = 'relative w-full h-24 bg-cover bg-center rounded-lg cursor-pointer border-2 transition-all shadow-md overflow-hidden bg-black border-purple';
    
    if (fondoActual === 'CUSTOM') {
      divCustom.classList.add('border-gold');
      const check = document.createElement('div');
      check.className = 'absolute top-1 right-1 bg-gold text-black rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-lg z-10';
      check.innerHTML = '<i class="fa-solid fa-check"></i>';
      divCustom.appendChild(check);
    }

    const imgCustom = document.createElement('img');
    imgCustom.src = fondoPersonalizado;
    imgCustom.className = 'w-full h-full object-cover';
    
    const tag = document.createElement('div');
    tag.className = 'absolute bottom-0 w-full bg-black/60 text-white text-[9px] font-bold text-center py-1';
    tag.innerText = 'Mi Foto';

    divCustom.onclick = function() { abrirPreview(fondoPersonalizado, true); };

    divCustom.appendChild(imgCustom);
    divCustom.appendChild(tag);
    grid.appendChild(divCustom);
  }

  // 2. FOTOS DE LA CARPETA
  for (let i = 1; i <= 200; i++) {
    const div = document.createElement('div');
    div.className = 'relative w-full h-24 bg-cover bg-center rounded-lg cursor-pointer border-2 border-transparent transition-all shadow-md overflow-hidden bg-black';
    
    if (fondoActual === `img/fondo${i}.jpg`) {
      div.classList.add('border-gold');
    }

    const img = document.createElement('img');
    img.src = `img/fondo${i}.jpg`;
    img.className = 'w-full h-full object-cover';
    
    img.onerror = function() { div.style.display = 'none'; };

    if (fondoActual === `img/fondo${i}.jpg`) {
      const check = document.createElement('div');
      check.className = 'absolute top-1 right-1 bg-gold text-black rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-lg z-10';
      check.innerHTML = '<i class="fa-solid fa-check"></i>';
      div.appendChild(check);
    }

    div.onclick = function() { abrirPreview(`img/fondo${i}.jpg`, false); };

    div.appendChild(img);
    grid.appendChild(div);
  }
}

function abrirPreview(url, esCustom) {
  fondoSeleccionadoTemporal = url;
  const imgPreview = document.getElementById('img-preview');
  imgPreview.src = url;
  
  if (esCustom) { imgPreview.setAttribute('data-custom', 'true'); } 
  else { imgPreview.removeAttribute('data-custom'); }
  
  document.getElementById('modal-preview').classList.remove('hidden');
}

function cerrarPreview() {
  document.getElementById('modal-preview').classList.add('hidden');
  fondoSeleccionadoTemporal = "";
}

function aplicarFondoPreview() {
  if (fondoSeleccionadoTemporal) {
    const esCustom = document.getElementById('img-preview').hasAttribute('data-custom');
    
    if (esCustom) { localStorage.setItem('logia_fondo', 'CUSTOM'); } 
    else { localStorage.setItem('logia_fondo', fondoSeleccionadoTemporal); }
    
    aplicarFondo(); 
    cerrarPreview(); 
    generarGridFondos(); 
  }
}

function aplicarFondo() {
  const tipoFondo = localStorage.getItem('logia_fondo');
  const capaFondo = document.getElementById('chat-fondo');
  
  if (!capaFondo) return;
  let urlFinal = "";

  if (tipoFondo === 'CUSTOM') { urlFinal = localStorage.getItem('logia_fondo_custom'); } 
  else if (tipoFondo) { urlFinal = tipoFondo; } 
  else { urlFinal = 'https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png'; }

  capaFondo.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.15)), url('${urlFinal}')`;
}

// --- PROCESAR LA FOTO QUE EL USUARIO SUBE ---
document.getElementById('custom-fondo-input').addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1080;
      const scaleSize = MAX_WIDTH / img.width;
      
      if (scaleSize < 1) {
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const dataUrlComprimida = canvas.toDataURL('image/jpeg', 0.7);
      localStorage.setItem('logia_fondo_custom', dataUrlComprimida);
      abrirPreview(dataUrlComprimida, true);
      event.target.value = '';
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

window.onload = function() {
  aplicarFondo();
};
