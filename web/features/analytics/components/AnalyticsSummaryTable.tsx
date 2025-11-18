import React from 'react';

import { cn } from '@/lib/utils';

export type AnalyticsSummaryColumn = {
  key: string;
  label: string;
  isNumeric?: boolean;
};

export type AnalyticsSummaryRow = {
  id: string;
  cells: Record<string, React.ReactNode>;
};

type AnalyticsSummaryTableProps = {
  tableId: string;
  title: string;
  description?: string;
  columns: AnalyticsSummaryColumn[];
  rows: AnalyticsSummaryRow[];
  className?: string;
};

export const AnalyticsSummaryTable: React.FC<AnalyticsSummaryTableProps> = ({
  tableId,
  title,
  description,
  columns,
  rows,
  className,
}) => {
  if (rows.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby={`${tableId}-heading`}
      className={cn('mt-4 space-y-2', className)}
    >
      <div>
        <h3 id={`${tableId}-heading`} className="text-sm font-semibold text-foreground">
          {title}
        </h3>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>

      <div className="overflow-x-auto" role="region" aria-labelledby={`${tableId}-heading`}>
        <table
          aria-describedby={description ? `${tableId}-description` : undefined}
          className="min-w-full text-sm border border-border rounded-md"
        >
          {description ? (
            <caption id={`${tableId}-description`} className="sr-only">
              {description}
            </caption>
          ) : null}
          <thead className="bg-muted">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    'px-3 py-2 text-left font-semibold text-foreground',
                    column.isNumeric ? 'text-right' : '',
                  )}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={row.id}
                className={rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/40'}
              >
                {columns.map((column) => (
                  <td
                    key={`${row.id}-${column.key}`}
                    className={cn(
                      'px-3 py-2 align-top text-foreground',
                      column.isNumeric ? 'text-right font-medium' : '',
                    )}
                  >
                    {row.cells[column.key] ?? ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default AnalyticsSummaryTable;

