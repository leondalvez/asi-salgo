# Evidencias de entrega — Así Salgo!

Checklist para capturas e informe breve.

**URL de producción:** https://asi-salgo.onrender.com  
**URL local:** http://localhost:3000

---

## 1. PageSpeed Insights

1. Abrir https://pagespeed.web.dev/
2. Analizar (móvil y escritorio):
   - `https://asi-salgo.onrender.com/`
   - `https://asi-salgo.onrender.com/viaje.html`
   - `https://asi-salgo.onrender.com/salen.html`
3. Guardar captura de cada informe.
4. Si Performance baja por cold start de Render Free, anotar que el hosting gratuito duerme tras inactividad.

**Meta orientativa:** Accessibility y SEO ≥ 90.

| URL | Dispositivo | Performance | Accessibility | Best Practices | SEO |
|-----|-------------|-------------|---------------|----------------|-----|
| Home | Móvil | | | | |
| Home | Escritorio | | | | |
| El viaje | Móvil | | | | |
| Salen | Móvil | | | | |

---

## 2. Testing cross-browser

| Navegador | Home | El viaje | Salen | Notas |
|-----------|------|----------|-------|-------|
| Chrome    | ☐    | ☐        | ☐     |       |
| Firefox   | ☐    | ☐        | ☐     |       |
| Edge      | ☐    | ☐        | ☐     |       |
| Safari    | ☐    | ☐        | ☐     | si está disponible |

---

## 3. Proporciones

| Ancho | Qué mirar |
|-------|-----------|
| **360 px** | Sin scroll horizontal; nav usable; tarjetas de El viaje en grilla 2×2 |
| **768 px** | Layout tablet; menú hamburguesa bajo 768 |
| **1024 px** | Tablet landscape estable |
| **1280 px+** | Contenido centrado, tipografía legible |

- [ ] Home proporcionada en móvil
- [ ] El viaje móvil: tarjetas de energía debajo de la pregunta
- [ ] Salen: formulario y mapa sin desborde
- [ ] Header/footer sin scroll horizontal

---

## 4. Accesibilidad

- [ ] Skip link “Saltar al contenido” funciona
- [ ] Tab recorre nav y CTAs sin trampas de foco
- [ ] Escape cierra el menú móvil
- [ ] Lighthouse Accessibility en Home ≥ 90
- [ ] Landmarks: banner, main, contentinfo

---

## 5. Open Graph

- [ ] Compartir la home muestra imagen OG
- [ ] Imagen: `/og-salida.png` (1200×630)
- [ ] Links `/compartir/:id` usan la misma imagen

---

## 6. Producción

- [x] El viaje: tarjetas de energía clickeables
- [x] Skip link presente
- [x] Solo Rosario y Buenos Aires en el selector
- [ ] Logo puerta abre al hover
- [ ] Contacto envía sin error
- [ ] Me sumo actualiza la lista

---

## 7. Seguridad (referencia)

Implementado en `server/lib/seguridad.js`:

- [x] CORS restrictivo en POST
- [x] Cabeceras CSP, X-Frame-Options, nosniff, Referrer-Policy
- [x] Límite de body JSON 32 KB
- [x] URLs externas solo http/https

---

## 8. Comunicación

- [x] Sentence case en títulos
- [x] Convención **El viaje**
- [x] Patrón de `<title>`: `Página — Así Salgo!`
