# Changelog

All notable changes to Kura will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-20

### Added
- Initial public release of Kura
- GitHub repository visualization with animated spirits
- Procedural critter generation based on repository analysis
- Multi-sensory experience with adaptive ambient music
- Framework detection (React, Vue, Django, Angular, etc.)
- 1000 unique variants per repository
- Real-time Canvas API rendering at 60fps
- Tone.js-powered music engine with trait-based audio mapping
- Deterministic seed-based generation for reproducibility
- In-memory caching system (5-minute TTL)
- Rate limiting (20 requests per 5 minutes per IP)
- MongoDB integration for cache storage
- Responsive design for mobile and desktop
- Japanese-inspired zen aesthetic
- Comprehensive API documentation
- Architecture documentation
- Test suite for backend API

### Features

#### Visual Generation
- Four species types: blob, sprout, pebble, puff
- Five pattern overlays: freckles, rings, speckles, stripes, none
- Five accessories: bow, antenna, sprout-leaf, monocle, none
- Three glow levels with dynamic lighting
- Aura particle systems (3-12 particles)
- Breathing and swaying animations
- Framework-specific color palettes

#### Audio System
- Three-layer synthesis (bass, mid, high frequencies)
- Trait-based audio mapping:
  - Species → Base frequency (60-90 Hz)
  - Mood → Chord progression and harmony
  - Colors → Filter frequency modulation
  - Glow level → Reverb depth
- Smooth fade-in (3.5s) and crossfades (2.5s)
- Interactive audio effects (click for chime, hover for filter shift)
- Volume control and mute functionality
- Visual feedback with pulse animations

#### Backend
- FastAPI REST API with async support
- GitHub API integration for repository analysis
- Intelligent framework detection from package.json
- Deterministic trait generation using SHA-256 seeding
- Rate limiting to prevent abuse
- Response caching for performance
- Comprehensive error handling
- Pydantic models for type safety

### Technical Stack
- **Frontend**: React 18, Canvas API, Tone.js, Tailwind CSS, Axios
- **Backend**: FastAPI, Python 3.11, Motor (async MongoDB), httpx
- **Database**: MongoDB for caching and rate limiting
- **Infrastructure**: Nginx, Supervisor, Docker-ready

### Performance
- First contentful paint: <1.5s
- Frontend bundle size: 170KB (gzipped)
- API response time: <200ms (cached), <2s (uncached)
- 60fps canvas animations
- Optimized for mobile and desktop

### Documentation
- Comprehensive README with getting started guide
- API documentation with examples
- Architecture documentation
- Contributing guidelines
- Code style guides (ESLint, Prettier)
- Test suite documentation

### Accessibility
- Keyboard navigation support
- ARIA labels for interactive elements
- Semantic HTML structure
- Screen reader compatible

## [Unreleased]

### Planned Features
- [ ] Comprehensive frontend test suite (Jest, React Testing Library)
- [ ] WebGL 3D renderer option
- [ ] Animated GIF/WebP export functionality
- [ ] Gallery of popular critters
- [ ] Social sharing with Open Graph images
- [ ] VS Code extension
- [ ] GitHub Actions CI/CD pipeline
- [ ] Performance monitoring with analytics
- [ ] Progressive Web App (PWA) capabilities
- [ ] Server-side rendering (SSR)
- [ ] TypeScript migration
- [ ] Redis for distributed caching
- [ ] GraphQL API alternative
- [ ] Webhook support for automated updates
- [ ] Custom color palette editor
- [ ] Advanced audio controls (EQ, effects)
- [ ] Critter evolution based on repo activity
- [ ] Community voting system
- [ ] API rate limit tiers
- [ ] Documentation site with interactive demos

### Known Issues
- Service worker caching may cause stale content on updates (workaround: hard refresh)
- Some older browsers may not support Web Audio API
- Rate limiting is in-memory (resets on server restart)

### Security
- Input validation for all user-provided data
- Rate limiting to prevent abuse
- CORS policy configured for production
- No sensitive data stored in frontend
- Environment variables for all secrets

---

## Release Notes

### Version 1.0.0 - "Tsukumogami"

This is the initial public release of Kura, a unique GitHub repository visualization tool that treats code as living entities. Inspired by Japanese tsukumogami folklore—the belief that objects gain souls after 100 years—Kura instantly awakens the spirit of any repository.

**Highlights:**
- 🎨 Procedural art generation with 1000 variants per repo
- 🎵 Adaptive ambient music that responds to repository traits
- ⚡ Lightning-fast performance with intelligent caching
- 🌙 Zen-inspired aesthetic with smooth animations
- 🆓 Completely free with no API keys required
- 📱 Fully responsive on all devices

**Try it now:** Paste any GitHub URL and watch your code come alive!

---

## Version History

- **1.0.0** (2025-11-20): Initial public release

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for information on how to contribute to this project.

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.
