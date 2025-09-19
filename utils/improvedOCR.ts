// utils/improvedOCR.ts
// 타임아웃 문제 해결을 위한 개선된 OCR 시스템

import { TextRecognitionResult } from './textRecognition'

interface OCRConfig {
  qwenTimeout: number
  tesseractTimeout: number
  maxRetries: number
  fallbackDelay: number
  imageOptimization: boolean
}

class ImprovedOCRService {
  private config: OCRConfig = {
    qwenTimeout: 15000,        // Qwen 타임아웃: 15초로 단축
    tesseractTimeout: 30000,   // Tesseract 타임아웃: 30초
    maxRetries: 2,             // 최대 재시도 횟수
    fallbackDelay: 1000,       // 폴백 전 대기시간
    imageOptimization: true    // 이미지 최적화 활성화
  }

  // 1단계: 이미지 전처리 및 최적화
  private async optimizeImageForOCR(file: File): Promise<File> {
    console.log('📸 이미지 최적화 시작...')
    
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      if (!ctx) {
        reject(new Error('Canvas 컨텍스트 생성 실패'))
        return
      }

      img.onload = () => {
        try {
          // 이미지 크기 최적화 (OCR에 최적화)
          const maxSize = 1920 // 최대 해상도 제한
          let { width, height } = img
          
          // 종횡비 유지하면서 크기 조정
          if (width > maxSize || height > maxSize) {
            const ratio = Math.min(maxSize / width, maxSize / height)
            width = Math.floor(width * ratio)
            height = Math.floor(height * ratio)
          }

          canvas.width = width
          canvas.height = height

          // 이미지 품질 향상 (OCR 정확도 개선)
          ctx.imageSmoothingEnabled = false // 텍스트 선명도 향상
          ctx.fillStyle = 'white'
          ctx.fillRect(0, 0, width, height) // 흰색 배경
          
          // 대비 및 선명도 향상
          ctx.filter = 'contrast(1.4) brightness(1.2) saturate(0.8)'
          ctx.drawImage(img, 0, 0, width, height)

          // JPEG 품질 최적화
          canvas.toBlob((blob) => {
            if (blob) {
              const optimizedFile = new File([blob], `optimized_${file.name}`, {
                type: 'image/jpeg',
                lastModified: Date.now()
              })
              
              console.log('✅ 이미지 최적화 완료:', {
                원본크기: `${(file.size / 1024).toFixed(1)}KB`,
                최적화크기: `${(optimizedFile.size / 1024).toFixed(1)}KB`,
                해상도: `${width}×${height}`,
                압축률: `${((1 - optimizedFile.size / file.size) * 100).toFixed(1)}%`
              })
              
              resolve(optimizedFile)
            } else {
              reject(new Error('이미지 최적화 실패'))
            }
          }, 'image/jpeg', 0.92) // 높은 품질 유지
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => reject(new Error('이미지 로딩 실패'))
      
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string
        }
      }
      reader.readAsDataURL(file)
    })
  }

  // 2단계: 타임아웃과 재시도가 있는 Qwen 호출
  private async processWithQwenTimeout(file: File, attempt: number = 1): Promise<TextRecognitionResult> {
    console.log(`🚀 Qwen OCR 시도 ${attempt}/${this.config.maxRetries}...`)
    
    return new Promise(async (resolve, reject) => {
      // AbortController로 타임아웃 제어
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
        reject(new Error(`Qwen OCR 타임아웃 (${this.config.qwenTimeout}ms)`))
      }, this.config.qwenTimeout)

      try {
        // 이미지를 Base64로 변환
        const base64Image = await this.fileToBase64(file)
        
        // OpenRouter API 호출
        const response = await fetch(process.env.NEXT_PUBLIC_API_ENDPOINT || 'https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'OCR Service'
          },
          body: JSON.stringify({
            model: 'qwen/qwen2.5-vl-72b-instruct:free',
            messages: [{
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: '이미지에서 모든 텍스트를 정확히 추출해주세요. 한국어와 영어를 모두 인식하고, JSON 형식으로 응답해주세요: {"text": "인식된텍스트", "confidence": 0.95}'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${file.type};base64,${base64Image}`
                  }
                }
              ]
            }],
            max_tokens: 1000,
            temperature: 0.1
          }),
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`API 응답 오류: ${response.status}`)
        }

        const result = await response.json()
        const extractedText = this.parseQwenResponse(result)
        
        console.log('✅ Qwen OCR 성공:', {
          시도횟수: attempt,
          텍스트길이: extractedText.text.length,
          신뢰도: extractedText.confidence
        })

        resolve(this.formatQwenResult(extractedText))
        
      } catch (error: any) {
        clearTimeout(timeoutId)
        
        if (error.name === 'AbortError') {
          console.warn(`⏰ Qwen OCR 타임아웃 (시도 ${attempt})`)
        } else {
          console.warn(`❌ Qwen OCR 실패 (시도 ${attempt}):`, error.message)
        }

        // 재시도 로직
        if (attempt < this.config.maxRetries) {
          console.log(`🔄 ${this.config.fallbackDelay}ms 후 재시도...`)
          setTimeout(() => {
            this.processWithQwenTimeout(file, attempt + 1)
              .then(resolve)
              .catch(reject)
          }, this.config.fallbackDelay)
        } else {
          reject(error)
        }
      }
    })
  }

  // 3단계: 타임아웃과 재시도가 있는 Tesseract 폴백
  private async processWithTesseractTimeout(file: File): Promise<TextRecognitionResult> {
    console.log('🔄 Tesseract 폴백 시작...')
    
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Tesseract 타임아웃 (${this.config.tesseractTimeout}ms)`))
      }, this.config.tesseractTimeout)

      try {
        // 동적 import로 Tesseract 로드
        const Tesseract = await import('tesseract.js')
        
        console.log('📚 Tesseract 워커 생성 중...')
        const worker = await Tesseract.createWorker('kor+eng', 1, {
          logger: m => {
            if (m.status === 'recognizing text') {
              console.log(`📊 Tesseract 진행률: ${Math.round(m.progress * 100)}%`)
            }
          }
        })

        // 최적화된 설정
        await worker.setParameters({
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789가-힣()[]{}.,;:!?@#$%^&*+-=<>/\\|`~"\' ',
          tessedit_pageseg_mode: Tesseract.PSM.AUTO, // 자동 페이지 분할
          tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY
        })

        const { data } = await worker.recognize(file)
        await worker.terminate()
        
        clearTimeout(timeoutId)
        
        console.log('✅ Tesseract OCR 완료:', {
          텍스트길이: data.text?.length || 0,
          신뢰도: data.confidence
        })

        resolve(this.formatTesseractResult(data))
        
      } catch (error) {
        clearTimeout(timeoutId)
        reject(error)
      }
    })
  }

  // 4단계: 메인 OCR 처리 함수
  async processImage(file: File): Promise<TextRecognitionResult> {
    const startTime = performance.now()
    console.log('🎯 개선된 OCR 처리 시작:', file.name)

    try {
      // 1. 파일 유효성 검사
      this.validateFile(file)

      // 2. 이미지 최적화 (선택적)
      const processFile = this.config.imageOptimization 
        ? await this.optimizeImageForOCR(file)
        : file

      // 3. Qwen 시도 (타임아웃 및 재시도 포함)
      try {
        const qwenResult = await this.processWithQwenTimeout(processFile)
        qwenResult.processingTime = performance.now() - startTime
        return qwenResult
      } catch (qwenError) {
        console.warn('⚠️ Qwen 서비스 최종 실패, Tesseract 폴백 시작')
        
        // 4. Tesseract 폴백 (타임아웃 포함)
        try {
          const tesseractResult = await this.processWithTesseractTimeout(processFile)
          tesseractResult.processingTime = performance.now() - startTime
          return tesseractResult
        } catch (tesseractError) {
          console.error('❌ 모든 OCR 서비스 실패')
          throw new Error(`모든 OCR 서비스 실패: Qwen(${qwenError}), Tesseract(${tesseractError})`)
        }
      }

    } catch (error) {
      console.error('❌ OCR 처리 실패:', error)
      return this.createErrorResult(file, error as Error, performance.now() - startTime)
    }
  }

  // 유틸리티 함수들
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result.split(',')[1])
      }
      reader.onerror = () => reject(new Error('Base64 변환 실패'))
      reader.readAsDataURL(file)
    })
  }

  private parseQwenResponse(apiResult: any): { text: string; confidence: number } {
    try {
      const content = apiResult.choices?.[0]?.message?.content
      
      // JSON 형식 파싱 시도
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          text: parsed.text || content,
          confidence: parsed.confidence || 0.9
        }
      }
      
      // 일반 텍스트 처리
      return {
        text: content.trim(),
        confidence: 0.8
      }
    } catch (error) {
      throw new Error('Qwen 응답 파싱 실패')
    }
  }

  private formatQwenResult(data: { text: string; confidence: number }): TextRecognitionResult {
    return {
      text: data.text.trim(),
      confidence: data.confidence,
      words: [], // Qwen은 단어별 정보 제공 안함
      lines: [], // Qwen은 라인별 정보 제공 안함
      processingTime: 0,
      qualityAssessment: {
        overallScore: Math.round(data.confidence * 100),
        textLength: data.text.length,
        wordCount: data.text.split(/\s+/).length,
        averageConfidence: data.confidence,
        hasKorean: /[가-힣]/.test(data.text),
        hasEnglish: /[a-zA-Z]/.test(data.text),
        hasNumbers: /[0-9]/.test(data.text),
        readabilityScore: 0.8
      }
    }
  }

  private formatTesseractResult(data: any): TextRecognitionResult {
    const words = (data.words || []).map((word: any) => ({
      text: word.text?.trim() || '',
      confidence: (word.confidence || 0) / 100,
      bbox: {
        x0: word.bbox?.x0 || 0,
        y0: word.bbox?.y0 || 0,
        x1: word.bbox?.x1 || 0,
        y1: word.bbox?.y1 || 0
      }
    })).filter((word: any) => word.text.length > 0)

    return {
      text: data.text?.trim() || '',
      confidence: Math.max(0, Math.min(1, (data.confidence || 0) / 100)),
      words,
      lines: [],
      processingTime: 0,
      qualityAssessment: {
        overallScore: Math.round((data.confidence || 0)),
        textLength: data.text?.length || 0,
        wordCount: words.length,
        averageConfidence: (data.confidence || 0) / 100,
        hasKorean: /[가-힣]/.test(data.text || ''),
        hasEnglish: /[a-zA-Z]/.test(data.text || ''),
        hasNumbers: /[0-9]/.test(data.text || ''),
        readabilityScore: 0.7
      }
    }
  }

  private validateFile(file: File): void {
    if (!file) throw new Error('파일이 없습니다')
    if (file.size === 0) throw new Error('빈 파일입니다')
    if (file.size > 20 * 1024 * 1024) throw new Error('파일이 너무 큽니다 (20MB 제한)')
    
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`지원하지 않는 파일 형식: ${file.type}`)
    }
  }

  private createErrorResult(file: File, error: Error, processingTime: number): TextRecognitionResult {
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

  // 설정 업데이트
  updateConfig(newConfig: Partial<OCRConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('⚙️ OCR 설정 업데이트:', this.config)
  }

  // 현재 설정 조회
  getConfig(): OCRConfig {
    return { ...this.config }
  }
}

// 싱글톤 인스턴스
export const improvedOCRService = new ImprovedOCRService()

// 개선된 OCR 함수 (기존 함수 대체)
export const recognizeTextInImageImproved = async (file: File): Promise<TextRecognitionResult> => {
  return await improvedOCRService.processImage(file)
}
