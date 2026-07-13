# Evidencias de entrega — Así Salgo!

Checklist para cerrar los ítems que la cátedra suele pedir con captura o informe breve.

**URL de producción:** https://asi-salgo.onrender.com  
**URL local:** http://localhost:3000  
**Última verificación automática:** julio 2026 — producción responde; El Viaje muestra tarjetas como botones y skip link visible.

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

### Plantilla para pegar resultados

| URL | Dispositivo | Performance | Accessibility | Best Practices | SEO |
|-----|-------------|-------------|---------------|----------------|-----|
| Home | Móvil | | | | |
| Home | Escritorio | | | | |
| El Viaje | Móvil | | | | |
| Salen | Móvil | | | | |

---

## 2. Testing cross-browser

| Navegador | Home | El Viaje (tarjetas) | Salen (Me sumo + mapa) | Notas |
|-----------|------|---------------------|------------------------|-------|
| Chrome    | ☐    | ☐                   | ☐                      |       |
| Firefox   | ☐    | ☐                   | ☐                      |       |
| Edge      | ☐    | ☐                   | ☐                      |       |
| Safari    | ☐    | ☐                   | ☐                      | iOS/mac si disponible |

---

## 3. Proporciones en distintos dispositivos

Revisar en DevTools con estos anchos (y en celular real si podés):

| Ancho | Qué mirar |
|-------|-----------|
| **360 px** | Sin scroll horizontal; nav no se superpone; CTA ancho cómodo; tarjetas Viaje en fila |
| **390 px** | Hero legible; pasos en 1 columna |
| **768 px** | Viaje en 2 columnas (no 4 apretadas); nav con menú hamburguesa |
| **1024 px** | Tablet landscape: grilla estable, mapa sin overflow |
| **1280 px** | Contenido centrado sin verse “mini” ni demasiado estirado |
| **1440 px+** | Títulos escalan sin quedar chicos; márgenes laterales equilibrados |

- [ ] Home: resplandor y título proporcionados en móvil.
- [ ] El Viaje: 4 columnas solo desde ~1100 px (antes 2 columnas).
- [ ] Salen: formulario y mapa sin desborde.
- [ ] Header/footer ocupan todo el ancho sin barra de scroll horizontal.

---

## 4. Tablet 768–1024 px

En DevTools (o iPad real), probá ancho **768**, **834** y **1024** px:

- [ ] Home: grilla de pasos en 2 columnas, título legible.
- [ ] El Viaje: tarjetas de energía en 2 columnas (no 4 apretadas).
- [ ] Salen: formulario + mapa sin overflow horizontal.
- [ ] Nav: menú hamburguesa solo &lt; 720 px; barra completa en tablet landscape.

---

## 5. Accesibilidad rápida

- [ ] **Tab** desde la carga: primer foco visible es “Saltar al contenido”; Enter lleva al `<main>`.
- [ ] **Tab** recorre nav, CTA y tarjetas sin trampas de foco.
- [ ] **Escape** cierra el menú móvil del header.
- [ ] Lighthouse → Accessibility en Home ≥ 90.
- [ ] Contraste: texto secundario legible sobre fondo `#0d0f0d` / cards `#141715`.
- [ ] Landmarks: `banner` (header), `main`, `contentinfo` (footer), nav con `aria-label`.

---

## 6. Open Graph

- [ ] Compartir `https://asi-salgo.onrender.com/` en WhatsApp/Telegram muestra imagen con puerta + título.
- [ ] Imagen servida: `/og-salida.png` (1200×630). Regenerar con `cd server && npm run og:png` si se cambia el SVG.
- [ ] Links compartidos (`/compartir/:id`) usan el mismo PNG en `og:image`.

---

## 7. Deploy y producción

Verificado en código y desplegado en Render (julio 2026):

- [x] Clicks en tarjetas de El Viaje funcionan (botones de energía visibles en accesibilidad).
- [x] Skip link “Saltar al contenido” presente.
- [x] Solo Rosario y Buenos Aires en selector de ciudad.
- [ ] Logo puerta abre al hover (verificar visualmente tras cold start).
- [ ] Formulario contacto envía sin error.
- [ ] Me sumo en Salen actualiza lista.

---

## 8. Seguridad (referencia para informe)

Implementado en `server/lib/seguridad.js`:

- [x] CORS restrictivo en POST (orígenes: producción + localhost).
- [x] Cabeceras: CSP, `X-Frame-Options`, `nosniff`, `Referrer-Policy`.
- [x] Límite body JSON 32 KB.
- [x] URLs externas solo `http`/`https` en compartir y tarjetas “Ver más”.

---

*Completá las casillas manuales y adjuntá capturas al ZIP o informe del TP.*
