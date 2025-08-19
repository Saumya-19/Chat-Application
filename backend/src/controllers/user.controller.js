
   import User from "../models/user.model.js";
import Message from "../models/message.model.js";

export const getUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } });

    const usersWithLastMsg = await Promise.all(
      users.map(async (u) => {
        const lastMsg = await Message.findOne({
          $or: [
            { senderId: req.user._id, receiverId: u._id },
            { senderId: u._id, receiverId: req.user._id }
          ]
        })
          .sort({ createdAt: -1 })
          .limit(1);

        return {
          id: u._id,
          fullName: u.fullName,
          profilePic: u.profilePic,
          status: u.status,
          lastMessage: lastMsg
            ? (lastMsg.text ? lastMsg.text : "📷 Image")
            : "",
          lastMessageTime: lastMsg ? lastMsg.createdAt : null,
        };
      })
    );

    usersWithLastMsg.sort((a, b) => {
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;
      return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
    });

    res.json(usersWithLastMsg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


