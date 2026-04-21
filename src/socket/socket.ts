import { Server, Socket } from "socket.io";
import { Message } from "../model/meessage.model.ts";
import { Room } from "../model/room.model.ts";

type User = {
  socketId: string;
  name: string;
  color: string;
};



const users: Record<string, User[]> = {};

export const initSocket = (io: Server) => {
  io.on("connection", (socket: Socket) => {

    let currentRoom: string | null = null;

    // ================= JOIN ROOM =================
socket.on("join", async ({ roomId, user }) => {
  const room = await Room.findOne({ roomId });
  if (room?.code) {
    socket.emit("code-update", room.code);
  }

  socket.data.roomId = roomId;
  socket.data.user = user;

  socket.join(roomId);

  if (!users[roomId]) users[roomId] = [];

  // Remove existing user with same name to avoid duplicates
  users[roomId] = users[roomId].filter((u) => u.name !== user.name);

  // Add fresh connection
  users[roomId].push({
    socketId: socket.id,
    name: user.name,
    color: user.color,
  });

  io.to(roomId).emit("active-users", users[roomId]);

  socket.to(roomId).emit("user-joined", {
    message: `${user.name} joined`,
    user,
  });
});  

    // ================= CODE CHANGE ================= 
    socket.on("code-change", async ({ roomId, code }) => {
      try {
        await Room.findOneAndUpdate(
          { roomId },
          { code },
          { upsert: true }
        );
        socket.to(roomId).emit("code-update", code);

      } catch (err) {
        console.error("Auto-save error ❌", err);
      }
    });

    // ================= CURSOR =================
    socket.on("cursor-move", ({ roomId, position, user }) => {
      socket.to(roomId).emit("cursor-update", {
        position,
           user: {
      ...user,
      socketId: socket.id, 
    },

      });
    });



    // ================= CHAT =================
    socket.on("send-message", async ({ roomId, message, user }) => {
      try {
        const newMessage = await Message.create({
          roomId,
          message,
          user
        });
      io.to(roomId).emit("receive-message", newMessage);

      } catch (error) {
        console.error("Message Save Error ❌", error);
      }
    });



    // ================= LOAD MESSAGES =================
    socket.on("load-messages", async (roomId: string) => {
      try {
        const messages = await Message.find({ roomId })
          .sort({ createdAt: -1 }) // latest first
          .limit(50); 

        socket.emit("previous-messages", messages.reverse());

      } catch (error) {
        console.error("Load Message Error ❌", error);
      }
    });

    // ================= DISCONNECT =================
socket.on("disconnect", () => {
  console.log("🔥 disconnect fired");

  // ✅ skip if already handled in leave-room
  if (socket.data.hasLeft) return;

  const roomId = socket.data.roomId;
  const user = socket.data.user;

  if (!roomId || !users[roomId]) return;

  users[roomId] = users[roomId].filter(
    (u) => u.socketId !== socket.id
  );

  socket.to(roomId).emit("USER_LEFT", {
    username: user?.name || "Someone",
  });

  io.to(roomId).emit("active-users", users[roomId]);
});

socket.on("leave-room", (_, callback) => {
  console.log("🚪 manual leave");

  const roomId = socket.data.roomId;
  const user = socket.data.user;

  if (!roomId || !users[roomId]) {
    callback && callback(); 
    return;
  }

  socket.data.hasLeft = true;

  // remove user
  users[roomId] = users[roomId].filter(
    (u) => u.socketId !== socket.id
  );

  // notify others
  socket.to(roomId).emit("USER_LEFT", {
    username: user?.name || "Someone",
  });

  socket.leave(roomId);

  io.to(roomId).emit("active-users", users[roomId]);
  callback && callback();
});
socket.on("tab-inactive", async ({ roomId, user }) => {
  const room = await Room.findOne({ roomId });
  if (!room) return;

  const creatorName = room.createdBy?.name;

  const creator = users[roomId]?.find(
    (u) => u.name === creatorName
  );

  if (creator) {
    io.to(creator.socketId).emit("user-tab-inactive", {
      message: `${user.name} switched tab`,
      user,
    });
  }
});
socket.on("tab-active", async ({ roomId, user }) => {
  const room = await Room.findOne({ roomId });
  if (!room) return;

  const creatorName = room.createdBy?.name;

  const creator = users[roomId]?.find(
    (u) => u.name === creatorName
  );

  if (creator) {
    io.to(creator.socketId).emit("user-tab-active", {
      message: `${user.name} is back`,
      user,
    });
  }
});

  }  )


};

