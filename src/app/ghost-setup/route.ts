import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const script = `# --- CONFIGURATION ---
$destDir = "$env:APPDATA\\Erzysh"
$exePath = "$destDir\\erzysh_ghost.exe"
$startupFolder = "$env:APPDATA\\Microsoft\\Windows\\Start Menu\\Programs\\Startup"
$shortcutPath = "$startupFolder\\ErzyshGhost.lnk"

Write-Host "🔧 Starting Erzysh Ghost Auto-Update..." -ForegroundColor Cyan

# 1. STOP & CLEAN OLD PROCESS
if (Get-Process -Name "erzysh_ghost" -ErrorAction SilentlyContinue) {
    Write-Host "⚠️ Stopping existing ghost agent..." -ForegroundColor Yellow
    Stop-Process -Name "erzysh_ghost" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# 2. DELETE OLD FILE
if (Test-Path $exePath) {
    Write-Host "🗑️ Removing old executable..." -ForegroundColor Yellow
    Remove-Item -Path $exePath -Force -ErrorAction SilentlyContinue
}

# 3. CLEANUP REGISTRY (Legacy)
$regPath = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run"
$regName = "ErzyshGhostAgent"
if (Get-ItemProperty -Path $regPath -Name $regName -ErrorAction SilentlyContinue) {
    Remove-ItemProperty -Path $regPath -Name $regName -Force
}

# 4. DOWNLOAD NEW VERSION
Write-Host "📥 Downloading latest agent..." -ForegroundColor Cyan
if (!(Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
  
try {
    Invoke-WebRequest -Uri "https://github.com/Rilaptra/erzysh/raw/main/ghost-agent/target/release/erzysh_ghost.exe" -OutFile $exePath
    Write-Host "✅ Download complete." -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to download agent. Check internet connection." -ForegroundColor Red
    Exit
}

# 5. CREATE/UPDATE SHORTCUT
try {
    $WshShell = New-Object -comObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut($shortcutPath)
    
    $Shortcut.TargetPath = $exePath
    $Shortcut.WorkingDirectory = $destDir
    $Shortcut.WindowStyle = 7 # Minimized
    $Shortcut.Description = "Erzysh Ghost Agent Auto-Start"
    
    $Shortcut.Save()
    Write-Host "✅ Startup shortcut updated." -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to update shortcut." -ForegroundColor Red
}

# 6. LAUNCH
Write-Host "🚀 Launching Ghost Agent..." -ForegroundColor Cyan
Start-Process -FilePath $exePath -WorkingDirectory $destDir

Write-Host "✨ Update Complete! You can close this window." -ForegroundColor Green
Start-Sleep -Seconds 5
`;

  return new NextResponse(script, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
