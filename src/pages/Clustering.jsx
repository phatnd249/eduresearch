import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, Cell, PieChart, Pie 
} from 'recharts';
import { 
  Compass, MapPin, Building2, Users, Layers, Award, ArrowUpRight, 
  CheckCircle2, AlertTriangle, FileDown, RefreshCw, Sparkles, Filter 
} from 'lucide-react';
import { surveysAPI } from '../services/api';
import GaugeMeter from '../components/GaugeMeter';
import Toast from '../components/Toast';
import { Skeleton, SkeletonStatCard, SkeletonChart } from '../components/Skeleton';

const CLUSTER_COLORS = {
  1: '#10B981', // Cụm 1: Tiên phong (Xanh lá)
  2: '#3B82F6', // Cụm 2: Tiềm năng (Xanh dương)
  3: '#EF4444'  // Cụm 3: Cần hỗ trợ (Đỏ)
};

const Clustering = () => {
  const [searchParams] = useSearchParams();
  const querySurveyId = searchParams.get('surveyId');

  const [surveys, setSurveys] = useState([]);
  const [selectedSurveyId, setSelectedSurveyId] = useState('');
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedClusterFilter, setSelectedClusterFilter] = useState('all');

  const [toast, setToast] = useState({ message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    const loadSurveys = async () => {
      try {
        setLoading(true);
        const list = await surveysAPI.getAll();
        setSurveys(list);
        if (querySurveyId) {
          setSelectedSurveyId(querySurveyId);
        } else if (list.length > 0) {
          setSelectedSurveyId(list[0].id.toString());
        }
      } catch (err) {
        console.error('Lỗi khi tải khảo sát:', err);
      } finally {
        setLoading(false);
      }
    };
    loadSurveys();
  }, [querySurveyId]);

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!selectedSurveyId) return;
      try {
        setLoading(true);
        const data = await surveysAPI.getAnalysis(selectedSurveyId, true);
        setAnalysisData(data);
      } catch (err) {
        console.error('Lỗi phân tích:', err);
        showToast('Không thể tải dữ liệu phân cụm.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [selectedSurveyId]);

  if (loading && !analysisData) {
    return (
      <div style={{ animation: 'fadeIn 0.3s ease' }}>
        {/* Header Skeleton */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <Skeleton width="320px" height="2rem" style={{ marginBottom: '0.5rem' }} />
            <Skeleton width="480px" height="1rem" />
          </div>
          <div className="page-header-actions" style={{ display: 'flex', gap: '0.75rem' }}>
            <Skeleton width="220px" height="2.5rem" borderRadius="var(--radius-md)" />
            <Skeleton width="130px" height="2.5rem" borderRadius="var(--radius-md)" />
          </div>
        </div>

        {/* 3 Cluster Stat Cards Skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>

        {/* Big Scatter Map Skeleton */}
        <SkeletonChart height="420px" />
      </div>
    );
  }

  const { khau1_cleaning, khau3_descriptive, surveyInfo } = analysisData || {};
  const scores = khau3_descriptive?.respondentConstructScores || [];

  // Tạo tọa độ Scatter Plot cho từng người/cơ sở giáo dục
  // Trục X: Năng lực nội bộ (DX/CAP + RO/RES) / 2
  // Trục Y: Chiến lược & Lãnh đạo (SP/STR + LD/LEA) / 2
  // Trục Z (kích thước): Mức độ sẵn sàng AT (thang 100)
  const scatterPoints = (khau1_cleaning?.cleanedResponses || []).map((r, idx) => {
    const sc = scores[idx] || {};
    // Hỗ trợ cả mã SP/LD/DX/RO/CS/AT và STR/LEA/CAP/RES/SER/REA
    const sp = sc.SP || sc.STR || 3.5;
    const ld = sc.LD || sc.LEA || 3.5;
    const dx = sc.DX || sc.CAP || 3.5;
    const ro = sc.RO || sc.RES || 3.5;
    const cs = sc.CS || sc.SER || 3.5;
    const at = sc.AT || sc.REA || ((sp + ld + dx + ro + cs) / 5);

    const xCoord = parseFloat(((dx + ro) / 2).toFixed(2));
    const yCoord = parseFloat(((sp + ld) / 2).toFixed(2));
    const atScore100 = parseFloat((at * 20).toFixed(1));

    let cluster = 2;
    let clusterName = 'Cụm Tiềm năng (Digital Challengers)';
    if (atScore100 >= 80) {
      cluster = 1;
      clusterName = 'Cụm Tiên phong (Digital Leaders)';
    } else if (atScore100 < 65) {
      cluster = 3;
      clusterName = 'Cụm Cần hỗ trợ (Digital Laggards)';
    }

    return {
      id: r.id,
      institution: r.institution || 'Cơ sở giáo dục đại học',
      role: r.role || 'Người tham gia',
      unit: r.unit || 'Đơn vị',
      x: xCoord, // Năng lực & Nguồn lực
      y: yCoord, // Chiến lược & Lãnh đạo
      z: atScore100, // Điểm sẵn sàng AT
      cluster,
      clusterName,
      color: CLUSTER_COLORS[cluster]
    };
  });

  const filteredPoints = selectedClusterFilter === 'all' 
    ? scatterPoints 
    : scatterPoints.filter(p => p.cluster.toString() === selectedClusterFilter);

  // Thống kê 3 cụm
  const c1Points = scatterPoints.filter(p => p.cluster === 1);
  const c2Points = scatterPoints.filter(p => p.cluster === 2);
  const c3Points = scatterPoints.filter(p => p.cluster === 3);

  const totalN = Math.max(1, scatterPoints.length);

  return (
    <div>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#10B981', backgroundColor: '#ECFDF5', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid #A7F3D0' }}>
              Sản phẩm 2 • Cluster Profiling
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Định vị vị thế cạnh tranh theo 5 chiều cạnh
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
            Bản Đồ Phân Cụm Hồ Sơ Phát Triển (Cluster Profiling)
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Định vị tọa độ cụ thể của từng cơ sở giáo dục đại học trên không gian năng lực cạnh tranh và phân tách nhóm trường điển hình.
          </p>
        </div>

        <div className="page-header-actions" style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to={`/analytics?surveyId=${selectedSurveyId}`} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
            <Sparkles size={16} />
            <span>Xem Báo cáo Đa biến APA 7</span>
          </Link>
        </div>
      </div>

      {/* DROPDOWN CHỌN KHẢO SÁT & BỘ LỌC CỤM */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          
          <div style={{ flex: '1', minWidth: 0, width: '100%' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.35rem', color: 'var(--text-muted)' }}>
              CHỌN BỘ KHẢO SÁT CẦN ĐỊNH VỊ BẢN ĐỒ PHÂN CỤM:
            </label>
            <select 
              className="input" 
              style={{ width: '100%', backgroundColor: '#F8FAFC', fontWeight: '600' }}
              value={selectedSurveyId}
              onChange={(e) => setSelectedSurveyId(e.target.value)}
            >
              {surveys.map(s => (
                <option key={s.id} value={s.id}>
                  Khảo sát #{s.id} — {s.title} ({s.responses_count || 0} phản hồi)
                </option>
              ))}
            </select>
          </div>

          <div className="clustering-filter-cluster" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: '600', color: 'var(--text-muted)' }}>
              Lọc theo Cụm:
            </span>
            <select 
              className="input"
              style={{ backgroundColor: '#F8FAFC' }}
              value={selectedClusterFilter}
              onChange={(e) => setSelectedClusterFilter(e.target.value)}
            >
              <option value="all">Tất cả các Cụm ({scatterPoints.length} mẫu)</option>
              <option value="1">Cụm 1: Tiên phong ({c1Points.length} mẫu)</option>
              <option value="2">Cụm 2: Tiềm năng ({c2Points.length} mẫu)</option>
              <option value="3">Cụm 3: Cần hỗ trợ ({c3Points.length} mẫu)</option>
            </select>
          </div>

        </div>
      </div>

      {/* 3 SUMMARY CARDS FOR CLUSTERS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #10B981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 'bold', color: '#059669', textTransform: 'uppercase' }}>Cụm 1: Tiên phong</span>
            <span style={{ fontSize: '0.75rem', backgroundColor: '#D1FAE5', color: '#059669', padding: '0.15rem 0.5rem', borderRadius: '12px', fontWeight: '700' }}>
              {((c1Points.length / totalN) * 100).toFixed(1)}%
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            {c1Points.length} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>đơn vị</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Điểm Sẵn sàng AT trung bình: <b style={{ color: '#059669' }}>{(c1Points.reduce((acc, p) => acc + p.z, 0) / Math.max(1, c1Points.length)).toFixed(1)} / 100</b>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #3B82F6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 'bold', color: '#2563EB', textTransform: 'uppercase' }}>Cụm 2: Tiềm năng</span>
            <span style={{ fontSize: '0.75rem', backgroundColor: '#DBEAFE', color: '#2563EB', padding: '0.15rem 0.5rem', borderRadius: '12px', fontWeight: '700' }}>
              {((c2Points.length / totalN) * 100).toFixed(1)}%
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            {c2Points.length} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>đơn vị</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Điểm Sẵn sàng AT trung bình: <b style={{ color: '#2563EB' }}>{(c2Points.reduce((acc, p) => acc + p.z, 0) / Math.max(1, c2Points.length)).toFixed(1)} / 100</b>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #EF4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 'bold', color: '#DC2626', textTransform: 'uppercase' }}>Cụm 3: Cần hỗ trợ</span>
            <span style={{ fontSize: '0.75rem', backgroundColor: '#FEE2E2', color: '#DC2626', padding: '0.15rem 0.5rem', borderRadius: '12px', fontWeight: '700' }}>
              {((c3Points.length / totalN) * 100).toFixed(1)}%
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            {c3Points.length} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>đơn vị</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Điểm Sẵn sàng AT trung bình: <b style={{ color: '#DC2626' }}>{(c3Points.reduce((acc, p) => acc + p.z, 0) / Math.max(1, c3Points.length)).toFixed(1)} / 100</b>
          </div>
        </div>
      </div>

      {/* 2D SCATTER PLOT & POSITIONING MAP */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Compass size={20} color="var(--primary)" />
              Biểu Đồ Phân Tán Không Gian Cạnh Tranh 2D (Scatter Plot)
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Trục X: Năng lực số hóa &amp; Nguồn lực (DX &amp; RO) • Trục Y: Kế hoạch Chiến lược &amp; Lãnh đạo số (SP &amp; LD)
            </p>
          </div>
          
          <div className="clustering-legend" style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', fontWeight: '600', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#10B981' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
              Tiên phong (AT &ge; 80)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#3B82F6' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#3B82F6', display: 'inline-block' }} />
              Tiềm năng (65 - 79)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#EF4444' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#EF4444', display: 'inline-block' }} />
              Cần hỗ trợ (&lt; 65)
            </span>
          </div>
        </div>

        <div className="clustering-chart-container" style={{ height: '420px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, bottom: 25, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis 
                type="number" 
                dataKey="x" 
                name="Năng lực & Nguồn lực (DX & RO)" 
                domain={[1.5, 5.0]} 
                label={{ value: 'Năng lực số hóa & Nguồn lực (DX & RO)', position: 'insideBottom', offset: -15, fill: '#64748B', fontSize: 12, fontWeight: 600 }}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="Chiến lược & Lãnh đạo (SP & LD)" 
                domain={[1.5, 5.0]} 
                label={{ value: 'Chiến lược & Lãnh đạo số (SP & LD)', angle: -90, position: 'insideLeft', offset: 10, fill: '#64748B', fontSize: 12, fontWeight: 600 }}
              />
              <ZAxis type="number" dataKey="z" range={[50, 220]} name="Điểm Sẵn sàng AT" />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }} 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div style={{ backgroundColor: 'white', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '0.825rem' }}>
                        <div style={{ fontWeight: 'bold', color: data.color, marginBottom: '0.25rem' }}>{data.clusterName}</div>
                        <div><b>Đơn vị:</b> {data.institution} ({data.unit})</div>
                        <div><b>Vị trí:</b> {data.role}</div>
                        <div style={{ marginTop: '0.35rem', paddingTop: '0.35rem', borderTop: '1px solid #F1F5F9', color: '#1E40AF' }}>
                          <b>Điểm Sẵn sàng AT: {data.z}/100</b>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          Tọa độ: (DX&amp;RO: {data.x}, SP&amp;LD: {data.y})
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter name="Đơn vị khảo sát" data={filteredPoints}>
                {filteredPoints.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CLUSTER SEGMENTATION TABLE */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Layers size={18} color="var(--primary)" />
          Bảng Phân Khúc Nhóm Trường Điển Hình &amp; Khuyến Nghị Cho Ban Giám Hiệu
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Chi tiết đặc điểm nhận diện, cấu hình 5 chiều cạnh và kế hoạch can thiệp chiến lược:
        </p>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Nhóm hồ sơ phát triển</th>
                <th style={{ textAlign: 'center' }}>Quy mô mẫu</th>
                <th style={{ textAlign: 'center' }}>Điểm AT TB</th>
                <th>Cấu hình 5 chiều cạnh (SP, LD, DX, RO, CS)</th>
                <th>Vị thế cạnh tranh &amp; Định hướng Ban Giám hiệu</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 'bold', color: '#059669' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                    Cụm 1: Tiên phong (Digital Leaders)
                  </span>
                </td>
                <td style={{ textAlign: 'center', fontWeight: '600' }}>
                  {c1Points.length} ({((c1Points.length / totalN) * 100).toFixed(1)}%)
                </td>
                <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#059669', fontSize: '1rem' }}>
                  {(c1Points.reduce((acc, p) => acc + p.z, 0) / Math.max(1, c1Points.length)).toFixed(1)} / 100
                </td>
                <td style={{ fontSize: '0.825rem', color: '#334155' }}>
                  Điểm 5 trụ cột đồng đều ở mức cao (&ge; 4.2/5). Ban Giám hiệu quyết liệt, hạ tầng số phủ rộng, dịch vụ người học trực tuyến 100%.
                </td>
                <td style={{ fontSize: '0.825rem', color: '#166534', backgroundColor: '#F0FDF4', borderRadius: '6px', padding: '0.6rem' }}>
                  <b>Đầu tàu mạng lưới:</b> Chia sẻ mô hình quản trị số, chuyển giao học liệu mở số hóa và tiên phong thử nghiệm AI thế hệ mới.
                </td>
              </tr>

              <tr>
                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 'bold', color: '#2563EB' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3B82F6' }} />
                    Cụm 2: Tiềm năng (Digital Challengers)
                  </span>
                </td>
                <td style={{ textAlign: 'center', fontWeight: '600' }}>
                  {c2Points.length} ({((c2Points.length / totalN) * 100).toFixed(1)}%)
                </td>
                <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#2563EB', fontSize: '1rem' }}>
                  {(c2Points.reduce((acc, p) => acc + p.z, 0) / Math.max(1, c2Points.length)).toFixed(1)} / 100
                </td>
                <td style={{ fontSize: '0.825rem', color: '#334155' }}>
                  Điểm dao động 3.4 - 3.9/5. Ý thức chuyển đổi số cao nhưng cơ sở dữ liệu chưa liên thông, kinh phí đầu tư còn dàn trải.
                </td>
                <td style={{ fontSize: '0.825rem', color: '#1E40AF', backgroundColor: '#EFF6FF', borderRadius: '6px', padding: '0.6rem' }}>
                  <b>Chuẩn hóa liên thông:</b> Tập trung tích hợp API giữa E-Office, LMS và Quản lý đào tạo; đào tạo kỹ năng sư phạm số định kỳ.
                </td>
              </tr>

              <tr>
                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 'bold', color: '#DC2626' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
                    Cụm 3: Cần hỗ trợ (Digital Laggards)
                  </span>
                </td>
                <td style={{ textAlign: 'center', fontWeight: '600' }}>
                  {c3Points.length} ({((c3Points.length / totalN) * 100).toFixed(1)}%)
                </td>
                <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#DC2626', fontSize: '1rem' }}>
                  {(c3Points.reduce((acc, p) => acc + p.z, 0) / Math.max(1, c3Points.length)).toFixed(1)} / 100
                </td>
                <td style={{ fontSize: '0.825rem', color: '#334155' }}>
                  Điểm &lt; 3.2/5. Hạ tầng mạng và thiết bị còn yếu, sức ỳ tâm lý lớn, thiếu cơ chế khen thưởng và phân quyền linh hoạt.
                </td>
                <td style={{ fontSize: '0.825rem', color: '#991B1B', backgroundColor: '#FEF2F2', borderRadius: '6px', padding: '0.6rem' }}>
                  <b>Can thiệp cấp bách:</b> Gói hỗ trợ kỹ thuật trọng tâm, đào tạo 1-1, tái cấu trúc quy trình hành chính và ban hành chính sách số.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Clustering;
