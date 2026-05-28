"use client";
import UniversalSettings from "@/components/universal-settings";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="pt-16">
      {" "}
      {/* Just padding, no backgrounds */}
      <Navbar />
      <UniversalSettings user={user} />
    </div>
  );
}
