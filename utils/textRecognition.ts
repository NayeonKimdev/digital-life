// Qwen2.5-VL 기반 고성능 텍스트 인식 서비스
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
  // 이미지 분석 결과 추가
  imageAnalysis?: {
    topic: string
    description: string
    detectedElements: string[]
    confidence: number
  }
}

class QwenTextRecognitionService {
  private apiEndpoint: string
  private apiKey: string | undefined
  private isAvailable: boolean = false
  private cache: Map<string, TextRecognitionResult> = new Map()

  constructor() {
    // OpenRouter API 설정
    this.apiEndpoint = process.env.NEXT_PUBLIC_API_ENDPOINT || 'https://openrouter.ai/api/v1/chat/completions'
    this.apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY
    
    console.log('🔧 Qwen2.5-VL 텍스트 인식 서비스 초기화:', {
      endpoint: this.apiEndpoint,
      hasApiKey: !!this.apiKey,
      apiKeyLength: this.apiKey?.length || 0
    })
    
    // API 키 검증
    if (!this.apiKey) {
      console.error('❌ OpenRouter API 키가 설정되지 않았습니다!')
      console.log('💡 해결방법: .env.local 파일에 NEXT_PUBLIC_OPENROUTER_API_KEY=your_api_key 추가')
    } else {
      console.log('✅ API 키 설정 확인됨')
      this.isAvailable = true
    }
  }

  // 메인 텍스트 인식 함수
  async recognizeTextFromFile(file: File): Promise<TextRecognitionResult> {
    const startTime = performance.now()

    try {
      console.log('🚀 Qwen2.5-VL 텍스트 인식 시작:', file.name)

      if (!this.isAvailable || !this.apiKey) {
        throw new Error('Qwen2.5-VL 서비스가 사용 불가능합니다. API 키를 확인해주세요.')
      }

      // 파일 해시 생성 (캐시 키)
      const fileHash = await this.generateFileHash(file)
      
      // 캐시 확인
      if (this.cache.has(fileHash)) {
        console.log('🚀 캐시에서 결과 반환')
        return this.cache.get(fileHash)!
      }

      // 이미지를 Base64로 변환 (최적화된 크기로)
      const base64Image = await this.optimizeImageForOCR(file)
      console.log('📷 이미지 Base64 변환 완료, 크기:', base64Image.length)

      // Qwen2.5-VL API 호출
      const result = await this.callQwenAPI(base64Image, file.type)
      
      // 결과 검증 및 후처리
      const processedResult = this.processQwenResult(result, performance.now() - startTime)

      // 결과 캐싱
      this.cache.set(fileHash, processedResult)

      console.log('✅ Qwen2.5-VL 텍스트 인식 완료:', {
        processingTime: processedResult.processingTime.toFixed(0) + 'ms',
        textLength: processedResult.text.length,
        qualityScore: processedResult.qualityAssessment.overallScore,
        topic: processedResult.imageAnalysis?.topic
      })

      return processedResult
    } catch (error) {
      console.error('❌ Qwen2.5-VL 텍스트 인식 실패:', error)
      throw new Error(`텍스트 인식 실패: ${(error as Error).message}`)
    }
  }

  // Qwen2.5-VL API 호출
  private async callQwenAPI(base64Image: string, imageType: string): Promise<any> {
    const maxRetries = 2
    let currentRetry = 0

    while (currentRetry < maxRetries) {
      try {
        console.log(`📤 Qwen2.5-VL API 요청 시도 ${currentRetry + 1}/${maxRetries}...`)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 120000) // 120초 타임아웃으로 증가

        const response = await fetch(this.apiEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
            'X-Title': 'Digital Life OCR Service'
          },
          body: JSON.stringify({
            model: 'qwen/qwen2.5-vl-72b-instruct:free',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: `Extract all text from this image accurately and analyze the main topic.

Response format (JSON):
{
  "text": "All extracted text",
  "confidence": 0.95,
  "imageAnalysis": {
    "topic": "Main topic of the image",
    "description": "Detailed description of the image",
    "detectedElements": ["Key elements detected"],
    "confidence": 0.9
  }
}`
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:${imageType};base64,${base64Image}`
                    }
                  }
                ]
              }
            ],
            max_tokens: 1000,
            temperature: 0.1
          }),
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Qwen2.5-VL API 요청 실패: ${response.status} - ${errorText}`)
        }

        const apiResult = await response.json()
        console.log('📥 Qwen2.5-VL API 응답 수신 성공')

        return apiResult
      } catch (error: any) {
        currentRetry++
        
        if (error.name === 'AbortError') {
          console.warn(`⏰ 요청 타임아웃 (시도 ${currentRetry}/${maxRetries})`)
        } else {
          console.warn(`❌ API 요청 실패 (시도 ${currentRetry}/${maxRetries}):`, error.message)
        }
        
        if (currentRetry < maxRetries) {
          console.log('🔄 1초 후 재시도...')
          await new Promise(resolve => setTimeout(resolve, 1000))
        } else {
          throw error
        }
      }
    }
    
    throw new Error('모든 재시도 실패')
  }

  // Qwen API 응답 처리
  private processQwenResult(apiResult: any, processingTime: number): TextRecognitionResult {
    try {
      const content = apiResult.choices?.[0]?.message?.content
      if (!content) {
        throw new Error('API 응답에 내용이 없습니다.')
      }

      console.log('📝 Qwen2.5-VL 응답 내용:', content.substring(0, 200) + '...')

      // JSON 파싱 시도
      let parsedResult: any
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('JSON 형식을 찾을 수 없습니다.')
        }
      } catch (parseError) {
        console.warn('⚠️ JSON 파싱 실패, 기본 구조로 처리:', parseError)
        parsedResult = {
          text: content.trim(),
          confidence: 0.8,
          words: [],
          lines: [],
          imageAnalysis: {
            topic: '분석 실패',
            description: '이미지 분석에 실패했습니다.',
            detectedElements: [],
            confidence: 0.3
          }
        }
      }

      // 결과 검증 및 보완
      const result: TextRecognitionResult = {
        text: parsedResult.text || '',
        confidence: Math.max(0, Math.min(1, parsedResult.confidence || 0.8)),
        words: parsedResult.words || this.extractWordsFromText(parsedResult.text || ''),
        lines: parsedResult.lines || this.extractLinesFromText(parsedResult.text || ''),
        processingTime,
        qualityAssessment: this.assessTextQuality(parsedResult.text || '', parsedResult.words || [], parsedResult.confidence || 0.8),
        imageAnalysis: parsedResult.imageAnalysis || {
          topic: '분석 실패',
          description: '이미지 분석에 실패했습니다.',
          detectedElements: [],
          confidence: 0.3
        }
      }

      // 텍스트 후처리
      result.text = this.postProcessText(result.text)

      return result
    } catch (error) {
      console.error('❌ Qwen 결과 처리 실패:', error)
      throw new Error('API 응답을 처리할 수 없습니다.')
    }
  }

  // 텍스트에서 단어 추출
  private extractWordsFromText(text: string): any[] {
    const words = text.split(/\s+/).filter(word => word.length > 0)
    return words.map((word, index) => ({
      text: word,
      confidence: 0.8,
      bbox: {
        x0: index * 50,
        y0: 0,
        x1: (index + 1) * 50,
        y1: 20
      }
    }))
  }

  // 텍스트에서 라인 추출
  private extractLinesFromText(text: string): any[] {
    const lines = text.split('\n').filter(line => line.trim().length > 0)
    return lines.map((line, index) => ({
      text: line.trim(),
      confidence: 0.8,
      bbox: {
        x0: 0,
        y0: index * 25,
        x1: line.length * 10,
        y1: (index + 1) * 25
      }
    }))
  }

  // 텍스트 품질 평가
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

    // 전체 점수 계산
    const overallScore = Math.round(
      (averageConfidence * 40) + 
      (readabilityScore * 30) + 
      (Math.min(textLength / 50, 1) * 20) + 
      (wordCount > 0 ? 10 : 0)
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
    if (words.length > 0) {
      const avgWordLength = words.reduce((sum, word) => sum + word.text.length, 0) / words.length
      score += Math.min(avgWordLength / 5, 1) * 0.4
    }

    // 문장 구조
    const punctuationCount = (text.match(/[.,;:!?]/g) || []).length
    score += Math.min(punctuationCount / text.length * 100, 1) * 0.3

    // 언어 혼합 보너스
    const hasKorean = /[가-힣]/.test(text)
    const hasEnglish = /[a-zA-Z]/.test(text)
    if (hasKorean && hasEnglish) {
      score += 0.3
    }

    return Math.min(score, 1)
  }

  // 텍스트 후처리
  private postProcessText(text: string): string {
    if (!text) return ''

    return text
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .replace(/([.!?])\s*([a-zA-Z가-힣])/g, '$1 $2')
      .replace(/([a-zA-Z가-힣])\s*,\s*([a-zA-Z가-힣])/g, '$1, $2')
      .replace(/\s*=\s*/g, ' = ')
      .replace(/\s*\(\s*/g, ' (')
      .replace(/\s*\)\s*/g, ') ')
  }

  // 파일 해시 생성
  private async generateFileHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  // 파일을 Base64로 변환
  private async convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = () => {
        reject(new Error('파일을 Base64로 변환하는데 실패했습니다.'))
      }
      reader.readAsDataURL(file)
    })
  }

  // 이미지 크기 최적화 (타임아웃 방지)
  private async optimizeImageForOCR(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          reject(new Error('Canvas 컨텍스트를 생성할 수 없습니다.'))
          return
        }

        // 이미지 크기 제한 (최대 800px로 더 작게)
        const maxSize = 800
        let { width, height } = img
        
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height)
          width *= ratio
          height *= ratio
        }

        canvas.width = width
        canvas.height = height
        
        // 이미지 그리기
        ctx.drawImage(img, 0, 0, width, height)
        
        // JPEG 품질 설정 (70% 품질로 더 압축)
        const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.7)
        const base64 = optimizedBase64.split(',')[1]
        
        console.log(`📐 이미지 최적화 완료: ${img.width}x${img.height} → ${width}x${height}`)
        resolve(base64)
      }
      
      img.onerror = () => {
        reject(new Error('이미지를 로드할 수 없습니다.'))
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  // 서비스 상태 확인
  getServiceStatus(): { available: boolean, endpoint: string } {
    return {
      available: this.isAvailable,
      endpoint: this.apiEndpoint
    }
  }

  // 캐시 클리어
  clearCache(): void {
    this.cache.clear()
    console.log('🗑️ Qwen2.5-VL 캐시 클리어 완료')
  }

  // 성능 통계
  getPerformanceStats() {
    return {
      cacheSize: this.cache.size,
      isAvailable: this.isAvailable,
      endpoint: this.apiEndpoint
    }
  }
}

// 싱글톤 인스턴스
export const textRecognitionService = new QwenTextRecognitionService()

// 메인 함수 - Qwen2.5-VL 사용
export const recognizeTextInImage = async (file: File): Promise<TextRecognitionResult> => {
  console.log('🎯 Qwen2.5-VL 텍스트 인식 서비스 사용:', file.name)
  return await textRecognitionService.recognizeTextFromFile(file)
}

// 이미지 분석과 함께 텍스트 인식
export const recognizeTextAndAnalyzeImage = async (file: File): Promise<TextRecognitionResult> => {
  console.log('🎯 Qwen2.5-VL 텍스트 인식 및 이미지 분석 서비스 사용:', file.name)
  return await textRecognitionService.recognizeTextFromFile(file)
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

// 디버깅 유틸리티
export const OCRDebugUtils = {
  // 서비스 상태 확인
  checkServiceStatus: () => {
    const status = textRecognitionService.getServiceStatus()
    console.log('🔍 Qwen2.5-VL 서비스 상태:', status)
    return status
  },
  
  // 성능 통계 확인
  getPerformanceStats: () => {
    const stats = textRecognitionService.getPerformanceStats()
    console.log('📊 OCR 성능 통계:', stats)
    return stats
  },
  
  // 캐시 클리어
  clearCache: () => {
    textRecognitionService.clearCache()
  },
  
  // 설정 가이드 출력
  showSetupGuide: () => {
    const status = textRecognitionService.getServiceStatus()
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
