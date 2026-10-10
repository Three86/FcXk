import { useState } from 'react'

import { cn } from '@/lib/utils'

interface ItemImageProps {
  src: string | null
  alt: string
  borderColor: string
  particleImage?: string
  className?: string
}

/** Steam item image, capped at 184x184, with a border in the item's quality colour. */
export function ItemImage({ src, alt, borderColor, particleImage, className }: ItemImageProps) {
  const [failed, setFailed] = useState(false)

  return (
    <div
      className={cn('relative aspect-square self-start w-full max-w-[184px] shrink-0 overflow-hidden rounded-md border-2 bg-muted/40', className)}
      style={{ borderColor, boxShadow: `0 0 8px -2px ${borderColor}` }}
    >
      {particleImage && (
        <img src={particleImage} alt="" aria-hidden className="absolute inset-0 size-full object-contain opacity-70" loading="lazy" />
      )}
      {src && !failed ? (
        <img src={src} alt={alt} className="relative size-full max-h-[184px] max-w-[184px] object-contain" loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <div className="text-muted-foreground flex size-full items-center justify-center text-xs">No image</div>
      )}
    </div>
  )
}
