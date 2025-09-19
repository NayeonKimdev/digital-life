// Qwen2.5-VL 기반 고성능 OCR 서비스
import { TextRecognitionResult } from './textRecognition'

export interface QwenOCRResult {
  text: string
  confidence: number
  words: Array<{
    text: string
    confidence: number
    bbox: {
      x0: number
      y0: number
      x1: number
      y1: number
    }
  }>
  lines: Array<{
    text: string
    confidence: number
    bbox: {
      x0: number
      y0: number
      x1: number
      y1: number
    }
  }>
  processingTime: number
  qualityAssessment: {
    overallScore: number
    textLength: number
    wordCount: number
    averageConfidence: number
    hasKorean: boolean
    hasEnglish: boolean
    hasNumbers: boolean
    readabilityScore: number
  }
  analysis?: {
    documentType: string
    layout: string
    confidence: number
  }
  structure?: {
    paragraphs: Array<{
      text: string
      confidence: number
      bbox: { x0: number, y0: number, x1: number, y1: number }
    }>
    tables: Array<{
      text: string
      confidence: number
      bbox: { x0: number, y0: number, x1: number, y1: number }
    }>
    headers: Array<{
      text: string
      confidence: number
      bbox: { x0: number, y0: number, x1: number, y1: number }
    }>
  }
}

class QwenOCRService {
  private apiEndpoint: string
  private apiKey: string | undefined
  private isAvailable: boolean = false
  private fallbackService: any = null
  private cache: Map<string, QwenOCRResult> = new Map()
  private performanceStats: {
    totalRequests: number
    qwenRequests: number
    fallbackRequests: number
    averageProcessingTime: number
    cacheHits: number
  } = {
    totalRequests: 0,
    qwenRequests: 0,
    fallbackRequests: 0,
    averageProcessingTime: 0,
    cacheHits: 0
  }

  constructor() {
    // OpenRouter API를 통한 Qwen2.5-VL 설정
    this.apiEndpoint = process.env.NEXT_PUBLIC_API_ENDPOINT || 'https://openrouter.ai/api/v1/chat/completions'
    this.apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY
    
    console.log('🔧 OpenRouter API 설정:', {
      endpoint: this.apiEndpoint,
      hasApiKey: !!this.apiKey,
      apiKeyLength: this.apiKey?.length || 0,
      environment: process.env.NODE_ENV
    })
    
    // API 키 검증
    if (!this.apiKey) {
      console.error('❌ OpenRouter API 키가 설정되지 않았습니다!')
      console.log('💡 해결방법: .env.local 파일에 NEXT_PUBLIC_OPENROUTER_API_KEY=your_api_key 추가')
    } else if (this.apiKey.length < 10) {
      console.warn('⚠️ API 키가 너무 짧습니다. 올바른 키인지 확인하세요.')
    } else {
      console.log('✅ API 키 설정 확인됨')
    }
    
    // 서비스 가용성 확인 (클라이언트 사이드에서만 실행)
    if (typeof window !== 'undefined') {
      this.checkServiceAvailability().catch(error => {
        console.warn('Qwen2.5-VL 서비스 초기 확인 실패:', error.message)
      })
    } else {
      console.log('🔄 서버사이드 환경 - 클라이언트에서 API 연결 확인 예정')
    }
    
    // 캐시 정리 (클라이언트 사이드에서만 실행)
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.cleanupCache()
      }, 5 * 60 * 1000)
    }
  }

  // 서비스 가용성 확인 (클라이언트 사이드 전용)
  private async checkServiceAvailability(): Promise<void> {
    // 서버사이드에서는 실행하지 않음
    if (typeof window === 'undefined') {
      console.log('🔄 서버사이드 환경 - 클라이언트에서 API 연결 확인 예정')
      this.isAvailable = false
      return
    }

    try {
      console.log('🔍 OpenRouter API를 통한 Qwen2.5-VL 서비스 연결 확인 중...')
      console.log('📋 연결 정보:', {
        endpoint: this.apiEndpoint,
        hasApiKey: !!this.apiKey,
        apiKeyPrefix: this.apiKey?.substring(0, 8) + '...' || 'none'
      })
      
      if (!this.apiKey) {
        throw new Error('OpenRouter API 키가 설정되지 않았습니다.')
      }
      
      // AbortController를 사용한 타임아웃 설정
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10초로 단축
      
      console.log('📤 API 테스트 요청 전송 중...')
      
      // 간단한 테스트 요청으로 API 연결 확인
      const testResponse = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Digital Life OCR Service'
        },
        body: JSON.stringify({
          model: 'qwen/qwen2.5-vl-7b-instruct',
          messages: [
            {
              role: 'user',
              content: 'Hello'
            }
          ],
          max_tokens: 5
        }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      console.log('📥 API 응답 수신:', {
        status: testResponse.status,
        statusText: testResponse.statusText,
        ok: testResponse.ok
      })
      
      this.isAvailable = testResponse.ok
      
      if (this.isAvailable) {
        console.log('✅ OpenRouter API 연결 성공 - Qwen2.5-VL 사용 가능')
      } else {
        const errorText = await testResponse.text()
        console.warn('⚠️ OpenRouter API 응답 오류:', testResponse.status, errorText)
        this.isAvailable = false
      }
    } catch (error: any) {
      this.isAvailable = false
      
      console.error('❌ OpenRouter API 연결 실패:', error.message)
      
      if (error.name === 'AbortError') {
        console.warn('⏰ OpenRouter API 연결 타임아웃 (10초)')
      } else if (error.message?.includes('API 키')) {
        console.warn('🔑 OpenRouter API 키 오류:', error.message)
      } else if (error.message?.includes('Failed to fetch')) {
        console.warn('🌐 OpenRouter API 네트워크 오류')
      } else {
        console.warn('❌ OpenRouter API 연결 실패:', error.message)
      }
      
      console.log('🔄 폴백 모드로 전환 - Tesseract.js 사용')
    }
  }

  // 고성능 OCR 처리 (개선된 에러 처리 및 캐싱)
  async processImage(file: File): Promise<QwenOCRResult> {
    const startTime = performance.now()
    this.performanceStats.totalRequests++

    try {
      // 파일 유효성 검사
      this.validateFile(file)
      
      // 파일 해시 생성 (캐시 키)
      const fileHash = await this.generateFileHash(file)
      
      // 캐시 확인
      if (this.cache.has(fileHash)) {
        this.performanceStats.cacheHits++
        console.log('🚀 캐시에서 OCR 결과 반환')
        return this.cache.get(fileHash)!
      }

      let result: QwenOCRResult
      let serviceUsed = 'unknown'
      
      try {
        if (this.isAvailable) {
          result = await this.processWithQwen(file)
          this.performanceStats.qwenRequests++
          serviceUsed = 'qwen'
        } else {
          throw new Error('Qwen 서비스 사용 불가')
        }
      } catch (qwenError) {
        console.warn('⚠️ Qwen 서비스 실패, 폴백 서비스 사용:', qwenError)
        
        // 서비스 상태 업데이트
        this.isAvailable = false
        
        try {
          result = await this.processWithFallback(file)
          this.performanceStats.fallbackRequests++
          serviceUsed = 'fallback'
        } catch (fallbackError: any) {
          console.error('❌ 모든 OCR 서비스 실패:', fallbackError)
          throw new Error(`OCR 처리 실패: ${(qwenError as any).message}, 폴백 실패: ${fallbackError.message}`)
        }
      }

      // 결과 검증
      this.validateOCRResult(result)

      // 결과 캐싱 (5분 TTL)
      this.cache.set(fileHash, {
        ...result,
        processingTime: performance.now() - startTime
      })

      // 성능 통계 업데이트
      this.updatePerformanceStats(performance.now() - startTime)

      console.log(`✅ OCR 처리 완료 (${serviceUsed}):`, {
        processingTime: (performance.now() - startTime).toFixed(0) + 'ms',
        textLength: result.text.length,
        qualityScore: result.qualityAssessment.overallScore
      })

      return result
    } catch (error) {
      console.error('❌ OCR 처리 실패:', error)
      
      // 최종 폴백: 기본 결과 반환
      return this.createFallbackResult(file, error as Error, performance.now() - startTime)
    }
  }

  // Qwen2.5-VL 모델 사용 (OpenRouter API 버전)
  private async processWithQwen(file: File): Promise<QwenOCRResult> {
    const startTime = performance.now()
    
    try {
      console.log('🚀 OpenRouter API를 통한 Qwen2.5-VL OCR 처리 시작...')
      
      if (!this.apiKey) {
        throw new Error('OpenRouter API 키가 설정되지 않았습니다.')
      }
      
      // 이미지를 Base64로 변환
      const base64Image = await this.convertFileToBase64(file)
      console.log('📷 이미지 Base64 변환 완료, 크기:', base64Image.length)
      
      // OpenRouter API 요청 (간소화된 프롬프트)
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Digital Life OCR Service'
        },
        body: JSON.stringify({
          model: 'qwen/qwen2.5-vl-7b-instruct',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: '이미지에서 모든 텍스트를 추출해주세요. 한국어와 영어를 모두 인식해주세요.'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${file.type};base64,${base64Image}`
                  }
                }
              ]
            }
          ],
          max_tokens: 1000,
          temperature: 0.1
        }),
        signal: AbortSignal.timeout(30000) // 30초 타임아웃으로 단축
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`OpenRouter API 요청 실패: ${response.status} - ${errorText}`)
      }

      const apiResult = await response.json()
      const endTime = performance.now()
      const processingTime = endTime - startTime

      console.log('📥 API 응답 수신:', apiResult)

      // API 응답에서 텍스트 추출
      const extractedText = this.extractTextFromResponse(apiResult)
      
      // 결과 변환 및 품질 평가
      const qwenResult = this.transformOpenRouterResult(extractedText, processingTime)
      
      console.log('✅ OpenRouter Qwen2.5-VL OCR 완료:', {
        processingTime: processingTime.toFixed(0) + 'ms',
        textLength: qwenResult.text.length,
        qualityScore: qwenResult.qualityAssessment.overallScore,
        confidence: qwenResult.confidence
      })

      return qwenResult
    } catch (error) {
      console.error('OpenRouter Qwen2.5-VL 처리 실패:', error)
      throw error
    }
  }

  // 폴백 서비스 (기존 Tesseract.js)
  private async processWithFallback(file: File): Promise<QwenOCRResult> {
    console.log('⚠️ 폴백 서비스 사용 (Tesseract.js)')
    
    // 기존 Tesseract 서비스 import
    const { recognizeTextInImage } = await import('./textRecognition')
    const tesseractResult = await recognizeTextInImage(file)
    
    // Tesseract 결과를 Qwen 형식으로 변환
    return this.transformTesseractResult(tesseractResult)
  }

  // Qwen 결과 변환
  private transformQwenResult(apiResult: any, processingTime: number): QwenOCRResult {
    const text = apiResult.text || ''
    const confidence = apiResult.confidence || 0.95 // Qwen은 높은 정확도
    
    // 단어와 라인 정보 추출 (API 응답에 따라 조정)
    const words = apiResult.words || []
    const lines = apiResult.lines || []
    
    // 품질 평가
    const qualityAssessment = this.assessTextQuality(text, words, confidence)
    
    return {
      text,
      confidence,
      words,
      lines,
      processingTime,
      qualityAssessment,
      analysis: apiResult.analysis,
      structure: apiResult.structure
    }
  }

  // Tesseract 결과를 Qwen 형식으로 변환
  private transformTesseractResult(tesseractResult: TextRecognitionResult): QwenOCRResult {
    return {
      text: tesseractResult.text,
      confidence: tesseractResult.confidence,
      words: tesseractResult.words,
      lines: tesseractResult.lines,
      processingTime: tesseractResult.processingTime,
      qualityAssessment: tesseractResult.qualityAssessment,
      analysis: {
        documentType: 'unknown',
        layout: 'simple',
        confidence: tesseractResult.confidence
      },
      structure: {
        paragraphs: tesseractResult.lines.map(line => ({
          text: line.text,
          confidence: line.confidence,
          bbox: line.bbox
        })),
        tables: [],
        headers: []
      }
    }
  }

  // 텍스트 품질 평가 (개선된 버전)
  private assessTextQuality(text: string, words: any[], confidence: number): QwenOCRResult['qualityAssessment'] {
    const textLength = text.length
    const wordCount = words.length
    const averageConfidence = words.length > 0 
      ? words.reduce((sum, word) => sum + word.confidence, 0) / words.length 
      : confidence

    // 언어 감지 및 분석
    const languageAnalysis = this.analyzeLanguage(text)
    const hasKorean = languageAnalysis.hasKorean
    const hasEnglish = languageAnalysis.hasEnglish
    const hasNumbers = languageAnalysis.hasNumbers

    // 고급 품질 지표 계산
    const qualityMetrics = this.calculateAdvancedQualityMetrics(text, words, averageConfidence)
    const readabilityScore = this.calculateEnhancedReadabilityScore(text, words, languageAnalysis)

    // 전체 점수 계산 (다중 요소 고려)
    const overallScore = this.calculateOverallQualityScore({
      confidence: averageConfidence,
      readability: readabilityScore,
      languageComplexity: qualityMetrics.languageComplexity,
      textStructure: qualityMetrics.textStructure,
      characterAccuracy: qualityMetrics.characterAccuracy,
      isQwenService: this.isAvailable
    })

    return {
      overallScore: Math.max(0, Math.min(100, overallScore)),
      textLength,
      wordCount,
      averageConfidence: Math.round(averageConfidence * 100) / 100,
      hasKorean,
      hasEnglish,
      hasNumbers,
      readabilityScore: Math.round(readabilityScore * 100) / 100
    }
  }

  // 언어 분석
  private analyzeLanguage(text: string): {
    hasKorean: boolean
    hasEnglish: boolean
    hasNumbers: boolean
    koreanRatio: number
    englishRatio: number
    numberRatio: number
    mixedLanguage: boolean
  } {
    const koreanChars = (text.match(/[가-힣]/g) || []).length
    const englishChars = (text.match(/[a-zA-Z]/g) || []).length
    const numberChars = (text.match(/[0-9]/g) || []).length
    const totalChars = text.length

    const koreanRatio = totalChars > 0 ? koreanChars / totalChars : 0
    const englishRatio = totalChars > 0 ? englishChars / totalChars : 0
    const numberRatio = totalChars > 0 ? numberChars / totalChars : 0

    return {
      hasKorean: koreanChars > 0,
      hasEnglish: englishChars > 0,
      hasNumbers: numberChars > 0,
      koreanRatio,
      englishRatio,
      numberRatio,
      mixedLanguage: koreanChars > 0 && englishChars > 0
    }
  }

  // 고급 품질 지표 계산
  private calculateAdvancedQualityMetrics(text: string, words: any[], confidence: number): {
    languageComplexity: number
    textStructure: number
    characterAccuracy: number
  } {
    // 언어 복잡도 (한국어+영어 혼합시 높은 점수)
    const languageAnalysis = this.analyzeLanguage(text)
    const languageComplexity = languageAnalysis.mixedLanguage ? 0.9 : 
      (languageAnalysis.koreanRatio > 0.7 ? 0.8 : 0.7)

    // 텍스트 구조 점수
    const textStructure = this.calculateTextStructureScore(text, words)

    // 문자 정확도 (신뢰도 기반)
    const characterAccuracy = Math.min(confidence * 1.2, 1.0)

    return {
      languageComplexity,
      textStructure,
      characterAccuracy
    }
  }

  // 텍스트 구조 점수 계산
  private calculateTextStructureScore(text: string, words: any[]): number {
    let score = 0

    // 문장 부호 다양성
    const punctuationTypes = new Set(text.match(/[.,;:!?()[\]{}]/g) || [])
    score += Math.min(punctuationTypes.size / 5, 1) * 30

    // 단어 길이 분포
    if (words.length > 0) {
      const wordLengths = words.map(w => w.text.length)
      const avgLength = wordLengths.reduce((a, b) => a + b, 0) / wordLengths.length
      const lengthVariance = wordLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / wordLengths.length
      score += Math.min(lengthVariance / 10, 1) * 25
    }

    // 대소문자 사용 (영어의 경우)
    const hasMixedCase = /[a-z]/.test(text) && /[A-Z]/.test(text)
    score += hasMixedCase ? 25 : 0

    // 숫자와 문자의 적절한 혼합
    const hasNumbers = /[0-9]/.test(text)
    const hasLetters = /[a-zA-Z가-힣]/.test(text)
    score += (hasNumbers && hasLetters) ? 20 : 0

    return Math.min(score, 1)
  }

  // 향상된 가독성 점수 계산
  private calculateEnhancedReadabilityScore(text: string, words: any[], languageAnalysis: any): number {
    if (text.length === 0) return 0

    let score = 0

    // 기본 가독성 요소들
    score += this.calculateBasicReadability(text, words) * 40

    // 언어별 특화 점수
    if (languageAnalysis.hasKorean) {
      score += this.calculateKoreanReadability(text) * 30
    }
    if (languageAnalysis.hasEnglish) {
      score += this.calculateEnglishReadability(text) * 30
    }

    // 혼합 언어 보너스
    if (languageAnalysis.mixedLanguage) {
      score += 0.1
    }

    return Math.min(score, 1)
  }

  // 기본 가독성 계산
  private calculateBasicReadability(text: string, words: any[]): number {
    let score = 0

    // 단어 길이 다양성
    if (words.length > 0) {
      const avgWordLength = words.reduce((sum, word) => sum + word.text.length, 0) / words.length
      score += Math.min(avgWordLength / 5, 1) * 0.4
    }

    // 문장 구조
    const punctuationCount = (text.match(/[.,;:!?]/g) || []).length
    score += Math.min(punctuationCount / text.length * 100, 1) * 0.3

    // 공백 사용
    const spaceRatio = (text.match(/\s/g) || []).length / text.length
    score += Math.min(Math.abs(spaceRatio - 0.15) * 10, 1) * 0.3

    return Math.min(score, 1)
  }

  // 한국어 가독성 계산
  private calculateKoreanReadability(text: string): number {
    let score = 0

    // 한글 자모 조합 다양성
    const koreanChars = text.match(/[가-힣]/g) || []
    const uniqueChars = new Set(koreanChars).size
    score += Math.min(uniqueChars / 20, 1) * 0.5

    // 한국어 문장 부호
    const koreanPunctuation = (text.match(/[.,;:!?]/g) || []).length
    score += Math.min(koreanPunctuation / text.length * 200, 1) * 0.5

    return Math.min(score, 1)
  }

  // 영어 가독성 계산
  private calculateEnglishReadability(text: string): number {
    let score = 0

    // 대소문자 혼용
    const hasMixedCase = /[a-z]/.test(text) && /[A-Z]/.test(text)
    score += hasMixedCase ? 0.4 : 0

    // 영어 단어 다양성
    const englishWords = text.match(/[a-zA-Z]+/g) || []
    const uniqueWords = new Set(englishWords.map(w => w.toLowerCase())).size
    score += Math.min(uniqueWords / 10, 1) * 0.3

    // 영어 문장 부호
    const englishPunctuation = (text.match(/[.,;:!?]/g) || []).length
    score += Math.min(englishPunctuation / text.length * 200, 1) * 0.3

    return Math.min(score, 1)
  }

  // 전체 품질 점수 계산
  private calculateOverallQualityScore(metrics: {
    confidence: number
    readability: number
    languageComplexity: number
    textStructure: number
    characterAccuracy: number
    isQwenService: boolean
  }): number {
    const weights = {
      confidence: 0.25,
      readability: 0.20,
      languageComplexity: 0.15,
      textStructure: 0.15,
      characterAccuracy: 0.15,
      serviceBonus: 0.10
    }

    let score = 0
    score += metrics.confidence * weights.confidence
    score += metrics.readability * weights.readability
    score += metrics.languageComplexity * weights.languageComplexity
    score += metrics.textStructure * weights.textStructure
    score += metrics.characterAccuracy * weights.characterAccuracy

    // Qwen 서비스 사용시 보너스
    if (metrics.isQwenService) {
      score += weights.serviceBonus
    }

    return Math.round(score * 100)
  }

  // 서비스 상태 확인
  getServiceStatus(): { available: boolean, endpoint: string } {
    return {
      available: this.isAvailable,
      endpoint: this.apiEndpoint
    }
  }

  // 서비스 재연결 시도
  async reconnect(): Promise<void> {
    await this.checkServiceAvailability()
  }

  // 클라이언트 사이드에서 API 연결 확인
  async checkConnectionOnClient(): Promise<void> {
    if (typeof window === 'undefined') {
      console.log('🔄 서버사이드 환경 - 클라이언트에서 실행하세요')
      return
    }
    
    console.log('🌐 클라이언트에서 API 연결 확인 시작...')
    await this.checkServiceAvailability()
  }

  // 파일 해시 생성 (캐시 키용)
  private async generateFileHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  // 성능 통계 업데이트
  private updatePerformanceStats(processingTime: number): void {
    const totalTime = this.performanceStats.averageProcessingTime * (this.performanceStats.totalRequests - 1)
    this.performanceStats.averageProcessingTime = (totalTime + processingTime) / this.performanceStats.totalRequests
  }

  // 캐시 정리
  private cleanupCache(): void {
    const now = Date.now()
    const maxAge = 5 * 60 * 1000 // 5분
    
    const entries = Array.from(this.cache.entries())
    for (const [key, value] of entries) {
      if (now - value.processingTime > maxAge) {
        this.cache.delete(key)
      }
    }
    
    console.log(`🧹 캐시 정리 완료, 현재 캐시 크기: ${this.cache.size}`)
  }

  // 성능 통계 조회
  getPerformanceStats() {
    return {
      ...this.performanceStats,
      cacheSize: this.cache.size,
      cacheHitRate: this.performanceStats.totalRequests > 0 
        ? (this.performanceStats.cacheHits / this.performanceStats.totalRequests * 100).toFixed(1) + '%'
        : '0%',
      qwenUsageRate: this.performanceStats.totalRequests > 0
        ? (this.performanceStats.qwenRequests / this.performanceStats.totalRequests * 100).toFixed(1) + '%'
        : '0%'
    }
  }

  // 캐시 클리어
  clearCache(): void {
    this.cache.clear()
    console.log('🗑️ OCR 캐시 클리어 완료')
  }

  // 이미지 전처리 및 최적화
  private async preprocessImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        reject(new Error('Canvas 컨텍스트를 생성할 수 없습니다.'))
        return
      }

      img.onload = () => {
        try {
          // 이미지 크기 최적화 (너무 크면 리사이즈)
          const maxSize = 2048
          let { width, height } = img
          
          if (width > maxSize || height > maxSize) {
            const ratio = Math.min(maxSize / width, maxSize / height)
            width *= ratio
            height *= ratio
          }

          canvas.width = width
          canvas.height = height

          // 이미지 품질 향상
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          
          // 대비 및 선명도 향상
          ctx.filter = 'contrast(1.2) brightness(1.1) saturate(1.1)'
          
          ctx.drawImage(img, 0, 0, width, height)

          // Canvas를 Blob으로 변환
          canvas.toBlob((blob) => {
            if (blob) {
              const optimizedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              })
              console.log('🖼️ 이미지 전처리 완료:', {
                originalSize: file.size,
                optimizedSize: optimizedFile.size,
                compressionRatio: ((file.size - optimizedFile.size) / file.size * 100).toFixed(1) + '%'
              })
              resolve(optimizedFile)
            } else {
              reject(new Error('이미지 최적화에 실패했습니다.'))
            }
          }, 'image/jpeg', 0.95)
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => {
        reject(new Error('이미지 로딩에 실패했습니다.'))
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string
        } else {
          reject(new Error('파일 읽기에 실패했습니다.'))
        }
      }
      reader.readAsDataURL(file)
    })
  }

  // 결과 검증 및 후처리
  private validateAndEnhanceResult(result: any): any {
    // 기본 검증
    if (!result || typeof result !== 'object') {
      throw new Error('유효하지 않은 API 응답입니다.')
    }

    // 텍스트 정제 및 향상
    if (result.text) {
      result.text = this.enhanceText(result.text)
    }

    // 신뢰도 검증 및 조정
    if (result.confidence && result.confidence < 0.5) {
      console.warn('⚠️ 낮은 신뢰도 감지:', result.confidence)
      // 낮은 신뢰도일 때 추가 후처리 적용
      result.text = this.postProcessLowConfidenceText(result.text)
    }

    // 단어 및 라인 정보 검증
    if (result.words && Array.isArray(result.words)) {
      result.words = result.words.filter((word: any) => 
        word && word.text && word.text.trim().length > 0
      )
    }

    if (result.lines && Array.isArray(result.lines)) {
      result.lines = result.lines.filter((line: any) => 
        line && line.text && line.text.trim().length > 0
      )
    }

    return result
  }

  // 텍스트 향상
  private enhanceText(text: string): string {
    if (!text) return ''

    return text
      .trim()
      // 여러 공백을 하나로
      .replace(/\s+/g, ' ')
      // 잘못 인식된 문자 수정
      .replace(/[0O]/g, (match, offset, string) => {
        // 숫자 맥락에서는 0, 문자 맥락에서는 O
        const prev = string[offset - 1]
        const next = string[offset + 1]
        if (/[0-9]/.test(prev) || /[0-9]/.test(next)) {
          return '0'
        }
        return 'O'
      })
      // 한국어 특수문자 정리
      .replace(/[^\w\s가-힣.,;:!?()[\]{}@#$%^&*+-=<>/\\|`~"']/g, '')
      // 문장 부호 정리
      .replace(/([.!?])\s*([a-zA-Z가-힣])/g, '$1 $2')
  }

  // 낮은 신뢰도 텍스트 후처리
  private postProcessLowConfidenceText(text: string): string {
    if (!text) return ''

    return text
      // 일반적인 OCR 오류 수정
      .replace(/rn/g, 'm')
      .replace(/cl/g, 'd')
      .replace(/li/g, 'h')
      .replace(/I1/g, 'H')
      .replace(/0O/g, 'OO')
      // 한국어 특수 오류 수정
      .replace(/ㅇ/g, 'O')
      .replace(/ㅁ/g, 'M')
      .replace(/ㅂ/g, 'B')
  }

  // 파일 유효성 검사
  private validateFile(file: File): void {
    if (!file) {
      throw new Error('파일이 제공되지 않았습니다.')
    }

    if (file.size === 0) {
      throw new Error('빈 파일입니다.')
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB 제한
      throw new Error('파일 크기가 너무 큽니다. (최대 50MB)')
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`지원하지 않는 파일 형식입니다: ${file.type}`)
    }

    console.log('✅ 파일 검증 통과:', {
      name: file.name,
      size: file.size,
      type: file.type
    })
  }

  // OCR 결과 검증
  private validateOCRResult(result: QwenOCRResult): void {
    if (!result) {
      throw new Error('OCR 결과가 없습니다.')
    }

    if (typeof result.text !== 'string') {
      throw new Error('OCR 결과의 텍스트가 유효하지 않습니다.')
    }

    if (typeof result.confidence !== 'number' || result.confidence < 0 || result.confidence > 1) {
      throw new Error('OCR 결과의 신뢰도가 유효하지 않습니다.')
    }

    if (!Array.isArray(result.words)) {
      throw new Error('OCR 결과의 단어 정보가 유효하지 않습니다.')
    }

    if (!Array.isArray(result.lines)) {
      throw new Error('OCR 결과의 라인 정보가 유효하지 않습니다.')
    }

    console.log('✅ OCR 결과 검증 통과:', {
      textLength: result.text.length,
      confidence: result.confidence,
      wordCount: result.words.length,
      lineCount: result.lines.length
    })
  }

  // 최종 폴백 결과 생성
  private createFallbackResult(file: File, error: Error, processingTime: number): QwenOCRResult {
    console.warn('🆘 최종 폴백 결과 생성:', error.message)

    return {
      text: `OCR 처리 실패: ${error.message}`,
      confidence: 0.1,
      words: [],
      lines: [],
      processingTime,
      qualityAssessment: {
        overallScore: 10,
        textLength: 0,
        wordCount: 0,
        averageConfidence: 0.1,
        hasKorean: false,
        hasEnglish: false,
        hasNumbers: false,
        readabilityScore: 0
      },
      analysis: {
        documentType: 'error',
        layout: 'unknown',
        confidence: 0.1
      },
      structure: {
        paragraphs: [],
        tables: [],
        headers: []
      }
    }
  }

  // 파일을 Base64로 변환
  private async convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // data:image/jpeg;base64, 부분 제거
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = () => {
        reject(new Error('파일을 Base64로 변환하는데 실패했습니다.'))
      }
      reader.readAsDataURL(file)
    })
  }

  // OpenRouter API 응답에서 텍스트 추출 (개선된 버전)
  private extractTextFromResponse(apiResult: any): any {
    try {
      const content = apiResult.choices?.[0]?.message?.content
      if (!content) {
        throw new Error('API 응답에 텍스트가 없습니다.')
      }

      console.log('📝 추출된 원본 텍스트:', content.substring(0, 200) + '...')

      // JSON 형식으로 응답을 파싱 시도
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsedJson = JSON.parse(jsonMatch[0])
          console.log('✅ JSON 파싱 성공:', parsedJson)
          return parsedJson
        }
      } catch (parseError) {
        console.warn('⚠️ JSON 파싱 실패, 일반 텍스트로 처리:', parseError)
      }

      // JSON 파싱 실패시 일반 텍스트로 처리
      const result = {
        text: content.trim(),
        confidence: 0.8,
        words: [],
        lines: []
      }
      
      console.log('📄 일반 텍스트로 처리됨:', result)
      return result
    } catch (error) {
      console.error('❌ API 응답 처리 실패:', error)
      throw new Error('API 응답을 처리할 수 없습니다.')
    }
  }

  // OpenRouter 결과를 Qwen 형식으로 변환
  private transformOpenRouterResult(apiResult: any, processingTime: number): QwenOCRResult {
    const text = apiResult.text || ''
    const confidence = apiResult.confidence || 0.9 // OpenRouter는 높은 정확도
    
    // 단어와 라인 정보 추출
    const words = apiResult.words || []
    const lines = apiResult.lines || []
    
    // 품질 평가
    const qualityAssessment = this.assessTextQuality(text, words, confidence)
    
    return {
      text,
      confidence,
      words,
      lines,
      processingTime,
      qualityAssessment,
      analysis: {
        documentType: 'document',
        layout: 'mixed',
        confidence: confidence
      },
      structure: {
        paragraphs: lines.map((line: any) => ({
          text: line.text,
          confidence: line.confidence,
          bbox: line.bbox
        })),
        tables: [],
        headers: []
      }
    }
  }
}

// 싱글톤 인스턴스
export const qwenOCRService = new QwenOCRService()

// 유틸리티 함수
export const processImageWithQwen = async (file: File): Promise<QwenOCRResult> => {
  return await qwenOCRService.processImage(file)
}

// 기존 인터페이스와 호환성을 위한 변환 함수
export const convertToTextRecognitionResult = (qwenResult: QwenOCRResult): TextRecognitionResult => {
  return {
    text: qwenResult.text,
    confidence: qwenResult.confidence,
    words: qwenResult.words,
    lines: qwenResult.lines,
    processingTime: qwenResult.processingTime,
    qualityAssessment: qwenResult.qualityAssessment
  }
}

// Qwen2.5-VL 서비스 설정 및 상태 확인 유틸리티
export const QwenOCRUtils = {
  // 서비스 상태 확인
  getServiceStatus: () => qwenOCRService.getServiceStatus(),
  
  // 성능 통계 조회
  getPerformanceStats: () => qwenOCRService.getPerformanceStats(),
  
  // 서비스 재연결 시도
  reconnect: () => qwenOCRService.reconnect(),
  
  // 캐시 클리어
  clearCache: () => qwenOCRService.clearCache(),
  
  // 환경 변수 설정 가이드
  getSetupGuide: () => ({
    title: 'OpenRouter API를 통한 Qwen2.5-VL OCR 서비스 설정 가이드',
    steps: [
      '1. .env.local 파일에 API 키 설정: NEXT_PUBLIC_OPENROUTER_API_KEY=your_api_key',
      '2. API 엔드포인트 설정: NEXT_PUBLIC_API_ENDPOINT=https://openrouter.ai/api/v1/chat/completions',
      '3. OpenRouter 계정에서 API 키 발급 (https://openrouter.ai/)',
      '4. Qwen2.5-VL 모델 사용: qwen/qwen2.5-vl-7b-instruct',
      '5. 이미지는 Base64로 인코딩하여 전송',
      '6. 응답은 JSON 형식으로 파싱하여 텍스트 추출'
    ],
    currentEndpoint: qwenOCRService.getServiceStatus().endpoint,
    isAvailable: qwenOCRService.getServiceStatus().available,
    hasApiKey: !!qwenOCRService.getServiceStatus().available
  }),
  
  // API 연결 진단
  diagnoseConnection: async () => {
    console.log('🔍 OpenRouter API 연결 진단 시작...')
    
    const status = qwenOCRService.getServiceStatus()
    console.log('📊 현재 상태:', status)
    
    // 환경 변수 확인
    const envCheck = {
      hasApiKey: !!process.env.NEXT_PUBLIC_OPENROUTER_API_KEY,
      apiKeyLength: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY?.length || 0,
      hasEndpoint: !!process.env.NEXT_PUBLIC_API_ENDPOINT,
      endpoint: process.env.NEXT_PUBLIC_API_ENDPOINT || 'default'
    }
    
    console.log('🔧 환경 변수 상태:', envCheck)
    
    if (!envCheck.hasApiKey) {
      console.error('❌ NEXT_PUBLIC_OPENROUTER_API_KEY가 설정되지 않았습니다!')
      console.log('💡 해결방법: .env.local 파일에 API 키를 추가하세요')
      return false
    }
    
    if (envCheck.apiKeyLength < 10) {
      console.warn('⚠️ API 키가 너무 짧습니다. 올바른 키인지 확인하세요.')
      return false
    }
    
    // 네트워크 연결 테스트
    try {
      console.log('🌐 네트워크 연결 테스트...')
      const testResponse = await fetch('https://openrouter.ai/api/v1/models', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })
      
      if (testResponse.ok) {
        console.log('✅ OpenRouter 서버 연결 성공')
      } else {
        console.warn('⚠️ OpenRouter 서버 응답 오류:', testResponse.status)
      }
    } catch (error: any) {
      console.error('❌ 네트워크 연결 실패:', error.message)
      return false
    }
    
    // API 재연결 시도
    console.log('🔄 API 재연결 시도...')
    await qwenOCRService.reconnect()
    
    const finalStatus = qwenOCRService.getServiceStatus()
    console.log('📊 최종 상태:', finalStatus)
    
    return finalStatus.available
  }
}
