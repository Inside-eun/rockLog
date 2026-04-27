import { notFound } from 'next/navigation'
import { FestivalDetailClient } from './festival-detail-client'

async function getFestival(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/festivals/${id}`, {
    cache: 'no-store',
  })
  
  if (!res.ok) return null
  return res.json()
}

export default async function FestivalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const festival = await getFestival(id)

  if (!festival) {
    notFound()
  }

  return <FestivalDetailClient festival={festival} />
}
