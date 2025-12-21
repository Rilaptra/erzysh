import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const script = `# --- ERZYSH GHOST INSTALLER ---
$destDir = "$env:APPDATA\\Erzysh"
$exePath = "$destDir\\erzysh_ghost.exe"
$startupFolder = "$env:APPDATA\\Microsoft\\Windows\\Start Menu\\Programs\\Startup"
$shortcutPath = "$startupFolder\\ErzyshGhost.lnk"

Clear-Host
Write-Host "
  E R Z Y . S H
       👻 GHOST AGENT UPDATER
" -ForegroundColor Magenta

# 1. STOP & CLEAN OLD PROCESS
if (Get-Process -Name "erzysh_ghost" -ErrorAction SilentlyContinue) {
    Write-Host "⚠️ Stopping existing ghost agent..." -ForegroundColor Yellow
    Stop-Process -Name "erzysh_ghost" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

# 2. DELETE OLD FILE
if (Test-Path $exePath) {
    Write-Host "🗑️ Removing old executable..." -ForegroundColor DarkGray
    Remove-Item -Path $exePath -Force -ErrorAction SilentlyContinue
}

# 3. DOWNLOAD NEW VERSION
Write-Host "📥 Downloading latest agent..." -ForegroundColor Cyan
if (!(Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
  
try {
    # Pastikan URL ini mengarah ke binary yang valid
    Invoke-WebRequest -Uri "https://github.com/Rilaptra/erzysh/raw/main/ghost-agent/target/release/erzysh_ghost.exe" -OutFile $exePath
    Write-Host "✅ Download complete." -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to download. Check internet/URL." -ForegroundColor Red
    Read-Host "Press ENTER to exit..."
    Exit
}

# 4. CREATE SHORTCUT (Minimised)
try {
    $WshShell = New-Object -comObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut($shortcutPath)
    $Shortcut.TargetPath = $exePath
    $Shortcut.WorkingDirectory = $destDir
    $Shortcut.WindowStyle = 7 # 7 = Minimized (Supaya gak ganggu)
    $Shortcut.Description = "Erzysh Ghost Agent"
    $Shortcut.Save()
    Write-Host "✅ Startup shortcut updated." -ForegroundColor Green
} catch {
    Write-Host "⚠️ Shortcut creation skipped." -ForegroundColor Yellow
}

# 5. LAUNCH & WAIT
Write-Host "🚀 Launching Erzysh Ghost..." -ForegroundColor Cyan
# Start-Process tanpa -Wait agar script ini bisa lanjut ke prompt exit
Start-Process -FilePath $exePath -WorkingDirectory $destDir

Write-Host "✨ All set! Ghost is running in background." -ForegroundColor Green
Write-Host ""
# Ini yang bikin dia nunggu Enter
Read-Host "⌨️  Press ENTER to close this terminal..."
`;

  return new NextResponse(script, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}