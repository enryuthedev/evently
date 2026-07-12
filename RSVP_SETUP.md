# RSVP-Link zum Laufen bringen

Der Link `https://<deine-domain>/rsvp/<token>` öffnet die Einladungsseite im
Browser (Karte + „Komme / Vielleicht / Kann nicht") und speichert die Antwort.
Damit das funktioniert, brauchst du **einmalig** zwei Dinge: ein Supabase-Backend
und einen Web-Deploy. Der App-Code ist bereits verdrahtet.

## 1. Supabase-Projekt (Backend)

1. Auf [supabase.com](https://supabase.com) kostenloses Projekt anlegen.
2. **SQL Editor** → Inhalt von `supabase/schema.sql` einfügen → **Run**.
   Legt Tabellen `events` / `guests` + die Gast-Funktionen `event_by_token`
   und `submit_rsvp` an.
3. **Authentication → Providers → Anonymous** aktivieren.
   (Der Host wird beim ersten Teilen anonym eingeloggt — kein Login-Screen nötig.
   Siehe `ensureHost()` in `lib/supabase/auth.ts`.)
4. **Project Settings → API** → `Project URL` und `anon public` key kopieren.

## 2. `.env` anlegen

`.env.example` nach `.env` kopieren und ausfüllen:

```
EXPO_PUBLIC_SUPABASE_URL=https://DEIN-PROJEKT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=DEIN-ANON-KEY
```

Diese Werte werden in den Web-Bundle inlined (anon key ist öffentlich = ok).
Nach dem Anlegen App / Web-Build neu starten.

## 3. Web deployen

Statischer SPA-Build (expo-router, `output: "single"` in `app.json`).

**Vercel (empfohlen):**
```
npm i -g vercel
vercel            # erstes Deploy, dann Env-Vars im Vercel-Dashboard setzen:
                  # EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY
vercel --prod
```
`vercel.json` liegt bereit: baut mit `expo export -p web`, Output `dist/`, und
leitet **alle** Pfade auf `index.html` um — sonst gibt ein direkter Aufruf von
`/rsvp/<token>` einen 404 (die eigentliche Ursache des schwarzen Screens: unter
`evently.app` lag noch keine Seite).

**Netlify-Alternative:** Build `npx expo export -p web`, Publish `dist`, und eine
`dist/_redirects` mit `/*  /index.html  200`.

## 4. Domain

Eigene Domain (z. B. `evently.app`) im Host (Vercel/Netlify) verbinden. Der
Link-Präfix steht in `lib/utils/share.ts` → `RSVP_BASE_URL`. Auf die eigene
Domain anpassen, falls nicht `evently.app`.

## Was der Code jetzt macht

- Teilen/Kopieren/QR publizieren das Event zuerst nach Supabase
  (`usePublishEvent` in `lib/store/usePublish.ts`) und bauen den Link mit dem
  **Server-`share_token`** statt der lokalen Geräte-ID. Nur so kann ein Gast auf
  einem anderen Gerät das Event auflösen.
- Ohne Supabase (`.env` fehlt) fällt alles auf die lokale ID zurück → Link
  funktioniert dann nur in der Host-Vorschau, nicht für externe Gäste.
- Alte Links mit `evt-…`-Token (vor diesem Fix erzeugt) funktionieren **nicht** —
  das Event neu teilen, um einen echten Token-Link zu bekommen.
