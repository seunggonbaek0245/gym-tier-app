const { kv } = require('@vercel/kv');

const REVEAL_THRESHOLD = 100; // 100명 모이면 지도 공개

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const total = (await kv.get('total_submissions')) || 0;
    const revealed = total >= REVEAL_THRESHOLD;

    const result = {
      total,
      revealed,
      threshold: REVEAL_THRESHOLD,
      regions: {},
    };

    // 100명 넘기 전에는 지역별 데이터를 아예 내려주지 않음 (숨김 유지)
    if (revealed) {
      const keys = await kv.keys('region:*');
      for (const key of keys) {
        const tiers = await kv.hgetall(key);
        // key 형태: region:서울특별시:강남구
        const [, sido, gugun] = key.split(':');
        result.regions[`${sido}:${gugun}`] = tiers;
      }
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error('stats error:', err);
    return res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};
