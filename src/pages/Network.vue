<template>
  <q-page class="flex">
    <div style="position: relative; width: 100%; min-height: 100%;">
        <div style="position: absolute; right: 0; bottom:0; z-index: 10000; background-color: white" class="shadow-7 rounded-borders q-pl-md q-pr-md q-pb-md q-pt-sm">
          <q-input label="Search" v-model="search" @keyup="onSearch" dense style="width: 30em" />
        </div>
      <div style="position: absolute; top: 0; right: 0; bottom: 0; left: 0;" ref="network" />
    </div>
  </q-page>
</template>

<script>
import {defineComponent, ref, watch} from 'vue';
import { debounce } from 'quasar'

import {useStore} from "vuex";
import {DataSet} from "vis-data"
import {Network} from "vis-network"

export default defineComponent({
  name: 'PageIndex',
  setup () {
    return {
      onSearch: null,
      search: ref(''),
      nodes: [],
      edges: [],
      network: null,
      overlay: ref(null)
    }
  },
  mounted() {
    const overlay = this.$route.query.overlay

    if(overlay) {
      fetch(overlay)
        .then((r) => {
          r.json().then((data) => {
            this.overlay = data
          })
        })
    }
    this.onSearch = debounce(this.actualSearch, 100)

    const $store = useStore()
    const servers = $store.state.network.servers
    let nodesArr = []
    let offlineServers = []
    for (let sid in servers) {
      const server = servers[sid]
      let node_color = "#97c2fc";
      if (server.version && server.version.startsWith("PissIRCd")) {
        node_color = "#ecc855";
      } else if(!server.version || server.version === "*" || (!server.version.startsWith("UnrealIRCd"))) {
        node_color = "#d3d3d3";
      }
      if(!server.description || server.description.startsWith("~")) {
        offlineServers.push(sid)
        continue;
      }
      let nodeData = {
        id: server.sid,
        label: server.name,
        color: node_color
      }
      if(server.online !== true) {
        offlineServers.push(sid)
        nodeData.color = "gray"
      }
      nodesArr.push(nodeData)
    }

    let edgesArr = []
    $store.state.network.links.forEach((l) => {
      if(offlineServers.includes(l[0]) || offlineServers.includes(l[1])) return;
      edgesArr.push({from: l[0], to: l[1], id: `${l[0]}${l[1]}`, color: "#97c2fc"})
    })

    this.nodes = new DataSet(nodesArr)
    this.edges = new DataSet(edgesArr)

    const container = this.$refs.network

    const data = {
      nodes: this.nodes,
      edges: this.edges,
    };

    const options = {
      nodes: {
        shapeProperties: {
          interpolation: false    // 'true' for intensive zooming
        }
      },
      physics:{
        stabilization:false
      },
      // autoResize: true
      layout: {
        improvedLayout: false
      }
    };
    this.network = new Network(container, data, options);

    this.updateEdgeLabels()
    this.refreshOverlay()
    const delayUpdateLabels = debounce(this.updateEdgeLabels, 100)
    const delayUpdateOverlay = debounce(this.refreshOverlay, 100)
    this.$socketio.on('introduce_node', (data) => {
      let node = this.nodes.get(data.sid)
      if(node) {
        if(!node.color) node.color = {}

        node.color.background = "#97c2fc";
        if (data.version && data.version.startsWith("PissIRCd")) {
          node.color.background = "#ecc855";
        } else if(!data.version || data.version === "*" || (!data.version.startsWith("UnrealIRCd"))) {
          node.color.background = "#d3d3d3";
        }
        if(!data.description || data.description.startsWith("~")) {
          return;
        }
        this.nodes.update(node)
      } else {
        this.nodes.add({
          id: data.sid,
          label: data.name
        })
      }
      if(!data.uplink) return
      this.edges.add({
        from: data.sid, to: data.uplink, id: `${data.sid}${data.uplink}`
      })
      delayUpdateLabels()
      delayUpdateOverlay()
    })

    this.$socketio.on('disconnect_node', (data) => {
      let node = this.nodes.get(data.sid)
      if(!node.color) node.color = {}
      node.color.background = 'gray'
      this.nodes.update(node)

      const edges = this.edges.get({
        filter: (e) => e.to === data.sid || e.from === data.sid
      })

      edges.forEach((i) => this.edges.remove(i))
    })

    this.$socketio.on('reset_map', () => {
      this.nodes.getIds().forEach((i) => this.nodes.remove(i))
      this.edges.forEach((i) => this.edges.remove(i))
    })

    this.$socketio.on('propagation_delay_update', (data) => {
      $store.commit('network/updatePropagation', data)
      this.updateEdgeLabels()
    })


    watch(
      () => this.overlay,
      (state, prevState) => {
        delayUpdateOverlay()
      }
    )
  },
  methods: {
    refreshOverlay() {
      if(this.overlay && this.overlay.nodes) {
        for (let sid in this.overlay.nodes) {
          const node = this.overlay.nodes[sid]
          const g_node = this.nodes.get(sid)
          if (!g_node) continue;
          if(!g_node.color) g_node.color = {}
          if(!g_node.font) g_node.font = {}
          if (node.font_size) g_node.font.size = node.font_size
          if (node.font_color) g_node.font.color = node.font_color
          if (node.background) g_node.color.background = node.background
          if (node.border) g_node.color.border = node.border

          if (node.background || node.border) this.nodes.update(g_node)
        }
      }

      if(this.overlay && this.overlay.links) {
        for (let sidsid in this.overlay.links) {
          const edge_data = this.overlay.links[sidsid]
          const [from, to] = sidsid.split("-")
          let edge = this.edges.get(`${from}${to}`)

          if (!edge) edge = this.edges.get(`${to}${from}`)
          if(!edge) continue;
          if (!edge.color) edge.color = {}
          if (edge_data.color) {
            edge.color.color = edge_data.color
            this.edges.update(edge)
          }

        }
      }
    },
    actualSearch () {
      if(this.search === '') return;
      this.nodes.forEach((node) => {
        if(!node.color) node.color = {}
        if(node.label.indexOf(this.search) >= 0) {
          node.color.border = 'red'
          this.nodes.update(node)
        } else if(node.color.border === 'red') {
          node.color.border = '#3281ea'
          this.nodes.update(node)
        }
      })
    },
    updateEdgeLabels() {
      this.edges.forEach((e) => {
        e.label = ''
        this.edges.update(e)
      })
      this.$store.state.network.propagation.forEach((p) => {
        let edge = this.edges.get(`${p[0][0]}${p[0][1]}`)
        if(!edge) edge = this.edges.get(`${p[0][1]}${p[0][0]}`)
        if(!edge) return
        edge.label = `${p[1]}ms`
        if(p[1] > 1000) {
          edge.color = {color: 'red'}
        }
        this.edges.update(edge)
      })
    }
  }
})
</script>
