# 디지털 라이프 분석기

## 📱 나의 디지털 자서전

인스타그램, 카카오톡, 검색 기록을 분석하여 나만의 라이프스타일을 발견하는 AI 기반 분석 플랫폼입니다.

## ✨ 주요 기능

### 🚀 간편한 데이터 업로드
- **드래그&드롭**: 여러 파일을 한 번에 업로드
- **다양한 형식 지원**: 이미지, JSON, CSV, PDF, 문서 파일
- **실시간 처리**: 업로드와 동시에 메타데이터 추출

### 🤖 AI 기반 분석
- **라이프스타일 분석**: 사진, 위치, 시간 데이터를 통한 패턴 분석
- **감정 분석**: 텍스트와 이미지를 통한 감정 상태 파악
- **관심사 추출**: 자동으로 카테고리 분류 및 태깅
- **행동 패턴 분석**: 시간대별 활동 패턴 및 수면 패턴 추정
- **심리 분석**: 감정 안정성, 스트레스 시기 감지
- **개인화 추천**: 맞춤형 라이프스타일 개선 제안

### 📊 시각화 대시보드
- **타임라인 차트**: 일별 활동 패턴 시각화
- **관심사 분포**: 파이 차트로 취향 분석
- **감정 변화**: 시간대별 감정 상태 추이
- **위치 분석**: 방문 지역 히트맵
- **고급 분석 뷰어**: 행동 패턴, 감정 분석, 성능 메트릭 시각화

### ⚡ 성능 최적화
- **캐싱 시스템**: 분석 결과 캐싱으로 빠른 재분석
- **병렬 처리**: 대용량 파일 동시 처리
- **메모리 관리**: 자동 메모리 정리 및 최적화
- **실시간 모니터링**: 성능 메트릭 및 사용자 경험 추적

### 🇰🇷 한국 서비스 특화
- **Instagram**: 좋아요, 스토리, 게시물 데이터 분석
- **카카오톡**: 대화 내역, 이모티콘 사용 패턴
- **네이버**: 검색 기록, 쇼핑 내역 분석
- **배달앱**: 주문 패턴, 음식 선호도 분석

## 🛠️ 기술 스택

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **UI/UX**: Framer Motion, Headless UI, Heroicons
- **Charts**: Recharts
- **File Processing**: React Dropzone, EXIFR, PDF-Parse
- **AI/ML**: TensorFlow.js, Tesseract.js (OCR)
- **Performance**: 캐싱 시스템, 메모리 최적화, 병렬 처리
- **Styling**: Tailwind CSS with custom design system

## 📁 프로젝트 구조

```
digital-life/
├── app/                    # Next.js App Router
│   ├── globals.css        # 전역 스타일
│   ├── layout.tsx         # 루트 레이아웃
│   └── page.tsx           # 메인 페이지
├── components/            # React 컴포넌트
│   ├── ui/               # 재사용 가능한 UI 컴포넌트
│   ├── charts/           # 차트 컴포넌트
│   ├── FileUpload.tsx    # 파일 업로드 컴포넌트
│   ├── AnalysisDashboard.tsx # 분석 결과 대시보드
│   ├── AdvancedAnalysisViewer.tsx # 고급 분석 뷰어
│   └── ServiceGuide.tsx  # 서비스별 가이드
├── hooks/                # 커스텀 훅
│   └── index.ts         # 파일 업로드 및 분석 훅
├── utils/               # 유틸리티 함수
│   ├── index.ts         # 기본 유틸리티
│   ├── personalDataAnalyzer.ts # 개인 데이터 분석 시스템
│   ├── optimizedAnalysisPipeline.ts # 최적화된 분석 파이프라인
│   ├── performanceMonitor.ts # 성능 모니터링
│   ├── advancedImageAnalysis.ts # 고급 이미지 분석
│   ├── objectDetection.ts # 객체 검출
│   └── textRecognition.ts # 텍스트 인식
├── types/               # TypeScript 타입 정의
├── constants/           # 상수 정의
├── package.json         # 의존성 관리
└── README.md           # 프로젝트 문서
```

## 🚀 시작하기

### 사전 요구사항
- Node.js 18.0 이상
- npm 또는 yarn

### 설치
```bash
# 저장소 클론
git clone https://github.com/your-username/digital-life.git
cd digital-life

# 의존성 설치
npm install
```

### 개발 서버 실행
```bash
npm run dev
```
개발 서버가 [http://localhost:3000](http://localhost:3000)에서 실행됩니다.

### 빌드
```bash
npm run build
npm start
```

## 🎯 핵심 성공 요소

### 1. 사용자 경험 최적화
- **원클릭 업로드**: 토스처럼 간편한 UX
- **실시간 피드백**: 업로드 진행상황 표시
- **모바일 최적화**: QR코드로 PC↔모바일 연동
- **성능 모니터링**: 실시간 성능 추적 및 최적화

### 2. 차별화된 분석
- **라이프스타일 통합 분석**: 시간 추적을 넘어선 전체적 관점
- **한국 특화**: 카카오톡, 네이버 등 현지 서비스 연동
- **AI 인사이트**: 개인화된 추천 및 예측
- **행동 패턴 분석**: 수면 패턴, 활동 패턴, 감정 패턴 분석
- **심리 분석**: 감정 안정성, 스트레스 관리, 회복 시간 분석

### 3. 기술적 우위
- **최적화된 파이프라인**: 병렬 처리 및 캐싱으로 빠른 분석
- **메모리 효율성**: 대용량 데이터 처리 최적화
- **실시간 모니터링**: 성능 메트릭 및 사용자 경험 추적
- **확장 가능한 아키텍처**: 모듈화된 설계로 쉬운 기능 추가

### 4. 수익화 전략
- **프리미엄 기능**: 실시간 분석, 예측 모델, 고급 인사이트
- **B2B 확장**: 기업 웰빙 분석, 마케팅 인사이트
- **데이터 활용**: 익명화된 집계 데이터 판매
- **API 서비스**: 분석 엔진 API 제공

## 🔒 보안 및 개인정보

- **암호화 저장**: 모든 데이터는 AES-256 암호화
- **자동 삭제**: 분석 완료 후 원본 파일 자동 삭제
- **개인정보 보호**: 제3자 공유 금지, 사용자 동의 기반
- **데이터 소유권**: 언제든지 삭제 요청 가능
- **로컬 처리**: 민감한 데이터는 클라이언트에서 처리

## 🚧 개발 로드맵

### Phase 1: MVP ✅
- [x] 기본 UI/UX 구현
- [x] 파일 업로드 시스템
- [x] 기본 분석 대시보드
- [x] 서비스별 가이드
- [x] 코드 구조 정리 및 리팩토링

### Phase 2: AI 분석 엔진 ✅
- [x] 이미지 메타데이터 추출
- [x] 텍스트 감정 분석
- [x] 패턴 인식 알고리즘
- [x] 개인화 추천 시스템
- [x] 행동 패턴 분석
- [x] 심리 분석 시스템
- [x] 최적화된 분석 파이프라인
- [x] 캐싱 시스템
- [x] 성능 모니터링

### Phase 3: 고급 기능
- [ ] 실시간 분석
- [ ] 예측 모델
- [ ] 소셜 기능
- [ ] API 연동
- [ ] 고급 시각화

### Phase 4: 확장
- [ ] 모바일 앱
- [ ] B2B 서비스
- [ ] 국제화
- [ ] 고급 분석 도구

## 🏗️ 아키텍처

### 분석 시스템 구조
```
PersonalDataAnalyzer (메인 분석기)
├── TextAnalyzer (텍스트 분석)
├── ImageAnalyzer (이미지 분석)
├── BehaviorPatternAnalyzer (행동 패턴 분석)
├── DeepAnalyzer (심화 분석)
└── PersonalizationEngine (개인화 엔진)

OptimizedAnalysisPipeline (최적화된 파이프라인)
├── CacheManager (캐시 관리)
├── PerformanceMonitor (성능 모니터링)
├── MemoryOptimizer (메모리 최적화)
└── UserExperienceOptimizer (UX 최적화)
```

### 데이터 플로우
1. **파일 업로드** → 메타데이터 추출
2. **전처리** → 파일 검증 및 정규화
3. **병렬 분석** → 텍스트, 이미지, 패턴 분석
4. **통합 분석** → 행동 패턴, 감정 분석
5. **개인화** → 맞춤형 추천 생성
6. **캐싱** → 결과 저장 및 최적화

## 🤝 기여하기

프로젝트에 기여해주셔서 감사합니다! 다음 단계를 따라주세요:

1. **Fork the Project** - 저장소를 포크합니다
2. **Create your Feature Branch** - `git checkout -b feature/AmazingFeature`
3. **Commit your Changes** - `git commit -m 'Add some AmazingFeature'`
4. **Push to the Branch** - `git push origin feature/AmazingFeature`
5. **Open a Pull Request** - Pull Request를 생성합니다

### 개발 가이드라인
- 코드 스타일은 Prettier와 ESLint를 따릅니다
- 새로운 기능 추가 시 테스트를 작성해주세요
- 커밋 메시지는 명확하고 간결하게 작성해주세요
- 성능에 영향을 주는 변경사항은 벤치마크를 포함해주세요

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해주세요.

---

**디지털 라이프 분석기**로 당신만의 디지털 자서전을 만들어보세요! 🚀