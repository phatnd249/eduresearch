import React from 'react';

/**
 * GaugeMeter: Đồng hồ đo Chỉ số Sẵn sàng Chuyển đổi (Readiness Index - AT)
 * Thang điểm 0 - 100 (quy đổi thang 10)
 * Phân 3 cấp độ:
 * 🟢 Cấp độ 1: >= 80/100 (Sẵn sàng Cao - Đơn vị tiên phong)
 * 🟡 Cấp độ 2: 60 - 79/100 (Sẵn sàng Trung bình - Đang triển khai)
 * 🔴 Cấp độ 3: < 60/100 (Cần cải thiện - Hạ tầng & kỹ năng còn hạn chế)
 */
const GaugeMeter = ({ score = 78.5, size = 260, title = 'Chỉ số Sẵn sàng Chuyển đổi (AT)' }) => {
  const boundedScore = Math.max(0, Math.min(100, parseFloat(score) || 0));
  const score10 = (boundedScore / 10).toFixed(2);

  // Xác định cấp độ
  let level = 2;
  let levelName = 'Cấp độ 2 — Sẵn sàng Trung bình';
  let levelColor = '#D97706'; // Amber
  let levelBg = '#FEF3C7';
  let levelDesc = 'Đơn vị đang triển khai tích cực, đã số hóa quy trình nhưng còn vướng rào cản kỹ năng số hoặc hạ tầng liên thông.';

  if (boundedScore >= 80) {
    level = 1;
    levelName = 'Cấp độ 1 — Sẵn sàng Cao (Tiên phong)';
    levelColor = '#059669'; // Emerald
    levelBg = '#D1FAE5';
    levelDesc = 'Đơn vị tiên phong dẫn đầu, có hạ tầng công nghệ hiện đại và năng lực thích ứng số hóa toàn diện.';
  } else if (boundedScore < 60) {
    level = 3;
    levelName = 'Cấp độ 3 — Cần Cải thiện Cấp bách';
    levelColor = '#DC2626'; // Red
    levelBg = '#FEE2E2';
    levelDesc = 'Mức độ sẵn sàng thấp, hạ tầng thiếu đồng bộ, sức ỳ tâm lý và kỹ năng số chưa đáp ứng chuẩn mực mới.';
  }

  // Góc kim: từ -90 độ (score 0) đến +90 độ (score 100)
  const angle = -90 + (boundedScore / 100) * 180;
  const rad = (angle * Math.PI) / 180;
  const r = 85;
  const needleLength = 70;
  const cx = 130;
  const cy = 115;
  const nx = cx + needleLength * Math.cos(rad);
  const ny = cy + needleLength * Math.sin(rad);

  return (
    <div className="gauge-meter-wrapper" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '1.25rem',
      backgroundColor: 'white',
      borderRadius: 'var(--radius-lg, 12px)',
      border: '1px solid #E2E8F0',
      boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
      width: '100%',
      maxWidth: `${size + 40}px`,
      margin: '0 auto'
    }}>
      <div style={{ fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-muted, #64748B)', marginBottom: '0.5rem', textAlign: 'center', letterSpacing: '0.04em' }}>
        {title}
      </div>

      <svg width={size} height={size * 0.58} viewBox="0 0 260 150" style={{ width: '100%', maxWidth: `${size}px`, height: 'auto' }}>
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="45%" stopColor="#F59E0B" />
            <stop offset="65%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <filter id="needleGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Cung nền */}
        <path
          d="M 25 115 A 105 105 0 0 1 235 115"
          fill="none"
          stroke="#F1F5F9"
          strokeWidth="18"
          strokeLinecap="round"
        />

        {/* 3 phân đoạn màu: Đỏ (0-60%), Vàng (60-80%), Xanh (80-100%) */}
        {/* Đỏ: 0 - 60% (-90deg đến +18deg) */}
        <path
          d="M 25 115 A 105 105 0 0 1 151 18"
          fill="none"
          stroke="#EF4444"
          strokeWidth="14"
          strokeOpacity="0.85"
        />
        {/* Vàng: 60 - 80% (18deg đến 54deg) */}
        <path
          d="M 151 18 A 105 105 0 0 1 215 62"
          fill="none"
          stroke="#F59E0B"
          strokeWidth="14"
          strokeOpacity="0.9"
        />
        {/* Xanh: 80 - 100% (54deg đến 90deg) */}
        <path
          d="M 215 62 A 105 105 0 0 1 235 115"
          fill="none"
          stroke="#10B981"
          strokeWidth="14"
          strokeLinecap="round"
        />

        {/* Nhãn mốc số */}
        <text x="25" y="135" fontSize="10" fill="#94A3B8" fontWeight="600" textAnchor="middle">0</text>
        <text x="80" y="65" fontSize="9" fill="#EF4444" fontWeight="600" textAnchor="middle">&lt; 60</text>
        <text x="180" y="45" fontSize="9" fill="#D97706" fontWeight="600" textAnchor="middle">60-79</text>
        <text x="235" y="135" fontSize="10" fill="#059669" fontWeight="600" textAnchor="middle">100</text>

        {/* Kim đồng hồ (Needle) */}
        <line
          x1={cx}
          y1={cy}
          x2={nx}
          y2={ny}
          stroke="#1E293B"
          strokeWidth="3.5"
          strokeLinecap="round"
          filter="url(#needleGlow)"
        />
        {/* Trục kim */}
        <circle cx={cx} cy={cy} r="7" fill="#1E293B" />
        <circle cx={cx} cy={cy} r="3.5" fill="white" />
      </svg>

      {/* Hiển thị điểm số lớn */}
      <div style={{ textAlign: 'center', marginTop: '-15px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.35rem' }}>
          <span style={{ fontSize: '2.25rem', fontWeight: '800', color: levelColor, letterSpacing: '-0.02em' }}>
            {boundedScore.toFixed(1)}
          </span>
          <span style={{ fontSize: '1rem', color: '#64748B', fontWeight: '600' }}>/ 100</span>
          <span style={{ fontSize: '0.85rem', color: '#94A3B8', marginLeft: '0.5rem', fontWeight: '500' }}>
            ({score10}/10)
          </span>
        </div>

        {/* Huy hiệu cấp độ */}
        <div style={{
          display: 'inline-block',
          backgroundColor: levelBg,
          color: levelColor,
          fontSize: '0.75rem',
          fontWeight: '700',
          padding: '0.25rem 0.75rem',
          borderRadius: '20px',
          marginTop: '0.35rem',
          border: `1px solid ${levelColor}30`
        }}>
          {levelName}
        </div>

        {/* Lời diễn giải cấp độ */}
        <div style={{ fontSize: '0.775rem', color: '#475569', marginTop: '0.5rem', lineHeight: '1.4', maxWidth: '240px' }}>
          {levelDesc}
        </div>
      </div>
    </div>
  );
};

export default GaugeMeter;
