"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"

interface VolumeSliderProps {
  volume: number
  onVolumeChange: (newVolume: number) => void
  onClose: () => void // Callback to close the slider
}

export const VolumeSlider: React.FC<VolumeSliderProps> = ({ volume, onVolumeChange, onClose }) => {
  const [isDragging, setIsDragging] = useState(false)
  const sliderRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null) // Ref for the popup container

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose() // Close the slider if clicked outside
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [onClose])

  const volumePercentage = Math.round(volume * 100)

  const handleSliderInteraction = (clientX: number) => {
    if (!sliderRef.current) return

    const rect = sliderRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percentage = Math.max(0, Math.min(1, x / rect.width))
    onVolumeChange(percentage)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    handleSliderInteraction(e.clientX)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      handleSliderInteraction(e.clientX)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging])

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    setIsDragging(true)
    const touch = e.touches[0]
    handleSliderInteraction(touch.clientX)
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging && e.touches[0]) {
      handleSliderInteraction(e.touches[0].clientX)
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("touchmove", handleTouchMove)
      document.addEventListener("touchend", handleTouchEnd)
      return () => {
        document.removeEventListener("touchmove", handleTouchMove)
        document.removeEventListener("touchend", handleTouchEnd)
      }
    }
  }, [isDragging])

  return (
    <div ref={popupRef} className="flex items-center gap-3">
      <div className="relative flex items-center gap-3">
        <div
          ref={sliderRef}
          className="relative w-24 h-2 cursor-pointer"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {/* Track background */}
          <div className="absolute inset-0 bg-white/20 rounded-full"></div>

          {/* Progress fill */}
          <div
            className="absolute left-0 top-0 h-full bg-white rounded-full transition-all duration-100"
            style={{ width: `${volumePercentage}%` }}
          ></div>

          {/* Draggable thumb */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full transition-all duration-100 cursor-grab ${
              isDragging ? "scale-125 cursor-grabbing" : "hover:scale-110"
            }`}
            style={{
              left: `calc(${volumePercentage}% - 6px)`,
            }}
          />
        </div>

        <div className="text-xs text-white/80 min-w-[2rem] text-center">{volumePercentage}%</div>
      </div>
    </div>
  )
}
