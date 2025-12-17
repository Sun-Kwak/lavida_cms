# LaVida CMS - 통합 관리 시스템

라비다 스포츠 센터를 위한 통합 관리 플랫폼입니다. 관리자용 웹 애플리케이션과 사용자용 모바일 앱을 하나의 저장소에서 관리하는 모노레포 구조로 구성되어 있습니다.

## 🏗️ 프로젝트 구조

```
lavida_cms/
├── admin/          # 관리자 웹 애플리케이션 (React)
├── mobile/         # 사용자 모바일 앱 (Flutter)  
├── server/         # 백엔드 서버 (Node.js)
└── shared/         # 공통 리소스 및 문서
```

## 🚀 시작하기

### 관리자 웹 애플리케이션 (React)

```bash
cd admin
npm install
npm start
```

- 개발 서버: http://localhost:3000
- 프로덕션 빌드: `npm run build`
- 테스트: `npm test`

### 사용자 모바일 앱 (Flutter)

```bash
cd mobile
flutter pub get
flutter run
```

- iOS/Android 시뮬레이터에서 실행
- 웹 버전: `flutter run -d chrome`

### 백엔드 서버

```bash
cd server
npm install
npm start
```

## 📱 애플리케이션 소개

### 관리자 웹 (React)
- 회원 관리
- 예약 시스템 관리
- 결제 관리
- 운동 처방전 작성
- 통계 및 분석

### 사용자 모바일 앱 (Flutter)
- 시설 예약
- 운동 프로그램 조회
- 개인 운동 기록
- 알림 서비스

## 🛠️ 기술 스택

- **Frontend (Admin)**: React, TypeScript, Material-UI
- **Mobile**: Flutter, Dart
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Authentication**: JWT

## 📦 배포

### 관리자 웹 배포
GitHub Pages를 통해 자동 배포됩니다.
- URL: https://sun-kwak.github.io/lavida_cms

### 모바일 앱 배포
- Android: Google Play Store
- iOS: Apple App Store

## 🤝 개발 가이드

각 프로젝트별 상세한 개발 가이드는 해당 폴더의 README.md를 참조하세요.

- [관리자 웹 개발 가이드](./admin/README.md)
- [모바일 앱 개발 가이드](./mobile/README.md)
- [서버 개발 가이드](./server/README.md)

## 📝 개발 환경 설정

### 필요한 도구
- Node.js (v16 이상)
- Flutter SDK (v3.0 이상)
- Git

### 프로젝트 클론 및 설정

```bash
git clone https://github.com/Sun-Kwak/lavida_cms.git
cd lavida_cms

# 관리자 웹 설정
cd admin
npm install

# 모바일 앱 설정
cd ../mobile
flutter pub get

# 서버 설정
cd ../server
npm install
```

## 🔄 GitHub Actions

이 프로젝트는 GitHub Actions를 통한 자동 배포가 설정되어 있습니다:

- **admin 폴더**: GitHub Pages 자동 배포
- **mobile 폴더**: 빌드 테스트
- **server 폴더**: 테스트 및 린트

## 📞 문의

프로젝트 관련 문의사항이 있으시면 이슈를 생성해 주세요.