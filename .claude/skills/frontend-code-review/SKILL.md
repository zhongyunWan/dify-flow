---
name: frontend-code-review
description: Review frontend code for quality, performance, and best practices. Use when the user requests a review of React/TypeScript frontend files.
---

# Frontend Code Review Skill

Review frontend code for quality, security, maintainability, and best practices based on established checklist rules.

## When to Apply This Skill

Apply this skill when the user:
- Asks to **review frontend code**
- Asks to **review React components**
- Mentions **React**, **TypeScript**, **frontend**, or **UI**
- Requests **code quality** feedback on client-side code
- Asks to **check for accessibility** issues

**Do NOT apply** when:
- User is asking about backend/API code
- User is asking about infrastructure or DevOps
- User is only asking conceptual questions without code context

## Review Modes

1. **Pending-change review** - Inspect staged/working-tree files before commit
2. **Code snippets review** - Analyze pasted code excerpts
3. **File-focused review** - Review specific files pointed to by user

## Checklist Rules

### 1. Code Quality

- **Conditional class names** should use a shared `cn` utility function (like `clsx` or `classnames`) rather than custom ternaries or string concatenation

- **Tailwind-first styling** - Avoid creating new `.module.css` files unless Tailwind cannot achieve the required styling

- **ClassName ordering** - Place the incoming `className` prop after the component's own class values, enabling downstream consumers to override styling

### 2. React Best Practices

- Functional components with hooks
- Proper use of useEffect dependencies
- Memoization where beneficial (`useMemo`, `useCallback`)
- Avoid unnecessary re-renders
- Proper component composition

### 3. React Flow Performance (if applicable)

- **Use `useNodes`/`useEdges` hooks** for UI rendering
- **Use `useStoreApi`** inside callbacks for mutating or reading node/edge state
- Avoid manually pulling Flow data outside these hooks

- **Complex prop memoization**: Wrap complex prop values (objects, arrays, maps) in `useMemo` before passing to child components

### 4. State Management

- Appropriate state scope (local vs global)
- Zustand store follows best practices
- State updates are immutable
- No redundant state

### 5. Accessibility

- Proper semantic HTML
- ARIA labels where needed
- Keyboard navigation support
- Color contrast considerations

### 6. Security

- No sensitive data in client-side code
- XSS prevention (dangerouslySetInnerHTML only with sanitization)
- Proper handling of user input

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
- `web/src/components/` - React components
- `web/src/store/` - Zustand state management
- `web/src/services/` - API services
- `web/src/hooks/` - Custom hooks
- Any new TypeScript/TSX files added to `web/src/`

## Technology Stack

This project uses:
- React 19
- TypeScript
- @xyflow/react (React Flow) for workflow visualization
- Zustand for state management
- Tailwind CSS 4 for styling
- Axios for HTTP requests
