

import { createApp } from 'vue'
import App from './App.vue'
import Route from './components/router.vue'

// Importamos Font Awesome
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

// Importamos algunos íconos específicos
import { faUser, faCoffee } from '@fortawesome/free-solid-svg-icons';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { faCompass } from '@fortawesome/free-solid-svg-icons';
import { faTag } from '@fortawesome/free-solid-svg-icons';
import { faLock } from '@fortawesome/free-solid-svg-icons';

// Agregamos los íconos a la librería
library.add(faUser, faCoffee, faGithub , faCompass, faTag  , faLock );

const app = createApp(App);

// Registramos el componente globalmente
app.component('font-awesome-icon', FontAwesomeIcon);
app.use(Route)


app.mount('#app')
