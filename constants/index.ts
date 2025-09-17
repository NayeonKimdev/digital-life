// 상수 정의
export const SUPPORTED_FILE_TYPES = {
  'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  'application/json': ['.json'],
  'text/csv': ['.csv'],
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt']
} as const

export const CATEGORY_COLORS = {
  '음식': '#FF6B6B',
  '여행': '#4ECDC4',
  '패션': '#45B7D1',
  '일상': '#96CEB4',
  '기타': '#FFEAA7'
} as const

export const TIME_SLOTS = ['새벽', '아침', '오후', '저녁'] as const

export const CATEGORY_KEYWORDS = {
  '음식': ['음식', '맛집', '카페', '레스토랑', '요리', '식당'],
  '여행': ['여행', '관광', '휴가', '여행지', '명소', '관광지'],
  '패션': ['패션', '옷', '스타일', '의류', '코디', '패션'],
  '일상': ['일상', '데일리', '생활', '루틴', '일상생활']
} as const

export const ANALYSIS_DELAY = 2000 // 2초
