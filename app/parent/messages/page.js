"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Navbar } from "@/components/Navbar";
import ChatInterface from "@/components/Messaging/ChatInterface";
import { MessageSquare } from "lucide-react";

export default function ParentMessagesPage() {
  return (
    <ProtectedRoute allowedRoles={["parent"]}>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-6xl mx-auto p-6 mt-16">
          <div className="mb-6">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <MessageSquare className="text-primary" />
              Teacher Communications
            </h1>
            <p className="text-muted-foreground mt-2">Direct messaging portal to communicate with teachers regarding your child's progress and behavior.</p>
          </div>
          <ChatInterface />
        </div>
      </div>
    </ProtectedRoute>
  );
}
