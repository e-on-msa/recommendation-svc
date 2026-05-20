# recommendation-svc

E-ON 플랫폼의 추천 도메인을 담당하는 마이크로서비스입니다.
사용자의 활동 이력과 프로필을 기반으로 AI 임베딩 추천, 시기별 추천, SQL 점수 기반 추천 기능을 제공합니다.

## 📁 프로젝트 구조

```
recommendation-svc/
├── config/
│   └── config.js                    # Sequelize DB 연결 설정
├── controllers/
│   ├── recommendController.js       # AI 추천 요청/응답 처리
│   └── timeRecommendationController.js # 시기별 추천 요청/응답 처리
├── middleware/
│   └── auth.js                      # Gateway 헤더 기반 인증
├── migrations/
│   ├── 20250710114448-create-recommendation-dashboard.js
│   └── 20250710114451-create-recommendation-item.js
├── models/
│   ├── index.js                     # 모델 로드 및 관계 설정
│   ├── RecommendationDashboard.js   # 시기별 추천 컨테이너
│   └── RecommendationItem.js        # 시기별 추천 항목
├── routes/
│   ├── aiRecommendRoutes.js         # AI 추천 라우터
│   ├── timeRecommendations.js       # 시기별 추천 라우터
│   └── recommendations.js           # SQL 점수 기반 추천 라우터 (fallback)
├── services/
│   ├── recommendService.js          # AI 추천 비즈니스 로직
│   ├── timeRecommendationService.js # 시기별 추천 비즈니스 로직
│   └── embeddingApi.js              # AI Service(Flask) HTTP 호출
├── messaging/
│   ├── connection.js                # RabbitMQ 연결 + 자동 재연결
│   ├── consumer.js                  # 구독 이벤트 등록
│   └── handlers/
│       ├── userHandler.js           # user.* 이벤트 처리
│       ├── challengeHandler.js      # challenge.* 이벤트 처리
│       └── communityHandler.js      # community.* 이벤트 처리
├── utils/
│   └── generateUserSummary.js       # 사용자 활동 → userText 변환
├── .env                             # 환경변수 (git 제외)
├── .env.example
├── .gitignore
├── .sequelizerc
├── Dockerfile
├── index.js                         # 서버 진입점
└── package.json
```


## 🚀 로컬 실행 방법

```bash
# 1. 패키지 설치
npm install

# 2. MySQL에서 DB 생성
CREATE DATABASE recommendation_db;

# 3. 마이그레이션 실행
npx sequelize-cli db:migrate

# 4. 서버 실행
npm run dev
```

서버가 정상적으로 실행되면 아래 메시지가 출력됩니다.

```
Recommendation Service running on :8085
[RabbitMQ] connected
[RabbitMQ] subscribed: user.interests.updated
[RabbitMQ] subscribed: challenge.created
...
```

## 🐳 Docker 실행 방법

```bash
# 이미지 빌드
docker build -t recommendation-svc .

# 컨테이너 실행
docker run -p 8085:8085 --env-file .env recommendation-svc
```

## 🗄️ DB 설계 원칙 (MSA)

- `recommendation_db` 단독 사용
- 타 서비스 DB 직접 접근 금지 → HTTP API 호출로 대체
- `RecommendationItem.challenge_id`는 값만 보관 (DB FK 없음)

| 테이블 | 설명 |
|--------|------|
| `recommendation_dashboards` | 시기별 추천 컨테이너 (recommendation_type) |
| `recommendation_items` | 시기별 추천 항목 (월, 학년, 학교유형 기반) |

## 🔐 인증 방식

세션을 직접 확인하지 않고 Gateway에서 넘긴 헤더를 신뢰합니다.

| 헤더 | 값 예시 | 용도 |
|------|---------|------|
| `X-User-Id` | `123` | 사용자 식별 |

```js
// middleware/auth.js
req.user = {
  user_id: Number(req.headers['x-user-id']),
};
```

## 📨 RabbitMQ 이벤트 수신

다른 서비스에서 발행한 이벤트를 구독해 추천 데이터를 갱신하고 재계산을 트리거합니다.

| 발행 서비스 | 이벤트명 | 처리 내용 |
|------------|---------|----------|
| User | `user.interests.updated` | 해당 유저 추천 재계산 |
| User | `user.vision.updated` | 해당 유저 추천 재계산 |
| Challenge | `challenge.created` | status=APPROVED인 경우 후보 편입 |
| Challenge | `challenge.approved` | 추천 후보 편입 |
| Challenge | `challenge.updated` | 후보 저장소 갱신 |
| Challenge | `challenge.state.changed` | CLOSED/CANCELLED → 후보 제외, ACTIVE → 편입 |
| Challenge | `challenge.deleted` | 후보 저장소에서 제거 |
| Community | `community.post.created` | 해당 유저 추천 재계산 |

Exchange: `eon.events` (topic)

## 🔗 내부 서비스 호출

추천 생성 시 아래 서비스들의 내부 API를 호출해 데이터를 수집합니다.

| 서비스 | 엔드포인트 | 용도 |
|--------|-----------|------|
| Challenge Service | `GET /challenges/active-with-categories` | 임베딩용 전체 챌린지 목록 |
| Challenge Service | `GET /participations/user/:userId` | 사용자 참여/생성 이력 |
| User Service | `GET /preferences/user/:userId` | 관심사, 비전, 학교 정보 |
| Community Service | `GET /activities/user/:userId` | 게시글, 댓글, 게시판 신청 이력 |

## 🤖 추천 흐름

### AI 추천 (개인화)

```
POST /recommend/history
      ↓
recommendService
  ├── Challenge Service → 참여/생성 이력
  ├── User Service     → 관심사/비전/학교
  ├── Community Service → 게시글/댓글
  ├── generateUserSummary() → userText 생성
  ├── Challenge Service → 전체 활성 챌린지
  └── AI Service (Flask) POST /recommend → 추천 ID 반환
```

### 시기별 추천 (정적)

```
GET /time-recommendations?grade=X&month=Y&schoolType=Z
      ↓
timeRecommendationService
  └── recommendation_db 조회 → 결과 반환
```

## 📝 커밋 컨벤션

| 타입 | 설명 |
|------|------|
| `feat` | 새 기능 추가 |
| `fix` | 버그 수정 |
| `docs` | 문서 작업 |
| `refactor` | 기능 변경 없이 코드 구조 개선 |
| `chore` | 빌드, 패키지, 설정 변경 |
| `style` | 코드 포맷, 세미콜론 등 스타일만 변경 |

```
feat: AI 추천 엔드포인트 구현
fix: x-user-id 헤더 누락 시 401 반환 처리
docs: README.md 작성
```

## 🌿 브랜치 전략

```
main
└── feat/#이슈번호-작업내용
```

```bash
# 브랜치 생성 예시
git checkout -b feat/#5-ai-recommend
```
