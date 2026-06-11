# Repo Structure

```text
.
├── README.md
├── docs/
│   ├── PRODUCT_PLAN.md
│   ├── DECISIONS.md
│   └── REPO_STRUCTURE.md
├── apps/
│   └── web/
│       ├── app/
│       ├── components/
│       └── lib/
└── packages/
    └── core/
        └── src/
```

## Intended Evolution

`apps/web` will become the main SaaS application and public menu renderer.

`packages/core` will hold shared business logic and domain types once the app becomes large enough to justify extraction.
