import React from "react";
import Link from "next/link";
import { 
  Check, 
  Trash2, 
  Megaphone, 
  FileText, 
  Award, 
  Clock, 
  Lock, 
  BookOpen, 
  Calendar, 
  Settings, 
  Bell, 
  AlertTriangle, 
  AlertCircle 
} from "lucide-react";

function formatTimeAgo(dateInput) {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  const now = new Date();
  const diffInSeconds = Math.max(0, Math.floor((now - date) / 1000));

  if (diffInSeconds < 60) return "Baru saja";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} mnt lalu`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} jam lalu`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} hr lalu`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths} bln lalu`;
  return `${Math.floor(diffInMonths / 12)} thn lalu`;
}

export default function NotificationItem({ notification, onMarkRead, onDelete }) {
  const isRead = notification.isRead;
  const priority = notification.priority ?? 1;

  const getIcon = () => {
    switch (notification.type) {
      case 0: return <Megaphone className="w-4 h-4" />;
      case 1: return <FileText className="w-4 h-4" />;
      case 2: return <Award className="w-4 h-4" />;
      case 3: return <Clock className="w-4 h-4" />;
      case 4: return <Lock className="w-4 h-4" />;
      case 5: return <BookOpen className="w-4 h-4" />;
      case 6: return <Calendar className="w-4 h-4" />;
      case 7: return <Settings className="w-4 h-4" />;
      case 8:
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getPriorityConfig = () => {
    switch (priority) {
      case 3:
        return {
          border: "border-l-4 border-l-rose-500",
          badge: (
            <span className="text-[10px] bg-rose-100 text-rose-700 border border-rose-200 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
              <AlertTriangle className="w-3 h-3 text-rose-600" />
              Darurat
            </span>
          ),
          unreadBg: "bg-rose-50/50 border-rose-200 hover:border-rose-300",
          iconBg: "bg-rose-100 text-rose-600 border-rose-200",
          unreadDot: "bg-rose-600",
          titleColor: "text-rose-700",
        };
      case 2:
        return {
          border: "border-l-4 border-l-amber-500",
          badge: (
            <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-200 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
              <AlertCircle className="w-3 h-3 text-amber-600" />
              Penting
            </span>
          ),
          unreadBg: "bg-amber-50/40 border-amber-200 hover:border-amber-300",
          iconBg: "bg-amber-100 text-amber-700 border-amber-200",
          unreadDot: "bg-amber-500",
          titleColor: "text-amber-900",
        };
      case 0:
        return {
          border: "border-l-4 border-l-slate-400",
          badge: (
            <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 font-medium px-2 py-0.5 rounded-full shrink-0">
              Rendah
            </span>
          ),
          unreadBg: "bg-slate-100/70 border-slate-200 hover:border-slate-300",
          iconBg: "bg-slate-100 text-slate-600 border-slate-200",
          unreadDot: "bg-slate-400",
          titleColor: "text-slate-800",
        };
      case 1:
      default:
        return {
          border: "border-l-4 border-l-indigo-500",
          badge: (
            <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold px-2 py-0.5 rounded-full shrink-0">
              Normal
            </span>
          ),
          unreadBg: "bg-blue-50/70 border-blue-200 hover:border-[#2c1ee8]/40",
          iconBg: "bg-indigo-100 text-[#2c1ee8] border-indigo-200",
          unreadDot: "bg-[#2c1ee8]",
          titleColor: "text-[#2c1ee8]",
        };
    }
  };

  const priorityConfig = getPriorityConfig();
  const formattedTime = formatTimeAgo(notification.createdAt);

  const handleClick = () => {
    if (!isRead && onMarkRead) {
      onMarkRead(notification.id);
    }
  };

  const content = (
    <div
      onClick={handleClick}
      className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${priorityConfig.border} ${
        isRead
          ? "bg-white border-gray-100 text-gray-700 opacity-85 hover:bg-gray-50 hover:opacity-100"
          : `${priorityConfig.unreadBg} text-gray-900 shadow-xs`
      }`}
    >
      <div className={`shrink-0 w-9 h-9 rounded-xl border flex items-center justify-center shadow-xs transition-colors ${
        isRead ? "bg-gray-100 text-gray-500 border-gray-200" : priorityConfig.iconBg
      }`}>
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h4 className={`text-xs sm:text-sm font-black truncate ${!isRead ? priorityConfig.titleColor : "text-gray-900"}`}>
            {notification.title}
          </h4>
          <div className="flex items-center gap-1.5 shrink-0">
            {priorityConfig.badge}
            {!isRead && <span className={`w-2 h-2 rounded-full animate-pulse ${priorityConfig.unreadDot}`} />}
          </div>
        </div>
        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed font-medium">
          {notification.body || notification.message}
        </p>
        <span className="text-[10px] text-gray-400 font-semibold mt-1 block">{formattedTime}</span>
      </div>

      <div className="flex flex-col gap-1 shrink-0">
        {!isRead && onMarkRead && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onMarkRead(notification.id);
            }}
            title="Tandai Dibaca"
            className="p-1 text-gray-400 hover:text-[#2c1ee8] hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDelete(notification.id);
            }}
            title="Hapus Notifikasi"
            className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );

  const resolveActionUrl = (rawUrl, notif) => {
    let url = rawUrl;

    const refType = notif?.referenceType;
    const type = notif?.type;
    const refId = notif?.referenceId;

    // Check Proposal
    const isProposal =
      refType === 8 ||
      refType === "Proposal" ||
      type === 10 || // Proposal
      type === 19 || // ProposalSubmitted
      type === 20 || // ProposalApproved
      type === 21 || // ProposalRejected
      type === 22;   // ProposalRevisionRequested

    // Check Extracurricular
    const isExtracurricular =
      refType === 15 ||
      refType === "Extracurricular" ||
      type === 23 || // ExtracurricularRegistrationApproved
      type === 24;   // ExtracurricularRegistrationRejected

    // Check Announcement / Mading
    const isAnnouncement =
      refType === 1 ||
      refType === "Announcement" ||
      type === 0 ||  // Announcement
      type === 18;   // AnnouncementComment

    // Check Election / Pemilos
    const isElection =
      refType === 17 ||
      refType === "Election" ||
      (typeof type === "number" && type >= 25 && type <= 28);

    // Check Grade / Nilai
    const isGrade =
      refType === 10 ||
      refType === "StudentGrade" ||
      type === 2 ||  // AssignmentGraded
      type === 12 || // GradePublished
      type === 13;   // GradeUpdated

    // Check Facility / Booking
    const isFacility =
      refType === 7 ||
      refType === 16 ||
      refType === "Facility" ||
      refType === "Booking" ||
      type === 9;    // Booking

    // Check Academic Event / Calendar
    const isCalendar =
      refType === 5 ||
      refType === "AcademicEvent" ||
      type === 6;

    if (!url) {
      if (isProposal) {
        url = refId ? `/proposal?id=${refId}` : "/proposal";
      } else if (isExtracurricular) {
        url = refId ? `/ekstrakurikuler/${refId}` : "/ekstrakurikuler";
      } else if (isAnnouncement) {
        url = refId ? `/mading/${refId}` : "/mading";
      } else if (isElection) {
        url = "/pemilos";
      } else if (isGrade) {
        url = "/nilai";
      } else if (isFacility) {
        url = "/fasilitas";
      } else if (isCalendar) {
        url = "/kalender";
      }
    }

    if (!url) return null;

    // Standardize URL paths
    if (url.startsWith("/announcements/")) {
      return url.replace("/announcements/", "/mading/");
    }
    if (url === "/announcements") {
      return "/mading";
    }
    if (url.startsWith("/proposals/")) {
      return url.replace("/proposals/", "/proposal/");
    }
    if (url === "/proposals") {
      return "/proposal";
    }
    if (url.startsWith("/extracurriculars/")) {
      return url.replace("/extracurriculars/", "/ekstrakurikuler/");
    }
    if (url === "/extracurriculars") {
      return "/ekstrakurikuler";
    }

    return url;
  };

  const targetUrl = resolveActionUrl(notification.actionUrl, notification);

  if (targetUrl) {
    return (
      <Link href={targetUrl} className="block group">
        {content}
      </Link>
    );
  }

  return <div className="group">{content}</div>;
}
