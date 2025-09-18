'use client'

import { useState } from 'react'
import { DetectedObject } from '@/types'

interface ObjectDetectionVisualizerProps {
  imageUrl: string
  objects: DetectedObject[]
  imageSize: { width: number; height: number }
}

export default function ObjectDetectionVisualizer({ 
  imageUrl, 
  objects, 
  imageSize 
}: ObjectDetectionVisualizerProps) {
  const [selectedObject, setSelectedObject] = useState<DetectedObject | null>(null)

  const drawBoundingBoxes = () => {
    return objects.map((obj, index) => {
      const [x, y, width, height] = obj.bbox
      const isSelected = selectedObject === obj
      
      return (
        <div
          key={index}
          className={`absolute border-2 cursor-pointer transition-all duration-200 ${
            isSelected 
              ? 'border-red-500 bg-red-500/20' 
              : 'border-blue-500 bg-blue-500/10 hover:border-blue-600 hover:bg-blue-500/20'
          }`}
          style={{
            left: `${(x / imageSize.width) * 100}%`,
            top: `${(y / imageSize.height) * 100}%`,
            width: `${(width / imageSize.width) * 100}%`,
            height: `${(height / imageSize.height) * 100}%`,
          }}
          onClick={() => setSelectedObject(isSelected ? null : obj)}
        >
          <div className="absolute -top-6 left-0 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            {obj.class} ({(obj.score * 100).toFixed(1)}%)
          </div>
        </div>
      )
    })
  }

  return (
    <div className="space-y-4">
      {/* 이미지와 바운딩 박스 */}
      <div className="relative inline-block">
        <img
          src={imageUrl}
          alt="분석된 이미지"
          className="max-w-full h-auto rounded-lg shadow-sm"
          style={{ maxHeight: '500px' }}
        />
        {drawBoundingBoxes()}
      </div>

      {/* 객체 목록 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-800 mb-3">감지된 객체 목록</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {objects.map((obj, index) => (
            <div
              key={index}
              className={`p-2 rounded cursor-pointer transition-colors ${
                selectedObject === obj
                  ? 'bg-red-100 border-red-300 border'
                  : 'bg-white hover:bg-gray-100 border border-gray-200'
              }`}
              onClick={() => setSelectedObject(selectedObject === obj ? null : obj)}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm capitalize">{obj.class}</span>
                <span className="text-xs text-gray-500">
                  {(obj.score * 100).toFixed(1)}%
                </span>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                위치: ({obj.bbox[0].toFixed(0)}, {obj.bbox[1].toFixed(0)})
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 선택된 객체 상세 정보 */}
      {selectedObject && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">선택된 객체 상세 정보</h4>
          <div className="space-y-1 text-sm">
            <div><span className="font-medium">클래스:</span> {selectedObject.class}</div>
            <div><span className="font-medium">신뢰도:</span> {(selectedObject.score * 100).toFixed(2)}%</div>
            <div><span className="font-medium">위치:</span> ({selectedObject.bbox[0].toFixed(0)}, {selectedObject.bbox[1].toFixed(0)})</div>
            <div><span className="font-medium">크기:</span> {selectedObject.bbox[2].toFixed(0)} × {selectedObject.bbox[3].toFixed(0)}</div>
          </div>
        </div>
      )}
    </div>
  )
}
