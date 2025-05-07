<script>
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './todolist/Dar_alta_muebles.vue'
import AboutView from './todolist/Vista_general.vue'
import Ofertas from './todolist/Offer.vue'
import login from './login.vue'
import Alquileres from './todolist/Alquileres.vue'
import User_in from './todolist/User_inmuebles.vue'
import { getAuth } from "firebase/auth"; // Importar Firebase Auth
import Ventas from './todolist/Ventas.vue'

// Crear y configurar el router
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: AboutView
    },
    {
      path: '/about',
      name: 'about',
      component: HomeView
    },
    {
      path: '/login',
      name: 'login',
      component: login
    },
    {
      path: '/Alquileres',
      name: 'Alquileres',
      component: Alquileres
    },
    {
      path: '/Ventas',
      name: '/Ventas',
      component: Ventas
    },

    {
      path: '/Ofertas',
      name: '/Ofertas',
      component: Ofertas
    },

    {
      path: '/user_in',
      name: '/user_in',
      component: User_in
    }
  ]
})
/*
// Redirección y protección de rutas
router.beforeEach((to, from) => {
  const auth = getAuth(); // Obtener la instancia de autenticación de Firebase
  const user = auth.currentUser; // Verificar si el usuario está autenticado

  /
  if ((to.path === '/login') && !user) {
    // Si no está autenticado, redirige al login
    router.push('/');
    return false;  // Esto evitará que la navegación continúe hasta que el usuario se autentique
  }else{
    return true;
  }




});
*/
export default router;
</script>
