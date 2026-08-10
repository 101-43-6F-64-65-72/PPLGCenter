"use client";

import { useState, useEffect } from "react";
import { assignmentService } from "@/services/assignmentService";
import { CheckSquare, Trash2, Search, RefreshCw, AlertCircle, Clock, Eye } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Table, { TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import ErrorAlert from "@/components/common/ErrorAlert";

export default function AdminAssignmentsTab({ onSelectAssignmentForReview }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchAssignments();
  }, []);

  async function fetchAssignments() {
    try {
      setLoading(true);
      setError("");
      const res = await assignmentService.getAll();
      setAssignments(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Gagal memuat tugas");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Hapus tugas ini (Soft Delete)?")) return;
    try {
      await assignmentService.delete(id);
      fetchAssignments();
    } catch (err) {
      alert(err.response?.data?.message || "Gagal menghapus tugas");
    }
  }

  const filteredAssignments = assignments.filter(
    (a) =>
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.className?.toLowerCase().includes(search.toLowerCase()) ||
      a.subjectName?.toLowerCase().includes(search.toLowerCase()) ||
      a.teacherName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        icon={CheckSquare}
        title="Master Tugas (Assignments)"
        description="Monitoring tugas, deadline, dan pengumpulan submisi siswa."
        badge={<Badge variant="info">Master Tugas</Badge>}
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchAssignments}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Segarkan
          </Button>
        }
      />

      {error && <ErrorAlert title="Gagal Memuat Tugas" message={error} onClose={() => setError("")} />}

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari judul tugas, kelas, mapel, atau guru..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold focus:outline-none focus:border-[#2c1ee8]"
          />
        </div>
      </div>

      {/* Table Container */}
      <Table>
        <TableHeader variant="navy">
          <tr>
            <TableCell isHeader>Judul Tugas</TableCell>
            <TableCell isHeader>Kelas & Mapel</TableCell>
            <TableCell isHeader>Guru Pengampu</TableCell>
            <TableCell isHeader>Tenggat Waktu (Due Date)</TableCell>
            <TableCell isHeader>Skor Maks</TableCell>
            <TableCell isHeader>Submisi / Dinilai</TableCell>
            <TableCell isHeader className="text-right">Aksi</TableCell>
          </tr>
        </TableHeader>
        <TableBody isLoading={loading} isEmpty={filteredAssignments.length === 0} emptyText="Tidak ada tugas ditemukan" colSpan={7}>
          {filteredAssignments.map((a) => {
            const isPastDue = new Date(a.dueDate) < new Date();
            return (
              <TableRow key={a.id}>
                <TableCell>
                  <div className="flex items-center gap-2 font-black text-gray-900">
                    <CheckSquare className="w-4 h-4 text-[#2c1ee8] shrink-0" />
                    <span>{a.title}</span>
                  </div>
                  {a.description && <div className="text-xs text-gray-400 font-medium line-clamp-1 mt-0.5">{a.description}</div>}
                </TableCell>
                <TableCell>
                  <div className="font-bold text-gray-900">{a.className || "—"}</div>
                  <div className="text-[10px] text-gray-400 font-extrabold text-[#2c1ee8]">{a.subjectName}</div>
                </TableCell>
                <TableCell className="font-semibold text-gray-700">{a.teacherName || "—"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>{new Date(a.dueDate).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</span>
                  </div>
                  <Badge variant={isPastDue ? "danger" : "success"} size="sm" className="mt-1">
                    {isPastDue ? "Lewat Tenggat" : "Aktif"}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono font-bold text-gray-800">{a.maxScore ?? 100}</TableCell>
                <TableCell>
                  <span className="font-mono font-extrabold text-[#2c1ee8]">
                    {a.submissionsCount || 0} submisi
                  </span>
                </TableCell>
                <TableCell className="text-right space-x-1">
                  {onSelectAssignmentForReview && (
                    <Button
                      variant="secondary"
                      size="xs"
                      onClick={() => onSelectAssignmentForReview(a)}
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                    >
                      Review Submisi
                    </Button>
                  )}
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="p-1.5 rounded-xl border border-gray-200 hover:bg-rose-50 hover:text-rose-600 text-gray-400 transition cursor-pointer"
                    title="Hapus Tugas"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
