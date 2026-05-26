// pages/_app.js
import '../styles/globals.css'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { supabase } from '../lib/supabase'
import { colors, fonts } from '../styles/tokens'

// Ezra coach widget is global, but hidden on routes where it would distract.
const WebsiteCoach = dynamic(() => import('../components/WebsiteCoach'), { ssr: false })

const COACH_EXCLUDE_PREFIXES = [
  '/admin',
  '/coach-embed',
  '/login',
  '/auth',
  '/checkout',
  '/success',
  '/training',
  '/modules',
  '/training-bot',
  '/mid-journey',
  '/final-blueprint',
  '/dashboard',
  '/api',
]
function shouldShowCoach(pathname) {
  return !COACH_EXCLUDE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

const publicPages = [
  '/login', '/auth/callback', '/auth/reset-password', '/', '/assessment', '/coach-embed',
  '/called-to-carry',
  '/called-to-carry/assessment',
  '/called-to-carry/founders',
  '/called-to-carry/founders/apply',
  '/called-to-carry/founders/thank-you',
  '/called-to-carry/sprint',
  '/called-to-carry/sprint/apply',
  '/called-to-carry/sprint/thank-you',
  '/self-paced',
  '/self-paced/thank-you',
  '/blueprint',
  '/blueprint/apply',
  '/blueprint/thank-you',
]

const publicPrefixes = ['/called-to-carry/assessment/results', '/books']

export default function App({ Component, pageProps }) {
  const router = useRouter()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (loading) return

    const isPublicPage = publicPages.includes(router.pathname) ||
      publicPrefixes.some(p => router.pathname.startsWith(p))

    if (!session && !isPublicPage) {
      router.replace('/login')
    } else if (session && router.pathname === '/login') {
      router.replace('/dashboard')
    }
  }, [session, loading, router.pathname])

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: colors.navy,
        fontFamily: fonts.body,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48, border: '4px solid ' + colors.gray200,
            borderTop: '4px solid ' + colors.gold, borderRadius: '50%',
            margin: '0 auto 20px', animation: 'spin 1s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          <p style={{ color: colors.navy, fontWeight: 600, fontSize: 16 }}>Loading...</p>
        </div>
      </div>
    )
  }

  const isPublicPage = publicPages.includes(router.pathname) ||
    publicPrefixes.some(p => router.pathname.startsWith(p))

  if (!session && !isPublicPage) {
    return null
  }

  return (
    <>
      <Component {...pageProps} session={session} />
      {shouldShowCoach(router.pathname) && <WebsiteCoach />}
      <Analytics />
      <SpeedInsights />
    </>
  )
}