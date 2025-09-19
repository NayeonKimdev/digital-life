// 통합 OCR 서비스 - 다중 엔진 결과 비교 및 최적 선택
import { TextRecognitionResult } from './textRecognition'
import { QwenOCRResult, qwenOCRService } from './qwenOCR'
import { textRecognitionService } from './textRecognition'

export interface OCRResult {
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
  source: string // 사용된 OCR 엔진
  alternatives?: OCRResult[] // 다른 엔진의 결과들
}

class IntegratedOCRService {
  private results: Map<string, OCRResult> = new Map()
  private performanceStats = {
    totalRequests: 0,
    qwenWins: 0,
    tesseractWins: 0,
    averageProcessingTime: 0,
    averageConfidence: 0
  }

  // 통합 OCR 처리
  async processImage(file: File): Promise<OCRResult> {
    const startTime = performance.now()
    this.performanceStats.totalRequests++

    try {
      console.log('🚀 통합 OCR 처리 시작:', file.name)

      // 병렬로 여러 OCR 엔진 실행
      const ocrPromises = [
        this.runQwenOCR(file),
        this.runTesseractOCR(file)
      ]

      const results = await Promise.allSettled(ocrPromises)
      const validResults: OCRResult[] = []

      // 성공한 결과들 수집
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          validResults.push(result.value)
        } else {
          console.warn(`OCR 엔진 ${index === 0 ? 'Qwen' : 'Tesseract'} 실패:`, result.status === 'rejected' ? result.reason : 'Unknown error')
        }
      })

      if (validResults.length === 0) {
        throw new Error('모든 OCR 엔진이 실패했습니다.')
      }

      // 최적 결과 선택
      const bestResult = this.selectBestResult(validResults)
      
      // 통계 업데이트
      this.updatePerformanceStats(bestResult, performance.now() - startTime)

      console.log('✅ 통합 OCR 완료:', {
        선택된엔진: bestResult.source,
        신뢰도: bestResult.confidence,
        품질점수: bestResult.qualityAssessment.overallScore,
        처리시간: bestResult.processingTime.toFixed(0) + 'ms',
        대안수: validResults.length - 1
      })

      return bestResult
    } catch (error) {
      console.error('❌ 통합 OCR 처리 실패:', error)
      throw error
    }
  }

  // Qwen2.5-VL OCR 실행
  private async runQwenOCR(file: File): Promise<OCRResult | null> {
    try {
      console.log('🔍 Qwen2.5-VL OCR 실행 중...')
      const qwenResult = await qwenOCRService.processImage(file)
      
      return {
        text: qwenResult.text,
        confidence: qwenResult.confidence,
        words: qwenResult.words,
        lines: qwenResult.lines,
        processingTime: qwenResult.processingTime,
        qualityAssessment: qwenResult.qualityAssessment,
        source: 'Qwen2.5-VL'
      }
    } catch (error) {
      console.warn('⚠️ Qwen2.5-VL OCR 실패:', error)
      return null
    }
  }

  // Tesseract.js OCR 실행
  private async runTesseractOCR(file: File): Promise<OCRResult | null> {
    try {
      console.log('🔍 Tesseract.js OCR 실행 중...')
      const tesseractResult = await textRecognitionService.recognizeTextFromFile(file)
      
      return {
        text: tesseractResult.text,
        confidence: tesseractResult.confidence,
        words: tesseractResult.words,
        lines: tesseractResult.lines,
        processingTime: tesseractResult.processingTime,
        qualityAssessment: tesseractResult.qualityAssessment,
        source: 'Tesseract.js'
      }
    } catch (error) {
      console.warn('⚠️ Tesseract.js OCR 실패:', error)
      return null
    }
  }

  // 최적 결과 선택 알고리즘
  private selectBestResult(results: OCRResult[]): OCRResult {
    if (results.length === 1) {
      return results[0]
    }

    console.log('🎯 OCR 결과 비교 중...')
    
    // 각 결과에 대해 종합 점수 계산
    const scoredResults = results.map(result => ({
      result,
      score: this.calculateComprehensiveScore(result)
    }))

    // 점수 순으로 정렬
    scoredResults.sort((a, b) => b.score - a.score)

    const bestResult = scoredResults[0].result
    const alternatives = scoredResults.slice(1).map(item => item.result)

    // 최고 결과에 대안들 추가
    bestResult.alternatives = alternatives

    console.log('📊 OCR 결과 점수:', scoredResults.map(item => ({
      엔진: item.result.source,
      점수: item.score.toFixed(2),
      신뢰도: item.result.confidence,
      품질: item.result.qualityAssessment.overallScore
    })))

    return bestResult
  }

  // 종합 점수 계산
  private calculateComprehensiveScore(result: OCRResult): number {
    const weights = {
      confidence: 0.3,        // 신뢰도 30%
      qualityScore: 0.25,    // 품질 점수 25%
      textLength: 0.15,      // 텍스트 길이 15%
      languageSupport: 0.15, // 언어 지원 15%
      processingTime: 0.1,   // 처리 시간 10%
      engineBonus: 0.05      // 엔진 보너스 5%
    }

    let score = 0

    // 1. 신뢰도 점수
    score += result.confidence * weights.confidence

    // 2. 품질 점수
    score += (result.qualityAssessment.overallScore / 100) * weights.qualityScore

    // 3. 텍스트 길이 점수 (적절한 길이일 때 높은 점수)
    const textLengthScore = Math.min(result.text.length / 100, 1)
    score += textLengthScore * weights.textLength

    // 4. 언어 지원 점수
    const languageScore = this.calculateLanguageSupportScore(result)
    score += languageScore * weights.languageSupport

    // 5. 처리 시간 점수 (빠를수록 높은 점수)
    const timeScore = Math.max(0, 1 - (result.processingTime / 10000)) // 10초 기준
    score += timeScore * weights.processingTime

    // 6. 엔진 보너스
    const engineBonus = this.getEngineBonus(result.source)
    score += engineBonus * weights.engineBonus

    return Math.min(1, score)
  }

  // 언어 지원 점수 계산
  private calculateLanguageSupportScore(result: OCRResult): number {
    let score = 0

    // 한국어 지원
    if (result.qualityAssessment.hasKorean) {
      score += 0.4
    }

    // 영어 지원
    if (result.qualityAssessment.hasEnglish) {
      score += 0.3
    }

    // 숫자 지원
    if (result.qualityAssessment.hasNumbers) {
      score += 0.2
    }

    // 혼합 언어 보너스
    if (result.qualityAssessment.hasKorean && result.qualityAssessment.hasEnglish) {
      score += 0.1
    }

    return Math.min(1, score)
  }

  // 엔진별 보너스 점수
  private getEngineBonus(source: string): number {
    switch (source) {
      case 'Qwen2.5-VL':
        return 0.8 // Qwen은 한국어에 강함
      case 'Tesseract.js':
        return 0.6 // Tesseract는 안정적
      default:
        return 0.5
    }
  }

  // 성능 통계 업데이트
  private updatePerformanceStats(result: OCRResult, processingTime: number): void {
    // 엔진별 승리 횟수
    if (result.source === 'Qwen2.5-VL') {
      this.performanceStats.qwenWins++
    } else if (result.source === 'Tesseract.js') {
      this.performanceStats.tesseractWins++
    }

    // 평균 처리 시간 업데이트
    const totalTime = this.performanceStats.averageProcessingTime * (this.performanceStats.totalRequests - 1)
    this.performanceStats.averageProcessingTime = (totalTime + processingTime) / this.performanceStats.totalRequests

    // 평균 신뢰도 업데이트
    const totalConfidence = this.performanceStats.averageConfidence * (this.performanceStats.totalRequests - 1)
    this.performanceStats.averageConfidence = (totalConfidence + result.confidence) / this.performanceStats.totalRequests
  }

  // 성능 통계 조회
  getPerformanceStats() {
    return {
      ...this.performanceStats,
      qwenWinRate: this.performanceStats.totalRequests > 0 
        ? (this.performanceStats.qwenWins / this.performanceStats.totalRequests * 100).toFixed(1) + '%'
        : '0%',
      tesseractWinRate: this.performanceStats.totalRequests > 0
        ? (this.performanceStats.tesseractWins / this.performanceStats.totalRequests * 100).toFixed(1) + '%'
        : '0%',
      averageConfidencePercent: (this.performanceStats.averageConfidence * 100).toFixed(1) + '%'
    }
  }

  // 결과 캐시 관리
  private cacheResult(key: string, result: OCRResult): void {
    this.results.set(key, result)
    
    // 캐시 크기 제한 (최대 50개)
    if (this.results.size > 50) {
      const firstKey = this.results.keys().next().value
      this.results.delete(firstKey)
    }
  }

  private getCachedResult(key: string): OCRResult | null {
    return this.results.get(key) || null
  }

  // 캐시 클리어
  clearCache(): void {
    this.results.clear()
    console.log('🗑️ 통합 OCR 캐시 클리어 완료')
  }

  // 결과 비교 분석
  analyzeResults(results: OCRResult[]): {
    bestEngine: string
    confidenceRange: { min: number, max: number, avg: number }
    qualityRange: { min: number, max: number, avg: number }
    textLengthRange: { min: number, max: number, avg: number }
    recommendations: string[]
  } {
    if (results.length === 0) {
      return {
        bestEngine: 'none',
        confidenceRange: { min: 0, max: 0, avg: 0 },
        qualityRange: { min: 0, max: 0, avg: 0 },
        textLengthRange: { min: 0, max: 0, avg: 0 },
        recommendations: ['결과가 없습니다.']
      }
    }

    const confidences = results.map(r => r.confidence)
    const qualities = results.map(r => r.qualityAssessment.overallScore)
    const textLengths = results.map(r => r.text.length)

    const bestResult = results.reduce((best, current) => 
      this.calculateComprehensiveScore(current) > this.calculateComprehensiveScore(best) ? current : best
    )

    const recommendations = this.generateRecommendations(results)

    return {
      bestEngine: bestResult.source,
      confidenceRange: {
        min: Math.min(...confidences),
        max: Math.max(...confidences),
        avg: confidences.reduce((a, b) => a + b, 0) / confidences.length
      },
      qualityRange: {
        min: Math.min(...qualities),
        max: Math.max(...qualities),
        avg: qualities.reduce((a, b) => a + b, 0) / qualities.length
      },
      textLengthRange: {
        min: Math.min(...textLengths),
        max: Math.max(...textLengths),
        avg: textLengths.reduce((a, b) => a + b, 0) / textLengths.length
      },
      recommendations
    }
  }

  // 권장사항 생성
  private generateRecommendations(results: OCRResult[]): string[] {
    const recommendations: string[] = []

    // 신뢰도 기반 권장사항
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length
    if (avgConfidence < 0.7) {
      recommendations.push('전체적인 신뢰도가 낮습니다. 이미지 품질을 확인해주세요.')
    }

    // 언어별 권장사항
    const hasKorean = results.some(r => r.qualityAssessment.hasKorean)
    const hasEnglish = results.some(r => r.qualityAssessment.hasEnglish)
    
    if (hasKorean && !hasEnglish) {
      recommendations.push('한국어 텍스트가 주로 감지되었습니다. Qwen2.5-VL이 더 적합할 수 있습니다.')
    } else if (hasEnglish && !hasKorean) {
      recommendations.push('영어 텍스트가 주로 감지되었습니다. Tesseract.js가 더 적합할 수 있습니다.')
    }

    // 품질 점수 기반 권장사항
    const avgQuality = results.reduce((sum, r) => sum + r.qualityAssessment.overallScore, 0) / results.length
    if (avgQuality < 60) {
      recommendations.push('텍스트 품질이 낮습니다. 이미지 전처리를 고려해보세요.')
    }

    // 처리 시간 기반 권장사항
    const avgTime = results.reduce((sum, r) => sum + r.processingTime, 0) / results.length
    if (avgTime > 5000) {
      recommendations.push('처리 시간이 오래 걸립니다. 이미지 크기를 줄여보세요.')
    }

    return recommendations.length > 0 ? recommendations : ['모든 OCR 엔진이 양호한 결과를 제공했습니다.']
  }
}

// 싱글톤 인스턴스
export const integratedOCRService = new IntegratedOCRService()

// 유틸리티 함수
export const processImageWithIntegratedOCR = async (file: File): Promise<OCRResult> => {
  return await integratedOCRService.processImage(file)
}

// 기존 인터페이스와 호환성을 위한 변환 함수
export const convertToTextRecognitionResult = (integratedResult: OCRResult): TextRecognitionResult => {
  return {
    text: integratedResult.text,
    confidence: integratedResult.confidence,
    words: integratedResult.words,
    lines: integratedResult.lines,
    processingTime: integratedResult.processingTime,
    qualityAssessment: integratedResult.qualityAssessment
  }
}
