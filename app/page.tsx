'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  CloudArrowUpIcon, 
  ChartBarIcon, 
  HeartIcon,
  SparklesIcon,
  ArrowRightIcon,
  PhotoIcon,
  DocumentIcon,
  LinkIcon
} from '@heroicons/react/24/outline'
import FileUpload from '@/components/FileUpload'
import AnalysisDashboard from '@/components/AnalysisDashboard'
import ServiceGuide from '@/components/ServiceGuide'
import { Button, Card, AnimatedCard } from '@/components/ui'
import { UploadedFile } from '@/types'

export default function Home() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [showAnalysis, setShowAnalysis] = useState(false)

  const handleFilesUploaded = (files: UploadedFile[]) => {
    setUploadedFiles(files)
    setShowAnalysis(true)
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-bg text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              나의 디지털 자서전
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              인스타그램, 카카오톡, 검색 기록을 분석하여<br />
              나만의 디지털 라이프스타일을 발견하세요
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="flex items-center gap-2">
                <SparklesIcon className="w-6 h-6" />
                무료로 시작하기
              </Button>
              <Button variant="secondary" size="lg" className="flex items-center gap-2">
                <ArrowRightIcon className="w-6 h-6" />
                데모 보기
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              왜 디지털 라이프 분석기인가?
            </h2>
            <p className="text-xl text-gray-600">
              단순한 시간 추적을 넘어서, 당신의 전체 라이프스타일을 분석합니다
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <AnimatedCard delay={0} className="text-center">
              <Card>
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PhotoIcon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">사진 한 번에 업로드</h3>
                <p className="text-gray-600">
                  드래그&드롭으로 여러 장의 사진을 한 번에 업로드하고, 
                  위치 정보와 시간 데이터를 자동으로 분석합니다.
                </p>
              </Card>
            </AnimatedCard>

            <AnimatedCard delay={0.2} className="text-center">
              <Card>
                <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ChartBarIcon className="w-8 h-8 text-accent-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">AI 기반 인사이트</h3>
                <p className="text-gray-600">
                  머신러닝을 통해 당신의 취향, 패턴, 감정 상태를 분석하고 
                  개인화된 인사이트를 제공합니다.
                </p>
              </Card>
            </AnimatedCard>

            <AnimatedCard delay={0.4} className="text-center">
              <Card>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HeartIcon className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">한국 서비스 특화</h3>
                <p className="text-gray-600">
                  카카오톡, 네이버, 배달앱 등 한국 사용자들이 자주 사용하는 
                  서비스들의 데이터를 쉽게 연동할 수 있습니다.
                </p>
              </Card>
            </AnimatedCard>
          </div>
        </div>
      </section>

      {/* Upload Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              데이터 업로드하기
            </h2>
            <p className="text-xl text-gray-600">
              다양한 형식의 파일을 업로드하여 분석을 시작하세요
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <FileUpload onFilesUploaded={handleFilesUploaded} />
          </div>
        </div>
      </section>

      {/* Service Guide */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <ServiceGuide />
        </div>
      </section>

      {/* Analysis Dashboard */}
      {showAnalysis && (
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <AnalysisDashboard files={uploadedFiles} />
          </div>
        </section>
      )}
    </div>
  )
}
