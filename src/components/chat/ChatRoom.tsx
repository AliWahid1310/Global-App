"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, ChatMessage } from "@/types/database";
import { Send, User, Smile } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";

interface ChatRoomProps {
  societyId: string;
  currentUser: Profile;
  initialMessages: (ChatMessage & { user: Profile | null })[];
}

export function ChatRoom({
  societyId,
  currentUser,
  initialMessages,
}: ChatRoomProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${societyId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `society_id=eq.${societyId}`,
        },
        async (payload) => {
          // Fetch the user info for the new message
          const { data: user } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", payload.new.user_id)
            .single();

          const newMsg = {
            ...payload.new,
            user,
          } as ChatMessage & { user: Profile | null };

          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [societyId, supabase]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage("");

    try {
      const messageData = {
        society_id: societyId,
        user_id: currentUser.id,
        content: messageContent,
      };
      const { error } = await (supabase.from("chat_messages") as any).insert(messageData);

      if (error) throw error;
    } catch (error) {
      console.error("Error sending message:", error);
      setNewMessage(messageContent); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, "h:mm a");
    } else if (isYesterday(date)) {
      return "Yesterday " + format(date, "h:mm a");
    }
    return format(date, "MMM d, h:mm a");
  };

  const shouldShowDateDivider = (
    currentMsg: ChatMessage,
    prevMsg: ChatMessage | null
  ) => {
    if (!prevMsg) return true;
    const current = new Date(currentMsg.created_at).toDateString();
    const prev = new Date(prevMsg.created_at).toDateString();
    return current !== prev;
  };

  const getDateDividerText = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "EEEE, MMMM d, yyyy");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-dark-900 rounded-2xl overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 chat-scroll">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-dark-400">
            <div className="w-20 h-20 bg-dark-800 rounded-full flex items-center justify-center mb-4">
              <Smile className="h-10 w-10 text-dark-500" />
            </div>
            <p className="text-lg font-medium text-dark-200">No messages yet</p>
            <p className="text-sm">Be the first to say hello! 👋</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => {
              const prevMessage = index > 0 ? messages[index - 1] : null;
              const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
              const isOwnMessage = message.user_id === currentUser.id;
              const showAvatar =
                !prevMessage || prevMessage.user_id !== message.user_id;
              
              // Only show timestamp if next message is from different user OR has different time
              const currentTime = formatMessageDate(message.created_at);
              const nextTime = nextMessage ? formatMessageDate(nextMessage.created_at) : null;
              const isNextSameUser = nextMessage && nextMessage.user_id === message.user_id;
              const isNextSameTime = nextTime === currentTime;
              const showTimestamp = !nextMessage || !isNextSameUser || !isNextSameTime;

              return (
                <div key={message.id} className="animate-message-float">
                  {/* Date Divider */}
                  {shouldShowDateDivider(message, prevMessage) && (
                    <div className="flex items-center justify-center my-6">
                      <span className="px-4 py-1.5 bg-dark-800 text-dark-300 text-xs rounded-full border border-dark-700">
                        {getDateDividerText(message.created_at)}
                      </span>
                    </div>
                  )}

                  {/* Message */}
                  <div
                    className={`flex gap-3 ${
                      isOwnMessage ? "flex-row-reverse" : ""
                    }`}
                  >
                    {/* Avatar */}
                    <div className={`flex-shrink-0 ${showAvatar ? "" : "invisible"}`}>
                      <div className="w-9 h-9 rounded-full bg-dark-700 ring-2 ring-dark-600 flex items-center justify-center overflow-hidden">
                        {message.user?.avatar_url ? (
                          <img
                            src={message.user.avatar_url}
                            alt={message.user.full_name || "User"}
                            className="w-9 h-9 rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-4 w-4 text-dark-400" />
                        )}
                      </div>
                    </div>

                    {/* Message Content */}
                    <div
                      className={`max-w-[70%] ${
                        isOwnMessage ? "items-end" : "items-start"
                      }`}
                    >
                      {showAvatar && (
                        <p
                          className={`text-xs text-dark-400 mb-1.5 font-medium ${
                            isOwnMessage ? "text-right" : "text-left"
                          }`}
                        >
                          {message.user?.full_name || "Unknown User"}
                        </p>
                      )}
                      <div
                        className={`px-4 py-2.5 rounded-2xl ${
                          isOwnMessage
                            ? "bg-gradient-to-r from-accent-600 to-accent-500 text-white rounded-br-md shadow-lg shadow-accent-500/20"
                            : "bg-dark-800 border border-dark-700 text-dark-100 rounded-bl-md"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      </div>
                      {showTimestamp && (
                        <p
                          className={`text-xs text-dark-500 mt-1.5 ${
                            isOwnMessage ? "text-right" : "text-left"
                          }`}
                        >
                          {formatMessageDate(message.created_at)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="border-t border-dark-700 bg-dark-800/50 backdrop-blur px-4 py-4">
        <form onSubmit={handleSend} className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-5 py-3 bg-dark-800 border border-dark-600 rounded-full text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all"
            maxLength={1000}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-accent-500 text-white rounded-full hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all btn-glow"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
