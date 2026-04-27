/**
 * Vision API 전송 전 클라이언트 사이드 이미지 전처리.
 * 1. 검은 테두리 자동 크롭 (Vivid Planet 등 어두운 배경 이미지)
 * 2. 대비·밝기 강화 (버튼 줄무늬 패턴 완화)
 * 3. 소형 이미지 업스케일 (작은 서브텍스트 인식률 향상)
 */
export async function preprocessTimetableImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      const src = document.createElement('canvas')
      src.width = img.width
      src.height = img.height
      src.getContext('2d')!.drawImage(img, 0, 0)

      const bounds = detectContentBounds(src, img.width, img.height)

      const minDim = Math.min(bounds.width, bounds.height)
      const scale = minDim < 1000 ? Math.min(2, 1000 / minDim) : 1

      const out = document.createElement('canvas')
      out.width = Math.round(bounds.width * scale)
      out.height = Math.round(bounds.height * scale)
      const ctx = out.getContext('2d')!
      ctx.filter = 'contrast(1.3) brightness(1.05)'
      ctx.drawImage(src, bounds.x, bounds.y, bounds.width, bounds.height, 0, 0, out.width, out.height)

      out.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('Canvas toBlob 실패')); return }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.png'), { type: 'image/png' }))
        },
        'image/png'
      )
    }

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('이미지 로드 실패')) }
    img.src = url
  })
}

function detectContentBounds(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  darkThreshold = 20,
): { x: number; y: number; width: number; height: number } {
  const { data } = canvas.getContext('2d')!.getImageData(0, 0, width, height)

  // 4픽셀 간격 샘플링으로 속도 확보
  const isBright = (x: number, y: number) => {
    const i = (y * width + x) * 4
    return data[i] > darkThreshold || data[i + 1] > darkThreshold || data[i + 2] > darkThreshold
  }

  const rowHasContent = (y: number) => {
    for (let x = 0; x < width; x += 4) if (isBright(x, y)) return true
    return false
  }

  const colHasContent = (x: number) => {
    for (let y = 0; y < height; y += 4) if (isBright(x, y)) return true
    return false
  }

  let top = 0, bottom = height - 1, left = 0, right = width - 1

  while (top < height && !rowHasContent(top)) top++
  while (bottom > top && !rowHasContent(bottom)) bottom--
  while (left < width && !colHasContent(left)) left++
  while (right > left && !colHasContent(right)) right--

  // 크롭할 만한 여백이 없으면 원본 반환
  const trimmed = top > 2 || bottom < height - 3 || left > 2 || right < width - 3
  if (!trimmed) return { x: 0, y: 0, width, height }

  const PAD = 6
  const x = Math.max(0, left - PAD)
  const y = Math.max(0, top - PAD)
  return {
    x,
    y,
    width: Math.min(width, right + PAD + 1) - x,
    height: Math.min(height, bottom + PAD + 1) - y,
  }
}
