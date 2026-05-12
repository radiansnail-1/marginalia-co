# Contributing

Thanks for helping with Marginalia & Co.

The live hosted app uses maintainer-owned infrastructure. For local development, create your own Supabase project, copy `.env.example` to `.env.local`, and apply the migrations in `supabase/migrations`.

Before opening a pull request:

```bash
npm run lint
npx tsc --noEmit
```

Please keep PRs focused. Do not commit `.env.local`, service-role keys, API tokens, private book exports, generated embedding dumps, or downloaded catalog archives.

Areas that are especially useful:

- better multilingual book search
- import flows for user-owned exports
- mobile browser QA
- recommendation ranking and explanations
- accessibility and performance
