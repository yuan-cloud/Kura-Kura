# Contributing to Kura

Thank you for your interest in contributing to Kura! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Assume good intentions

## Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/yourusername/kura.git
   cd kura
   ```
3. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
pip install -r requirements-dev.txt  # Test dependencies
```

### Frontend

```bash
cd frontend
yarn install
```

### Running Tests

```bash
# Backend tests
cd backend
pytest tests/ -v

# Frontend tests
cd frontend
yarn test

# Linting
yarn lint
```

## Code Style

### Python (Backend)

- Follow **PEP 8** style guide
- Use **type hints** where applicable
- Maximum line length: **100 characters**
- Docstrings: **Google style**

```python
def fetch_repository_data(owner: str, name: str) -> Tuple[str, str]:
    """
    Fetch repository data from GitHub.
    
    Args:
        owner: Repository owner username
        name: Repository name
        
    Returns:
        Tuple of (readme_content, repo_name)
        
    Raises:
        HTTPException: If repository not found
    """
    pass
```

### JavaScript/React (Frontend)

- Use **ES6+** features
- Prefer **functional components** with hooks
- Use **destructuring** where appropriate
- Maximum line length: **100 characters**
- Comment complex logic

```javascript
/**
 * Generate spirit visualization for a repository.
 * 
 * @param {string} repo - Repository in owner/name format
 * @param {number} variant - Variant number (0-999)
 * @returns {Promise<Object>} Spirit parameters
 */
const generateSpirit = async (repo, variant = 0) => {
  // Implementation
};
```

## Commit Messages

Follow the **Conventional Commits** specification:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(backend): add rate limiting per API key

fix(frontend): resolve canvas rendering on mobile

docs(api): update endpoint documentation

refactor(analysis): extract GitHub service into separate module
```

## Pull Request Process

1. **Update documentation** if adding/changing features
2. **Add tests** for new functionality
3. **Ensure all tests pass**
4. **Update CHANGELOG.md** with your changes
5. **Create pull request** with clear description

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How has this been tested?

## Checklist
- [ ] Tests pass
- [ ] Documentation updated
- [ ] Code follows style guidelines
- [ ] Commits follow conventional format
```

## Adding New Features

### Adding Framework Detection

To add support for a new framework:

1. **Update `backend/services/analysis.py`**:
```python
FRAMEWORK_PATTERNS = {
    'new-framework': {
        'package_json': ['new-framework'],
        'files': ['new-framework.config.js'],
        'imports': ['import.*new-framework']
    }
}
```

2. **Update `map_tech_to_visual_traits()` in same file**:
```python
elif framework == "new-framework":
    traits["species"] = "puff"
    traits["pattern"] = "rings"
    traits["mood"] = "playful"
    traits["colors"] = ["#FF6B6B", "#4ECDC4"]
```

3. **Add test case in `tests/test_analysis.py`**
4. **Update documentation in `docs/api.md`**

### Adding New Visual Patterns

To add a new pattern type:

1. **Update `frontend/src/components/GlowyCritter.js`**:
```javascript
const patterns = {
  'newpattern': (ctx, x, y, color) => {
    // Your pattern rendering logic
  }
};
```

2. **Update backend schema** in `models/schemas.py`
3. **Add to analysis logic** in `services/analysis.py`
4. **Add test cases**

## Testing Guidelines

### Unit Tests

- Test individual functions in isolation
- Use mocks for external dependencies
- Aim for >80% code coverage

```python
def test_cache_expiration():
    """Test cache entries expire after TTL."""
    cache = CacheService(ttl_hours=0.0001)
    cache.set("key", "value")
    time.sleep(0.5)
    assert cache.get("key") is None
```

### Integration Tests

- Test API endpoints end-to-end
- Use test database/fixtures
- Clean up after tests

```python
def test_generate_endpoint(client):
    """Test /api/generate endpoint."""
    response = client.post(
        "/api/generate",
        json={"repo": "facebook/react", "variant": 0}
    )
    assert response.status_code == 200
    assert response.json()["ok"] is True
```

## Documentation

When adding features:

1. **Update README.md** - Add to features list
2. **Update API docs** - Document new endpoints
3. **Add inline comments** - Explain complex logic
4. **Update architecture docs** - If structure changes

## Bug Reports

Use the issue template and include:

- **Description**: Clear description of the bug
- **Steps to reproduce**: Numbered steps
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Environment**: OS, browser, versions
- **Screenshots**: If applicable

## Feature Requests

Include:

- **Use case**: Why is this needed?
- **Proposed solution**: How should it work?
- **Alternatives**: Other approaches considered
- **Additional context**: Examples, mockups

## Questions?

- **GitHub Discussions**: For general questions
- **GitHub Issues**: For bug reports and feature requests
- **Email**: your.email@example.com

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Eligible for contributor badges

Thank you for contributing to Kura! 🌟
