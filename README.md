# Eyewear Intelligence Hub

I am continuing an existing AI-powered eyewear e-commerce project.

The project already has:

Completed:

- Project foundation and architecture

- Premium eyewear storefront UI

- Authentication system

- Database structure

- Product system

- Admin dashboard

- Cart, wishlist, checkout preparation, and order system

Your task is NOT to rebuild the project.

First, analyze the existing codebase and understand:

- Current folder structure

- Existing components

- Database schema

- Authentication flow

- Routing

- Styling system

- Existing features

Before making changes:

1. Create a detailed project map.

2. Identify the current technologies used.

3. Identify possible issues or inconsistencies.

4. Confirm how future features can be added safely.

Important rules:

- Do not redesign the UI.

- Do not remove existing functionality.

- Do not change working features unnecessarily.

- Keep the premium eyewear brand design.

- Maintain clean production-quality code.

- Make sure future AI features can be integrated:

  - AI face analysis

  - AI generated virtual try-on

  - Live AR glasses try-on

  - AI shopping assistant

After analysis, wait for my next instructions.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/481c1342-04ba-492d-bc2f-b3705621d1d1).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Environment variables

Copy `.env.example` to `.env` and fill in your own values before running
locally. `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` and their
server-side counterparts connect the storefront to Supabase; `LOVABLE_API_KEY`
powers the three AI features (shopping assistant, face-shape analysis, and
AI virtual try-on) — without it those features fail gracefully with a
"not configured" message instead of crashing.

