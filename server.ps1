param([int]$Port = 8085)

$listener = New-Object System.Net.HttpListener
$prefix = "http://localhost:$Port/"
$listener.Prefixes.Add($prefix)
try {
    $listener.Start()
} catch {
    Write-Output "Listener start failed: $_"
    exit 1
}
Write-Output "HTTP server started on $prefix"

$baseDir = $PSScriptRoot

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $urlPath = [System.Uri]::UnescapeDataString($request.Url.AbsolutePath.TrimStart('/'))
        Write-Host "[$([DateTime]::Now.ToString('HH:mm:ss'))] HTTP $($request.HttpMethod) $urlPath"
        if ($urlPath -eq "api/log") {
            $reader = New-Object System.IO.StreamReader($request.InputStream)
            $logContent = $reader.ReadToEnd()
            [System.IO.File]::WriteAllText((Join-Path $baseDir "bone_log.txt"), $logContent)
            $response.StatusCode = 200
            $response.AddHeader("Access-Control-Allow-Origin", "*")
            $resBytes = [System.Text.Encoding]::UTF8.GetBytes("OK")
            $response.OutputStream.Write($resBytes, 0, $resBytes.Length)
            $response.Close()
            continue
        }
        if ($urlPath -eq "api/screenshot") {
            $reader = New-Object System.IO.StreamReader($request.InputStream)
            $json = $reader.ReadToEnd() | ConvertFrom-Json
            $base64 = $json.image -replace '^data:image/[^;]+;base64,', ''
            $bytes = [System.Convert]::FromBase64String($base64)
            $savePath = Join-Path $baseDir $json.filename
            [System.IO.File]::WriteAllBytes($savePath, $bytes)
            $artifactDir = "C:\Users\admin\.gemini\antigravity-ide\brain\f7149488-21fb-44ea-a546-8c48abab0d78"
            if (Test-Path $artifactDir) {
                [System.IO.File]::WriteAllBytes((Join-Path $artifactDir $json.filename), $bytes)
            }
            $response.StatusCode = 200
            $response.AddHeader("Access-Control-Allow-Origin", "*")
            $resBytes = [System.Text.Encoding]::UTF8.GetBytes("OK")
            $response.OutputStream.Write($resBytes, 0, $resBytes.Length)
            $response.Close()
            continue
        }
        if ([string]::IsNullOrEmpty($urlPath)) { $urlPath = "index.html" }

        $filePath = Join-Path $baseDir $urlPath

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = switch ($ext) {
                ".html" { "text/html; charset=utf-8" }
                ".css"  { "text/css; charset=utf-8" }
                ".js"   { "application/javascript; charset=utf-8" }
                ".json" { "application/json; charset=utf-8" }
                ".fbx"  { "application/octet-stream" }
                ".jpg"  { "image/jpeg" }
                ".png"  { "image/png" }
                default { "application/octet-stream" }
            }
            $response.ContentType = $mime
            $response.AddHeader("Access-Control-Allow-Origin", "*")

            if ($request.HttpMethod -eq "HEAD") {
                $fileInfo = Get-Item $filePath
                $response.ContentLength64 = $fileInfo.Length
                $response.Close()
                continue
            }

            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.OutputStream.Flush()
        } else {
            $response.StatusCode = 404
            $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $urlPath")
            $response.OutputStream.Write($msg, 0, $msg.Length)
        }
        $response.Close()
    } catch {
        # ignore context errors and continue
    }
}
