import { boot } from 'quasar/wrappers'
import { io } from "socket.io-client";

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(async ({ app, store }) => {
  const socket = io("https://api.shitposting.space");
  app.config.globalProperties.$socketio = socket
  socket.on('introduce_node', (data) => {
    console.log(data)
    store.commit('network/updateServer', data)
  })

  socket.on('disconnect_node', (data) => {
    store.commit('network/disconnectServer', data)
  })

  socket.on('reset_map', () => {
    store.commit('network/resetMap')
  })
})
