$maxWait = 900
$elapsed = 0
Write-Host "Monitoring build progress..."
while ($elapsed -lt $maxWait) {
    Start-Sleep -Seconds 30
    $elapsed += 30
    if (Test-Path .next\routes-manifest.json) {
        Write-Host "Build complete! Starting server..."
        $env:NODE_ENV="production"
        pnpm next start -p 5001
        break
    } else {
        Write-Host "[$([math]::Floor($elapsed/60)):$($($elapsed%60).ToString('00'))] Building..."
    }
}
