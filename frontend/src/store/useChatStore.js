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


 
sendMessage: async (messageData) => {
  const { selectedUser, messages } = get();
  
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
          'Content-Type': 'multipart/form-data', 
        },
      }
    );

    
    set({ messages: [...messages, res.data] });
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to send message");
  }
},

  
  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      
      const isRelevant =
        newMessage.senderId === selectedUser.id ||
        newMessage.receiverId === selectedUser.id;

      if (!isRelevant) return;

      set({
        messages: [...get().messages, newMessage],
      });
    });
  },

  
  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));