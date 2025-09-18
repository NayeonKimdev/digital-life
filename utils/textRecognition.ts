import Tesseract from 'tesseract.js'

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
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
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
      
      const { data } = await this.worker.recognize(imageElement)
      const endTime = performance.now()
      const processingTime = endTime - startTime

      // 단어별 정보 추출 (간단화)
      const words = data.words?.map((word: any) => ({
        text: word.text?.trim() || '',
        confidence: (word.confidence || 0) / 100,
        bbox: {
          x0: word.bbox?.x0 || 0,
          y0: word.bbox?.y0 || 0,
          x1: word.bbox?.x1 || 0,
          y1: word.bbox?.y1 || 0
        }
      })).filter((word: any) => word.text.length > 0) || []

      // 라인별 정보 추출 (간단화)
      const lines = data.lines?.map((line: any) => ({
        text: line.text?.trim() || '',
        confidence: (line.confidence || 0) / 100,
        bbox: {
          x0: line.bbox?.x0 || 0,
          y0: line.bbox?.y0 || 0,
          x1: line.bbox?.x1 || 0,
          y1: line.bbox?.y1 || 0
        }
      })).filter((line: any) => line.text.length > 0) || []

      return {
        text: data.text.trim(),
        confidence: data.confidence / 100,
        words,
        lines,
        processingTime
      }
    } catch (error) {
      console.error('텍스트 인식 실패:', error)
      throw new Error('텍스트 인식 중 오류가 발생했습니다.')
    }
  }

  async recognizeTextFromFile(file: File): Promise<TextRecognitionResult> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = async () => {
        try {
          const result = await this.recognizeText(img)
          resolve(result)
        } catch (error) {
          reject(error)
        }
      }
      
      img.onerror = () => {
        reject(new Error('이미지 로딩에 실패했습니다.'))
      }
      
      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    })
  }

  // 텍스트 분석 메서드 제거 - 단순화

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

// 유틸리티 함수들
export const recognizeTextInImage = async (file: File): Promise<TextRecognitionResult> => {
  return await textRecognitionService.recognizeTextFromFile(file)
}

// analyzeTextForClassification 함수 제거 - 단순화
