"""Genera la voz (ElevenLabs) con tiempos por palabra.

Uso:  python3 tools/voz.py <nombre> <voice_id> <guion.json> [modelo] [velocidad]
Ej.:  python3 tools/voz.py avion_eric cjVigY5qzO86Huf0OWal tools/guiones/avion.json eleven_flash_v2_5 1.17

La API key NO va aquí: en las sesiones de Claude se guarda con la ventana segura
(request_credential, host api.elevenlabs.io) y el proxy la inyecta solo.
Escribe public/voces/<nombre>.mp3 y <nombre>.json (palabras y segmentos con tiempos).
"""
import base64, json, os, sys, urllib.error, urllib.request

nombre, voice_id, guion = sys.argv[1], sys.argv[2], sys.argv[3]
modelo = sys.argv[4] if len(sys.argv) > 4 else "eleven_flash_v2_5"
velocidad = float(sys.argv[5]) if len(sys.argv) > 5 else 1.08
base = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")

seg = json.load(open(guion))
body = {
    "text": " ".join(seg),
    "model_id": modelo,
    "language_code": "es",
    "voice_settings": {"stability": 0.45, "similarity_boost": 0.75, "style": 0.35, "use_speaker_boost": True, "speed": velocidad},
}
req = urllib.request.Request(
    f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps?output_format=mp3_44100_128",
    data=json.dumps(body).encode(),
    headers={"Content-Type": "application/json"},
)
try:
    r = json.load(urllib.request.urlopen(req))
except urllib.error.HTTPError as e:
    print(nombre, e.code, e.read()[:300])
    sys.exit(1)

os.makedirs(os.path.join(base, "public", "voces"), exist_ok=True)
open(os.path.join(base, "public", "voces", nombre + ".mp3"), "wb").write(base64.b64decode(r["audio_base64"]))
al = r["alignment"]
ch, st, en = al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]
palabras, cur, s0, e0 = [], "", None, None
for c, a, b in zip(ch, st, en):
    if c in " \n":
        if cur:
            palabras.append({"t": cur, "s": s0, "e": e0})
            cur, s0 = "", None
    else:
        if s0 is None:
            s0 = a
        cur += c
        e0 = b
if cur:
    palabras.append({"t": cur, "s": s0, "e": e0})
inicios, pos = [], 0
for s in seg:
    inicios.append(st[pos])
    pos += len(s) + 1
json.dump(
    {"voz": nombre, "duracion": en[-1], "palabras": palabras, "segmentos": [{"texto": t, "inicio": i} for t, i in zip(seg, inicios)]},
    open(os.path.join(base, "public", "voces", nombre + ".json"), "w"),
    ensure_ascii=False,
)
print(nombre, "ok", round(en[-1], 1), "s", len(palabras), "palabras")
