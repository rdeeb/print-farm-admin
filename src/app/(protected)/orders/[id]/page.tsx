'use client'

import { useParams } from 'next/navigation'
import { PrinterLoaderIcon } from '@/components/ui/printer-loader-icon'
import { statusConfig, fallbackOrderStatus } from '../constants'
import { useOrderDetail } from '../hooks/useOrderDetail'
import { OrderDetailHeader } from '../components/detail/OrderDetailHeader'
import { OrderInfoCard } from '../components/detail/OrderInfoCard'
import { OrderPartsCard } from '../components/detail/OrderPartsCard'
import { PrintSelectionDialog } from '../components/detail/PrintSelectionDialog'

export default function OrderDetailPage() {
  const params = useParams()
  const orderId = params.id as string

  const {
    order,
    isLoading,
    isSaving,
    canEdit,
    isEditingDueDate,
    dueDateForm,
    selectionOpen,
    selectedOrderPart,
    selectedFilamentId,
    selectedPrinterId,
    editingQuantityId,
    quantityForm,
    selectedOptions,
    activePrinters,
    isSelectedPrinterAvailable,
    setSelectionOpen,
    setIsEditingDueDate,
    setDueDateForm,
    setQuantityForm,
    setSelectedFilamentId,
    setSelectedPrinterId,
    handleStartPrinting,
    handleEditQuantity,
    handleCancelQuantity,
    handleSaveQuantity,
    confirmStartPrinting,
    markPrinted,
    markAssembled,
    markDelivered,
    handleSaveDueDate,
    handleCancelDueDateEdit,
  } = useOrderDetail(orderId)

  if (isLoading || !order) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <PrinterLoaderIcon size={64} color="#4f46e5" />
          <p className="mt-4 text-gray-600">Loading order...</p>
        </div>
      </div>
    )
  }

  const orderStatus = statusConfig[order.status] ?? fallbackOrderStatus

  return (
    <div className="space-y-6">
      <OrderDetailHeader
        order={order}
        orderStatus={orderStatus}
        canEdit={canEdit}
        isEditingDueDate={isEditingDueDate}
        isSaving={isSaving}
        onEditDueDate={() => setIsEditingDueDate(true)}
        onSaveDueDate={handleSaveDueDate}
        onCancelDueDateEdit={handleCancelDueDateEdit}
        onMarkAssembled={markAssembled}
        onMarkDelivered={markDelivered}
      />

      <OrderInfoCard
        order={order}
        isEditingDueDate={isEditingDueDate}
        dueDateForm={dueDateForm}
        onDueDateChange={setDueDateForm}
      />

      <OrderPartsCard
        order={order}
        canEdit={canEdit}
        activePrinters={activePrinters}
        editingQuantityId={editingQuantityId}
        quantityForm={quantityForm}
        isSaving={isSaving}
        onEditQuantity={handleEditQuantity}
        onCancelQuantity={handleCancelQuantity}
        onSaveQuantity={handleSaveQuantity}
        onStartPrinting={handleStartPrinting}
        onMarkPrinted={markPrinted}
        onQuantityFormChange={setQuantityForm}
      />

      <PrintSelectionDialog
        open={selectionOpen}
        onOpenChange={setSelectionOpen}
        selectedOrderPart={selectedOrderPart}
        selectedFilamentId={selectedFilamentId}
        selectedPrinterId={selectedPrinterId}
        selectedOptions={selectedOptions}
        activePrinters={activePrinters}
        isSelectedPrinterAvailable={isSelectedPrinterAvailable}
        isSaving={isSaving}
        onPrinterChange={setSelectedPrinterId}
        onFilamentChange={setSelectedFilamentId}
        onConfirm={confirmStartPrinting}
      />
    </div>
  )
}
