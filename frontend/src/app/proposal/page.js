"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import ProposalForm from "@/components/proposal/ProposalForm";
import ProposalList from "@/components/proposal/ProposalList";
import AuthGuard from "@/components/layout/AuthGuard";

const LOCAL_STORAGE_KEY = "student-center-proposals";

export default function ProposalPage() {
    const [formData, setFormData] = useState({
        organization: "",
        selectedOrganization: "",
        customOrganization: "",
        title: "",
        description: "",
    });
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploadError, setUploadError] = useState("");
    const [isDragging, setIsDragging] = useState(false);
    const [proposals, setProposals] = useState(loadProposalsFromStorage);
    const [formErrors, setFormErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState("");
    const [editingProposalId, setEditingProposalId] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    function loadProposalsFromStorage() {
        if (typeof window === "undefined") return [];

        try {
            const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
            if (!stored) return [];

            const parsed = JSON.parse(stored);
            if (!Array.isArray(parsed)) return [];

            return parsed.map((proposal) => ({
                ...proposal,
                files: Array.isArray(proposal.files)
                    ? proposal.files.map((file) => ({
                        id: file.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
                        name: file.name,
                        size: file.size,
                        type: file.type || "application/pdf",
                        url: file.url || file.dataUrl || "",
                    }))
                    : proposal.fileName
                        ? [
                            {
                                id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
                                name: proposal.fileName,
                                size: proposal.fileSize,
                                type: "application/pdf",
                                url: "",
                            },
                        ]
                        : [],
            }));
        } catch (error) {
            console.warn("Gagal membaca proposal dari Local Storage", error);
            return [];
        }
    }

    function saveProposalsToStorage(nextProposals) {
        try {
            window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nextProposals));
            // TODO: Ganti Local Storage dengan POST /api/proposals ketika backend sudah tersedia.
        } catch (error) {
            console.warn("Gagal menyimpan proposal ke Local Storage", error);
        }
    }

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

    const readFileAsDataUrl = (file) =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error("Gagal membaca file PDF."));
            reader.readAsDataURL(file);
        });

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

            const url = await readFileAsDataUrl(file);
            acceptedFiles.push({
                id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
                name: file.name,
                size: file.size,
                type: file.type || "application/pdf",
                url,
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
        const nextProposals = proposals.map((proposal) => {
            if (proposal.id !== proposalId) return proposal;

            return {
                ...proposal,
                files: proposal.files?.filter((file) => file.id !== fileId) || [],
            };
        });

        if (editingProposalId === proposalId) {
            setSelectedFiles((prev) => prev.filter((file) => file.id !== fileId));
        }

        setProposals(nextProposals);
        saveProposalsToStorage(nextProposals);
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
        const isRegistered = [
            "OSIS SMKN 2 Surakarta",
            "PRAMUKA (Gudep SMKN 2)",
            "PMR (Palang Merah Remaja)",
            "PASKIBRA",
            "ROHIS / IRMAS",
            "ROHKRIS",
            "TEATER & KESENIAN",
            "EKSTRAKURIKULER OLAHRAGA",
            "PERWAKILAN KELAS / JURUSAN",
        ].includes(proposal.organization);

        setFormData({
            organization: proposal.organization,
            selectedOrganization: isRegistered ? proposal.organization : "Lainnya (Ketik Manual)",
            customOrganization: isRegistered ? "" : proposal.organization,
            title: proposal.title,
            description: proposal.description,
        });
        setSelectedFiles(
            Array.isArray(proposal.files) && proposal.files.length
                ? proposal.files
                : proposal.fileName
                    ? [
                        {
                            name: proposal.fileName,
                            size: proposal.fileSize,
                            type: "application/pdf",
                        },
                    ]
                    : []
        );
        setFormErrors({});
        setUploadError("");
        setEditingProposalId(proposal.id);
        setIsEditing(true);
        setSuccessMessage("");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDeleteProposal = (id) => {
        const proposal = proposals.find((item) => item.id === id);
        if (!proposal) return;

        const confirmed = window.confirm("Apakah Anda yakin ingin menghapus proposal ini?");
        if (!confirmed) return;

        const nextProposals = proposals.filter((item) => item.id !== id);
        setProposals(nextProposals);
        saveProposalsToStorage(nextProposals);

        if (editingProposalId === id) {
            cancelEdit();
        }

        setSuccessMessage("Proposal berhasil dihapus.");
        setTimeout(() => setSuccessMessage(""), 4000);
    };

    const handleSubmit = (event) => {
        event.preventDefault();

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
        }

        if (!formData.description.trim()) {
            errors.description = "Deskripsi kegiatan wajib diisi.";
        }

        if (!selectedFiles.length) {
            setUploadError("File PDF wajib dilampirkan.");
        }

        if (Object.keys(errors).length > 0 || !selectedFiles.length) {
            setFormErrors(errors);
            return;
        }

        const proposalPayload = {
            organization,
            title: formData.title.trim(),
            description: formData.description.trim(),
            status: "Menunggu Review",
            // TODO: Status proposal berasal dari backend
            files: selectedFiles.map((file) => ({
                id: file.id,
                name: file.name,
                size: file.size,
                type: file.type,
                url: file.url,
            })),
            fileName: selectedFiles[0]?.name,
            fileSize: selectedFiles[0]?.size,
        };

        let nextProposals;

        if (isEditing && editingProposalId !== null) {
            nextProposals = proposals.map((proposal) =>
                proposal.id === editingProposalId
                    ? {
                        ...proposal,
                        ...proposalPayload,
                    }
                    : proposal
            );
            setSuccessMessage("Proposal berhasil diperbarui.");
            // TODO: PUT /api/proposals/{id}
        } else {
            const newProposal = {
                id: Date.now(),
                ...proposalPayload,
                createdAt: new Date().toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                }),
            };
            nextProposals = [newProposal, ...proposals];
            setSuccessMessage("Proposal berhasil diajukan.");
        }

        setProposals(nextProposals);
        saveProposalsToStorage(nextProposals);
        setFormErrors({});
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
        setUploadError("");

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
                                Ajukan proposal kegiatan secara digital. Proposal ini akan diverifikasi oleh Guru dan Super Admin.
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
                                    <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
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
