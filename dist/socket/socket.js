import { Message } from "../model/meessage.model.js";
import { Room } from "../model/room.model.js";
const users = {};
export const initSocket = (io) => {
    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);
        let currentRoom = null;
        // ================= JOIN ROOM =================
        socket.on("join", async ({ roomId, user }) => {
            if (socket.data.joined)
                return;
            socket.data.joined = true;
            const room = await Room.findOne({ roomId });
            if (room?.code) {
                socket.emit("code-update", room.code);
            }
            socket.data.roomId = roomId;
            socket.data.user = user;
            socket.join(roomId);
            if (!users[roomId])
                users[roomId] = [];
            users[roomId] = users[roomId].filter((u) => u.socketId !== socket.id);
            const existingUserIndex = users[roomId].findIndex((u) => u.name === user.name);
            if (existingUserIndex !== -1) {
                users[roomId][existingUserIndex].socketId = socket.id;
            }
            else {
                users[roomId].push({
                    socketId: socket.id,
                    name: user.name,
                    color: user.color,
                });
            }
            io.to(roomId).emit("active-users", users[roomId]);
            socket.to(roomId).emit("user-joined", {
                message: `${user.name} joined`,
                user,
            });
        });
        // ================= CODE CHANGE ================= 
        socket.on("code-change", async ({ roomId, code }) => {
            try {
                await Room.findOneAndUpdate({ roomId }, { code }, { upsert: true });
                socket.to(roomId).emit("code-update", code);
            }
            catch (err) {
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
            }
            catch (error) {
                console.error("Message Save Error ❌", error);
            }
        });
        // ================= LOAD MESSAGES =================
        socket.on("load-messages", async (roomId) => {
            try {
                const messages = await Message.find({ roomId })
                    .sort({ createdAt: -1 }) // latest first
                    .limit(50);
                socket.emit("previous-messages", messages.reverse());
            }
            catch (error) {
                console.error("Load Message Error ❌", error);
            }
        });
        // ================= DISCONNECT =================
        socket.on("disconnect", () => {
            console.log("🔥 disconnect fired");
            // ✅ skip if already handled in leave-room
            if (socket.data.hasLeft)
                return;
            const roomId = socket.data.roomId;
            const user = socket.data.user;
            if (!roomId || !users[roomId])
                return;
            users[roomId] = users[roomId].filter((u) => u.socketId !== socket.id);
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
            users[roomId] = users[roomId].filter((u) => u.socketId !== socket.id);
            // notify others
            socket.to(roomId).emit("USER_LEFT", {
                username: user?.name || "Someone",
            });
            socket.leave(roomId);
            io.to(roomId).emit("active-users", users[roomId]);
            callback && callback();
        });
    });
};
