<template>
  <q-page class="q-pl-lg">
    <div class="row">
      <div class="col">
        <div class="column">
          <h4>Operating system</h4>
          <apexchart ref="graphOs" type="pie" width="500" :options="chartOptionsOs" :series="seriesOs" @dataPointSelection="clicketyClack"></apexchart>
        </div>
        <div class="column">
          <h4>Linux distro</h4>
          <apexchart ref="graphDistro" type="pie" width="500" :options="chartOptionsDistro" :series="seriesDistro" @dataPointSelection="clicketyClack"></apexchart>
        </div>
      </div>
      <div class="col">
        <div class="column">
          <h4>Architecture</h4>
          <apexchart ref="graphArch" type="pie" width="500" :options="chartOptionsArch" :series="seriesArch" @dataPointSelection="clicketyClack"></apexchart>
        </div>
        <div class="column">
          <h4>IRCd version</h4>
          <apexchart ref="graphUnreal" type="pie" width="600" :options="chartOptionsUnreal" :series="seriesUnreal" @dataPointSelection="clicketyClack"></apexchart>
        </div>
      </div>
    </div>
    <q-dialog v-model="servList">
      <q-table
        style="min-width: 500px;"
        :title="dialogTitle"
        :rows="dialogServers"
        :columns="[{name: 'name', label: 'Server', field: row => row.name, align: 'left'}]"
        :rows-per-page-options="[10000]"
        hide-bottom
        row-key="name"
      />
    </q-dialog>
  </q-page>
</template>

<script>
import {defineComponent, ref} from 'vue';
import VueApexCharts from 'vue3-apexcharts'
import {useStore} from "vuex";

export default defineComponent({
  name: 'PageIndex',
  components: {
    apexchart: VueApexCharts,
  },
  setup() {
    const $store = useStore()
    return {
      store: $store,
      servList: ref(false),
      dialogTitle: "",
      dialogServers: ref([]),
      seriesOs: [],
      seriesArch: [],
      seriesDistro: [],
      seriesUnreal: [],
      chartOptionsOs: {
        labels: [],
        legend: {
          formatter: (seriesName, opts) => {
            return [seriesName, " - ", opts.w.globals.series[opts.seriesIndex]]
          }
        }
      },
      chartOptionsArch: {
        chart: {width: 500, type: 'pie',},
        labels: [],
        legend: {
          formatter: (seriesName, opts) => {
            return [seriesName, " - ", opts.w.globals.series[opts.seriesIndex]]
          }
        }
      },
      chartOptionsDistro: {
        chart: {width: 500, type: 'pie',},
        labels: [],
        legend: {
          formatter: (seriesName, opts) => {
            return [seriesName, " - ", opts.w.globals.series[opts.seriesIndex]]
          }
        }
      },
      chartOptionsUnreal: {
        chart: {width: 500, type: 'pie',},
        labels: [],
        legend: {
          formatter: (seriesName, opts) => {
            return [seriesName, " - ", opts.w.globals.series[opts.seriesIndex]]
          }
        }
      },
    }
  },
  mounted() {
    const $store = useStore()
    const servers = $store.state.network.servers

    let osData = {}
    let archData = {}
    let distroData = {}
    let unrealData = {}
    for (let sid in servers) {
      const server = servers[sid]
      if(!server.version || (!server.version.startsWith("UnrealIRCd") && !server.version.startsWith("PissIRCd"))) continue;

      let os = server.system.os
      if(os === null) os = "<unknown>"
      if(!osData[os]){
        osData[os] = 1
      } else {
        osData[os] ++
      }

      let arch = server.system.arch
      if(arch === null) arch = "<unknown>"
      if(!archData[arch]){
        archData[arch] = 1
      } else {
        archData[arch] ++
      }

      let unreal = server.version
      unreal = unreal.replace(/\.$/, "")
      if(!unrealData[unreal]){
        unrealData[unreal] = 1
      } else {
        unrealData[unreal] ++
      }

      if(server.system.os !== "Linux") continue;
      let distro = server.system.distro
      if(distro === null) distro = "<unknown>"
      if(!distroData[distro]){
        distroData[distro] = 1
      } else {
        distroData[distro] ++
      }
    }
    // Obj to array and then sort
    let osDataArr = []
    for(let os in osData) {
      osDataArr.push([os, osData[os]])
    }
    osDataArr = osDataArr.sort((j, k) => k[1] - j[1])
    osDataArr.forEach((k) => {
      this.seriesOs.push(k[1])
      this.chartOptionsOs.labels.push(k[0])
    })

    let archDataArr = []
    for(let os in archData) {
      archDataArr.push([os, archData[os]])
    }
    archDataArr = archDataArr.sort((j, k) => k[1] - j[1])
    archDataArr.forEach((k) => {
      this.seriesArch.push(k[1])
      this.chartOptionsArch.labels.push(k[0])
    })

    let distroDataArr = []
    for(let os in distroData) {
      distroDataArr.push([os, distroData[os]])
    }
    distroDataArr = distroDataArr.sort((j, k) => k[1] - j[1])
    distroDataArr.forEach((k) => {
      this.seriesDistro.push(k[1])
      this.chartOptionsDistro.labels.push(k[0])
    })

    let unrealDataArr = []
    for(let os in unrealData) {
      unrealDataArr.push([os, unrealData[os]])
    }

    const unrealVersionRanker = (v) => {
      v = v.replace("UnrealIRCd-", "").replace("PissIRCd-", "")
      if(v.endsWith('-git')) {
        return v.replace('-git', '-a')
      } else if(v.endsWith('-rc1')) {
        return v.replace('-rc', '-b')
      }
      return v + '-cz'
    }

    unrealDataArr = unrealDataArr.sort((j, k) => unrealVersionRanker(k[0]) > unrealVersionRanker(j[0]) ? 1 : -1)
    unrealDataArr.forEach((k) => {
      this.seriesUnreal.push(k[1])
      this.chartOptionsUnreal.labels.push(k[0])
    })
  },
  methods: {
    clicketyClack(event, chartContext, config) {
      console.log(config.w)
      let valueSel = chartContext.w.globals.labels[config.dataPointIndex]
      if(valueSel === "<unknown>") valueSel = null
      let serverArr = Object.keys(this.store.state.network.servers).map((k) => {return this.store.state.network.servers[k]});
      serverArr = serverArr.filter(k => k.version && (k.version.startsWith("UnrealIRCd") || k.version.startsWith("PissIRCd")))

      if(JSON.stringify(chartContext.w.globals.labels) === JSON.stringify(this.chartOptionsOs.labels)) {
        this.dialogServers.splice(0, this.dialogServers.length, ...serverArr.filter((k) => k.system.os === valueSel))
        this.dialogTitle = "Servers with OS: " + (valueSel ? valueSel : "<unknown>")
      } else if (JSON.stringify(chartContext.w.globals.labels) === JSON.stringify(this.chartOptionsArch.labels)) {
        this.dialogServers.splice(0, this.dialogServers.length, ...serverArr.filter((k) => k.system.arch === valueSel))
        this.dialogTitle = "Servers with Arch: " + (valueSel ? valueSel : "<unknown>")
      } else if (JSON.stringify(chartContext.w.globals.labels) === JSON.stringify(this.chartOptionsDistro.labels)) {
        this.dialogServers.splice(0, this.dialogServers.length, ...serverArr.filter((k) => k.system.distro === valueSel && k.system.os === "Linux"))
        this.dialogTitle = "Servers with Distro: " + (valueSel ? valueSel : "<unknown>")
      } else if (JSON.stringify(chartContext.w.globals.labels) === JSON.stringify(this.chartOptionsUnreal.labels)) {
        this.dialogServers.splice(0, this.dialogServers.length, ...serverArr.filter((k) => k.version === valueSel + "."))
        this.dialogTitle = "Servers with UnrealIRCd version " + (valueSel ? valueSel : "<unknown>")
      } else {
        return
      }
      this.servList = true
    }
  }
})
</script>
