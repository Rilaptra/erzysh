import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const script = `# --- CONFIGURATION ---
$destDir = "$env:APPDATA\\Erzysh"
$exePath = "$destDir\\erzysh_ghost.exe"
$startupFolder = "$env:APPDATA\\Microsoft\\Windows\\Start Menu\\Programs\\Startup"
$shortcutPath = "$startupFolder\\ErzyshGhost.lnk"

Write-Host "🔧 Fixing Ghost Agent Startup..." -ForegroundColor Cyan

# 1. BERSIHKAN REGISTRY LAMA (Yang bikin error)
$regPath = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run"
$regName = "ErzyshGhostAgent"
if (Get-ItemProperty -Path $regPath -Name $regName -ErrorAction SilentlyContinue) {
    Remove-ItemProperty -Path $regPath -Name $regName -Force
    Write-Host "🗑️ Removed broken Registry entry." -ForegroundColor Yellow
}

# 2. DOWNLOAD ULANG (Just in case file corrupt/missing)
if (!(Test-Path $exePath)) {
    Write-Host "📥 File missing. Redownloading..." -ForegroundColor Cyan
    if (!(Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
    Invoke-WebRequest -Uri "https://github.com/Rilaptra/erzysh/raw/main/ghost-agent/target/release/erzysh_ghost.exe" -OutFile $exePath
}

# 3. BUAT SHORTCUT DI SHELL:STARTUP (The Reliable Method)
try {
    $WshShell = New-Object -comObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut($shortcutPath)
    
    $Shortcut.TargetPath = $exePath
    $Shortcut.WorkingDirectory = $destDir   # <--- INI KUNCI SUKSESNYA!
    $Shortcut.WindowStyle = 7               # 7 = Minimized (Stealth mode)
    $Shortcut.Description = "Erzysh Ghost Agent Auto-Start"
    
    $Shortcut.Save()
    Write-Host "✅ Shortcut created in Startup folder." -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create shortcut. Error: $_" -ForegroundColor Red
}

# 4. TEST RUN
Write-Host "🚀 Test Running..." -ForegroundColor Cyan
Stop-Process -Name "erzysh_ghost" -ErrorAction SilentlyContinue
Start-Process -FilePath $exePath -WorkingDirectory $destDir

Write-Host "✨ Done! Check 'shell:startup' now." -ForegroundColor Yellow
`;

  return new NextResponse(script, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
