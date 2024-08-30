import { FormEvent, useCallback, useEffect, useState } from "react"
import { useSocket } from "../providers/SocketProvider"
import { useNavigate } from "react-router-dom"

const LobbyScreen = () => {
  const [email, setEmail] = useState("")
  const [room, setRoom] = useState("")

  const socket = useSocket()

  const handleFormSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault()

      socket.emit("room:join", { email, room })
    },
    [email, room, socket]
  )

  const navigate = useNavigate()
  const handleJoinRoom = useCallback(
    (data) => {
      const { email, room } = data
      navigate(`/room/${room}`)
    },
    [navigate]
  )

  useEffect(() => {
    socket.on("room:join", handleJoinRoom)
    return () => {
      socket.off("room:join")
    }
  }, [socket, handleJoinRoom])
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <h1>Enter details:</h1>
      <form onSubmit={handleFormSubmit}>
        <label htmlFor="email">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email id.."
        />

        <br />

        <label htmlFor="">Room Number</label>
        <input
          type="text"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          placeholder="Enter room number.."
        />

        <br />

        <button type="submit">Join</button>
      </form>
    </div>
  )
}

export default LobbyScreen
