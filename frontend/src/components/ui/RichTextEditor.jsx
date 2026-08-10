"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  List, 
  ListOrdered, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Link2, 
  Unlink, 
  Quote, 
  Minus, 
  Code, 
  Undo, 
  Redo, 
  RemoveFormatting, 
  Heading1, 
  Heading2, 
  Heading3, 
  Type, 
  Palette,
  Check,
  X
} from "lucide-react";

export default function RichTextEditor({
  label = "Isi Mading",
  helperText = "Gunakan bilah alat untuk memformat konten berita mading Anda agar rapi dan menarik.",
  value = "",
  onChange,
  placeholder = "Tuliskan berita atau pengumuman mading secara lengkap di sini...",
  error = "",
  required = false,
  minHeight = "180px",
  className = ""
}) {
  const editorRef = useRef(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    heading: "p",
    align: "left",
    ul: false,
    ol: false,
    quote: false,
  });

  // Convert plain text newlines to HTML if initial value is legacy plain text
  const formatInitialValue = (val) => {
    if (!val) return "";
    if (!/<[a-z][\s\S]*>/i.test(val)) {
      return val
        .split("\n\n")
        .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
        .join("");
    }
    return val;
  };

  // Sync internal editor innerHTML with external value prop
  useEffect(() => {
    if (editorRef.current) {
      const formatted = formatInitialValue(value);
      if (editorRef.current.innerHTML !== formatted) {
        editorRef.current.innerHTML = formatted;
      }
    }
  }, [value]);

  // Update active formatting indicators based on cursor position/selection
  const updateActiveStates = useCallback(() => {
    if (!editorRef.current || typeof document === "undefined") return;

    try {
      setActiveFormats({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strikethrough: document.queryCommandState("strikeThrough"),
        ul: document.queryCommandState("insertUnorderedList"),
        ol: document.queryCommandState("insertOrderedList"),
        alignLeft: document.queryCommandState("justifyLeft"),
        alignCenter: document.queryCommandState("justifyCenter"),
        alignRight: document.queryCommandState("justifyRight"),
      });
    } catch {}
  }, []);

  const handleInput = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    // If empty or just <br>
    const cleanHtml = html === "<br>" || html === "<p><br></p>" ? "" : html;
    onChange && onChange(cleanHtml);
    updateActiveStates();
  };

  const execCmd = (command, value = null) => {
    if (typeof document === "undefined") return;
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    handleInput();
  };

  const handleFormatBlock = (tag) => {
    if (tag === "p") {
      execCmd("formatBlock", "<p>");
    } else if (["h1", "h2", "h3"].includes(tag)) {
      execCmd("formatBlock", `<${tag}>`);
    }
  };

  const handleInsertLink = (e) => {
    e.preventDefault();
    if (linkUrl) {
      let finalUrl = linkUrl.trim();
      if (!/^https?:\/\//i.test(finalUrl) && !finalUrl.startsWith("/")) {
        finalUrl = `https://${finalUrl}`;
      }
      execCmd("createLink", finalUrl);
    }
    setShowLinkModal(false);
    setLinkUrl("");
  };

  const handleRemoveLink = () => {
    execCmd("unlink");
  };

  const colors = [
    { name: "StudentCenter Indigo", value: "#2c1ee8" },
    { name: "Gelap Utama", value: "#0f172a" },
    { name: "Merah Peringatan", value: "#e11d48" },
    { name: "Amber Informasi", value: "#d97706" },
    { name: "Hijau Sukses", value: "#059669" },
    { name: "Biru Cerah", value: "#0284c7" },
  ];

  const characterCount = editorRef.current
    ? (editorRef.current.innerText || "").trim().length
    : 0;

  return (
    <div className={`space-y-1.5 font-sans ${className}`}>
      {/* Label and Helper Text */}
      <div className="flex items-center justify-between">
        {label && (
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
        )}
        <span className="text-[11px] font-semibold text-gray-400 font-mono">
          {characterCount} karakter
        </span>
      </div>

      {helperText && (
        <p className="text-[11px] text-gray-500 font-medium leading-normal">
          {helperText}
        </p>
      )}

      {/* Main Editor Outer Border Box */}
      <div
        className={`rounded-2xl border transition-all overflow-hidden bg-white shadow-2xs ${
          error
            ? "border-rose-300 bg-rose-50/10 focus-within:border-rose-500 focus-within:ring-4 focus-within:ring-rose-100"
            : "border-gray-200 focus-within:border-[#2c1ee8] focus-within:ring-4 focus-within:ring-[#2c1ee8]/10"
        }`}
      >
        {/* Sticky Toolbar Bar */}
        <div className="bg-slate-50/90 border-b border-gray-200/80 p-1.5 sm:p-2 backdrop-blur-xs flex flex-wrap items-center gap-1 text-gray-700 select-none">
          {/* Format Text Buttons */}
          <div className="flex items-center gap-0.5 bg-white border border-gray-200/80 rounded-xl p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => execCmd("bold")}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFormats.bold ? "bg-[#2c1ee8] text-white shadow-xs" : "hover:bg-gray-100 text-gray-700"
              }`}
              title="Cetak Tebal (Bold)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCmd("italic")}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFormats.italic ? "bg-[#2c1ee8] text-white shadow-xs" : "hover:bg-gray-100 text-gray-700"
              }`}
              title="Cetak Miring (Italic)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCmd("underline")}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFormats.underline ? "bg-[#2c1ee8] text-white shadow-xs" : "hover:bg-gray-100 text-gray-700"
              }`}
              title="Garis Bawah (Underline)"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCmd("strikeThrough")}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFormats.strikethrough ? "bg-[#2c1ee8] text-white shadow-xs" : "hover:bg-gray-100 text-gray-700"
              }`}
              title="Coret Teks (Strikethrough)"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-gray-300 mx-0.5" />

          {/* Heading Style Selector */}
          <div className="flex items-center gap-0.5 bg-white border border-gray-200/80 rounded-xl p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => handleFormatBlock("p")}
              className="p-1.5 rounded-lg text-xs font-bold hover:bg-gray-100 text-gray-700 transition-all cursor-pointer flex items-center gap-1"
              title="Paragraf Biasa"
            >
              <Type className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden sm:inline font-semibold">Teks</span>
            </button>
            <button
              type="button"
              onClick={() => handleFormatBlock("h1")}
              className="p-1.5 rounded-lg text-xs font-extrabold hover:bg-gray-100 text-gray-900 transition-all cursor-pointer flex items-center gap-1"
              title="Judul Utama (Heading 1)"
            >
              <Heading1 className="w-3.5 h-3.5 text-[#2c1ee8]" />
              <span className="text-[11px] hidden sm:inline font-bold">H1</span>
            </button>
            <button
              type="button"
              onClick={() => handleFormatBlock("h2")}
              className="p-1.5 rounded-lg text-xs font-extrabold hover:bg-gray-100 text-gray-900 transition-all cursor-pointer flex items-center gap-1"
              title="Sub Judul (Heading 2)"
            >
              <Heading2 className="w-3.5 h-3.5 text-indigo-700" />
              <span className="text-[11px] hidden sm:inline font-bold">H2</span>
            </button>
            <button
              type="button"
              onClick={() => handleFormatBlock("h3")}
              className="p-1.5 rounded-lg text-xs font-bold hover:bg-gray-100 text-gray-900 transition-all cursor-pointer flex items-center gap-1"
              title="Sub-sub Judul (Heading 3)"
            >
              <Heading3 className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-[11px] hidden sm:inline font-bold">H3</span>
            </button>
          </div>

          <div className="h-4 w-px bg-gray-300 mx-0.5" />

          {/* List Buttons */}
          <div className="flex items-center gap-0.5 bg-white border border-gray-200/80 rounded-xl p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => execCmd("insertUnorderedList")}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFormats.ul ? "bg-[#2c1ee8] text-white shadow-xs" : "hover:bg-gray-100 text-gray-700"
              }`}
              title="Daftar Simbol (Bullet List)"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCmd("insertOrderedList")}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFormats.ol ? "bg-[#2c1ee8] text-white shadow-xs" : "hover:bg-gray-100 text-gray-700"
              }`}
              title="Daftar Angka (Numbered List)"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-gray-300 mx-0.5" />

          {/* Alignment Buttons */}
          <div className="flex items-center gap-0.5 bg-white border border-gray-200/80 rounded-xl p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => execCmd("justifyLeft")}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFormats.alignLeft ? "bg-[#2c1ee8] text-white shadow-xs" : "hover:bg-gray-100 text-gray-700"
              }`}
              title="Rata Kiri"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCmd("justifyCenter")}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFormats.alignCenter ? "bg-[#2c1ee8] text-white shadow-xs" : "hover:bg-gray-100 text-gray-700"
              }`}
              title="Rata Tengah"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCmd("justifyRight")}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFormats.alignRight ? "bg-[#2c1ee8] text-white shadow-xs" : "hover:bg-gray-100 text-gray-700"
              }`}
              title="Rata Kanan"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-gray-300 mx-0.5" />

          {/* Elements: Link, Blockquote, Divider, Code, Color */}
          <div className="flex items-center gap-0.5 bg-white border border-gray-200/80 rounded-xl p-0.5 shadow-2xs relative">
            <button
              type="button"
              onClick={() => setShowLinkModal(true)}
              className="p-1.5 rounded-lg text-xs font-bold hover:bg-gray-100 text-gray-700 transition-all cursor-pointer"
              title="Sisipkan Tautan (Link)"
            >
              <Link2 className="w-3.5 h-3.5 text-[#2c1ee8]" />
            </button>

            <button
              type="button"
              onClick={handleRemoveLink}
              className="p-1.5 rounded-lg text-xs font-bold hover:bg-gray-100 text-gray-500 transition-all cursor-pointer"
              title="Hapus Tautan"
            >
              <Unlink className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => execCmd("formatBlock", "<blockquote>")}
              className="p-1.5 rounded-lg text-xs font-bold hover:bg-gray-100 text-gray-700 transition-all cursor-pointer"
              title="Kutipan (Blockquote)"
            >
              <Quote className="w-3.5 h-3.5 text-indigo-700" />
            </button>

            <button
              type="button"
              onClick={() => execCmd("insertHorizontalRule")}
              className="p-1.5 rounded-lg text-xs font-bold hover:bg-gray-100 text-gray-700 transition-all cursor-pointer"
              title="Garis Pemisah (Horizontal Divider)"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => execCmd("formatBlock", "<pre>")}
              className="p-1.5 rounded-lg text-xs font-bold hover:bg-gray-100 text-gray-700 transition-all cursor-pointer"
              title="Kode / Monospace"
            >
              <Code className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-1.5 rounded-lg text-xs font-bold hover:bg-gray-100 text-gray-700 transition-all cursor-pointer"
              title="Warna Teks"
            >
              <Palette className="w-3.5 h-3.5 text-[#2c1ee8]" />
            </button>

            {/* Inline Color Picker Popover */}
            {showColorPicker && (
              <div className="absolute right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl p-2 shadow-xl z-20 flex items-center gap-1.5 animate-in fade-in duration-150">
                {colors.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => {
                      execCmd("foreColor", c.value);
                      setShowColorPicker(false);
                    }}
                    style={{ backgroundColor: c.value }}
                    className="w-5 h-5 rounded-full border border-black/10 hover:scale-110 transition-transform cursor-pointer"
                    title={c.name}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-gray-300 mx-0.5" />

          {/* History: Undo, Redo, Clear Formatting */}
          <div className="flex items-center gap-0.5 bg-white border border-gray-200/80 rounded-xl p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => execCmd("undo")}
              className="p-1.5 rounded-lg text-xs font-bold hover:bg-gray-100 text-gray-700 transition-all cursor-pointer"
              title="Batal (Undo)"
            >
              <Undo className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => execCmd("redo")}
              className="p-1.5 rounded-lg text-xs font-bold hover:bg-gray-100 text-gray-700 transition-all cursor-pointer"
              title="Ulangi (Redo)"
            >
              <Redo className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => execCmd("removeFormat")}
              className="p-1.5 rounded-lg text-xs font-bold hover:bg-gray-100 text-rose-600 transition-all cursor-pointer"
              title="Hapus Formatting (Clear Formatting)"
            >
              <RemoveFormatting className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content Editable Writing Area */}
        <div className="relative">
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onKeyUp={updateActiveStates}
            onMouseUp={updateActiveStates}
            onBlur={handleInput}
            style={{ minHeight }}
            className="p-4 sm:p-5 outline-none max-h-[420px] overflow-y-auto text-sm text-gray-900 leading-relaxed font-sans prose prose-sm max-w-none focus:outline-none 
              [&_p]:mb-3 [&_p]:leading-relaxed
              [&_h1]:text-2xl [&_h1]:font-black [&_h1]:text-gray-900 [&_h1]:mt-4 [&_h1]:mb-2
              [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:text-gray-900 [&_h2]:mt-3 [&_h2]:mb-2
              [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-gray-900 [&_h3]:mt-2 [&_h3]:mb-1
              [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3
              [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3
              [&_blockquote]:border-l-4 [&_blockquote]:border-[#2c1ee8] [&_blockquote]:bg-indigo-50/50 [&_blockquote]:p-3 [&_blockquote]:my-3 [&_blockquote]:rounded-r-xl [&_blockquote]:italic [&_blockquote]:text-indigo-950
              [&_a]:text-[#2c1ee8] [&_a]:underline [&_a]:font-semibold
              [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-xs"
          />

          {/* Placeholder display when empty */}
          {!value && (
            <div className="absolute top-4 left-4 sm:left-5 pointer-events-none text-sm text-gray-400 font-medium italic">
              {placeholder}
            </div>
          )}
        </div>
      </div>

      {/* Error Message Display */}
      {error && (
        <p className="text-xs font-semibold text-rose-600 flex items-center gap-1 mt-1">
          <span>{error}</span>
        </p>
      )}

      {/* Link Insertion Modal Popover */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-2xl max-w-sm w-full space-y-3 font-sans animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-[#2c1ee8]" />
                <span>Sisipkan Tautan Website</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInsertLink} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">
                  URL / Alamat Tautan:
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://smkn2surakarta.sch.id"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 outline-none focus:border-[#2c1ee8]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#2c1ee8] text-white text-xs font-bold hover:bg-blue-800 transition-colors shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Tautan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
