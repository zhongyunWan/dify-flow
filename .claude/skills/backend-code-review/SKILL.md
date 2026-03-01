---
name: backend-code-review
description: Review backend code for quality, security, maintainability, and best practices. Use when the user requests a review of Python backend files under the api/ directory.
---

# Backend Code Review Skill

Review backend code for quality, security, maintainability, and best practices based on established checklist rules.

## When to Apply This Skill

Apply this skill when the user:
- Asks to **review backend code**
- Asks to **review API endpoints** or routes
- Mentions **Python**, **FastAPI**, or **backend**
- Requests **code quality** feedback on server-side code
- Asks to **check for security issues** in backend

**Do NOT apply** when:
- User is asking about frontend/UI code
- User is asking about infrastructure or DevOps
- User is only asking conceptual questions without code context

## Review Modes

1. **Pending-change review** - Inspect staged/working-tree files before commit
2. **Code snippets review** - Analyze pasted code excerpts
3. **File-focused review** - Review specific files pointed to by user

## Checklist Rules

### 1. Architecture
- **Keep business logic out of controllers**
  - Controllers should parse input, call services, return serialized responses
  - Move domain/business logic into service or core/domain layer
  - Keep controllers thin and orchestration-focused

- **Preserve layer dependency direction**
  - Controllers → Services → Core/Domain (downward flow only)
  - Core should not import from controllers/web modules

- **Keep libs business-agnostic**
  - Modules under `api/libs/` should remain reusable, generic building blocks
  - No product/domain-specific rules in libs

### 2. Security
- SQL injection prevention (use parameterized queries or ORM)
- SSRF, command injection protection
- No hardcoded secrets or credentials
- Authentication/authorization checks where needed
- Input validation on all user inputs

### 3. Performance
- **Avoid N+1 queries** - Use eager loading when needed
- Missing indexes on frequently queried columns
- Blocking async operations (ensure proper use of async/await)
- Memory leaks in long-running processes

### 4. Database Schema (SQLAlchemy)
- **No Cross-Table Queries in Properties**: Model `@property` methods must not open sessions or query other tables
- **Include `tenant_id` in Models** for multi-tenant domains
- **Avoid Redundant Indexes**: Review for leftmost-prefix redundancy
- **Wrap Database-Specific Types**: Avoid PostgreSQL-only constructs like `JSONB` directly

### 5. Code Quality
- DRY violations
- SRP violations (functions do one thing)
- Deep nesting (>3 levels)
- Magic numbers (use constants)
- Poor naming conventions
- Missing error handling
- Type hints usage

## Output Format

Use one of these templates:

### Template A - For findings:

```markdown
## Code Review Summary

### 🔴 Critical (Must Fix)
1. **[File:Line]**: Description
   - Impact: Why this is critical
   - Suggestion: How to fix

### 🟡 Suggestions (Should Fix)
1. **[File:Line]**: Description
   - Suggestion: How to improve

### 🟢 Nits (Nice to Have)
1. **[File:Line]**: Minor issue
   - Suggestion: Optional improvement

### ✅ What's Good
- List of good practices observed

---
Would you like me to apply the suggested fixes?
```

### Template B - For no issues:

```markdown
✅ No issues found.
```

**Note**: Maximum 10 items per section. If exceeded, detail first 10 and summarize as "10+".

## Key Files to Review

In this project, focus on:
- `api/main.py` - Application entry point
- `api/routes/` - API endpoint definitions
- `api/database.py` - Database models
- Any new Python files added to `api/`
