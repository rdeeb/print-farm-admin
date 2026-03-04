import { PrinterLoaderIcon } from '@/components/ui/printer-loader-icon'

export function PrintersLoadingState() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <PrinterLoaderIcon size={64} color="#4f46e5" />
        <p className="mt-4 text-gray-600">Loading printers...</p>
      </div>
    </div>
  )
}
