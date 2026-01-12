'use client'

import DarkVeil from '@/components/DarkVeil'
import './DarkVeil.css'

interface DarkVeilBackgroundProps {
  hueShift?: number
  noiseIntensity?: number
  speed?: number
  warpAmount?: number
  resolutionScale?: number
}

export default function DarkVeilBackground({
  hueShift = 220,
  noiseIntensity = 0.03,
  speed = 0.15,
  warpAmount = 0.3,
  resolutionScale = 0.5
}: DarkVeilBackgroundProps) {
  return (
    <div className="fixed inset-0 -z-10 bg-dark-950">
      <div className="absolute inset-0">
        <DarkVeil 
          hueShift={hueShift}
          noiseIntensity={noiseIntensity}
          speed={speed}
          warpAmount={warpAmount}
          resolutionScale={resolutionScale}
        />
      </div>
      <div className="absolute inset-0 bg-dark-950/40 backdrop-blur-[1px]" />
    </div>
  )
}
