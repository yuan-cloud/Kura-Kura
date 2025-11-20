import { useState, useEffect } from "react";
import axios from "axios";
import GlowyCritter from "@/components/GlowyCritter";
import MusicControls from "@/components/MusicControls";
import useMusicEngine from "@/hooks/useMusicEngine";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Landing = () => {
  const [repo, setRepo] = useState("");
  const [variant, setVariant] = useState(0);
  const [loading, setLoading] = useState(false);
  const [critterConfig, setCritterConfig] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customVariant, setCustomVariant] = useState("");

  // Music Engine
  const music = useMusicEngine();

  // Auto-play music when critter is generated
  useEffect(() => {
    if (critterConfig && !music.isPlaying) {
      // Auto-start music with smooth fade-in
      music.play(critterConfig, 3.5);
    } else if (critterConfig && music.isPlaying) {
      // Crossfade to new critter
      music.crossfade(critterConfig, 2.5);
    }
  }, [critterConfig]);

  // Check URL parameters on page load and auto-generate
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const repoParam = urlParams.get('repo');
    const variantParam = urlParams.get('variant');
    
    if (repoParam) {
      // Set the repo input
      setRepo(repoParam);
      
      // Auto-generate with the specified variant
      const variantToUse = variantParam ? parseInt(variantParam) : 0;
      
      // Small delay to let the page render first
      setTimeout(() => {
        handleGenerate(variantToUse);
      }, 500);
    }
  }, []); // Only run once on mount

  const handleGenerate = async (specificVariant = null) => {
    if (!repo.trim()) {
      toast.error("Please enter a GitHub URL or owner/name");
      return;
    }

    let repoPath = repo.trim();
    const githubUrlMatch = repoPath.match(/github\.com\/([^/]+\/[^/]+)/);
    if (githubUrlMatch) {
      repoPath = githubUrlMatch[1].replace(/\.git$/, '');
    }

    if (!repoPath.includes("/")) {
      toast.error("Invalid format. Use: https://github.com/owner/repo or owner/repo");
      return;
    }

    const variantToUse = specificVariant !== null ? specificVariant : variant;
    const cacheKey = `critter:${repoPath}:${variantToUse}`;

    // Check localStorage cache first
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const cachedData = JSON.parse(cached);
        const cacheAge = Date.now() - cachedData.timestamp;
        
        // Use cached data if less than 24 hours old
        if (cacheAge < 24 * 60 * 60 * 1000) {
          setVariant(variantToUse);
          setCritterConfig(cachedData.params);
          toast.success("Critter loaded from cache ⚡");
          return;
        }
      }
    } catch (e) {
      console.warn("localStorage cache read failed:", e);
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/generate`, { 
        repo: repoPath,
        variant: variantToUse
      });
      
      const data = response.data;
      
      setVariant(variantToUse);
      setCritterConfig(data.params);
      
      // Save to localStorage
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          params: data.params,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.warn("localStorage cache write failed:", e);
      }
      
      if (data.cached) {
        toast.success("Critter retrieved from cache ⚡");
      } else {
        toast.success("Fresh critter summoned! ✨");
      }
    } catch (error) {
      console.error("Generation error:", error);
      if (error.response?.status === 404) {
        toast.error("Repository not found. Check the repository name.");
      } else if (error.response?.status === 429) {
        toast.error("Slow down! Too many rolls. Try again in a minute.");
      } else {
        const errorMsg = error.response?.data?.detail || "Failed to generate. Try again.";
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleGenerate();
    }
  };

  const rollVariant = () => {
    if (!repo.trim()) {
      toast.error("Enter a repo first!");
      return;
    }
    const newVariant = Math.floor(Math.random() * 1000);
    handleGenerate(newVariant);
  };

  const handleCustomVariant = () => {
    const parsed = parseInt(customVariant);
    if (isNaN(parsed) || parsed < 0 || parsed > 999) {
      toast.error("Variant must be 0-999");
      return;
    }
    handleGenerate(parsed);
    setShowAdvanced(false);
    setCustomVariant("");
  };

  return (
    <div className="gradient-bg min-h-screen relative">
      {/* Ambient Background Spirits - Very subtle, misty */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* React spirit - top right */}
        <div 
          className="absolute opacity-5"
          style={{
            top: '15%',
            right: '10%',
            transform: 'scale(0.5)',
            animation: 'float-slow 12s ease-in-out infinite',
            animationDelay: '0s'
          }}
        >
          <GlowyCritter config={{
            seed: "react-ambient",
            palette: { bg: "transparent", fg: "#61DAFB", accents: ["#0099FF", "#00DDFF"] },
            traits: { species: "pebble", pattern: "none", accessory: "none", glowLevel: 0, auraParticles: 3, swayAmount: 0.05, breathAmount: 0.04 },
            motion: { tempo_hz: 0.2, loop_seconds: 3, style: "breathing-gradient" },
            mood: "calm"
          }} />
        </div>
        
        {/* Svelte spirit - bottom right */}
        <div 
          className="absolute opacity-5"
          style={{
            bottom: '20%',
            right: '15%',
            transform: 'scale(0.45)',
            animation: 'float-slow 16s ease-in-out infinite',
            animationDelay: '6s'
          }}
        >
          <GlowyCritter config={{
            seed: "svelte-ambient",
            palette: { bg: "transparent", fg: "#FF3E00", accents: ["#FF3E00", "#FF6A33"] },
            traits: { species: "blob", pattern: "none", accessory: "none", glowLevel: 0, auraParticles: 2, swayAmount: 0.08, breathAmount: 0.03 },
            motion: { tempo_hz: 0.15, loop_seconds: 3, style: "breathing-gradient" },
            mood: "calm"
          }} />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-[880px] mx-auto px-6 py-16 md:py-24">
        {/* Header */}
        <div className="fade-in mb-12">
          <div className="text-center mb-8 fade-in" style={{ animationDelay: "0.2s" }}>
          <h1 
            className="text-4xl sm:text-5xl lg:text-6xl mb-4 leading-tight breathe"
            style={{ fontWeight: 300, letterSpacing: '0.005em' }}
            data-testid="main-heading"
          >
            Every repository has a soul
          </h1>
          <p className="text-base md:text-lg opacity-50 max-w-2xl leading-relaxed" data-testid="subtitle" style={{ fontWeight: 300 }}>
            蔵 · kura — storehouse where all things hold kami, where even stones have souls
          </p>
        </div>
        </div>

        {/* Input Section */}
        <div className="mb-8 fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            {/* Input with clear button */}
            <div className="relative flex-1 w-full sm:w-auto">
              <input
                data-testid="repo-input"
                type="text"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Paste any GitHub URL..."
                className="ritual-input w-full pr-10"
                disabled={loading}
              />
              {repo && (
                <button
                  onClick={() => setRepo("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors opacity-50 hover:opacity-100"
                  data-testid="clear-button"
                  title="Clear"
                >
                  ✕
                </button>
              )}
            </div>
            
            {/* Hero Dice Button */}
            <button
              data-testid="roll-button"
              onClick={rollVariant}
              disabled={loading}
              className="ritual-button text-2xl px-6 py-3 hover:scale-110 transition-transform"
              title="Roll spirit"
            >
              {loading ? "🌀" : "🎲"}
            </button>
            
            {/* Small Advanced Settings */}
            <button
              data-testid="advanced-button"
              onClick={() => setShowAdvanced(true)}
              className="ritual-button px-3 py-3 text-sm opacity-70 hover:opacity-100 relative group"
              title="Explore variants"
            >
              <span className="text-base">⚡</span>
              <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-[10px] opacity-0 group-hover:opacity-70 transition-opacity whitespace-nowrap pointer-events-none">
                Jump to variant
              </span>
            </button>
          </div>
          
          <p className="text-xs opacity-40 mt-2 text-center">
            Try: facebook/react, vuejs/vue, or your own
          </p>
          
          <div className="flex items-center justify-between mt-6">
            <p className="text-xs opacity-50 flex items-center gap-1">
              <span className="text-sm">🎲</span>
              Each roll reveals new personality
            </p>
            {critterConfig && (
              <div className="flex items-center gap-2">
                <span className="text-xs opacity-40">Spirit</span>
                <span 
                  className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono"
                  data-testid="variant-badge"
                >
                  #{variant}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Variant Explorer Modal */}
        {showAdvanced && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowAdvanced(false)}
          >
            <div 
              className="glass-panel p-8 max-w-sm w-full mx-4"
              onClick={(e) => e.stopPropagation()}
              data-testid="advanced-modal"
            >
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">⚡</div>
                <h3 className="text-xl font-semibold mb-1">Jump to Variant</h3>
                <p className="text-sm opacity-60 mt-2">
                  1000 unique spirits per repository
                </p>
              </div>
              
              <div className="mb-6">
                <input
                  type="number"
                  min="0"
                  max="999"
                  value={customVariant}
                  onChange={(e) => setCustomVariant(e.target.value)}
                  placeholder="0 - 999"
                  className="ritual-input w-full text-center text-lg"
                  data-testid="custom-variant-input"
                  autoFocus
                />
                <p className="text-xs opacity-50 mt-2 text-center">
                  Try #42, #108, #888
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAdvanced(false)}
                  className="ritual-button flex-1 opacity-70"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCustomVariant}
                  className="ritual-button flex-1"
                  data-testid="apply-variant-button"
                >
                  Summon
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Canvas Stage */}
        {critterConfig && (
          <div className="mb-6 fade-in" style={{ animationDelay: "0.4s" }} data-testid="canvas-stage">
            <div 
              className="canvas-stage cursor-pointer"
              onClick={() => music.playChime()}
              onMouseEnter={() => music.applyHoverEffect(true)}
              onMouseLeave={() => music.applyHoverEffect(false)}
            >
              <GlowyCritter config={critterConfig} />
            </div>
            
            {/* Critter info - minimal and airy */}
            <div className="mt-8 text-center max-w-md mx-auto">
              <p className="text-sm opacity-40" style={{ fontWeight: 300, letterSpacing: '0.05em', lineHeight: '2' }}>
                <span className="capitalize">{critterConfig.traits.species}</span>
                <span className="mx-3">·</span>
                <span className="capitalize">{critterConfig.traits.pattern}</span>
                {critterConfig.traits.accessory !== "none" && (
                  <>
                    <span className="mx-3">·</span>
                    <span className="capitalize">{critterConfig.traits.accessory.replace("-", " ")}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Brand Taglines */}
        <div className="mt-20 space-y-6 text-center opacity-30 fade-in" style={{ animationDelay: "0.8s", fontWeight: 300, fontStyle: 'italic' }}>
          <p className="text-lg md:text-xl">Born from commits, care, and time</p>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-sm opacity-50" data-testid="footer">
          蔵 · Repository spirits · By{' '}
          <a 
            href="https://linktr.ee/eucapop" 
            target="_blank" 
            rel="noopener noreferrer"
            className="opacity-70 hover:opacity-100 transition-opacity duration-300 underline decoration-dotted"
          >
            Yuan
          </a>
        </footer>
      </div>

      {/* Music Controls */}
      <MusicControls
        isPlaying={music.isPlaying}
        isMuted={music.isMuted}
        volume={music.volume}
        onToggleMute={music.toggleMute}
        onVolumeChange={music.updateVolume}
      />
    </div>
  );
};

export default Landing;