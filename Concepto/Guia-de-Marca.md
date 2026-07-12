# Guía de marca — Así Salgo!

**Eslogan:** La app para dejar las apps.  
**Mantra de producto:** Menos scroll. Más ciudad.  
**Versión:** 1.0 · Julio 2026

---

## 1. Esencia de marca

### Qué somos
Facilitador de salidas presenciales. No somos una agenda infinita ni una red social: ayudamos a decidir **rápido** y salir **cerca**.

### Qué no somos
- No retenemos al usuario con scroll infinito
- No saturamos con publicidad ni listados enormes
- No fingimos certeza (precio, horarios) si el dato no está confirmado

### Personalidad
| Atributo | Sí | No |
|----------|----|----|
| Tono | Directo, cálido, alentador | Corporativo, urgente, influencer |
| Ritmo | Pocos clics, pocas palabras | Formularios largos, jerga técnica |
| Visual | Calmo, limpio, con pulso artístico | Neón agresivo, stock photos, ruido visual |

### Público
Jóvenes y adultos 18–40 en Rosario (y extensión BA). Fatiga de pantallas. Mobile-first.

---

## 2. Voz y microcopy

### Principios
- Frases cortas. Una idea por línea.
- Verbos de acción: *Elegí*, *Descubrí*, *Salí*, *Iniciá*.
- Hablar de **cómo querés volver a casa**, no solo del evento.
- Evitar culpa digital; invitar sin moralizar.

### Ejemplos aprobados
| Contexto | Copy |
|----------|------|
| Home / CTA | Iniciar el viaje |
| Paso 1 | ¿Qué necesitás sentir hoy? |
| Carga | Buscando eventos, clima y planes cerca… |
| Sin eventos | No hay eventos culturales ahora. Mirá los planes cerca. |
| Clima frío | Salí abrigado: hace frío. |
| Error | No pudimos armar tu salida en este momento. |

### Evitar
- “Enviar formulario”, “Submit”, “Explorar catálogo”
- “¡No te lo pierdas!” (FOMO)
- “Gratis” sin dato confirmado

---

## 3. Sistema de color

### Diagnóstico (estilo actual — *Noche calmada*)
El fondo `#101210` y las cards `#141614` están muy cerca en luminosidad (~4% de diferencia). El texto secundario `#969b94` sobre fondo oscuro cumple AA en cuerpo, pero **las superficies se pierden entre sí** y el acento verde no “respira”.

### Dirección recomendada: contraste por superficie clara
Mantener el **fondo oscuro** como lienzo nocturno y elevar el contenido con **blanco cálido** (no blanco puro `#FFFFFF`, que fría la marca).

```
Superficie oscura (lienzo)     →  #101210
Superficie elevada (cards)     →  #F1EDE4  ← blanco cálido
Texto sobre oscuro             →  #F1EDE4 / #E9E5DC
Texto sobre claro              →  #101210 / #2A2F2B
Bordes / líneas                →  #303530 (oscuro) / #D8D2C6 (claro)
```

**Por qué funciona:** el salto oscuro → claro genera jerarquía sin abandonar la calma. El acento de energía pasa a ser **borde + icono + CTA**, no el relleno entero de la card.

### Paleta de acentos — energías del Viaje
Cada energía tiene un acento propio. Son **sutiles y orgánicos**, no semáforo.

| Energía | Token | Hex | Uso |
|---------|-------|-----|-----|
| Desenchufarme | `--color-desenchufarme` | `#79C995` | Calma, aire, verde salvia |
| Sentirlo | `--color-sentirlo` | `#D98C7D` | Emoción, coral suave |
| Conectar | `--color-conectar` | `#D8BE67` | Calor humano, ámbar |
| Misterio | `--color-misterio` | `#A99AC7` | Sorpresa, lavanda |

### Variación monocromática (alternativa)
Para estados hover, bordes y fondos tintados sin sumar colores:

```
--acento-10:  color-mix(in srgb, var(--color-card) 10%, transparent)
--acento-25:  color-mix(in srgb, var(--color-card) 25%, transparent)
--acento-100: var(--color-card)
```

### Variación complementaria (acento de acción)
El verde salvia `#79C995` complementa hacia coral `#D98C7D` (ya presente en Sentirlo). Regla: **un solo acento dominante por pantalla**; el complementario solo en hover, ilustración o CTA secundario.

| Rol | Color |
|-----|-------|
| Primario (CTA) | Energía activa del paso |
| Complemento | Tono opuesto emocional (verde ↔ coral) |
| Neutro | Blanco cálido + grises |

### Accesibilidad (objetivo AA)
| Combinación | Ratio aprox. | Estado |
|-------------|--------------|--------|
| `#F1EDE4` sobre `#101210` | ~14:1 | ✅ Títulos |
| `#101210` sobre `#F1EDE4` | ~14:1 | ✅ Texto en cards claras |
| `#969B94` sobre `#101210` | ~5.5:1 | ✅ Secundario |
| `#79C995` sobre `#101210` | ~6:1 | ✅ Acento grande |
| `#79C995` sobre `#F1EDE4` | ~2.5:1 | ⚠️ Solo decorativo, no texto body |

---

## 4. Tipografía

| Rol | Familia | Peso | Tamaño mín. |
|-----|---------|------|-------------|
| Display / H1 | Inter | 600 | 28px mobile → 40px desktop |
| H2 pasos | Inter | 600 | 22px |
| Cuerpo | Inter | 400 | **16px** (nunca menos) |
| Meta / ayuda | Inter | 400 | 14px (solo secundario) |
| Eyebrow | Inter | 400 | 12–13px, uppercase opcional |

- Una familia sans (Inter) — alineado al plan del TP.
- Alternativa futura display: **Poppins** solo en titulares si se busca más carácter.

---

## 5. Componentes

### Cards de energía / plan
- Radio: `24px`
- Borde: `1px solid` línea neutra; al hover/foco → borde acento
- Fondo propuesto: `#F1EDE4` (elevada) o transparente sobre oscuro en v1
- Ilustración SVG con trazos animados (`pathLength`, `--color-card`)
- Icono + título + una línea de apoyo

### Tarjetas de evento
- Máx. 6 resultados
- Título ~64 caracteres, descripción ~90
- Meta: distancia · etiquetas · entrada **solo si confirmada**
- Acciones: Cómo llegar · Ver más

### CTA principal
```
Fondo: var(--color-card)
Texto: var(--fondo-principal)  /* oscuro sobre acento */
Hover: translateY(-2px) + sombra suave
```

### Clima (banner)
- Fondo: `--acento-10`
- Temperatura grande + consejo en una línea

---

## 6. Ilustración y motion

### Estilo actual (*Trazos vivos*)
- SVG stroke, sin rellenos pesados
- Animación CSS: `stroke-dashoffset`, pulso en carga
- `prefers-reduced-motion`: desactivar animaciones

### Límites
- Sin autoplay de video en home
- Sin partículas que compitan con el contenido
- Animación = guía de atención, no decoración vacía

---

## 7. Dos líneas de interfaz (decisión de producto)

### Línea A — *Noche calmada* (producción actual)
- Fondo oscuro, cards oscuras o mixtas
- JS vanilla + CSS
- Prioridad: velocidad, checklist TP, accesibilidad
- **Mejora inmediata:** cards claras `#F1EDE4` sobre fondo `#101210`

### Línea B — *Salida editorial* (exploración)
- Misma estructura de El Viaje, distinta atmósfera
- Superficie clara dominante, acentos más presentes
- Librerías JS para prototipo: **GSAP** (entrada escalonada) + fondo generativo ligero (canvas/CSS)
- Objetivo: validar si un look más artístico comunica mejor “cultura” sin subir carga cognitiva
- **No reemplaza** la línea A hasta medir: tiempo de carga, comprensión en test con usuarios

| Criterio | Línea A | Línea B |
|----------|---------|---------|
| Carga | < 3 s ✅ | Vigilar peso CDN |
| TP (vanilla) | ✅ Entrega | Exploración paralela |
| Contraste | Mejora con cards claras | Nativo |
| Diferenciación | Sobria | Más memorable |

**Recomendación:** aplicar contraste (cards claras) en la **línea A** ya; mantener **línea B** en `exploracion-arte.html` para probar con amigos y elegir con datos, no solo gusto.

---

## 8. Tokens CSS (implementación)

```css
:root {
    /* Superficies */
    --fondo-principal: #101210;
    --fondo-elevado: #F1EDE4;
    --fondo-card: #F1EDE4;          /* propuesta v1.1 */
    --fondo-card-hover: #E8E2D6;
    --linea: #303530;
    --linea-clara: #D8D2C6;

    /* Texto */
    --texto-principal: #E9E5DC;
    --texto-titulo: #F1EDE4;
    --texto-secundario: #969B94;
    --texto-sobre-claro: #101210;
    --texto-secundario-claro: #4A524C;

    /* Energías */
    --color-desenchufarme: #79C995;
    --color-sentirlo: #D98C7D;
    --color-conectar: #D8BE67;
    --color-misterio: #A99AC7;

    /* Motion */
    --anim-rapida: 180ms;
    --anim-media: 420ms;
    --anim-easing: cubic-bezier(0.2, 0.8, 0.2, 1);
}
```

---

## 9. Redes y compartir (futuro)

- Sin botones “Seguir en Instagram”
- `og:title`, `og:description`, `og:image` por evento
- Botón: **Invitar a un amigo a salir** → WhatsApp con preview de tarjeta

---

## 10. Checklist de coherencia

Antes de publicar una pantalla nueva:

- [ ] ¿Se puede completar en menos de 4 interacciones?
- [ ] ¿El contraste de texto cumple AA?
- [ ] ¿Hay un solo CTA dominante?
- [ ] ¿Los acentos respetan la energía elegida?
- [ ] ¿`prefers-reduced-motion` está contemplado?
- [ ] ¿Evitamos datos no verificados (precio, horario)?

---

*Documento vivo — actualizar cuando se defina la línea visual ganadora (A o B).*
