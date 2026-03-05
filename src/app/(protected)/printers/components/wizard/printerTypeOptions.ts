import fdmImage from '../../assets/fdm.png'
import slaImage from '../../assets/sla.png'
import slsImage from '../../assets/sls.png'
import type { PrinterTechnology } from '@/model/printer'

export interface PrinterTypeOption {
  technology: PrinterTechnology
  title: string
  subtitle: string
  image: string | { src: string }
}

export const printerTypeOptions: PrinterTypeOption[] = [
  {
    technology: 'FDM',
    title: 'FDM',
    subtitle: 'Filament based printing',
    image: fdmImage,
  },
  {
    technology: 'SLA',
    title: 'SLA',
    subtitle: 'Resin based printing',
    image: slaImage,
  },
  {
    technology: 'SLS',
    title: 'SLS',
    subtitle: 'Powder based printing',
    image: slsImage,
  },
]

export function resolveTypeImageSrc(image: string | { src: string }) {
  return typeof image === 'string' ? image : image.src
}

export function getTypeOption(technology: PrinterTechnology): PrinterTypeOption | undefined {
  return printerTypeOptions.find((opt) => opt.technology === technology)
}
