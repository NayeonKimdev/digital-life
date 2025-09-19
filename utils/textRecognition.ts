import Tesseract from 'tesseract.js'
import { qwenOCRService, convertToTextRecognitionResult, QwenOCRResult } from './qwenOCR'
import { recognizeTextInImageImproved } from './improvedOCR'

export interface TextRecognitionResult {
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
}

// TextBasedClassification 인터페이스 제거 - 단순화

class TextRecognitionService {
  private worker: Tesseract.Worker | null = null
  private isInitialized = false

  async initialize(): Promise<void> {
    if (this.isInitialized && this.worker) {
      return
    }

    try {
      console.log('OCR 텍스트 인식 서비스를 초기화 중...')
      
      // Tesseract.js 워커 생성 (한국어 + 영어 지원)
      this.worker = await Tesseract.createWorker('kor+eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`OCR 진행률: ${Math.round(m.progress * 100)}%`)
          }
        }
      })
      
      await this.worker.reinitialize()
      await this.worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789가-힣()[]{}.,;:!?@#$%^&*+-=<>/\\|`~"\' ',
        tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK, // 단일 블록으로 처리
        tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
        preserve_interword_spaces: '1',
        tessedit_create_hocr: '0',
        tessedit_create_tsv: '0',
        tessedit_create_boxfile: '0',
        // 추가 정확도 향상 설정
        tessedit_char_blacklist: '',
        classify_enable_learning: '0',
        textord_min_linesize: '2.5',
        textord_tabfind_show_vlines: '0'
      })
      
      this.isInitialized = true
      console.log('OCR 텍스트 인식 서비스 초기화 완료')
    } catch (error) {
      console.error('OCR 초기화 실패:', error)
      throw new Error('텍스트 인식 서비스를 초기화할 수 없습니다.')
    }
  }

  async recognizeText(imageElement: HTMLImageElement): Promise<TextRecognitionResult> {
    if (!this.worker) {
      await this.initialize()
    }

    if (!this.worker) {
      throw new Error('OCR 워커가 초기화되지 않았습니다.')
    }

    const startTime = performance.now()

    try {
      console.log('이미지에서 텍스트 인식 시작...')
      console.log('이미지 크기:', imageElement.width, 'x', imageElement.height)
      
      const { data } = await this.worker.recognize(imageElement)
      const endTime = performance.now()
      const processingTime = endTime - startTime
      
      console.log('텍스트 인식 완료:', {
        text: data.text?.substring(0, 100) + (data.text?.length > 100 ? '...' : ''),
        confidence: data.confidence,
        processingTime: processingTime.toFixed(0) + 'ms'
      })

      // 단어별 정보 추출 (타입 안전하게 수정)
      const words = (data as any).words?.map((word: any) => ({
        text: word.text?.trim() || '',
        confidence: (word.confidence || 0) / 100,
        bbox: {
          x0: word.bbox?.x0 || 0,
          y0: word.bbox?.y0 || 0,
          x1: word.bbox?.x1 || 0,
          y1: word.bbox?.y1 || 0
        }
      })).filter((word: any) => word.text.length > 0) || []

      // 라인별 정보 추출 (타입 안전하게 수정)
      const lines = (data as any).lines?.map((line: any) => ({
        text: line.text?.trim() || '',
        confidence: (line.confidence || 0) / 100,
        bbox: {
          x0: line.bbox?.x0 || 0,
          y0: line.bbox?.y0 || 0,
          x1: line.bbox?.x1 || 0,
          y1: line.bbox?.y1 || 0
        }
      })).filter((line: any) => line.text.length > 0) || []

      // 텍스트 정제 및 품질 개선
      const cleanedText = data.text
        ?.trim()
        ?.replace(/\s+/g, ' ') // 여러 공백을 하나로
        ?.replace(/[^\w\s가-힣.,;:!?()[\]{}@#$%^&*+-=<>/\\|`~"']/g, '') // 특수문자 정리
        || ''

      // 품질 평가 수행
      const qualityAssessment = this.assessTextQuality(cleanedText, words, (data.confidence || 0) / 100)

      console.log('텍스트 품질 평가:', qualityAssessment)

      return {
        text: cleanedText,
        confidence: Math.max(0, Math.min(1, (data.confidence || 0) / 100)),
        words,
        lines,
        processingTime,
        qualityAssessment
      }
    } catch (error) {
      console.error('텍스트 인식 실패:', error)
      throw new Error('텍스트 인식 중 오류가 발생했습니다.')
    }
  }

  async recognizeTextFromFile(file: File): Promise<TextRecognitionResult> {
    return new Promise((resolve, reject) => {
      console.log('파일에서 텍스트 인식 시작:', file.name, file.size + ' bytes')
      
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = async () => {
        try {
          console.log('이미지 로딩 완료, 텍스트 인식 시작...')
          const result = await this.recognizeText(img)
          console.log('파일 텍스트 인식 완료:', {
            fileName: file.name,
            textLength: result.text.length,
            confidence: result.confidence,
            processingTime: result.processingTime
          })
          resolve(result)
        } catch (error) {
          console.error('파일 텍스트 인식 실패:', error)
          reject(error)
        }
      }
      
      img.onerror = (error) => {
        console.error('이미지 로딩 실패:', error)
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
      reader.onerror = () => {
        reject(new Error('파일 읽기 중 오류가 발생했습니다.'))
      }
      reader.readAsDataURL(file)
    })
  }

  // 텍스트 품질 평가 함수
  private assessTextQuality(text: string, words: any[], confidence: number): TextRecognitionResult['qualityAssessment'] {
    const textLength = text.length
    const wordCount = words.length
    const averageConfidence = words.length > 0 
      ? words.reduce((sum, word) => sum + word.confidence, 0) / words.length 
      : confidence

    // 언어 감지
    const hasKorean = /[가-힣]/.test(text)
    const hasEnglish = /[a-zA-Z]/.test(text)
    const hasNumbers = /[0-9]/.test(text)

    // 가독성 점수 계산
    const readabilityScore = this.calculateReadabilityScore(text, words)

    // 전체 점수 계산 (0-100)
    const overallScore = Math.round(
      (averageConfidence * 40) + // 신뢰도 40%
      (readabilityScore * 30) + // 가독성 30%
      (Math.min(textLength / 50, 1) * 20) + // 텍스트 길이 20%
      (wordCount > 0 ? 10 : 0) // 단어 존재 여부 10%
    )

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

  // 가독성 점수 계산
  private calculateReadabilityScore(text: string, words: any[]): number {
    if (text.length === 0) return 0

    let score = 0

    // 단어 길이 다양성
    const avgWordLength = words.length > 0 
      ? words.reduce((sum, word) => sum + word.text.length, 0) / words.length 
      : 0
    score += Math.min(avgWordLength / 5, 1) * 25

    // 문장 구조 (마침표, 쉼표 등)
    const punctuationCount = (text.match(/[.,;:!?]/g) || []).length
    score += Math.min(punctuationCount / text.length * 100, 1) * 25

    // 대소문자 혼용 (영어의 경우)
    const hasMixedCase = /[a-z]/.test(text) && /[A-Z]/.test(text)
    score += hasMixedCase ? 25 : 0

    // 숫자와 문자의 적절한 혼합
    const hasNumbers = /[0-9]/.test(text)
    const hasLetters = /[a-zA-Z가-힣]/.test(text)
    score += (hasNumbers && hasLetters) ? 25 : 0

    return Math.min(score, 1)
  }

  // 워커 정리
  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate()
      this.worker = null
      this.isInitialized = false
    }
  }
}

// 싱글톤 인스턴스
export const textRecognitionService = new TextRecognitionService()

// 유틸리티 함수들 - 개선된 OCR 서비스 사용
export const recognizeTextInImage = async (file: File): Promise<TextRecognitionResult> => {
  console.log('🎯 개선된 OCR 서비스 사용:', file.name)
  return await recognizeTextInImageImproved(file)
}

// 파일 유효성 검사
function validateImageFile(file: File): void {
  if (!file) {
    throw new Error('파일이 제공되지 않았습니다.')
  }

  if (file.size === 0) {
    throw new Error('빈 파일입니다.')
  }

  if (file.size > 50 * 1024 * 1024) { // 50MB 제한
    throw new Error('파일 크기가 너무 큽니다. (최대 50MB)')
  }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp']
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`지원하지 않는 파일 형식입니다: ${file.type}`)
  }

  console.log('✅ 이미지 파일 검증 통과:', {
    name: file.name,
    size: (file.size / 1024 / 1024).toFixed(2) + 'MB',
    type: file.type
  })
}

// 텍스트 인식 결과 향상
function enhanceTextRecognitionResult(result: TextRecognitionResult): TextRecognitionResult {
  // 텍스트 후처리
  const enhancedText = enhanceRecognizedText(result.text)
  
  // 품질 평가 재계산
  const enhancedQuality = recalculateQualityAssessment(enhancedText, result.words, result.confidence)
  
  return {
    ...result,
    text: enhancedText,
    qualityAssessment: enhancedQuality
  }
}

// 인식된 텍스트 향상
function enhanceRecognizedText(text: string): string {
  if (!text) return ''

  return text
    .trim()
    // 여러 공백을 하나로
    .replace(/\s+/g, ' ')
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
    // 문장 부호 정리
    .replace(/([.!?])\s*([a-zA-Z가-힣])/g, '$1 $2')
    // 특수문자 정리
    .replace(/[^\w\s가-힣.,;:!?()[\]{}@#$%^&*+-=<>/\\|`~"']/g, '')
}

// 품질 평가 재계산
function recalculateQualityAssessment(text: string, words: any[], confidence: number): TextRecognitionResult['qualityAssessment'] {
  const textLength = text.length
  const wordCount = words.length
  const averageConfidence = words.length > 0 
    ? words.reduce((sum, word) => sum + word.confidence, 0) / words.length 
    : confidence

  // 언어 감지
  const hasKorean = /[가-힣]/.test(text)
  const hasEnglish = /[a-zA-Z]/.test(text)
  const hasNumbers = /[0-9]/.test(text)

  // 향상된 가독성 점수 계산
  const readabilityScore = calculateEnhancedReadability(text, words, { hasKorean, hasEnglish, hasNumbers })

  // 전체 점수 계산 (향상된 알고리즘)
  const overallScore = calculateOverallQualityScore({
    confidence: averageConfidence,
    readability: readabilityScore,
    textLength,
    wordCount,
    hasKorean,
    hasEnglish,
    hasNumbers
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

// 향상된 가독성 점수 계산
function calculateEnhancedReadability(text: string, words: any[], languageInfo: any): number {
  if (text.length === 0) return 0

  let score = 0

  // 기본 가독성 요소들
  if (words.length > 0) {
    const avgWordLength = words.reduce((sum, word) => sum + word.text.length, 0) / words.length
    score += Math.min(avgWordLength / 5, 1) * 0.3
  }

  // 문장 구조
  const punctuationCount = (text.match(/[.,;:!?]/g) || []).length
  score += Math.min(punctuationCount / text.length * 100, 1) * 0.3

  // 언어별 특화 점수
  if (languageInfo.hasKorean) {
    const koreanChars = text.match(/[가-힣]/g) || []
    const uniqueChars = new Set(koreanChars).size
    score += Math.min(uniqueChars / 20, 1) * 0.2
  }

  if (languageInfo.hasEnglish) {
    const hasMixedCase = /[a-z]/.test(text) && /[A-Z]/.test(text)
    score += hasMixedCase ? 0.2 : 0
  }

  return Math.min(score, 1)
}

// 전체 품질 점수 계산
function calculateOverallQualityScore(metrics: any): number {
  const weights = {
    confidence: 0.4,
    readability: 0.3,
    textLength: 0.15,
    wordCount: 0.1,
    languageBonus: 0.05
  }

  let score = 0
  score += metrics.confidence * weights.confidence
  score += metrics.readability * weights.readability
  score += Math.min(metrics.textLength / 100, 1) * weights.textLength
  score += Math.min(metrics.wordCount / 20, 1) * weights.wordCount

  // 언어 혼합 보너스
  if (metrics.hasKorean && metrics.hasEnglish) {
    score += weights.languageBonus
  }

  return Math.round(score * 100)
}

// 에러 결과 생성
function createErrorResult(file: File, error: Error, processingTime: number): TextRecognitionResult {
  console.warn('🆘 에러 결과 생성:', error.message)

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
    }
  }
}

// 디버깅 및 상태 확인 유틸리티
export const OCRDebugUtils = {
  // Qwen 서비스 상태 확인
  checkQwenStatus: () => {
    const status = qwenOCRService.getServiceStatus()
    console.log('🔍 Qwen2.5-VL 서비스 상태:', status)
    return status
  },
  
  // 성능 통계 확인
  getPerformanceStats: () => {
    const stats = qwenOCRService.getPerformanceStats()
    console.log('📊 OCR 성능 통계:', stats)
    return stats
  },
  
  // 서비스 재연결 시도
  reconnectQwen: async () => {
    console.log('🔄 Qwen 서비스 재연결 시도...')
    await qwenOCRService.checkConnectionOnClient()
    const status = qwenOCRService.getServiceStatus()
    console.log('✅ 재연결 결과:', status)
    return status
  },
  
  // 클라이언트에서 API 연결 테스트
  testApiConnection: async () => {
    console.log('🧪 API 연결 테스트 시작...')
    try {
      await qwenOCRService.checkConnectionOnClient()
      const status = qwenOCRService.getServiceStatus()
      console.log('📊 테스트 결과:', status)
      return status.available
    } catch (error) {
      console.error('❌ API 연결 테스트 실패:', error)
      return false
    }
  },
  
  // 설정 가이드 출력
  showSetupGuide: () => {
    const status = qwenOCRService.getServiceStatus()
    const guide = {
      title: 'OpenRouter API를 통한 Qwen2.5-VL OCR 서비스 설정 가이드',
      steps: [
        '1. .env.local 파일에 API 키 설정: NEXT_PUBLIC_OPENROUTER_API_KEY=your_api_key',
        '2. API 엔드포인트 설정: NEXT_PUBLIC_API_ENDPOINT=https://openrouter.ai/api/v1/chat/completions',
        '3. OpenRouter 계정에서 API 키 발급 (https://openrouter.ai/)',
        '4. Qwen2.5-VL 모델 사용: qwen/qwen2.5-vl-7b-instruct',
        '5. 이미지는 Base64로 인코딩하여 전송',
        '6. 응답은 JSON 형식으로 파싱하여 텍스트 추출'
      ],
      currentEndpoint: status.endpoint,
      isAvailable: status.available
    }
    
    console.log('📋 OpenRouter Qwen2.5-VL 설정 가이드:')
    console.log('제목:', guide.title)
    console.log('현재 엔드포인트:', guide.currentEndpoint)
    console.log('서비스 상태:', guide.isAvailable ? '사용 가능' : '사용 불가')
    console.log('설정 단계:')
    guide.steps.forEach((step: string, index: number) => {
      console.log(`  ${step}`)
    })
    return guide
  }
}

// analyzeTextForClassification 함수 제거 - 단순화
