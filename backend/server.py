from fastapi import FastAPI, APIRouter, HTTPException, Request, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import hashlib
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Literal, Optional
import uuid
from datetime import datetime, timezone
import httpx
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
class Palette(BaseModel):
    bg: str
    fg: str
    accents: List[str]

class Motion(BaseModel):
    tempo_hz: float
    loop_seconds: int
    style: Literal["breathing-gradient", "grid-pulse", "type-dissolve", "glyph-orbit"]

class Traits(BaseModel):
    species: Literal["blob", "sprout", "pebble", "puff"]
    accessory: Literal["none", "sprout-leaf", "antenna", "bow", "monocle"]
    pattern: Literal["none", "freckles", "stripes", "speckles", "rings"]
    glowLevel: Literal[0, 1, 2]
    auraParticles: int
    swayAmount: float
    breathAmount: float

class Glyph(BaseModel):
    text: str
    weight: int

class AvatarParams(BaseModel):
    mood: Literal["calm", "playful", "techno", "poetic"]
    primary_keywords: List[str]
    palette: Palette
    motion: Motion
    traits: Traits
    glyph: Glyph
    seed: str = ""
    variant: int = 0

class GenerateRequest(BaseModel):
    repo: str
    variant: int = 0

class GenerateResponse(BaseModel):
    ok: bool
    params: AvatarParams
    seed: str
    cached: bool
    embed: str

# Cache and rate limiting
cache = {}
CACHE_TTL = 300  # 5 minutes (was 24 hours - too long!)
rate_limit = {}  # IP -> {count, reset_time}
RATE_LIMIT_WINDOW = 300  # 5 minutes
RATE_LIMIT_MAX = 20  # Increased from 10

def check_rate_limit(ip: str) -> bool:
    """Check if IP is within rate limit"""
    now = datetime.now(timezone.utc).timestamp()
    
    if ip not in rate_limit:
        rate_limit[ip] = {"count": 1, "reset_time": now + RATE_LIMIT_WINDOW}
        return True
    
    if now > rate_limit[ip]["reset_time"]:
        # Reset window
        rate_limit[ip] = {"count": 1, "reset_time": now + RATE_LIMIT_WINDOW}
        return True
    
    if rate_limit[ip]["count"] >= RATE_LIMIT_MAX:
        return False
    
    rate_limit[ip]["count"] += 1
    return True

# Helper functions
async def fetch_readme(owner: str, name: str) -> tuple[str, str]:
    """Fetch project documentation from GitHub repository"""
    logging.info(f"Fetching project data for {owner}/{name}")
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            api_url = f"https://api.github.com/repos/{owner}/{name}"
            api_response = await client.get(api_url)
            api_response.raise_for_status()
            repo_data = api_response.json()
            default_branch = repo_data.get("default_branch", "main")
            logging.info(f"Default branch for {owner}/{name}: {default_branch}")
        except Exception as e:
            logging.warning(f"Could not fetch default branch: {e}")
            default_branch = "main"
        
        branches = [default_branch, "main", "master", "HEAD"]
        readme_files = ["README.md", "README.rst", "README.txt", "README"]
        
        for branch in branches:
            for readme_file in readme_files:
                try:
                    url = f"https://raw.githubusercontent.com/{owner}/{name}/{branch}/{readme_file}"
                    response = await client.get(url)
                    response.raise_for_status()
                    readme = response.text
                    logging.info(f"Successfully fetched {readme_file} from {branch} branch")
                    return readme, name
                except httpx.HTTPStatusError:
                    continue
        
        raise HTTPException(status_code=404, detail="Project documentation not found")

async def fetch_dependency_files(owner: str, name: str, branch: str = "main") -> dict:
    """Fetch package.json, requirements.txt, Cargo.toml, go.mod for deep analysis"""
    files_to_check = {
        "package.json": None,
        "requirements.txt": None, 
        "Cargo.toml": None,
        "go.mod": None,
        "composer.json": None,
        "Gemfile": None
    }
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        for filename in files_to_check.keys():
            try:
                url = f"https://raw.githubusercontent.com/{owner}/{name}/{branch}/{filename}"
                response = await client.get(url)
                if response.status_code == 200:
                    files_to_check[filename] = response.text
                    logging.info(f"✓ Found {filename}")
            except:
                continue
    
    return files_to_check

def analyze_tech_stack(dependency_files: dict, readme: str) -> dict:
    """Deep analysis of tech stack and architecture"""
    import json
    import re
    
    analysis = {
        "framework": "unknown",
        "language": "unknown",
        "paradigm": "unknown",
        "async_patterns": False,
        "architecture": "unknown",
        "scale": "minimal",
        "philosophy": {}
    }
    
    # Parse package.json (JavaScript/TypeScript)
    if dependency_files.get("package.json"):
        try:
            pkg = json.loads(dependency_files["package.json"])
            deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
            
            analysis["language"] = "javascript"
            
            # Framework detection
            if "react" in deps or "react-dom" in deps:
                analysis["framework"] = "react"
                analysis["paradigm"] = "component-based"
                analysis["philosophy"]["essence"] = "discrete modular components"
            elif "vue" in deps or "@vue/cli" in deps:
                analysis["framework"] = "vue"
                analysis["paradigm"] = "reactive"
                analysis["philosophy"]["essence"] = "reactive data flow"
            elif "@angular/core" in deps:
                analysis["framework"] = "angular"
                analysis["paradigm"] = "structured"
                analysis["philosophy"]["essence"] = "structured dependency injection"
            elif "svelte" in deps:
                analysis["framework"] = "svelte"
                analysis["paradigm"] = "compiled"
                analysis["philosophy"]["essence"] = "compile-time magic"
            elif "next" in deps or "gatsby" in deps:
                analysis["framework"] = "meta-framework"
                analysis["paradigm"] = "full-stack"
            
            # Async detection
            if "rxjs" in deps or "redux-saga" in deps or "redux-observable" in deps:
                analysis["async_patterns"] = True
                analysis["paradigm"] = "reactive-streams"
            
            # Architecture patterns
            if "express" in deps or "koa" in deps or "fastify" in deps:
                analysis["architecture"] = "server"
            elif "electron" in deps:
                analysis["architecture"] = "desktop"
            elif "three" in deps or "pixi.js" in deps:
                analysis["architecture"] = "graphics"
            
            # Scale
            dep_count = len(deps)
            if dep_count > 100:
                analysis["scale"] = "enterprise"
            elif dep_count > 30:
                analysis["scale"] = "medium"
            else:
                analysis["scale"] = "minimal"
                
        except Exception as e:
            logging.warning(f"Failed to parse package.json: {e}")
    
    # Parse requirements.txt (Python)
    elif dependency_files.get("requirements.txt"):
        analysis["language"] = "python"
        reqs = dependency_files["requirements.txt"].lower()
        
        if "django" in reqs:
            analysis["framework"] = "django"
            analysis["paradigm"] = "mvc"
            analysis["philosophy"]["essence"] = "batteries-included convention"
        elif "flask" in reqs:
            analysis["framework"] = "flask"
            analysis["paradigm"] = "micro"
            analysis["philosophy"]["essence"] = "minimalist flexibility"
        elif "fastapi" in reqs:
            analysis["framework"] = "fastapi"
            analysis["paradigm"] = "async"
            analysis["philosophy"]["essence"] = "modern async performance"
        elif "tensorflow" in reqs or "torch" in reqs or "pytorch" in reqs:
            analysis["framework"] = "ml"
            analysis["paradigm"] = "neural"
            analysis["philosophy"]["essence"] = "neural network learning"
        elif "numpy" in reqs or "pandas" in reqs:
            analysis["framework"] = "data-science"
            analysis["paradigm"] = "analytical"
        
        if "asyncio" in reqs or "aiohttp" in reqs:
            analysis["async_patterns"] = True
    
    # Parse Cargo.toml (Rust)
    elif dependency_files.get("Cargo.toml"):
        analysis["language"] = "rust"
        analysis["paradigm"] = "systems"
        analysis["philosophy"]["essence"] = "memory-safe performance"
        
        cargo = dependency_files["Cargo.toml"]
        if "tokio" in cargo or "async-std" in cargo:
            analysis["async_patterns"] = True
        if "wasm" in cargo:
            analysis["architecture"] = "wasm"
    
    # Parse go.mod (Go)
    elif dependency_files.get("go.mod"):
        analysis["language"] = "go"
        analysis["paradigm"] = "concurrent"
        analysis["philosophy"]["essence"] = "goroutine concurrency"
        analysis["async_patterns"] = True  # Go is inherently concurrent
    
    # README analysis for architecture patterns
    readme_lower = readme.lower()
    
    if "microservice" in readme_lower:
        analysis["architecture"] = "microservices"
        analysis["philosophy"]["distributed"] = True
    elif "monorepo" in readme_lower:
        analysis["architecture"] = "monorepo"
    elif "serverless" in readme_lower:
        analysis["architecture"] = "serverless"
    
    # Data flow patterns
    if "unidirectional" in readme_lower or "one-way" in readme_lower or "flux" in readme_lower:
        analysis["philosophy"]["data_flow"] = "unidirectional"
    elif "two-way binding" in readme_lower or "bidirectional" in readme_lower:
        analysis["philosophy"]["data_flow"] = "bidirectional"
    
    return analysis

def map_tech_to_visual_traits(tech_analysis: dict, repo_name: str, variant: int) -> dict:
    """Map technical analysis to meaningful visual characteristics"""
    
    framework = tech_analysis.get("framework", "unknown")
    paradigm = tech_analysis.get("paradigm", "unknown")
    language = tech_analysis.get("language", "unknown")
    async_patterns = tech_analysis.get("async_patterns", False)
    architecture = tech_analysis.get("architecture", "unknown")
    scale = tech_analysis.get("scale", "minimal")
    
    # Create variant seed for randomization
    seed_str = f"{repo_name}#{variant}"
    seed_int = int(hashlib.md5(seed_str.encode()).hexdigest(), 16)
    
    # FALLBACK: Detect framework from repo name if analysis didn't find it
    repo_lower = repo_name.lower()
    if framework == "unknown":
        if "react" in repo_lower:
            framework = "react"
        elif "vue" in repo_lower:
            framework = "vue"
        elif "angular" in repo_lower:
            framework = "angular"
        elif "django" in repo_lower:
            framework = "django"
        elif "flask" in repo_lower:
            framework = "flask"
        elif "svelte" in repo_lower:
            framework = "svelte"
    
    traits = {
        "species": "blob",
        "accessory": "none",
        "pattern": "none",
        "mood": "calm",
        "colors": None,
        "motion_style": "breathing",
        "philosophy_note": ""
    }
    
    # Base traits from framework (starting point)
    base_species = "blob"
    base_pattern = "none"
    base_mood = "calm"
    
    # FRAMEWORK → SPECIES & VISUAL LANGUAGE (base preferences)
    if framework == "react":
        base_species = "pebble"  # Geometric, component-like
        base_pattern = "freckles"  # Discrete nodes
        base_mood = "techno"
        traits["colors"] = ["#61DAFB", "#20232A"]  # React blue
        traits["philosophy_note"] = "Component-based architecture → modular geometric forms. Each freckle represents a reusable component."
    
    elif framework == "vue":
        base_species = "puff"  # Soft, reactive
        base_pattern = "none"  # Clean, responsive
        base_mood = "calm"
        traits["colors"] = ["#42B883", "#35495E"]  # Vue green
        traits["philosophy_note"] = "Reactive data binding → flowing organic shape. Soft edges reflect Vue's approachability."
    
    elif framework == "angular":
        base_species = "pebble"  # Structured
        base_pattern = "stripes"  # Organized layers
        base_mood = "techno"
        traits["colors"] = ["#DD0031", "#C3002F"]  # Angular red
        traits["philosophy_note"] = "Structured framework → geometric precision. Stripes represent layered architecture."
    
    elif framework == "svelte":
        base_species = "sprout"  # Growing, emerging
        base_pattern = "none"  # Minimalist
        base_mood = "playful"
        traits["colors"] = ["#FF3E00", "#F96743"]  # Svelte orange
        traits["philosophy_note"] = "Compile-time magic → sprouting form. Represents code that 'grows' into optimized output."
    
    elif framework == "django":
        base_species = "pebble"  # Solid, reliable
        base_pattern = "stripes"  # MVC layers
        base_mood = "calm"
        traits["colors"] = ["#092E20", "#0C4B33"]  # Django green
        traits["philosophy_note"] = "Batteries-included MVC → solid layered structure. Stripes show separation of concerns."
    
    elif framework == "flask":
        base_species = "sprout"  # Minimal, growing
        base_pattern = "none"  # Micro-framework simplicity
        base_mood = "calm"
        traits["colors"] = ["#000000", "#FFFFFF"]  # Minimalist
        traits["philosophy_note"] = "Micro-framework → small sprouting form. Grows as you add extensions."
    
    elif framework == "ml":
        base_species = "blob"  # Neural, organic
        base_pattern = "rings"  # Network layers
        base_mood = "techno"
        traits["colors"] = ["#FF6F00", "#FFA726"]  # TensorFlow orange
        traits["accessory"] = "antenna"  # Sensing/learning
        traits["philosophy_note"] = "Neural networks → concentric layers. Antenna represents continuous learning."
    
    # VARIANT-BASED RANDOMIZATION (70% base traits, 30% random variation)
    species_options = ["blob", "sprout", "pebble", "puff"]
    pattern_options = ["none", "freckles", "stripes", "speckles", "rings"]
    accessory_options = ["none", "sprout-leaf", "antenna", "bow", "monocle"]
    mood_options = ["calm", "playful", "chaotic", "techno"]
    
    # Use seed to determine if we deviate from base traits
    if (seed_int % 10) < 7:  # 70% chance: use base traits
        traits["species"] = base_species
        traits["pattern"] = base_pattern
        traits["mood"] = base_mood
    else:  # 30% chance: random variation
        traits["species"] = species_options[seed_int % len(species_options)]
        traits["pattern"] = pattern_options[(seed_int // 10) % len(pattern_options)]
        traits["mood"] = mood_options[(seed_int // 100) % len(mood_options)]
    
    # Accessory is always somewhat random
    traits["accessory"] = accessory_options[(seed_int // 1000) % len(accessory_options)]
    
    # PARADIGM → MOTION & ACCESSORIES
    if paradigm == "reactive" or async_patterns:
        traits["motion_style"] = "flowing"
        traits["pattern"] = "rings" if traits["pattern"] == "none" else traits["pattern"]
        traits["philosophy_note"] += " Async patterns create flowing, responsive motion."
    
    if paradigm == "concurrent":
        traits["accessory"] = "antenna"
        traits["pattern"] = "speckles"  # Multiple goroutines
        traits["philosophy_note"] = "Concurrent goroutines → multiple signal points (antenna + speckles)."
    
    # LANGUAGE → BASE CHARACTERISTICS
    if language == "rust":
        traits["species"] = "pebble"  # Memory-safe, solid
        traits["colors"] = ["#CE422B", "#5C2D30"]  # Rust orange
        traits["philosophy_note"] = "Memory-safe systems language → solid, dependable pebble form."
    
    elif language == "go":
        traits["species"] = "sprout"  # Fast, growing
        traits["colors"] = ["#00ADD8", "#5DC9E2"]  # Go cyan
        traits["accessory"] = "antenna"
    
    # SCALE → SIZE INFLUENCE (affects rendering)
    if scale == "enterprise":
        traits["glow_level"] = 2
        traits["aura_particles"] = 10
    elif scale == "medium":
        traits["glow_level"] = 1
        traits["aura_particles"] = 6
    else:
        traits["glow_level"] = 0
        traits["aura_particles"] = 4
    
    # ARCHITECTURE → PATTERN
    if architecture == "microservices":
        traits["pattern"] = "speckles"  # Distributed
        traits["philosophy_note"] += " Microservices architecture → distributed speckles."
    elif architecture == "graphics":
        traits["glow_level"] = 2
        traits["pattern"] = "rings"
    
    return traits

def get_sophisticated_params(readme: str, repo_name: str, variant: int, tech_analysis: dict) -> AvatarParams:
    """Generate params based on deep tech analysis"""
    seed_str = f"{repo_name}#{variant}"
    seed = hashlib.md5(seed_str.encode()).hexdigest()
    seed_int = int(seed[:8], 16) % 100
    
    # Get meaningful traits from tech analysis
    visual_traits = map_tech_to_visual_traits(tech_analysis, repo_name, variant)
    
    # For species and pattern, blend framework identity with variant variation
    # Framework gives a "preferred" trait, but variant can override for variety
    all_species = ["blob", "sprout", "pebble", "puff"]
    all_patterns = ["none", "freckles", "speckles", "stripes", "rings"]
    all_accessories = ["none", "sprout-leaf", "antenna", "bow", "monocle"]
    
    # Use framework suggestion 60% of the time, variant-based 40% of the time
    use_framework = (variant % 10) < 6
    
    if use_framework and visual_traits.get("species"):
        species = visual_traits["species"]
    else:
        species = all_species[variant % 4]
    
    if use_framework and visual_traits.get("pattern"):
        pattern = visual_traits["pattern"]
    else:
        pattern = all_patterns[variant % 5]
    
    # Accessory - more random variation
    if visual_traits.get("accessory") and visual_traits["accessory"] != "none" and (variant % 5) < 2:
        accessory = visual_traits["accessory"]
    else:
        accessory = all_accessories[variant % 5]
    
    # Mood stays consistent with framework
    mood = visual_traits.get("mood", "calm")
    
    # Colors: Use framework colors if provided, otherwise variant-based
    if visual_traits.get("colors") and (variant % 3) < 2:
        custom_colors = visual_traits["colors"]
        palette = Palette(
            bg="#000000",
            fg=custom_colors[0],
            accents=[custom_colors[0], custom_colors[1] if len(custom_colors) > 1 else custom_colors[0]]
        )
    else:
        # Use variant-based palette for variety
        palettes = [
            Palette(bg="#000000", fg="#00FFFF", accents=["#0099FF", "#00DDFF"]),
            Palette(bg="#0A0A0F", fg="#E0C4FF", accents=["#9B72AA", "#C9A0DC"]),
            Palette(bg="#050510", fg="#B8E0D2", accents=["#6A8EAE", "#A8D8EA"]),
            Palette(bg="#0D0D15", fg="#FFE5EC", accents=["#FFA8B5", "#D4AFCD"]),
            Palette(bg="#0A0813", fg="#FFE66D", accents=["#FFCC44", "#FFE88A"]),
            Palette(bg="#0B0820", fg="#F0E6FF", accents=["#B08BBB", "#E0BBE4"]),
            Palette(bg="#05100A", fg="#AAFFCC", accents=["#66DDAA", "#88FFCC"]),
        ]
        palette = palettes[variant % len(palettes)]
    
    glowLevel = (seed_int + variant) % 3
    auraParticles = 3 + (variant % 10)
    
    swayAmount = 0.08 + ((seed_int + variant) % 25) / 100
    breathAmount = 0.05 + ((seed_int + variant) % 20) / 100
    
    glyph_text = repo_name[:3].upper() if len(repo_name) >= 3 else repo_name.upper()
    
    return AvatarParams(
        mood=mood,
        primary_keywords=[tech_analysis.get("framework", "unknown"), tech_analysis.get("language", "unknown")],
        palette=palette,
        motion=Motion(
            tempo_hz=0.25 + ((seed_int + variant) % 40) / 100,
            loop_seconds=3,
            style="breathing-gradient"
        ),
        traits=Traits(
            species=species,
            accessory=accessory,
            pattern=pattern,
            glowLevel=glowLevel,
            auraParticles=auraParticles,
            swayAmount=swayAmount,
            breathAmount=breathAmount
        ),
        glyph=Glyph(text=glyph_text, weight=600),
        seed=seed,
        variant=variant
    )

def get_heuristic_params(readme: str, repo_name: str, variant: int) -> AvatarParams:
    """Fallback heuristic when tech analysis fails"""
    seed_str = f"{repo_name}#{variant}"
    seed = hashlib.md5(seed_str.encode()).hexdigest()
    seed_int = int(seed[:8], 16) % 100
    
    lower = readme.lower()
    
    # Simple mood detection
    if any(word in lower for word in ["finance", "market", "trading"]):
        mood = "techno"
    elif any(word in lower for word in ["game", "animation", "play"]):
        mood = "playful"
    elif any(word in lower for word in ["art", "poem", "story", "design"]):
        mood = "poetic"
    else:
        mood = "calm"
    
    # Rotate species
    all_species = ["blob", "sprout", "pebble", "puff"]
    species = all_species[variant % 4]
    
    # Cycle patterns
    patterns = ["none", "freckles", "speckles", "stripes", "rings"]
    pattern = patterns[variant % 5]
    
    # Simple accessory
    accessories = ["none", "sprout-leaf", "antenna", "bow"]
    accessory = accessories[variant % 4]
    
    # Use variant for palette
    palettes = [
        Palette(bg="#000000", fg="#00FFFF", accents=["#0099FF", "#00DDFF"]),
        Palette(bg="#0A0A0F", fg="#E0C4FF", accents=["#9B72AA", "#C9A0DC"]),
        Palette(bg="#050510", fg="#B8E0D2", accents=["#6A8EAE", "#A8D8EA"]),
        Palette(bg="#0D0D15", fg="#FFE5EC", accents=["#FFA8B5", "#D4AFCD"]),
    ]
    palette = palettes[variant % len(palettes)]
    
    glowLevel = (variant + seed_int) % 3
    auraParticles = 3 + (variant % 10)
    swayAmount = 0.08 + ((seed_int + variant) % 25) / 100
    breathAmount = 0.05 + ((seed_int + variant) % 20) / 100
    
    glyph_text = repo_name[:3].upper() if len(repo_name) >= 3 else repo_name.upper()
    
    return AvatarParams(
        mood=mood,
        primary_keywords=["heuristic", repo_name[:5]],
        palette=palette,
        motion=Motion(
            tempo_hz=0.25 + ((seed_int + variant) % 40) / 100,
            loop_seconds=3,
            style="breathing-gradient"
        ),
        traits=Traits(
            species=species,
            accessory=accessory,
            pattern=pattern,
            glowLevel=glowLevel,
            auraParticles=auraParticles,
            swayAmount=swayAmount,
            breathAmount=breathAmount
        ),
        glyph=Glyph(text=glyph_text, weight=600),
        seed=seed,
        variant=variant
    )

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Kura API - Repository Spirit Visualization"}

@api_router.post("/generate", response_model=GenerateResponse)
async def generate_avatar(request: GenerateRequest, req: Request):
    """Generate glowing spirit from repository"""
    try:
        # Get IP for rate limiting
        ip = req.client.host if req.client else "unknown"
        
        # Check rate limit
        if not check_rate_limit(ip):
            raise HTTPException(
                status_code=429, 
                detail="Rate limit exceeded. Please wait a moment before rolling again."
            )
        
        repo = request.repo.strip()
        
        # Extract owner/name from URL if provided
        if "github.com" in repo:
            import re
            match = re.search(r'github\.com/([^/]+/[^/]+)', repo)
            if match:
                repo = match.group(1).replace('.git', '')
        
        if "/" not in repo:
            raise HTTPException(status_code=400, detail="Use format: owner/name")
        
        owner, name = repo.split("/", 1)
        variant = max(0, min(999, request.variant))
        
        # Get base URL from request for embed generation
        # This ensures embeds work regardless of deployment environment
        origin = req.headers.get("origin") or req.headers.get("referer", "")
        if origin:
            # Extract base URL from origin/referer
            base_url = origin.rstrip("/")
        else:
            # Fallback to constructing from host header
            host = req.headers.get("host", "localhost")
            scheme = "https" if "emergentagent.com" in host or "preview" in host else "http"
            base_url = f"{scheme}://{host}"
        
        # Check cache
        cache_key = f"{owner}/{name}:{variant}"
        if cache_key in cache:
            cached_data = cache[cache_key]
            if (datetime.now(timezone.utc) - cached_data['timestamp']).seconds < CACHE_TTL:
                return GenerateResponse(
                    ok=True,
                    params=cached_data['params'],
                    seed=cached_data['params'].seed,
                    cached=True,
                    embed=f"![Glowy Critter]({base_url}/api/avatar/{repo}?v={variant})"
                )
        
        # Fetch project data
        readme, repo_name = await fetch_readme(owner, name)
        
        # Deep analysis: Fetch dependency files
        default_branch = "main"
        try:
            api_url = f"https://api.github.com/repos/{owner}/{name}"
            async with httpx.AsyncClient(timeout=10.0) as client:
                api_response = await client.get(api_url)
                if api_response.status_code == 200:
                    repo_data = api_response.json()
                    default_branch = repo_data.get("default_branch", "main")
        except:
            pass
        
        dependency_files = await fetch_dependency_files(owner, name, default_branch)
        tech_analysis = analyze_tech_stack(dependency_files, readme)
        
        logging.info(f"Tech analysis for {repo}: {tech_analysis}")
        
        # Generate params using sophisticated analysis
        try:
            params = get_sophisticated_params(readme, repo_name, variant, tech_analysis)
        except Exception as e:
            logging.warning(f"Sophisticated analysis failed, using heuristic: {e}")
            params = get_heuristic_params(readme, repo_name, variant)
        
        # Cache it
        cache[cache_key] = {
            'params': params,
            'timestamp': datetime.now(timezone.utc)
        }
        
        return GenerateResponse(
            ok=True,
            params=params,
            seed=params.seed,
            cached=False,
            embed=f"![Glowy Critter]({base_url}/api/avatar/{repo}?v={variant})"
        )
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Generate error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()