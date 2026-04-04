$apiUrl = "https://jkt48.com/api/v1/members?lang=id"
$saveDir = "e:\Project\single-html\48\assets\img"
New-Item -ItemType Directory -Force -Path $saveDir | Out-Null

$headers = @{ "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
$response = Invoke-RestMethod -Uri $apiUrl -Headers $headers -Method Get

foreach ($member in $response.data) {
    if (-not [string]::IsNullOrWhiteSpace($member.photo)) {
        $photoUrl = $member.photo
        if ($photoUrl.StartsWith("//")) { $photoUrl = "https:" + $photoUrl }
        elseif ($photoUrl.StartsWith("/")) { $photoUrl = "https://jkt48.com" + $photoUrl }
        
        # Clean filename characters
        $safeName = $member.name -replace '[\\/*?:"<>|]', ''
        $safeName = $safeName.Trim()
        $savePath = Join-Path -Path $saveDir -ChildPath "$safeName.jpg"
        
        Write-Host "Downloading $safeName..."
        try {
            Invoke-WebRequest -Uri $photoUrl -Headers $headers -OutFile $savePath -UseBasicParsing | Out-Null
        } catch {
            Write-Host "Failed to download ${safeName} with error: $_"
        }
        # Be gentle to server
        Start-Sleep -Milliseconds 100
    }
}
Write-Host "Done!"
