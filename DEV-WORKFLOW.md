# CatCratch 에이전틱 개발 워크플로우

AI와 개발자가 역할을 나눠 협업하는 래칫 기반 개발 플로우.

---

## 핵심 원칙

- **테스트가 계약이다**: 구현 전에 테스트를 먼저 작성한다. 테스트 통과 = 완료.
- **AI는 생성, 사람은 판단**: AI는 코드를 만들고, 개발자는 방향과 기준을 정한다.
- **래칫은 뒤로 안 간다**: 한번 통과한 테스트는 절대 깨지지 않는다. Hook이 강제한다.

---

## 역할 분담

| 항목 | 개발자 | AI (Claude) |
|------|--------|-------------|
| 이슈 작성 / 칸반 관리 | ✅ | 읽기만 |
| 테스트 코드 작성 | ✅ | 확인 요청 후 수정 가능 |
| 기능 구현 | | ✅ |
| 커밋 | | ✅ (테스트 통과 후) |
| PR 생성 | | ✅ (개발자 요청 시) |
| PR 머지 | ✅ | |
| 코드 리뷰 내용 확인 | ✅ or AI | |
| 리뷰 피드백 반영 | | ✅ |
| CLAUDE.md / 워크플로우 수정 | 협의 | ✅ |

---

## 전체 사이클

```
1. 이슈 작성 (개발자)
        ↓
2. 테스트 작성 (개발자)
        ↓
3. 브랜치 생성 + 구현 (AI)
        ↓
4. 커밋 — Hook이 테스트 통과 강제
        ↓
5. PR 생성 (AI)
        ↓
6. CI 자동 실행 + 코드 리뷰 (GitHub Actions + Codex)
        ↓
7. 리뷰 피드백 반영 (AI)
        ↓
8. 머지 (개발자)
```

---

## Step 1. 이슈 작성 (개발자)

GitHub 이슈 템플릿(`.github/ISSUE_TEMPLATE/feat.md`)을 사용해 작성.

```markdown
## 개요
카운트 버튼이 홈 화면에 있고, 이를 누를 수 있다.

## 유저 시나리오
- Given: 홈 화면에 버튼이 있는 상태
- When: 유저가 버튼을 눌렀을 때
- Then: 버튼의 카운트 값이 1 증가한다.

## 기술 힌트
- (선택) API 엔드포인트, 데이터 구조 등
```

**왜**: 유저 시나리오가 테스트 케이스의 직접적인 원천이 된다. 모호하면 테스트도 모호해진다.

---

## Step 2. 테스트 작성 (개발자) — 스펙 드리븐

이슈의 유저 시나리오를 그대로 테스트로 옮긴다. 이슈가 스펙이고, 테스트가 그 스펙의 실행 가능한 표현이다.

### 왜 프론트는 Playwright, 백엔드는 Hurl인가?

추상화 레벨에서 각 영역의 인터페이스가 다르기 때문이다.

- **프론트엔드**의 인터페이스는 **유저 행동(UI)**이다. Playwright는 실제 브라우저에서 유저 시나리오를 그대로 실행한다. "버튼을 누른다 → 카운트가 오른다"는 사용자 관점의 계약을 검증한다.
- **백엔드**의 인터페이스는 **HTTP 엔드포인트**다. Hurl은 HTTP 요청/응답을 직접 기술한다. `POST /auth/login → 200 + JWT` 같은 API 계약을 검증한다.

각자의 추상화 레벨에 맞는 도구를 쓰기 때문에, 구현 내부가 바뀌어도 인터페이스 계약은 그대로 유지된다.

### 프론트엔드 — Playwright (유저 시나리오 중심)

```typescript
// frontend/e2e/count-button.spec.ts
test('버튼 클릭 시 카운트가 1 증가한다', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button')).toContainText('0');
  await page.getByRole('button').click();
  await expect(page.getByRole('button')).toContainText('1');
});
```

### 백엔드 — Hurl (HTTP 엔드포인트 중심)

```hurl
# backend/tests/hurl/auth.hurl
POST {{base_url}}/auth/login
Content-Type: application/json
{
  "email": "test@example.com",
  "password": "password123"
}

HTTP 200
[Asserts]
jsonpath "$.access_token" isString
```

**왜**: 테스트가 완료 기준이다. AI는 이 기준을 통과시키는 것만 목표로 삼는다.

> **주의**: 테스트 파일은 AI가 임의로 수정할 수 없다. 수정이 필요하면 반드시 개발자에게 먼저 확인을 받는다.

---

## Step 3. 브랜치 생성 + 구현 (AI)

### 브랜치 규칙
```
feat/이슈번호-간단한설명
feat/1-count-button
fix/12-wall-collision-bug
```

`main`에 직접 커밋하지 않는다.

### `/feature-dev #이슈번호` 실행

AI가 다음 순서로 진행:

1. **GitHub MCP**로 이슈 읽기 → 스펙, 유저 시나리오 파악
2. **Context7 MCP**로 관련 라이브러리 최신 API 확인 (Blockly, FastAPI 등)
3. 기존 테스트 코드 확인 → 통과 목표 설정
4. 코드베이스 탐색 (`code-explorer` 에이전트)
5. 아키텍처 설계 (`code-architect` 에이전트)
6. 구현
7. 코드 리뷰 (`code-reviewer` 에이전트)

---

## Step 4. 커밋

### 커밋 조건
커밋 전 현재 이슈에 해당하는 테스트가 **모두 통과**해야 한다.

```bash
# 프론트엔드 테스트 직접 실행
cd frontend && npx playwright test

# 백엔드 테스트 직접 실행
hurl --test backend/tests/hurl/*.hurl --variable base_url=http://localhost:8000
```

Pre-commit Hook(`.claude/settings.json`)이 테스트 통과를 자동 강제한다. 실패 시 커밋 차단.

### 커밋 메시지 형식
```
feat: 로그인 API 구현 (#3)
fix: 스프라이트 이동 오차 수정 (#7)
```

이슈 번호를 반드시 포함한다.

---

## Step 5. PR 생성 (AI)

개발자가 명시적으로 요청할 때만 생성한다.

**GitHub MCP** (`mcp__github__create_pull_request`)를 사용한다. (`gh` CLI 사용 금지)

PR 본문에 포함할 것:
- `Closes #N` (이슈 번호)
- 변경 내용 요약
- 테스트 방법

---

## Step 6. CI 자동 실행 (GitHub Actions)

PR → main 시 자동으로 `.github/workflows/ci.yml` 실행.

| Job | 내용 |
|-----|------|
| `Playwright E2E` | 프론트엔드 E2E 테스트 전체 실행 |
| `Hurl API Tests` | 백엔드 HTTP 인터페이스 테스트 전체 실행 |

Hurl 파일이 없으면 백엔드 job은 자동 스킵.

---

## Step 7. 코드 리뷰 피드백 반영 (AI)

Codex(또는 다른 리뷰어)가 PR에 코멘트를 달면:

1. AI가 **GitHub MCP**로 리뷰 내용 읽기
   ```
   mcp__github__get_pull_request_reviews
   mcp__github__get_pull_request_comments
   ```
2. 지적 사항 분석 및 수정
3. 커밋 + 푸시 → CI 재실행

---

## Step 8. 머지 (개발자)

CI 통과 + 리뷰 반영 확인 후 개발자가 직접 머지.

AI는 머지하지 않는다.

---

## MCP 사용 가이드 요약

| MCP | 언제 |
|-----|------|
| **GitHub MCP** | 이슈 읽기, PR 생성, 리뷰 조회 |
| **Context7 MCP** | 외부 라이브러리 코드 작성 전 항상 |
| **Playwright MCP** | 테스트 작성 시 실제 DOM/셀렉터 확인 |

---

## Hooks 요약 (`.claude/settings.json`)

| Hook | 동작 |
|------|------|
| `PreToolUse / git commit` | Hurl + Playwright 전부 통과해야 커밋 허용 |
| `PreToolUse / git push --force` | 강제 푸시 차단 |

---

## 디렉토리 구조 참고

```
cat-cratch/
├── .github/
│   ├── ISSUE_TEMPLATE/feat.md   # 이슈 템플릿
│   └── workflows/ci.yml          # CI (Playwright + Hurl)
├── .claude/settings.json         # Hooks
├── frontend/
│   ├── e2e/                      # Playwright 테스트 (개발자 작성)
│   └── src/                      # 구현 코드 (AI 작성)
├── backend/
│   ├── tests/hurl/               # Hurl 테스트 (개발자 작성)
│   └── app/                      # 구현 코드 (AI 작성)
├── CLAUDE.md                     # AI 행동 지침
└── DEV-WORKFLOW.md               # 이 파일
```
