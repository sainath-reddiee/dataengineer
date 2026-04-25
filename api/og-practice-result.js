// api/og-practice-result.js
// Vercel Edge function: generates a branded OG score card image for LinkedIn/X shares.
// Requires: `npm install @vercel/og`
//
// URL: /api/og-practice-result?score=85&cert=snowpro-core&correct=85&total=100
//
// Deployed as a Vercel Serverless Function. Runs at the edge for low latency.
// If @vercel/og is not installed, this file is skipped by the build — ShareScoreCard
// gracefully hides the image (see onError handler).

import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

const CERT_LABELS = {
  'snowpro-core': { name: 'SnowPro Core', provider: 'Snowflake', color: '#3B82F6' },
  'snowpro-genai': { name: 'SnowPro Gen AI', provider: 'Snowflake', color: '#A855F7' },
  'databricks-de': { name: 'Databricks Data Engineer', provider: 'Databricks', color: '#F97316' },
};

export default function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const score = Math.max(0, Math.min(100, parseInt(searchParams.get('score') || '0', 10)));
    const certSlug = searchParams.get('cert') || 'snowpro-core';
    const correct = parseInt(searchParams.get('correct') || '0', 10);
    const total = parseInt(searchParams.get('total') || '0', 10);

    const cert = CERT_LABELS[certSlug] || {
      name: 'Practice Test',
      provider: 'Data Engineer Hub',
      color: '#3B82F6',
    };

    const scoreColor = score >= 75 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444';
    const scoreLabel = score >= 75 ? 'Passed' : 'Keep Going';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0F172A',
            backgroundImage: `radial-gradient(circle at 25% 25%, ${cert.color}22 0%, transparent 50%), radial-gradient(circle at 75% 75%, ${scoreColor}22 0%, transparent 50%)`,
            fontFamily: 'sans-serif',
            color: 'white',
            padding: '60px',
          }}
        >
          {/* Brand */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '24px',
              fontWeight: 600,
              color: '#94A3B8',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: `linear-gradient(135deg, ${cert.color}, ${scoreColor})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: 800,
                color: 'white',
              }}
            >
              DE
            </div>
            Data Engineer Hub
          </div>

          <div style={{ fontSize: '28px', color: '#CBD5E1', marginBottom: '10px' }}>
            {cert.provider} · {cert.name}
          </div>

          {/* Score ring (simulated with concentric blocks) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '280px',
              height: '280px',
              borderRadius: '50%',
              background: `conic-gradient(${scoreColor} ${score * 3.6}deg, #1E293B 0deg)`,
              marginTop: '30px',
              marginBottom: '30px',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '220px',
                height: '220px',
                borderRadius: '50%',
                backgroundColor: '#0F172A',
              }}
            >
              <div style={{ fontSize: '100px', fontWeight: 800, color: scoreColor, lineHeight: 1 }}>
                {score}%
              </div>
              <div style={{ fontSize: '22px', color: '#94A3B8', marginTop: '6px' }}>
                {correct} / {total} correct
              </div>
            </div>
          </div>

          <div
            style={{
              fontSize: '36px',
              fontWeight: 700,
              color: scoreColor,
              marginBottom: '10px',
            }}
          >
            {scoreLabel}
          </div>

          <div style={{ fontSize: '24px', color: '#64748B' }}>
            dataengineerhub.blog/practice
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (err) {
    return new Response(`Failed to generate OG image: ${err.message}`, { status: 500 });
  }
}
