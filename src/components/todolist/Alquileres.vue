<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { collection } from 'firebase/firestore';
import { useCollection, useFirestore } from 'vuefire';
import 'leaflet/dist/leaflet.css';

const db = useFirestore();
const inmueblesRef = collection(db, "INMUEBLES");
const listaInmueblesCompleta = useCollection(inmueblesRef);

const listaInmuebles = computed(() => {
  return listaInmueblesCompleta.value.filter(inmueble => inmueble.rent === true);
});

const inmuebleSeleccionado = ref(null);
const mapas = ref({});
const verDetalle = ref(false);

function formatearPrecio(precio) {
  return new Intl.NumberFormat('es-ES', { 
    style: 'currency', 
    currency: 'EUR',
    minimumFractionDigits: 0 
  }).format(precio);
}

function calcularPrecioConDescuento(regularPrice, discountPrice) {
  if (!regularPrice || !discountPrice) return regularPrice;
  return regularPrice - discountPrice;
}

function mostrarDetalle(inmueble) {
  inmuebleSeleccionado.value = inmueble;
  verDetalle.value = true;
  
  setTimeout(() => {
    inicializarMapa(inmueble);
  }, 100);
}

function cerrarDetalle() {
  verDetalle.value = false;
  inmuebleSeleccionado.value = null;
}

function inicializarMapa(inmueble) {
  if (!inmueble || !inmueble.location || !inmueble.location.lat || !inmueble.location.lng) {
    return;
  }

  const mapId = `mapa-${inmueble.id}`;
  const mapContainer = document.getElementById(mapId);
  
  if (!mapContainer) return;
  
  if (!window.L) {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';
    document.head.appendChild(script);
    
    script.onload = () => {
      cargarMapa(inmueble, mapId);
    };
  } else {
    cargarMapa(inmueble, mapId);
  }
}

function cargarMapa(inmueble, mapId) {
  if (mapas.value[mapId]) {
    mapas.value[mapId].remove();
  }
  
  const mapa = L.map(mapId).setView(
    [inmueble.location.lat, inmueble.location.lng], 
    15
  );
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(mapa);
  
  L.marker([inmueble.location.lat, inmueble.location.lng])
    .addTo(mapa)
    .bindPopup(inmueble.name || 'Inmueble')
    .openPopup();

  mapas.value[mapId] = mapa;
}

onUnmounted(() => {
  Object.values(mapas.value).forEach(mapa => {
    if (mapa) mapa.remove();
  });
});
</script>

<template>
  <div class="inmuebles-container">
    <h2>Listado de Inmuebles en Alquiler</h2>
    
    <!-- Vista de lista de inmuebles -->
    <div v-if="!verDetalle" class="inmuebles-grid">
      <div v-if="listaInmuebles.length === 0" class="no-inmuebles">
        No hay inmuebles en alquiler disponibles
      </div>
      
      <div v-for="inmueble in listaInmuebles" :key="inmueble.id" class="inmueble-card">
        <div class="imagen-principal">
          <img 
            v-if="inmueble.imageURLs && inmueble.imageURLs.length > 0" 
            :src="inmueble.imageURLs[0]" 
            alt="Imagen principal"
            @error="$event.target.src = 'https://via.placeholder.com/300x200?text=No+Imagen'"
          />
          <img 
            v-else 
            src="https://via.placeholder.com/300x200?text=No+Imagen" 
            alt="Sin imagen disponible" 
          />
        </div>
        
        <div class="inmueble-info">
          <h3>{{ inmueble.name }}</h3>
          
          <div class="etiquetas">
            <span class="etiqueta alquiler">Alquiler</span>
            <span v-if="inmueble.offer" class="etiqueta oferta">Oferta</span>
          </div>
          
          <div class="caracteristicas">
            <span><i class="icon-bed"></i> {{ inmueble.Bedroom }} dorm.</span>
            <span><i class="icon-bath"></i> {{ inmueble.Bathroom }} baños</span>
            <span v-if="inmueble.Parking_Spot"><i class="icon-parking"></i> Parking</span>
          </div>
          
          <div class="precio-info">
            <span v-if="inmueble.offer" class="precio-original">
              {{ formatearPrecio(inmueble.Regular_Price) }}
            </span>
            <span class="precio-final">
              {{ formatearPrecio(inmueble.offer ? calcularPrecioConDescuento(inmueble.Regular_Price, inmueble.Discounted_Price) : inmueble.Regular_Price) }}
            </span>
            <span class="periodo">/ mes</span>
          </div>
          
          <div class="ubicacion-breve" v-if="inmueble.direccion">
            <i class="icon-location"></i> {{ inmueble.direccion }}
          </div>
          
          <button @click="mostrarDetalle(inmueble)" class="btn-detalle">
            Ver detalles
          </button>
        </div>
      </div>
    </div>
    
    <!-- Vista de detalle de inmueble -->
    <div v-if="verDetalle && inmuebleSeleccionado" class="detalle-inmueble">
      <button @click="cerrarDetalle" class="btn-volver">← Volver al listado</button>
      
      <h2>{{ inmuebleSeleccionado.name }}</h2>
      
      <div class="galeria-imagenes">
        <div class="imagen-principal">
          <img 
            v-if="inmuebleSeleccionado.imageURLs && inmuebleSeleccionado.imageURLs.length > 0" 
            :src="inmuebleSeleccionado.imageURLs[0]"
            alt="Imagen principal"
            @error="$event.target.src = 'https://via.placeholder.com/600x400?text=No+Imagen'"
          />
          <img 
            v-else 
            src="https://via.placeholder.com/600x400?text=No+Imagen" 
            alt="Sin imagen disponible" 
          />
        </div>
        
        <div class="miniaturas" v-if="inmuebleSeleccionado.imageURLs && inmuebleSeleccionado.imageURLs.length > 1">
          <div 
            v-for="(imagen, index) in inmuebleSeleccionado.imageURLs.slice(1)" 
            :key="index" 
            class="miniatura"
          >
            <img 
              :src="imagen" 
              alt="Imagen adicional"
              @error="$event.target.src = 'https://via.placeholder.com/100x100?text=Error'"
            />
          </div>
        </div>
      </div>
      
      <div class="info-detalle">
        <div class="seccion-precio">
          <div class="etiquetas">
            <span class="etiqueta alquiler">Alquiler</span>
            <span v-if="inmuebleSeleccionado.offer" class="etiqueta oferta">Oferta</span>
          </div>
          
          <div class="precio-info">
            <span v-if="inmuebleSeleccionado.offer" class="precio-original">
              {{ formatearPrecio(inmuebleSeleccionado.Regular_Price) }}
            </span>
            <span class="precio-final">
              {{ formatearPrecio(inmuebleSeleccionado.offer ? calcularPrecioConDescuento(inmuebleSeleccionado.Regular_Price, inmuebleSeleccionado.Discounted_Price) : inmuebleSeleccionado.Regular_Price) }}
            </span>
            <span class="periodo">/ mes</span>
          </div>
        </div>
        
        <div class="caracteristicas-detalle">
          <div class="caracteristica">
            <i class="icon-bed"></i> 
            <span>{{ inmuebleSeleccionado.Bedroom }} dormitorios</span>
          </div>
          <div class="caracteristica">
            <i class="icon-bath"></i> 
            <span>{{ inmuebleSeleccionado.Bathroom }} baños</span>
          </div>
          <div class="caracteristica" v-if="inmuebleSeleccionado.Parking_Spot">
            <i class="icon-parking"></i> 
            <span>Incluye plaza de parking</span>
          </div>
        </div>
        
        <div class="ubicacion-detalle">
          <h3>Ubicación</h3>
          <p v-if="inmuebleSeleccionado.direccion">{{ inmuebleSeleccionado.direccion }}</p>
          
          <!-- Contenedor para el mapa -->
          <div 
            :id="`mapa-${inmuebleSeleccionado.id}`" 
            class="mapa-container"
            v-if="inmuebleSeleccionado.location && inmuebleSeleccionado.location.lat && inmuebleSeleccionado.location.lng"
          ></div>
          <p v-else class="sin-ubicacion">No hay información de ubicación disponible</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.inmuebles-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.inmuebles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.no-inmuebles {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px;
  background-color: #f5f5f5;
  border-radius: 8px;
  font-size: 18px;
  color: #666;
}

.inmueble-card {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
  background-color: white;
}

.inmueble-card:hover {
  transform: translateY(-5px);
}

.imagen-principal {
  height: 200px;
  overflow: hidden;
}

.imagen-principal img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.inmueble-card:hover .imagen-principal img {
  transform: scale(1.05);
}

.inmueble-info {
  padding: 15px;
}

.inmueble-info h3 {
  margin: 0 0 10px;
  font-size: 18px;
  color: #333;
}

.etiquetas {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.etiqueta {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: bold;
}

.alquiler {
  background-color: #e3f2fd;
  color: #1976d2;
}

.venta {
  background-color: #e8f5e9;
  color: #388e3c;
}

.oferta {
  background-color: #fff8e1;
  color: #ff8f00;
}

.caracteristicas {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  font-size: 14px;
  color: #666;
}

.precio-info {
  display: flex;
  align-items: baseline;
  margin-bottom: 10px;
}

.precio-original {
  text-decoration: line-through;
  color: #888;
  font-size: 14px;
  margin-right: 8px;
}

.precio-final {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.periodo {
  font-size: 14px;
  color: #666;
  margin-left: 4px;
}

.ubicacion-breve {
  font-size: 14px;
  color: #666;
  margin-bottom: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-detalle {
  width: 100%;
  padding: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;
}

.btn-detalle:hover {
  background-color: #0056b3;
}

/* Estilos para la vista de detalle */
.detalle-inmueble {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.btn-volver {
  background-color: transparent;
  border: none;
  color: #007bff;
  font-size: 16px;
  cursor: pointer;
  padding: 5px 0;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
}

.btn-volver:hover {
  text-decoration: underline;
}

.galeria-imagenes {
  margin-bottom: 20px;
}

.galeria-imagenes .imagen-principal {
  height: 400px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 10px;
}

.miniaturas {
  display: flex;
  gap: 10px;
  overflow-x: auto;
}

.miniatura {
  width: 100px;
  height: 100px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
}

.miniatura img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info-detalle {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

@media (min-width: 768px) {
  .info-detalle {
    grid-template-columns: 1fr 1fr;
  }
  
  .ubicacion-detalle {
    grid-column: 1 / -1;
  }
}

.seccion-precio {
  margin-bottom: 20px;
}

.caracteristicas-detalle {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
}

.caracteristica {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
}

.ubicacion-detalle h3 {
  margin-top: 0;
  margin-bottom: 10px;
}

.mapa-container {
  height: 300px;
  border-radius: 8px;
  overflow: hidden;
  margin-top: 10px;
}

.sin-ubicacion {
  background-color: #f5f5f5;
  padding: 20px;
  text-align: center;
  border-radius: 4px;
  color: #666;
}


.icon-bed:before {
  content: "🛏️";
}

.icon-bath:before {
  content: "🚿";
}

.icon-parking:before {
  content: "🅿️";
}

.icon-location:before {
  content: "📍";
}
</style>