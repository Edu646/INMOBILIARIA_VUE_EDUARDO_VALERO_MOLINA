<script setup>
import { ref } from 'vue'
import { addDoc, collection, deleteDoc, doc } from 'firebase/firestore'
import { useCollection, useFirestore } from 'vuefire'
import { getAuth, onAuthStateChanged } from 'firebase/auth'

const db = useFirestore()
const inmueblesRef = collection(db, "INMUEBLES")
const listaInmuebles = useCollection(inmueblesRef)


const auth = getAuth()
const currentUser = ref(null)


onAuthStateChanged(auth, (user) => {
  currentUser.value = user
})

const nuevoInmuebleTexto = ref('')
const esRent = ref(true) 
const esparking = ref(false)
const precio_inicial = ref('')
const mostrarInput = ref(false)
const precio_a_descontar = ref('')
const Bedroom = ref('')
const Bathroom = ref('')
const direccion = ref('') 
const buscandoDireccion = ref(false) 
const mensajeGeocoding = ref('') 
const errorGuardar = ref('') 
const imagenes = ref([
  { url: '', file: null, preview: '', error: '' },
  { url: '', file: null, preview: '', error: '' },
  { url: '', file: null, preview: '', error: '' },
  { url: '', file: null, preview: '', error: '' }
])
const procesandoImagenes = ref(false)
const imagenActiva = ref(0)
const latitud = ref(null)
const longitud = ref(null)

function handleImagenSeleccionada(event, index) {
  const file = event.target.files[0]
  if (file) {
   
    if (file.size > 100 * 1024 * 1024) {
      imagenes.value[index].error = 'La imagen es demasiado grande. Máximo 5MB.'
      return
    }
    
    imagenes.value[index].file = file
    imagenes.value[index].error = ''
    imagenes.value[index].url = '' // Clear URL if file is selected
    
    const reader = new FileReader()
    reader.onload = (e) => {
      imagenes.value[index].preview = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

function convertirImagenABase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null)
      return
    }
    
    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        resolve(e.target.result)
      }
      reader.onerror = (e) => {
        reject(e)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      reject(error)
    }
  })
}

function validarURL(url) {
  if (!url) return true
  try {
    new URL(url)
    return true
  } catch (e) {
    return false
  }
}

const calcularPrecioConDescuento = (regularPrice, discountPrice) => {
  if (!regularPrice || !discountPrice) return regularPrice;
  return regularPrice - discountPrice;
};

function obtenerCoordenadas() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      latitud.value = position.coords.latitude;
      longitud.value = position.coords.longitude;
      mensajeGeocoding.value = "Ubicación actual obtenida correctamente";
    }, (error) => {
      mensajeGeocoding.value = 'No se pudo obtener la ubicación: ' + error.message;
    });
  } else {
    mensajeGeocoding.value = 'Geolocalización no soportada por este navegador';
  }
}

function buscarCoordenadas() {
  if (!direccion.value) {
    mensajeGeocoding.value = "Por favor ingresa una dirección";
    return;
  }
  
  buscandoDireccion.value = true;
  mensajeGeocoding.value = "Buscando coordenadas...";
  
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(direccion.value)}`;
  
  fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'InmueblesApp'
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Error en la respuesta del servidor');
    }
    return response.json();
  })
  .then(data => {
    if (data && data.length > 0) {
      latitud.value = parseFloat(data[0].lat);
      longitud.value = parseFloat(data[0].lon);
      mensajeGeocoding.value = `Ubicación encontrada: ${data[0].display_name}`;
      console.log("Coordenadas obtenidas:", latitud.value, longitud.value);
    } else {
      mensajeGeocoding.value = "No se encontraron resultados para esta dirección";
    }
  })
  .catch(error => {
    console.error("Error al geocodificar:", error);
    mensajeGeocoding.value = `Error al buscar la dirección: ${error.message}`;
  })
  .finally(() => {
    buscandoDireccion.value = false;
  });
}

function validarInmueble() {
  const errores = [];
  
  if (!nuevoInmuebleTexto.value) errores.push("Nombre del inmueble es obligatorio");
  if (!precio_inicial.value) errores.push("Precio es obligatorio");
  if (!Bedroom.value) errores.push("Número de dormitorios es obligatorio");
  if (!Bathroom.value) errores.push("Número de baños es obligatorio");
  
  if (mostrarInput.value && !precio_a_descontar.value) {
    errores.push("Si hay oferta, el precio de descuento es obligatorio");
  }
  
  if (!latitud.value || !longitud.value) {
    errores.push("Las coordenadas de ubicación son obligatorias");
  }
  

  if (!currentUser.value) {
    errores.push("Debe iniciar sesión para añadir un inmueble");
  }

  const tieneImagenes = imagenes.value.some(img => img.file || img.url);
  if (!tieneImagenes) {
    errores.push("Debe añadir al menos una imagen");
  }
  
  return errores;
}

function nuevo_inmueble() {
  errorGuardar.value = '';
  
  const errores = validarInmueble();
  if (errores.length > 0) {
    errorGuardar.value = errores.join(". ");
    return;
  }
  
  if (procesandoImagenes.value) return;
  procesandoImagenes.value = true;
  
  const promesasImagenes = [];
  
  for (let i = 0; i < imagenes.value.length; i++) {
    const imagen = imagenes.value[i];
    
    if (imagen.file) {
      promesasImagenes.push(convertirImagenABase64(imagen.file));
    } else if (imagen.url && validarURL(imagen.url)) {
      promesasImagenes.push(Promise.resolve(imagen.url));
    } else {
      promesasImagenes.push(Promise.resolve(null));
    }
  }
  
  Promise.all(promesasImagenes)
    .then(imagenesResueltas => {
     
      const imagenesGuardar = imagenesResueltas.filter(img => img !== null);
    
      if (imagenesGuardar.length === 0) {
        throw new Error("Debe proporcionar al menos una imagen válida");
      }
      

      if (!currentUser.value) {
        throw new Error("No hay un usuario autenticado");
      }
      
      const n_inmueble = {
        name: nuevoInmuebleTexto.value,
        rent: esRent.value,
        sell: !esRent.value,
        Bedroom: Number(Bedroom.value),
        Bathroom: Number(Bathroom.value),
        Parking_Spot: esparking.value,
        Regular_Price: Number(precio_inicial.value),
        offer: mostrarInput.value,
        Discounted_Price: mostrarInput.value ? Number(precio_a_descontar.value) : 0,
        imageURLs: imagenesGuardar,
        direccion: direccion.value,
        location: {
          lat: Number(latitud.value),
          lng: Number(longitud.value)
        },
        timestamp: new Date().toISOString(),
        userId: currentUser.value.uid,
        userEmail: currentUser.value.email
      };

      console.log("Guardando inmueble:", n_inmueble);
      
      return addDoc(inmueblesRef, n_inmueble);
    })
    .then(docRef => {
      console.log("Documento guardado con ID:", docRef.id);
     
      nuevoInmuebleTexto.value = ''; 
      precio_inicial.value = '';
      precio_a_descontar.value = '';
      mostrarInput.value = false;
      esRent.value = true;
      esparking.value = false;
      Bedroom.value = '';
      Bathroom.value = '';
      direccion.value = '';
      latitud.value = null;
      longitud.value = null;
      mensajeGeocoding.value = '';
      imagenes.value = imagenes.value.map(() => ({ 
        url: '', 
        file: null, 
        preview: '', 
        error: '' 
      }));
      imagenActiva.value = 0;
      
      errorGuardar.value = '¡Inmueble guardado correctamente!';
      setTimeout(() => {
        errorGuardar.value = '';
      }, 3000);
    })
    .catch(error => {
      console.error("Error al guardar el inmueble:", error);
      errorGuardar.value = `Error al guardar: ${error.message}`;
    })
    .finally(() => {
      procesandoImagenes.value = false;
    });
}

function eliminar_inmueble(id) {
  if (!currentUser.value) {
    console.error("No hay usuario autenticado para eliminar inmuebles");
    return;
  }
  
  const inmuebleRef = doc(db, "INMUEBLES", id);
  
  deleteDoc(inmuebleRef)
    .then(() => {
      console.log("Inmueble eliminado con éxito");
    })
    .catch((error) => {
      console.error("Error al eliminar el inmueble:", error);
    });
}
</script>

<template>
  <div class="container">
   
    <h2>Añadir nuevo inmueble</h2>
    
    <!-- Mensaje de usuario conectado -->
    <div v-if="currentUser" class="user-info success-mensaje">
      <p>Usuario conectado: {{ currentUser.email }}</p>
    </div>
    <div v-else class="user-info error-mensaje">
      <p>No hay usuario conectado. Por favor, inicie sesión para añadir inmuebles.</p>
    </div>

    <!-- Mensaje de error/éxito al guardar -->
    <div v-if="errorGuardar" :class="{ 'error-mensaje': errorGuardar.includes('Error'), 'success-mensaje': !errorGuardar.includes('Error') }" class="mensaje-guardar">
      {{ errorGuardar }}
    </div>

    <input v-model="nuevoInmuebleTexto" type="text" placeholder="Nombre del inmueble" class="input" required />
    
    <!-- Sección de ubicación -->
    <div class="ubicacion-container">
      <h3>Ubicación del inmueble</h3>
      
      <div class="input-group">
        <label>Dirección:</label>
        <input v-model="direccion" type="text" placeholder="Ej. Calle Gran Vía 28, Madrid" class="input" />
      </div>
      
      <div class="buttons-group">
        <button @click="buscarCoordenadas" class="ubicacion-btn" :disabled="buscandoDireccion">
          {{ buscandoDireccion ? 'Buscando...' : 'Buscar coordenadas' }}
        </button>
        <button @click="obtenerCoordenadas" class="ubicacion-btn">Usar mi ubicación actual</button>
      </div>
      
      <p v-if="mensajeGeocoding" :class="{ 'error-mensaje': mensajeGeocoding.includes('Error') || mensajeGeocoding.includes('No se'), 'success-mensaje': !mensajeGeocoding.includes('Error') && !mensajeGeocoding.includes('No se') }">
        {{ mensajeGeocoding }}
      </p>
      
      <div v-if="latitud && longitud" class="ubicacion-info">
        <p>Coordenadas obtenidas:</p>
        <p>Latitud: {{ latitud }}</p>
        <p>Longitud: {{ longitud }}</p>
      </div>
    </div>

    <div class="boton-group">
      <button @click="esRent = true" :class="{ activo: esRent }">Alquiler</button>
      <button @click="esRent = false" :class="{ activo: !esRent }">Venta</button>
    </div>

    <div class="boton-group">
      <p>¿Tiene Parking?</p>
      <button @click="esparking = true" :class="{activo:esparking}">Sí</button>
      <button @click="esparking = false" :class="{activo:!esparking}">No</button>
    </div>

    <div class="input-group">
      <label>Dormitorios:</label>
      <input v-model="Bedroom" type="number" min="0" placeholder="Número de dormitorios" class="input" required />
    </div>
    
    <div class="input-group">
      <label>Baños:</label>
      <input v-model="Bathroom" type="number" min="0" placeholder="Número de baños" class="input" required />
    </div>

    <div class="input-group">
      <label>Precio inicial (€):</label>
      <input v-model="precio_inicial" type="number" min="0" placeholder="Precio inicial" class="input" required />
    </div>

    <div class="boton-group">
      <button @click="mostrarInput = true" :class="{activo: mostrarInput}">Mostrar descuento</button>
      <button @click="mostrarInput = false" :class="{activo: !mostrarInput}">Ocultar descuento</button>
    </div>

    <div v-if="mostrarInput" class="input-group">
      <label>Precio a descontar (€):</label>
      <input v-model="precio_a_descontar" type="number" min="0" placeholder="Precio a descontar" class="input" required />
    </div>

    <div class="imagen-upload">
      <h3>Imágenes del inmueble (máximo 4)</h3>
      <p class="note">Nota: Las imágenes se guardarán como base64 directamente en la base de datos. 
        Por favor, use imágenes pequeñas (máx 5MB) para evitar problemas de rendimiento.</p>
      
      <div class="selector-imagenes">
        <button 
          v-for="(img, index) in imagenes" 
          :key="index" 
          @click="imagenActiva = index" 
          :class="{ 'activo': imagenActiva === index }"
          class="selector-btn"
        >
          Imagen {{ index + 1 }}
        </button>
      </div>
      
      <div class="imagen-panel">
        <div class="upload-option">
          <h4>Opción 1: Seleccionar imagen del dispositivo</h4>
          <input 
            type="file" 
            accept="image/*" 
            @change="(e) => handleImagenSeleccionada(e, imagenActiva)" 
            class="input-file"
            :disabled="procesandoImagenes"
          />
          <p class="hint">Recomendado: JPG/PNG, máx 5MB</p>
        </div>
        
        <div class="upload-option">
          <h4>Opción 2: Ingresar URL de imagen</h4>
          <input 
            v-model="imagenes[imagenActiva].url" 
            type="text" 
            placeholder="https://ejemplo.com/imagen.jpg" 
            class="input"
            :disabled="imagenes[imagenActiva].file !== null"
          />
          <p class="hint">Si ingresa una URL, asegúrese de que sea accesible públicamente</p>
        </div>
        
        <div v-if="imagenes[imagenActiva].preview || imagenes[imagenActiva].url" class="imagen-preview">
          <img :src="imagenes[imagenActiva].preview || imagenes[imagenActiva].url" alt="Vista previa" />
        </div>
        
        <p v-if="imagenes[imagenActiva].error" class="error-mensaje">{{ imagenes[imagenActiva].error }}</p>
      </div>
      
      <div class="vista-miniaturas">
        <div 
          v-for="(img, index) in imagenes" 
          :key="index" 
          class="miniatura" 
          :class="{ 'empty': !img.preview && !img.url }"
          @click="imagenActiva = index"
        >
          <img v-if="img.preview || img.url" :src="img.preview || img.url" alt="Miniatura" />
          <span v-else>Sin imagen</span>
        </div>
      </div>
    </div>

    <button @click="nuevo_inmueble" class="agregar" :disabled="procesandoImagenes || !currentUser">
      {{ procesandoImagenes ? 'Procesando...' : 'Añadir Inmueble' }}
    </button>
  </div>
</template>


<style>
/* Base Styles */
:root {
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --primary-light: #dbeafe;
  --success: #16a34a;
  --success-light: #dcfce7;
  --danger: #dc2626;
  --danger-light: #fee2e2;
  --neutral: #64748b;
  --neutral-light: #f1f5f9;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  --radius: 0.5rem;
  --radius-sm: 0.25rem;
  --transition: all 0.3s ease;
}

body {
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  color: #0f172a;
  background-color: #f8fafc;
  line-height: 1.5;
}

.container {
  max-width: 1000px;
  margin: 2rem auto;
  padding: 1.5rem;
  background-color: white;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

/* Typography */
h1, h2, h3, h4 {
  color: #0f172a;
  font-weight: 600;
  line-height: 1.2;
  margin-bottom: 1rem;
}

h1 {
  font-size: 1.875rem;
  text-align: center;
  margin-bottom: 2rem;
}

h2 {
  font-size: 1.5rem;
  text-align: center;
  margin-bottom: 1.5rem;
  position: relative;
  padding-bottom: 0.75rem;
}

h2::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background-color: var(--primary);
  border-radius: 3px;
}

h3 {
  font-size: 1.25rem;
  margin-bottom: 1rem;
}

h4 {
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

/* User Info */
.user-info {
  text-align: center;
  padding: 0.75rem;
  margin-bottom: 1.5rem;
  border-radius: var(--radius-sm);
}

/* Form Controls */
.input-group {
  margin-bottom: 1.25rem;
}

.input-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #334155;
}

.input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: var(--radius-sm);
  background-color: white;
  color: #334155;
  font-size: 1rem;
  transition: var(--transition);
}

.input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.input::placeholder {
  color: #94a3b8;
}

input[type="number"] {
  appearance: textfield;
}

input[type="file"] {
  padding: 0.5rem 0;
}

/* Buttons */
button {
  cursor: pointer;
  font-weight: 500;
  font-size: 0.875rem;
  border-radius: var(--radius-sm);
  transition: var(--transition);
  padding: 0.625rem 1rem;
  border: none;
}

.boton-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.boton-group p {
  margin: 0;
  font-weight: 500;
  min-width: 120px;
}

.boton-group button {
  flex: 1;
  background-color: var(--neutral-light);
  color: var(--neutral);
  border: 1px solid #cbd5e1;
}

.boton-group button.activo {
  background-color: var(--primary);
  color: white;
  border-color: var(--primary);
}

.buttons-group {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.ubicacion-btn {
  flex: 1;
  background-color: var(--primary);
  color: white;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  border-radius: var(--radius-sm);
}

.ubicacion-btn:hover:not(:disabled) {
  background-color: var(--primary-dark);
}

.ubicacion-btn:disabled {
  background-color: var(--neutral);
  cursor: not-allowed;
  opacity: 0.7;
}

.agregar {
  display: block;
  width: 100%;
  background-color: var(--success);
  color: white;
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: var(--radius-sm);
  margin-top: 2rem;
  transition: var(--transition);
  text-align: center;
}

.agregar:hover:not(:disabled) {
  background-color: #15803d;
  transform: translateY(-1px);
}

.agregar:disabled {
  background-color: var(--neutral);
  cursor: not-allowed;
  opacity: 0.7;
}

.eliminar {
  background-color: var(--danger);
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
}

/* Card Sections */
.card-section {
  background-color: var(--neutral-light);
  border-radius: var(--radius);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: var(--shadow-sm);
}

.ubicacion-container, .imagen-upload {
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: var(--radius);
  padding: 1.5rem;
  margin: 1.5rem 0;
  box-shadow: var(--shadow-sm);
}

.ubicacion-info {
  background-color: var(--primary-light);
  color: var(--primary-dark);
  padding: 1rem;
  border-radius: var(--radius-sm);
  margin-top: 1rem;
  font-size: 0.875rem;
}

/* Image Upload */
.imagen-upload h3 {
  margin-top: 0;
}

.note {
  font-size: 0.875rem;
  color: var(--neutral);
  margin-bottom: 1rem;
  background-color: var(--neutral-light);
  padding: 0.75rem;
  border-radius: var(--radius-sm);
}

.hint {
  font-size: 0.75rem;
  color: var(--neutral);
  margin-top: 0.25rem;
}

.selector-imagenes {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.selector-btn {
  padding: 0.5rem 0.75rem;
  background-color: var(--neutral-light);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  border: 1px solid #cbd5e1;
}

.selector-btn.activo {
  background-color: var(--primary);
  color: white;
  border-color: var(--primary);
}

.imagen-panel {
  background-color: var(--neutral-light);
  padding: 1.25rem;
  border-radius: var(--radius-sm);
  margin-bottom: 1rem;
}

.upload-option {
  margin-bottom: 1rem;
}

.upload-option h4 {
  color: #475569;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.imagen-preview {
  margin: 1rem 0;
  background-color: white;
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 1px solid #cbd5e1;
  max-height: 250px;
}

.imagen-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  max-height: 250px;
}

.vista-miniaturas {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.miniatura {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background-color: white;
  border: 1px solid #cbd5e1;
  cursor: pointer;
  transition: var(--transition);
}

.miniatura:hover {
  border-color: var(--primary);
}

.miniatura img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.miniatura.empty {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--neutral-light);
  color: var(--neutral);
  font-size: 0.75rem;
}

/* Status Messages */
.mensaje-guardar {
  text-align: center;
  padding: 1rem;
  margin: 1rem 0;
  border-radius: var(--radius-sm);
  font-weight: 500;
}

.error-mensaje {
  color: var(--danger);
  background-color: var(--danger-light);
  padding: 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  margin: 0.5rem 0;
}

.success-mensaje {
  color: var(--success);
  background-color: var(--success-light);
  padding: 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  margin: 0.5rem 0;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .container {
    padding: 1rem;
    margin: 1rem;
  }
  
  .boton-group {
    flex-direction: column;
    align-items: stretch;
  }
  
  .boton-group p {
    margin-bottom: 0.5rem;
  }
  
  .buttons-group {
    flex-direction: column;
  }
  
  .selector-imagenes {
    flex-wrap: wrap;
  }
  
  .selector-btn {
    flex: 1;
  }
}

/* Animation */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.container {
  animation: fadeIn 0.3s ease-out;
}

/* Make it stand out more */
button:active {
  transform: scale(0.98);
}

.mensaje-guardar {
  animation: fadeIn 0.3s ease-out;
}
</style>