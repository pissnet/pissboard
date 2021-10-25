
const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', redirect: 'map' },
      { path: 'map', component: () => import('pages/Map.vue') },
      { path: 'network', component: () => import('pages/Network.vue') },
      { path: 'stats', component: () => import('pages/Stats.vue') },
      { path: 'auth', component: () => import('pages/Login.vue') },
      { path: 'dns', component: () => import('pages/DNS.vue') },
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/Error404.vue')
  }
]

export default routes
