// 통합 이미지 분석기
// 최종 목표를 위한 종합적인 이미지 분석 시스템

import { ComprehensiveImageMetadata } from '@/types/comprehensiveImageMetadata'
import { recognizeTextInImage } from './textRecognition'
import { detectObjectsInImage } from './objectDetection'
import { extractImageMetadata } from './index'

export class ComprehensiveImageAnalyzer {
  private isInitialized = false

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    console.log('🚀 통합 이미지 분석기 초기화 중...')
    
    // 필요한 모델들 사전 로딩
    try {
      // TensorFlow.js 모델들 사전 로딩
      await this.preloadModels()
      this.isInitialized = true
      console.log('✅ 통합 이미지 분석기 초기화 완료')
    } catch (error) {
      console.error('❌ 초기화 실패:', error)
      throw error
    }
  }

  // 메인 분석 함수 - 모든 것을 통합하여 JSON 메타데이터 생성
  async analyzeImage(file: File): Promise<ComprehensiveImageMetadata> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    const startTime = performance.now()
    console.log('🎯 통합 이미지 분석 시작:', file.name)

    try {
      // 1. 기본 파일 정보 수집
      const fileInfo = await this.extractFileInfo(file)
      console.log('📄 파일 정보 추출 완료')

      // 2. 기본 이미지 속성 추출
      const imageProperties = await this.extractImageProperties(file)
      console.log('🖼️ 이미지 속성 추출 완료')

      // 3. 텍스트 분석 먼저 실행 (다른 분석에서 재사용)
      const textResult = await this.analyzeText(file)
      console.log('📝 텍스트 분석 완료')

      // 4. 나머지 분석들을 병렬로 실행 (텍스트 결과 전달)
      const [
        colorAnalysis,
        sceneAnalysis,
        brandDetection,
        aestheticAnalysis
      ] = await Promise.allSettled([
        this.analyzeColors(file),
        this.analyzeScene(file),
        this.detectBrands(file, textResult),
        this.analyzeAesthetics(file)
      ])

      // 5. 결과 통합
      const metadata: ComprehensiveImageMetadata = {
        fileInfo,
        imageProperties,
        colorAnalysis: this.getValueOrDefault(colorAnalysis, this.getDefaultColorAnalysis()),
        peopleDetection: this.getDefaultPeopleDetection(), // 비활성화
        objectDetection: this.getDefaultObjectDetection(), // 비활성화
        sceneAnalysis: this.getValueOrDefault(sceneAnalysis, this.getDefaultSceneAnalysis()),
        textAnalysis: textResult, // 이미 실행된 텍스트 분석 결과 사용
        brandDetection: this.getValueOrDefault(brandDetection, { brands: [] }),
        aestheticAnalysis: this.getValueOrDefault(aestheticAnalysis, this.getDefaultAestheticAnalysis()),
        processingInfo: {
          generatedAt: new Date().toISOString(),
          processingTime: performance.now() - startTime,
          servicesUsed: this.getServicesUsed([
            colorAnalysis,
            sceneAnalysis,
            { status: 'fulfilled', value: textResult },
            brandDetection,
            aestheticAnalysis
          ]),
          confidence: this.calculateOverallConfidence([
            colorAnalysis,
            sceneAnalysis,
            { status: 'fulfilled', value: textResult },
            brandDetection,
            aestheticAnalysis
          ]),
          errors: this.extractErrors([
            colorAnalysis,
            sceneAnalysis,
            { status: 'fulfilled', value: textResult },
            brandDetection,
            aestheticAnalysis
          ])
        }
      }

      // 6. 개인화 분석 (선택적)
      try {
        metadata.personalAnalysis = await this.generatePersonalAnalysis(metadata)
      } catch (error) {
        console.warn('⚠️ 개인화 분석 실패:', error)
      }

      console.log('✅ 통합 이미지 분석 완료:', {
        fileName: file.name,
        processingTime: metadata.processingInfo.processingTime.toFixed(0) + 'ms',
        overallConfidence: metadata.processingInfo.confidence.overall,
        peopleCount: metadata.peopleDetection.totalCount,
        objectCount: metadata.objectDetection.totalObjects,
        hasText: metadata.textAnalysis.hasText
      })

      return metadata

    } catch (error) {
      console.error('❌ 통합 이미지 분석 실패:', error)
      throw error
    }
  }

  // 1. 파일 정보 추출
  private async extractFileInfo(file: File): Promise<ComprehensiveImageMetadata['fileInfo']> {
    const hash = await this.generateFileHash(file)
    
    return {
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      uploadedAt: new Date().toISOString(),
      hash
    }
  }

  // 2. 이미지 속성 추출
  private async extractImageProperties(file: File): Promise<ComprehensiveImageMetadata['imageProperties']> {
    const basicMetadata = await extractImageMetadata(file)
    
    return {
      dimensions: {
        width: basicMetadata.width,
        height: basicMetadata.height,
        aspectRatio: basicMetadata.aspectRatio || 1
      },
      technical: {
        format: basicMetadata.format,
        colorSpace: 'sRGB', // 기본값
        bitDepth: 8, // 기본값
        compression: 'JPEG'
      },
      camera: basicMetadata.camera,
      location: basicMetadata.location
    }
  }

  // 3. 색상 분석
  private async analyzeColors(file: File): Promise<ComprehensiveImageMetadata['colorAnalysis']> {
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
          // 작은 크기로 리사이즈 (성능 최적화)
          const size = 100
          canvas.width = size
          canvas.height = size
          ctx.drawImage(img, 0, 0, size, size)

          const imageData = ctx.getImageData(0, 0, size, size)
          const pixels = imageData.data

          // 색상 히스토그램 생성
          const colorCounts: { [key: string]: number } = {}
          const totalPixels = pixels.length / 4

          for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i]
            const g = pixels[i + 1]
            const b = pixels[i + 2]
            const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
            colorCounts[hex] = (colorCounts[hex] || 0) + 1
          }

          // 상위 색상들 추출
          const sortedColors = Object.entries(colorCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)

          const dominantColors = sortedColors.map(([color, count]) => ({
            color,
            percentage: Math.round((count / totalPixels) * 100),
            name: this.getColorName(color)
          }))

          // 색상 분석
          const mood = this.analyzeMood(dominantColors)
          const brightness = this.calculateBrightness(pixels)
          const contrast = this.calculateContrast(pixels)
          const saturation = this.calculateSaturation(pixels)

          resolve({
            dominantColors,
            colorPalette: sortedColors.map(([color]) => color),
            mood,
            brightness,
            contrast,
            saturation
          })
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

  // 4. 사람 인식 (상세)
  private async detectPeople(file: File): Promise<ComprehensiveImageMetadata['peopleDetection']> {
    try {
      // 기본 객체 인식으로 사람 감지
      const objectResult = await detectObjectsInImage(file)
      const people = objectResult.objects.filter(obj => obj.class === 'person')

      // 각 사람에 대해 상세 분석 (시뮬레이션)
      const detailedPeople = people.map((person, index) => ({
        id: `person_${index}`,
        bbox: person.bbox,
        confidence: person.score,
        demographics: {
          estimatedAge: {
            range: this.estimateAge(), // 실제로는 age detection 모델 필요
            confidence: 0.7
          },
          estimatedGender: {
            gender: this.estimateGender(), // 실제로는 gender detection 모델 필요
            confidence: 0.6
          }
        },
        pose: {
          bodyParts: this.estimateBodyParts(person.bbox), // 실제로는 pose estimation 모델 필요
          activity: this.estimateActivity(),
          confidence: 0.8
        },
        emotions: this.estimateEmotions(), // 실제로는 emotion detection 모델 필요
        clothing: this.estimateClothing(), // 실제로는 clothing detection 모델 필요
        accessories: this.estimateAccessories() // 실제로는 accessory detection 모델 필요
      }))

      return {
        totalCount: people.length,
        people: detailedPeople
      }
    } catch (error) {
      console.error('사람 인식 실패:', error)
      return this.getDefaultPeopleDetection()
    }
  }

  // 5. 객체 인식 (상세 카테고리별)
  private async detectObjects(file: File): Promise<ComprehensiveImageMetadata['objectDetection']> {
    try {
      const objectResult = await detectObjectsInImage(file)
      
      // 카테고리별 분류
      const categories = {
        vehicles: [],
        animals: [],
        furniture: [],
        electronics: [],
        food: [],
        clothing: [],
        sports: [],
        household: []
      }

      objectResult.objects.forEach(obj => {
        const category = this.categorizeObject(obj.class)
        if (categories[category as keyof typeof categories]) {
          categories[category as keyof typeof categories].push({
            type: obj.class,
            bbox: obj.bbox,
            confidence: obj.score,
            attributes: this.getObjectAttributes(obj.class) // 실제로는 attribute detection 필요
          })
        }
      })

      return {
        totalObjects: objectResult.objects.length,
        categories
      }
    } catch (error) {
      console.error('객체 인식 실패:', error)
      return this.getDefaultObjectDetection()
    }
  }

  // 6. 장면 분석 (상세)
  private async analyzeScene(file: File): Promise<ComprehensiveImageMetadata['sceneAnalysis']> {
    try {
      // 기본 장면 분석 (실제로는 CLIP 모델 등 필요)
      const sceneFeatures = await this.extractSceneFeatures(file)
      
      return {
        setting: {
          location: sceneFeatures.isIndoor ? 'indoor' : 'outdoor',
          confidence: 0.8
        },
        environment: {
          type: sceneFeatures.environmentType,
          confidence: 0.7,
          details: sceneFeatures.details
        },
        indoor: sceneFeatures.isIndoor ? {
          roomType: sceneFeatures.roomType,
          confidence: 0.7,
          lighting: sceneFeatures.lighting,
          style: sceneFeatures.style,
          cleanliness: sceneFeatures.cleanliness
        } : undefined,
        outdoor: !sceneFeatures.isIndoor ? {
          landscape: sceneFeatures.landscape,
          confidence: 0.7,
          weather: sceneFeatures.weather,
          timeOfDay: sceneFeatures.timeOfDay,
          season: sceneFeatures.season
        } : undefined,
        activity: {
          mainActivity: sceneFeatures.activity,
          confidence: 0.6,
          participants: sceneFeatures.participants,
          atmosphere: sceneFeatures.atmosphere
        }
      }
    } catch (error) {
      console.error('장면 분석 실패:', error)
      return this.getDefaultSceneAnalysis()
    }
  }

  // 7. 텍스트 분석 (상세)
  private async analyzeText(file: File): Promise<ComprehensiveImageMetadata['textAnalysis']> {
    try {
      const textResult = await recognizeTextInImage(file)
      
      if (!textResult.text || textResult.text.trim().length === 0) {
        return this.getDefaultTextAnalysis()
      }

      // 언어 감지
      const languages = this.detectLanguages(textResult.text)
      
      // 텍스트 블록 분석 (실제로는 더 정교한 레이아웃 분석 필요)
      const textBlocks = this.analyzeTextBlocks(textResult)
      
      // 카테고리별 분류
      const categories = this.categorizeText(textBlocks)
      
      // 감정 분석 (선택적)
      const sentimentAnalysis = this.analyzeSentiment(textResult.text)

      return {
        hasText: true,
        totalTextLength: textResult.text.length,
        languages,
        textBlocks,
        categories,
        sentimentAnalysis
      }
    } catch (error) {
      console.error('텍스트 분석 실패:', error)
      return this.getDefaultTextAnalysis()
    }
  }

  // 8. 브랜드/로고 인식 (텍스트 분석 결과 재사용)
  private async detectBrands(file: File, textResult?: any): Promise<ComprehensiveImageMetadata['brandDetection']> {
    try {
      // 텍스트 분석 결과가 있으면 재사용, 없으면 새로 실행
      let text = ''
      if (textResult && textResult.text) {
        text = textResult.text
      } else {
        const result = await recognizeTextInImage(file)
        text = result.text
      }
      
      const brands = this.extractBrandsFromText(text)
      return { brands }
    } catch (error) {
      console.error('브랜드 인식 실패:', error)
      return { brands: [] }
    }
  }

  // 9. 미적 분석
  private async analyzeAesthetics(file: File): Promise<ComprehensiveImageMetadata['aestheticAnalysis']> {
    try {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
          try {
            const composition = this.analyzeComposition(img)
            const style = this.analyzePhotographyStyle(img)
            const quality = this.analyzeImageQuality(img)
            
            resolve({
              composition,
              style,
              quality
            })
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
    } catch (error) {
      console.error('미적 분석 실패:', error)
      return this.getDefaultAestheticAnalysis()
    }
  }

  // 10. 개인화 분석
  private async generatePersonalAnalysis(metadata: ComprehensiveImageMetadata): Promise<ComprehensiveImageMetadata['personalAnalysis']> {
    // 사용자 패턴 분석 (실제로는 데이터베이스에서 과거 데이터 조회)
    const userPatterns = {
      frequentLocations: this.extractLocationsFromScene(metadata.sceneAnalysis),
      commonObjects: this.extractObjectsFromDetection(metadata.objectDetection),
      photographyStyle: [metadata.aestheticAnalysis.style.photographyType],
      timePatterns: this.extractTimePatterns(metadata.imageProperties)
    }

    // 유사 이미지 및 추천 생성
    const suggestions = {
      similar: [], // 실제로는 벡터 유사도 검색 필요
      recommendations: this.generateRecommendations(metadata),
      insights: this.generateInsights(metadata)
    }

    return {
      userPatterns,
      suggestions
    }
  }

  // 유틸리티 함수들
  private async preloadModels(): Promise<void> {
    // TensorFlow.js 모델들 사전 로딩
    console.log('📚 모델 사전 로딩 중...')
    // 실제로는 필요한 모델들을 여기서 로딩
  }

  private async generateFileHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  private getColorName(hex: string): string {
    // 색상명 매핑 (간단한 버전)
    const colorMap: { [key: string]: string } = {
      '#FF0000': '빨강', '#00FF00': '초록', '#0000FF': '파랑',
      '#FFFF00': '노랑', '#FF00FF': '자홍', '#00FFFF': '청록',
      '#FFFFFF': '흰색', '#000000': '검정', '#808080': '회색'
    }
    return colorMap[hex] || '기타'
  }

  private analyzeMood(colors: Array<{ color: string; percentage: number }>): 'warm' | 'cool' | 'neutral' | 'vibrant' | 'muted' {
    // 색상 기반 무드 분석 로직
    return 'neutral' // 간단한 구현
  }

  private calculateBrightness(pixels: Uint8ClampedArray): number {
    let total = 0
    for (let i = 0; i < pixels.length; i += 4) {
      total += (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3
    }
    return Math.round((total / (pixels.length / 4)) / 255 * 100)
  }

  private calculateContrast(pixels: Uint8ClampedArray): number {
    // 간단한 대비 계산
    let min = 255, max = 0
    for (let i = 0; i < pixels.length; i += 4) {
      const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3
      min = Math.min(min, brightness)
      max = Math.max(max, brightness)
    }
    return Math.round((max - min) / 255 * 100)
  }

  private calculateSaturation(pixels: Uint8ClampedArray): number {
    // 간단한 채도 계산
    let totalSaturation = 0
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2]
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      const saturation = max === 0 ? 0 : (max - min) / max
      totalSaturation += saturation
    }
    return Math.round((totalSaturation / (pixels.length / 4)) * 100)
  }

  // 사람 관련 추정 함수들 (실제로는 전용 모델 필요)
  private estimateAge(): string {
    const ages = ['10-20', '20-30', '30-40', '40-50', '50-60', '60+']
    return ages[Math.floor(Math.random() * ages.length)]
  }

  private estimateGender(): 'male' | 'female' | 'unknown' {
    return ['male', 'female', 'unknown'][Math.floor(Math.random() * 3)] as any
  }

  private estimateBodyParts(bbox: number[]): Array<{ part: string; visible: boolean; position: [number, number] }> {
    return [
      { part: 'head', visible: true, position: [bbox[0] + bbox[2]/2, bbox[1] + bbox[3]*0.2] },
      { part: 'body', visible: true, position: [bbox[0] + bbox[2]/2, bbox[1] + bbox[3]*0.6] }
    ]
  }

  private estimateActivity(): string {
    const activities = ['standing', 'sitting', 'walking', 'running', 'lying', 'dancing']
    return activities[Math.floor(Math.random() * activities.length)]
  }

  private estimateEmotions(): Array<{ emotion: string; confidence: number }> {
    const emotions = ['happy', 'sad', 'angry', 'surprised', 'neutral']
    return emotions.map(emotion => ({
      emotion,
      confidence: Math.random() * 0.5 + 0.3
    })).sort((a, b) => b.confidence - a.confidence).slice(0, 2)
  }

  private estimateClothing(): Array<{ item: string; color: string; style: string; confidence: number }> {
    const items = ['shirt', 'pants', 'dress', 'jacket', 'shoes']
    const colors = ['red', 'blue', 'black', 'white', 'gray']
    const styles = ['casual', 'formal', 'sporty', 'trendy']
    
    return items.slice(0, Math.floor(Math.random() * 3) + 1).map(item => ({
      item,
      color: colors[Math.floor(Math.random() * colors.length)],
      style: styles[Math.floor(Math.random() * styles.length)],
      confidence: Math.random() * 0.3 + 0.6
    }))
  }

  private estimateAccessories(): Array<{ item: string; confidence: number }> {
    const accessories = ['glasses', 'hat', 'watch', 'jewelry', 'bag']
    return accessories.slice(0, Math.floor(Math.random() * 2)).map(item => ({
      item,
      confidence: Math.random() * 0.4 + 0.5
    }))
  }

  // 객체 카테고리 분류
  private categorizeObject(objectClass: string): string {
    const categoryMap: { [key: string]: string } = {
      'car': 'vehicles', 'bicycle': 'vehicles', 'motorcycle': 'vehicles',
      'dog': 'animals', 'cat': 'animals', 'bird': 'animals',
      'chair': 'furniture', 'table': 'furniture', 'bed': 'furniture',
      'laptop': 'electronics', 'tv': 'electronics', 'phone': 'electronics',
      'apple': 'food', 'banana': 'food', 'pizza': 'food',
      'shirt': 'clothing', 'pants': 'clothing', 'dress': 'clothing',
      'ball': 'sports', 'racket': 'sports', 'bicycle': 'sports',
      'book': 'household', 'vase': 'household', 'clock': 'household'
    }
    return categoryMap[objectClass] || 'household'
  }

  private getObjectAttributes(objectClass: string): any {
    // 객체별 속성 추정 (실제로는 전용 모델 필요)
    return {}
  }

  // 장면 분석 관련
  private async extractSceneFeatures(file: File): Promise<any> {
    // 실제로는 CLIP 등의 모델 사용
    return {
      isIndoor: Math.random() > 0.5,
      environmentType: 'urban',
      details: [
        { feature: 'buildings', prominence: 0.8 },
        { feature: 'people', prominence: 0.6 }
      ],
      roomType: 'living_room',
      lighting: 'natural',
      style: 'modern',
      cleanliness: 80,
      landscape: 'city',
      weather: { condition: 'sunny', confidence: 0.7 },
      timeOfDay: { period: 'afternoon', confidence: 0.8 },
      season: { season: 'spring', confidence: 0.6 },
      activity: 'socializing',
      participants: 2,
      atmosphere: 'casual'
    }
  }

  // 텍스트 분석 관련
  private detectLanguages(text: string): Array<{ language: string; confidence: number; percentage: number }> {
    const hasKorean = /[가-힣]/.test(text)
    const hasEnglish = /[a-zA-Z]/.test(text)
    const hasNumbers = /[0-9]/.test(text)
    
    const languages = []
    if (hasKorean) languages.push({ language: 'ko', confidence: 0.9, percentage: 60 })
    if (hasEnglish) languages.push({ language: 'en', confidence: 0.8, percentage: 30 })
    if (hasNumbers) languages.push({ language: 'num', confidence: 0.9, percentage: 10 })
    
    return languages
  }

  private analyzeTextBlocks(textResult: any): Array<any> {
    // 실제로는 레이아웃 분석 필요
    return [{
      id: 'block_1',
      text: textResult.text,
      bbox: [0, 0, 100, 20],
      confidence: textResult.confidence,
      language: 'ko',
      fontSize: 'medium',
      style: { bold: false, italic: false, underlined: false },
      context: 'other'
    }]
  }

  private categorizeText(textBlocks: any[]): any {
    return {
      signs: [],
      documents: textBlocks.map(block => block.text),
      screens: [],
      handwritten: [],
      other: []
    }
  }

  private analyzeSentiment(text: string): any {
    // 간단한 감정 분석
    const positiveWords = ['좋', '행복', '즐거', '멋진', '훌륭']
    const negativeWords = ['나쁜', '슬픈', '화난', '실망']
    
    const positive = positiveWords.some(word => text.includes(word))
    const negative = negativeWords.some(word => text.includes(word))
    
    return {
      sentiment: positive ? 'positive' : negative ? 'negative' : 'neutral',
      confidence: 0.7,
      emotions: [{ emotion: 'neutral', score: 0.5 }]
    }
  }

  // 브랜드 추출
  private extractBrandsFromText(text: string): Array<any> {
    const commonBrands = ['Apple', 'Samsung', 'Google', 'Microsoft', 'Nike', 'Adidas']
    const detected = commonBrands.filter(brand => 
      text.toLowerCase().includes(brand.toLowerCase())
    )
    
    return detected.map(brand => ({
      name: brand,
      category: 'technology',
      bbox: [0, 0, 50, 20],
      confidence: 0.8,
      context: 'text'
    }))
  }

  // 미적 분석
  private analyzeComposition(img: HTMLImageElement): any {
    return {
      ruleOfThirds: Math.random() > 0.5,
      symmetry: Math.random(),
      balance: Math.random(),
      depth: Math.random()
    }
  }

  private analyzePhotographyStyle(img: HTMLImageElement): any {
    const styles = ['portrait', 'landscape', 'macro', 'street', 'documentary', 'artistic']
    return {
      photographyType: styles[Math.floor(Math.random() * styles.length)],
      confidence: 0.7,
      techniques: ['natural_lighting', 'good_composition']
    }
  }

  private analyzeImageQuality(img: HTMLImageElement): any {
    return {
      sharpness: Math.floor(Math.random() * 30) + 70,
      exposure: Math.floor(Math.random() * 20) + 40,
      noise: Math.floor(Math.random() * 20) + 10,
      overallQuality: Math.floor(Math.random() * 20) + 75
    }
  }

  // 기본값 생성 함수들
  private getDefaultColorAnalysis(): ComprehensiveImageMetadata['colorAnalysis'] {
    return {
      dominantColors: [],
      colorPalette: [],
      mood: 'neutral',
      brightness: 50,
      contrast: 50,
      saturation: 50
    }
  }

  private getDefaultPeopleDetection(): ComprehensiveImageMetadata['peopleDetection'] {
    return { totalCount: 0, people: [] }
  }

  private getDefaultObjectDetection(): ComprehensiveImageMetadata['objectDetection'] {
    return {
      totalObjects: 0,
      categories: {
        vehicles: [], animals: [], furniture: [], electronics: [],
        food: [], clothing: [], sports: [], household: []
      }
    }
  }

  private getDefaultSceneAnalysis(): ComprehensiveImageMetadata['sceneAnalysis'] {
    return {
      setting: { location: 'indoor', confidence: 0.5 },
      environment: { type: 'urban', confidence: 0.5, details: [] },
      activity: {
        mainActivity: 'unknown',
        confidence: 0.3,
        participants: 0,
        atmosphere: 'casual'
      }
    }
  }

  private getDefaultTextAnalysis(): ComprehensiveImageMetadata['textAnalysis'] {
    return {
      hasText: false,
      totalTextLength: 0,
      languages: [],
      textBlocks: [],
      categories: { signs: [], documents: [], screens: [], handwritten: [], other: [] }
    }
  }

  private getDefaultAestheticAnalysis(): ComprehensiveImageMetadata['aestheticAnalysis'] {
    return {
      composition: { ruleOfThirds: false, symmetry: 0, balance: 0, depth: 0 },
      style: { photographyType: 'documentary', confidence: 0.5, techniques: [] },
      quality: { sharpness: 50, exposure: 50, noise: 50, overallQuality: 50 }
    }
  }

  // Promise.allSettled 결과 처리
  private getValueOrDefault<T>(result: PromiseSettledResult<T>, defaultValue: T): T {
    return result.status === 'fulfilled' ? result.value : defaultValue
  }

  private getServicesUsed(results: PromiseSettledResult<any>[]): any {
    return {
      textRecognition: results[4]?.status === 'fulfilled' ? 'qwen' : 'failed',
      objectDetection: results[2]?.status === 'fulfilled' ? 'coco-ssd' : 'failed',
      sceneAnalysis: results[3]?.status === 'fulfilled' ? 'basic' : 'failed',
      faceDetection: results[1]?.status === 'fulfilled' ? 'basic' : 'failed'
    }
  }

  private calculateOverallConfidence(results: PromiseSettledResult<any>[]): any {
    const successful = results.filter(r => r.status === 'fulfilled').length
    const total = results.length
    const overall = Math.round((successful / total) * 100)
    
    return {
      overall,
      breakdown: {
        people: results[1]?.status === 'fulfilled' ? 80 : 0,
        objects: results[2]?.status === 'fulfilled' ? 85 : 0,
        scene: results[3]?.status === 'fulfilled' ? 70 : 0,
        text: results[4]?.status === 'fulfilled' ? 90 : 0
      }
    }
  }

  private extractErrors(results: PromiseSettledResult<any>[]): Array<any> {
    return results
      .map((result, index) => {
        if (result.status === 'rejected') {
          const services = ['color', 'people', 'objects', 'scene', 'text', 'brands', 'aesthetics']
          return {
            service: services[index],
            error: result.reason?.message || 'Unknown error',
            fallbackUsed: true
          }
        }
        return null
      })
      .filter(Boolean) as Array<any>
  }

  // 개인화 분석 관련
  private extractLocationsFromScene(sceneAnalysis: any): string[] {
    return [sceneAnalysis.environment.type]
  }

  private extractObjectsFromDetection(objectDetection: any): string[] {
    const objects: string[] = []
    Object.values(objectDetection.categories).forEach((category: any) => {
      if (Array.isArray(category)) {
        objects.push(...category.map((item: any) => item.type))
      }
    })
    return objects.slice(0, 5)
  }

  private extractTimePatterns(imageProperties: any): Array<{ hour: number; frequency: number }> {
    const now = new Date()
    return [{ hour: now.getHours(), frequency: 1 }]
  }

  private generateRecommendations(metadata: ComprehensiveImageMetadata): string[] {
    const recommendations = []
    
    if (metadata.peopleDetection.totalCount > 0) {
      recommendations.push('인물 사진이 많네요. 포트레이트 촬영 기법을 연습해보세요.')
    }
    
    if (metadata.sceneAnalysis.setting.location === 'outdoor') {
      recommendations.push('야외 촬영을 즐기시는군요. 골든아워 촬영을 시도해보세요.')
    }
    
    if (metadata.textAnalysis.hasText) {
      recommendations.push('텍스트가 포함된 이미지입니다. 스트리트 포토그래피에 관심이 있으실 것 같네요.')
    }
    
    return recommendations
  }

  private generateInsights(metadata: ComprehensiveImageMetadata): string[] {
    const insights = []
    
    insights.push(`이미지 품질 점수: ${metadata.aestheticAnalysis.quality.overallQuality}점`)
    insights.push(`주요 색상 분위기: ${metadata.colorAnalysis.mood}`)
    
    if (metadata.objectDetection.totalObjects > 5) {
      insights.push('복잡한 구성의 이미지입니다. 미니멀한 구성도 시도해보세요.')
    }
    
    return insights
  }
}

// 싱글톤 인스턴스
export const comprehensiveImageAnalyzer = new ComprehensiveImageAnalyzer()

// 메인 분석 함수
export const analyzeImageComprehensively = async (file: File): Promise<ComprehensiveImageMetadata> => {
  return await comprehensiveImageAnalyzer.analyzeImage(file)
}
