

<script>
import { ref } from "vue";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, signInWithPopup } from "firebase/auth";
import { firebaseConfig, googleAuthProvider } from "../firebase.js";
import router from "./router.vue";


// Inicializar Firebase
const app = getAuth();

export default {
  setup() {
    const email = ref("");
    const password = ref("");
    const isLogin = ref(true);
    const error = ref("");
    const user = ref(null);

    // Verificar el estado del usuario en Firebase
    app.onAuthStateChanged((currentUser) => {
      user.value = currentUser;
      if (currentUser) {
        // Mostrar ID del usuario en la consola
        console.log("ID del usuario:", currentUser.uid);
      }
    });

    const handleAuth = () => {
      error.value = "";
      if (isLogin.value) {
        signInWithEmailAndPassword(app, email.value, password.value)
          .then((userCredential) => {
            // Mostrar ID del usuario en la consola después de iniciar sesión
            console.log("ID del usuario:", userCredential.user.uid);
          })
          .catch((err) => {
            error.value = err.message;
          });
      } else {
        createUserWithEmailAndPassword(app, email.value, password.value)
          .then((userCredential) => {
            // Mostrar ID del usuario en la consola después de registrarse
            console.log("ID del usuario:", userCredential.user.uid);
          })
          .catch((err) => {
            error.value = err.message;
          });
      }
    };

    // Función para iniciar sesión con Google
    const handleGoogleSignIn = () => {
      signInWithPopup(app, googleAuthProvider)
        .then((result) => {
          // Mostrar ID del usuario en la consola después de iniciar sesión con Google
          console.log("ID del usuario de Google:", result.user.uid);
        })
        .catch((err) => {
          error.value = err.message;
        });
    };

    // Función para cerrar sesión
    const handleLogout = () => {
      signOut(app)
        .catch((err) => {
          console.error("Error al cerrar sesión:", err);
        });
    };

    return { email, password, isLogin, error, user, handleAuth, handleLogout, handleGoogleSignIn };
  },
};
</script>
<template>
  <div>
    <h2>{{ isLogin ? "WELCOM BACK!!" : "Registrarse" }}</h2>
    <form @submit.prevent="handleAuth" v-if="!user">
      <!-- Campo de Email -->
      <div class="input-container">
        <font-awesome-icon :icon="['fas', 'user']" class="input-icon-right" />
        <input v-model="email" type="email" placeholder="Correo Electrónico" required />
      </div>

      <!-- Campo de Contraseña -->
      <div class="input-container">
        <font-awesome-icon :icon="['fas', 'lock']" class="input-icon-right" />
        <input v-model="password" type="password" placeholder="Contraseña" required />
      </div>
      <p v-if="error" style="color: red">{{ error }}</p>
      <button type="submit">{{ isLogin ? "Iniciar Sesión" : "Registrarse" }}</button>
    </form>

    <!-- Mostrar nombre del usuario, enlace y botón de cierre de sesión si está autenticado -->
    <div v-else>
      <p>Bienvenido, {{ user.displayName || user.email }}!</p>
      <a href="/about" class="dashboard-link">dar de alta</a>
      <a href="/user_in" class="dashboard-link">ver inmuebles</a>
      <button @click="handleLogout">Cerrar sesión</button>
    </div>

    <button @click="isLogin = !isLogin" v-if="!user">
      {{ isLogin ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión " }}
    </button>

    <!-- Botón para iniciar sesión con Google -->
    <button class="google" @click="handleGoogleSignIn" v-if="!user">
      <img src="data:image/png;base64,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" alt="google-logo">
    </button>
  </div>
</template>
<style scoped>
/* Estilos generales del contenedor */
div {
  width: auto;
  margin: 0 auto;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
  font-family: 'Roboto', sans-serif;
}

/* Títulos */
h2 {
  font-size: 1.8rem;
  color: #2c3e50;
  margin-bottom: 25px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* Contenedor de inputs */
.input-container {
  position: relative;
  margin: 20px 0;
  width: 50%;
  background-color: transparent;
}

/* Campos de formulario */
input {
  width: 100%;
  padding: 15px 20px;
  padding-right: 45px; /* Espacio para el icono */
  margin: 8px 0;
  border-radius: 30px;
  border: 1px solid #e0e0e0;
  font-size: 1rem;
  box-sizing: border-box;
  background-color: #f9f9f9;
  transition: all 0.3s ease;
}

input[type="email"]:focus,
input[type="password"]:focus {
  border-color: #4CAF50;
  background-color: #ffffff;
  box-shadow: 0 0 8px rgba(76, 175, 80, 0.3);
  outline: none;
}

/* Estilos para iconos a la derecha del input */
.input-icon-right {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #7f8c8d;
}

/* Mensaje de error */
p {
  margin: 10px 0;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

p[style] {
  color: #e74c3c !important;
  font-weight: 500;
  padding: 8px;
  background-color: rgba(231, 76, 60, 0.1);
  border-radius: 6px;
}

/* Botones */
button {
  width: 25%;
  padding: 14px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 30px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin: 15px 0;
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 6px rgba(76, 175, 80, 0.2);
}

button:hover {
  background-color: #3d8b40;
  transform: translateY(-2px);
  box-shadow: 0 6px 10px rgba(76, 175, 80, 0.25);
}

button:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(76, 175, 80, 0.2);
}

/* Botón de cambio entre login y registro */
button[type="button"] {
  background-color: transparent;
  color: #2c3e50;
  border: 1px solid #e0e0e0;
  box-shadow: none;
  font-weight: 500;
}

button[type="button"]:hover {
  background-color: #f5f5f5;
  color: #4CAF50;
  border-color: #4CAF50;
}

/* Botón de Google */
.google {
  width: 3.5%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background-color: #ffffff;
  color: #5f6368;
  border: 1px solid #dadce0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin-top: 20px;
  margin-left: 49%;
}

.google:hover {
  background-color: #f5f5f5;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Estilo del logo de Google */
.google img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

/* Mensaje de bienvenida */
div > p {
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 20px 0;
  font-weight: 500;
}

/* Enlace al dashboard */
.dashboard-link {
  display: inline-block;
  padding: 12px 24px;
  background-color: #3498db;
  color: white;
  text-decoration: none;
  border-radius: 30px;
  font-weight: 600;
  margin: 15px 0;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(52, 152, 219, 0.2);
}

.dashboard-link:hover {
  background-color: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 6px 10px rgba(52, 152, 219, 0.25);
}

/* Botón de cerrar sesión cuando el usuario está autenticado */
div > button:first-of-type {
  background-color: #e74c3c;
  box-shadow: 0 4px 6px rgba(231, 76, 60, 0.2);
}

div > button:first-of-type:hover {
  background-color: #c0392b;
  box-shadow: 0 6px 10px rgba(231, 76, 60, 0.25);
}

/* Responsive design */
@media (max-width: 480px) {
  div {
    padding: 20px;
    width: 90%;
  }
  
  input, button {
    font-size: 0.95rem;
    padding: 12px;
  }
  
  h2 {
    font-size: 1.5rem;
  }
  
  .dashboard-link {
    padding: 10px 20px;
    font-size: 0.95rem;
  }
}
</style>