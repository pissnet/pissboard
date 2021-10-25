<template>
  <q-page class="flex" style="align-items: stretch">
    <div style="width: 100%">
    <l-map  :center="[15, 0]" :zoom="2.5" :options="{ zoomSnap: 0.1, zoomDelta: 0.1, preferCanvas: true }" >
      <l-tile-layer
        url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png	"
        layer-type="base"
        :attribution="'Map tiles by Carto, under CC BY 3.0. Data by OpenStreetMap, under ODbL'"
        name="OpenStreetMap"
        :max-zoom="18"
        :min-zoom="1.5"
      ></l-tile-layer>
      <l-geo-json ref="geojson" :geojson="geojson" :options="geojsonOptions"/>
    </l-map>
    </div>
  </q-page>
</template>

<script>
import {computed, defineComponent, watch, reactive} from 'vue';
import { useStore } from 'vuex'

// DON'T load Leaflet components here!
// Its CSS is needed though, if not imported elsewhere in your application.
import "leaflet/dist/leaflet.css"
import { LMap, LGeoJson, LTileLayer } from "@vue-leaflet/vue-leaflet";


// Originally inspired by  David Walsh (https://davidwalsh.name/javascript-debounce-function)

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// `wait` milliseconds.
const debounce = (func, wait) => {
  let timeout;

  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export default defineComponent({
  name: 'PageIndex',
  components: {
    LMap,
    LGeoJson,
    LTileLayer
  },
  setup() {
    const $store = useStore()

    const servers = computed({
      get: () => $store.state.network.servers,
    })

    const links = computed({
      get: () => $store.state.network.links,
    })

    const shitFuckery = computed({
      get: () => $store.state.network.shitFuckery
    })

    let gjson = {
      type: "FeatureCollection",
      features: [],
    }

    const geojson = computed({
      get: () => gjson,
      set: (d) => gjson = d
    })

    return {
      cnt: 0,
      servers: servers,
      links: links,
      geojson: geojson,
      geojsonOptions: {
        // Options that don't rely on Leaflet methods.
      }
    }
  },
  async beforeMount() {
    // HERE is where to load Leaflet components!
    const { circleMarker, marker } = await import("leaflet/dist/leaflet-src.esm");
    const geojsonMarkerOptions = {
      radius: 7,
      fillColor: "#ddd",
      color: "#000",
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8
    };
    this.geojsonOptions.pointToLayer = (feature, latLng) => {
      //circleMarker(latLng, geojsonMarkerOptions);
      let mark = marker(latLng)
      let text = `<b>${feature.properties.name}</b><br/>${feature.properties.description}<br/>${feature.properties.version}`;
      if(feature.properties.online !== undefined && feature.properties.online !== true) {
        mark = circleMarker(latLng, geojsonMarkerOptions);
        text += "<br>OFFLINE"
      }
      return mark.bindPopup().bindPopup(text);
    }
    // this.mapIsReady = true;
    this.geojsonOptions.style = {color: 'red'}
  },
  mounted() {
    const refreshMap = debounce(() => {
      console.log("Refreshing...")
      this.$refs.geojson.leafletObject.clearLayers()
      this.$refs.geojson.leafletObject.addData(this.geojson)
      this.cnt = 0
    }, 100)

    this.geojson = {
      type: "FeatureCollection",
      features: this.createGeoJson(),
    }

    const $store = useStore()
    watch(
      () => $store.state.network.shitFuckery,
      (state, prevState) => {
        console.log('Change!', $store.state.network.links.length)
        this.geojson.features = this.createGeoJson($store)
        this.cnt++
        if($store.state.network.links.length === 0 || this.cnt === 10) {
          console.log("Forcing refresh")
          this.cnt = 0
          // Force update
          this.$refs.geojson.leafletObject.clearLayers()
          this.$refs.geojson.leafletObject.addData(this.geojson)
        } else {
          refreshMap()
        }
      }
    );
  },
  methods: {
    addLineToMap(start, end) {
      if (Math.abs(start[1] - end[1]) > 180.0) {
        const start_dist_to_antimeridian = start[1] > 0 ? 180 - start[1] : 180 + start[1];
        const end_dist_to_antimeridian = end[1] > 0 ? 180 - end[1] : 180 + end[1];
        const lat_difference = Math.abs(start[0] - end[0]);
        const alpha_angle = Math.atan(lat_difference / (start_dist_to_antimeridian + end_dist_to_antimeridian)) * (180 / Math.PI) * (start[1] > 0 ? 1 : -1);
        const lat_diff_at_antimeridian = Math.tan(alpha_angle * Math.PI / 180) * start_dist_to_antimeridian;
        const intersection_lat = start[0] + lat_diff_at_antimeridian;
        const first_line_end = [intersection_lat, start[1] > 0 ? 180 : -180];
        const second_line_start = [intersection_lat, end[1] > 0 ? 180 : -180];

        return [[start, first_line_end], [second_line_start, end]]
      } else {
        return [[start, end]]
      }
    },
    jitter(sid) {
		  const map = {};
		  for (let i = 0; i < 10; i++) map[i] = i;
		  for (let i = 0; i < 26; i++) {
			map[String.fromCharCode(0x41 + i)] = 10 + i;
		  }
		  const vs = [0,1,2].map(i => map[sid[i]]);
		  const v = vs[0] * 36**2 + vs[1] * 36 + vs[2]
		  const dlat = ((v >> 7 & 0x7F) / 128) - 0.5;
		  const dlng = ((v & 0x7F) / 128) - 0.5;
		  return [dlat / 4, dlng / 4];
		},
    createGeoJson($store) {
      if(!$store) {
        $store = useStore()
      }
      // I hate myself
      const servers = JSON.parse(JSON.stringify($store.state.network.servers))

      let data = []
      for (let sid in servers) {
        if(!servers[sid].location.lat) continue;
        const [dlat, dlon] = this.jitter(sid)
        servers[sid].location.lon += dlon
        servers[sid].location.lat += dlat
        const server = servers[sid]
        if(!server.version || (!server.version.startsWith("UnrealIRCd") && !server.version.startsWith("PissIRCd"))) {
          servers[sid].location = {}
          continue
        }
        data.push({
          type: 'Feature',
          properties: {
            name: server.name,
            desc: server.description,
            version: server.version,
            online: server.online
          },
          geometry: {
            type: 'Point',
            coordinates: [server.location.lon, server.location.lat]
          }
        })
        data.push({
          type: 'Feature',
          properties: {
            name: server.name,
            popupContent: 'foobar',
            online: server.online
          },
          geometry: {
            type: 'Point',
            coordinates: [server.location.lon + 360, server.location.lat]
          }
        })
        data.push({
          type: 'Feature',
          properties: {
            name: server.name,
            popupContent: 'foobar',
            online: server.online
          },
          geometry: {
            type: 'Point',
            coordinates: [server.location.lon - 360, server.location.lat]
          }
        })
      }
      // i hate this
      const links = $store.state.network.links
      links.forEach((d) => {
        const a = servers[d[0]];
        const b = servers[d[1]];
        if(!a || !b || !a.location.lat || !b.location.lat) return;
        const ln = this.addLineToMap([a.location.lat, a.location.lon], [b.location.lat, b.location.lon])
        ln.forEach((f) => {
          data.push({
            type: "LineString",
            coordinates: [[f[0][1], f[0][0]], [f[1][1], f[1][0]]]
          })
          data.push({
            type: "LineString",
            coordinates: [[f[0][1]+360, f[0][0]], [f[1][1]+360, f[1][0]]]
          })
          data.push({
            type: "LineString",
            coordinates: [[f[0][1]-360, f[0][0]], [f[1][1]-360, f[1][0]]]
          })
        })
      })
      return data
    }
  }
})
</script>
