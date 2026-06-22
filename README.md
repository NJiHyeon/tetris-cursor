# 테트리스

HTML, CSS, JavaScript만으로 만드는 브라우저 테트리스 게임입니다.  
빌드 도구나 외부 라이브러리 없이 `index.html` 하나로 바로 실행할 수 있습니다.

## 프로젝트 소개

- **대상:** 프론트엔드 입문 수강생
- **기술:** HTML, CSS, Vanilla JavaScript
- **보드:** 10열 × 20행 (CSS Grid)
- **블록:** I, O, T, S, Z, J, L 테트로미노 7종

게임 보드에 블록이 떨어지고, 줄을 채우면 삭제되며 점수가 올라갑니다. 보드가 가득 차면 게임 오버됩니다.

## 실행 방법

### 방법 1: 파일 직접 열기

1. 프로젝트 폴더에서 `index.html`을 더블클릭합니다.
2. 기본 브라우저에서 게임이 열립니다.

### 방법 2: 로컬 서버 (권장)

```bash
# 프로젝트 폴더에서 실행
python -m http.server 8000
```

브라우저에서 `http://localhost:8000` 으로 접속합니다.

Node.js가 있다면:

```bash
npx serve .
```

## 조작법

게임 화면을 클릭해 포커스를 맞춘 뒤 키보드를 사용합니다.

| 키 | 동작 |
|----|------|
| ← (`ArrowLeft`) | 왼쪽 이동 |
| → (`ArrowRight`) | 오른쪽 이동 |
| ↓ (`ArrowDown`) | 한 칸 빠르게 내리기 (소프트 드롭) |
| ↑ (`ArrowUp`) | 블록 회전 |
| `Space` | 바닥까지 즉시 내리기 (하드 드롭) |

**Restart** 버튼으로 보드·점수·타이머를 초기화하고 새 게임을 시작합니다.

충돌이 발생하는 이동·회전은 적용되지 않습니다.

## 구현 기능

| 기능 | 설명 |
|------|------|
| 보드 렌더링 | CSS Grid 10×20, 고정 블록·현재 블록 분리 표시 |
| 블록 스폰 | 7종 테트로미노 랜덤 생성, 상단 중앙 배치 |
| 자동 낙하 | 800ms 간격 `setInterval` |
| 충돌 판정 | `canMove()` — 벽·바닥·고정 블록 |
| 키보드 조작 | 좌우 이동, 회전, 소프트/하드 드롭 |
| 라인 삭제 | 가로 한 줄이 가득 차면 삭제 후 위 블록 낙하 |
| 점수 | 1줄 100 / 2줄 300 / 3줄 500 / 4줄 800 |
| 게임 오버 | 스폰 위치가 막히면 종료, 오버레이 표시 |
| 재시작 | Restart 버튼으로 전체 상태 초기화 |

## 파일 구조

| 파일 | 역할 |
|------|------|
| `index.html` | 화면 구조 (보드, 점수, 버튼, 조작법) |
| `style.css` | 레이아웃·블록 색상·게임 오버 UI |
| `script.js` | 게임 로직 전체 |

## 품질 점검 방법

프로젝트에 포함된 Cursor Command로 단계별 점검할 수 있습니다.

| Command | 점검 내용 |
|---------|-----------|
| `/review-structure` | 파일 분리, README, 확장 가능 구조 |
| `/code-review` | DOM·렌더링 함수 분리 |
| `/review-game-logic` | 낙하·충돌·조작·회전 |
| `/qa-playtest` | 라인 삭제·점수·게임오버 시나리오 |
| `/bug-hunt` | 치명적 버그·타이머 중복 |
| `/refactor-safe` | 기능 유지 구조 개선 |
| `/release-check` | 배포·README·GitHub Pages |

### 수동 스모크 테스트

1. `index.html` 열기 → 빈 보드와 떨어지는 블록 확인
2. 방향키·Space로 이동·회전·드롭 확인
3. 한 줄을 채워 삭제·점수 증가 확인
4. 보드를 가득 채워 게임 오버 확인
5. **Restart** 후 정상 재개 확인
6. 브라우저 개발자 도구(F12) → Console 탭에 에러 없음 확인

## GitHub Pages 배포 방법

### 1. 저장소에 푸시

```bash
git init
git add index.html style.css script.js README.md .gitignore
git commit -m "Add tetris game for GitHub Pages"
git branch -M main
git remote add origin https://github.com/NJiHyeon/tetris-cursor.git
git push -u origin main
```

### 2. GitHub Pages 설정

1. GitHub 저장소 → **Settings** → **Pages**
2. **Source:** Deploy from a branch
3. **Branch:** `main` / **Folder:** `/ (root)`
4. **Save** 클릭

몇 분 후 https://njihyeon.github.io/tetris-cursor/ 에서 접속할 수 있습니다.

### 배포 시 주의사항

- `index.html`, `style.css`, `script.js`는 **저장소 루트**에 두세요.
- 경로는 **상대 경로**(`style.css`, `script.js`)를 사용하므로 서브경로 배포에도 호환됩니다.
- 빌드 단계가 없으므로 푸시만으로 배포가 완료됩니다.

## 라이선스

교육용 프로젝트입니다. 자유롭게 학습·수정에 활용하세요.
