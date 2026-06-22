# HealthFit Frontend

HealthFit 1학기 관통 프로젝트 프론트엔드입니다.

Vue 3, Vite, Pinia, Vue Router, Axios 기반으로 구성되어 있으며 Django 백엔드의 `/api/v1` API와 연동합니다.

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

## 백엔드 연결

`.env` 파일의 `VITE_API_BASE_URL` 값을 백엔드 주소에 맞춥니다.

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

백엔드 서버는 아래 주소 기준으로 실행한다고 가정합니다.

```txt
http://127.0.0.1:8000
```

## 주요 화면

- `/`: 홈
- `/login`: 로그인
- `/signup`: 회원가입
- `/profile`: 마이 프로필
- `/foods`: 음식 검색
- `/diet`: 식단 대시보드
- `/diet/records`: 식단 기록
- `/workouts`: 운동 목록
- `/workouts/:id`: 운동 상세
- `/workout/logs`: 운동 기록
- `/body-records`: 신체 기록
- `/progress`: 진행 현황
- `/community`: 커뮤니티
- `/posts/:id`: 게시글 상세
- `/ai-chat`: AI 상담

## API 문서

프론트와 백엔드 연동 기준은 [API.md](./API.md)를 확인합니다.

AI 관련 API는 프론트 함수와 화면이 준비되어 있지만, 백엔드 AI 구현이 완료된 뒤 최종 연결해야 합니다.

## 빌드 확인

```sh
npm run build
```
