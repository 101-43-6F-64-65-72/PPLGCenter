"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import useAuth from "@/hooks/useAuth";
import { getStoredToken } from "@/lib/api";
import { notificationService } from "@/services/notificationService";
import NotificationDropdown from "./NotificationDropdown";

import BloubMascot from "@/components/BloubMascot";

export default function NotificationBell({ useMascot = false }) {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);
  const pollingRef = useRef(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    const token = getStoredToken();
    if (!isAuthenticated || !token) {
      stopPolling();
      setUnreadCount(0);
      return;
    }

    try {
      const res = await notificationService.getUnreadCount();
      const count = typeof res?.data === "number" ? res.data : typeof res === "number" ? res : 0;
      setUnreadCount(count);
    } catch (err) {
      if (err?.statusCode === 401 || err?.response?.status === 401 || !getStoredToken()) {
        stopPolling();
        setUnreadCount(0);
      }
    }
  }, [isAuthenticated, stopPolling]);

  const fetchSummary = useCallback(async () => {
    const token = getStoredToken();
    if (!isAuthenticated || !token) {
      stopPolling();
      return;
    }

    try {
      const res = await notificationService.getSummary();
      const payload = res?.data || res || {};
      const list = payload.recentUnread || payload.items || (Array.isArray(payload) ? payload : []);
      setNotifications(list);
      if (typeof payload.unreadCount === "number") {
        setUnreadCount(payload.unreadCount);
      }
    } catch (err) {
      if (err?.statusCode === 401 || err?.response?.status === 401 || !getStoredToken()) {
        stopPolling();
      }
      console.error("Failed to load notifications summary", err);
    }
  }, [isAuthenticated, stopPolling]);

  useEffect(() => {
    let isMounted = true;
    const token = getStoredToken();

    if (!isAuthenticated || !token) {
      stopPolling();
      setUnreadCount(0);
      return;
    }

    const loadInitial = async () => {
      if (isMounted) {
        await fetchUnreadCount();
      }
    };

    loadInitial();

    stopPolling();
    pollingRef.current = setInterval(() => {
      if (isMounted) {
        fetchUnreadCount();
      }
    }, 30000);

    const handleOpenNotifEvent = () => {
      setIsOpen(true);
      fetchSummary();
    };

    if (typeof window !== "undefined") {
      window.openNotificationDrawer = handleOpenNotifEvent;
      window.addEventListener("app:open-notifications", handleOpenNotifEvent);
    }

    return () => {
      isMounted = false;
      stopPolling();
      if (typeof window !== "undefined") {
        window.removeEventListener("app:open-notifications", handleOpenNotifEvent);
        delete window.openNotificationDrawer;
      }
    };
  }, [isAuthenticated, fetchUnreadCount, stopPolling, fetchSummary]);

  const handleToggle = () => {
    if (!isOpen) {
      fetchSummary();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      fetchSummary();
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  // Close dropdown on click outside, but ignore clicks originating inside AI Chat Modal or mascot
  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target;
      if (!target) return;

      const isAiChatClick = Boolean(
        target.closest && (
          target.closest("#ai-chat-modal") ||
          target.closest(".ai-chat-container") ||
          target.closest("[data-ai-modal]") ||
          target.closest("[aria-label*='Replyz']") ||
          target.closest("[aria-label*='Chat']")
        )
      );

      if (isAiChatClick) return;

      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id="notif_button"
        onClick={handleToggle}
        className={`relative flex items-center justify-center transition-all cursor-pointer rounded-2xl ${
          useMascot
            ? "p-1 hover:scale-105 active:scale-95"
            : "p-2.5 text-slate-600 hover:text-[#2c1ee8] bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-xl"
        }`}
        title="Notifikasi"
        aria-label="Notifikasi"
      >
        {useMascot ? (
          <BloubMascot
            size={38}
            state={isOpen ? "happy" : unreadCount > 0 ? "notif" : "idle"}
            badge={unreadCount > 0 ? unreadCount : false}
            badgeColor="#ef4444"
            interactiveGaze={false}
          />
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.75}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 0 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 0-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
              />
            </svg>

            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-600 text-[9px] font-black text-white shadow-md shadow-rose-500/20 ring-2 ring-white animate-pulse">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </>
        )}
      </button>

      {isOpen && (
        <NotificationDropdown
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAllRead={handleMarkAllRead}
          onMarkRead={handleMarkRead}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
