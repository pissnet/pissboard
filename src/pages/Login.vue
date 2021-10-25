<template>
  <q-page class="flex flex-center">
    Logging you in... <br/>
    If you get stuck on this page then blame Polsaker :(
  </q-page>
</template>

<script>
import {defineComponent, ref} from 'vue';
import {useStore} from "vuex";

export default defineComponent({
  name: 'PageIndex',
  setup() {
    const $store = useStore()
    return {
      error: ref('')
    }
  },
  mounted() {
    const querydata = this.$route.query
    fetch("https://api.shitposting.space/auth/wiki?" + new URLSearchParams(this.$route.query),
      {credentials: 'include'})
    .then((r) => {
      r.json().then((data) => {
        this.$store.commit('login/setJWT', data.access_token)
        this.$router.push(localStorage.getItem('login_redirect'))
      })
    })
  }
})
</script>
