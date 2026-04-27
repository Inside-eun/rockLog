'use client'

import { useEffect, useRef, useState } from 'react'
import { fabric } from 'fabric'

interface ImageEditorProps {
  imageUrl: string
  onSave: (editedImage: Blob) => void
  onCancel: () => void
}

type Mode = 'crop' | 'mask' | null

export default function ImageEditor({ imageUrl, onSave, onCancel }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null)
  const [mode, setMode] = useState<Mode>(null)
  const [cropRect, setCropRect] = useState<fabric.Rect | null>(null)
  const [originalImage, setOriginalImage] = useState<fabric.Image | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 1000,
      height: 700,
      backgroundColor: '#f3f4f6',
      uniformScaling: false,
    })
    fabricCanvasRef.current = canvas

    fabric.Image.fromURL(imageUrl, (img) => {
      if (!img.width || !img.height) return

      const scale = Math.min(
        1000 / img.width,
        700 / img.height,
        1
      )

      img.scale(scale)
      img.set({
        left: (1000 - img.width! * scale) / 2,
        top: (700 - img.height! * scale) / 2,
        selectable: false,
      })

      canvas.add(img)
      canvas.renderAll()
      setOriginalImage(img)
    }, { crossOrigin: 'anonymous' })

    return () => {
      canvas.dispose()
    }
  }, [imageUrl])

  const startCrop = () => {
    if (!fabricCanvasRef.current) return

    if (cropRect) {
      fabricCanvasRef.current.remove(cropRect)
      setCropRect(null)
    }

    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      width: 300,
      height: 300,
      fill: 'rgba(0, 123, 255, 0.1)',
      stroke: '#007bff',
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      cornerColor: '#007bff',
      cornerSize: 12,
      transparentCorners: false,
      lockRotation: true,
    })

    fabricCanvasRef.current.add(rect)
    fabricCanvasRef.current.setActiveObject(rect)
    setCropRect(rect)
    setMode('crop')
  }

  const applyCrop = (afterApply?: () => void) => {
    if (!fabricCanvasRef.current || !cropRect || !originalImage) return

    const canvas = fabricCanvasRef.current
    const cropX = cropRect.left || 0
    const cropY = cropRect.top || 0
    const cropWidth = cropRect.width! * (cropRect.scaleX || 1)
    const cropHeight = cropRect.height! * (cropRect.scaleY || 1)

    canvas.remove(cropRect)
    setCropRect(null)

    const imgScale = originalImage.scaleX || 1
    const imgLeft = originalImage.left || 0
    const imgTop = originalImage.top || 0

    const relativeX = (cropX - imgLeft) / imgScale
    const relativeY = (cropY - imgTop) / imgScale
    const relativeWidth = cropWidth / imgScale
    const relativeHeight = cropHeight / imgScale

    const croppedCanvas = document.createElement('canvas')
    croppedCanvas.width = relativeWidth
    croppedCanvas.height = relativeHeight
    const ctx = croppedCanvas.getContext('2d')

    if (!ctx) return

    const imgElement = (originalImage as any)._element
    ctx.drawImage(
      imgElement,
      relativeX,
      relativeY,
      relativeWidth,
      relativeHeight,
      0,
      0,
      relativeWidth,
      relativeHeight
    )

    fabric.Image.fromURL(croppedCanvas.toDataURL(), (newImg) => {
      canvas.clear()
      
      const scale = Math.min(
        1000 / (newImg.width || 1),
        700 / (newImg.height || 1),
        1
      )

      newImg.scale(scale)
      newImg.set({
        left: (1000 - (newImg.width || 0) * scale) / 2,
        top: (700 - (newImg.height || 0) * scale) / 2,
        selectable: false,
      })

      canvas.add(newImg)
      canvas.renderAll()
      setOriginalImage(newImg)
      setMode(null)
      afterApply?.()
    })
  }

  const startMask = () => {
    if (!fabricCanvasRef.current) return
    setMode('mask')

    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      width: 150,
      height: 50,
      fill: '#ffffff',
      stroke: null,
      strokeWidth: 0,
      cornerColor: '#666',
      cornerSize: 8,
      transparentCorners: false,
      lockRotation: true,
    })

    fabricCanvasRef.current.add(rect)
    fabricCanvasRef.current.setActiveObject(rect)
  }

  const handleSave = () => {
    if (!fabricCanvasRef.current) return

    const doSave = () => {
      if (!fabricCanvasRef.current) return
      fabricCanvasRef.current.discardActiveObject()
      fabricCanvasRef.current.renderAll()
      fabricCanvasRef.current.getElement().toBlob((blob) => {
        if (blob) onSave(blob)
      }, 'image/png')
    }

    if (cropRect && mode === 'crop') {
      applyCrop(doSave)
    } else {
      doSave()
    }
  }

  const deleteSelected = () => {
    if (!fabricCanvasRef.current) return
    const active = fabricCanvasRef.current.getActiveObject()
    if (active && active !== originalImage) {
      fabricCanvasRef.current.remove(active)
      if (active === cropRect) setCropRect(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-auto">
        <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold">이미지 편집</h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-4 border-b dark:border-gray-700 flex flex-wrap gap-2">
          <button
            onClick={startCrop}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'crop'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200'
            }`}
          >
            ✂️ 크롭 영역 선택
          </button>

          {cropRect && mode === 'crop' && (
            <button
              onClick={applyCrop}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
            >
              ✓ 크롭 적용
            </button>
          )}

          <button
            onClick={startMask}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'mask'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200'
            }`}
          >
            ⬜ 흰색 마스크 추가
          </button>

          <button
            onClick={deleteSelected}
            className="px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-lg font-medium hover:bg-red-200"
          >
            🗑️ 선택 삭제
          </button>

          <div className="ml-auto flex gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
            >
              ✓ 편집 완료
            </button>
          </div>
        </div>

        <div className="p-4 bg-gray-100 dark:bg-gray-800 flex justify-center">
          <canvas ref={canvasRef} className="border border-gray-300 dark:border-gray-600" />
        </div>

        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 text-sm">
          <strong>💡 사용 방법:</strong>
          <ul className="list-disc ml-5 mt-1 space-y-1">
            <li><strong>크롭:</strong> "크롭 영역 선택" → 파란 박스를 자유롭게 조절 → "크롭 적용" 또는 "편집 완료"</li>
            <li><strong>마스킹:</strong> "흰색 마스크 추가" → 흰 박스 위치/크기 자유 조절 (여러 개 추가 가능)</li>
            <li><strong>삭제:</strong> 객체 선택 후 "선택 삭제"</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
