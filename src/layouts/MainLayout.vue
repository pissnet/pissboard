<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated v-if="!loading">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>
          Pissnet Dashboard
        </q-toolbar-title>

        <q-btn v-if="!$store.state.login.loggedIn" @click="redirectLogin">Login</q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer v-if="!loading"
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      class=""
    >
      <q-list>
        <q-item-label
          header
          class="text-grey-8"
        >
          Yeah this is the menu
        </q-item-label>
        <EssentialLink
          title="Geographic Network Map"
          icon="public"
          link="/map"
          />
        <EssentialLink
          title="Network Topography"
          icon="device_hub"
          link="/network"
          />
        <EssentialLink
          title="Server composition"
          icon="fingerprint"
          link="/stats"
          />
        <EssentialLink
          title="Round robin"
          icon="dns"
          link="/dns"
          />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view v-if="!loading"/>
      <q-page class="flex column flex-center" v-else>
        <h2>Loading...</h2>
        <q-spinner
          color="primary"
          size="3em"
          :thickness="10"
        />
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
import EssentialLink from 'components/EssentialLink.vue'

const linksList = [
  {
    title: 'Docs',
    caption: 'quasar.dev',
    icon: 'school',
    link: 'https://quasar.dev'
  },
  {
    title: 'Github',
    caption: 'github.com/quasarframework',
    icon: 'code',
    link: 'https://github.com/quasarframework'
  },
  {
    title: 'Discord Chat Channel',
    caption: 'chat.quasar.dev',
    icon: 'chat',
    link: 'https://chat.quasar.dev'
  },
  {
    title: 'Forum',
    caption: 'forum.quasar.dev',
    icon: 'record_voice_over',
    link: 'https://forum.quasar.dev'
  },
  {
    title: 'Twitter',
    caption: '@quasarframework',
    icon: 'rss_feed',
    link: 'https://twitter.quasar.dev'
  },
  {
    title: 'Facebook',
    caption: '@QuasarFramework',
    icon: 'public',
    link: 'https://facebook.quasar.dev'
  },
  {
    title: 'Quasar Awesome',
    caption: 'Community Quasar projects',
    icon: 'favorite',
    link: 'https://awesome.quasar.dev'
  }
];

import { defineComponent, ref, computed } from 'vue'
import {useStore} from "vuex";
import {useQuasar} from "quasar";

export default defineComponent({
  name: 'MainLayout',

  components: {
    EssentialLink
  },

  setup () {
    const leftDrawerOpen = ref(false)
    const $store = useStore()
    // const $q = useQuasar()

    // $q.dark.set(true)

    $store.dispatch('network/getServers')
    const loadingState = computed({
      get: () => $store.state.network.loading,
    })

    return {
      loading: loadingState,
      essentialLinks: linksList,
      leftDrawerOpen,
      toggleLeftDrawer () {
        leftDrawerOpen.value = !leftDrawerOpen.value
      }
    }
  },
  methods: {
    redirectLogin () {
      localStorage.setItem('login_redirect', this.$router.currentRoute.value.fullPath)
      window.location.href = 'https://api.shitposting.space/login'
    }
  }
})
</script>
