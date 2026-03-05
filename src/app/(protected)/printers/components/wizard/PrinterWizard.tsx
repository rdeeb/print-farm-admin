'use client'

import { useEffect, useRef, useState } from 'react'
import type { PrinterTechnology } from '@/model/printer'
import { PrinterTypeStep } from './PrinterTypeStep'
import { PrinterDetailsStep } from './PrinterDetailsStep'

interface PrinterWizardProps {
  isOpen: boolean
  selectedTechnology: PrinterTechnology
  onTechnologySelect: (technology: PrinterTechnology) => void
  onStepChange?: (step: 'type' | 'details') => void
  children: React.ReactNode
}

export function PrinterWizard({
  isOpen,
  selectedTechnology,
  onTechnologySelect,
  onStepChange,
  children,
}: PrinterWizardProps) {
  const [step, setStep] = useState<'type' | 'details'>('type')
  const [visibleTechnology, setVisibleTechnology] =
    useState<PrinterTechnology | null>(null)
  const transitionTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setStep('type')
      setVisibleTechnology(null)
    }
  }, [isOpen])

  useEffect(
    () => () => {
      if (transitionTimerRef.current) {
        window.clearTimeout(transitionTimerRef.current)
      }
    },
    []
  )

  useEffect(() => {
    onStepChange?.(step)
  }, [onStepChange, step])

  const handleTypeSelect = (technology: PrinterTechnology) => {
    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current)
    }

    onTechnologySelect(technology)
    setVisibleTechnology(technology)
    transitionTimerRef.current = window.setTimeout(() => {
      setStep('details')
      transitionTimerRef.current = null
    }, 260)
  }

  const handleSwitchType = () => {
    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current)
      transitionTimerRef.current = null
    }
    setStep('type')
    setVisibleTechnology(null)
  }

  if (step === 'type') {
    return (
      <PrinterTypeStep
        selectedTechnology={visibleTechnology}
        onTechnologySelect={handleTypeSelect}
      />
    )
  }

  return (
    <PrinterDetailsStep
      technology={selectedTechnology}
      onSwitchType={handleSwitchType}
    >
      {children}
    </PrinterDetailsStep>
  )
}
