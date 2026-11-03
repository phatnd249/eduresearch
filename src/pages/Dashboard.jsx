import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ClipboardList, MessageSquare, CheckCircle, BarChart2, Plus, ArrowRight, Compass, Sparkles, Filter, AlertTriangle, RefreshCw } from 'lucide-react';
import GaugeMeter from '../components/GaugeMeter';
import { Skeleton, SkeletonStatCard, SkeletonChart } from '../components/Skeleton';

const PALETTE = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1'];

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSurveyId, setSelectedSurveyId] = useState('all');

  const fetchDashboardStats = async (surveyId) => {
    try {
      setLoading(true);
      setError(null);
      const result = await dashboardAPI.getStats(surveyId);
      setData(result || {});
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err?.message || 'Không thể tải dữ liệu bảng điều khiển.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats(selectedSurveyId);
  }, [selectedSurveyId]);

  if (loading && !data) {
    return (
      <div style={{ animation: 'fadeIn 0.3s ease' }}>
        {/* Header Skeleton */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <Skeleton width="280px" height="2rem" style={{ marginBottom: '0.5rem' }} />
            <Skeleton width="420px" height="1rem" />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Skeleton width="220px" height="2.5rem" borderRadius="var(--radius-md)" />
            <Skeleton width="130px" height="2.5rem" borderRadius="var(--radius-md)" />
          </div>
        </div>

        {/* 4 Stat Cards Skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>

        {/* 2 Charts Skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <SkeletonChart height="300px" />
          <SkeletonChart height="300px" />
        </div>

        {/* Bottom Banner Skeleton */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ width: '60%' }}>
            <Skeleton width="50%" height="1.25rem" style={{ marginBottom: '0.5rem' }} />
            <Skeleton width="80%" height="0.875rem" />
          </div>
          <Skeleton width="140px" height="2.25rem" borderRadius="var(--radius-md)" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card" style={{ padding: '2.5rem', textAlign: 'center', margin: '2rem auto', maxWidth: '520px' }}>
        <div style={{ padding: '0.75rem', backgroundColor: '#FEE2E2', color: '#DC2626', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
          <AlertTriangle size={24} />
        </div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
          Không thể tải dữ liệu tổng quan
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
          {error || 'Đã có lỗi xảy ra trong quá trình truy xuất dữ liệu từ máy chủ.'}
        </p>
        <button className="btn btn-primary" onClick={() => fetchDashboardStats(selectedSurveyId)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto' }}>
          <RefreshCw size={16} />
          <span>Thử tải lại</span>
        </button>
      </div>
    );
  }

  const isAllSurveys = data?.isAllSurveys ?? (selectedSurveyId === 'all');
  const totalSurveys = data?.totalSurveys || 0;
  const totalResponses = data?.totalResponses || 0;
  const validResponses = data?.validResponses || 0;
  const validRatio = totalResponses > 0 ? Math.round((validResponses / totalResponses) * 100) : 0;
  const surveyTarget = data?.target || 100;
  const pilotTarget = data?.pilotTarget || Math.round(surveyTarget * 0.15);
  const targetPct = Math.min(100, Math.round((totalResponses / Math.max(1, surveyTarget)) * 100));
  const pilotPct = Math.min(100, Math.round(((Math.min(pilotTarget, totalResponses)) / Math.max(1, pilotTarget)) * 100));

  const surveysList = Array.isArray(data?.surveysList) ? data.surveysList : [];
  const areaData = Array.isArray(data?.areaData) && data.areaData.length > 0 ? data.areaData : [
    { name: 'Thứ 2', value: 0 }, { name: 'Thứ 3', value: 0 }, { name: 'Thứ 4', value: 0 },
    { name: 'Thứ 5', value: 0 }, { name: 'Thứ 6', value: 0 }, { name: 'Thứ 7', value: 0 }, { name: 'Chủ nhật', value: 0 }
  ];
  const pieData = Array.isArray(data?.pieData) ? data.pieData : [];
  const selectedSurvey = data?.selectedSurvey || null;
  const readinessIndex = typeof data?.readinessIndex === 'number' ? data.readinessIndex : 0;
  const userName = currentUser?.name || currentUser?.email || 'Quản trị viên';
  const canManage = currentUser?.role && currentUser.role !== 'viewer';

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Xin chào, <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{userName}</span> — Hệ thống quản trị và nghiên cứu khoa học EduResearch
          </p>
        </div>
        {canManage && (
          <div className="page-header-actions" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to="/clustering" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Compass size={16} />
              <span>Bản đồ phân cụm</span>
            </Link>
            <Link to="/surveys" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Plus size={18} />
              <span>Tạo khảo sát</span>
            </Link>
          </div>
        )}
      </div>

      {/* THANH CHỌN NHANH BẢNG HỎI KHẢO SÁT */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC' }}>
        <div className="dashboard-filter-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
            <div style={{ padding: '0.6rem', backgroundColor: '#EFF6FF', borderRadius: '8px', color: '#1E40AF', display: 'flex', flexShrink: 0 }}>
              <Filter size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                  Phạm vi quan sát dữ liệu bảng hỏi:
                </span>
                {selectedSurvey && (
                  <span style={{ fontSize: '0.75rem', backgroundColor: '#DBEAFE', color: '#1E40AF', padding: '0.1rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>
                    Khảo sát #{selectedSurvey.id}
                  </span>
                )}
              </div>
              <select 
                className="input"
                value={selectedSurveyId}
                onChange={(e) => setSelectedSurveyId(e.target.value)}
                style={{ width: '100%', backgroundColor: 'white', fontWeight: '600', fontSize: '0.925rem', cursor: 'pointer', border: '1px solid #94A3B8' }}
              >
                <option value="all">
                  📊 Tất cả bảng hỏi khảo sát (Tổng hợp toàn hệ thống — {totalSurveys} bộ)
                </option>
                {surveysList.map(s => (
                  <option key={s.id} value={s.id}>
                    Khảo sát #{s.id}: {s.title} ({s.responses_count || 0} phản hồi thu nhận)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Direct Shortcuts for Selected Survey */}
          <div className="dashboard-filter-shortcuts" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Link 
              to={selectedSurveyId !== 'all' ? `/analytics?surveyId=${selectedSurveyId}` : '/analytics'} 
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', padding: '0.55rem 0.9rem' }}
            >
              <Sparkles size={15} />
              <span>Phân tích 5 khâu APA 7 &rarr;</span>
            </Link>
            <Link 
              to={selectedSurveyId !== 'all' ? `/clustering?surveyId=${selectedSurveyId}` : '/clustering'} 
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', padding: '0.55rem 0.9rem' }}
            >
              <Compass size={15} />
              <span>Bản đồ phân cụm &rarr;</span>
            </Link>
          </div>

        </div>
      </div>

      {/* 4 THẺ THỐNG KÊ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <Link to="/surveys" className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', textDecoration: 'none', padding: '1.25rem' }}>
          <div style={{ padding: '0.85rem', backgroundColor: '#EFF6FF', borderRadius: 'var(--radius-lg)', color: '#3B82F6' }}>
            <ClipboardList size={28} />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>
              {isAllSurveys ? totalSurveys : `#${selectedSurvey?.id || selectedSurveyId}`}
            </div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {isAllSurveys ? 'Bảng hỏi đã tạo' : (selectedSurvey?.audience === 'leadership' ? 'Ban Giám hiệu & HĐT' : (selectedSurvey?.audience === 'student_alumni' ? 'Người học & Cựu SV' : (selectedSurvey?.audience === 'dept_head' ? 'Trưởng/Phó Khoa Phòng' : 'Giảng viên & Nhân viên')))}
            </div>
          </div>
        </Link>

        <Link to={isAllSurveys ? '/responses' : `/responses?surveyId=${selectedSurvey?.id || selectedSurveyId}`} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', textDecoration: 'none', padding: '1.25rem' }}>
          <div style={{ padding: '0.85rem', backgroundColor: '#F3E8FF', borderRadius: 'var(--radius-lg)', color: '#8B5CF6' }}>
            <MessageSquare size={28} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{totalResponses}</div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              {isAllSurveys ? 'Tổng phản hồi thu nhận' : 'Phản hồi bộ khảo sát này'}
            </div>
          </div>
        </Link>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem' }}>
          <div style={{ padding: '0.85rem', backgroundColor: '#D1FAE5', borderRadius: 'var(--radius-lg)', color: '#10B981' }}>
            <CheckCircle size={28} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{validResponses}</div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Mẫu sạch hợp lệ (~{validRatio}%)</div>
          </div>
        </div>

        <Link to={isAllSurveys ? '/analytics' : `/analytics?surveyId=${selectedSurvey?.id || selectedSurveyId}`} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', textDecoration: 'none', padding: '1.25rem' }}>
          <div style={{ padding: '0.85rem', backgroundColor: '#FEF3C7', borderRadius: 'var(--radius-lg)', color: '#F59E0B' }}>
            <BarChart2 size={28} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>5 Khâu</div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Phân tích chuẩn APA 7</div>
          </div>
        </Link>
      </div>

      {/* SẢN PHẨM 1: ĐỒNG HỒ ĐO GAUGE METER & BIỂU ĐỒ XU HƯỚNG */}
      <div className="dashboard-gauge-row" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '1.5rem', marginBottom: '1.75rem' }}>
        
        {/* ĐỒNG HỒ ĐO GAUGE METER */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <GaugeMeter 
            score={readinessIndex || 75.0} 
            title={isAllSurveys ? 'Chỉ số Sẵn sàng Chuyển đổi (AT Tổng thể)' : `Chỉ số Sẵn sàng AT (Khảo sát #${selectedSurvey?.id || selectedSurveyId})`}
          />
          <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
            <Link 
              to={isAllSurveys ? '/analytics' : `/analytics?surveyId=${selectedSurvey?.id || selectedSurveyId}`} 
              style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}
            >
              Xem phân tích chi tiết 5 chiều cạnh &rarr;
            </Link>
          </div>
        </div>

        {/* BIỂU ĐỒ XU HƯỚNG THU MẪU */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', margin: 0 }}>Xu hướng thu thập dữ liệu</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                {isAllSurveys ? 'Số lượng phiếu thực tế toàn hệ thống theo thời gian thực' : `Tiến độ thu nhận của ${selectedSurvey?.title?.split('—')[0] || ''}`}
              </p>
            </div>
            <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>Thời gian thực</span>
          </div>
          <div style={{ height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} dx={-10} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* LƯỚI PHÂN BỐ ĐỐI TƯỢNG VÀ TIẾN ĐỘ THU MẪU */}
      <div className="dashboard-pie-row" style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.4fr) 1fr', gap: '1.5rem', marginBottom: '1.75rem' }}>
        
        {/* ĐỐI TƯỢNG KHẢO SÁT */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', margin: 0 }}>Cơ cấu đối tượng người tham gia</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                {isAllSurveys 
                  ? 'Phân bố theo các nhóm bảng hỏi khảo sát trong hệ thống' 
                  : `Phân bố theo chức danh (${selectedSurvey?.title?.split('—')[0]?.trim() || ''})`}
              </p>
            </div>
            <span style={{ fontSize: '0.75rem', backgroundColor: '#F1F5F9', color: '#475569', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: '600' }}>
              {pieData.length} nhóm đối tượng
            </span>
          </div>

          {pieData.length === 0 ? (
            <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Chưa có dữ liệu phản hồi cho phạm vi này
            </div>
          ) : (
            <div className="dashboard-donut-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 1fr) 1.4fr', gap: '1rem', alignItems: 'center' }}>
              {/* Donut Chart */}
              <div style={{ position: 'relative', height: '220px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val, name) => [`${val} phiếu (${totalResponses > 0 ? ((val / totalResponses) * 100).toFixed(1) : 0}%)`, name]}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Huy hiệu tổng số ở giữa tâm donut */}
                <div style={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text-main)', lineHeight: 1 }}>
                    {totalResponses}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    phản hồi
                  </div>
                </div>
              </div>

              {/* Danh sách nhãn đối tượng có thanh tiến độ */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '240px', overflowY: 'auto', paddingRight: '0.35rem' }}>
                {pieData.map((item, index) => {
                  const pct = totalResponses > 0 ? ((item.value / totalResponses) * 100).toFixed(1) : 0;
                  const color = PALETTE[index % PALETTE.length];
                  return (
                    <div key={index} style={{ padding: '0.45rem 0.65rem', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden' }}>
                          <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.fullName || item.name}>
                            {item.name}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color, flexShrink: 0 }}>
                          {item.value} ({pct}%)
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '4px', backgroundColor: '#E2E8F0', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: '2px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* TIẾN ĐỘ THU MẪU NGHIÊN CỨU */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', marginBottom: '1.25rem' }}>
            {isAllSurveys ? 'Tiến độ thu mẫu toàn hệ thống' : `Tiến độ thu mẫu (Mục tiêu: ${surveyTarget} phiếu)`}
          </h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: '500', fontSize: '0.875rem' }}>Mục tiêu chính thức</span>
              <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                {totalResponses}/{surveyTarget} ({targetPct}%)
              </span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-surface-hover)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${targetPct}%`, height: '100%', backgroundColor: 'var(--primary)', borderRadius: '4px' }}></div>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: '500', fontSize: '0.875rem' }}>Mục tiêu tối thiểu Pilot test</span>
              <span style={{ fontWeight: 'bold', color: 'var(--secondary)' }}>
                {Math.min(pilotTarget, totalResponses)}/{pilotTarget} ({pilotPct}%)
              </span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-surface-hover)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${pilotPct}%`, height: '100%', backgroundColor: 'var(--secondary)', borderRadius: '4px' }}></div>
            </div>
          </div>
          
          <div style={{ padding: '0.75rem', backgroundColor: '#F8FAFC', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            * Khuyến nghị APA: Cần tối thiểu 50-100 mẫu hợp lệ để các kiểm định Cronbach Alpha, EFA/KMO và hồi quy SEM đạt độ vững thống kê.
          </div>
        </div>

      </div>

      {/* THAO TÁC NHANH VÀO 4 KHÔNG GIAN SẢN PHẨM */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', marginBottom: '1rem' }}>Không gian nghiên cứu &amp; Kết xuất sản phẩm</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '1rem' }}>
          
          <Link to={isAllSurveys ? '/analytics' : `/analytics?surveyId=${selectedSurvey?.id || selectedSurveyId}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#EFF6FF', borderRadius: 'var(--radius-md)', border: '1px solid #BFDBFE', textDecoration: 'none', color: 'inherit' }}>
            <div>
              <div style={{ fontWeight: 'bold', color: '#1E40AF', fontSize: '0.9rem' }}>Phân tích 5 khâu APA 7</div>
              <div style={{ fontSize: '0.75rem', color: '#3B82F6' }}>Cronbach, EFA, Pearson, SEM &amp; SHAP</div>
            </div>
            <ArrowRight size={18} color="#1E40AF" />
          </Link>

          <Link to={isAllSurveys ? '/clustering' : `/clustering?surveyId=${selectedSurvey?.id || selectedSurveyId}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#ECFDF5', borderRadius: 'var(--radius-md)', border: '1px solid #A7F3D0', textDecoration: 'none', color: 'inherit' }}>
            <div>
              <div style={{ fontWeight: 'bold', color: '#065F46', fontSize: '0.9rem' }}>Bản đồ phân cụm (2D)</div>
              <div style={{ fontSize: '0.75rem', color: '#059669' }}>Scatter Plot &amp; Hồ sơ nhóm trường</div>
            </div>
            <ArrowRight size={18} color="#065F46" />
          </Link>

          <Link to="/surveys" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0', textDecoration: 'none', color: 'inherit' }}>
            <div>
              <div style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '0.9rem' }}>Quản lý Bảng hỏi</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>4 bộ thang đo chuẩn hóa giáo dục</div>
            </div>
            <ArrowRight size={18} color="var(--primary)" />
          </Link>

          <Link to={isAllSurveys ? '/responses' : `/responses?surveyId=${selectedSurvey?.id || selectedSurveyId}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0', textDecoration: 'none', color: 'inherit' }}>
            <div>
              <div style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '0.9rem' }}>Dữ liệu phản hồi</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quét Straightlining &amp; Speeders</div>
            </div>
            <ArrowRight size={18} color="var(--primary)" />
          </Link>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
