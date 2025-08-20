import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    })
    .populate('senderId', 'fullName profilePic') 
    .populate('receiverId', 'fullName profilePic') 
    .sort({ createdAt: 1 }); 

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {

       console.log("=== SEND MESSAGE DEBUG ===");
    console.log("req.params.id:", req.params.id);
    console.log("req.user:", req.user?._id);
    console.log("req.body:", req.body);
    console.log("==========================");

    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    

    let text = req.body?.text || "";
    let imageUrl = null;

    // If file upload via Multer
    if (req.file) {
      const uploadResponse = await cloudinary.uploader.upload(req.file.path);
      imageUrl = uploadResponse.secure_url;
    }
    // If base64 image string
    else if (req.body.image && req.body.image.startsWith("data:image/")) {
      const uploadResponse = await cloudinary.uploader.upload(req.body.image);
      imageUrl = uploadResponse.secure_url;
    }

    const hasText = typeof text === "string" && text.trim() !== "";
    const hasImage = !!imageUrl;

    if (!hasText && !hasImage) {
      return res.status(400).json({ error: "Message must contain text or image" });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text: hasText ? text.trim() : null,
      image: hasImage ? imageUrl : null,
    });

    const savedMessage = await newMessage.save();

    const populatedMessage = await Message.findById(savedMessage._id)
      .populate("senderId", "fullName profilePic")
      .populate("receiverId", "fullName profilePic")
      .lean();

    // 🔹 Convert _id → id for frontend consistency
    populatedMessage.id = populatedMessage._id;
    delete populatedMessage._id;

    // Emit socket event
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
           savedMessage.delivered = true;
              await savedMessage.save();

      io.to(receiverSocketId).emit("newMessage", populatedMessage);

      
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.log("Error in sendMessage controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
