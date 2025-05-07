<script setup lang="ts">
import Mostrar_los_inmuebeles_dados_de_alta from './Mostrar_los_inmuebeles_dados_de_alta.vue';

</script>

<template>
  <div class="app-container">
    <main>
      <div class="main-content">
        <h1 class="categories-title">Categories</h1>
        
        <div class="categories-container">
          <RouterLink to="/Alquileres" class="category-card" :class="{ active: $route.path === '/Alquileres' }">
            <div class="card-image">
              <img src="../icons/img/anuncio-de-casa-en-renta.png" alt="Places for rent">
            </div>
            <div class="card-title">Places for rent</div>
          </RouterLink>
          
          <RouterLink to="/Ventas" class="category-card" :class="{ active: $route.path === '/Ventas' }">
            <div class="card-image">
              <img src="../icons/img/41777-54449133-1406720178.jpg" alt="Places for sale">
            </div>
            <div class="card-title">Places for sale</div>
          </RouterLink>
        </div>
        
        <div class="content-view">
          <Mostrar_los_inmuebeles_dados_de_alta>
            titulo="Últimos inmuebles publicados" 
            :cantidadMostrar="5"
          </Mostrar_los_inmuebeles_dados_de_alta>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  font-family: 'Poppins', 'Arial', sans-serif;
  background-color: #f5f7fa;
  padding: 20px;
}

main {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  padding: 20px;
}

.main-content {
  width: 100%;
  max-width: 1200px;
}

.categories-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 24px;
  color: #1a2533;
}

.categories-container {
  display: flex;
  gap: 24px;
  margin-bottom: 40px;
  flex-wrap: wrap;
}

.category-card {
  width: calc(50% - 12px);
  max-width: 600px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-decoration: none;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: relative;
  cursor: pointer;
}

.category-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
}

.card-image {
  width: 100%;
  height: 230px;
  overflow: hidden;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.category-card:hover .card-image img {
  transform: scale(1.05);
}

.card-title {
  padding: 16px 20px;
  font-size: 18px;
  font-weight: 500;
  color: #2c3e50;
  background-color: #fff;
}

.content-view {
  margin-top: 30px;
  padding: 30px;
  background-color: #ffffff;
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
}

/* Responsive styles */
@media (max-width: 768px) {
  .categories-container {
    flex-direction: column;
  }
  
  .category-card {
    width: 100%;
    max-width: none;
  }
}
</style>