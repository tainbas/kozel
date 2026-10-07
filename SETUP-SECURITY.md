# Kozel: security and backend setup

## 1. Turn on anonymous sign-in (required)
Firebase console > Build > Authentication > Get started > Sign-in method > Anonymous > Enable > Save.
Then Authentication > Settings > Authorized domains > Add domain: YOUR-USERNAME.github.io

## 2. Publish the security rules (required)
Realtime Database > Rules: copy your current rules somewhere (backup), paste database.rules.json, Publish.
Rollback: paste the backup and Publish.

## 3. Room cleanup on GitHub Actions
1. Firebase console > Project settings > Service accounts > Generate new private key (downloads a JSON file).
   Keep it secret. Never upload it to the repo.
2. GitHub repo > Settings > Secrets and variables > Actions > New repository secret:
   - FIREBASE_SERVICE_ACCOUNT = the whole content of the JSON file
   - FIREBASE_DATABASE_URL = https://kozel-4119e-default-rtdb.europe-west1.firebasedatabase.app
3. GitHub repo > Actions > "Clean up old rooms" > Run workflow (first manual run). Then it runs every 30 minutes.
   Note: GitHub pauses scheduled workflows in repos with no commits for 60 days. Push any small change to restart.

## 4. App Check (optional, recommended)
1. Create a reCAPTCHA v3 key at https://www.google.com/recaptcha/admin (domain: YOUR-USERNAME.github.io).
2. Firebase console > App Check > Apps > your web app > reCAPTCHA v3 > paste the secret key.
3. Put the site key in index.html: const APP_CHECK_SITE_KEY = '...';  upload index.html.
4. Play a few games, check App Check metrics show "verified" requests, then click Enforce for Realtime Database.

## Rules in short
- Only signed-in players. Nobody can list all rooms.
- Room content (game, chat, reactions) readable only by members of that room.
- Only the host writes the game; players can only send moves as themselves; only the host deletes moves.
- Rate limits: 1 room per 10 s per player, moves 4/s, chat 1/s, reactions 1 per 1.2 s.
- Size limits on every field; unknown fields rejected.
