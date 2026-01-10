'use client'

import dynamic from 'next/dynamic'

const DarkVeil = dynamic(() => import('@/components/DarkVeil'), { ssr: false })

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
    <>
      {/* Dark Veil Animated Background */}
      <div className="fixed inset-0 -z-10">
        <DarkVeil 
          hueShift={hueShift}
          noiseIntensity={noiseIntensity}
          speed={speed}
          warpAmount={warpAmount}
          resolutionScale={resolutionScale}
        />
        <div className="absolute inset-0 bg-dark-950/60 backdrop-blur-[2px]" />
      </div>
    </>
  )
}
