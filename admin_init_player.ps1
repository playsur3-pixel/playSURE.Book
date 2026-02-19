# =========================
# playSURE Book - Create User (PROD)
# =========================

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
} | ConvertTo-Json

try {
  $res = Invoke-RestMethod -Method Post -Uri $uri `
    -Headers @{ "x-admin-secret" = $admin } `
    -ContentType "application/json" -Body $body

  Write-Host "✅ OK: user créé ->" $res.username
}
catch {
  Write-Host "❌ ERREUR:"
  if ($_.Exception.Response -and $_.Exception.Response.GetResponseStream()) {
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $msg = $reader.ReadToEnd()
    Write-Host $msg
  } else {
    Write-Host $_
  }
}
