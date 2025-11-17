# Clean Swap directory, keep only files needed by StableLiquidity
$swapPath = "apps\web\src\views\Swap"

# Files/directories to keep
$keepItems = @(
    "hooks\useStableConfig.ts",
    "hooks\useEstimatedAmount.ts",
    "components\SwapWarningModal",
    "components\styleds.tsx",
    "components\SlippageButton.tsx"
)

# Directories to remove
$dirsToRemove = @(
    "Bridge",
    "V3Swap",
    "Twap",
    "x"
)

# Files to remove (in components directory)
$filesToRemove = @(
    "components\AddressInputPanel.tsx",
    "components\AdvancedSwapDetailsDropdown.tsx",
    "components\Chart",
    "components\ConfirmRemoveLiquidityModal.tsx",
    "components\ConfirmSwapModalContainer.tsx",
    "components\CurrencyInputHeader.tsx",
    "components\FormattedPriceImpact.tsx",
    "components\ProgressSteps.tsx",
    "components\RouterViewer.tsx",
    "components\SwapModalHeader.tsx",
    "components\SwapModalHeaderV2.tsx",
    "components\SwapRoute.tsx",
    "components\SwapSelection.tsx",
    "components\SwapTransactionErrorContent.tsx"
)

# Other files to remove
$otherFilesToRemove = @(
    "styles.tsx",
    "SwapFeaturesContext.tsx",
    "SwapLayout.tsx",
    "types.ts",
    "utils.ts"
)

Write-Host "Cleaning Swap directory..." -ForegroundColor Cyan

# Remove directories
foreach ($dir in $dirsToRemove) {
    $fullPath = Join-Path $swapPath $dir
    if (Test-Path $fullPath) {
        try {
            Remove-Item -Recurse -Force $fullPath -ErrorAction Stop
            Write-Host "Deleted directory: $dir" -ForegroundColor Green
        } catch {
            Write-Host "Failed to delete directory: $dir - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

# Remove files in components
foreach ($file in $filesToRemove) {
    $fullPath = Join-Path $swapPath $file
    if (Test-Path $fullPath) {
        try {
            Remove-Item -Recurse -Force $fullPath -ErrorAction Stop
            Write-Host "Deleted: $file" -ForegroundColor Green
        } catch {
            Write-Host "Failed to delete: $file - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

# Remove other files
foreach ($file in $otherFilesToRemove) {
    $fullPath = Join-Path $swapPath $file
    if (Test-Path $fullPath) {
        try {
            Remove-Item -Force $fullPath -ErrorAction Stop
            Write-Host "Deleted: $file" -ForegroundColor Green
        } catch {
            Write-Host "Failed to delete: $file - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

# Remove unused hooks
$hooksToRemove = @(
    "hooks\useFeeSaved.ts",
    "hooks\useRefreshBlockNumber.ts",
    "hooks\useWarningImport.tsx"
)

foreach ($file in $hooksToRemove) {
    $fullPath = Join-Path $swapPath $file
    if (Test-Path $fullPath) {
        try {
            Remove-Item -Force $fullPath -ErrorAction Stop
            Write-Host "Deleted: $file" -ForegroundColor Green
        } catch {
            Write-Host "Failed to delete: $file - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host "`nSwap directory cleanup completed!" -ForegroundColor Cyan
Write-Host "Kept files needed by StableLiquidity:" -ForegroundColor Yellow
foreach ($item in $keepItems) {
    Write-Host "  - $item" -ForegroundColor Gray
}

