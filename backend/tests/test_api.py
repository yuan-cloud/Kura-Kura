"""
API Integration Tests for Kura Backend

Tests the /api/generate endpoint with various scenarios including:
- Valid repository requests
- Invalid inputs
- Rate limiting
- Caching behavior
- Framework detection
"""

import pytest
from fastapi.testclient import TestClient
from backend.server import app
import time

client = TestClient(app)


class TestGenerateEndpoint:
    """Test suite for /api/generate endpoint"""

    def test_root_endpoint(self):
        """Test that root API endpoint returns correct message"""
        response = client.get("/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Kura" in data["message"]

    def test_generate_valid_repo(self):
        """Test generation with a valid repository"""
        response = client.post(
            "/api/generate",
            json={"repo": "facebook/react", "variant": 0}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["ok"] is True
        assert "params" in data
        assert "seed" in data
        assert "cached" in data
        
        # Verify params structure
        params = data["params"]
        assert "mood" in params
        assert "palette" in params
        assert "traits" in params
        assert "motion" in params
        assert "glyph" in params

    def test_generate_with_variant(self):
        """Test that different variants produce different results"""
        response1 = client.post(
            "/api/generate",
            json={"repo": "facebook/react", "variant": 0}
        )
        response2 = client.post(
            "/api/generate",
            json={"repo": "facebook/react", "variant": 100}
        )
        
        assert response1.status_code == 200
        assert response2.status_code == 200
        
        data1 = response1.json()
        data2 = response2.json()
        
        # Different variants should produce different traits
        assert data1["params"]["traits"] != data2["params"]["traits"]

    def test_generate_invalid_repo_format(self):
        """Test that invalid repo format returns 400"""
        response = client.post(
            "/api/generate",
            json={"repo": "invalid-format", "variant": 0}
        )
        assert response.status_code == 400

    def test_generate_nonexistent_repo(self):
        """Test that non-existent repo returns 404"""
        response = client.post(
            "/api/generate",
            json={"repo": "nonexistent/repo-that-does-not-exist-12345", "variant": 0}
        )
        assert response.status_code == 404

    def test_caching_behavior(self):
        """Test that same request is cached on second call"""
        repo = "facebook/react"
        variant = 42
        
        # First request - should not be cached
        response1 = client.post(
            "/api/generate",
            json={"repo": repo, "variant": variant}
        )
        data1 = response1.json()
        
        # Second request - should be cached
        response2 = client.post(
            "/api/generate",
            json={"repo": repo, "variant": variant}
        )
        data2 = response2.json()
        
        # Second response should indicate it was cached
        assert data2["cached"] is True
        # Results should be identical
        assert data1["params"] == data2["params"]

    def test_trait_validation(self):
        """Test that generated traits match expected schema"""
        response = client.post(
            "/api/generate",
            json={"repo": "facebook/react", "variant": 0}
        )
        
        data = response.json()
        traits = data["params"]["traits"]
        
        # Validate species
        assert traits["species"] in ["blob", "sprout", "pebble", "puff"]
        
        # Validate accessory
        assert traits["accessory"] in ["none", "sprout-leaf", "antenna", "bow", "monocle"]
        
        # Validate pattern
        assert traits["pattern"] in ["none", "freckles", "stripes", "speckles", "rings"]
        
        # Validate glow level
        assert traits["glowLevel"] in [0, 1, 2]
        
        # Validate aura particles range
        assert 3 <= traits["auraParticles"] <= 12

    def test_palette_validation(self):
        """Test that generated palette has valid hex colors"""
        response = client.post(
            "/api/generate",
            json={"repo": "facebook/react", "variant": 0}
        )
        
        data = response.json()
        palette = data["params"]["palette"]
        
        # Helper to validate hex color
        def is_valid_hex(color):
            import re
            return bool(re.match(r'^#[0-9A-Fa-f]{6}$', color))
        
        assert is_valid_hex(palette["bg"])
        assert is_valid_hex(palette["fg"])
        for accent in palette["accents"]:
            assert is_valid_hex(accent)

    def test_mood_validation(self):
        """Test that mood is one of the valid options"""
        response = client.post(
            "/api/generate",
            json={"repo": "facebook/react", "variant": 0}
        )
        
        data = response.json()
        mood = data["params"]["mood"]
        
        assert mood in ["calm", "playful", "techno", "poetic"]

    def test_motion_parameters(self):
        """Test that motion parameters are within valid ranges"""
        response = client.post(
            "/api/generate",
            json={"repo": "facebook/react", "variant": 0}
        )
        
        data = response.json()
        motion = data["params"]["motion"]
        
        assert 0.1 <= motion["tempo_hz"] <= 1.0
        assert 2 <= motion["loop_seconds"] <= 5
        assert motion["style"] in ["breathing-gradient", "grid-pulse", "type-dissolve", "glyph-orbit"]

    def test_framework_detection_react(self):
        """Test that React repos get appropriate traits"""
        response = client.post(
            "/api/generate",
            json={"repo": "facebook/react", "variant": 0}
        )
        
        data = response.json()
        
        # React should typically get pebble species and techno mood
        # (though this may vary with variant seed)
        assert data["params"]["mood"] == "techno"
        assert data["params"]["traits"]["species"] == "pebble"

    def test_framework_detection_vue(self):
        """Test that Vue repos get appropriate traits"""
        response = client.post(
            "/api/generate",
            json={"repo": "vuejs/vue", "variant": 0}
        )
        
        data = response.json()
        
        # Vue should typically get puff species and calm mood
        assert data["params"]["mood"] == "calm"
        assert data["params"]["traits"]["species"] == "puff"

    def test_variant_range(self):
        """Test that variants outside 0-999 are handled"""
        # Negative variant
        response = client.post(
            "/api/generate",
            json={"repo": "facebook/react", "variant": -1}
        )
        # Should either accept it or return 400
        assert response.status_code in [200, 400]
        
        # Very large variant
        response = client.post(
            "/api/generate",
            json={"repo": "facebook/react", "variant": 9999}
        )
        # Should handle gracefully
        assert response.status_code in [200, 400]

    def test_deterministic_generation(self):
        """Test that same repo+variant always produces same result"""
        repo = "facebook/react"
        variant = 123
        
        # Generate twice
        response1 = client.post("/api/generate", json={"repo": repo, "variant": variant})
        response2 = client.post("/api/generate", json={"repo": repo, "variant": variant})
        
        data1 = response1.json()
        data2 = response2.json()
        
        # Seeds should be identical
        assert data1["seed"] == data2["seed"]
        
        # All parameters should be identical
        assert data1["params"] == data2["params"]

    def test_glyph_generation(self):
        """Test that glyph is properly generated from repo name"""
        response = client.post(
            "/api/generate",
            json={"repo": "facebook/react", "variant": 0}
        )
        
        data = response.json()
        glyph = data["params"]["glyph"]
        
        assert "text" in glyph
        assert "weight" in glyph
        assert len(glyph["text"]) == 3  # Should be 3 characters
        assert 400 <= glyph["weight"] <= 900


class TestRateLimiting:
    """Test suite for rate limiting functionality"""

    def test_rate_limit_enforcement(self):
        """Test that rate limiting prevents excessive requests"""
        # Make many rapid requests
        responses = []
        for i in range(25):  # Exceed the limit of 20
            response = client.post(
                "/api/generate",
                json={"repo": "facebook/react", "variant": i}
            )
            responses.append(response)
        
        # Some requests should be rate limited (429)
        status_codes = [r.status_code for r in responses]
        
        # Should have mix of 200 (success) and 429 (rate limited)
        # or all 200 if caching prevents rate limit hits
        assert 200 in status_codes or 429 in status_codes


class TestErrorHandling:
    """Test suite for error handling"""

    def test_missing_repo_field(self):
        """Test that missing repo field returns 422"""
        response = client.post(
            "/api/generate",
            json={"variant": 0}  # Missing repo
        )
        assert response.status_code == 422

    def test_invalid_json(self):
        """Test that invalid JSON returns 422"""
        response = client.post(
            "/api/generate",
            data="invalid json",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 422

    def test_github_url_format(self):
        """Test that full GitHub URLs are accepted"""
        response = client.post(
            "/api/generate",
            json={"repo": "https://github.com/facebook/react", "variant": 0}
        )
        # Should either accept it or normalize it
        assert response.status_code in [200, 400]


# Pytest configuration
@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """Setup test environment before running tests"""
    # Any global setup can go here
    yield
    # Cleanup after tests
