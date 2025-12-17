# 공통 리소스

이 폴더는 admin과 mobile 앱에서 공통으로 사용되는 리소스들을 포함합니다.

## 구조

```
shared/
├── docs/           # 공통 문서
├── assets/         # 공통 이미지, 아이콘
├── types/          # 공통 타입 정의
└── constants/      # 공통 상수
```

## API 스펙

### 인증 API
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/refresh

### 예약 API
- GET /api/reservations
- POST /api/reservations
- PUT /api/reservations/:id
- DELETE /api/reservations/:id

### 회원 관리 API
- GET /api/members
- POST /api/members
- PUT /api/members/:id
- DELETE /api/members/:id