import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  useEffect(() => {
    if (selectedUser && selectedUser.id) {
      console.log("Loading messages for:", selectedUser.id);
      getMessages(selectedUser.id);
      subscribeToMessages();
    } else {
      console.log("No selected user, skipping message load");
    }

    return () => unsubscribeFromMessages();
  }, [selectedUser, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (!selectedUser) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <h3 className="text-lg font-medium">No Conversation Selected</h3>
            <p>Select a user from the sidebar to start chatting</p>
          </div>
        </div>
      </div>
    );
  }

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {

                console.log("=== MESSAGE DEBUG ===");
  console.log("Full message object:", message);
  console.log("Message text:", message.text);
  console.log("Message image:", message.image);
  console.log("Has text:", !!message.text);
  console.log("Has image:", !!message.image);
  console.log("=====================");

            // Handle both populated object and string ID formats
            const senderId = message.senderId?._id 
              ? message.senderId._id.toString() 
              : message.senderId?.toString();
            
            const isOwnMessage = senderId === authUser._id.toString();

            const senderProfilePic = message.senderId?.profilePic || 
                                   (isOwnMessage ? authUser.profilePic : selectedUser.profilePic);

            return (
              <div
                key={message._id}
                className={`chat ${isOwnMessage ? "chat-end" : "chat-start"}`}
              >
                <div className="chat-image avatar">
                  <div className="size-10 rounded-full border">
                    <img
                      src={senderProfilePic || "/avatar.png"}
                      alt="profile pic"
                    />
                  </div>
                </div>
                <div className="chat-header mb-1 flex items-center gap-2">
                  {!isOwnMessage && (
                    <span className="font-medium text-xs">
                      {message.senderId?.fullName || selectedUser.fullName}
                    </span>
                  )}
                  <time className="text-xs opacity-50">
                    {formatMessageTime(message.createdAt)}
                  </time>
                </div>
                <div className={`chat-bubble ${isOwnMessage ? "bg-blue-500 text-white" : "bg-gray-200 text-black"} flex flex-col`}>
                  {message.image && (
                    <img
                      src={message.image}
                      alt="Attachment"
                      className="sm:max-w-[200px] rounded-md mb-2"
                    />
                  )}
                  {message.text && <p>{message.text}</p>}
                </div>
              </div>
            );
          })
        )}
        <div ref={messageEndRef} />
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;