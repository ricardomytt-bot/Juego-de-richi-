---
name: y-si-te-digo-que
description: Crea un video vertical corto de dato curioso para el canal "¿Y si te digo que…?" (TikTok, Reels, Shorts). Investiga y verifica el dato, escribe el guion en formato montaña rusa, genera la voz con ElevenLabs, produce el video con Remotion (carpeta video-studio) y entrega el link de descarga. Úsalo cuando pidan un video de datos curiosos o el siguiente video del canal.
---

# /y-si-te-digo-que

Responde siempre **en español, corto, con emojis y esquemas/tablas**. El usuario prefiere mensajes breves y fáciles de leer.

## 1. Tema
- Si no hay tema, propone **4 a 8 ideas** (tabla: gancho + por qué engancha) y recomienda una. Prioriza datos que **casi nadie sabe**, para público joven; si piden "actual", búscalo en la web.
- Si el usuario rechaza una idea, no la defiendas: cambia de tema por completo.

## 2. Investigar y verificar (obligatorio)
- Usa WebSearch. Contrasta con varias fuentes; desconfía de blogs de baja calidad y de datos virales sin fuente.
- Separa en una tabla **✅ verificado / ⚠️ discutido / ❌ no confirmado**. Lo no confirmado **no entra al guion**.
- No nombres marcas ni empresas acusándolas sin fuente oficial. Pon avisos de "no afiliado" cuando el tema sea una marca.
- Si una página no se pudo abrir (red bloqueada), dilo claramente y di qué fuente se usó en su lugar.
- Si usas un ejemplo inventado en pantalla, ponle la etiqueta "EJEMPLO".

## 3. Guion (35–45 s, ~100–140 palabras)
Estructura de **montaña rusa**; el espectador siempre siente que viene algo más, **sin repetir "pero hay más" de forma literal**:

1. 🎣 **Gancho**: empieza SIEMPRE con **"¿Y si te digo que…?"** + una afirmación sorprendente, en pregunta.
2. ❓ **¿Por qué?**: pregunta de curiosidad y explicación corta.
3. 🔁 **Giro natural** ("De hecho…", "Y aquí viene lo curioso…", "¿Y la historia?") → nueva pregunta → explicación. Repetir 1–2 veces, subiendo y bajando el interés.
4. ✅ **Conclusión** corta, que responda al gancho.
5. 📲 **Cierre fijo**: "¡Sígueme para más datos que casi nadie sabe, y compártelo con …!"

Muestra el guion al usuario antes de producir cuando el tema sea nuevo o dudoso.

## 4. Voz (ElevenLabs)
- Voz del canal: **Eric** (`cjVigY5qzO86Huf0OWal`). Modelo **`eleven_flash_v2_5`** (gasta la mitad de créditos), `language_code: es`, velocidad **1.08–1.17** (más rápido si lo piden).
- La API key se pide con la ventana segura (`request_credential`, host `api.elevenlabs.io`, header `xi-api-key`). **Nunca** pidas ni uses una key pegada en el chat; si el usuario la pegó, avísale que la borre al terminar.
- Plan gratis: solo voces *premade* (las de biblioteca dan error de pago).
- Genera con `video-studio/tools/voz.py` (guarda `.mp3` y `.json` con tiempos por palabra). Avisa cuántos créditos gastó y cuántos quedan (aprox. 0.5 créditos por carácter con Flash).
- Si la voz queda más larga de lo deseado, se puede acelerar con `ffmpeg -filter:a atempo=1.07` y reescalar los tiempos del `.json`, sin gastar créditos.

## 5. Producción
- Proyecto: `video-studio/` (Remotion, 1080×1920, 30 fps). Lee su `README.md`. Un video = un componente en `src/` + una `<Composition>` en `src/Root.tsx`, armado con `Kit.tsx` (`Video`, `Def`) y los tiempos del `.json` de la voz.
- **Solo efectos de sonido y voz** (sin música) salvo que el usuario mande una canción o la pida. Efectos en `public/sfx/` (se regeneran con `tools/audio*.py`), sincronizados con cada cambio de escena y cada golpe de zoom.
- **Zonas seguras** (TikTok/YouTube tapan arriba y abajo): título entre y=300–560, visual entre y=600–1150, subtítulos desde y=1240. Nada importante en el borde derecho bajo y=1000. Texto con buen contraste.
- Nada de logos, personajes ni arte oficial de terceros: usa gráficos propios y genéricos.
- Prueba primero con `--scale=0.5` y revisa una hoja de contacto de fotogramas (cortes de texto, solapes con subtítulos). Corrige y luego renderiza el final.
- Comprime con `ffmpeg -c:v libx264 -crf 25 -c:a aac -movflags +faststart`.

## 6. Entrega
- Sube el MP4 a `videos/` en el repo (rama de trabajo de la sesión) y envíalo con SendUserFile.
- **Termina el mensaje con el link de descarga** de GitHub:
  `https://github.com/<dueño>/<repo>/blob/<rama>/videos/<archivo>.mp4` + pasos: abrir en Safari → "View raw" → Compartir → "Guardar vídeo".
- Incluye: duración, voz usada, qué datos se verificaron y cuáles no, créditos restantes, hashtags/pregunta para la descripción y el recordatorio de **borrar la API key** al terminar.

Para el estilo visual de palitos usa también `/stick-figure`.
