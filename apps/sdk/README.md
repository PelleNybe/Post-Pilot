# PostPilot Node.js SDK

This is the official Node.js / TypeScript SDK (`@postpilot/node`) for [PostPilot](https://coraxcolab.com).

## Installation

```bash
npm install @postpilot/node
# or
pnpm add @postpilot/node
```

## Usage

```typescript
import PostPilot from '@postpilot/node';

// Defaults to http://localhost:3000 when no base URL is provided
const postpilot = new PostPilot(
  process.env.POSTPILOT_API_KEY!,
  process.env.POSTPILOT_API_URL // optional self-hosted backend URL, e.g. https://api.example.com
);
```

## Available Methods

- `post(posts: CreatePostDto)` — Schedule or create a post in PostPilot
- `postList(filters: GetPostsDto)` — Retrieve a filtered list of posts
- `upload(file: Buffer, extension: string)` — Upload media files to PostPilot
- `integrations()` — List connected social channels
- `deletePost(id: string)` — Delete a post by ID

## Building & Testing

Run from the repository root or `apps/sdk`:

```bash
pnpm --filter @postpilot/node run build
pnpm test -- apps/sdk
```

You can also use the public REST API directly with `curl`; see the [PostPilot API documentation](https://coraxcolab.com/docs/api) for more information.
