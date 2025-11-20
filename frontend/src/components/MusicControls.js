import { useState } from 'react';

/**
 * Music Controls Component
 * Simple UI for controlling the ambient music
 * - Mute/unmute button (bottom corner)
 * - Visual feedback (icon pulses gently with audio)
 */

const MusicControls = ({ 
  isPlaying, 
  isMuted, 
  volume, 
  onToggleMute, 
  onVolumeChange,
  showVolumeSlider = false 
}) => {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
      {/* Volume Slider (optional, shown in settings) */}
      {showVolumeSlider && (
        <div className="glass-panel px-4 py-2 flex items-center gap-3">
          <span className="text-xs opacity-60">Volume</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-24 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none 
                       [&::-webkit-slider-thumb]:w-3 
                       [&::-webkit-slider-thumb]:h-3 
                       [&::-webkit-slider-thumb]:rounded-full 
                       [&::-webkit-slider-thumb]:bg-white/80
                       [&::-webkit-slider-thumb]:cursor-pointer
                       [&::-webkit-slider-thumb]:transition-all
                       [&::-webkit-slider-thumb]:hover:bg-white
                       [&::-webkit-slider-thumb]:hover:scale-110"
          />
          <span className="text-xs opacity-40 font-mono min-w-[2rem] text-right">
            {Math.round(volume * 100)}%
          </span>
        </div>
      )}

      {/* Mute/Unmute Button */}
      <button
        onClick={onToggleMute}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className={`
          w-12 h-12 rounded-full 
          glass-panel
          flex items-center justify-center
          transition-all duration-300
          hover:scale-110
          ${isPlaying && !isMuted ? 'animate-pulse-gentle' : ''}
          ${isHovering ? 'opacity-100' : 'opacity-60'}
        `}
        title={isMuted ? 'Unmute ambient music' : 'Mute ambient music'}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        <span className="text-xl">
          {isMuted ? '🔇' : isPlaying ? '🔊' : '🔈'}
        </span>
      </button>

      {/* Status indicator (tiny dot) */}
      {isPlaying && !isMuted && (
        <div 
          className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-400 animate-pulse"
          title="Music playing"
        />
      )}
    </div>
  );
};

export default MusicControls;
