"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthGuard from "@/components/layout/AuthGuard";
import Sidebar from "@/components/layout/Sidebar";
import RoleBasedDashboard from "@/components/layout/RoleBasedDashboard";
import useAuth from "@/hooks/useAuth";

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

function DashboardContent() {
  const { role, user } = useAuth();
  const normalizedRole = (role || user?.role || "Student").toLowerCase();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 flex w-full max-w-7xl mx-auto pt-20 lg:pt-24 min-h-[calc(100vh-6rem)]">
        {/* Role-based Sidebar */}
        <div className="hidden lg:block">
          <Sidebar role={role || user?.role || "Student"} />
        </div>

        {/* Main content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto">
          <RoleBasedDashboard />
        </main>
      </div>

      <Footer />
    </div>
  );
}
