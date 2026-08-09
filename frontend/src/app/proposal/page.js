"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import ProposalForm from "@/components/proposal/ProposalForm";
import ProposalList from "@/components/proposal/ProposalList";
import AdminProposalTab from "@/components/admin/AdminProposalTab";
import AuthGuard from "@/components/layout/AuthGuard";
import useAuth from "@/hooks/useAuth";
import { extracurricularService } from "@/services/extracurricularService";
import { proposalService } from "@/services/proposalService";
import uploadImageToCloudinary, { uploadPdfDocument } from "@/services/cloudinaryService";

export default function ProposalPage() {
  const { user, isAuthenticated, role } = useAuth();

  const [formData, setFormData] = useState({
    organization: "",
    selectedOrganization: "",
    customOrganization: "",
    title: "",
    description: "",
  });
  const [extracurriculars, setExtracurriculars] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadError, setUploadError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [proposals, setProposals] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [editingProposalId, setEditingProposalId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingExtracurriculars, setIsLoadingExtracurriculars] = useState(true);
  const [extracurricularError, setExtracurricularError] = useState("");

  // Fetch Extracurricular memberships for authenticated user
  const loadExtracurricularMemberships = React.useCallback(async () => {
    const userId = user?.id || user?.Id;
    if (!userId) {
      setExtracurriculars([]);
      setIsLoadingExtracurriculars(false);
      return;
    }

    setIsLoadingExtracurriculars(true);
    setExtracurricularError("");

    try {
      const res = await extracurricularService.getUserMemberships(userId);
      if (res && res.success) {
        setExtracurriculars(res.data || []);
      } else {
        setExtracurricularError("Gagal memuat daftar ekstrakurikuler Anda.");
        setExtracurriculars([]);
      }
    } catch (err) {
      setExtracurricularError("Gagal memuat data ekstrakurikuler Anda.");
      setExtracurriculars([]);
    } finally {
      setIsLoadingExtracurriculars(false);
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    if (isAuthenticated && (user?.id || user?.Id)) {
      queueMicrotask(() => {
        if (isMounted) loadExtracurricularMemberships();
      });
    }
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user, loadExtracurricularMemberships]);

  // Fetch Proposals list belonging strictly to the currently authenticated user
  const fetchProposals = React.useCallback(async () => {
    const currentUserId = user?.id || user?.Id;
    if (!currentUserId) {
      setProposals([]);
      return;
    }

    try {
      // 1. Pass currentUserId to REST API endpoint (GET /api/proposals?userId={currentUserId})
      const res = await proposalService.getProposals({ userId: currentUserId });
      if (res && res.success && Array.isArray(res.data)) {
        // 2. Client-side defensive filter to ensure strictly only current user's proposals are mapped
        const userProposalsOnly = res.data.filter((item) => {
          const itemUserId = item.submittedByUserId || item.SubmittedByUserId;
          if (!itemUserId) return true; // Accept if backend already filtered and omitted user ID
          return String(itemUserId).toLowerCase() === String(currentUserId).toLowerCase();
        });

        const mapped = userProposalsOnly.map((item) => {
          let org = "Ekstrakurikuler";
          let rawTitle = item.title || item.Title || "";

          // Extract [Organization] tag if present in title
          const tagMatch = rawTitle.match(/^\[+(.*?)\]+\s*(.*)$/);
          if (tagMatch) {
            org = tagMatch[1].replace(/\[SEED\]\s*/i, "").trim() || "Ekstrakurikuler";
            rawTitle = tagMatch[2].trim() || rawTitle;
          }

          const statusVal = item.status ?? item.Status ?? 0;
          const reviewerName = item.reviewedByUserName || item.ReviewedByUserName || "";
          let statusText = "Menunggu Review";
          if (statusVal === 1 || statusVal === "Approved") {
            statusText = reviewerName ? `Disetujui oleh ${reviewerName}` : "Disetujui Admin";
          } else if (statusVal === 2 || statusVal === "Rejected") {
            statusText = reviewerName ? `Ditolak oleh ${reviewerName}` : "Ditolak Admin";
          }

          return {
            id: item.id || item.Id,
            organization: org,
            title: rawTitle,
            description: item.description || item.Description,
            status: statusText,
            createdAt: item.createdAt ? new Date(item.createdAt).toLocaleDateString("id-ID") : "Baru saja",
            files: item.fileUrl ? [{ id: "1", name: "Dokumen Proposal.pdf", url: item.fileUrl }] : [],
            fileUrl: item.fileUrl || "",
            submittedByUserId: item.submittedByUserId || item.SubmittedByUserId,
          };
        });
        setProposals(mapped);
      } else {
        setProposals([]);
      }
    } catch (err) {
      setProposals([]);
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    if (isAuthenticated && (user?.id || user?.Id)) {
      queueMicrotask(() => {
        if (isMounted) fetchProposals();
      });
    } else if (!isAuthenticated) {
      queueMicrotask(() => {
        if (isMounted) setProposals([]);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user, fetchProposals]);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;

    if (name === "organization") {
      setFormData((prev) => ({
        ...prev,
        selectedOrganization: value,
        organization: value === "Lainnya (Ketik Manual)" ? "" : value,
        customOrganization: value === "Lainnya (Ketik Manual)" ? prev.customOrganization : "",
      }));
      setFormErrors((prev) => ({
        ...prev,
        selectedOrganization: null,
        organization: null,
        customOrganization: null,
      }));
      return;
    }

    if (name === "customOrganization") {
      setFormData((prev) => ({
        ...prev,
        customOrganization: value,
        organization: prev.selectedOrganization === "Lainnya (Ketik Manual)" ? value : prev.organization,
      }));
      setFormErrors((prev) => ({
        ...prev,
        customOrganization: null,
        organization: null,
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleFileSelect = async (files) => {
    if (!files) return;

    const fileArray = Array.isArray(files)
      ? files
      : files instanceof FileList
      ? Array.from(files)
      : [files];

    const acceptedFiles = [];
    let hasInvalidFile = false;

    for (const file of fileArray) {
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        hasInvalidFile = true;
        continue;
      }

      acceptedFiles.push({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name: file.name,
        size: file.size,
        type: file.type || "application/pdf",
        rawFile: file,
      });
    }

    if (hasInvalidFile) {
      setUploadError("Hanya file PDF yang dapat diunggah.");
    } else {
      setUploadError("");
    }

    if (!acceptedFiles.length) return;
    setSelectedFiles((prev) => [...prev, ...acceptedFiles]);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    setIsDragging(false);
    const files = event.dataTransfer.files;
    await handleFileSelect(files);
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, indexToRemove) => indexToRemove !== index));
  };

  const handleRemoveProposalFile = (proposalId, fileId) => {
    setSelectedFiles((prev) => prev.filter((file) => file.id !== fileId));
  };

  const cancelEdit = () => {
    setEditingProposalId(null);
    setIsEditing(false);
    setFormData({
      organization: "",
      selectedOrganization: "",
      customOrganization: "",
      title: "",
      description: "",
    });
    setSelectedFiles([]);
    setFormErrors({});
    setUploadError("");
    setSuccessMessage("");
  };

  const handleEditProposal = (proposal) => {
    setFormData({
      organization: proposal.organization,
      selectedOrganization: proposal.organization,
      customOrganization: "",
      title: proposal.title,
      description: proposal.description,
    });
    setSelectedFiles(
      Array.isArray(proposal.files) && proposal.files.length
        ? proposal.files
        : []
    );
    setFormErrors({});
    setUploadError("");
    setEditingProposalId(proposal.id);
    setIsEditing(true);
    setSuccessMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteProposal = async (id) => {
    const confirmed = window.confirm("Apakah Anda yakin ingin menghapus proposal ini?");
    if (!confirmed) return;

    try {
      const res = await proposalService.deleteProposal(id);
      if (res.success) {
        setSuccessMessage("✓ Proposal berhasil dihapus.");
        await fetchProposals();
      } else {
        setUploadError(res.message || "Gagal menghapus proposal.");
      }
    } catch {
      setUploadError("Gagal menghapus proposal.");
    }

    if (editingProposalId === id) {
      cancelEdit();
    }

    setTimeout(() => setSuccessMessage(""), 4000);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isAuthenticated) {
      setUploadError("Sesi Anda belum terautentikasi. Silakan login terlebih dahulu.");
      return;
    }

    const selectedOrganization = formData.selectedOrganization;
    const organization =
      selectedOrganization === "Lainnya (Ketik Manual)"
        ? formData.customOrganization.trim()
        : selectedOrganization;

    const errors = {};

    if (!selectedOrganization) {
      errors.selectedOrganization = "Pilih organisasi.";
    }

    if (
      selectedOrganization === "Lainnya (Ketik Manual)" &&
      !formData.customOrganization.trim()
    ) {
      errors.customOrganization = "Masukkan nama organisasi.";
    }

    if (!formData.title.trim()) {
      errors.title = "Judul proposal wajib diisi.";
    } else if (formData.title.trim().length < 5) {
      errors.title = "Judul proposal minimal 5 karakter.";
    }

    if (!formData.description.trim()) {
      errors.description = "Deskripsi kegiatan wajib diisi.";
    } else if (formData.description.trim().length < 10) {
      errors.description = "Deskripsi kegiatan minimal 10 karakter.";
    }

    if (!selectedFiles.length) {
      setUploadError("File PDF proposal wajib dilampirkan.");
    }

    if (Object.keys(errors).length > 0 || !selectedFiles.length) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setUploadError("");
    setSuccessMessage("");

    try {
      let fileUrl = "";
      const fileToUpload = selectedFiles[0];

      if (fileToUpload?.rawFile) {
        const uploadRes = await uploadPdfDocument(fileToUpload.rawFile, "proposals");
        fileUrl = uploadRes?.path || uploadRes?.url || "";
      } else if (fileToUpload?.url || fileToUpload?.path) {
        fileUrl = fileToUpload.path || fileToUpload.url;
      }

      if (!fileUrl) {
        throw new Error("Gagal mengunggah dokumen proposal. Coba pilih file PDF kembali.");
      }

      const fullTitle = `[${organization}] ${formData.title.trim()}`;
      const payload = {
        title: fullTitle,
        description: formData.description.trim(),
        category: organization,
        fileUrl: fileUrl,
      };

      let res;
      if (isEditing && editingProposalId) {
        res = await proposalService.updateProposal(editingProposalId, payload);
      } else {
        res = await proposalService.createProposal(payload);
      }

      if (res && res.success) {
        setSuccessMessage(
          isEditing
            ? "✓ Proposal berhasil diperbarui!"
            : "✓ Proposal berhasil diajukan!"
        );
        await fetchProposals();

        setFormData({
          organization: "",
          selectedOrganization: "",
          customOrganization: "",
          title: "",
          description: "",
        });
        setSelectedFiles([]);
        setFormErrors({});
        setEditingProposalId(null);
        setIsEditing(false);
      } else {
        if (res?.statusCode === 401 || res?.statusCode === 403 || res?.message?.includes("Unauthorized")) {
          setUploadError("Sesi login telah berakhir atau akun Anda memerlukan hak akses OSIS. Silakan login kembali.");
        } else {
          setUploadError(res?.message || "Gagal menyimpan proposal. Silakan coba lagi.");
        }
      }
    } catch (err) {
      setUploadError(err?.message || "Gagal memproses proposal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isReviewerRole = role === "Admin" || role === "Super Admin" || role === "Teacher";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <AuthGuard>
        <Navbar />

        <main className="mx-auto flex w-full max-w-5xl flex-col px-4 py-24 sm:px-6 lg:px-8 lg:py-28 space-y-8">
          {/* Header Banner */}
          <div className="max-w-3xl">
            <div className="inline-flex items-center rounded-full border border-[#C7D2FE] bg-[#EEF2FF] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#2C1EE8]">
              {isReviewerRole ? "Peninjauan Proposal" : "Pengajuan Proposal"}
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {isReviewerRole ? "Verifikasi & Review Proposal Kegiatan" : "Pengajuan Proposal Digital"}
            </h1>
            <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
              {isReviewerRole
                ? "Daftar proposal kegiatan ekstrakurikuler & OSIS yang diajukan oleh siswa untuk ditinjau dan disetujui."
                : "Ajukan proposal kegiatan ekstrakurikuler & OSIS secara digital. Proposal ini akan diverifikasi oleh Pembina/Guru dan Admin Sekolah."}
            </p>
          </div>

          {isReviewerRole ? (
            /* Reviewer View (Admin & Teacher): AdminProposalTab without proposal submission form */
            <AdminProposalTab />
          ) : (
            /* Student View: Form Pengajuan Proposal + Proposal Saya */
            <>
              {/* SECTION 1: Form Pengajuan Proposal (Full Width Hero Card) */}
              <section className="rounded-[32px] border border-gray-100 bg-[#FAFBFF] p-6 shadow-sm sm:p-8 lg:p-10">
                <div className="mb-6 border-b border-gray-100 pb-4">
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900">Form Pengajuan Proposal</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Isi detail kegiatan dan lampirkan dokumen proposal PDF Anda.
                  </p>
                </div>

                {successMessage && (
                  <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 font-semibold">
                    {successMessage}
                  </div>
                )}

                <ProposalForm
                  formData={formData}
                  onFieldChange={handleFieldChange}
                  onSubmit={handleSubmit}
                  selectedFiles={selectedFiles}
                  onFileSelect={handleFileSelect}
                  onRemoveFile={handleRemoveFile}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  isDragging={isDragging}
                  uploadError={uploadError}
                  formErrors={formErrors}
                  isEditing={isEditing}
                  onCancelEdit={cancelEdit}
                  extracurriculars={extracurriculars}
                  isLoadingExtracurriculars={isLoadingExtracurriculars}
                  extracurricularError={extracurricularError}
                  onRetryLoadExtracurriculars={loadExtracurricularMemberships}
                  isSubmitting={isSubmitting}
                />
              </section>

              {/* SECTION 2: Proposal Saya (Full Width Horizontal List Below Form) */}
              <section className="rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-gray-900">Proposal Saya</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Daftar dan riwayat pemantauan status proposal yang telah Anda ajukan.
                    </p>
                  </div>
                  <div className="text-xs font-bold text-gray-400 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100 w-fit self-start sm:self-auto">
                    Total Proposal: <span className="text-gray-900 font-black">{proposals.length}</span>
                  </div>
                </div>

                <ProposalList
                  proposals={proposals}
                  onEdit={handleEditProposal}
                  onDelete={handleDeleteProposal}
                  onRemoveFile={handleRemoveProposalFile}
                />
              </section>
            </>
          )}
        </main>
      </AuthGuard>
    </div>
  );
}
