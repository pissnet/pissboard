import jwt_decode from "jwt-decode";


export function setJWT (state, jwt) {
  localStorage.setItem('jwt', jwt)
  state.jwt = jwt
  state.data = jwt_decode(jwt)
  state.loggedIn = true
}
