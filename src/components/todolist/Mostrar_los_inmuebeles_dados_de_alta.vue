<script setup>
import { ref, computed, onMounted } from 'vue'
import { collection, query, orderBy, limit } from 'firebase/firestore'
import { useCollection, useFirestore } from 'vuefire'

const db = useFirestore()


const props = defineProps({
  titulo: {
    type: String,
    default: 'Inmuebles Destacados'
  },
  cantidadMostrar: {
    type: Number,
    default: 5
  }
})


const inmueblesQuery = query(
  collection(db, "INMUEBLES"),
  orderBy("timestamp", "desc"),
  limit(props.cantidadMostrar)
)

const inmueblesList = useCollection(inmueblesQuery)


const indiceActivo = ref(0)
const mostrarAnterior = ref(false)
const mostrarSiguiente = ref(true)

const calcularPrecioFinal = (inmueble) => {
  if (inmueble.offer && inmueble.Discounted_Price) {
    return inmueble.Regular_Price - inmueble.Discounted_Price
  }
  return inmueble.Regular_Price
}


const formatearPrecio = (precio) => {
  return precio.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

const avanzarCarrusel = () => {
  if (indiceActivo.value < inmueblesList.value.length - 1) {
    indiceActivo.value++
    actualizarBotones()
  }
}

const retrocederCarrusel = () => {
  if (indiceActivo.value > 0) {
    indiceActivo.value--
    actualizarBotones()
  }
}

const irAInmueble = (index) => {
  indiceActivo.value = index
  actualizarBotones()
}

const actualizarBotones = () => {
  mostrarAnterior.value = indiceActivo.value > 0
  mostrarSiguiente.value = indiceActivo.value < inmueblesList.value.length - 1
}

// Comprobar si hay imagenes disponibles
const obtenerImagenUrl = (inmueble) => {
  if (inmueble.imageURLs && inmueble.imageURLs.length > 0) {
    return inmueble.imageURLs[0]
  }
  return '/api/placeholder/400/300'
}


onMounted(() => {
  actualizarBotones()
})


const estiloTarjeta = (index) => {
  const diferencia = index - indiceActivo.value
  
  if (diferencia === 0) {
    return { transform: 'scale(1)', opacity: 1, zIndex: 20 }
  } else if (Math.abs(diferencia) === 1) {
    const escala = 0.85
    const opacidad = 0.7
    const traslacion = diferencia * 95 + '%'
    
    return {
      transform: `translateX(${traslacion}) scale(${escala})`,
      opacity: opacidad,
      zIndex: 10
    }
  } else {
    const escala = 0.7
    const opacidad = 0.5
    const traslacion = diferencia * 105 + '%'
    
    return {
      transform: `translateX(${traslacion}) scale(${escala})`,
      opacity: opacidad,
      zIndex: 5
    }
  }
}
</script>

<template>
  <div class="carrusel-container">
    <h2 class="carrusel-titulo">{{ titulo }}</h2>
    
    <div v-if="inmueblesList.length === 0" class="carrusel-vacio">
      <p>No hay inmuebles disponibles para mostrar</p>
    </div>
    
    <div v-else class="carrusel-wrapper">
      <!-- Botón Anterior -->
      <button 
        @click="retrocederCarrusel" 
        class="carrusel-nav-btn carrusel-prev" 
        :class="{ 'carrusel-nav-inactive': !mostrarAnterior }"
        :disabled="!mostrarAnterior"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      
      <!-- Contenedor de Tarjetas -->
      <div class="carrusel-items-container">
        <div 
          v-for="(inmueble, index) in inmueblesList" 
          :key="inmueble.id"
          class="carrusel-item"
          :style="estiloTarjeta(index)"
          @click="irAInmueble(index)"
        >
          <div class="inmueble-imagen-container">
            <img :src="obtenerImagenUrl(inmueble)" alt="Imagen del inmueble" class="inmueble-imagen" />
            <div class="inmueble-badges">
              <span v-if="inmueble.rent" class="badge badge-rent">Alquiler</span>
              <span v-else class="badge badge-sell">Venta</span>
              <span v-if="inmueble.offer" class="badge badge-offer">Oferta</span>
            </div>
          </div>
          
          <div class="inmueble-info">
            <h3 class="inmueble-nombre">{{ inmueble.name }}</h3>
            
            <div class="inmueble-precio">
              <span class="precio-actual">{{ formatearPrecio(calcularPrecioFinal(inmueble)) }} €</span>
              <span v-if="inmueble.offer" class="precio-original">{{ formatearPrecio(inmueble.Regular_Price) }} €</span>
            </div>
            
            <div class="inmueble-detalles">
              <div class="detalle">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="detalle-icono">
                  <path d="M3 22v-8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8"></path>
                  <path d="M5 10V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4"></path>
                </svg>
                <span>{{ inmueble.Bedroom }} hab.</span>
              </div>
              
              <div class="detalle">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="detalle-icono">
                  <path d="M9 6H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1z"></path>
                  <path d="M21 6h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1z"></path>
                  <path d="M7 14h10v4a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-4"></path>
                </svg>
                <span>{{ inmueble.Bathroom }} baños</span>
              </div>
              
              <div v-if="inmueble.Parking_Spot" class="detalle">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="detalle-icono">
                  <rect x="4" y="4" width="16" height="16" rx="2"></rect>
                  <path d="M9 8h4a2 2 0 0 1 2 2v8"></path>
                  <path d="M9 16h4"></path>
                </svg>
                <span>Parking</span>
              </div>
            </div>
            
            <p class="inmueble-direccion" v-if="inmueble.direccion">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="detalle-icono-direccion">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              {{ inmueble.direccion }}
            </p>
          </div>
        </div>
      </div>
      
      <!-- Botón Siguiente -->
      <button 
        @click="avanzarCarrusel" 
        class="carrusel-nav-btn carrusel-next" 
        :class="{ 'carrusel-nav-inactive': !mostrarSiguiente }"
        :disabled="!mostrarSiguiente"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
    </div>
    
    <!-- Indicadores de posición -->
    <div class="carrusel-indicadores" v-if="inmueblesList.length > 0">
      <button 
        v-for="(inmueble, index) in inmueblesList" 
        :key="inmueble.id"
        @click="irAInmueble(index)" 
        class="indicador-punto"
        :class="{ 'indicador-activo': index === indiceActivo }"
      ></button>
    </div>
  </div>
</template>
<style scoped>
.carrusel-container {
  max-width: 100%;
  margin: auto;
  padding: 2rem 1rem;
  position: relative;
  overflow: hidden;
}

.carrusel-titulo {
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  text-align: center;
}

.carrusel-wrapper {
  display: flex;
  align-items: center;
  position: relative;
}

.carrusel-items-container {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  flex: 1;
  overflow: hidden;
  height: 400px;
}

.carrusel-item {
  transition: transform 0.5s ease, opacity 0.5s ease;
  position: absolute;
  width: 80%;
  max-width: 500px;
  cursor: pointer;
  border-radius: 1rem;
  background-color: white;
  box-shadow: 0 10px 20px rgba(0,0,0,0.15);
}

.inmueble-imagen-container {
  position: relative;
  width: 100%;
  height: 220px;
  overflow: hidden;
  border-top-left-radius: 1rem;
  border-top-right-radius: 1rem;
}

.inmueble-imagen {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.inmueble-badges {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.badge {
  background-color: #333;
  color: white;
  padding: 0.3rem 0.6rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: bold;
}

.badge-rent {
  background-color: #4a90e2;
}

.badge-sell {
  background-color: #27ae60;
}

.badge-offer {
  background-color: #e74c3c;
}

.inmueble-info {
  padding: 1rem;
}

.inmueble-nombre {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.inmueble-precio {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.5rem;
}

.precio-actual {
  font-size: 1.1rem;
  color: #2c3e50;
  font-weight: bold;
}

.precio-original {
  font-size: 0.95rem;
  color: #999;
  text-decoration: line-through;
}

.inmueble-detalles {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
}

.detalle {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.detalle-icono {
  width: 16px;
  height: 16px;
}

.inmueble-direccion {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: #555;
  margin-top: 0.5rem;
}

.detalle-icono-direccion {
  width: 16px;
  height: 16px;
}

.carrusel-nav-btn {
  background: white;
  border: none;
  padding: 0.5rem;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 25;
}

.carrusel-prev {
  margin-right: 1rem;
}

.carrusel-next {
  margin-left: 1rem;
}

.carrusel-nav-inactive {
  opacity: 0.3;
  cursor: not-allowed;
}

.carrusel-indicadores {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
  gap: 0.5rem;
}

.indicador-punto {
  width: 12px;
  height: 12px;
  background-color: #ccc;
  border-radius: 50%;
  border: none;
  transition: background-color 0.3s ease;
}

.indicador-activo {
  background-color: #333;
}

.carrusel-vacio {
  text-align: center;
  font-style: italic;
  color: #666;
  padding: 2rem;
}
</style>
