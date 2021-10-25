<template>
  <q-page class="" v-if="!loading">
    <div class="q-pa-md">
      <q-table
        title="Round-robin"
        :rows="data"
        :rows-per-page-options="[500]"
        :columns="columns">
        <template v-slot:top="">
          <div class="col-2 q-table__title">Round robin</div>
          <q-space />
          <q-btn color="primary" @click="addServerModal = true" v-if="$store.state.login.loggedIn && $store.state.login.data.groups.includes('sysop')">Add</q-btn>
        </template>
        <template v-slot:body="props">
          <q-tr :props="props" :class="(props.row.status === 'ERROR') ? 'bg-warning' : ''">
            <q-td key="id" :props="props">{{props.row.id}}</q-td>
            <q-td key="server" :props="props">{{props.row.server}}</q-td>
            <q-td key="ipv4" :props="props">{{props.row.ipv4}}</q-td>
            <q-td key="ipv6" :props="props" :class="props.row.status === 'V6ERROR' ? 'text-grey-8 text-strike text-italic' : ''">{{props.row.ipv6}}</q-td>
            <q-td key="region" :props="props">{{props.row.region}}</q-td>
            <q-td key="status" :props="props">{{props.row.status}}</q-td>
            <q-td key="error" :props="props">{{props.row.error}}</q-td>
          </q-tr>
        </template>
      </q-table>
    </div>
  </q-page>
  <q-page class="flex column flex-center" v-else>
    <h2>Loading...</h2>
    <q-spinner
      color="primary"
      size="3em"
      :thickness="10"
    />
  </q-page>

  <q-dialog v-model="addServerModal">
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">Add server</div>
      </q-card-section>
      <q-form @submit.prevent="doAddServer">
        <q-card-section class="q-pt-none">
            <q-input v-model="newServerName" lazy-rules :rules="[ val => val && val.length > 0 || 'Please type something']" autofocus label="Server name" />
            <q-input v-model="newServerIp4" lazy-rules :rules="[ val => (val.length || newServerIp6.length) || 'Need at least one IP']" label="IPv4" />
            <q-input v-model="newServerIp6"  label="IPv6" />
            <q-select v-model="newServerRegion" lazy-rules :rules="[ val => val && val.length > 0 || 'Please type something']" :options="['AMER', 'EURO', 'ASIA']" label="Region" />
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn flat label="Add address" type="submit" :loading="addServerLoading" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script>
import {defineComponent, ref} from 'vue';
import {useStore} from "vuex";

export default defineComponent({
  name: 'PageIndex',
  setup() {
    return {
      newServerName: ref(''),
      newServerIp4: ref(''),
      newServerIp6: ref(''),
      newServerRegion: ref(''),

      addServerLoading: ref(false),
      addServerModal: ref(false),
      loading: ref(true),
      data: ref([]),
      columns: [
        {name: 'id', label: '#', align: 'left', field: row => row.id},
        {name: 'server', label: 'Server name', align: 'left', field: row => row.server},
        {name: 'ipv4', label: 'IPv4', align: 'left', field: row => row.ipv4},
        {name: 'ipv6', label: 'IPv6', align: 'left', field: row => row.ipv6},
        {name: 'region', label: 'Region', align: 'left', field: row => row.region},
        {name: 'status', label: 'Status', align: 'left', field: row => row.status},
        {name: 'error', label: 'Error/Note', align: 'left', field: row => row.error},
      ]
    }
  },
  mounted() {
    this.loadData()
  },
  methods: {
    loadData() {
      this.loading = true;
      fetch("https://api.shitposting.space/dns")
      .then((r) => {
        r.json().then((data) => {
          this.data = data
          this.loading = false
        })
      })
    },
    doAddServer() {
      if(this.newServerIp4 === '') this.newServerIp4 = null
      if(this.newServerIp6 === '') this.newServerIp6 = null
      this.addServerLoading = true

      fetch('https://api.shitposting.space/dns', {
         method: 'post',
         headers: new Headers({
           'Authorization': `Bearer ${this.$store.state.login.jwt}`,
           'Content-Type': 'application/json'
         }),
         body: JSON.stringify({
           server: this.newServerName,
           ipv4: this.newServerIp4,
           ipv6: this.newServerIp6,
           region: this.newServerRegion
         })
       }).then((r) => {
        this.addServerModal = false
        this.addServerLoading = false
        this.newServerRegion = ''
        this.newServerIp6 = ''
        this.newServerIp4 = ''
        this.newServerName = ''
        this.loadData()
      });
    }
  }
})
</script>
