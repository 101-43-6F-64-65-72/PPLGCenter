"use client";

import React, { useEffect, useRef } from "react";
import { FileText } from "@/components/common/Icons";

export default function ProposalUpload({
  selectedFiles,
  onFileSelect,
  onRemoveFile,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragging,
  uploadError,
}) {
  const inputRef = useRef(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  useEffect(() => {
    if (!selectedFiles.length && inputRef.current) {
      inputRef.current.value = "";
    }
  }, [selectedFiles]);

  return (
    <div className="space-y-4">
      <label className="block text-sm font-semibold text-gray-700">
        Upload Proposal PDF
      </label>

      <div
        onClick={handleClick}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`group cursor-pointer rounded-3xl border-2 border-dashed p-6 text-center transition-all duration-200 sm:p-8 ${
          isDragging
            ? "border-[#2C1EE8] bg-[#EEF2FF] shadow-sm"
            : "border-[#C7D2FE] bg-white hover:border-[#2C1EE8] hover:bg-[#EEF2FF]/70"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          multiple
          onChange={(event) => {
            onFileSelect(event.target.files);
            event.target.value = "";
          }}
        />

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#2C1EE8]">
          {selectedFiles.length ? (
            <FileText className="h-6 w-6" />
          ) : (
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 16v-4m0 0l3 3m-3-3l3-3m7 7v-4m0 0l-3 3m3-3l-3-3"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 20h14a2 2 0 002-2V8l-6-6H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          )}
        </div>

        <div className="mt-4">
          {selectedFiles.length ? (
            <div className="space-y-3">
              {selectedFiles.map((file, index) => (
                <div
                  key={`${file.name}-${file.size}-${index}`}
                  className="flex items-center justify-between rounded-3xl border border-gray-200 bg-white px-4 py-3 text-left"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {Math.max(1, Math.round(file.size / 1024))} KB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveFile(index)}
                    className="text-sm font-semibold text-[#DB2777] hover:text-[#BE185D]"
                  >
                    Hapus
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold text-gray-900">
                Drag & Drop file PDF di sini
              </p>
              <p className="mt-2 text-sm text-gray-500">
                atau klik untuk memilih file
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
