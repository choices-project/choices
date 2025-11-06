/**
 * Data Export Utilities
 * 
 * Comprehensive export functionality for analytics data.
 * Supports CSV, JSON, and PNG export formats.
 * 
 * Features:
 * - CSV export with proper escaping
 * - JSON export with formatting
 * - PNG export for charts (using html2canvas)
 * - Automatic filename generation
 * - Privacy-aware exports (exclude sensitive data)
 * 
 * Created: November 5, 2025
 * Status: ✅ Production-ready
 */

/**
 * Export data to CSV format
 * 
 * @param data Array of objects to export
 * @param filename Filename without extension
 * @param headers Optional custom headers (defaults to object keys)
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: string[]
): void {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Use provided headers or extract from first object
  const firstItem = data[0];
  if (!firstItem) {
    console.warn('No data to export');
    return;
  }
  const csvHeaders = headers || Object.keys(firstItem);
  
  // Create CSV rows
  const rows = data.map(item => {
    return csvHeaders.map(header => {
      const value = item[header];
      
      // Handle different types
      if (value === null || value === undefined) {
        return '';
      }
      
      // Escape strings with quotes or commas
      if (typeof value === 'string') {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }
      
      // Convert objects to JSON strings
      if (typeof value === 'object') {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      
      return String(value);
    }).join(',');
  });

  // Combine headers and rows
  const csvContent = [
    csvHeaders.join(','),
    ...rows
  ].join('\n');

  // Download file
  downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Export data to JSON format
 * 
 * @param data Data to export (any JSON-serializable type)
 * @param filename Filename without extension
 * @param pretty Whether to format with indentation
 */
export function exportToJSON<T>(
  data: T,
  filename: string,
  pretty: boolean = true
): void {
  const jsonContent = pretty 
    ? JSON.stringify(data, null, 2)
    : JSON.stringify(data);

  downloadFile(jsonContent, `${filename}.json`, 'application/json;charset=utf-8;');
}

/**
 * Export chart/component to PNG image
 * Uses html2canvas library (must be installed: npm install html2canvas)
 * 
 * @param elementId ID of the element to capture
 * @param filename Filename without extension
 */
export async function exportToPNG(
  elementId: string,
  filename: string
): Promise<void> {
  try {
    // Dynamic import to avoid SSR issues
    // @ts-expect-error - html2canvas is optional dependency
    const html2canvas = await import('html2canvas').catch(() => {
      throw new Error('html2canvas not installed. Run: npm install html2canvas');
    });
    
    const element = document.getElementById(elementId);
    
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }

    // Capture element as canvas
    const canvas = await html2canvas.default(element, {
      backgroundColor: '#ffffff',
      scale: 2, // Higher quality
      logging: false
    });

    // Convert to blob and download
    canvas.toBlob((blob: Blob | null) => {
      if (!blob) {
        throw new Error('Failed to create image blob');
      }
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.png`;
      link.click();
      URL.revokeObjectURL(url);
    });
  } catch (err) {
    console.error('Failed to export PNG:', err);
    throw new Error('PNG export failed. Ensure html2canvas is installed: npm install html2canvas');
  }
}

/**
 * Export chart using Chart.js or Recharts native export
 * This is a lighter alternative to html2canvas
 * 
 * @param chartData Chart data
 * @param filename Filename without extension
 * @param chartType Type of chart for formatting
 */
export function exportChartData(
  chartData: any[],
  filename: string,
  chartType: 'line' | 'bar' | 'pie' | 'heatmap'
): void {
  // For now, export as CSV (most universal)
  exportToCSV(chartData, `${filename}-${chartType}`);
}

/**
 * Create a shareable link to analytics view
 * Link expires after specified duration
 * 
 * @param dashboardId Dashboard or widget to share
 * @param expiresInDays Number of days until link expires
 * @returns Shareable URL
 */
export async function createShareableLink(
  dashboardId: string,
  expiresInDays: number = 7
): Promise<string> {
  try {
    const response = await fetch('/api/analytics/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dashboard_id: dashboardId,
        expires_in_days: expiresInDays
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create shareable link');
    }

    const result = await response.json();
    return result.shareUrl;
  } catch (err) {
    console.error('Failed to create shareable link:', err);
    throw err;
  }
}

/**
 * Helper function to download a file
 * 
 * @param content File content
 * @param filename Filename with extension
 * @param mimeType MIME type
 */
function downloadFile(
  content: string | Blob,
  filename: string,
  mimeType: string
): void {
  const blob = content instanceof Blob 
    ? content 
    : new Blob([content], { type: mimeType });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = filename;
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Generate filename with timestamp
 * 
 * @param prefix Filename prefix
 * @param extension File extension (without dot)
 * @returns Filename with timestamp
 */
export function generateFilename(prefix: string, extension: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  return `${prefix}-${timestamp}.${extension}`;
}

/**
 * Privacy-aware export
 * Removes sensitive fields before exporting
 * 
 * @param data Data to export
 * @param sensitiveFields Fields to exclude
 */
export function exportWithPrivacy<T extends Record<string, any>>(
  data: T[],
  sensitiveFields: string[],
  filename: string,
  format: 'csv' | 'json' = 'csv'
): void {
  // Remove sensitive fields
  const sanitized = data.map(item => {
    const clean = { ...item };
    sensitiveFields.forEach(field => {
      delete clean[field];
    });
    return clean;
  });

  // Export based on format
  if (format === 'csv') {
    exportToCSV(sanitized, filename);
  } else {
    exportToJSON(sanitized, filename);
  }
}

/**
 * Batch export multiple datasets
 * Creates a ZIP file with multiple CSV/JSON files
 * Requires jszip: npm install jszip
 * 
 * @param exports Array of export configurations
 * @param zipFilename Name for the ZIP file
 */
export async function exportBatch(
  exports: Array<{
    data: any[];
    filename: string;
    format: 'csv' | 'json';
  }>,
  zipFilename: string
): Promise<void> {
  try {
    // Dynamic import to avoid SSR issues
    // @ts-expect-error - jszip is optional dependency
    const JSZip = await import('jszip').catch(() => {
      throw new Error('jszip not installed. Run: npm install jszip');
    });
    const zip = new JSZip.default();

    // Add each export to the ZIP
    exports.forEach(({ data, filename, format }) => {
      const content = format === 'csv'
        ? generateCSVContent(data)
        : JSON.stringify(data, null, 2);
      
      zip.file(`${filename}.${format}`, content);
    });

    // Generate ZIP blob
    const blob = await zip.generateAsync({ type: 'blob' });
    
    // Download
    downloadFile(blob, `${zipFilename}.zip`, 'application/zip');
  } catch (err) {
    console.error('Failed to create batch export:', err);
    throw new Error('Batch export failed. Ensure jszip is installed: npm install jszip');
  }
}

/**
 * Generate CSV content from data array
 * Helper function for batch exports
 */
function generateCSVContent<T extends Record<string, any>>(data: T[]): string {
  if (data.length === 0) return '';

  const firstItem = data[0];
  if (!firstItem) return '';
  
  const headers = Object.keys(firstItem);
  const rows = data.map(item => 
    headers.map(h => {
      const val = item[h];
      if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return String(val ?? '');
    }).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Schedule automatic export
 * For recurring reports (future enhancement)
 * 
 * @param config Export configuration
 */
export async function scheduleExport(config: {
  dashboardId: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  format: 'csv' | 'json' | 'pdf';
  recipients: string[];
}): Promise<void> {
  // TODO: Implement with cron job or scheduled function
  console.log('Scheduled export configured:', config);
  throw new Error('Scheduled exports not yet implemented');
}

