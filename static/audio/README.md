# Recorded prompt clips (placeholders)

Section 10.6: when the phone has no speech voice for the current language, the capture screen plays short clips from `/audio/{en,sw}/{key}.mp3` (≤ 15 KB each, recorded by a native speaker — **[CONFIRM]**).

No recordings are shipped yet. To add one, put the file at `static/audio/<lang>/<key>.mp3` and add `<key>` to the language's list in `manifest.json`. The keys and texts are the `capture.msg.*`, `capture.say.*` and `setup.*.say` strings in `src/lib/i18n/messages/client.{en,sw}.ts` (key = the part after the last dot).
