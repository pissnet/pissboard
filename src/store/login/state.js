import jwt_decode from "jwt-decode";


export default function () {
  const jwt = localStorage.getItem('jwt')
  const data = jwt ? jwt_decode(jwt) : {}
  return {
    jwt: jwt,
    data: data,
    loggedIn: jwt ? data.exp > Date.now() / 1000 : false
  }
}
