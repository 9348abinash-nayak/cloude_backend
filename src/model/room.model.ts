import mongoose from "mongoose";
const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  language: { type: String, default: "" },
  code: { type: String, default: "" },
  isLocked: { type: Boolean, default: false },
 createdBy: {
  name: { type: String, required: true },
}
}, { timestamps: true });

export const Room = mongoose.model("Room", roomSchema);