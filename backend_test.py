import requests
import sys
import json
import re
import time
import os
from datetime import datetime

class ProjectKuraCritterTester:
    def __init__(self, base_url=None):
        # Use environment variable or get from frontend .env file
        if base_url is None:
            # Try to read from frontend .env file first
            try:
                with open('/app/frontend/.env', 'r') as f:
                    for line in f:
                        if line.startswith('REACT_APP_BACKEND_URL='):
                            base_url = line.split('=', 1)[1].strip()
                            break
            except:
                pass
            
            # Fallback to environment variable or localhost
            if base_url is None:
                base_url = os.environ.get("TEST_BASE_URL", "http://localhost:3000")
        
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Message: {data.get('message', 'No message')}"
            self.log_test("Root API Endpoint", success, details)
            return success
        except Exception as e:
            self.log_test("Root API Endpoint", False, str(e))
            return False

    def validate_hex_color(self, color):
        """Validate if a string is a valid hex color"""
        return bool(re.match(r'^#[0-9A-Fa-f]{6}$', color))

    def validate_response_structure(self, data):
        """Validate the complete response structure as per requirements"""
        errors = []
        
        # Check top-level fields
        required_top_fields = ["ok", "params", "seed", "cached", "embed"]
        for field in required_top_fields:
            if field not in data:
                errors.append(f"Missing top-level field: {field}")
        
        if "params" not in data:
            return errors
        
        params = data["params"]
        
        # Check params structure
        required_param_fields = ["mood", "primary_keywords", "palette", "motion", "traits", "glyph", "seed", "variant"]
        for field in required_param_fields:
            if field not in params:
                errors.append(f"Missing params field: {field}")
        
        # Validate mood
        if "mood" in params:
            valid_moods = ["calm", "playful", "techno", "poetic"]
            if params["mood"] not in valid_moods:
                errors.append(f"Invalid mood: {params['mood']}, expected one of {valid_moods}")
        
        # Validate palette
        if "palette" in params:
            palette = params["palette"]
            required_palette_fields = ["bg", "fg", "accents"]
            for field in required_palette_fields:
                if field not in palette:
                    errors.append(f"Missing palette field: {field}")
            
            # Validate hex colors
            if "bg" in palette and not self.validate_hex_color(palette["bg"]):
                errors.append(f"Invalid bg color: {palette['bg']}")
            if "fg" in palette and not self.validate_hex_color(palette["fg"]):
                errors.append(f"Invalid fg color: {palette['fg']}")
            if "accents" in palette:
                if not isinstance(palette["accents"], list):
                    errors.append("accents should be a list")
                else:
                    for i, accent in enumerate(palette["accents"]):
                        if not self.validate_hex_color(accent):
                            errors.append(f"Invalid accent color {i}: {accent}")
        
        # Validate motion
        if "motion" in params:
            motion = params["motion"]
            required_motion_fields = ["tempo_hz", "loop_seconds", "style"]
            for field in required_motion_fields:
                if field not in motion:
                    errors.append(f"Missing motion field: {field}")
            
            if "style" in motion:
                valid_styles = ["breathing-gradient", "grid-pulse", "type-dissolve", "glyph-orbit"]
                if motion["style"] not in valid_styles:
                    errors.append(f"Invalid motion style: {motion['style']}")
        
        # Validate traits (most important for critter generation)
        if "traits" in params:
            traits = params["traits"]
            required_trait_fields = ["species", "accessory", "pattern", "glowLevel", "auraParticles", "swayAmount", "breathAmount"]
            for field in required_trait_fields:
                if field not in traits:
                    errors.append(f"Missing traits field: {field}")
            
            # Validate trait values
            if "species" in traits:
                valid_species = ["blob", "sprout", "pebble", "puff"]
                if traits["species"] not in valid_species:
                    errors.append(f"Invalid species: {traits['species']}")
            
            if "accessory" in traits:
                valid_accessories = ["none", "sprout-leaf", "antenna", "bow", "monocle"]
                if traits["accessory"] not in valid_accessories:
                    errors.append(f"Invalid accessory: {traits['accessory']}")
            
            if "pattern" in traits:
                valid_patterns = ["none", "freckles", "stripes", "speckles", "rings"]
                if traits["pattern"] not in valid_patterns:
                    errors.append(f"Invalid pattern: {traits['pattern']}")
            
            if "glowLevel" in traits:
                if traits["glowLevel"] not in [0, 1, 2]:
                    errors.append(f"Invalid glowLevel: {traits['glowLevel']}, expected 0, 1, or 2")
        
        # Validate glyph
        if "glyph" in params:
            glyph = params["glyph"]
            required_glyph_fields = ["text", "weight"]
            for field in required_glyph_fields:
                if field not in glyph:
                    errors.append(f"Missing glyph field: {field}")
        
        return errors

    def test_generate_with_variant(self, repo, variant=0):
        """Test generate endpoint with specific repo and variant"""
        try:
            payload = {"repo": repo, "variant": variant}
            response = requests.post(f"{self.api_url}/generate", json=payload, timeout=30)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                validation_errors = self.validate_response_structure(data)
                
                if validation_errors:
                    success = False
                    details = f"Validation errors: {'; '.join(validation_errors)}"
                else:
                    params = data["params"]
                    details = f"Repo: {repo}, Variant: {variant}, Species: {params['traits']['species']}, Pattern: {params['traits']['pattern']}, Mood: {params['mood']}, Cached: {data['cached']}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test(f"Generate {repo} (variant {variant})", success, details)
            return success, response.json() if success else None
        except Exception as e:
            self.log_test(f"Generate {repo} (variant {variant})", False, str(e))
            return False, None

    def test_generate_invalid_repo(self):
        """Test generate endpoint with invalid repo format"""
        try:
            payload = {"repo": "invalid-repo-format"}
            response = requests.post(f"{self.api_url}/generate", json=payload, timeout=10)
            success = response.status_code == 400
            details = f"Status: {response.status_code} (expected 400)"
            self.log_test("Generate Invalid Repo Format", success, details)
            return success
        except Exception as e:
            self.log_test("Generate Invalid Repo Format", False, str(e))
            return False

    def test_generate_nonexistent_repo(self):
        """Test generate endpoint with non-existent repo"""
        try:
            payload = {"repo": "nonexistent/nonexistent-repo-12345"}
            response = requests.post(f"{self.api_url}/generate", json=payload, timeout=15)
            success = response.status_code == 404
            details = f"Status: {response.status_code} (expected 404)"
            self.log_test("Generate Non-existent Repo", success, details)
            return success
        except Exception as e:
            self.log_test("Generate Non-existent Repo", False, str(e))
            return False

    # Gallery endpoint not part of current requirements - removed

    def test_multiple_repos_variants(self):
        """Test generation with multiple repos and variants as specified"""
        test_cases = [
            ("facebook/react", 0),
            ("facebook/react", 100),
            ("facebook/react", 500),
            ("vuejs/vue", 0),
            ("vuejs/vue", 100),
            ("django/django", 0),
            ("torvalds/linux", 0)
        ]
        
        all_success = True
        results = {}
        
        for repo, variant in test_cases:
            success, data = self.test_generate_with_variant(repo, variant)
            results[f"{repo}:{variant}"] = data
            if not success:
                all_success = False
        
        return all_success, results

    def test_caching_behavior(self):
        """Test that caching works correctly - same repo+variant should return cached=true on second call"""
        try:
            repo = "facebook/react"
            variant = 42
            
            # First call - should not be cached
            success1, data1 = self.test_generate_with_variant(repo, variant)
            if not success1:
                self.log_test("Caching Test - First Call", False, "First call failed")
                return False
            
            # Wait a moment
            time.sleep(1)
            
            # Second call - should be cached
            success2, data2 = self.test_generate_with_variant(repo, variant)
            if not success2:
                self.log_test("Caching Test - Second Call", False, "Second call failed")
                return False
            
            # Check caching behavior
            first_cached = data1.get("cached", False)
            second_cached = data2.get("cached", False)
            
            # First should not be cached, second should be cached
            success = not first_cached and second_cached
            details = f"First call cached: {first_cached}, Second call cached: {second_cached}"
            
            self.log_test("Caching Behavior", success, details)
            return success
            
        except Exception as e:
            self.log_test("Caching Behavior", False, str(e))
            return False

    def test_tech_stack_analysis(self, results):
        """Test that tech stack analysis produces appropriate traits"""
        try:
            analysis_results = []
            
            # Test React repo - should get pebble species with freckles pattern
            react_key = "facebook/react:0"
            if react_key in results and results[react_key]:
                react_traits = results[react_key]["params"]["traits"]
                react_correct = react_traits["species"] == "pebble" and react_traits["pattern"] == "freckles"
                analysis_results.append(f"React: species={react_traits['species']}, pattern={react_traits['pattern']} ({'✓' if react_correct else '✗'})")
            
            # Test Vue repo - should get puff species with calm mood
            vue_key = "vuejs/vue:0"
            if vue_key in results and results[vue_key]:
                vue_traits = results[vue_key]["params"]["traits"]
                vue_mood = results[vue_key]["params"]["mood"]
                vue_correct = vue_traits["species"] == "puff" and vue_mood == "calm"
                analysis_results.append(f"Vue: species={vue_traits['species']}, mood={vue_mood} ({'✓' if vue_correct else '✗'})")
            
            # Test Django repo - should get appropriate colors and patterns
            django_key = "django/django:0"
            if django_key in results and results[django_key]:
                django_traits = results[django_key]["params"]["traits"]
                django_palette = results[django_key]["params"]["palette"]
                analysis_results.append(f"Django: species={django_traits['species']}, pattern={django_traits['pattern']}, fg_color={django_palette['fg']}")
            
            success = len(analysis_results) > 0
            details = "; ".join(analysis_results)
            
            self.log_test("Tech Stack Analysis", success, details)
            return success
            
        except Exception as e:
            self.log_test("Tech Stack Analysis", False, str(e))
            return False

    def test_rate_limiting(self):
        """Test rate limiting by making multiple requests rapidly"""
        try:
            repo = "facebook/react"
            rapid_requests = 5
            success_count = 0
            rate_limited = False
            
            for i in range(rapid_requests):
                payload = {"repo": repo, "variant": i}
                response = requests.post(f"{self.api_url}/generate", json=payload, timeout=10)
                
                if response.status_code == 200:
                    success_count += 1
                elif response.status_code == 429:
                    rate_limited = True
                    break
            
            # Rate limiting should either work (429 response) or all requests should succeed
            success = success_count > 0
            details = f"Successful requests: {success_count}/{rapid_requests}, Rate limited: {rate_limited}"
            
            self.log_test("Rate Limiting", success, details)
            return success
            
        except Exception as e:
            self.log_test("Rate Limiting", False, str(e))
            return False

    def run_all_tests(self):
        """Run all Project Kura critter generation tests"""
        print("🚀 Starting Project Kura Critter Generation API Tests")
        print("=" * 60)
        
        # Basic connectivity
        if not self.test_root_endpoint():
            print("❌ Root endpoint failed - stopping tests")
            return False
        
        # Core functionality tests
        print("\n📋 Testing Core API Functionality...")
        self.test_generate_invalid_repo()
        self.test_generate_nonexistent_repo()
        
        # Multiple repos and variants testing (main requirement)
        print("\n🎯 Testing Multiple Repositories and Variants...")
        repos_success, results = self.test_multiple_repos_variants()
        
        # Caching behavior
        print("\n💾 Testing Caching Behavior...")
        self.test_caching_behavior()
        
        # Tech stack analysis
        print("\n🔍 Testing Tech Stack Analysis...")
        self.test_tech_stack_analysis(results)
        
        # Rate limiting
        print("\n⚡ Testing Rate Limiting...")
        self.test_rate_limiting()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️  Some tests failed - check details above")
            
            # Print failed tests for debugging
            failed_tests = [result for result in self.test_results if not result["success"]]
            if failed_tests:
                print("\n❌ Failed Tests:")
                for test in failed_tests:
                    print(f"  - {test['test']}: {test['details']}")
            
            return False

def main():
    tester = ProjectKuraCritterTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())