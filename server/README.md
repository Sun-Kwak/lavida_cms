# Lavida 백엔드 서버 - 지점 관리 API

IndexedDB에서 MongoDB로 마이그레이션된 지점 관리 시스템

## 주요 기능

- 지점 CRUD 작업
- 지점 검색 및 필터링
- 활성/비활성 상태 관리
- 페이지네이션 및 정렬
- 유효성 검사 및 에러 핸들링

## API 엔드포인트

### 지점 관리

#### 1. 모든 지점 조회
```
GET /api/branches
Query Parameters:
- isActive: boolean (true/false)
- sortBy: string (name/createdAt/updatedAt/isActive)
- sortOrder: string (asc/desc)
- page: number (default: 1)
- limit: number (default: 50, max: 100)
```

#### 2. 활성 지점만 조회
```
GET /api/branches/active
```

#### 3. 지점 통계 조회
```
GET /api/branches/stats
```

#### 4. ID로 지점 조회
```
GET /api/branches/:id
```

#### 5. 지점명으로 검색
```
GET /api/branches/search/:name
Query Parameters:
- isActive: boolean (true/false)
```

#### 6. 새 지점 생성
```
POST /api/branches
Body: {
  "name": "지점명", // required
  "address": "주소", // optional
  "phone": "전화번호", // optional
  "isActive": true // optional, default: true
}
```

#### 7. 지점 정보 수정
```
PUT /api/branches/:id
Body: {
  "name": "지점명", // optional
  "address": "주소", // optional
  "phone": "전화번호", // optional
  "isActive": true // optional
}
```

#### 8. 지점 활성/비활성 토글
```
PATCH /api/branches/:id/toggle-status
```

#### 9. 지점 삭제
```
DELETE /api/branches/:id
```

## 응답 형식

### 성공 응답
```json
{
  "success": true,
  "message": "성공 메시지",
  "data": { /* 데이터 */ },
  "count": 10, // 목록 조회 시
  "total": 100, // 전체 개수
  "currentPage": 1, // 현재 페이지
  "totalPages": 10 // 전체 페이지
}
```

### 에러 응답
```json
{
  "success": false,
  "message": "에러 메시지",
  "validationErrors": [/* 유효성 검사 에러 */] // optional
}
```

## 데이터 모델

### Branch (지점)
```javascript
{
  id: String, // MongoDB ObjectId
  name: String, // 지점명 (required, unique)
  address: String, // 주소 (optional)
  phone: String, // 전화번호 (optional)
  isActive: Boolean, // 활성 상태 (default: true)
  createdAt: Date, // 생성일시
  updatedAt: Date // 수정일시
}
```

## IndexedDB에서 MongoDB 마이그레이션 차이점

### 1. 데이터 구조
- **IndexedDB**: 브라우저 로컬 저장소, 클라이언트 사이드
- **MongoDB**: 서버 데이터베이스, 중앙 집중식 관리

### 2. ID 생성 방식
- **IndexedDB**: UUID v4 (`generateUUID()`)
- **MongoDB**: ObjectId (자동 생성)

### 3. 트랜잭션 처리
- **IndexedDB**: `executeTransaction()` 메소드
- **MongoDB**: Mongoose의 기본 트랜잭션 처리

### 4. 인덱싱
- **IndexedDB**: 수동 인덱스 생성
- **MongoDB**: Mongoose 스키마 기반 자동 인덱싱

### 5. 유효성 검사
- **IndexedDB**: 클라이언트 사이드 검증
- **MongoDB**: 서버 사이드 Mongoose 스키마 + express-validator

### 6. 에러 처리
- **IndexedDB**: try-catch 기반
- **MongoDB**: 미들웨어 기반 중앙집중식 에러 처리

## 기존 IndexedDB 코드와의 매핑

| IndexedDB 메소드 | MongoDB API 엔드포인트 |
|------------------|----------------------|
| `getAllBranches()` | `GET /api/branches` |
| `getBranchById(id)` | `GET /api/branches/:id` |
| `addBranch(data)` | `POST /api/branches` |
| `updateBranch(id, data)` | `PUT /api/branches/:id` |
| `deleteBranch(id)` | `DELETE /api/branches/:id` |
| `getActiveBranches()` | `GET /api/branches/active` |
| `getBranchByName(name)` | `GET /api/branches/search/:name` |

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 모드 실행
npm run dev

# 프로덕션 모드 실행
npm start
```

## 환경 변수 설정

`.env` 파일을 생성하고 `.env.example`을 참고하여 설정값을 입력하세요.