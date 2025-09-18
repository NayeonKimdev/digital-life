'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  QrCodeIcon,
  LinkIcon,
  ClipboardDocumentIcon,
  ChevronRightIcon,
  Bars3Icon,
  UserCircleIcon,
  DocumentArrowDownIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline'
import { Card, Button, AnimatedCard } from '@/components/ui'
import type { ServiceGuide } from '@/types'

export default function ServiceGuide() {
  const [activeTab, setActiveTab] = useState('instagram')

  const services = {
    instagram: {
      name: 'Instagram',
      icon: '📸',
      steps: [
        {
          title: 'Instagram 앱 열기',
          description: '모바일 Instagram 앱을 실행합니다',
          icon: <DevicePhoneMobileIcon className="w-6 h-6" />
        },
        {
          title: '햄버거 메뉴 접근',
          description: '프로필 → 햄버거 토글(☰) → 계정 센터',
          icon: <Bars3Icon className="w-6 h-6" />
        },
        {
          title: '데이터 내보내기',
          description: '내 정보 및 권한 → 내 정보 내보내기 → 내보내기 만들기',
          icon: <UserCircleIcon className="w-6 h-6" />
        },
        {
          title: 'JSON 형식 다운로드',
          description: '기기로 내보내기 → 형식: JSON 선택 → 다운로드',
          icon: <DocumentArrowDownIcon className="w-6 h-6" />
        },
        {
          title: '파일 업로드',
          description: '받은 JSON 파일을 여기에 업로드하세요',
          icon: <CloudArrowUpIcon className="w-6 h-6" />
        }
      ]
    },
    kakao: {
      name: '카카오톡',
      icon: '💬',
      steps: [
        {
          title: '카카오톡 설정',
          description: '카카오톡 → 설정 → 개인정보 → 개인정보 처리방침',
          icon: <DevicePhoneMobileIcon className="w-6 h-6" />
        },
        {
          title: '데이터 내보내기',
          description: '데이터 내보내기 → 대화 내역 선택 → 요청',
          icon: <ClipboardDocumentIcon className="w-6 h-6" />
        },
        {
          title: '파일 다운로드',
          description: '이메일로 받은 파일을 다운로드합니다',
          icon: <LinkIcon className="w-6 h-6" />
        },
        {
          title: '업로드',
          description: '다운로드한 파일을 여기에 업로드하세요',
          icon: <ChevronRightIcon className="w-6 h-6" />
        }
      ]
    },
    naver: {
      name: '네이버',
      icon: '🔍',
      steps: [
        {
          title: '네이버 로그인',
          description: '네이버에 로그인 후 설정 메뉴로 이동',
          icon: <ComputerDesktopIcon className="w-6 h-6" />
        },
        {
          title: '개인정보 관리',
          description: '설정 → 개인정보 관리 → 내 정보 관리',
          icon: <ClipboardDocumentIcon className="w-6 h-6" />
        },
        {
          title: '데이터 다운로드',
          description: '검색 기록, 쇼핑 내역 등 다운로드',
          icon: <LinkIcon className="w-6 h-6" />
        },
        {
          title: '업로드',
          description: '다운로드한 파일을 업로드하세요',
          icon: <ChevronRightIcon className="w-6 h-6" />
        }
      ]
    },
    chrome: {
      name: 'Chrome 브라우저',
      icon: '🌐',
      steps: [
        {
          title: 'Chrome 설정',
          description: 'Chrome → 설정 → 개인정보 및 보안',
          icon: <ComputerDesktopIcon className="w-6 h-6" />
        },
        {
          title: '데이터 다운로드',
          description: '데이터 다운로드 → 원하는 데이터 선택',
          icon: <ClipboardDocumentIcon className="w-6 h-6" />
        },
        {
          title: '파일 생성',
          description: 'ZIP 파일이 생성됩니다',
          icon: <LinkIcon className="w-6 h-6" />
        },
        {
          title: '업로드',
          description: '생성된 파일을 업로드하세요',
          icon: <ChevronRightIcon className="w-6 h-6" />
        }
      ]
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          서비스별 데이터 내보내기 가이드
        </h2>
        <p className="text-xl text-gray-600">
          각 서비스에서 데이터를 쉽게 내보내는 방법을 안내합니다
        </p>
      </div>

      {/* Service Tabs */}
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        {Object.entries(services).map(([key, service]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`
              flex items-center gap-3 px-6 py-3 rounded-lg font-medium transition-all duration-200
              ${activeTab === key 
                ? 'bg-primary-600 text-white shadow-lg' 
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }
            `}
          >
            <span className="text-2xl">{service.icon}</span>
            <span>{service.name}</span>
          </button>
        ))}
      </div>

      {/* Steps */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="card"
      >
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
          {services[activeTab as keyof typeof services].steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="text-primary-600">
                  {step.icon}
                </div>
              </div>
              <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-bold">
                {index + 1}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-600">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* QR Code Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card text-center mt-8"
      >
        <QrCodeIcon className="w-16 h-16 text-primary-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          모바일에서 쉽게 업로드하기
        </h3>
        <p className="text-gray-600 mb-4">
          QR코드를 스캔하여 모바일에서 바로 파일을 업로드할 수 있습니다
        </p>
        <div className="bg-gray-100 p-8 rounded-lg inline-block">
          <div className="w-32 h-32 bg-white rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
            <span className="text-gray-400 text-sm">QR Code</span>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          실제 서비스에서는 동적으로 QR코드가 생성됩니다
        </p>
      </motion.div>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="card mt-8"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          💡 유용한 팁
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-800 mb-2">데이터 준비 시간</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Instagram: 24-48시간 소요</li>
              <li>• 카카오톡: 즉시 다운로드 가능</li>
              <li>• 네이버: 1-2시간 소요</li>
              <li>• Chrome: 즉시 다운로드 가능</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-2">보안 안내</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 모든 데이터는 암호화되어 저장됩니다</li>
              <li>• 분석 후 원본 파일은 자동 삭제됩니다</li>
              <li>• 개인정보는 제3자와 공유되지 않습니다</li>
              <li>• 언제든지 데이터 삭제 요청이 가능합니다</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
