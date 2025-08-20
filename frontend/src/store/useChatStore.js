import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  // 🔹 Fetch all users
  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  // 🔹 Fetch chat messages with a user
  getMessages: async (userId) => {
    if (!userId) {
      console.error("No user ID provided to getMessages");
      return;
    }
    
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // 🔹 Send a message
  sendMessage: async (messageData) => {
    const { selectedUser, messages, users } = get();
    
    if (!selectedUser || !selectedUser.id) {
      toast.error("Please select a user to message");
      return;
    }

    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser.id}`,
        messageData,
        {
          headers: {
            "Content-Type": "application/json",   // ✅ force JSON
          },
        }
      );

      const newMessage = res.data;

      // update messages in chat window
      set({ messages: [...messages, newMessage] });

      // ✅ also update sidebar with latest msg
      set({
        users: users.map((u) =>
          u.id === selectedUser.id
            ? {
                ...u,
                lastMessage: newMessage.text || "📷 Image",
                lastMessageTime: newMessage.createdAt,
              }
            : u
        ),
      });
    } catch (error) {
      console.error("SendMessage Error:", error.response?.data || error.message);
      toast.error(error.response?.data?.error || "Failed to send message");
    }
  },

  // 🔹 Subscribe to socket messages
  subscribeToMessages: () => {
    const { selectedUser, users } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isRelevant =
        newMessage.senderId === selectedUser.id ||
        newMessage.receiverId === selectedUser.id;

      if (isRelevant) {
        set({
          messages: [...get().messages, newMessage],
        });
      }

      // ✅ update sidebar when new message comes
      set({
        users: users.map((u) =>
          u.id === newMessage.senderId || u.id === newMessage.receiverId
            ? {
                ...u,
                lastMessage: newMessage.text || "📷 Image",
                lastMessageTime: newMessage.createdAt,
              }
            : u
        ),
      });
    });

   
socket.on("messages:read", ({ from, to }) => {
  const authUser = useAuthStore.getState().authUser;
  
  
  const isRelevant = from === authUser._id;
  
  if (isRelevant) {
    set({
      messages: get().messages.map((msg) =>
        msg.senderId === to || msg.senderId?._id === to
          ? { ...msg, read: true }
          : msg
      ),
    });
  }
});
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
