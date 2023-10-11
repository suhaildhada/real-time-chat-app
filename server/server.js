const { Server } = require("socket.io");

const io = new Server({
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const clientRooms = {};

io.on("connection", (socket) => {
  socket.on("disconnect", () => {
    const userId = socket.id;
    const { roomId, username } = clientRooms[userId];
    socket.to(roomId).emit("userLeft", username);
    delete clientRooms[socket.id];
  });
  socket.on("createNewChatRoom", handleCreateNewRoom);
  socket.on("joinChatRoom", handleJoinRoom);
  socket.on("message", emitMessage);

  function emitMessage(message) {
    if (!message) return;
    const userId = socket.id;
    const { roomId, username } = clientRooms[userId];
    io.sockets.in(roomId).emit("message", message, userId, username);
  }

  function handleJoinRoom(roomId, username) {
    const room = io.sockets.adapter.rooms.get(roomId);
    if (!room || room.size === 0) {
      socket.emit("unknownRoom");
      return;
    }
    joinRoom(roomId, username);
  }

  function handleCreateNewRoom(username) {
    const roomId = makeId(10);
    joinRoom(roomId, username);
  }

  function joinRoom(roomId, username) {
    const userId = socket.id;
    clientRooms[userId] = { roomId: roomId, username: username };
    console.log(roomId, username);

    socket.join(roomId);
    socket.emit("roomJoined", userId, roomId);
    io.sockets.in(roomId).emit("userJoined", username, userId);
  }
});

function makeId(length) {
  let result = "";
  let characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

io.listen(Number(3003));
