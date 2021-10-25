export function updateServers (state, servers) {
  state.servers = servers
}

export function updateLinks (state, links) {
  state.links = links
}

export function updatePropagation (state, propagation) {
  state.propagation = propagation
}

export function updateLoading (state, loading) {
  state.loading = loading
}

export function updateServer (state, serverData) {
  if(state.servers[serverData.sid]) {
    // Update!
    state.servers[serverData.sid].online = serverData.online
    state.servers[serverData.sid].name = serverData.name
    state.servers[serverData.sid].description = serverData.description
    state.servers[serverData.sid].version = serverData.version
  } else {
    state.servers[serverData.sid] = serverData
  }
  if (serverData.uplink) {
    console.log("Newserv", [serverData.sid, serverData.uplink])
    state.links.push([serverData.sid, serverData.uplink])
  }
  state.shitFuckery++;
}


export function disconnectServer (state, data) {
  state.servers[data.sid].online = false
  state.links = state.links.filter(link => link[0] !== data.sid && link[1] !== data.sid)
  state.shitFuckery++;
}

export function resetMap(state) {
  state.servers = {}
  state.links = []
  state.shitFuckery++;
}
