"use client";

import React from "react";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ProposalUpload from "./ProposalUpload";

const fallbackOrganizations = [
  "OSIS SMKN 2 Surakarta",
  "PRAMUKA (Gudep SMKN 2)",
  "PMR (Palang Merah Remaja)",
  "PASKIBRA",
  "ROHIS / IRMAS",
  "ROHKRIS",
  "TEATER & KESENIAN",
  "EKSTRAKURIKULER OLAHRAGA",
  "PERWAKILAN KELAS / JURUSAN",
];

export default function ProposalForm({
  formData,
  onFieldChange,
  onSubmit,
  selectedFiles,
  onFileSelect,
  onRemoveFile,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragging,
  uploadError,
  formErrors,
  isEditing,
  onCancelEdit,
  extracurriculars = [],
  isSubmitting = false,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <div className="w-full flex flex-col gap-1.5">
            <label
              htmlFor="organization"
              className="flex items-center gap-1 text-gray-700 font-medium text-sm"
            >
              <span>Nama Ekstrakurikuler / Organisasi</span>
              <span className="text-red-500 font-bold">*</span>
            </label>
            <div className="relative">
              <select
                id="organization"
                name="organization"
                value={formData.selectedOrganization}
                onChange={onFieldChange}
                required
                className={`w-full rounded-xl border px-4 py-3 pr-12 text-sm text-gray-900 outline-none transition-all hover:border-gray-300 focus:border-[#2C1EE8] focus:ring-2 focus:ring-[#2C1EE8]/20 ${formErrors?.selectedOrganization ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-gray-200 bg-white"}`}
              >
                <option value="" disabled hidden>
                  -- Pilih Ekstrakurikuler / Organisasi --
                </option>
                {extracurriculars && extracurriculars.length > 0
                  ? extracurriculars.map((item) => {
                      const name = typeof item === "string" ? item : (item.name || item.Name || item.title || item.Title);
                      const key = typeof item === "object" ? (item.id || item.Id || name) : item;
                      return (
                        <option key={key} value={name}>
                          {name}
                        </option>
                      );
                    })
                  : fallbackOrganizations.map((organization) => (
                      <option key={organization} value={organization}>
                        {organization}
                      </option>
                    ))}
                <option value="Lainnya (Ketik Manual)">Lainnya (Ketik Manual)</option>
              </select>
              {formErrors?.selectedOrganization && (
                <p className="mt-2 text-xs font-medium text-red-500">
                  {formErrors.selectedOrganization}
                </p>
              )}
              <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </div>
          </div>
          {formData.selectedOrganization === "Lainnya (Ketik Manual)" && (
            <div className="mt-4">
              <Input
                label="Nama Organisasi / Ekstrakurikuler"
                name="customOrganization"
                type="text"
                placeholder="Masukkan nama ekstrakurikuler / organisasi"
                value={formData.customOrganization}
                onChange={onFieldChange}
                required
                error={formErrors?.customOrganization}
              />
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <Input
            label="Judul Proposal"
            name="title"
            type="text"
            placeholder="Masukkan judul proposal"
            value={formData.title}
            onChange={onFieldChange}
            required
            error={formErrors?.title}
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Deskripsi Kegiatan
          </label>
          <textarea
            name="description"
            rows="4"
            value={formData.description}
            onChange={onFieldChange}
            placeholder="Jelaskan kegiatan secara singkat"
            className={`w-full rounded-2xl px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-[#2C1EE8] focus:ring-2 focus:ring-[#2C1EE8]/20 ${formErrors?.description ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border border-gray-200 bg-white"}`}
          />
          {formErrors?.description && (
            <p className="mt-2 text-xs font-medium text-red-500">
              {formErrors.description}
            </p>
          )}
        </div>

        <div className="md:col-span-2">
          <ProposalUpload
            selectedFiles={selectedFiles}
            onFileSelect={onFileSelect}
            onRemoveFile={onRemoveFile}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            isDragging={isDragging}
            uploadError={uploadError}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-500">
            Hanya file PDF yang diterima.
          </p>
          {isEditing && (
            <p className="mt-2 text-sm text-[#2C1EE8]">
              Anda sedang mengedit proposal. Klik Perbarui Proposal untuk menyimpan.
            </p>
          )}
          {uploadError && (
            <div className="mt-3 rounded-2xl bg-red-50 border border-red-200 p-4 text-xs text-red-700 font-semibold space-y-2">
              <p>{uploadError}</p>
              {(uploadError.includes("login") || uploadError.includes("autentikasi") || uploadError.includes("Unauthorized") || uploadError.includes("Sesi") || uploadError.includes("Akses")) && (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-white font-bold text-xs hover:bg-red-700 transition-colors shadow-xs"
                >
                  <span>Login Kembali</span>
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {isEditing && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancelEdit}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Batal
            </Button>
          )}
          <Button type="submit" variant="primary" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting
              ? "Memproses & Mengunggah..."
              : isEditing
              ? "Perbarui Proposal"
              : "Ajukan Proposal"}
          </Button>
        </div>
      </div>
    </form>
  );
}
