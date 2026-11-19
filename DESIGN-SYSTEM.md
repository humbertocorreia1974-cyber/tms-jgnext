# Sistema de design — TMS JGNEXT
Gerado com **UI/UX Pro Max** (curadoria de estilo + paleta + tipografia).
- **Estilo:** Flat Design
- **Palavras-chave:** 2D, minimalist, bold colors, no shadows, clean lines, simple shapes, typography-focused, modern, icon-heavy
- **Modo:** light
- **Fontes:** Cinzel (títulos) / Josefin Sans (corpo)
- **Efeitos:** No gradients/shadows, simple hover (color/opacity shift), fast loading, clean transitions (150-200ms ease), minimal icons
- **Padrão de landing:** Product Demo + Features — Hero > Product video/mockup (center) > Feature breakdown per section > Comparison (optional) > CTA
- **Evitar:** Complex shadows + 3D effects
## Tokens (CSS vars em `app/globals.css`)
```css
--bg: 210 40% 98%;
--surface: 0 0% 100%;
--surface-2: 220 75% 97%;
--border: 220 80% 94%;
--fg: 222 47% 11%;
--fg-muted: 215 19% 35%;
--brand: 221 83% 53%;
--brand-fg: 0 0% 100%;
--accent: 21 90% 48%;
--accent-fg: 0 0% 0%;
```
_Use SEMPRE os tokens (`bg-brand`, `text-fg`, `border-border`…), nunca hex cru._