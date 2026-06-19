# frontend

이 템플릿은 Vue 3와 Vite를 사용하여 프론트엔드 개발을 시작할 수 있도록 구성된 기본 프로젝트입니다.

## 추천 IDE 설정

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) 확장 프로그램 사용을 권장합니다.

기존 Vue 확장 프로그램인 Vetur를 사용 중이라면 충돌을 방지하기 위해 비활성화하는 것을 권장합니다.

## 추천 브라우저 설정

* Chromium 기반 브라우저(Chrome, Edge, Brave 등):

  * [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  * [Chrome DevTools에서 Custom Object Formatter 활성화](http://bit.ly/object-formatters)

* Firefox:

  * [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  * [Firefox DevTools에서 Custom Object Formatter 활성화](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## 설정 커스터마이징

Vite 설정에 대한 자세한 내용은 [Vite Configuration Reference](https://vite.dev/config/)를 참고하세요.

## 프로젝트 설정

프로젝트 실행에 필요한 패키지를 설치합니다.

```sh
npm install
```

### 개발 서버 실행

개발 중에는 아래 명령어를 사용하여 개발 서버를 실행합니다.

```sh
npm run dev
```

실행 후 터미널에 표시되는 주소로 접속하면 프론트엔드 화면을 확인할 수 있습니다.

예시:

```txt
http://localhost:5173
```

### 배포용 빌드

프로젝트를 배포용으로 빌드할 때는 아래 명령어를 사용합니다.

```sh
npm run build
```

## HealthFit Frontend Notes

* 현재 화면은 `src/data/mockData.js`에 있는 mock 데이터를 사용합니다.
* 백엔드 연동 시에는 Vue 화면 파일에서 axios를 직접 호출하지 않고, `src/api/*` 파일을 통해 API 요청을 관리해야 합니다.
* API 기본 URL은 `/api/v1`을 기준으로 합니다.
* 백엔드 서버 주소가 다른 경우 `.env` 파일에서 `VITE_API_BASE_URL` 값을 설정합니다.

예시:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

* API 클라이언트는 아래와 같은 공통 응답 형식을 기준으로 동작합니다.

```json
{
  "success": true,
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": {}
}
```

* 실제 데이터는 응답 객체의 `data` 안에 들어 있습니다.

예시:

```js
const response = await getFoods()
const foods = response.data.data
```

* 백엔드에서 전달되는 `snake_case` 형식의 필드는 `src/api/adapters.js`에서 프론트엔드에서 사용하기 편한 형태로 변환합니다.

예시:

```json
{
  "recommended_calories": 2200,
  "created_at": "2026-06-17T10:00:00"
}
```

프론트엔드에서는 아래와 같은 형태로 사용할 수 있습니다.

```js
{
  recommendedCalories: 2200,
  createdAt: "2026-06-17T10:00:00"
}
```

## API 연동 구조

프론트엔드 화면에서는 API를 직접 호출하지 않고, `src/api` 폴더의 함수를 통해 데이터를 요청합니다.

권장 구조는 다음과 같습니다.

```txt
View.vue
  ↓
src/api/foods.js
  ↓
src/api/client.js
  ↓
Django API /api/v1/foods/
  ↓
DB
```

예시:

```js
// views/FoodListView.vue
import { getFoods } from '@/api/foods'

const response = await getFoods()
foods.value = response.data.data
```

```js
// src/api/foods.js
import api from './client'

export const getFoods = () => {
  return api.get('/foods/')
}
```

## 정리

이 프론트엔드 프로젝트는 Vue 3와 Vite를 기반으로 구성되어 있습니다.

현재는 mock 데이터를 사용하여 화면을 구성하고 있으며, 백엔드 연동 시에는 `/api/v1`을 기준으로 API 요청을 보냅니다.

백엔드 API 응답은 `success`, `message`, `data` 형식으로 통일되어 있으므로, 프론트엔드에서는 실제 데이터를 `response.data.data`에서 꺼내 사용해야 합니다.

또한 화면 컴포넌트에서 axios를 직접 호출하지 않고, `src/api` 폴더를 통해 API 요청을 분리하여 관리하는 것이 좋습니다.
