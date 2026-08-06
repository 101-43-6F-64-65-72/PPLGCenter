"use client";

import React from "react";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ProposalUpload from "./ProposalUpload";
import OrganizationSelect from "@/components/common/OrganizationSelect";

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
  isSubmitting = false,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <OrganizationSelect
            value={formData.selectedOrganization}
            customValue={formData.customOrganization}
            onChange={(val) =>
              onFieldChange({
                target: { name: "organization", value: val },
              })
            }
            onCustomChange={(val) =>
              onFieldChange({
                target: { name: "customOrganization", value: val },
              })
            }
            error={formErrors?.selectedOrganization}
            customError={formErrors?.customOrganization}
            label="Nama Ekstrakurikuler / Organisasi Anda"
          />
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
            className={`w-full rounded-2xl px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-[#2C1EE8] focus:ring-2 focus:ring-[#2C1EE8]/20 ${
              formErrors?.description
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                : "border border-gray-200 bg-white"
            }`}
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
              {(uploadError.includes("login") ||
                uploadError.includes("autentikasi") ||
                uploadError.includes("Unauthorized") ||
                uploadError.includes("Sesi") ||
                uploadError.includes("Akses")) && (
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
