// src/controllers/execution.controller.ts
import { executeCodeService } from "../services/execute.code.js";
export const executeCodeController = async (req, res) => {
    try {
        const result = await executeCodeService(req.body);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
