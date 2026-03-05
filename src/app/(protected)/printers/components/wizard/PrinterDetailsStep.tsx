import { Button } from '@/components/ui/button'
import type { PrinterTechnology } from '@/model/printer'
import { getTypeOption, resolveTypeImageSrc } from './printerTypeOptions'

interface PrinterDetailsStepProps {
  technology: PrinterTechnology
  onSwitchType: () => void
  children: React.ReactNode
}

export function PrinterDetailsStep({
  technology,
  onSwitchType,
  children,
}: PrinterDetailsStepProps) {
  const option = getTypeOption(technology)

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center text-center">
        {option && (
          <img
            src={resolveTypeImageSrc(option.image)}
            alt={`${option.title} printer`}
            className="h-32 w-32 object-contain shrink-0"
          />
        )}
        <p className="text-sm text-muted-foreground mt-2">Selected printer type</p>
        <p className="text-lg font-semibold tracking-wide">{technology}</p>
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 mt-1"
          onClick={onSwitchType}
        >
          Switch type
        </Button>
      </div>
      {children}
    </div>
  )
}
