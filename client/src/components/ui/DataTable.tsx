import * as React from "react";
import { cn } from "@/lib/utils";

interface Column {
  key: string;
  header: React.ReactNode;
  cell?: (row: any) => React.ReactNode;
  className?: string;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  className?: string;
}

export function DataTable({ columns, data, className }: DataTableProps) {
  return (
    <div className={cn("w-full overflow-auto rounded-xl border border-white/10 bg-white/5 backdrop-blur-md", className)}>
      <table className="w-full caption-bottom text-sm">
        <thead className="border-b border-white/10 bg-black/40">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "h-12 px-4 text-left align-middle font-medium text-muted-foreground",
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="h-24 text-center">
                No results.
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={i}
                className="border-b border-white/5 transition-colors hover:bg-white/5 data-[state=selected]:bg-muted"
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn("p-4 align-middle", col.className)}>
                    {col.cell ? col.cell(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
