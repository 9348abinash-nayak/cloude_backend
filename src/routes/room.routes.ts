import express from 'express'
import { createRoomController, getRoomController, joinRoomController, lockRoomController, unlockRoomController } from '../controllers/room.controller.ts'

export const roomRouter=express.Router()
roomRouter.post("/create",createRoomController)
roomRouter.post("/join",joinRoomController)
roomRouter.get("/get/:roomId",getRoomController)
roomRouter.post("/locked" , lockRoomController)
roomRouter.post("/unlocked",unlockRoomController)

