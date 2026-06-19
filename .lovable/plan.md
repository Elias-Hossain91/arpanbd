## Use the uploaded logo as the app's brand mark

### 1. Upload the logo to CDN
- Upload `user-uploads://IMG_0727.png` via `lovable-assets create --filename arpan-logo.png` and write the pointer to `src/assets/arpan-logo.png.asset.json`.

### 2. Rebuild the `Logo` component (`src/components/arpan/brand.tsx`)
- Drop the heart-in-circle + Bangla/English text composition.
- Render the uploaded image with `<img src={logoAsset.url} alt="অর্পণ — Arpan, Community Giving Platform" />`.
- Expose a `size` prop that controls the rendered height (default ~40px for header use). The image already contains the icon, "arpan", "মানবতার দেয়াল", and "Community Giving Platform" — no extra text needed beside it.
- Keep `Stitch` and `Tag` exports unchanged.

### 3. Header layout tweak (`src/components/arpan/ArpanApp.tsx`)
- Where `<Logo />` is rendered in the home header, increase its size so the full wordmark reads well (the current call site uses default size 22 — bump the header instance to ~44px tall) and keep the existing right-side controls.

### 4. Shift the palette to match the new logo (teal instead of green)
In `src/styles.css`, retune the `--leaf` and `--leaf-soft` oklch tokens to the dark teal/navy from the logo (approx `#1E5F7A`) while keeping marigold and paper unchanged:
- `--leaf: oklch(0.42 0.06 230)` (dark teal)
- `--leaf-soft: oklch(0.93 0.025 225)` (pale teal tint)
- `--ring`, `--primary` already alias `--leaf`, so they update automatically.
- Adjust `--shadow-leaf` hue from 155 → 230 so shadows match the new primary.

### 5. Verify
- View the home screen in the preview to confirm the logo renders crisply on the warm paper background and the teal updates flow through buttons/tags/icons.

### Technical notes
- The logo PNG has a warm cream background that matches `--paper`, so no background removal is needed.
- Existing `text-leaf` / `bg-leaf` utility usages across the app pick up the new teal automatically through the token swap — no per-component edits needed beyond the header logo sizing.
- Files touched: `src/components/arpan/brand.tsx`, `src/components/arpan/ArpanApp.tsx` (one-line size prop), `src/styles.css`, plus the new `src/assets/arpan-logo.png.asset.json`.