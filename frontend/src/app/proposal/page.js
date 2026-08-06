"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import ProposalForm from "@/components/proposal/ProposalForm";
import ProposalList from "@/components/proposal/ProposalList";
import AuthGuard from "@/components/layout/AuthGuard";
import useAuth from "@/hooks/useAuth";
import { extracurricularService } from "@/services/extracurricularService";
import { proposalService } from "@/services/proposalService";
import uploadImageToCloudinary from "@/services/cloudinaryService";

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

  // Fetch Extracurriculars from API for dropdown
  useEffect(() => {
    async function loadExtracurriculars() {
      try {
        const res = await extracurricularService.getExtracurriculars();
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          setExtracurriculars(res.data);
        }
      } catch (err) {
        // Safe catch
      }
    }
    loadExtracurriculars();
  }, []);

  // Fetch Proposals list directly from Backend REST API
  const fetchProposals = async () => {
    try {
      const res = await proposalService.getProposals();
      if (res && res.success && Array.isArray(res.data)) {
        const mapped = res.data.map((item) => {
          let org = "Ekstrakurikuler";
          let rawTitle = item.title || item.Title || "";

          // Extract [Organization] tag if present in title
          const tagMatch = rawTitle.match(/^\[(.*?)\]\s*(.*)$/);
          if (tagMatch) {
            org = tagMatch[1];
            rawTitle = tagMatch[2];
          }

          return {
            id: item.id || item.Id,
            organization: org,
            title: rawTitle,
            description: item.description || item.Description,
            status: item.status || item.Status || "Menunggu Review",
            createdAt: item.createdAt ? new Date(item.createdAt).toLocaleDateString("id-ID") : "Baru saja",
            files: item.fileUrl ? [{ id: "1", name: "Dokumen Proposal.pdf", url: item.fileUrl }] : [],
            fileUrl: item.fileUrl || "",
          };
        });
        setProposals(mapped);
      } else {
        setProposals([]);
      }
    } catch (err) {
      setProposals([]);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchProposals();
    }
  }, [isAuthenticated]);

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
        setSuccessMessage("✓ Proposal berhasil dihapus dari server.");
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
      // Step 1: Upload File to Cloudinary CDN
      let fileUrl = "";
      const fileToUpload = selectedFiles[0];

      if (fileToUpload?.rawFile) {
        fileUrl = await uploadImageToCloudinary(fileToUpload.rawFile);
      } else if (fileToUpload?.url && fileToUpload.url.startsWith("http")) {
        fileUrl = fileToUpload.url;
      }

      if (!fileUrl) {
        throw new Error("Gagal mengunggah dokumen proposal. Coba pilih file PDF kembali.");
      }

      // Step 2: Directly POST or PUT payload to REST API /api/proposals
      const fullTitle = `[${organization}] ${formData.title.trim()}`;
      const payload = {
        title: fullTitle,
        description: formData.description.trim(),
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
            ? "✓ Proposal berhasil diperbarui di server!"
            : "✓ Proposal berhasil diajukan ke server!"
        );
        await fetchProposals();

        // Reset form
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
          setUploadError(res?.message || "Gagal menyimpan proposal ke server.");
        }
      }
    } catch (err) {
      setUploadError(err?.message || "Gagal memproses proposal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <AuthGuard>
        <Navbar />

        <main className="mx-auto flex w-full max-w-6xl flex-col px-4 py-24 sm:px-6 lg:px-8 lg:py-28">
          <section className="rounded-4xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full border border-[#C7D2FE] bg-[#EEF2FF] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#2C1EE8]">
                Pengajuan Proposal
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Pengajuan Proposal
              </h1>
              <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
                Ajukan proposal kegiatan secara digital. Proposal ini akan diverifikasi oleh Pembina/Guru dan Super Admin.
              </p>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[28px] border border-gray-100 bg-[#FAFBFF] p-5 shadow-sm sm:p-6">
                <div className="mb-5">
                  <h2 className="text-xl font-semibold text-gray-900">Form Pengajuan</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Isi detail kegiatan dan lampirkan proposal PDF Anda.
                  </p>
                </div>

                {successMessage && (
                  <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 font-semibold">
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
                  isSubmitting={isSubmitting}
                />
              </div>

              <div className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Proposal Saya</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Daftar proposal yang sudah Anda ajukan.
                    </p>
                  </div>
                </div>

                <ProposalList
                  proposals={proposals}
                  onEdit={handleEditProposal}
                  onDelete={handleDeleteProposal}
                  onRemoveFile={handleRemoveProposalFile}
                />
              </div>
            </div>
          </section>
        </main>
      </AuthGuard>
    </div>
  );
}
