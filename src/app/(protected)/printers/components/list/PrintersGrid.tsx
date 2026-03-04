import { PrinterCard } from './PrinterCard'
import { PrintersEmptyState } from './PrintersEmptyState'
import type { PrinterData } from '@/model/printer'

interface PrintersGridProps {
  printers: PrinterData[]
  totalPrinterCount: number
  canEdit: boolean
  onEdit: (printer: PrinterData) => void
}

export function PrintersGrid({
  printers,
  totalPrinterCount,
  canEdit,
  onEdit,
}: PrintersGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {printers.map((printer) => (
        <PrinterCard
          key={printer.id}
          printer={printer}
          canEdit={canEdit}
          onEdit={onEdit}
        />
      ))}

      {printers.length === 0 && (
        <PrintersEmptyState hasPrinters={totalPrinterCount > 0} />
      )}
    </div>
  )
}
