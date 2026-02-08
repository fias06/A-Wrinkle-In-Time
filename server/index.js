import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

let users = [];

io.on("connection", (socket) => {
  
  // 1. Add User (UPDATED FIX)
  socket.on("new-user-add", (newUserId) => {
    // First, remove any old stale connections for this specific user
    users = users.filter((user) => user.userId !== newUserId);
    
    // Now add the fresh connection
    users.push({ userId: newUserId, socketId: socket.id });
    
    io.emit("get-users", users);
    console.log("✅ User Added/Updated:", users);
  });

  // 2. Remove User
  socket.on("disconnect", () => {
    users = users.filter((user) => user.socketId !== socket.id);
    io.emit("get-users", users);
    console.log("❌ User Disconnected. Remaining:", users);
  });

  // 3. Call User
  socket.on("callUser", ({ userToCall, signalData, from, name }) => {
    io.to(userToCall).emit("callUser", { 
      signal: signalData, 
      from, 
      name 
    });
    console.log(`📞 Call forwarded: ${name} -> ${userToCall}`);
  });

  // 4. Answer Call
  socket.on("answerCall", (data) => {
    io.to(data.to).emit("callAccepted", data.signal);
    console.log(`✅ Call Accepted by ${data.to}`);
  });

  // 5. End Call
  socket.on("endCall", ({ id }) => {
    io.to(id).emit("endCall");
    console.log(`📴 Call Ended for ${id}`);
  });
});

httpServer.listen(5000, () => {
  console.log("🚀 Server is running on port 5000");
});