# Kura API Documentation

## Base URL

- **Development**: `http://localhost:8001`
- **Production**: `https://your-domain.com`

All API endpoints are prefixed with `/api`.

## Authentication

Currently, no authentication is required for API access. Rate limiting is applied per IP address.

## Endpoints

### Health Check

**GET** `/api/`

Check if the API is running.

**Response:**
```json
{
  "message": "Kura API - Repository Spirit Visualization"
}
```

---

### Generate Spirit

**POST** `/api/generate`

Generate a unique spirit visualization for a GitHub repository.

**Request Body:**
```json
{
  "repo": "owner/repository",  // Required: GitHub repository in owner/name format
  "variant": 42                // Optional: Variant number 0-999, default: 0
}
```

**Example with full GitHub URL:**
```json
{
  "repo": "https://github.com/facebook/react",
  "variant": 123
}
```

**Response:**
```json
{
  "ok": true,
  "params": {
    "mood": "techno",
    "primary_keywords": ["react", "javascript"],
    "palette": {
      "bg": "#000000",
      "fg": "#61DAFB",
      "accents": ["#0099FF", "#00DDFF"]
    },
    "motion": {
      "tempo_hz": 0.35,
      "loop_seconds": 3,
      "style": "breathing-gradient"
    },
    "traits": {
      "species": "pebble",
      "accessory": "bow",
      "pattern": "freckles",
      "glowLevel": 2,
      "auraParticles": 8,
      "swayAmount": 0.15,
      "breathAmount": 0.12
    },
    "glyph": {
      "text": "REA",
      "weight": 600
    },
    "seed": "7f8a9b3c2d1e4f5a",
    "variant": 42
  },
  "seed": "7f8a9b3c2d1e4f5a",
  "cached": false,
  "embed": "![Spirit](https://your-domain/api/avatar/facebook/react?v=42)"
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `ok` | boolean | Whether the request was successful |
| `params` | object | Complete spirit parameters |
| `params.mood` | string | Spirit mood: calm, playful, techno, or poetic |
| `params.palette` | object | Color scheme with background, foreground, and accent colors |
| `params.traits.species` | string | Spirit shape: blob, sprout, pebble, or puff |
| `params.traits.pattern` | string | Overlay pattern: none, freckles, speckles, stripes, or rings |
| `params.traits.accessory` | string | Decoration: none, sprout-leaf, antenna, bow, or monocle |
| `params.traits.glowLevel` | integer | Glow intensity: 0 (dim), 1 (medium), 2 (bright) |
| `params.traits.auraParticles` | integer | Number of floating aura particles (3-12) |
| `seed` | string | Deterministic seed for reproduction |
| `cached` | boolean | Whether result was served from cache |
| `embed` | string | Markdown embed code |

**Error Responses:**

**404 Not Found** - Repository or documentation not found
```json
{
  "detail": "Project documentation not found"
}
```

**429 Too Many Requests** - Rate limit exceeded
```json
{
  "detail": "Rate limit exceeded. Please try again later."
}
```

**400 Bad Request** - Invalid repository format
```json
{
  "detail": "Invalid format. Use: owner/repo"
}
```

---

## Rate Limiting

- **Default Limit**: 100 requests per IP per hour
- **With API Key**: 1000 requests per hour (future feature)
- **LLM Calls**: 5 per IP per day (if AI analysis enabled)

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

---

## Caching

Results are cached for 24 hours by default. The `cached` field in the response indicates whether the result was served from cache.

Cache behavior:
- First request for a repo/variant combination → Generates fresh data
- Subsequent requests within 24h → Returns cached data
- Cache invalidation → Automatic after 24h TTL

---

## Examples

### Using cURL

```bash
# Basic request
curl -X POST http://localhost:8001/api/generate \
  -H "Content-Type: application/json" \
  -d '{"repo": "facebook/react", "variant": 0}'

# With full GitHub URL
curl -X POST http://localhost:8001/api/generate \
  -H "Content-Type: application/json" \
  -d '{"repo": "https://github.com/vuejs/vue", "variant": 42}'
```

### Using JavaScript/Axios

```javascript
import axios from 'axios';

const generateSpirit = async (repo, variant = 0) => {
  try {
    const response = await axios.post('http://localhost:8001/api/generate', {
      repo,
      variant
    });
    
    console.log('Spirit generated:', response.data);
    return response.data.params;
  } catch (error) {
    console.error('Error:', error.response?.data?.detail);
  }
};

// Usage
generateSpirit('facebook/react', 123);
```

### Using Python/Requests

```python
import requests

def generate_spirit(repo, variant=0):
    response = requests.post(
        'http://localhost:8001/api/generate',
        json={'repo': repo, 'variant': variant}
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"Spirit generated: {data['params']['traits']['species']}")
        return data['params']
    else:
        print(f"Error: {response.json()['detail']}")
        return None

# Usage
spirit = generate_spirit('vuejs/vue', 42)
```

---

## Framework Detection

Kura automatically detects popular frameworks and applies appropriate visual traits:

| Framework | Colors | Species | Pattern | Mood |
|-----------|--------|---------|---------|------|
| React | Cyan (#61DAFB) | Pebble | Freckles | Techno |
| Vue | Green (#42B883) | Puff | None | Calm |
| Angular | Red (#DD0031) | Pebble | Stripes | Techno |
| Django | Dark Green (#0C4B33) | Sprout | Rings | Calm |
| Svelte | Orange (#FF3E00) | Sprout | Speckles | Playful |
| Flask | Dark | Blob | Stripes | Calm |

For unrecognized frameworks, Kura uses heuristic analysis based on repository name and structure.

---

## Variant System

Each repository has **1000 unique variants** (0-999). Variants provide visual diversity while maintaining the core identity:

- **Species**: Changes 40% of the time based on variant
- **Pattern**: Varies across all 5 types
- **Accessory**: Rotates through 5 options
- **Colors**: Cycles through 7 palette variations
- **Animations**: Subtle tempo and intensity changes

Same repository + different variants = different looks, same "family feel"

---

## Best Practices

1. **Cache Results**: Store generated parameters client-side to avoid repeated requests
2. **Handle Errors**: Always check for 404 (not found) and 429 (rate limit) responses
3. **Use Variants**: Explore different variants to find the perfect spirit
4. **Respect Rate Limits**: Implement exponential backoff for retries

---

## Future Endpoints (Roadmap)

- `GET /api/avatar/:owner/:repo` - Render spirit image directly
- `GET /api/export/webp/:owner/:repo` - Export animated WebP
- `GET /api/export/sprite/:owner/:repo` - Export sprite sheet
- `POST /api/analyze` - Deep AI-powered analysis (requires API key)
- `GET /api/gallery` - Public gallery of generated spirits

---

## Support

For issues or questions:
- GitHub Issues: [github.com/yourusername/kura/issues](https://github.com/yourusername/kura/issues)
- Email: support@your-domain.com
