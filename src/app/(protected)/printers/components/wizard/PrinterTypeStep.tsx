import { cn } from '@/lib/utils'
import type { PrinterTechnology } from '@/model/printer'
import {
  printerTypeOptions,
  resolveTypeImageSrc,
} from './printerTypeOptions'

interface PrinterTypeStepProps {
  selectedTechnology: PrinterTechnology | null
  onTechnologySelect: (technology: PrinterTechnology) => void
}

export function PrinterTypeStep({
  selectedTechnology,
  onTechnologySelect,
}: PrinterTypeStepProps) {
  const shownOptions = selectedTechnology
    ? printerTypeOptions.filter((option) => option.technology === selectedTechnology)
    : printerTypeOptions

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Select printer type</h3>
      <div
        className={cn(
          'grid gap-3',
          selectedTechnology ? 'grid-cols-1 max-w-sm mx-auto' : 'grid-cols-3'
        )}
      >
        {shownOptions.map((option) => (
          <button
            type="button"
            key={option.technology}
            aria-label={`Select ${option.title} printer type`}
            onClick={() => onTechnologySelect(option.technology)}
            className={cn(
              'group rounded-lg border bg-background text-left overflow-hidden',
              'transition-all duration-300 ease-out',
              'opacity-70 hover:opacity-90 hover:-translate-y-1 hover:scale-[1.01]',
              selectedTechnology === option.technology &&
                'opacity-100 shadow-md ring-2 ring-primary/60'
            )}
          >
            <img
              src={resolveTypeImageSrc(option.image)}
              alt={`${option.title} printer`}
              className="h-32 w-32 object-contain"
            />
            <div className="p-3">
              <p className="font-semibold">{option.title}</p>
              <p className="text-xs text-muted-foreground">{option.subtitle}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
