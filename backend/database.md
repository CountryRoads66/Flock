# Dokumentacja bazy danych

Aplikacja korzysta z bazy MySQL. Połączenie jest konfigurowane w pliku [backend/db.js](db.js) i odczytuje parametry z zmiennych środowiskowych:

- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_NAME`
- `PORT` (opcjonalnie, używane przez backend)
- `ACCESS_TOKEN` (token JWT wykorzystywany przez uwierzytelnianie)

Przykładowy plik konfiguracyjny znajduje się w [backend/.env.example](.env.example).

## Architektura bazy

Backend tworzy pojedyncze połączenie MySQL i używa go we wszystkich endpointach. Nie ma osobnej warstwy ORM ani migracji; schemat jest definiowany w rzeczywistej instancji bazy i utrzymywany manualnie.

Najważniejsze założenia:
- aplikacja operuje na jednym serwerze MySQL lokalnym (`127.0.0.1`)
- identyfikatory użytkowników i relacji są przechowywane jako `INT` z auto-increment
- identyfikator profilu użytkownika (`profileId`) jest używany w URL i jako unikalny identyfikator widoczny po stronie klienta
- backend korzysta z zapytań SQL bezpośrednio, dlatego nazwy kolumn muszą być spójne z zapytaniami w routach

## Główne tabele

### users
Tabela przechowuje dane użytkowników i profil.

Najważniejsze kolumny:
- `id` — unikalny identyfikator użytkownika
- `username` — nazwa użytkownika używana do logowania i wyszukiwania
- `displayName` — nazwa wyświetlana w interfejsie
- `password` — hasło użytkownika
- `profileId` — identyfikator profilu używany w URL i po stronie klienta
- `profilePicture` — ścieżka do zdjęcia profilowego
- `description` — krótki opis profilu

Zastosowanie:
- logowanie i uwierzytelnianie
- podgląd profilu, wyszukiwanie i listy znajomych
- powiązania z postami, komentarzami i powiadomieniami

### posts
Tabela przechowuje wpisy publikowane przez użytkowników.

Najważniejsze kolumny:
- `id` — identyfikator wpisu
- `text` — treść posta
- `userID` — właściciel posta
- `postId` — dodatkowy identyfikator wykorzystywany przez frontend i logikę API
- `creationTime` — czas utworzenia wpisu

Zastosowanie:
- lista wpisów na feedzie
- powiązania z komentarzami i polubieniami
- wyświetlanie profili użytkownika z historią wpisów

### comments
Tabela przechowuje komentarze dodawane do postów.

Najważniejsze kolumny:
- `id` — identyfikator komentarza
- `postId` — odniesienie do posta
- `userId` — autor komentarza
- `text` — treść komentarza
- `createdAt` — data utworzenia komentarza

Zastosowanie:
- komentarze pod wpisami
- notyfikacje o aktywności
- odczyt i podgląd wątków komentarzy

### followers
Tabela reprezentuje relację obserwowania użytkownika przez użytkownika.

Najważniejsze kolumny:
- `id` — identyfikator relacji
- `followerId` — użytkownik, który obserwuje
- `followingId` — użytkownik obserwowany

Zastosowanie:
- listy obserwujących i obserwowanych
- statystyki profilu
- logika „follow/unfollow”

### friend_requests
Tabela przechowuje zaproszenia do znajomych.

Najważniejsze kolumny:
- `id` — identyfikator zaproszenia
- `senderId` — użytkownik wysyłający zaproszenie
- `recipientId` — odbiorca zaproszenia
- `status` — status zaproszenia (`pending`, `accepted`, `rejected`)

Zastosowanie:
- wysyłanie, akceptowanie i odrzucanie zaproszeń
- powiadomienia o aktywności społecznej
- kontrola zduplikowanych zaproszeń

### messages
Tabela przechowuje wiadomości prywatne między użytkownikami.

Najważniejsze kolumny:
- `id` — identyfikator wiadomości
- `senderId` — nadawca
- `recipentId` — odbiorca
- `text` — treść wiadomości

Uwaga:
- kolumna `recipentId` jest nazwana z literówką, ale jest używana w całym backendzie i musi pozostać zgodna z zapytaniami SQL.

Zastosowanie:
- prywatne wiadomości między profilami użytkowników
- odświeżanie czatu w czasie rzeczywistym via Socket.IO
- lista konwersacji i odbiorców

### likes
Tabela przechowuje polubienia wpisów.

Najważniejsze kolumny:
- `id` — identyfikator polubienia
- `postId` — wpis, który został polubiony
- `userId` — użytkownik, który dodał polubienie

Zastosowanie:
- odczyt liczby polubień dla wpisu
- przełączanie stanu like/unlike
- profil użytkownika z listą polubionych postów

### notifications
Tabela przechowuje powiadomienia użytkowników.

Najważniejsze kolumny:
- `id` — identyfikator powiadomienia
- `userId` — odbiorca powiadomienia
- `fromUserId` — użytkownik, który wywołał zdarzenie
- `type` — typ zdarzenia, np. `comment`, `follow`, `friend_request`, `friend_accept`
- `postId` — opcjonalny identyfikator posta powiązanego ze zdarzeniem
- `message` — tekst wyświetlany użytkownikowi
- `isRead` — flaga informująca o przeczytaniu
- `createdAt` — data utworzenia powiadomienia

Zastosowanie:
- aktualizacja listy powiadomień po aktywnościach użytkownika
- synchronizacja z Socket.IO
- wyświetlanie nieprzeczytanych wpisów w panelu użytkownika

## Relacje między tabelami

Relacje w praktyce są utrzymywane logicznie przez backend i zapytania SQL:

- `posts.userID` -> `users.id`
- `comments.postId` -> `posts.id`
- `comments.userId` -> `users.id`
- `followers.followerId` -> `users.id`
- `followers.followingId` -> `users.id`
- `friend_requests.senderId` -> `users.id`
- `friend_requests.recipientId` -> `users.id`
- `messages.senderId` -> `users.id`
- `messages.recipentId` -> `users.id`
- `likes.postId` -> `posts.id`
- `likes.userId` -> `users.id`
- `notifications.userId` -> `users.id`
- `notifications.fromUserId` -> `users.id`
- `notifications.postId` -> `posts.id` (opcjonalnie)

## Wzorce zapytań używane w backendzie

Backend wykonuje zapytania CRUD bezpośrednio w MySQL:

- `SELECT` do odczytu profili, wpisów, komentarzy, powiadomień i relacji
- `INSERT` do tworzenia użytkowników, postów, komentarzy, klientów i powiadomień
- `UPDATE` do oznaczania powiadomień jako przeczytanych i akceptacji zaproszeń
- `DELETE` do usuwania komentarzy, obserwacji, polubień i zaproszeń w określonych warunkach

Typowe przykłady z kodu backendu:

```sql
SELECT * FROM users WHERE username = ?;
SELECT p.id, p.text FROM posts p INNER JOIN users u ON p.userID = u.id ORDER BY p.id DESC;
INSERT INTO comments(postId, userId, text) VALUES(?,?,?);
INSERT INTO notifications(userId, fromUserId, type, message) VALUES(?,?,?,?);
UPDATE notifications SET isRead = 1 WHERE id = ? AND userId = ?;
DELETE FROM followers WHERE followerId = ? AND followingId = ?;
```

## Dodatkowe uwagi operacyjne

- Backend nie tworzy migracji automatycznie; każda zmiana schematu musi być wdrożona ręcznie w bazie MySQL.
- W wielu endpointach wykonywane są walidacje danych przed zapisem do bazy.
- Po stworzeniu lub odczytaniu powiadomień backend może emitować zdarzenia Socket.IO do użytkowników powiązanych z danym widokiem.
- Warto zachować spójność nazw kolumn między SQL w kodzie a rzeczywistym schematem bazy, ponieważ backend korzysta z nazw bezpośrednio.

## Rekomendacje utrzymaniowe

- dodawać indeksy na kolumny używane w `WHERE`, `JOIN`, `ORDER BY` i `GROUP BY` (np. `posts.userID`, `comments.postId`, `followers.followingId`, `notifications.userId`, `likes.postId`)
- dokumentować każdą aktualizację schematu przed wdrożeniem na środowisko produkcyjne
- utrzymywać unikalność kluczy biznesowych, takich jak `profileId`, `username` lub relacji typu follow/friend request
- regularnie sprawdzać zgodność modelu danych z rzeczywistym kodem backendu
