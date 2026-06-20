# HealthFit API 연동 문서

이 문서는 프론트엔드가 백엔드와 연동할 때 확인할 API 기준입니다.

프론트엔드 기본 API 주소는 `.env`의 `VITE_API_BASE_URL`을 사용합니다.

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

프론트에서는 화면에서 `axios`를 직접 호출하지 않고 `src/api/*` 모듈을 통해 요청합니다.

```txt
View.vue -> src/api/*.js -> src/api/client.js -> Django API
```

## 공통 응답 형식

백엔드 응답은 아래 형식을 기준으로 처리합니다.

```json
{
  "success": true,
  "message": "요청 처리 메시지",
  "data": {}
}
```

프론트의 `src/api/client.js`에서 `unwrapResponse()`가 `data`만 꺼내 화면에 전달합니다.

실패 응답은 아래 형식을 기준으로 처리합니다.

```json
{
  "success": false,
  "message": "요청 처리에 실패했습니다.",
  "errors": {
    "field_name": ["오류 메시지"]
  }
}
```

## 인증

프론트 파일: `src/api/auth.js`

| 기능 | Method | URL | 연동 상태 |
| --- | --- | --- | --- |
| 회원가입 | POST | `/auth/signup/` | 연결됨 |
| 로그인 | POST | `/auth/login/` | 연결됨 |
| 로그아웃 | POST | `/auth/logout/` | 연결됨 |
| 내 정보 확인 | GET | `/auth/me/` | 연결됨 |

로그인 성공 시 `access`, `refresh`, `user`를 받습니다. 프론트는 토큰을 아래 키로 `localStorage`에 저장합니다.

```txt
healthfit_access_token
healthfit_refresh_token
```

인증이 필요한 요청에는 `Authorization: Bearer <accessToken>` 헤더가 자동으로 붙습니다.

## 프로필

프론트 파일: `src/api/profile.js`

| 기능 | Method | URL | 연동 상태 |
| --- | --- | --- | --- |
| 내 프로필 조회 | GET | `/profiles/me/` | 연결됨 |
| 내 프로필 저장/수정 | PUT | `/profiles/me/` | 연결됨 |
| 권장 칼로리 조회 | GET | `/profiles/me/calorie-target/` | 연결됨 |

프론트 입력 필드는 camelCase를 쓰고, API 요청 시 snake_case로 변환합니다.

```js
{
  bodyType: 'normal',
  activityLevel: 'normal',
  workoutGoal: 'fat_loss',
  workoutExperience: 'beginner'
}
```

```json
{
  "body_type": "normal",
  "activity_level": "normal",
  "workout_goal": "fat_loss",
  "workout_experience": "beginner"
}
```

## 음식/식단

프론트 파일: `src/api/diet.js`

| 기능 | Method | URL | 연동 상태 |
| --- | --- | --- | --- |
| 음식 목록/검색 | GET | `/foods/` | 연결됨 |
| 식단 기록 목록 | GET | `/meals/` | 연결됨 |
| 식단 기록 생성 | POST | `/meals/` | 연결됨 |
| 식단 기록 삭제 | DELETE | `/meals/{mealId}/` | 연결됨 |
| 식단 대시보드 | GET | `/meals/dashboard/` | 연결됨 |
| AI 식단 추천 | POST | `/ai/diet/recommendations/` | 백엔드 구현 후 연결 |
| AI 식단 평가 | POST | `/ai/diet/evaluations/` | 백엔드 구현 후 연결 |

음식 검색 쿼리 예시:

```txt
GET /foods/?search=banana&category=fruit
```

식단 기록 생성 요청 예시:

```json
{
  "meal_type": "breakfast",
  "intake_date": "2026-06-20",
  "items": [
    {
      "food_id": 1,
      "amount": 100
    }
  ]
}
```

프론트 화면:

- `/foods`: 음식 검색
- `/diet/records`: 식단 기록 생성/삭제
- `/diet`: 식단 대시보드
- `/diet/recommend`: AI 식단 추천, 현재 AI 백엔드 대기
- `/diet/evaluation`: AI 식단 평가, 현재 AI 백엔드 대기

## 운동/운동 기록

프론트 파일: `src/api/workout.js`

| 기능 | Method | URL | 연동 상태 |
| --- | --- | --- | --- |
| 운동 목록/검색 | GET | `/exercises/` | 연결됨 |
| 운동 상세 | GET | `/exercises/{id}/` | 연결됨 |
| 운동 루틴 목록 | GET | `/workout-routines/` | 연결됨 |
| 운동 기록 목록 | GET | `/workout-logs/` | 연결됨 |
| 운동 기록 생성 | POST | `/workout-logs/` | 연결됨 |
| 운동 기록 삭제 | DELETE | `/workout-logs/{logId}/` | 연결됨 |
| AI 운동 추천 | POST | `/ai/workout/recommendations/` | 백엔드 구현 후 연결 |

운동 검색 쿼리 예시:

```txt
GET /exercises/?search=squat&body_part=legs&equipment=body weight
```

운동 기록 생성 요청 예시:

```json
{
  "exercise_id": 1,
  "workout_date": "2026-06-20",
  "workout_time": 30,
  "set_count": 3,
  "repetition": 10,
  "memo": "무릎 통증 없이 진행"
}
```

프론트 화면:

- `/workouts`: 운동 검색
- `/workouts/:id`: 운동 상세
- `/workout/logs`: 운동 기록 생성/삭제
- `/workout/recommend`: AI 운동 추천, 현재 AI 백엔드 대기

## 신체 기록/진행 현황

프론트 파일:

- `src/api/health.js`
- `src/api/progress.js`

| 기능 | Method | URL | 연동 상태 |
| --- | --- | --- | --- |
| 신체 기록 목록 | GET | `/body-records/` | 연결됨 |
| 신체 기록 생성 | POST | `/body-records/` | 연결됨 |
| 신체 기록 수정 | PATCH | `/body-records/{recordId}/` | 연결됨 |
| 신체 기록 삭제 | DELETE | `/body-records/{recordId}/` | 연결됨 |
| 진행 현황 조회 | GET | `/progress/` | 연결됨 |

신체 기록 생성 요청 예시:

```json
{
  "record_date": "2026-06-20",
  "weight": 72.5,
  "body_fat_percentage": 18.2,
  "skeletal_muscle_mass": 34.1
}
```

진행 현황 쿼리 예시:

```txt
GET /progress/?start_date=2026-06-14&end_date=2026-06-20
```

프론트 화면:

- `/body-records`: 신체 기록 생성/삭제
- `/progress`: 진행 현황 조회

## 커뮤니티

프론트 파일: `src/api/community.js`

| 기능 | Method | URL | 연동 상태 |
| --- | --- | --- | --- |
| 게시글 목록/검색 | GET | `/posts/` | 연결됨 |
| 게시글 상세 | GET | `/posts/{postId}/` | 연결됨 |
| 게시글 작성 | POST | `/posts/` | 연결됨 |
| 좋아요 토글 | POST | `/posts/{postId}/like/` | 연결됨 |
| 댓글 작성 | POST | `/posts/{postId}/comments/` | 연결됨 |
| 댓글 수정 | PATCH | `/comments/{commentId}/` | API 함수 있음, 화면 미사용 |
| 댓글 삭제 | DELETE | `/comments/{commentId}/` | 연결됨 |

게시글 작성 요청 예시:

```json
{
  "title": "오늘의 식단 공유",
  "category": "diet",
  "content": "단백질 위주로 식단을 구성했습니다."
}
```

댓글 작성 요청 예시:

```json
{
  "content": "좋은 식단이에요!"
}
```

프론트 화면:

- `/community`: 게시글 목록/검색/작성
- `/posts/:id`: 게시글 상세/좋아요/댓글 작성/댓글 삭제

## AI API, 나중에 연동할 부분

현재 백엔드 `config/urls.py`에는 AI 관련 URL include가 없습니다. 따라서 아래 API는 프론트 함수만 준비되어 있고, 실제 백엔드 구현 후 연결해야 합니다.

| 기능 | Method | URL | 프론트 파일 |
| --- | --- | --- | --- |
| AI 채팅 목록 | GET | `/ai/chats/` | `src/api/ai.js` |
| AI 채팅 요청 | POST | `/ai/chats/` | `src/api/ai.js` |
| AI 식단 추천 | POST | `/ai/diet/recommendations/` | `src/api/diet.js` |
| AI 식단 평가 | POST | `/ai/diet/evaluations/` | `src/api/diet.js` |
| AI 운동 추천 | POST | `/ai/workout/recommendations/` | `src/api/workout.js` |

AI 백엔드가 완성되면 할 일:

1. 백엔드에 `/api/v1/ai/...` URL을 추가합니다.
2. 응답 형식을 `{ success, message, data }`로 맞춥니다.
3. 프론트의 `src/api/ai.js`, `src/api/diet.js`, `src/api/workout.js` 응답 매핑을 실제 응답 필드에 맞춥니다.
4. 화면의 임시 안내 문구 또는 mock 결과를 실제 API 결과 표시로 바꿉니다.
5. API 키는 프론트에 넣지 않고 백엔드 `.env`에서 관리합니다.

## 연동 시 주의사항

- 프론트는 `camelCase`, 백엔드는 `snake_case`를 사용합니다.
- 변환은 주로 `src/api/adapters.js`와 각 API 파일의 payload 변환 함수에서 처리합니다.
- 인증이 필요한 API는 로그인 후 access token이 있어야 합니다.
- AI API 키는 절대 프론트 `.env`에 두지 않습니다.
- 백엔드 응답 형식이 바뀌면 `src/api/client.js`의 `unwrapResponse()`부터 확인합니다.
- CORS 또는 프록시 문제가 생기면 `VITE_API_BASE_URL`과 Django CORS 설정을 같이 확인합니다.

## 최종 점검 명령어

프론트:

```sh
npm.cmd run build
```

백엔드:

```sh
python manage.py check
```
