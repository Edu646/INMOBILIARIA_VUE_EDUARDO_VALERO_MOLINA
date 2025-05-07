<script setup>
import { ref, onMounted, computed } from 'vue'
import { collection, query, where, doc, deleteDoc } from 'firebase/firestore'
import { useCollection, useFirestore } from 'vuefire'
import { getAuth, onAuthStateChanged } from 'firebase/auth'

const db = useFirestore()
const auth = getAuth()
const currentUser = ref(null)
const loading = ref(true)
const errorMessage = ref('')
const mostrarMensajeEliminado = ref(false)
const mensajeEliminado = ref('')

// Configurar listener para el estado de autenticación
onMounted(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    currentUser.value = user
    loading.value = false
    console.log("Estado de autenticación cambiado:", user ? user.email : "No autenticado")
  })

  // Limpiar el listener cuando el componente se desmonte
  return () => unsubscribe()
})

// Referencia reactiva para la consulta de Firestore
const inmueblesQuery = computed(() => {
  if (!currentUser.value) return null
  
  const inmueblesRef = collection(db, "INMUEBLES")
  return query(inmueblesRef, where("userId", "==", currentUser.value.uid))
})

// Usar useCollection con la consulta reactiva
const { data: inmuebles, error } = useCollection(inmueblesQuery)

// Manejar errores de la consulta
const errorFirestore = computed(() => {
  if (error.value) {
    console.error("Error de Firestore:", error.value)
    return `Error al cargar los inmuebles: ${error.value.message}`
  }
  return null
})

// Función para mostrar el tipo de operación (alquiler/venta)
const getTipoOperacion = (inmueble) => {
  if (inmueble.rent && !inmueble.sell) return 'Alquiler'
  if (!inmueble.rent && inmueble.sell) return 'Venta'
  return 'Alquiler/Venta'
}

// Función para formatear el precio
const formatearPrecio = (precio) => {
  return new Intl.NumberFormat('es-ES', { 
    style: 'currency', 
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(precio)
}

// Función para eliminar inmueble
const eliminarInmueble = async (id) => {
  if (!currentUser.value) {
    errorMessage.value = "No hay usuario autenticado para eliminar inmuebles"
    return
  }
  
  try {
    const inmuebleRef = doc(db, "INMUEBLES", id)
    
    await deleteDoc(inmuebleRef)
    
    // Mostrar mensaje de éxito
    mensajeEliminado.value = "Inmueble eliminado correctamente"
    mostrarMensajeEliminado.value = true
    
    // Ocultar el mensaje después de 3 segundos
    setTimeout(() => {
      mostrarMensajeEliminado.value = false
    }, 3000)
    
  } catch (error) {
    console.error("Error al eliminar el inmueble:", error)
    errorMessage.value = `Error al eliminar el inmueble: ${error.message}`
  }
}
</script>

<template>
  <div class="mis-inmuebles-container">
    <h2 class="inmuebles-titulo">Mis Inmuebles</h2>
    
    <!-- Mensaje de depuración -->
    <div class="debug-info">
      <p>Estado de autenticación: {{ currentUser ? 'Autenticado' : 'No autenticado' }}</p>
      <p v-if="currentUser">Usuario: {{ currentUser.email }}</p>
      <p>Inmuebles cargados: {{ inmuebles ? inmuebles.length : 0 }}</p>
    </div>
    
    <!-- Mensaje de carga -->
    <div v-if="loading" class="mensaje-carga">
      Cargando tus inmuebles...
    </div>
    
    <!-- Mensaje de error -->
    <div v-if="errorMessage || errorFirestore" class="error-mensaje">
      {{ errorMessage || errorFirestore }}
    </div>
    
    <!-- Mensaje de no autenticado -->
    <div v-if="!loading && !currentUser" class="no-autenticado">
      <p>Debes iniciar sesión para ver tus inmuebles.</p>
    </div>
    
    <!-- Mensaje de éxito al eliminar -->
    <div v-if="mostrarMensajeEliminado" class="success-mensaje mensaje-animado">
      {{ mensajeEliminado }}
    </div>
    
    <!-- Contenido principal -->
    <div v-if="!loading && currentUser">
      <!-- Sin inmuebles -->
      <div v-if="!inmuebles || inmuebles.length === 0" class="sin-inmuebles">
        <p>No tienes inmuebles publicados.</p>
        <p>¡Añade tu primer inmueble usando el formulario de creación!</p>
      </div>
      
      <!-- Lista de inmuebles -->
      <div v-else class="lista-inmuebles">
        <div class="inmuebles-resumen">
          <p>{{ inmuebles.length }} inmueble(s) publicado(s)</p>
        </div>
        
        <div class="inmuebles-grid">
          <div v-for="inmueble in inmuebles" :key="inmueble.id" class="inmueble-card">
            <div class="inmueble-imagen">
              <img v-if="inmueble.imageURLs && inmueble.imageURLs.length > 0" 
                   :src="inmueble.imageURLs[0]" 
                   :alt="inmueble.name"
                   @error="e => e.target.src = '/img/placeholder-inmueble.jpg'"
              />
              <div v-else class="imagen-placeholder">
                Sin imagen
              </div>
              
              <div class="inmueble-badges">
                <span class="badge" :class="inmueble.rent ? 'badge-alquiler' : 'badge-venta'">
                  {{ getTipoOperacion(inmueble) }}
                </span>
                <span v-if="inmueble.offer" class="badge badge-oferta">Oferta</span>
              </div>
            </div>
            
            <div class="inmueble-info">
              <h3 class="inmueble-titulo">{{ inmueble.name }}</h3>
              
              <p class="inmueble-precio">
                <span v-if="inmueble.offer" class="precio-tachado">
                  {{ formatearPrecio(inmueble.Regular_Price) }}
                </span>
                <span class="precio-actual">
                  {{ formatearPrecio(inmueble.offer ? (inmueble.Regular_Price - inmueble.Discounted_Price) : inmueble.Regular_Price) }}
                  <span class="precio-periodo">{{ inmueble.rent ? '/mes' : '' }}</span>
                </span>
              </p>
              
              <div class="inmueble-direccion">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icono-direccion">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <span>{{ inmueble.direccion || 'Dirección no disponible' }}</span>
              </div>
              
              <div class="inmueble-detalles">
                <div class="detalle">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="detalle-icono">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                  </svg>
                  <span>{{ inmueble.Bedroom }} Dorm.</span>
                </div>
                
                <div class="detalle">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="detalle-icono">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{{ inmueble.Bathroom }} Baños</span>
                </div>
                
                <div v-if="inmueble.Parking_Spot" class="detalle">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="detalle-icono">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                  <span>Parking</span>
                </div>
              </div>
              
              <div class="inmueble-fecha">
                <span>Publicado: {{ new Date(inmueble.timestamp).toLocaleDateString() }}</span>
              </div>
              
              <div class="inmueble-acciones">
                <button @click="eliminarInmueble(inmueble.id)" class="boton-eliminar">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="accion-icono">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                  Eliminar
                </button>
                
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mis-inmuebles-container {
  margin: 2rem 0;
  padding: 1.5rem;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Información de depuración */
.debug-info {
  background-color: #f8fafc;
  border: 1px dashed #cbd5e1;
  padding: 0.75rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  border-radius: 0.25rem;
}

.debug-info p {
  margin: 0.25rem 0;
}

.inmuebles-titulo {
  font-size: 1.5rem;
  text-align: center;
  margin-bottom: 1.5rem;
  position: relative;
  padding-bottom: 0.75rem;
}

.inmuebles-titulo::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background-color: #2563eb;
  border-radius: 3px;
}

.mensaje-carga {
  text-align: center;
  padding: 2rem;
  color: #64748b;
  font-weight: 500;
}

.error-mensaje {
  color: #dc2626;
  background-color: #fee2e2;
  padding: 0.75rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  margin: 1rem 0;
}

.success-mensaje {
  color: #16a34a;
  background-color: #dcfce7;
  padding: 0.75rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  margin: 1rem 0;
}

.mensaje-animado {
  animation: fadeIn 0.3s ease-out;
}

.no-autenticado {
  text-align: center;
  padding: 2rem;
  background-color: #f8fafc;
  border-radius: 0.5rem;
  border: 1px dashed #cbd5e1;
}

.sin-inmuebles {
  text-align: center;
  padding: 2rem;
  background-color: #f8fafc;
  border-radius: 0.5rem;
  border: 1px dashed #cbd5e1;
}

.inmuebles-resumen {
  margin-bottom: 1rem;
  font-weight: 500;
  color: #334155;
}

.inmuebles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.inmueble-card {
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  background-color: white;
  border: 1px solid #e2e8f0;
}

.inmueble-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.inmueble-imagen {
  height: 200px;
  position: relative;
  overflow: hidden;
}

.inmueble-imagen img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.inmueble-card:hover .inmueble-imagen img {
  transform: scale(1.05);
}

.imagen-placeholder {
  width: 100%;
  height: 100%;
  background-color: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-weight: 500;
}

.inmueble-badges {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.badge-alquiler {
  background-color: #2563eb;
  color: white;
}

.badge-venta {
  background-color: #16a34a;
  color: white;
}

.badge-oferta {
  background-color: #dc2626;
  color: white;
}

.inmueble-info {
  padding: 1rem;
}

.inmueble-titulo {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.3;
}

.inmueble-precio {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.precio-tachado {
  text-decoration: line-through;
  color: #64748b;
  font-size: 0.875rem;
}

.precio-actual {
  font-weight: 700;
  color: #334155;
  font-size: 1.125rem;
}

.precio-periodo {
  font-weight: 400;
  font-size: 0.875rem;
  color: #64748b;
}

.inmueble-direccion {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  color: #64748b;
}

.icono-direccion {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.inmueble-detalles {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.detalle {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #334155;
}

.detalle-icono {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
}

.inmueble-fecha {
  font-size: 0.75rem;
  color: #64748b;
  margin-bottom: 1rem;
}

.inmueble-acciones {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.boton-eliminar, .boton-editar {
  padding: 0.5rem 0.75rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex: 1;
  justify-content: center;
  transition: all 0.3s ease;
}

.boton-eliminar {
  background-color: #dc2626;
  color: white;
  border: none;
}

.boton-eliminar:hover {
  background-color: #b91c1c;
}

.boton-editar {
  background-color: #2563eb;
  color: white;
  border: none;
}

.boton-editar:hover {
  background-color: #1d4ed8;
}

.accion-icono {
  width: 0.875rem;
  height: 0.875rem;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
  .inmuebles-grid {
    grid-template-columns: 1fr;
  }
  
  .inmueble-imagen {
    height: 160px;
  }
}
</style>