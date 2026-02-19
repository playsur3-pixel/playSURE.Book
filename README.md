# playSURE Book (starter)

Base propre : Vite + React + TS + Tailwind + React Router + Netlify Functions + Netlify Blobs.

## 1) Variables d'environnement (Netlify / netlify dev)
- AUTH_JWT_SECRET : une longue clé aléatoire
- AUTH_COOKIE_NAME : playsure_token (ou autre)
- ADMIN_SECRET : secret pour l'init user via PowerShell (x-admin-secret)

## 2) Lancer en local (recommandé)
```bash
npm i
npx netlify dev
```

## 3) Créer un user via PowerShell (admin_init_player)
```powershell
$admin = "TON_ADMIN_SECRET"
$uri   = "http://localhost:8888/.netlify/functions/admin_init_player"

$body = @{ pseudo="playSURE"; password="romainlg" } | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri $uri -Headers @{ "x-admin-secret" = $admin } `
  -ContentType "application/json" -Body $body
```

Ensuite : connecte-toi sur `/login` avec pseudo + password.

## Notes
- Les users sont stockés dans Netlify Blobs : store `playsure-auth`, clé `users.json`.
- L'auth est un cookie HTTPOnly avec JWT (7 jours).
