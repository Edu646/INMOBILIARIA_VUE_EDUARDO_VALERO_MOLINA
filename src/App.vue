<template>
  <div class="app-container">
    <main>
      <div class="main-content">
        <RouterView />
      </div>
    </main>
    
    <nav class="navbar">
      <div class="nav-links">
        <RouterLink to="/" class="nav-item" :class="{ active: $route.path === '/' }">
          <font-awesome-icon :icon="['fas', 'compass']" />
          <span>Explore</span>
        </RouterLink>
        <RouterLink to="/Ofertas" class="nav-item" :class="{ active: $route.path === '/Ofertas' }">
          <font-awesome-icon :icon="['fas', 'tag']" />
          <span>Offers</span>
        </RouterLink>
        <RouterLink to="/login" class="nav-item" :class="{ active: $route.path === '/login' }">
          <font-awesome-icon :icon="['fas', 'user']" />
          <span>Profile</span>
        </RouterLink>
      </div>
    </nav>
  </div>
</template>

<style scoped>
/* App Container */
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f4f7f9;
  color: #333;
  padding-bottom: 60px;
}

/* Navbar (Fijada abajo) */
.navbar {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 15px 0;
  background-color: #fff;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

/* Links de navegación */
.nav-links {
  display: flex;
  gap: 250px;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 25px;
  color: #888;
  text-decoration: none;
  padding: 10px;
  transition: color 0.3s ease, border-bottom 0.3s ease;
  border-bottom: 3px solid transparent;
}

.nav-item:hover {
  color: #007bff;
}

.nav-item.active {
  color: #000;
  border-bottom: 3px solid #000;
}

.nav-item .fa-icon {
  font-size: 20px;
}

/* Responsive */
@media (max-width: 768px) {
  .nav-links {
    gap: 20px;
  }
}
</style>