import * as cocoSsd from '@tensorflow-models/coco-ssd'
import '@tensorflow/tfjs-backend-webgl'
import { recognizeTextInImage, TextRecognitionResult } from './textRecognition'

export interface DetectedObject {
  bbox: [number, number, number, number] // [x, y, width, height]
  class: string
  score: number
  category?: string
}

export interface ObjectDetectionResult {
  objects: DetectedObject[]
  processingTime: number
  imageSize: {
    width: number
    height: number
  }
  textRecognition?: {
    text: string
    confidence: number
    processingTime: number
  }
}

class ObjectDetectionService {
  private model: cocoSsd.ObjectDetection | null = null
  private isModelLoaded = false

  async loadModel(): Promise<void> {
    if (this.isModelLoaded && this.model) {
      return
    }

    try {
      console.log('객체 인식 모델을 로딩 중...')
      this.model = await cocoSsd.load()
      this.isModelLoaded = true
      console.log('객체 인식 모델 로딩 완료')
    } catch (error) {
      console.error('모델 로딩 실패:', error)
      throw new Error('객체 인식 모델을 로딩할 수 없습니다.')
    }
  }

  async detectObjects(imageElement: HTMLImageElement): Promise<ObjectDetectionResult> {
    if (!this.model) {
      await this.loadModel()
    }

    if (!this.model) {
      throw new Error('모델이 로딩되지 않았습니다.')
    }

    const startTime = performance.now()
    
    try {
      // 1. 기본 객체 인식
      const predictions = await this.model.detect(imageElement)
      
      // 2. 텍스트 인식
      let textRecognitionResult: TextRecognitionResult | null = null
      
      try {
        console.log('이미지에서 텍스트 인식 시작...')
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        canvas.width = imageElement.width
        canvas.height = imageElement.height
        ctx?.drawImage(imageElement, 0, 0)
        
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve))
        if (blob) {
          const file = new File([blob], 'temp.jpg', { type: 'image/jpeg' })
          textRecognitionResult = await recognizeTextInImage(file)
          console.log('텍스트 인식 완료')
        }
      } catch (textError) {
        console.warn('텍스트 인식 실패:', textError)
      }

      const endTime = performance.now()
      const processingTime = endTime - startTime

      // 객체 인식 결과 처리
      const objects: DetectedObject[] = predictions.map(prediction => ({
        bbox: prediction.bbox as [number, number, number, number],
        class: prediction.class,
        score: prediction.score,
        category: this.categorizeObject(prediction.class)
      }))

      const result: ObjectDetectionResult = {
        objects,
        processingTime,
        imageSize: {
          width: imageElement.width,
          height: imageElement.height
        }
      }

      // 텍스트 인식 결과 추가
      if (textRecognitionResult) {
        result.textRecognition = {
          text: textRecognitionResult.text,
          confidence: textRecognitionResult.confidence,
          processingTime: textRecognitionResult.processingTime
        }
      }

      return result
    } catch (error) {
      console.error('객체 인식 실패:', error)
      throw new Error('객체 인식 중 오류가 발생했습니다.')
    }
  }

  private categorizeObject(objectClass: string): string {
    const categories = {
      'person': 'people',
      'bicycle': 'vehicle',
      'car': 'vehicle',
      'motorcycle': 'vehicle',
      'airplane': 'vehicle',
      'bus': 'vehicle',
      'train': 'vehicle',
      'truck': 'vehicle',
      'boat': 'vehicle',
      'traffic light': 'infrastructure',
      'fire hydrant': 'infrastructure',
      'stop sign': 'infrastructure',
      'parking meter': 'infrastructure',
      'bench': 'furniture',
      'bird': 'animal',
      'cat': 'animal',
      'dog': 'animal',
      'horse': 'animal',
      'sheep': 'animal',
      'cow': 'animal',
      'elephant': 'animal',
      'bear': 'animal',
      'zebra': 'animal',
      'giraffe': 'animal',
      'backpack': 'accessory',
      'umbrella': 'accessory',
      'handbag': 'accessory',
      'tie': 'clothing',
      'suitcase': 'accessory',
      'frisbee': 'sport',
      'skis': 'sport',
      'snowboard': 'sport',
      'sports ball': 'sport',
      'kite': 'sport',
      'baseball bat': 'sport',
      'baseball glove': 'sport',
      'skateboard': 'sport',
      'surfboard': 'sport',
      'tennis racket': 'sport',
      'bottle': 'container',
      'wine glass': 'container',
      'cup': 'container',
      'fork': 'utensil',
      'knife': 'utensil',
      'spoon': 'utensil',
      'bowl': 'container',
      'banana': 'food',
      'apple': 'food',
      'sandwich': 'food',
      'orange': 'food',
      'broccoli': 'food',
      'carrot': 'food',
      'hot dog': 'food',
      'pizza': 'food',
      'donut': 'food',
      'cake': 'food',
      'chair': 'furniture',
      'couch': 'furniture',
      'potted plant': 'plant',
      'bed': 'furniture',
      'dining table': 'furniture',
      'toilet': 'furniture',
      'tv': 'electronics',
      'laptop': 'electronics',
      'mouse': 'electronics',
      'remote': 'electronics',
      'keyboard': 'electronics',
      'cell phone': 'electronics',
      'microwave': 'appliance',
      'oven': 'appliance',
      'toaster': 'appliance',
      'sink': 'appliance',
      'refrigerator': 'appliance',
      'book': 'media',
      'clock': 'furniture',
      'vase': 'decoration',
      'scissors': 'tool',
      'teddy bear': 'toy',
      'hair drier': 'appliance',
      'toothbrush': 'hygiene'
    }

    return categories[objectClass as keyof typeof categories] || 'other'
  }

  async detectObjectsFromFile(file: File): Promise<ObjectDetectionResult> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = async () => {
        try {
          const result = await this.detectObjects(img)
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

  categorizeObjects(objects: DetectedObject[]): Record<string, DetectedObject[]> {
    const categories: Record<string, DetectedObject[]> = {}
    
    objects.forEach(obj => {
      const category = obj.category || 'other'
      if (!categories[category]) {
        categories[category] = []
      }
      categories[category].push(obj)
    })
    
    return categories
  }

  filterHighConfidenceObjects(objects: DetectedObject[], threshold: number = 0.5): DetectedObject[] {
    return objects.filter(obj => obj.score >= threshold)
  }

  getMostFrequentCategory(objects: DetectedObject[]): string | null {
    const categoryCount: Record<string, number> = {}
    
    objects.forEach(obj => {
      const category = obj.category || 'other'
      categoryCount[category] = (categoryCount[category] || 0) + 1
    })
    
    const sortedCategories = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
    
    return sortedCategories.length > 0 ? sortedCategories[0][0] : null
  }

  generateInsights(objects: DetectedObject[]): string[] {
    const insights: string[] = []
    const categories = this.categorizeObjects(objects)
    const categoryNames = Object.keys(categories)
    
    if (categoryNames.length === 0) {
      insights.push('이미지에서 명확한 객체를 감지하지 못했습니다.')
      return insights
    }

    // 가장 많이 감지된 카테고리
    const mostFrequent = this.getMostFrequentCategory(objects)
    if (mostFrequent) {
      const categoryKorean = this.getCategoryKoreanName(mostFrequent)
      insights.push(`주요 카테고리: ${categoryKorean} (${categories[mostFrequent].length}개 감지)`)
    }

    // 감지된 객체 종류 수
    insights.push(`총 ${categoryNames.length}종류의 카테고리가 감지되었습니다.`)

    // 신뢰도가 높은 객체들
    const highConfidenceObjects = this.filterHighConfidenceObjects(objects, 0.7)
    if (highConfidenceObjects.length > 0) {
      insights.push(`높은 신뢰도로 감지된 객체: ${highConfidenceObjects.length}개`)
    }

    // 특정 카테고리별 인사이트
    if (categories.people) {
      insights.push(`사람이 포함된 이미지입니다. (${categories.people.length}명)`)
    }
    
    if (categories.vehicle) {
      insights.push('교통수단이 포함된 이미지입니다.')
    }
    
    if (categories.food) {
      insights.push('음식이 포함된 이미지입니다.')
    }

    return insights
  }

  private getCategoryKoreanName(category: string): string {
    const koreanNames: Record<string, string> = {
      'people': '사람',
      'vehicle': '교통수단',
      'animal': '동물',
      'food': '음식',
      'furniture': '가구',
      'electronics': '전자제품',
      'appliance': '가전제품',
      'tool': '도구',
      'container': '용기',
      'utensil': '식기',
      'sport': '스포츠',
      'accessory': '액세서리',
      'clothing': '의류',
      'plant': '식물',
      'infrastructure': '인프라',
      'media': '미디어',
      'decoration': '장식',
      'toy': '장난감',
      'hygiene': '위생용품',
      'other': '기타'
    }
    
    return koreanNames[category] || category
  }
}

// 싱글톤 인스턴스
export const objectDetectionService = new ObjectDetectionService()

// 유틸리티 함수들
export const detectObjectsInImage = async (file: File): Promise<ObjectDetectionResult> => {
  return await objectDetectionService.detectObjectsFromFile(file)
}

export const generateObjectInsights = (objects: DetectedObject[]): string[] => {
  return objectDetectionService.generateInsights(objects)
}

export const categorizeDetectedObjects = (objects: DetectedObject[]): Record<string, DetectedObject[]> => {
  return objectDetectionService.categorizeObjects(objects)
}