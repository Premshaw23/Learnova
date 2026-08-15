"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import { Send, User, MessageCircle, Info } from "lucide-react";

export default function ChatInterface() {
  const { token, userProfile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      try {
        const res = await fetch("/api/messages", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setMessages(data.messages || []);
          setContacts(data.contacts || []);
        }
      } catch (err) {
        toast.error("Failed to load messages");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeContact]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeContact) return;

    const msgText = inputMessage;
    setInputMessage("");

    // Optimistic update
    const tempMsg = {
      _id: Date.now().toString(),
      senderId: userProfile?.uid,
      recipientId: activeContact.id,
      content: msgText,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientId: activeContact.id,
          content: msgText
        })
      });
      
      const data = await res.json();
      if (!data.success) {
        toast.error("Failed to send message");
        // Revert optimistic update in real app
      }
    } catch (err) {
      toast.error("Network error");
    }
  };

  const activeMessages = messages.filter(m => 
    (m.senderId === userProfile?.uid && m.recipientId === activeContact?.id) ||
    (m.recipientId === userProfile?.uid && m.senderId === activeContact?.id)
  );

  if (isLoading) return <div className="p-8 text-center text-zinc-400">Loading messages...</div>;

  return (
    <div className="flex h-[70vh] min-h-[500px] border border-border rounded-xl overflow-hidden bg-card shadow-sm mt-6">
      {/* Contacts Sidebar */}
      <div className="w-1/3 border-r border-border bg-muted/30 flex flex-col">
        <div className="p-4 border-b border-border bg-muted/50">
          <h2 className="font-bold flex items-center gap-2">
            <MessageCircle size={18} />
            Direct Messages
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {contacts.length === 0 ? (
            <p className="text-xs text-muted-foreground p-4 text-center">No contacts available.</p>
          ) : (
            contacts.map(contact => (
              <button
                key={contact.id}
                onClick={() => setActiveContact(contact)}
                className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${
                  activeContact?.id === contact.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  activeContact?.id === contact.id ? "bg-primary-foreground/20" : "bg-primary/10 text-primary"
                }`}>
                  <User size={16} />
                </div>
                <div className="truncate text-sm font-medium">
                  {contact.name || "Unknown"}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-background relative">
        {activeContact ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border bg-card flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <User size={20} />
              </div>
              <div>
                <h3 className="font-bold">{activeContact.name}</h3>
                <p className="text-xs text-muted-foreground capitalize">Connected {activeContact.role || 'User'}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {activeMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                  <MessageCircle size={48} className="mb-4 opacity-20" />
                  <p>No messages yet.</p>
                  <p className="text-sm">Send a message to start the conversation.</p>
                </div>
              ) : (
                activeMessages.map(msg => {
                  const isMe = msg.senderId === userProfile?.uid;
                  return (
                    <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] p-3 rounded-2xl text-sm ${
                        isMe 
                          ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                          : 'bg-muted rounded-tl-sm'
                      }`}>
                        {msg.content}
                        <div className={`text-[10px] mt-1 text-right opacity-70 ${!isMe && 'text-muted-foreground'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-card flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-muted/50 border border-input rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button 
                type="submit"
                disabled={!inputMessage.trim()}
                className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 disabled:opacity-50 transition-opacity shrink-0"
              >
                <Send size={16} className="ml-1" />
              </button>
            </form>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <MessageCircle size={32} />
            </div>
            <h3 className="font-bold text-lg mb-1">Your Messages</h3>
            <p className="text-sm max-w-xs text-center">
              Select a contact from the sidebar to view your conversation or start a new one.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
