# Batch remove unused views directories
$viewsPath = "apps\web\src\views"

# Batch 1: Most independent modules
$batch1 = @("Gift", "PancakeSquad", "BuyCrypto", "BurnDashboard")

# Batch 2: Game/Entertainment features
$batch2 = @("Lottery", "Predictions", "Nft")

# Batch 3: Community/Governance features
$batch3 = @("Voting", "Teams", "TradingCompetition", "Profile", "ProfileCreation")

# Batch 4: Info pages
$batch4 = @("Info", "V3Info", "InfinityInfo")

# Batch 5: IFO/IDO related
$batch5 = @("Ifos", "IfosV2", "Idos")

# Batch 6: Trading related (be careful)
$batch6 = @("LimitOrders", "Mev", "SwapSimplify")

# Batch 7: Others
$batch7 = @("AffiliatesProgram")

function Remove-Batch {
    param([string[]]$Dirs, [string]$BatchName)
    
    Write-Host "`n========== Batch: $BatchName ==========" -ForegroundColor Yellow
    
    foreach ($dir in $Dirs) {
        $fullPath = Join-Path $viewsPath $dir
        if (Test-Path $fullPath) {
            try {
                Remove-Item -Recurse -Force $fullPath -ErrorAction Stop
                Write-Host "Deleted: $dir" -ForegroundColor Green
                Start-Sleep -Milliseconds 200
            } catch {
                Write-Host "Failed: $dir - $($_.Exception.Message)" -ForegroundColor Red
            }
        } else {
            Write-Host "Not found: $dir" -ForegroundColor Gray
        }
    }
    
    Write-Host "========== Batch $BatchName completed ==========`n" -ForegroundColor Yellow
}

Write-Host "Starting batch removal of views directories..." -ForegroundColor Cyan

Remove-Batch -Dirs $batch1 -BatchName "Batch1-Independent"
Remove-Batch -Dirs $batch2 -BatchName "Batch2-Games"
Remove-Batch -Dirs $batch3 -BatchName "Batch3-Community"
Remove-Batch -Dirs $batch4 -BatchName "Batch4-Info"
Remove-Batch -Dirs $batch5 -BatchName "Batch5-IFO"
Remove-Batch -Dirs $batch6 -BatchName "Batch6-Trading"
Remove-Batch -Dirs $batch7 -BatchName "Batch7-Others"

Write-Host "`nAll batches completed!" -ForegroundColor Cyan
Write-Host "Please run 'pnpm dev' to test." -ForegroundColor Yellow
