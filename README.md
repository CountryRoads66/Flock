# Flock

**Flock** to aplikacja społecznościowa do dzielenia się wpisami, poznawania ludzi i rozmów w jednym miejscu.

## Możliwości

- profile użytkowników, obserwowanie i zaproszenia do znajomych
- publikowanie postów, komentarze i polubienia
- prywatne wiadomości oraz powiadomienia aktualizowane w czasie rzeczywistym
- jasny i ciemny motyw

## Technologie

- React, TypeScript i React Router
- Node.js, Express i Socket.IO
- MySQL

## Wymagania

- Node.js i npm
- lokalny serwer MySQL z przygotowanym schematem bazy

Opis tabel i relacji znajduje się w [backend/database.md](backend/database.md). Backend nie tworzy schematu ani migracji automatycznie.

## Konfiguracja

1. Zainstaluj zależności z katalogu głównego projektu:

   ```powershell
   npm install
   ```

2. Zainstaluj zależności backendu:

   ```powershell
   npm --prefix backend install
   ```

3. Skopiuj `backend/.env.example` do `backend/.env` i wpisz dane swojej bazy MySQL oraz własny sekret `ACCESS_TOKEN`.

Backend łączy się z MySQL na `127.0.0.1`. API nasłuchuje na porcie `5000`; serwer statycznego frontendu domyślnie używa portu `3000`.

## Uruchamianie lokalne

Uruchom poniższe polecenia w dwóch osobnych oknach PowerShell, z katalogu głównego projektu.

Okno 1 — backend API:

```powershell
npm --prefix backend start
```

Okno 2 — frontend w trybie developerskim:

```powershell
npm start
```

Frontend korzysta z proxy API skonfigurowanego w `package.json`.

## Build i podgląd wersji produkcyjnej

Zbuduj frontend:

```powershell
npm run build
```

Następnie uruchom serwer plików statycznych:

```powershell
npm --prefix backend run start:frontend
```

Aplikacja będzie dostępna lokalnie pod adresem `http://localhost:3000`.

## Testy

Testy backendu:

```powershell
npm --prefix backend test
```

Testy frontendu:

```powershell
npm test -- --watchAll=false
```

## Wystawienie strony publicznie

Opcjonalnie możesz udostępnić lokalną aplikację przez Cloudflare Tunnel. Wymaga to zainstalowanego `cloudflared` oraz własnej konfiguracji tunelu w `%USERPROFILE%\.cloudflared\config.yml`. Przed uruchomieniem tunelu zbuduj frontend i uruchom backend oraz serwer frontendu.
