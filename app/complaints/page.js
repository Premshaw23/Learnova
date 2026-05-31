"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import ComplaintsTable from "@/components/ComplaintsTable";
import ComplaintForm from "@/components/ComplaintForm";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import CardListSkeleton from "@/components/ui/CardListSkeleton";
import toast from "react-hot-toast";

  


export default function ComplaintsPage() {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [authLoading, user, router]);

  if (authLoading) return null;

  const [complaints, setComplaints] = useState([
    {
      id: "CMP-101",
      student: "Rahul Sharma",
      roll: "22CS101",
      department: "Computer Engineering",
      title: "Attendance not updated",
      category: "Academic",
      priority: "High",
      status: "Pending",
      date: "12 Aug 2026",
    },
    {
      id: "CMP-102",
      student: "Aman Verma",
      roll: "22CS109",
      department: "IT",
      title: "Portal not loading",
      category: "Technical",
      priority: "Medium",
      status: "Resolved",
      date: "11 Aug 2026",
    },
    {
      id: "CMP-103",
      student: "Priya Singh",
      roll: "22CS111",
      department: "ENTC",
      title: "Hostel water issue",
      category: "Hostel",
      priority: "Low",
      status: "Not Resolved",
      date: "10 Aug 2026",
    },
  ]);


  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleAddComplaint = (newComplaint) => {
    setComplaints((prev) => [
      {
        ...newComplaint,
        id: `CMP-${prev.length + 104}`,
        status: "Pending",
        date: new Date().toLocaleDateString(),
      },
      ...prev,
    ]);

    setShowForm(false);
    toast.success("Complaint submitted successfully!");
  };

 

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="pt-24 px-4 md:px-8 lg:px-10 pb-10">

        {loading ? (
          <CardListSkeleton count={3} variant="table" />
        ) : showForm ? (
          <ComplaintForm
            onClose={() => setShowForm(false)}
            onSubmitComplaint={handleAddComplaint}

            
          />
        ) : (
          <ComplaintsTable
            complaints={complaints}
            onRaiseComplaint={() => setShowForm(true)}
          />
        )}

      </div>
    </div>
  );
}