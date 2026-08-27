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
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
        Upload Proposal PDF
      </label>

      <div
        onClick={handleClick}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`group cursor-pointer rounded-none border-2 border-dashed p-5 text-center transition-colors sm:p-6 ${
          isDragging
            ? "border-[#2C1EE8] bg-blue-50/50"
            : "border-slate-300 bg-slate-50/50 hover:border-[#2C1EE8] hover:bg-blue-50/30"
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

        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-none bg-blue-50 text-[#2C1EE8] border border-blue-200">
          {selectedFiles.length ? (
            <FileText className="h-5 w-5" />
          ) : (
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
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

        <div className="mt-3">
          {selectedFiles.length ? (
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={`${file.name}-${file.size}-${index}`}
                  className="flex items-center justify-between rounded-none border border-slate-200 bg-white px-3.5 py-2 text-left"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      {file.name}
                    </p>
                    <p className="text-[11px] font-mono text-slate-400">
                      {Math.max(1, Math.round(file.size / 1024))} KB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFile(index);
                    }}
                    className="text-xs font-bold uppercase tracking-wider text-rose-600 hover:text-rose-700 cursor-pointer"
                  >
                    Hapus
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <>
              <p className="text-xs font-bold uppercase text-slate-900">
                Drag & Drop file PDF di sini
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                atau klik untuk memilih file
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
