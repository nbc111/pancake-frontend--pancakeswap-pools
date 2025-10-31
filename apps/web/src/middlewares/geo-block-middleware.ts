import { NextFetchEvent, NextRequest, NextResponse } from 'next/server'
import { geolocation } from '@vercel/functions'
import { shouldGeoBlock } from '@pancakeswap/utils/geoBlock'
import { MiddlewareFactory, NextMiddleware } from './types'

export const withGeoBlock: MiddlewareFactory = (next: NextMiddleware) => {
  return async (request: NextRequest, _next: NextFetchEvent) => {
    // 在本地开发环境中跳过地理位置检查，避免阻塞
    if (process.env.NODE_ENV === 'development' || !process.env.VERCEL) {
      return next(request, _next)
    }
    try {
      const geo = geolocation(request)
      if (shouldGeoBlock(geo)) {
        return NextResponse.redirect(new URL('/451', request.url))
      }
    } catch (error) {
      // 如果 geolocation 不可用（本地环境），直接跳过
      console.warn('GeoBlock middleware skipped:', error)
    }
    return next(request, _next)
  }
}
