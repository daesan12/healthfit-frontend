# HealthFit Frontend

HealthFit 1학기 관통 프로젝트 프론트엔드입니다.

현재 화면은 백엔드 연동 전에도 확인할 수 있도록 mock 데이터를 포함하고 있으며, 실제 연동은 `src/api/*` 파일을 통해 진행합니다.

## 실행 방법

패키지를 설치합니다.

```sh
npm install
```

프론트엔드 개발 서버를 실행합니다.

```sh
npm run dev
```

터미널에 표시되는 주소로 접속합니다.

```txt
http://localhost:5173
```

## 백엔드 연결 기준

프론트엔드는 `.env` 파일의 `VITE_API_BASE_URL` 값을 API 기본 주소로 사용합니다.

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

백엔드 서버는 Django 기준으로 아래 주소에서 실행된다고 가정합니다.

```txt
http://127.0.0.1:8000
```

## API 구조

화면 컴포넌트에서 axios를 직접 호출하지 않고, `src/api` 폴더의 함수를 통해 요청합니다.

```txt
View.vue
  -> src/api/diet.js
  -> src/api/client.js
  -> Django API /api/v1/foods/
  -> DB
```

백엔드 공통 응답 형식은 다음과 같습니다.

```json
{
  "success": true,
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": {}
}
```

`src/api/client.js`의 `unwrapResponse()`가 공통 응답에서 `data`만 꺼내도록 준비되어 있습니다.

```js
const foods = await getFoods()
```

백엔드의 `snake_case` 필드는 `src/api/adapters.js`에서 프론트엔드 화면에 맞는 형태로 변환합니다.

```json
{
  "recommended_calories": 2200,
  "created_at": "2026-06-17T10:00:00"
}
```

```js
{
  recommendedCalories: 2200,
  createdAt: '2026-06-17T10:00:00',
}
```

## 현재 연동 상태

- 인증, 프로필, 식단, 운동, 커뮤니티, 진행률 화면은 mock 데이터 기반으로 구성되어 있습니다.
- API 기본 주소는 실제 백엔드 `/api/v1` 기준으로 맞춰져 있습니다.
- AI 기능은 백엔드 구현이 진행 중이므로 현재는 mock 흐름으로 유지합니다.
- 백엔드와 실제 연결할 때는 backend API 명세에 맞춰 `src/api/*`와 `src/api/adapters.js`를 순서대로 교체합니다.

## 빌드 확인

```sh
npm run build
```
