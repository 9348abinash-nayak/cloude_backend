import { createRoomServices, getRoomService, joinRoomServices, lockedRoom } from "../services/room.services.js";
export const createRoomController = async (req, res) => {
    try {
        const data = req.body;
        const room = await createRoomServices(data);
        return res.status(201).json({
            success: true,
            message: "Room created successfully",
            room
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Room creation failed"
        });
    }
};
export const joinRoomController = async (req, res) => {
    try {
        console.log("hello");
        const { roomId } = req.body;
        console.log(req.body);
        const room = await joinRoomServices(roomId);
        return res.status(200).json({
            success: true,
            room
        });
    }
    catch (error) {
        console.error("JOIN ROOM ERROR ❌:", error);
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
export const getRoomController = async (req, res) => {
    try {
        const { roomId } = req.params;
        const room = await getRoomService(roomId);
        return res.status(200).json({
            success: true,
            room
        });
    }
    catch (error) {
        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};
export const lockRoomController = async (req, res) => {
    try {
        const { roomId } = req.body;
        const room = await lockedRoom(roomId);
        return res.status(200).json({
            success: true,
            message: "room is locked now",
            room
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
