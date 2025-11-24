# 🌟 Kura (蔵) - Repository Spirit Visualization

<div align="center">

**Every repository has a soul**

[✨ **Live Demo**](https://kura-kura-production-78d0.up.railway.app) • [📚 **Documentation**](./docs/api.md) • [🏗️ **Architecture**](./ARCHITECTURE.md) • [📝 **Changelog**](./CHANGELOG.md)

![Hero](https://via.placeholder.com/1200x600/1a1a2e/61dafb?text=Kura+Repository+Spirits)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python_3.11-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?logo=mongodb)](https://www.mongodb.com/)

</div>

---

## 🎯 Project Overview

**Kura** (蔵, Japanese for "storehouse") is a unique full-stack web application that visualizes GitHub repositories as living, animated spirits. Inspired by the Japanese concept of **tsukumogami** (付喪神) — objects that gain souls after 100 years of use — Kura treats code repositories as entities with personality and aesthetic identity.

### What Makes It Unique

- **Multi-sensory Experience**: The only tool combining procedural visuals + adaptive ambient music
- **Philosophical Depth**: Rooted in Japanese animism and aesthetic principles (wabi-sabi, ma, yūgen)
- **1,000 Variants**: Each repository has deterministic but diverse visual representations
- **Zero Cost**: Completely free with no API keys or authentication required
- **Production Ready**: Deployed, tested, and optimized for real-world use

### Key Technical Achievements

✅ **Real-time Canvas Rendering** at 60fps with breathing/swaying animations  
✅ **Web Audio Synthesis** with Tone.js (3-layer melodic soundscapes)  
✅ **Deterministic Procedural Generation** using cryptographic seeding  
✅ **Framework-Aware Analysis** (React, Vue, Django detection)  
✅ **Async Backend** with FastAPI + Motor (MongoDB)  
✅ **Performance Optimized** (<1.5s first paint, 170KB bundle)  

---

## 🚀 Quick Start

### Try It Live
Visit **[https://github-aura.preview.emergentagent.com](https://github-aura.preview.emergentagent.com)**

1. Paste any GitHub URL (e.g., `facebook/react`)
2. Click 🎲 to generate the spirit
3. Use ⚡ to explore different variants (0-999)
4. Enjoy the visual + audio experience!

### Local Development

**Prerequisites:**
- Node.js 18+ and Yarn
- Python 3.11+
- MongoDB (local or Atlas)

**Backend Setup:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn server:app --reload --port 8001
```

**Frontend Setup:**
```bash
cd frontend
yarn install
cp .env.example .env
yarn start
```

**Visit:** `http://localhost:3000`

---

## 🏗️ Architecture

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18, Canvas API, Tone.js | UI, rendering, audio synthesis |
| **Backend** | FastAPI, Python 3.11 | REST API, repository analysis |
| **Database** | MongoDB (Motor) | Caching, rate limiting |
| **Styling** | Tailwind CSS | Responsive, zen-inspired design |
| **Infrastructure** | Nginx, Supervisor, Docker | Production deployment |

### System Flow

```
User Input → Frontend Validation → Backend API → GitHub Analysis
                                       ↓
    Cache Check ← MongoDB         Framework Detection
         ↓                              ↓
    [Hit] Return cached          Trait Generation
         ↓                              ↓
    [Miss] Generate traits         Deterministic Seeding
                                       ↓
                                 Return JSON Response
                                       ↓
    Frontend Renders Canvas (60fps) + Starts Music (Tone.js)
```

**Detailed Architecture:** See [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## ✨ Features

### Visual Generation
- **4 Species**: Blob, Sprout, Pebble, Puff (each with distinct shapes)
- **5 Patterns**: Freckles, Rings, Speckles, Stripes, None
- **5 Accessories**: Bow, Antenna, Sprout-leaf, Monocle, None
- **3 Glow Levels**: Dim, Medium, Bright (with dynamic lighting)
- **Aura Particles**: 3-12 floating particles with physics
- **Animations**: Breathing (scale), swaying (rotation), color pulsing

### Audio System
- **3-Layer Synthesis**: Bass drone (60-90 Hz), mid pad (200-400 Hz), high shimmer (800-1600 Hz)
- **Trait-Based Mapping**:
  - Species → Base frequency
  - Mood → Chord progression (calm, playful, techno, poetic)
  - Colors → Filter frequency modulation
  - Glow level → Reverb depth
- **Smooth Transitions**: 3.5s fade-in, 2.5s crossfades
- **Interactive Audio**: Click for chime, hover for filter shift
- **Visual Feedback**: Pulse animation when playing

### Framework Detection
Automatically recognizes popular frameworks and applies appropriate traits:

| Framework | Colors | Species | Mood | Pattern |
|-----------|--------|---------|------|---------|
| React | Cyan (#61DAFB) | Pebble | Techno | Freckles |
| Vue | Green (#42B883) | Puff | Calm | None |
| Angular | Red (#DD0031) | Pebble | Techno | Stripes |
| Django | Dark Green (#0C4B33) | Sprout | Calm | Rings |
| Svelte | Orange (#FF3E00) | Sprout | Playful | Speckles |

---

## 💻 Code Highlights

### Deterministic Generation (Backend)
```python
import hashlib
import random

def generate_traits(repo: str, variant: int) -> dict:
    """
    Generate deterministic traits using cryptographic seeding.
    Same repo + variant = same result every time.
    """
    seed = hashlib.sha256(f"{repo}:{variant}".encode()).hexdigest()
    rng = random.Random(seed)
    
    species = rng.choice(["blob", "sprout", "pebble", "puff"])
    pattern = rng.choice(["none", "freckles", "rings", "speckles", "stripes"])
    
    return {"species": species, "pattern": pattern, "seed": seed}
```

### Canvas Rendering (Frontend)
```javascript
// 60fps animation loop with requestAnimationFrame
function drawCritter(ctx, config, time) {
  const breathe = Math.sin(time * config.breathAmount) * 0.1;
  const sway = Math.sin(time * config.swayAmount) * 0.05;
  
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.scale(1 + breathe, 1 + breathe);
  ctx.rotate(sway);
  
  // Draw body with glow
  drawBodyShape(ctx, config.species, config.palette.fg);
  drawPattern(ctx, config.pattern, config.palette.accents);
  drawFace(ctx, config.mood);
  
  ctx.restore();
  
  // Aura particles
  drawParticles(ctx, config.auraParticles, time);
  
  requestAnimationFrame(() => drawCritter(ctx, config, time + 0.016));
}
```

### Music Synthesis (Tone.js)
```javascript
// Trait-based audio mapping
const audioParams = mapTraitsToAudio(critterTraits);

const bass = new Tone.Synth({
  oscillator: { type: 'sine' },
  envelope: { attack: 2, release: 4 }
}).toDestination();

bass.triggerAttackRelease(audioParams.rootNote, '8n');

// Apply reverb based on glow level
const reverb = new Tone.Reverb(audioParams.reverbDepth);
bass.connect(reverb);
```

---

## 📊 Performance

| Metric | Value |
|--------|-------|
| First Contentful Paint | <1.5s |
| Frontend Bundle (gzipped) | 170KB |
| API Response Time (cached) | <200ms |
| API Response Time (uncached) | <2s |
| Canvas Frame Rate | 60fps |
| Lighthouse Score | 95+ |

### Optimizations
- **Code Splitting**: React lazy loading for components
- **Memoization**: `useMemo`/`useCallback` for expensive operations
- **Caching**: 5-minute TTL for API responses
- **Async I/O**: Non-blocking GitHub API calls
- **Connection Pooling**: MongoDB connection reuse
- **Minification**: Webpack production builds

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v --cov=.
```

**Test Coverage:**
- ✅ API endpoint validation
- ✅ Framework detection accuracy
- ✅ Caching behavior
- ✅ Rate limiting enforcement
- ✅ Error handling
- ✅ Trait generation determinism

### Frontend Tests (Planned)
```bash
cd frontend
yarn test
```

**Planned Coverage:**
- Canvas rendering
- Music engine lifecycle
- User interactions
- Responsive behavior

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, data flow, component details |
| [docs/api.md](./docs/api.md) | REST API endpoints, request/response schemas |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Contribution guidelines, code style |
| [CHANGELOG.md](./CHANGELOG.md) | Version history, release notes |
| [LICENSE](./LICENSE) | MIT License |

---

## 🎨 Design Philosophy

Kura embodies Japanese aesthetic principles:

- **物の哀れ (Mono no aware)**: Beauty in transience (breathing animations, fleeting particles)
- **侘寂 (Wabi-sabi)**: Imperfection and impermanence (organic shapes, natural variations)
- **間 (Ma)**: Power of negative space (generous spacing, minimal UI)
- **幽玄 (Yūgen)**: Profound grace and subtle depth (gradient backgrounds, soft glows)

---

## 🚧 Roadmap

### Planned Features
- [ ] **WebGL 3D Renderer**: Volumetric spirits with post-processing
- [ ] **Export Functionality**: Download as WebP/GIF animations
- [ ] **Gallery System**: Browse and vote on popular critters
- [ ] **VS Code Extension**: In-editor spirit display
- [ ] **Evolution System**: Critters change based on repo activity
- [ ] **Social Sharing**: OG images for Twitter/Discord
- [ ] **Custom Palettes**: User-defined color schemes
- [ ] **API Rate Limit Tiers**: Pro accounts with higher limits

### Technical Debt
- [ ] Migrate to TypeScript for type safety
- [ ] Add comprehensive frontend test suite
- [ ] Implement Redis for distributed caching
- [ ] Set up GitHub Actions CI/CD
- [ ] Performance monitoring with analytics

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for:
- Code style guidelines (ESLint, Prettier)
- Pull request process
- Development setup
- Testing requirements

### Quick Contribution Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** - see [LICENSE](./LICENSE) for details.

---

## 🙏 Acknowledgments

### Inspiration
- **付喪神 (Tsukumogami)**: Japanese belief that objects gain souls after 100 years
- **侘寂 (Wabi-sabi)**: Aesthetic of imperfection and transience
- Japanese traditional design principles

### Technology
- [React](https://reactjs.org/) - UI library
- [FastAPI](https://fastapi.tiangolo.com/) - Backend framework
- [Tone.js](https://tonejs.github.io/) - Web Audio synthesis
- [MongoDB](https://www.mongodb.com/) - Database
- [Tailwind CSS](https://tailwindcss.com/) - Styling

### Community
- Framework color palettes from official brand guidelines
- Canvas animation techniques from creative coding community
- Japanese typography by Google Fonts (Noto Sans/Serif JP)

---

## 📬 Contact

**Creator**: Yuan  
**Portfolio**: [Linktree](https://linktr.ee/yuan)  
**Live Demo**: [https://github-aura.preview.emergentagent.com](https://github-aura.preview.emergentagent.com)

---

<div align="center">

**Made with care** • Treating code as something alive and worthy of ritual

蔵 (kura) — where spirits dwell

[⬆ Back to Top](#-kura-蔵---repository-spirit-visualization)

</div>
