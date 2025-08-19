import express from "express";
import { getUsers } from "../controllers/user.controller.js";
import {protectRoute} from "../middleware/auth.middleware.js";

const router = express.Router();

// GET all users except logged-in user + last message
router.get("/", protectRoute, getUsers);

export default router;
