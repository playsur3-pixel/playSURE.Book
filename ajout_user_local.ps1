$admin = "3v4dktwj;)"
$uri   = "http://localhost:8888/.netlify/functions/admin_init_player"

$body = @{ pseudo="playSURE"; password="romainlg" } | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri $uri -Headers @{ "x-admin-secret" = $admin } `
  -ContentType "application/json" -Body $body
