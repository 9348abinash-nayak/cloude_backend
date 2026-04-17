import express from "express";
import http from "http";
import { Server } from "socket.io";
import { db_connect } from "./config/db.js";
import { initSocket } from "./socket/socket.js";
import dotenv from 'dotenv';
import { roomRouter } from "./routes/room.routes.js";
import cors from 'cors';
import { codeexecuteRouter } from "./routes/codeexcute.routes.js";
dotenv.config();
const app = express();
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST"],
    credentials: true
}));
app.use(express.json());
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});
// DB connect
db_connect();
initSocket(io);
app.use("/room", roomRouter);
app.use("/code", codeexecuteRouter);
server.listen(process.env.PORT, () => {
    console.log(`Server running on ${process.env.PORT}`);
});
