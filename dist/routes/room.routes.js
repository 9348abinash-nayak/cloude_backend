import express from 'express';
import { createRoomController, getRoomController, joinRoomController, lockRoomController } from "../controllers/room.controller.js";
export const roomRouter = express.Router();
roomRouter.post("/create", createRoomController);
roomRouter.post("/join", joinRoomController);
roomRouter.get("/get/:roomId", getRoomController);
roomRouter.post("/locked", lockRoomController);
