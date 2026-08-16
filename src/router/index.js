import { createRouter, createWebHistory } from 'vue-router';
import Dashboard from '../views/Dashboard.vue';
import EditorProyecto from '../views/EditorProyecto.vue';
import Configuracion from '../views/Configuracion.vue';

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
  },
  {
    path: '/proyecto/:id',
    name: 'EditorProyecto',
    component: EditorProyecto,
    props: true,
  },
  {
    path: '/embed/:id',
    name: 'EmbedProyecto',
    component: EditorProyecto,
    props: (route) => ({ id: route.params.id, embedded: true }),
    meta: { embedded: true },
  },
  {
    path: '/configuracion',
    name: 'Configuracion',
    component: Configuracion,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
