import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/bank-soal', '/tryout', '/analytics', '/ai-assistant', '/study-groups', '/pdf-workspace', '/study-drive', '/tips-strategi', '/profile', '/settings', '/leaderboard', '/score-check'],
      },
    ],
    sitemap: 'https://loginptn.xyz/sitemap.xml',
  }
}
