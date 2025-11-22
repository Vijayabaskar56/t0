## TanStack Fast

A highly performant e-commerce template using TanStack and Cloudflare, inspired by [NextFaster](https://github.com/ethanniser/next-faster) by [@ethanniser](https://x.com/ethanniser), [@RhysSullivan](https://x.com/RhysSullivan) and [@armans-code](https://x.com/ksw_arman). This version showcases the power of TanStack Router, Query, and Start deployed on Cloudflare's edge platform.

### Design notes

**Inspired by the original [NextFaster twitter thread](https://x.com/ethanniser/status/1848442738204643330)**

- Uses [TanStack Start](https://tanstack.com/start/latest) with [TanStack Router](https://tanstack.com/router/latest) and [TanStack Query](https://tanstack.com/query/latest)
  - All mutations are managed via TanStack Query with optimistic updates
  - Server-side rendering with TanStack Start for optimal performance
- [TanStack Router preloading](https://tanstack.com/router/latest/docs/framework/react/guide/preloading) is used to prefetch data and components
  - When deployed, pages are served from Cloudflare's edge network
  - Dynamic data (cart, user sessions) is managed by TanStack Query with intelligent caching
- Uses [Drizzle ORM](https://orm.drizzle.team/docs/overview) on top of [Cloudflare D1](https://developers.cloudflare.com/d1/)
- Images stored on [Cloudflare R2](https://developers.cloudflare.com/r2/)
- [Cloudflare KV](https://developers.cloudflare.com/workers/runtime-apis/kv/) for edge caching and session storage
- Used [v0](https://v0.dev) to generate all initial UIs, check out some of the threads we were particularly impressed by:
  - [v0 makes pretty impressive search dropdown without a library](https://v0.dev/chat/lFfc68X3fir?b=b_1o4tkiC9EEm&p=0)
  - [recreating 'order' page](https://v0.dev/chat/RTBa8dXhx03?b=b_4RguNNUEhLh)
  - [recreating 'login' page](https://v0.dev/chat/tijwMFByNX9?b=b_XnRtduKn2oe)
- Enhanced with TanStack Query for data fetching and state management
- Integrated TanStack Router for type-safe navigation and preloading
- Images are not Done by Cloudflare Image Transformation

#### DATA

- Product data and images sourced from the original NextFaster project

### Deployment

- Make sure Cloudflare Workers is configured with D1 database, KV namespace, and R2 bucket
- Run `pnpm db:push` to apply schema to your D1 database
- Run `pnpm deploy` to deploy to Cloudflare Workers

### Local dev

- Run `wrangler login` to authenticate with Cloudflare.
- Set up your environment variables in `.dev.vars` or use Cloudflare environment variables.
- Run `pnpm install` to install dependencies.

#### Database Setup

1. **Initialize Database Schema**
   ```bash
   pnpm run db:init
   ```
   This creates all necessary tables in your local D1 database.

2. **Seed with Sample Data** (Recommended for contributors)
   ```bash
   pnpm run db:seed
   ```
   This populates the database with realistic sample data:
   - 10 Collections
   - 20 Categories  
   - 15 Subcollections
   - 30 Subcategories
   - 500+ Products

3. **Start Development**
   ```bash
   pnpm dev
   ```

#### Database Commands

- `pnpm run db:init` - Initialize database schema
- `pnpm run db:seed` - Seed with sample data
- `pnpm run db:studio` - Open Drizzle Studio (database GUI)
- `pnpm run db:generate` - Generate migrations
- `pnpm run db:push` - Push schema changes

**Note**: The database is automatically detected in `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/` - no hardcoded paths, works for any contributor.

### Performance

This TanStack + Cloudflare version leverages:
- **TanStack Router preloading** for instant navigation
- **TanStack Query caching** for optimal data management
- **Cloudflare Edge Network** for global low-latency delivery
- **Cloudflare KV** for edge caching and session storage
- **Cloudflare D1** for serverless SQL at the edge
- **Cloudflare R2** for fast image delivery globally


[PageSpeed Report](https://pagespeed.web.dev/analysis/https-tanstack-faster-tancn-dev/ow16tkqgos?form_factor=desktop)

<img width="822" alt="SCR-20241027-dmsb" src="https://raw.githubusercontent.com/Vijayabaskar56/tanstack-start-faster/refs/heads/main/public/light-house.png">


### Costs

This project is deployed on Cloudflare Workers, leveraging Cloudflare's edge platform for optimal performance and cost efficiency.

*Cost analysis will be added after running the TanStack + Cloudflare version in production.*

#### Expected Benefits:

- **Cloudflare Workers**: Free tier includes 100,000 requests/day
- **D1 Database**: 5GB storage, 25 million reads/day free
- **R2 Storage**: 10GB storage free, 1 million Class A operations/month free
- **KV Storage**: 100,000 reads/day, 1,000 writes/day free
- **Edge Network**: Global CDN with no egress fees

The TanStack + Cloudflare stack is designed to be more cost-effective than the original Vercel deployment while maintaining similar performance characteristics through intelligent caching and edge optimization.

### Architecture Highlights

#### TanStack Integration
- **TanStack Router**: Type-safe routing with automatic preloading and code splitting
- **TanStack Query**: Intelligent data fetching, caching, and synchronization
- **TanStack Start**: Full-stack React framework with SSR/SSG capabilities
- **Optimistic Updates**: Smooth user experience with instant UI feedback

#### Cloudflare Edge Platform
- **Workers**: Serverless compute at the edge for low-latency request handling
- **D1 Database**: SQLite-compatible serverless SQL database
- **R2 Storage**: S3-compatible object storage with no egress fees
- **KV Storage**: Global key-value store for caching and session data

#### Performance Optimizations
- **Router Preloading**: Fetch data and components before navigation
- **Query Caching**: Smart caching with background refetching
- **Edge Caching**: KV-based caching for frequently accessed data
- **Image Optimization**: R2 + Cloudflare Image Resizing for optimal delivery

### Credits & Inspiration

This project is inspired by and adapted from [NextFaster](https://github.com/ethanniser/next-faster) by [@ethanniser](https://x.com/ethanniser), [@RhysSullivan](https://x.com/RhysSullivan) and [@armans-code](https://x.com/ksw_arman). 

The original NextFaster project demonstrated the incredible performance possible with Next.js 15 and Vercel's platform. This TanStack + Cloudflare version aims to showcase similar performance characteristics while leveraging the power of TanStack's ecosystem and Cloudflare's global edge network.

**Original Project**: [NextFaster](https://github.com/ethanniser/NextFaster)  
**Original Thread**: [Twitter/X](https://x.com/ethanniser/status/1848442738204643330)