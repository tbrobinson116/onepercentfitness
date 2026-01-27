# CLAUDE.md - AI Assistant Guide for OnePercentFitness

> **Last Updated:** 2026-01-27
> **Repository Status:** New project - initial setup

## Project Overview

**OnePercentFitness** is a fitness tracking application inspired by the "1% improvement" philosophy - the concept that small, consistent improvements compound into significant results over time.

### Current Status

This repository is in **initial setup phase**. The codebase structure and conventions documented below represent the planned architecture and should be updated as the project evolves.

---

## Quick Reference

| Aspect | Details |
|--------|---------|
| **Project Name** | OnePercentFitness |
| **Repository** | `tbrobinson116/onepercentfitness` |
| **Primary Branch** | `main` (to be created) |
| **Language(s)** | TBD - Update when tech stack is chosen |
| **Package Manager** | TBD |
| **Node Version** | TBD |

---

## Development Workflow

### Git Conventions

1. **Branch Naming:**
   - Feature branches: `feature/<description>`
   - Bug fixes: `fix/<description>`
   - Claude AI branches: `claude/<session-id>`

2. **Commit Messages:**
   - Use conventional commits format
   - Format: `type(scope): description`
   - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
   - Example: `feat(workout): add exercise tracking component`

3. **Before Committing:**
   - Run linter (when configured)
   - Run tests (when configured)
   - Ensure no sensitive data is included

### Commands Reference

```bash
# Development (update when package.json is created)
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # Run linter
npm run lint:fix     # Fix linting issues
```

---

## Project Structure (Planned)

```
onepercentfitness/
├── CLAUDE.md              # This file - AI assistant guide
├── README.md              # Project documentation
├── package.json           # Dependencies and scripts
├── .env.example           # Environment variable template
├── .gitignore             # Git ignore rules
│
├── src/                   # Source code
│   ├── components/        # Reusable UI components
│   ├── pages/             # Page components/routes
│   ├── hooks/             # Custom React hooks (if React)
│   ├── utils/             # Utility functions
│   ├── services/          # API services
│   ├── types/             # TypeScript types/interfaces
│   └── styles/            # Global styles
│
├── api/                   # Backend API (if applicable)
│   ├── routes/            # API route handlers
│   ├── models/            # Database models
│   ├── middleware/        # Express/API middleware
│   └── utils/             # Backend utilities
│
├── prisma/                # Database schema (if using Prisma)
│   └── schema.prisma
│
├── public/                # Static assets
│
└── tests/                 # Test files
    ├── unit/
    ├── integration/
    └── e2e/
```

---

## Code Style & Conventions

### General Principles

1. **Keep it Simple:** Avoid over-engineering. Only add complexity when necessary.
2. **DRY but Pragmatic:** Don't repeat yourself, but three similar lines are better than a premature abstraction.
3. **Self-Documenting Code:** Write clear, descriptive names. Add comments only when logic isn't self-evident.
4. **Type Safety:** Use TypeScript for type safety (when applicable).

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files (components) | PascalCase | `WorkoutTracker.tsx` |
| Files (utilities) | camelCase | `formatDate.ts` |
| Variables | camelCase | `workoutCount` |
| Constants | SCREAMING_SNAKE | `MAX_EXERCISES` |
| Types/Interfaces | PascalCase | `WorkoutSession` |
| CSS Classes | kebab-case | `workout-card` |
| Database Tables | snake_case | `workout_sessions` |

### Import Order

```typescript
// 1. External dependencies
import React from 'react';
import { useState } from 'react';

// 2. Internal modules (absolute paths)
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks';

// 3. Relative imports
import { WorkoutCard } from './WorkoutCard';
import styles from './styles.module.css';

// 4. Types (if separate)
import type { Workout } from '@/types';
```

---

## Domain Concepts

### Core Entities (Planned)

- **User:** Application user with profile and preferences
- **Workout:** A single workout session
- **Exercise:** Individual exercise within a workout
- **Progress:** User's progress tracking over time
- **Goal:** User-defined fitness goals

### Key Features (Planned)

1. **Workout Logging:** Track exercises, sets, reps, weight
2. **Progress Tracking:** Visualize improvements over time
3. **Goal Setting:** Define and track fitness goals
4. **1% Improvements:** Highlight daily incremental progress

---

## Environment Variables

Create a `.env.local` file based on `.env.example` (when created):

```bash
# Database
DATABASE_URL=

# Authentication
AUTH_SECRET=

# API Keys (if needed)
# EXTERNAL_API_KEY=
```

**Never commit `.env` files with actual secrets.**

---

## Testing Strategy

### Test Types (When Implemented)

1. **Unit Tests:** Test individual functions and components
2. **Integration Tests:** Test feature workflows
3. **E2E Tests:** Test complete user journeys

### Test File Naming

- Unit tests: `*.test.ts` or `*.test.tsx`
- Integration tests: `*.integration.test.ts`
- E2E tests: `*.e2e.test.ts`

---

## AI Assistant Guidelines

### When Working on This Project

1. **Read Before Writing:** Always read existing files before modifying them.
2. **Follow Existing Patterns:** Match the coding style already in use.
3. **Minimal Changes:** Make only the changes necessary for the task.
4. **No Unsolicited Refactoring:** Don't refactor or "improve" code unless asked.
5. **Update This File:** Keep CLAUDE.md current as the project evolves.

### Common Tasks

#### Adding a New Feature
1. Check for similar existing implementations
2. Follow established patterns
3. Add appropriate tests
4. Update types if needed

#### Fixing a Bug
1. Reproduce and understand the issue
2. Find the root cause
3. Make minimal fix
4. Add test to prevent regression

#### Adding a New Component
1. Check `/src/components` for similar components
2. Follow existing component structure
3. Add TypeScript types
4. Consider reusability

### Things to Avoid

- Adding features not explicitly requested
- Creating unnecessary abstractions
- Over-commenting obvious code
- Adding "just in case" error handling
- Modifying unrelated files

---

## Troubleshooting

### Common Issues

*(To be populated as issues arise)*

| Issue | Solution |
|-------|----------|
| TBD | TBD |

---

## Resources

- [1% Improvement Philosophy](https://jamesclear.com/marginal-gains) - The concept behind the app name
- *(Add framework/library docs as tech stack is chosen)*

---

## Changelog

| Date | Changes |
|------|---------|
| 2026-01-27 | Initial CLAUDE.md created for new repository |

---

*This document should be updated as the project evolves. When making significant changes to architecture, conventions, or workflows, please update the relevant sections.*
