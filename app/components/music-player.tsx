"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Search, Shuffle, SkipBack, SkipForward, Repeat, Music, Volume2, VolumeX, Volume1 } from "lucide-react" // Import Volume icons
import Image from "next/image"
import { VolumeSlider } from "./volume-slider" // Import the refactored VolumeSlider
// import { GlassCard } from "@developer-hub/liquid-glass" // Removed GlassCard import
import { cn } from "@/lib/utils"

interface Track {
  id: number
  title: string
  artist: string
  duration: number
  url: string
  coverArt: string | null
}

export default function MusicPlayer() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [error, setError] = useState<string | null>(null)
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [volume, setVolume] = useState(1)
  const [isShuffled, setIsShuffled] = useState(false)
  const [isAutoplay, setIsAutoplay] = useState(false)
  const [isVolumeSliderOpen, setIsVolumeSliderOpen] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const res = await fetch("/api/tracks")
        if (!res.ok) throw new Error("Failed to fetch tracks")
        const data = await res.json()
        if (!Array.isArray(data)) throw new Error("Invalid data format")
        setTracks(data)
        setError(null)
      } catch (err) {
        console.error("Error fetching tracks:", err)
        setError("Failed to load tracks. Please try again later.")
        setTracks([])
      }
    }

    fetchTracks()
  }, [])

  useEffect(() => {
    if (audioRef.current) {
      const updateProgress = () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime)
        }
      }
      audioRef.current.addEventListener("timeupdate", updateProgress)
      return () => {
        audioRef.current?.removeEventListener("timeupdate", updateProgress)
      }
    }
  }, [])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  const filteredTracks = tracks.filter(
    (track) =>
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const shuffleArray = useCallback((array: Track[]) => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }, [])

  const toggleShuffle = useCallback(() => {
    setIsShuffled((prev) => !prev)
    setTracks((prev) => (isShuffled ? [...prev].sort((a, b) => a.id - b.id) : shuffleArray(prev)))
  }, [isShuffled, shuffleArray])

  const toggleAutoplay = useCallback(() => {
    setIsAutoplay((prev) => !prev)
  }, [])

  const playTrack = useCallback((track: Track) => {
    setCurrentTrack(track)
    setIsPlaying(true)
    if (audioRef.current) {
      audioRef.current.src = track.url
      audioRef.current.play()
    }
  }, [])

  const togglePlay = useCallback(() => {
    if (!currentTrack) return
    if (isPlaying) {
      audioRef.current?.pause()
    } else {
      audioRef.current?.play()
    }
    setIsPlaying(!isPlaying)
  }, [currentTrack, isPlaying])

  const playNext = useCallback(() => {
    if (!currentTrack || tracks.length === 0) return
    const currentIndex = tracks.findIndex((track) => track.id === currentTrack.id)
    let nextIndex
    if (isShuffled) {
      nextIndex = Math.floor(Math.random() * tracks.length)
    } else {
      nextIndex = (currentIndex + 1) % tracks.length
    }
    playTrack(tracks[nextIndex])
  }, [currentTrack, tracks, isShuffled, playTrack])

  const playPrevious = useCallback(() => {
    if (!currentTrack || tracks.length === 0) return
    const currentIndex = tracks.findIndex((track) => track.id === currentTrack.id)
    let previousIndex
    if (isShuffled) {
      previousIndex = Math.floor(Math.random() * tracks.length)
    } else {
      previousIndex = (currentIndex - 1 + tracks.length) % tracks.length
    }
    playTrack(tracks[previousIndex])
  }, [currentTrack, tracks, isShuffled, playTrack])

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressRef.current || !currentTrack || !audioRef.current) return

      const rect = progressRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const width = rect.width
      const percentage = x / width
      const newTime = percentage * (currentTrack.duration || 0)

      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    },
    [currentTrack],
  )

  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume)
  }, [])

  const handleTrackEnd = useCallback(() => {
    if (isAutoplay) {
      playNext()
    } else {
      setIsPlaying(false)
      setCurrentTime(0)
    }
  }, [isAutoplay, playNext])

  const getVolumeIcon = () => {
    if (volume === 0) return <VolumeX className="w-5 h-5" />
    if (volume < 0.5) return <Volume1 className="w-5 h-5" />
    return <Volume2 className="w-5 h-5" />
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      <header className="flex flex-col sm:flex-row items-center justify-between px-4 py-2 sm:h-16 border-b border-white/10 flex-shrink-0">
        <div className="w-full sm:w-auto flex justify-center sm:justify-start mb-2 sm:mb-0">
          <Image src="/logo.svg" alt="MAFWBH logo" width={120} height={40} priority />
        </div>
        <div className="relative w-full sm:w-64 md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60 pointer-events-none w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search songs..."
            className="w-full pl-10 py-2 bg-black border border-white/10 text-white text-sm placeholder:text-white/60 focus:outline-none rounded-md"
          />
        </div>
      </header>

      {/* Full screen song list - no bottom padding */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className="border border-white/10 rounded-md h-full flex flex-col">
          <div className="grid grid-cols-[48px_48px_1fr_1fr_80px] gap-3 text-xs font-medium text-white/60 px-4 py-2 border-b border-white/10 flex-shrink-0">
            <div className="text-center">#</div>
            <div></div>
            <div>Title</div>
            <div>Artist</div>
            <div className="text-right pr-2">Duration</div>
          </div>

          {filteredTracks.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center opacity-60">
                {error ? <p className="text-sm">{error}</p> : <p className="text-sm">No songs found</p>}
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {filteredTracks.map((track, index) => (
                <button
                  key={track.id}
                  onClick={() => playTrack(track)}
                  className={`w-full grid grid-cols-[48px_48px_1fr_1fr_80px] gap-3 text-xs px-4 py-1.5 hover:bg-white/5 transition-colors items-center ${
                    currentTrack?.id === track.id ? "bg-white/5" : ""
                  }`}
                >
                  <div className="text-center text-white/60">{index + 1}</div>
                  <div className="flex items-center justify-center">
                    {track.coverArt ? (
                      <Image
                        src={track.coverArt || "/placeholder.svg"}
                        alt={`Cover for ${track.title}`}
                        width={32}
                        height={32}
                        className="rounded-sm"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-white/10 rounded-sm flex items-center justify-center">
                        <Music className="w-4 h-4 text-white/60" />
                      </div>
                    )}
                  </div>
                  <div className="text-left truncate">{track.title}</div>
                  <div className="text-left text-white/60 truncate">{track.artist}</div>
                  <div className="text-right text-white/60 pr-2">{formatTime(track.duration)}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fixed width floating control bar with custom liquid glass effect */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 w-full max-w-[480px]">
        <div className="p-3 rounded-[30px] bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg">
          {/* Main control section */}
          <div className="flex items-center justify-between mb-3">
            {/* Left: Album art and track info - fixed width to prevent layout shift */}
            <div className="flex items-center gap-3 w-64">
              <div className="flex-shrink-0">
                {currentTrack?.coverArt ? (
                  <Image
                    src={currentTrack.coverArt || "/placeholder.svg"}
                    alt={`Cover for ${currentTrack.title}`}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <Music className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-white text-sm truncate">
                  {currentTrack?.title || "No song selected"}
                </div>
                <div className="text-xs text-gray-400 truncate">{currentTrack?.artist || "Unknown artist"}</div>
              </div>
            </div>

            {/* Right: Play/Pause button - fixed width */}
            <div className="flex-shrink-0 w-20 flex justify-end">
              <button
                onClick={togglePlay}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isPlaying ? "bg-red-500 hover:bg-red-600 text-white" : "bg-green-500 hover:bg-green-600 text-white"
                }`}
              >
                {isPlaying ? "Pause" : "Play"}
              </button>
            </div>
          </div>

          {/* Progress bar - moved below song info */}
          <div className="mb-3">
            <div
              ref={progressRef}
              onClick={handleProgressClick}
              className="w-full bg-white/10 h-0.5 rounded-full overflow-hidden cursor-pointer relative"
            >
              <div
                className="bg-white h-full transition-all duration-100 ease-linear"
                style={{ width: `${((currentTime / (currentTrack?.duration || 1)) * 100).toFixed(2)}%` }}
              />
            </div>
          </div>

          {/* Bottom control buttons or Volume Slider */}
          <div className="flex items-center justify-center gap-4">
            {/* Volume button always visible */}
            <button
              onClick={() => setIsVolumeSliderOpen(!isVolumeSliderOpen)}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-black/50 backdrop-blur-sm text-gray-400 hover:bg-gray-600 hover:text-white"
              aria-label="Toggle volume slider"
            >
              {getVolumeIcon()}
            </button>

            {/* Volume Slider */}
            {isVolumeSliderOpen ? (
              <div className="flex-1 flex justify-center items-center py-2 px-4 rounded-full bg-black/50 backdrop-blur-lg animate-in fade-in duration-200">
                <VolumeSlider
                  volume={volume}
                  onVolumeChange={handleVolumeChange}
                  onClose={() => setIsVolumeSliderOpen(false)}
                />
              </div>
            ) : (
              <>
                {/* Shuffle button */}
                <button
                  onClick={toggleShuffle}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all bg-black/50 backdrop-blur-sm text-gray-400 hover:bg-gray-600 hover:text-white",
                    isShuffled && "bg-white/20 text-white backdrop-blur-sm",
                  )}
                >
                  <Shuffle className="w-3.5 h-3.5" />
                </button>

                {/* Previous button */}
                <button
                  onClick={playPrevious}
                  className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-gray-400 hover:text-white transition-all"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </button>

                {/* Next button */}
                <button
                  onClick={playNext}
                  className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-gray-400 hover:text-white transition-all"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>

                {/* Autoplay button */}
                <button
                  onClick={toggleAutoplay}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all bg-black/50 backdrop-blur-sm text-gray-400 hover:bg-gray-600 hover:text-white",
                    isAutoplay && "bg-white/20 text-white backdrop-blur-sm",
                  )}
                >
                  <Repeat className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <audio
        ref={audioRef}
        onEnded={handleTrackEnd}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </div>
  )
}
