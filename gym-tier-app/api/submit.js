const { kv } = require('@vercel/kv');

// 지역명에 콜론(:)이 들어있으면 안 되므로 안전하게 치환
function sanitize(str) {
  return String(str || '').replace(/:/g, '_').trim();
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sido, gugun, tier } = req.body || {};

    if (!sido || !gugun || !tier) {
      return res.status(400).json({ error: 'sido, gugun, tier는 필수입니다' });
    }

    const safeSido = sanitize(sido);
    const safeGugun = sanitize(gugun);
    const safeTier = sanitize(tier);

    // 구/군 단위로만 저장 (동 단위, 헬스장 이름 등은 애초에 안 받음)
    const regionKey = `region:${safeSido}:${safeGugun}`;

    // 해당 지역의 티어별 카운트 +1
    await kv.hincrby(regionKey, safeTier, 1);

    // 전체 제출 건수 +1 (지도 공개 기준으로 사용)
    const total = await kv.incr('total_submissions');

    return res.status(200).json({ ok: true, total });
  } catch (err) {
    console.error('submit error:', err);
    return res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};
