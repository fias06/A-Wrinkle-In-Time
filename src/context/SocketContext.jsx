// @ts-nocheck
import React, { createContext, useState, useRef, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';

const SocketContext = createContext();
const socket = io('http://localhost:5001');

const ContextProvider = ({ children }) => {
  const [stream, setStream] = useState(null);
  const [me, setMe] = useState('');
  const [call, setCall] = useState({});
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [name, setName] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    // 1. Get Camera
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        if (myVideo.current) myVideo.current.srcObject = currentStream;
      })
      .catch((err) => console.error("Camera Error:", err));

    // 2. Socket Listeners
    socket.on('me', (id) => setMe(id));
    
    socket.on('callUser', ({ from, name: callerName, signal }) => {
      console.log("📞 Incoming Call:", callerName);
      setCall({ isReceivingCall: true, from, name: callerName, signal });
    });

    socket.on('endCall', () => {
        // If other person hangs up, we hang up too
        leaveCall(false); 
        window.location.href = "/FindFriends"; 
    });

    socket.on('get-users', (users) => setOnlineUsers(users));
  }, []);

  // --- ANSWER CALL ---
  const answerCall = () => {
    // 1. STOP if already connected (Fixes Triple Click)
    if (callAccepted || connectionRef.current) return;
    
    setCallAccepted(true);

    const peer = new Peer({ initiator: false, trickle: false, stream });

    peer.on('signal', (data) => {
      // FIX: Ensure we have the 'from' ID
      if (call.from) {
          socket.emit('answerCall', { signal: data, to: call.from });
      }
    });

    peer.on('stream', (currentStream) => {
      if (userVideo.current) userVideo.current.srcObject = currentStream;
    });

    peer.signal(call.signal);
    connectionRef.current = peer;
  };

  // --- MAKE CALL ---
  const callUser = (id) => {
    // 1. STOP if already calling
    if (connectionRef.current) return;

    const peer = new Peer({ initiator: true, trickle: false, stream });

    peer.on('signal', (data) => {
      socket.emit('callUser', {
        userToCall: id,
        signalData: data,
        from: me,
        name: name
      });
    });

    peer.on('stream', (currentStream) => {
      if (userVideo.current) userVideo.current.srcObject = currentStream;
    });

    socket.on('callAccepted', (signal) => {
      setCallAccepted(true);
      peer.signal(signal);
    });

    connectionRef.current = peer;
  };

  // --- END CALL ---
  const leaveCall = (emitEvent = true) => {
    setCallEnded(true);

    // 1. Destroy Peer
    if (connectionRef.current) connectionRef.current.destroy();
    connectionRef.current = null;

    // 2. Stop Camera Tracks (Green light off)
    if (stream) {
        // Only stop tracks if we are truly done (optional, keeps camera ready for next call)
        // stream.getTracks().forEach(track => track.stop()); 
    }
    
    // 3. Notify other user
    if (emitEvent && call.from) {
        socket.emit("endCall", { id: call.from });
    }
    
    // 4. Reset State
    setCallAccepted(false);
    setCall({});
  };

  return (
    <SocketContext.Provider value={{
      call,
      callAccepted,
      myVideo,
      userVideo,
      stream,
      name,
      setName,
      callEnded,
      me,
      setMe,
      callUser,
      leaveCall,
      answerCall,
      onlineUsers,
    }}>
      {children}
    </SocketContext.Provider>
  );
};

const useVideoCall = () => useContext(SocketContext);
export { ContextProvider, SocketContext, useVideoCall };