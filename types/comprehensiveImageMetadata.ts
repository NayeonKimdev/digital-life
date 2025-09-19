// 통합 이미지 메타데이터 스키마
// 최종 목표를 위한 종합적인 이미지 분석 결과 타입 정의

export interface ComprehensiveImageMetadata {
  // 기본 파일 정보
  fileInfo: {
    id: string
    name: string
    size: number
    type: string
    lastModified: number
    uploadedAt: string
    hash: string // 중복 방지용
  }

  // 이미지 기본 속성
  imageProperties: {
    dimensions: {
      width: number
      height: number
      aspectRatio: number
    }
    technical: {
      format: string
      colorSpace: string
      bitDepth: number
      compression: string
    }
    camera?: {
      make: string
      model: string
      settings: {
        aperture?: string
        shutterSpeed?: string
        iso?: number
        focalLength?: number
      }
    }
    location?: {
      latitude: number
      longitude: number
      address?: string
      timezone?: string
    }
  }

  // 색상 분석
  colorAnalysis: {
    dominantColors: Array<{
      color: string
      percentage: number
      name: string // "빨강", "파랑" 등
    }>
    colorPalette: string[]
    mood: 'warm' | 'cool' | 'neutral' | 'vibrant' | 'muted'
    brightness: number // 0-100
    contrast: number // 0-100
    saturation: number // 0-100
  }

  // 사람 인식 (상세)
  peopleDetection: {
    totalCount: number
    people: Array<{
      id: string
      bbox: [number, number, number, number]
      confidence: number
      demographics: {
        estimatedAge?: {
          range: string // "20-30"
          confidence: number
        }
        estimatedGender?: {
          gender: 'male' | 'female' | 'unknown'
          confidence: number
        }
      }
      pose: {
        bodyParts: Array<{
          part: string // "head", "leftArm" 등
          visible: boolean
          position: [number, number]
        }>
        activity: string // "standing", "sitting", "walking" 등
        confidence: number
      }
      emotions: Array<{
        emotion: 'happy' | 'sad' | 'angry' | 'surprised' | 'neutral' | 'fear' | 'disgust'
        confidence: number
      }>
      clothing: Array<{
        item: string // "shirt", "pants", "dress" 등
        color: string
        style: string
        confidence: number
      }>
      accessories: Array<{
        item: string // "glasses", "hat", "jewelry" 등
        confidence: number
      }>
    }>
  }

  // 사물/객체 인식 (상세)
  objectDetection: {
    totalObjects: number
    categories: {
      vehicles: Array<{
        type: string // "car", "bicycle", "motorcycle" 등
        bbox: [number, number, number, number]
        confidence: number
        attributes: {
          color?: string
          brand?: string
          model?: string
        }
      }>
      animals: Array<{
        species: string // "dog", "cat", "bird" 등
        bbox: [number, number, number, number]
        confidence: number
        attributes: {
          breed?: string
          size?: 'small' | 'medium' | 'large'
          activity?: string
        }
      }>
      furniture: Array<{
        type: string // "chair", "table", "bed" 등
        bbox: [number, number, number, number]
        confidence: number
        material?: string
        style?: string
      }>
      electronics: Array<{
        type: string // "phone", "laptop", "tv" 등
        bbox: [number, number, number, number]
        confidence: number
        brand?: string
      }>
      food: Array<{
        type: string // "apple", "pizza", "coffee" 등
        bbox: [number, number, number, number]
        confidence: number
        cuisine?: string
        freshness?: 'fresh' | 'cooked' | 'processed'
      }>
      clothing: Array<{
        type: string // "shirt", "pants", "dress" 등
        bbox: [number, number, number, number]
        confidence: number
        color: string
        pattern?: string
      }>
      sports: Array<{
        equipment: string // "ball", "racket", "bicycle" 등
        bbox: [number, number, number, number]
        confidence: number
        sport?: string
      }>
      household: Array<{
        item: string // "lamp", "vase", "book" 등
        bbox: [number, number, number, number]
        confidence: number
        room?: string // "living room", "kitchen" 등
      }>
    }
  }

  // 풍경/장면 인식 (상세)
  sceneAnalysis: {
    setting: {
      location: 'indoor' | 'outdoor' | 'mixed'
      confidence: number
    }
    environment: {
      type: 'urban' | 'suburban' | 'rural' | 'nature' | 'industrial'
      confidence: number
      details: Array<{
        feature: string // "buildings", "trees", "water", "mountains" 등
        prominence: number // 0-1
      }>
    }
    indoor?: {
      roomType: 'living_room' | 'bedroom' | 'kitchen' | 'bathroom' | 'office' | 'restaurant' | 'store' | 'other'
      confidence: number
      lighting: 'natural' | 'artificial' | 'mixed'
      style: string // "modern", "traditional", "minimalist" 등
      cleanliness: number // 0-100
    }
    outdoor?: {
      landscape: 'city' | 'park' | 'beach' | 'mountain' | 'forest' | 'field' | 'street' | 'other'
      confidence: number
      weather: {
        condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'foggy' | 'unknown'
        confidence: number
      }
      timeOfDay: {
        period: 'dawn' | 'morning' | 'midday' | 'afternoon' | 'evening' | 'night'
        confidence: number
      }
      season?: {
        season: 'spring' | 'summer' | 'autumn' | 'winter'
        confidence: number
      }
    }
    activity: {
      mainActivity: string // "dining", "shopping", "exercising", "socializing" 등
      confidence: number
      participants: number
      atmosphere: 'formal' | 'casual' | 'festive' | 'relaxed' | 'busy' | 'quiet'
    }
  }

  // 텍스트 인식 (상세)
  textAnalysis: {
    hasText: boolean
    totalTextLength: number
    languages: Array<{
      language: string
      confidence: number
      percentage: number
    }>
    textBlocks: Array<{
      id: string
      text: string
      bbox: [number, number, number, number]
      confidence: number
      language: string
      fontSize: 'small' | 'medium' | 'large' | 'xlarge'
      style: {
        bold: boolean
        italic: boolean
        underlined: boolean
        color?: string
      }
      context: 'sign' | 'document' | 'book' | 'screen' | 'handwritten' | 'other'
    }>
    categories: {
      signs: string[] // 간판, 표지판 텍스트
      documents: string[] // 문서, 책 텍스트
      screens: string[] // 화면, 모니터 텍스트
      handwritten: string[] // 손글씨
      other: string[]
    }
    sentimentAnalysis?: {
      sentiment: 'positive' | 'negative' | 'neutral'
      confidence: number
      emotions: Array<{
        emotion: string
        score: number
      }>
    }
  }

  // 브랜드/로고 인식
  brandDetection: {
    brands: Array<{
      name: string
      category: string // "food", "technology", "clothing" 등
      bbox: [number, number, number, number]
      confidence: number
      context: 'logo' | 'product' | 'store' | 'advertisement'
    }>
  }

  // 예술적/미적 분석
  aestheticAnalysis: {
    composition: {
      ruleOfThirds: boolean
      symmetry: number // 0-1
      balance: number // 0-1
      depth: number // 0-1
    }
    style: {
      photographyType: 'portrait' | 'landscape' | 'macro' | 'street' | 'documentary' | 'artistic'
      confidence: number
      techniques: string[] // "bokeh", "silhouette", "reflection" 등
    }
    quality: {
      sharpness: number // 0-100
      exposure: number // 0-100 (50이 적정)
      noise: number // 0-100 (낮을수록 좋음)
      overallQuality: number // 0-100
    }
  }

  // 메타데이터 생성 정보
  processingInfo: {
    generatedAt: string
    processingTime: number
    servicesUsed: {
      textRecognition: 'qwen' | 'tesseract' | 'failed'
      objectDetection: 'coco-ssd' | 'yolo' | 'failed'
      sceneAnalysis: 'clip' | 'resnet' | 'basic' | 'failed'
      faceDetection: 'mtcnn' | 'basic' | 'failed'
    }
    confidence: {
      overall: number // 0-100
      breakdown: {
        people: number
        objects: number
        scene: number
        text: number
      }
    }
    errors: Array<{
      service: string
      error: string
      fallbackUsed: boolean
    }>
  }

  // 개인화 분석 (사용자별 패턴)
  personalAnalysis?: {
    userPatterns: {
      frequentLocations: string[]
      commonObjects: string[]
      photographyStyle: string[]
      timePatterns: Array<{
        hour: number
        frequency: number
      }>
    }
    suggestions: {
      similar: string[] // 유사한 이미지 ID들
      recommendations: string[] // 추천사항
      insights: string[] // 분석 인사이트
    }
  }
}

// 기존 타입과의 호환성을 위한 변환 함수들
export const convertToLegacyTextResult = (textAnalysis: ComprehensiveImageMetadata['textAnalysis']) => {
  return {
    text: textAnalysis.textBlocks.map(block => block.text).join('\n'),
    confidence: textAnalysis.textBlocks.length > 0 
      ? textAnalysis.textBlocks.reduce((sum, block) => sum + block.confidence, 0) / textAnalysis.textBlocks.length
      : 0,
    words: textAnalysis.textBlocks.map(block => ({
      text: block.text,
      confidence: block.confidence
    })),
    lines: textAnalysis.textBlocks.map(block => ({
      text: block.text,
      confidence: block.confidence
    })),
    processingTime: 0,
    qualityAssessment: {
      overallScore: textAnalysis.sentimentAnalysis ? 
        (textAnalysis.sentimentAnalysis.sentiment === 'positive' ? 80 : 
         textAnalysis.sentimentAnalysis.sentiment === 'negative' ? 40 : 60) : 50,
      textLength: textAnalysis.totalTextLength,
      wordCount: textAnalysis.textBlocks.reduce((sum, block) => sum + block.text.split(' ').length, 0),
      averageConfidence: textAnalysis.textBlocks.length > 0 ?
        textAnalysis.textBlocks.reduce((sum, block) => sum + block.confidence, 0) / textAnalysis.textBlocks.length : 0,
      hasKorean: textAnalysis.languages.some(lang => lang.language === 'ko'),
      hasEnglish: textAnalysis.languages.some(lang => lang.language === 'en'),
      hasNumbers: textAnalysis.textBlocks.some(block => /\d/.test(block.text)),
      readabilityScore: 70
    }
  }
}

export const convertToLegacyObjectResult = (objectDetection: ComprehensiveImageMetadata['objectDetection']) => {
  const allObjects: any[] = []
  
  Object.values(objectDetection.categories).forEach(category => {
    if (Array.isArray(category)) {
      category.forEach(obj => {
        allObjects.push({
          bbox: obj.bbox,
          class: obj.type || obj.species || obj.equipment || obj.item,
          score: obj.confidence,
          category: getCategoryFromObject(obj)
        })
      })
    }
  })

  return {
    objects: allObjects,
    processingTime: 0,
    imageSize: {
      width: 0,
      height: 0
    }
  }
}

const getCategoryFromObject = (obj: any): string => {
  if (obj.type) return obj.type
  if (obj.species) return obj.species
  if (obj.equipment) return obj.equipment
  if (obj.item) return obj.item
  return 'unknown'
}

// 통합 분석 결과를 기존 UploadedFile 타입에 추가하기 위한 확장
export interface ExtendedUploadedFile {
  // 기존 필드들
  id: string
  name: string
  size: number
  type: string
  lastModified: number
  file: File
  preview?: string | null
  status: 'processing' | 'completed' | 'error'
  metadata?: any
  content?: any
  imageMetadata?: any
  imageContentAnalysis?: any
  objectDetectionResult?: any
  textRecognitionResult?: any
  advancedAnalysisResult?: any
  isImage?: boolean
  
  // 새로운 통합 필드
  comprehensiveMetadata?: ComprehensiveImageMetadata
}
