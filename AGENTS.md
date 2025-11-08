# Commands
- Build: `vite build`
- Lint: `biome lint`
- Format: `biome format`
- Check: `biome check`
- Test: `vitest run`
- Test single: `vitest run <file>`

# Code Style
- **Formatting**: Biome, tab indentation, double quotes
- **Imports**: Organize with Biome, path aliases `@/` for `src/`
- **Types**: Strict TypeScript, no unused locals/parameters
- **Naming**: camelCase for variables/functions, PascalCase for components
- **Error handling**: Zod schemas for validation, console.log for debugging
- **UI**: Shadcn components via `pnpx shadcn@latest add <component>`
- **Styling**: Tailwind CSS with `cn()` utility for class merging
- **Libraries**: TanStack (Router, Query, Form), React 19, Cloudflare Workers