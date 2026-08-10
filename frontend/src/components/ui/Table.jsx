import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import TableSkeleton from "@/components/ui/TableSkeleton";

export const Table = ({ children, className = "" }) => {
  return (
    <div className={`bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">{children}</table>
      </div>
    </div>
  );
};

export const TableHeader = ({ children, className = "" }) => {
  return (
    <thead className={`bg-gray-50/80 border-b border-gray-100 text-gray-400 font-extrabold uppercase tracking-wider text-[11px] ${className}`}>
      {children}
    </thead>
  );
};

export const TableBody = ({ children, isLoading = false, isEmpty = false, emptyText = "Tidak ada data ditemukan", colSpan = 5, className = "" }) => {
  if (isLoading) {
    return (
      <tbody>
        <tr>
          <td colSpan={colSpan} className="p-0">
            <TableSkeleton rows={5} columns={colSpan} />
          </td>
        </tr>
      </tbody>
    );
  }

  if (isEmpty) {
    return (
      <tbody>
        <tr>
          <td colSpan={colSpan} className="py-8">
            <EmptyState title="Ups... Data Kosong" description={emptyText} className="my-2 shadow-none border-none py-6" />
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody className={`divide-y divide-gray-100 font-medium text-xs text-gray-700 ${className}`}>
      {children}
    </tbody>
  );
};

export const TableRow = ({ children, className = "", onClick, ...props }) => {
  return (
    <tr
      onClick={onClick}
      className={`hover:bg-blue-50/30 transition-colors ${onClick ? "cursor-pointer" : ""} ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
};

export const TableCell = ({ children, className = "", isHeader = false, ...props }) => {
  const Component = isHeader ? "th" : "td";
  return (
    <Component className={`py-3.5 px-4 align-middle ${className}`} {...props}>
      {children}
    </Component>
  );
};

export const TablePagination = ({
  page = 1,
  totalPages = 1,
  totalCount = 0,
  pageSize = 10,
  onPageChange,
  className = "",
}) => {
  const startItem = totalCount > 0 ? (page - 1) * pageSize + 1 : 0;
  const endItem = Math.min(page * pageSize, totalCount);

  return (
    <div className={`p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-semibold bg-gray-50/30 ${className}`}>
      <div>
        Menampilkan <span className="font-extrabold text-gray-900">{startItem}-{endItem}</span> dari <span className="font-extrabold text-gray-900">{totalCount}</span> data
      </div>
      <div className="flex items-center gap-2 font-bold">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange && onPageChange(page - 1)}
          className="p-1.5 rounded-xl border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer disabled:cursor-not-allowed"
          title="Halaman Sebelumnya"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="px-2">Halaman <strong className="text-[#2c1ee8]">{page}</strong> dari {totalPages || 1}</span>
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange && onPageChange(page + 1)}
          className="p-1.5 rounded-xl border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer disabled:cursor-not-allowed"
          title="Halaman Selanjutnya"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Table;
