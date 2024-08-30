import { useCallback, useEffect, useState } from "react"
import { useSocket } from "../providers/SocketProvider"
import ReactPlayer from "react-player"
import peer from "../services/peer"
// commit2

const RoomScreen = () => {
  const [remoteSocketId, setRemoteSocketId] = useState(null)
  const [myStream, setMyStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const socket = useSocket()

  const sendStream = useCallback(() => {
    for (const track of myStream.getTracks()) {
      peer.peer.addTrack(track, myStream)
    }
  }, [myStream])

  const handleUserJoined = useCallback(({ email, id }) => {
    console.log(email, "joined the room")
    setRemoteSocketId(id)
  }, [])

  const handleCallAccepted = useCallback(({ from, ans }) => {
    peer.setLocalDescription(ans)
    console.log("call accepted")
    sendStream()
  }, [sendStream])

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    })

    // get offer and pass to remote socket id
    const offer = await peer.getOffer()
    socket.emit("user:call", { to: remoteSocketId, offer })
    setMyStream(stream)
  }, [remoteSocketId, socket])

  const handleIncomingCall = useCallback(
    async ({ from, offer }) => {
      setRemoteSocketId(from)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      })
      setMyStream(stream)
      const answer = await peer.getAnswer(offer)
      socket.emit("call:accepted", { to: from, answer })
    },
    [socket]
  )

  const handleNegotiationNeeded = useCallback(async() => {
    const offer = await peer.getOffer()
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId })
  }, [remoteSocketId, socket])

  const handleNegoNeedIncoming = useCallback(
    async ({ from, offer }) => {
      const answer = await peer.getAnswer(offer)
      socket.emit("peer:nego:done", { to: from, answer })
    },
    [socket]
  )

  const handleNegoNeedFinal = useCallback(async ({ answer }) => {
    await peer.setLocalDescription(answer)
  }, [])

  useEffect(() => {
    peer.peer.addEventListener("negotationneeded", handleNegotiationNeeded)

    return () => {
      peer.peer.removeEventListener("negotationneeded", handleNegotiationNeeded)
    }
  }, [handleNegotiationNeeded])

  useEffect(() => {
    peer.peer.addEventListener("track", async (event) => {
      const remoteStreams = event.streams
      console.log(remoteStreams[0], "remote stream")
      setRemoteStream(remoteStreams[0])
    })
  }, [])

  useEffect(() => {
    socket.on("user:joined", handleUserJoined)
    socket.on("incoming:call", handleIncomingCall)
    socket.on("call:accepted", handleCallAccepted)
    socket.on("peer:nego:needed", handleNegoNeedIncoming)
    socket.on("peer:nego:final", handleNegoNeedFinal)

    return () => {
      socket.off("user:joined", handleUserJoined)
      socket.off("incoming:call", handleIncomingCall)
      socket.off("call:accepted", handleCallAccepted)
      socket.off("peer:nego:needed", handleNegoNeedIncoming)
      socket.off("peer:nego:final", handleNegoNeedFinal)
    }
  }, [
    handleUserJoined,
    handleIncomingCall,
    socket,
    handleCallAccepted,
    handleNegoNeedIncoming,
    handleNegoNeedFinal,
  ])

  return (
    <div>
      <h1>Room Screen</h1>
      <h3>{remoteSocketId ? "Connected" : "No one in room, call them"}</h3>
      {myStream && <button onClick={sendStream}>Send Stream</button>}
      {remoteSocketId && <button onClick={handleCallUser}>Call</button>}

      {myStream && (
        <>
          <h1>My Stream:</h1>
          <ReactPlayer url={myStream} playing muted height={300} width={400} />
        </>
      )}

      {remoteStream && (
        <>
          <h1>Remote Stream:</h1>
          <ReactPlayer
            url={remoteStream}
            playing
            muted
            height={300}
            width={400}
          />
        </>
      )}
    </div>
  )
}

export default RoomScreen
