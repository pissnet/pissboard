export function getServers (context) {
  context.commit('updateLoading', true)
  // Hardcoding is bad, etc
  fetch("https://api.shitposting.space/servers.json")
    .then((r) => {
      r.json().then((data) => {
        context.commit('updateServers', data.servers)
        context.commit('updateLinks', data.links)
        context.commit('updatePropagation', data.propagation)
        context.commit('updateLoading', false)
      })
    })
}
