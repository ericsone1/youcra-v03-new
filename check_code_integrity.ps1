# 🔍 코드 무결성 검사 스크립트
# 리팩토링 과정에서 코드 누락을 감지합니다

Write-Host "🔍 Home.js 리팩토링 무결성 검사 시작..." -ForegroundColor Green

# 1. 원본 파일 존재 확인
if (!(Test-Path "src/components/Home_ORIGINAL_BACKUP.js")) {
    Write-Host "❌ 원본 백업 파일이 없습니다!" -ForegroundColor Red
    exit 1
}

# 2. 현재 Home.js와 백업 파일 라인 수 비교
$originalLines = (Get-Content "src/components/Home_ORIGINAL_BACKUP.js").Count
$currentLines = (Get-Content "src/components/Home.js" -ErrorAction SilentlyContinue).Count

Write-Host "📊 라인 수 비교:" -ForegroundColor Yellow
Write-Host "   원본: $originalLines 줄" -ForegroundColor White
Write-Host "   현재: $currentLines 줄" -ForegroundColor White

# 3. 주요 함수/상수 존재 확인
$criticalElements = @(
    "CATEGORY_KEYWORDS",
    "function Home",
    "useAuth",
    "useState",
    "useEffect",
    "handleVideoSelect",
    "handleYoutubeReady",
    "handleFanCertification",
    "computeUniqueVideos"
)

Write-Host "🔍 핵심 요소 존재 확인:" -ForegroundColor Yellow

$homeContent = Get-Content "src/components/Home.js" -Raw -ErrorAction SilentlyContinue
$missingElements = @()

foreach ($element in $criticalElements) {
    if ($homeContent -match $element) {
        Write-Host "   ✅ $element" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $element (누락!)" -ForegroundColor Red
        $missingElements += $element
    }
}

# 4. 새로 생성된 모듈 파일들 확인
$moduleFiles = @(
    "src/components/Home/utils/constants.js",
    "src/components/Home/hooks/useUserCategory.js",
    "src/components/Home/hooks/useVideos.js",
    "src/components/Home/hooks/useChatRooms.js",
    "src/components/Home/components/Header.js"
)

Write-Host "📁 모듈 파일 존재 확인:" -ForegroundColor Yellow
foreach ($file in $moduleFiles) {
    if (Test-Path $file) {
        $lines = (Get-Content $file).Count
        Write-Host "   ✅ $file ($lines 줄)" -ForegroundColor Green
    } else {
        Write-Host "   ⏳ $file (아직 생성 안됨)" -ForegroundColor Gray
    }
}

# 5. 결과 요약
Write-Host "`n📋 검사 결과 요약:" -ForegroundColor Cyan
if ($missingElements.Count -eq 0) {
    Write-Host "   ✅ 모든 핵심 요소가 존재합니다!" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  누락된 요소: $($missingElements -join ', ')" -ForegroundColor Red
    Write-Host "   🔧 원본 백업에서 복구가 필요할 수 있습니다." -ForegroundColor Yellow
}

# 6. Git 상태 확인
Write-Host "`n🔄 Git 상태:" -ForegroundColor Cyan
git status --porcelain

Write-Host "`n🔍 무결성 검사 완료!" -ForegroundColor Green 