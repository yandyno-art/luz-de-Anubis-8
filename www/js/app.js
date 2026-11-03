let chatActivoId = null;
let modoSeleccion = false;
let fotosSeleccionadas = [];

// --- CONTROL DEL BOTÓN FÍSICO "ATRÁS" ---
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

// --- LOGIN REAL CON TELEGRAM ---
async function loginReal() {
  const telefono = document.getElementById('telefono-login').value;
  const btn = document.getElementById('btn-login');

  if (!telefono) {
    alert("Por favor, ingresa tu número de teléfono con el código de país (ej: +5355555555)");
    return;
  }

  const textoOriginal = btn.innerHTML;
  btn.innerHTML = 'Conectando... <i class="fa-solid fa-spinner fa-spin"></i>';
  btn.disabled = true;

  try {
    const exito = await window.iniciarTelegram(telefono);
    if (exito) {
      entrarApp();
    } else {
      btn.innerHTML = textoOriginal;
      btn.disabled = false;
    }
  } catch (error) {
    alert("Ocurrió un error inesperado.");
    btn.innerHTML = textoOriginal;
    btn.disabled = false;
  }
}

function entrarApp() {
  document.getElementById('pantalla-login').classList.add('hidden');
  document.getElementById('app-principal').classList.remove('hidden');
  history.pushState({ view: 'app' }, '');
}

function cerrarSesion() {
  if(confirm('¿Seguro que quieres salir?')) { 
    localStorage.removeItem('tg_session'); 
    location.reload(); 
  }
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

function abrirChat(nombre, id) {
  chatActivoId = id; 
  document.getElementById('titulo-chat').innerText = nombre;
  aplicarFondo(); 
  cargarMensajes(); 
  const modal = document.getElementById('modal-chat');
  modal.classList.remove('translate-x-full');
  modal.classList.add('translate-x-0');
}

function cerrarChat() {
  const modal = document.getElementById('modal-chat');
  modal.classList.remove('translate-x-0');
  modal.classList.add('translate-x-full');
  chatActivoId = null;
}

function cargarMensajes() {
  const contenedor = document.getElementById('chat-mensajes');
  contenedor.innerHTML = ''; 
  const mensajesGuardados = JSON.parse(localStorage.getItem('logia_msgs_' + chatActivoId) || '[]');

  if(mensajesGuardados.length === 0) {
    contenedor.innerHTML = `
      <div class="self-center max-w-[90%] bg-black/50 text-gray-400 p-2 px-4 rounded-xl text-xs text-center border border-gray-700/50 fade-in mt-4">
        Escribe un mensaje para probar Telegram.
      </div>
    `;
  } else {
    mensajesGuardados.forEach(msg => {
      const div = document.createElement('div');
      if(msg.esMio) {
        div.className = 'bubble-mine fade-in';
        div.innerHTML = `<p>${msg.texto}</p><span class="bubble-time">${msg.hora} <i class="fa-solid fa-check-double"></i></span>`;
      } else {
        div.className = 'bubble-other fade-in';
        div.innerHTML = `<p>${msg.texto}</p><span class="bubble-time">${msg.hora}</span>`;
      }
      contenedor.appendChild(div);
    });
  }
  contenedor.scrollTop = contenedor.scrollHeight;
}

async function enviarMensaje() {
  const input = document.getElementById('input-mensaje');
  const texto = input.value.trim();
  if (!texto || !chatActivoId) return;

  input.value = ''; 
  const hora = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  
  const mensajesGuardados = JSON.parse(localStorage.getItem('logia_msgs_' + chatActivoId) || '[]');
  mensajesGuardados.push({ texto: texto, esMio: true, hora: hora });
  localStorage.setItem('logia_msgs_' + chatActivoId, JSON.stringify(mensajesGuardados));
  cargarMensajes();

  // Si estamos en el chat de prueba de Telegram, enviamos a "me"
  if (chatActivoId === 'me') {
    await window.enviarMensajeTelegram("me", texto);
  }
}

// ==========================================
// LÓGICA DE LA GALERÍA DE FONDOS Y SELECCIÓN
// ==========================================

let fondoSeleccionadoTemporal = "";
let urlActualPreview = "";

function abrirFondos() {
  document.getElementById('modal-fondos').classList.remove('hidden');
  desactivarModoSeleccion(); 
  generarGridFondos();
}

function cerrarFondos() {
  document.getElementById('modal-fondos').classList.add('hidden');
  desactivarModoSeleccion();
}

function toggleModoSeleccion() {
  modoSeleccion = !modoSeleccion;
  fotosSeleccionadas = []; 

  if (modoSeleccion) {
    document.getElementById('btn-modo-seleccion').innerText = "Cancelar";
    document.getElementById('barra-seleccion').classList.remove('hidden');
  } else {
    desactivarModoSeleccion();
  }
  generarGridFondos();
}

function desactivarModoSeleccion() {
  modoSeleccion = false;
  fotosSeleccionadas = [];
  document.getElementById('btn-modo-seleccion').innerText = "Seleccionar";
  document.getElementById('barra-seleccion').classList.add('hidden');
}

function marcarTodas() {
  const fondosCustom = JSON.parse(localStorage.getItem('logia_fondos_custom') || '[]');
  
  if (fotosSeleccionadas.length === fondosCustom.length && fondosCustom.length > 0) {
    fotosSeleccionadas = []; 
  } else {
    fotosSeleccionadas = [...fondosCustom]; 
  }
  generarGridFondos();
}

function borrarSeleccionadas() {
  if (fotosSeleccionadas.length === 0) {
    alert("No has seleccionado ninguna foto.");
    return;
  }

  if(confirm(`¿Borrar las ${fotosSeleccionadas.length} fotos seleccionadas?`)) {
    let fondosCustom = JSON.parse(localStorage.getItem('logia_fondos_custom') || '[]');
    let fondosRestantes = fondosCustom.filter(foto => !fotosSeleccionadas.includes(foto));

    localStorage.setItem('logia_fondos_custom', JSON.stringify(fondosRestantes));

    const fondoActual = localStorage.getItem('logia_fondo');
    if (fotosSeleccionadas.includes(fondoActual)) {
      localStorage.removeItem('logia_fondo');
      aplicarFondo();
    }

    desactivarModoSeleccion();
    generarGridFondos();
  }
}

function generarGridFondos() {
  const grid = document.getElementById('grid-fondos');
  grid.innerHTML = ''; 
  
  const fondoActual = localStorage.getItem('logia_fondo');
  const fondosCustom = JSON.parse(localStorage.getItem('logia_fondos_custom') || '[]');

  // 1. FOTOS PERSONALIZADAS
  fondosCustom.forEach((base64, index) => {
    const divCustom = document.createElement('div');
    divCustom.className = 'relative w-full h-24 bg-cover bg-center rounded-lg cursor-pointer border-2 transition-all shadow-md overflow-hidden bg-black border-purple';
    divCustom.setAttribute('data-url', base64);
    divCustom.setAttribute('data-custom', 'true');
    
    if (fondoActual === base64) {
      divCustom.classList.add('border-gold');
      const check = document.createElement('div');
      check.className = 'absolute top-1 right-1 bg-gold text-black rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-lg z-10';
      check.innerHTML = '<i class="fa-solid fa-check"></i>';
      divCustom.appendChild(check);
    }

    if (modoSeleccion) {
      const isSelected = fotosSeleccionadas.includes(base64);
      const circle = document.createElement('div');
      circle.className = `absolute bottom-1 right-1 rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-lg z-20 border-2 ${isSelected ? 'bg-turquoise border-turquoise text-black' : 'bg-black/50 border-white text-transparent'}`;
      circle.innerHTML = '<i class="fa-solid fa-check"></i>';
      divCustom.appendChild(circle);

      divCustom.onclick = function() {
        if (isSelected) {
          fotosSeleccionadas = fotosSeleccionadas.filter(f => f !== base64);
        } else {
          fotosSeleccionadas.push(base64);
        }
        generarGridFondos();
      };
    } else {
      const btnDelete = document.createElement('div');
      btnDelete.className = 'absolute top-1 left-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-lg z-20 border border-white/20';
      btnDelete.innerHTML = '<i class="fa-solid fa-xmark"></i>';
      btnDelete.onclick = function(e) {
        e.stopPropagation(); 
        if(confirm('¿Borrar esta foto de tu galería?')) {
          let nuevasFotos = JSON.parse(localStorage.getItem('logia_fondos_custom') || '[]');
          nuevasFotos.splice(index, 1);
          localStorage.setItem('logia_fondos_custom', JSON.stringify(nuevasFotos));

          if(fondoActual === base64) {
             localStorage.removeItem('logia_fondo');
             aplicarFondo();
          }
          generarGridFondos(); 
        }
      };
      divCustom.appendChild(btnDelete);

      divCustom.onclick = function() { abrirPreview(base64, true); };
    }

    const imgCustom = document.createElement('img');
    imgCustom.src = base64;
    imgCustom.className = 'w-full h-full object-cover';
    imgCustom.draggable = false;
    
    const tag = document.createElement('div');
    tag.className = 'absolute bottom-0 w-full bg-black/60 text-white text-[9px] font-bold text-center py-1';
    tag.innerText = 'Mi Foto ' + (index + 1);

    divCustom.appendChild(imgCustom);
    divCustom.appendChild(tag);
    grid.appendChild(divCustom);
  });

  // 2. FOTOS DE FÁBRICA
  for (let i = 1; i <= 200; i++) {
    const div = document.createElement('div');
    div.className = 'relative w-full h-24 bg-cover bg-center rounded-lg cursor-pointer border-2 border-transparent transition-all shadow-md overflow-hidden bg-black';
    
    if (fondoActual === `img/fondo${i}.jpg` || fondoActual === `img/fondo${i}.png`) {
      div.classList.add('border-gold');
    }

    const img = document.createElement('img');
    img.src = `img/fondo${i}.jpg`; 
    img.draggable = false;
    div.setAttribute('data-custom', 'false');
    
    img.onload = function() { div.setAttribute('data-url', img.src); };

    img.onerror = function() { 
      if (img.src.endsWith('.jpg')) { img.src = `img/fondo${i}.png`; } 
      else { div.style.display = 'none'; }
    };

    if (fondoActual === `img/fondo${i}.jpg` || fondoActual === `img/fondo${i}.png`) {
      const check = document.createElement('div');
      check.className = 'absolute top-1 right-1 bg-gold text-black rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-lg z-10';
      check.innerHTML = '<i class="fa-solid fa-check"></i>';
      div.appendChild(check);
    }

    div.onclick = function() { 
      if(modoSeleccion) {
        alert("Las fotos de fábrica no se pueden borrar.");
      } else {
        abrirPreview(img.src, false); 
      }
    };
    div.appendChild(img);
    grid.appendChild(div);
  }
}

// --- VISTA PREVIA Y SWIPE ---
function abrirPreview(url, esCustom) {
  fondoSeleccionadoTemporal = url;
  urlActualPreview = url;
  
  const imgPreview = document.getElementById('img-preview');
  imgPreview.src = url;
  
  if (esCustom) { imgPreview.setAttribute('data-custom', 'true'); } 
  else { imgPreview.removeAttribute('data-custom'); }
  
  document.getElementById('modal-preview').classList.remove('hidden');
}

function cerrarPreview() {
  document.getElementById('modal-preview').classList.add('hidden');
  fondoSeleccionadoTemporal = "";
  urlActualPreview = "";
}

function aplicarFondoPreview() {
  if (fondoSeleccionadoTemporal) {
    localStorage.setItem('logia_fondo', fondoSeleccionadoTemporal);
    aplicarFondo(); 
    cerrarPreview(); 
    generarGridFondos(); 
  }
}

function aplicarFondo() {
  const tipoFondo = localStorage.getItem('logia_fondo');
  const capaFondo = document.getElementById('chat-fondo');
  
  if (!capaFondo) return;
  let urlFinal = tipoFondo ? tipoFondo : 'https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png';

  capaFondo.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.15)), url('${urlFinal}')`;
}

let touchStartX = 0;
let touchEndX = 0;
const previewModal = document.getElementById('modal-preview');

previewModal.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
previewModal.addEventListener('touchend', e => { touchEndX = e.changedTouches[0].screenX; handleSwipe(); }, { passive: true });

function handleSwipe() {
  const SWIPE_THRESHOLD = 50;
  if (touchEndX < touchStartX - SWIPE_THRESHOLD) navegarPreview(1);
  if (touchEndX > touchStartX + SWIPE_THRESHOLD) navegarPreview(-1);
}

function navegarPreview(direccion) {
  const itemsValidos = Array.from(document.querySelectorAll('#grid-fondos > div[data-url]')).filter(div => div.style.display !== 'none');
  let indexActual = itemsValidos.findIndex(div => div.getAttribute('data-url') === urlActualPreview);
  
  if (indexActual !== -1) {
    let nuevoIndex = indexActual + direccion;
    if (nuevoIndex >= 0 && nuevoIndex < itemsValidos.length) {
      const divNuevo = itemsValidos[nuevoIndex];
      abrirPreview(divNuevo.getAttribute('data-url'), divNuevo.getAttribute('data-custom') === 'true');
    }
  }
}

// --- PROCESAR FOTOS MÚLTIPLES ---
document.getElementById('custom-fondo-input').addEventListener('change', function(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  let fondosCustom = JSON.parse(localStorage.getItem('logia_fondos_custom') || '[]');
  let fotosProcesadas = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
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
        fondosCustom.push(dataUrlComprimida);
        localStorage.setItem('logia_fondos_custom', JSON.stringify(fondosCustom));
        
        fotosProcesadas++;
        if (fotosProcesadas === files.length) {
           generarGridFondos();
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  event.target.value = ''; 
});

window.onload = function() {
  aplicarFondo();
  if (localStorage.getItem('tg_session')) {
      entrarApp();
  }
};