import { io } from 'socket.io-client'

// Use relative URL so Vite proxy (or same-origin in prod) handles it
const SERVER_URL = import.meta.env.VITE_SERVER_URL || ''

const socket = io(SERVER_URL, {
  autoConnect: true,
  reconnection: true,
})

export default socket
