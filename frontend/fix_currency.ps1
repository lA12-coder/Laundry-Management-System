$files = Get-ChildItem -Path "src" -Recurse -Include "*.jsx","*.js"
foreach ($f in $files) {
    $content = Get-Content $f.FullName -Raw
    if ($content -match "KSh ") {
        $content = $content -replace "KSh ", "ETB "
        Set-Content -Path $f.FullName -Value $content -NoNewline
        Write-Host "Fixed: $($f.Name)"
    }
}
Write-Host "Currency replacement complete."
