'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PrinterFormData } from '../hooks/usePrinters'
import type { PrinterModel } from '@/model/printer'
import { PrinterWizard } from './wizard/PrinterWizard'

interface CreatePrinterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedPreset: string
  onTechnologySelect: (technology: 'FDM' | 'SLA' | 'SLS') => void
  onPresetSelect: (presetId: string) => void
  formData: PrinterFormData
  onFormDataChange: (data: PrinterFormData) => void
  brands: string[]
  printerModelsByBrand: Record<string, PrinterModel[]>
  onSubmit: (e: React.FormEvent) => void
  onReset: () => void
}

export function CreatePrinterDialog({
  open,
  onOpenChange,
  selectedPreset,
  onTechnologySelect,
  onPresetSelect,
  formData,
  onFormDataChange,
  brands,
  printerModelsByBrand,
  onSubmit,
  onReset,
}: CreatePrinterDialogProps) {
  const [wizardStep, setWizardStep] = useState<'type' | 'details'>('type')

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) onReset()
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Printer
        </Button>
      </DialogTrigger>
      <DialogContent
        className={cn(
          'max-h-[90vh] overflow-y-auto transition-all duration-300 ease-out',
          wizardStep === 'type' ? 'max-w-4xl' : 'max-w-md'
        )}
      >
        <DialogHeader>
          <DialogTitle>Add New Printer</DialogTitle>
          <DialogDescription>
            Choose a printer type, then configure your printer details
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <PrinterWizard
            isOpen={open}
            selectedTechnology={formData.technology}
            onTechnologySelect={(technology) => {
              onTechnologySelect(technology)
            }}
            onStepChange={setWizardStep}
          >
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Printer Preset</Label>
                <Select value={selectedPreset} onValueChange={onPresetSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a printer model or enter custom" />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    <SelectItem value="custom">
                      <span className="font-medium">Custom Printer</span>
                    </SelectItem>
                    {brands.map((brand) => (
                      <SelectGroup key={brand}>
                        <SelectLabel className="font-semibold text-primary">
                          {brand}
                        </SelectLabel>
                        {printerModelsByBrand[brand]?.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{model.model}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                {model.buildVolumeX}x{model.buildVolumeY}x
                                {model.buildVolumeZ}mm
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Printer Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    onFormDataChange({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Bambu X1C #1, Printer Station A"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  A unique name to identify this printer in your farm
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) =>
                      onFormDataChange({ ...formData, brand: e.target.value })
                    }
                    placeholder="e.g., Bambu Lab"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model *</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) =>
                      onFormDataChange({ ...formData, model: e.target.value })
                    }
                    placeholder="e.g., X1 Carbon"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Build Volume (mm)</Label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Input
                      placeholder="X"
                      value={formData.buildVolumeX}
                      onChange={(e) =>
                        onFormDataChange({
                          ...formData,
                          buildVolumeX: e.target.value,
                        })
                      }
                    />
                    <span className="text-xs text-muted-foreground">Width</span>
                  </div>
                  <div>
                    <Input
                      placeholder="Y"
                      value={formData.buildVolumeY}
                      onChange={(e) =>
                        onFormDataChange({
                          ...formData,
                          buildVolumeY: e.target.value,
                        })
                      }
                    />
                    <span className="text-xs text-muted-foreground">Depth</span>
                  </div>
                  <div>
                    <Input
                      placeholder="Z"
                      value={formData.buildVolumeZ}
                      onChange={(e) =>
                        onFormDataChange({
                          ...formData,
                          buildVolumeZ: e.target.value,
                        })
                      }
                    />
                    <span className="text-xs text-muted-foreground">Height</span>
                  </div>
                </div>
              </div>

              <div
                className={
                  formData.technology === 'FDM'
                    ? 'grid grid-cols-2 gap-4'
                    : 'space-y-4'
                }
              >
                {formData.technology === 'FDM' && (
                  <div className="space-y-2">
                    <Label htmlFor="nozzleSize">Nozzle Size (mm)</Label>
                    <Input
                      id="nozzleSize"
                      value={formData.nozzleSize}
                      onChange={(e) =>
                        onFormDataChange({
                          ...formData,
                          nozzleSize: e.target.value,
                        })
                      }
                      placeholder="0.4"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="powerConsumption">Avg. Power (W)</Label>
                  <Input
                    id="powerConsumption"
                    value={formData.powerConsumption}
                    onChange={(e) =>
                      onFormDataChange({
                        ...formData,
                        powerConsumption: e.target.value,
                      })
                    }
                    placeholder="e.g., 350"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground -mt-2">
                Power consumption is used to calculate energy costs
              </p>

              <div className="space-y-2">
                <Label htmlFor="cost">Printer Cost</Label>
                <Input
                  id="cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) =>
                    onFormDataChange({ ...formData, cost: e.target.value })
                  }
                  placeholder="Total cost; operating cost/hr = cost ÷ 13140"
                />
                <p className="text-xs text-muted-foreground">
                  Used for landed cost: operating cost per hour = cost ÷ 13140
                  (highest among printers)
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Add Printer</Button>
              </div>
            </form>
          </PrinterWizard>
        </div>
      </DialogContent>
    </Dialog>
  )
}
