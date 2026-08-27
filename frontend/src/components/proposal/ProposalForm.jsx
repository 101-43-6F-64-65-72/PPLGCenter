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
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
            Deskripsi Kegiatan
          </label>
          <textarea
            name="description"
            rows="4"
            value={formData.description}
            onChange={onFieldChange}
            placeholder="Jelaskan kegiatan secara singkat"
            className={`w-full rounded-none px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 shadow-xs outline-none transition-colors focus:border-[#2C1EE8] font-normal leading-relaxed ${
              formErrors?.description
                ? "border border-rose-500 focus:border-rose-500"
                : "border border-slate-200 bg-white"
            }`}
          />
          {formErrors?.description && (
            <p className="mt-1 text-[11px] font-semibold text-rose-600">
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

      <div className="flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between text-xs">
        <div>
          <p className="text-slate-500 font-normal">
            Hanya file PDF yang diterima.
          </p>
          {isEditing && (
            <p className="mt-1 font-bold text-[#2C1EE8]">
              Anda sedang mengedit proposal. Klik Perbarui Proposal untuk menyimpan.
            </p>
          )}
          {uploadError && (
            <div className="mt-2 rounded-none bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-semibold space-y-2">
              <p>{uploadError}</p>
              {(uploadError.includes("login") ||
                uploadError.includes("autentikasi") ||
                uploadError.includes("Unauthorized") ||
                uploadError.includes("Sesi") ||
                uploadError.includes("Akses")) && (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-none bg-rose-600 text-white font-bold uppercase tracking-wider text-xs hover:bg-rose-700 transition-colors shadow-xs"
                >
                  <span>Login Kembali</span>
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting
              ? "Menyimpan..."
              : isEditing
              ? "Perbarui Proposal"
              : "Ajukan Proposal"}
          </Button>
        </div>
      </div>
    </form>
  );
}
