# =========================
# playSURE Book - Create User (PROD)
# =========================

# Evite les crash selon le terminal (VSCode/ISE/old console)
try {
  [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
} catch {
  # ignore si l'hôte ne supporte pas
}

# 1) ADMIN SECRET (doit matcher la variable Netlify: ADMIN_SECRET)
$admin = "3v4dktwj;)"

# 2) URL de ton site Netlify (prod)
$site = "https://playsure-book.netlify.app"

# 3) Endpoint function
$uri = "$site/.netlify/functions/admin_init_player"

# 4) User à créer
$pseudo   = "playSURE"
$password = "romainlg"

$body = @{
  pseudo   = $pseudo
  password = $password
} | ConvertTo-Json -Depth 5

try {
  Write-Host "POST $uri"
  Write-Host "pseudo: $pseudo"

  $res = Invoke-RestMethod -Method Post -Uri $uri `
    -Headers @{ "x-admin-secret" = $admin } `
    -ContentType "application/json; charset=utf-8" `
    -Body ([System.Text.Encoding]::UTF8.GetBytes($body))

  Write-Host "OK (réponse):"
  $res | ConvertTo-Json -Depth 10

  if ($res.username) {
    Write-Host "User créé -> $($res.username)"
    Write-Host "⚠️ Connecte-toi avec EXACTEMENT le même pseudo (casse incluse): $($res.username)"
  } else {
    Write-Host "User créé, mais pas de champ 'username' dans la réponse."
  }
}
catch {
  Write-Host "ERREUR"

  if ($_.Exception.Response -and $_.Exception.Response.GetResponseStream()) {
    try {
      $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
      $msg = $reader.ReadToEnd()
      Write-Host $msg
    } catch {
      Write-Host $_
    }
  } else {
    Write-Host $_
  }
}
