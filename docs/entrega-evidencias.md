# Evidencias de entrega — Así Salgo!

Checklist para cerrar los ítems que la cátedra suele pedir con captura o informe breve.

**URL de producción:** https://asi-salgo.onrender.com  
**URL local:** http://localhost:3000

---

## 1. PageSpeed Insights

1. Abrí https://pagespeed.web.dev/
2. Analizá estas URLs (móvil y escritorio):
   - `https://asi-salgo.onrender.com/`
   - `https://asi-salgo.onrender.com/viaje.html`
   - `https://asi-salgo.onrender.com/salen.html`
3. Guardá captura de pantalla de cada informe (Performance, Accessibility, Best Practices, SEO).
4. Si Performance en móvil baja por cold start de Render Free, anotá que el hosting gratuito duerme tras inactividad.

**Meta orientativa:** Accessibility y SEO ≥ 90; Performance depende del cold start.

---

## 2. Testing cross-browser

| Navegador | Home | El Viaje (tarjetas) | Salen (Me sumo + mapa) | Notas |
|-----------|------|---------------------|------------------------|-------|
| Chrome    | ☐    | ☐                   | ☐                      |       |
| Firefox   | ☐    | ☐                   | ☐                      |       |
| Edge      | ☐    | ☐                   | ☐                      |       |
| Safari    | ☐    | ☐                   | ☐                      | iOS/mac si disponible |

---

## 3. Tablet 768–1024 px

En DevTools (o iPad real), probá ancho **768**, **834** y **1024** px:

- [ ] Home: grilla de pasos en 2 columnas, título legible.
- [ ] El Viaje: tarjetas de energía en 2 columnas (no 4 apretadas).
- [ ] Salen: formulario + mapa sin overflow horizontal.
- [ ] Nav: menú hamburguesa solo &lt; 720 px; barra completa en tablet landscape.

---

## 4. Accesibilidad rápida

- [ ] **Tab** desde la carga: primer foco visible es “Saltar al contenido”; Enter lleva al `<main>`.
- [ ] **Tab** recorre nav, CTA y tarjetas sin trampas de foco.
- [ ] **Escape** cierra el menú móvil del header.
- [ ] Lighthouse → Accessibility en Home ≥ 90.
- [ ] Contraste: texto secundario legible sobre fondo `#0d0f0d` / cards `#141715`.

---

## 5. Open Graph

- [ ] Compartir `https://asi-salgo.onrender.com/` en WhatsApp/Telegram muestra imagen con puerta + título.
- [ ] Imagen servida: `/og-salida.png` (1200×630). Regenerar con `cd server && npm run og:png` si se cambia el SVG.

---

## 6. Deploy

Tras commitear y pushear a `main`, Render redeploya solo. Verificar en producción:

- [ ] Clicks en tarjetas de El Viaje funcionan.
- [ ] Logo puerta abre al hover.
- [ ] Solo Rosario y Buenos Aires en selector de ciudad.

---

*Completá las casillas y adjuntá capturas al ZIP o informe del TP.*
