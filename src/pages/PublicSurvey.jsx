import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { GraduationCap, CheckCircle2, ArrowRight, ArrowLeft, Send, AlertTriangle, Clock, Building2, User, School, Briefcase, Users } from 'lucide-react';
import { responsesAPI, surveysAPI } from '../services/api';
import { SkeletonPublicSurvey } from '../components/Skeleton';

// THANG ĐO CHUẨN LIKERT 5 MỨC ĐỘ
const LIKERT_5_OPTIONS = [
  { value: 1, label: 'Hoàn toàn không đồng ý' },
  { value: 2, label: 'Không đồng ý' },
  { value: 3, label: 'Trung lập / Phân vân' },
  { value: 4, label: 'Đồng ý' },
  { value: 5, label: 'Hoàn toàn đồng ý' },
];

const LIKERT_7_OPTIONS = [
  { value: 1, label: 'Rất không đồng ý' },
  { value: 2, label: 'Không đồng ý' },
  { value: 3, label: 'Hơi không đồng ý' },
  { value: 4, label: 'Trung lập / Phân vân' },
  { value: 5, label: 'Hơi đồng ý' },
  { value: 6, label: 'Đồng ý' },
  { value: 7, label: 'Rất đồng ý' },
];

const DEFAULT_QUESTIONS = [
  { code: 'STR1', text: 'Nhà trường đã xây dựng chiến lược phát triển tổng thể, tích hợp rõ ràng các xu hướng số hóa và chuyển đổi giáo dục đại học.', variable: 'STR' },
  { code: 'LEA1', text: 'Lãnh đạo thể hiện tầm nhìn và năng lực điều hành mạnh mẽ, đồng hành cùng các đơn vị trong đổi mới.', variable: 'LEA' },
  { code: 'CAP1', text: 'Cơ cấu tổ chức và quy trình phối hợp công việc diễn ra mượt mà, thích ứng nhanh với các yêu cầu mới.', variable: 'CAP' },
  { code: 'RES1', text: 'Trang thiết bị, hạ tầng CNTT và đường truyền mạng được đầu tư đầy đủ, hoạt động ổn định.', variable: 'RES' },
  { code: 'SER1', text: 'Chất lượng phục vụ và hỗ trợ người học, giảng viên luôn được duy trì ở mức cao và chuyên nghiệp.', variable: 'SER' },
  { code: 'REA1', text: 'Toàn hệ thống đạt mức độ sẵn sàng cao trong việc thay đổi thói quen để thích ứng với yêu cầu chuyển đổi.', variable: 'REA' }
];

const isDemographic = (q) => q.section === 'demographics' || q.section === 'info';
const isLikert = (q) => !q.type || q.type === 'likert';
const isQualitative = (q) => (q.type === 'textarea' || q.type === 'text') && !isDemographic(q);

const PublicSurvey = () => {
  const { id } = useParams();
  const [surveyInfo, setSurveyInfo] = useState(null);
  const [questions, setQuestions] = useState(DEFAULT_QUESTIONS);
  const [publicSurveysList, setPublicSurveysList] = useState([]);
  const [notFoundError, setNotFoundError] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [startTime] = useState(Date.now());

  // Form State định danh người tham gia & trường/đơn vị
  const [participant, setParticipant] = useState({
    name: '',
    institution: '',
    unit: '',
    role: '',
    gender: 'Không nêu'
  });

  const [answers, setAnswers] = useState({});

  useEffect(() => {
    const setupSurveyData = (data) => {
      setSurveyInfo(data);
      setParticipant(prev => ({
        ...prev,
        institution: data.institution || 'Trường Đại học'
      }));

      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        const initAnswers = {};
        data.questions.forEach((q, idx) => {
          const key = q.code || `q_${idx}`;
          if (q.type === 'textarea' || q.type === 'text' || q.type === 'choice') {
            initAnswers[key] = '';
          }
        });
        setAnswers(initAnswers);
      } else {
        setQuestions(DEFAULT_QUESTIONS);
      }
    };

    const fetchSurvey = async () => {
      try {
        setFetching(true);
        setNotFoundError(null);

        // Trường hợp người dùng vào /survey (không có ID cụ thể)
        if (!id) {
          try {
            const list = await surveysAPI.getPublicSurveys();
            setPublicSurveysList(list || []);
            if (list && list.length === 1) {
              const fullSurvey = await surveysAPI.getById(list[0].id);
              setupSurveyData(fullSurvey);
            } else if (!list || list.length === 0) {
              setNotFoundError('Hiện tại hệ thống chưa có đợt khảo sát nào đang mở.');
            }
          } catch (listErr) {
            console.error('Error fetching public surveys:', listErr);
            setNotFoundError('Không thể tải danh sách khảo sát đang mở. Vui lòng thử lại sau.');
          }
          return;
        }

        // Trường hợp người dùng vào /survey/:id
        const data = await surveysAPI.getById(id);
        setupSurveyData(data);
      } catch (err) {
        console.error('Survey not found:', err);
        setNotFoundError(`Khảo sát mã #${id} không tồn tại hoặc đã bị gỡ bỏ khỏi hệ thống.`);
        setSurveyInfo(null);
      } finally {
        setFetching(false);
      }
    };

    fetchSurvey();
  }, [id]);

  const isPreview = new URLSearchParams(window.location.search).get('preview') === 'true';

  const scaleOptions = surveyInfo?.scale === 'Likert 7' ? LIKERT_7_OPTIONS : LIKERT_5_OPTIONS;

  const demographicQuestions = questions.filter(isDemographic);
  const likertQuestions = questions.filter(isLikert);
  const qualitativeQuestions = questions.filter(isQualitative);

  const answeredCount = likertQuestions.filter(q => {
    const ans = answers[q.code];
    return ans !== undefined && ans !== null && ans !== '';
  }).length;
  const progressPercent = step === 1 ? 30 : Math.min(100, Math.round(30 + (answeredCount / Math.max(1, likertQuestions.length)) * 70));

  // Gợi ý danh sách vai trò / chức danh theo bộ khảo sát
  const getRoleOptions = () => {
    switch (surveyInfo?.audience) {
      case 'leadership':
        return [
          'Chủ tịch / Phó Chủ tịch Hội đồng trường',
          'Hiệu trưởng / Phó Hiệu trưởng',
          'Thành viên Hội đồng trường / Đảng ủy viên',
          'Khác'
        ];
      case 'dept_head':
        return [
          'Trưởng Khoa / Viện trưởng đào tạo',
          'Phó Trưởng Khoa / Phó Viện trưởng',
          'Trưởng Phòng / Ban / Giám đốc Trung tâm',
          'Phó Trưởng Phòng / Ban / Phó GĐ Trung tâm',
          'Khác'
        ];
      case 'lecturer_staff':
        return [
          'Giảng viên trực tiếp giảng dạy',
          'Giáo viên / Trợ giảng',
          'Chuyên viên / Nhân viên hành chính nghiệp vụ',
          'Nghiên cứu viên',
          'Khác'
        ];
      case 'student_alumni':
        return [
          'Sinh viên đang theo học (Năm 1 - 2)',
          'Sinh viên đang theo học (Năm 3 - 4)',
          'Học viên Sau đại học (Thạc sĩ, Nghiên cứu sinh)',
          'Cựu người học / Cựu sinh viên'
        ];
      default:
        return [
          'Ban Giám hiệu / Lãnh đạo',
          'Trưởng / Phó đơn vị',
          'Giảng viên / Cán bộ nhân viên',
          'Sinh viên / Người học'
        ];
    }
  };

  const handleNextStep = (e) => {
    e.preventDefault();

    if (!participant.institution.trim()) {
      alert('Vui lòng nhập tên Trường / Đơn vị thực hiện khảo sát.');
      return;
    }

    if (demographicQuestions.length > 0) {
      const missing = demographicQuestions.find(q => !answers[q.code]);
      if (missing) {
        alert('Vui lòng chọn đầy đủ các thông tin khảo sát chung.');
        return;
      }
      const mapped = { ...participant };
      demographicQuestions.forEach((q) => {
        if (q.mapsTo === 'role') mapped.role = answers[q.code];
        if (q.mapsTo === 'unit') mapped.unit = answers[q.code];
        if (q.mapsTo === 'gender') mapped.gender = answers[q.code];
      });
      if (!mapped.role) mapped.role = answers[demographicQuestions[0].code] || 'Người tham gia';
      if (!mapped.unit) mapped.unit = participant.unit || 'Đơn vị trực thuộc';
      setParticipant(mapped);
    } else {
      if (!participant.role || !participant.unit) {
        alert('Vui lòng chọn chức vụ và nhập đơn vị / khoa phòng công tác.');
        return;
      }
    }

    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    // 1. Kiểm tra Likert còn câu nào chưa chọn điểm không
    const missing = likertQuestions.find(q => {
      const a = answers[q.code];
      return a === undefined || a === null || a === '';
    });
    if (missing) {
      alert(`Bạn chưa đánh giá cho câu hỏi [${missing.code}]. Vui lòng chọn điểm đánh giá đầy đủ trước khi nộp phiếu.`);
      return;
    }

    setLoading(true);
    try {
      if (isPreview) {
        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setLoading(false);
        return;
      }

      const elapsedSeconds = Math.max(15, Math.round((Date.now() - startTime) / 1000));
      const minutes = Math.floor(elapsedSeconds / 60);
      const seconds = elapsedSeconds % 60;
      const timeTakenStr = `${minutes}p ${seconds}s`;

      const targetSurveyId = parseInt(surveyInfo?.id || id);
      if (!targetSurveyId) {
        throw new Error('Không xác định được mã khảo sát hợp lệ để nộp.');
      }

      await responsesAPI.create({
        survey_id: targetSurveyId,
        role: participant.role || 'Người tham gia',
        unit: participant.unit || 'Khoa / Đơn vị',
        institution: participant.institution || surveyInfo?.institution || 'Cơ sở giáo dục đại học',
        gender: participant.gender || 'Không nêu',
        time_taken: timeTakenStr,
        status: 'valid',
        answers: answers
      });

      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Lỗi khi gửi phản hồi:', err);
      alert(err.message || 'Đã có lỗi xảy ra khi nộp phiếu khảo sát. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <SkeletonPublicSurvey />;
  }

  // Khảo sát không tồn tại hoặc lỗi tải
  if (notFoundError) {
    return (
      <div style={{ animation: 'fadeIn 0.5s ease', textAlign: 'center', padding: '3rem 1rem' }}>
        <div className="card" style={{ maxWidth: '560px', margin: '0 auto', padding: '3rem 2rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#FEE2E2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <AlertTriangle size={36} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#1E293B' }}>
            Khảo sát không tồn tại hoặc đã bị gỡ bỏ
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.6' }}>
            {notFoundError}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/survey" className="btn btn-primary">
              Xem các khảo sát đang mở
            </Link>
            <Link to="/" className="btn btn-outline">
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Người dùng vào /survey (không ID) và có nhiều khảo sát active: Hiển thị danh sách lựa chọn
  if (!id && !surveyInfo && publicSurveysList.length > 0) {
    return (
      <div style={{ animation: 'fadeIn 0.5s ease', maxWidth: '840px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '52px', height: '52px', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '14px', marginBottom: '1rem' }}>
            <School size={30} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1E293B' }}>
            Cổng Khảo Sát Nghiên Cứu Giáo Dục
          </h1>
          <p style={{ color: 'var(--text-muted)', maxWidth: '560px', margin: '0 auto', fontSize: '0.95rem' }}>
            Vui lòng chọn bảng hỏi khảo sát phù hợp với đơn vị, trường hoặc đối tượng công tác của bạn để bắt đầu đánh giá
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {publicSurveysList.map((s) => (
            <div key={s.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: '700', padding: '0.2rem 0.6rem', backgroundColor: '#EFF6FF', color: '#1D4ED8', borderRadius: '4px' }}>
                    <Building2 size={13} />
                    {s.institution || 'Cơ sở giáo dục đại học'}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#10B981', backgroundColor: '#ECFDF5', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                    Đang mở
                  </span>
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '0.5rem', color: '#1E293B', lineHeight: '1.4' }}>
                  {s.title}
                </h3>
                {s.subtitle && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: '1.5' }}>
                    {s.subtitle}
                  </p>
                )}
                <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <span>Thang đo: <strong>{s.scale || 'Likert 5'}</strong></span>
                  <span>•</span>
                  <span>Quy mô: <strong>{s.questions_count || 14} câu</strong></span>
                </div>
              </div>
              <Link 
                to={`/survey/${s.id}`} 
                className="btn btn-primary" 
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.65rem' }}
              >
                Bắt đầu tham gia khảo sát
                <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Khảo sát đã đóng
  if (surveyInfo?.status === 'Closed') {
    return (
      <div style={{ animation: 'fadeIn 0.5s ease', textAlign: 'center', padding: '3rem 1rem' }}>
        <div className="card" style={{ maxWidth: '540px', margin: '0 auto', padding: '3rem 2rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <AlertTriangle size={36} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
            Khảo sát này hiện đã đóng
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.6' }}>
            Ban nghiên cứu đề tài <strong>{surveyInfo.title}</strong> tại <strong>{surveyInfo.institution}</strong> đã kết thúc đợt thu thập dữ liệu. Chân thành cảm ơn sự quan tâm của bạn!
          </p>
          <Link to="/" className="btn btn-primary">
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ animation: 'fadeIn 0.5s ease', textAlign: 'center', padding: '3rem 1rem' }}>
        <div className="card" style={{ maxWidth: '560px', margin: '0 auto', padding: '3rem 2rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#D1FAE5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <CheckCircle2 size={36} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
            Cảm ơn bạn đã hoàn thành phiếu khảo sát!
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
            Ý kiến đánh giá quý báu của bạn tại <strong>{participant.institution || surveyInfo?.institution}</strong> đã được ghi nhận trực tiếp vào cơ sở dữ liệu nghiên cứu khoa học của hệ thống.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <button 
              className="btn btn-primary"
              onClick={() => {
                setSubmitted(false);
                setStep(1);
              }}
            >
              Làm lại phiếu mới
            </button>
            <Link to="/" className="btn btn-outline">
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease', maxWidth: '820px', margin: '0 auto' }}>
      
      {/* HEADER KHẢO SÁT VỚI ĐỊNH DANH TRƯỜNG */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '12px', marginBottom: '0.75rem' }}>
          <School size={28} />
        </div>

        {/* BADGE TÊN TRƯỜNG ĐỊNH DANH */}
        <div style={{ marginBottom: '0.5rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.75rem', backgroundColor: '#F3E8FF', color: '#6B21A8', borderRadius: '6px', fontWeight: '700', fontSize: '0.85rem' }}>
            <Building2 size={14} />
            {surveyInfo?.institution || 'Cơ sở giáo dục đại học'}
          </span>
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1E293B' }}>
          {surveyInfo?.title || 'Khảo sát năng lực chuyển đổi giáo dục đại học'}
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '640px', margin: '0 auto', fontSize: '0.9rem', lineHeight: '1.5' }}>
          {surveyInfo?.subtitle || 'Phiếu thu thập dữ liệu nghiên cứu thực nghiệm chuẩn học thuật'}
        </p>
        <p style={{ color: 'var(--primary)', fontSize: '0.8rem', marginTop: '0.4rem', fontWeight: '600' }}>
          Thang đo: {surveyInfo?.scale || 'Likert 5'} • {likertQuestions.length} câu Likert • {qualitativeQuestions.length} câu mở
        </p>
      </div>

      {/* BANNER PREVIEW MODE */}
      {isPreview && (
        <div style={{ backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
          <span style={{ fontWeight: '600' }}>
            ⚠ Chế độ Xem trước (Preview Mode): Bạn đang kiểm tra thử nghiệm biểu mẫu. Dữ liệu khi gửi sẽ không được lưu vào cơ sở dữ liệu thật.
          </span>
          <span style={{ backgroundColor: '#F59E0B', color: 'white', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700' }}>
            TEST PREVIEW
          </span>
        </div>
      )}

      {/* THANH TIẾN ĐỘ HOÀN THÀNH */}
      <div style={{ backgroundColor: 'white', padding: '0.875rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '1.5rem', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
          <span>Bước {step} / 2: {step === 1 ? 'Thông tin chung & Định danh đơn vị' : `Nội dung khảo sát (${answeredCount}/${likertQuestions.length} câu Likert)`}</span>
          <span style={{ color: 'var(--primary)', fontWeight: '700' }}>{progressPercent}% Hoàn thành</span>
        </div>
        <div style={{ width: '100%', height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, #3B82F6, #10B981)', borderRadius: '4px', transition: 'width 0.3s ease' }}></div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* BƯỚC 1: THÔNG TIN CHUNG & ĐỊNH DANH TRƯỜNG / ĐƠN VỊ */}
      {/* ========================================================= */}
      {step === 1 ? (
        <form onSubmit={handleNextStep} className="card" style={{ padding: '2rem' }}>
          <div style={{ marginBottom: '1.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Phần I: Thông tin chung &amp; Định danh đơn vị</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Thông tin này giúp phân loại và xử lý dữ liệu theo từng trường/đơn vị cụ thể. Toàn bộ thông tin được bảo mật và vô danh.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
            
            {/* TRƯỜNG / CƠ SỞ ĐÀO TẠO */}
            <div>
              <label className="form-label" style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Building2 size={16} color="var(--primary)" />
                Trường / Cơ sở giáo dục đại học *
              </label>
              <input 
                type="text" 
                className="input" 
                value={participant.institution}
                onChange={(e) => setParticipant({ ...participant, institution: e.target.value })}
                placeholder="VD: Trường Đại học Sư phạm Hà Nội"
                required
              />
            </div>

            {/* KHOA / PHÒNG / BAN */}
            <div className="survey-info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: '700' }}>Khoa / Phòng / Ban / Lớp công tác *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="VD: Khoa CNTT, Phòng Đào tạo..."
                  value={participant.unit}
                  onChange={(e) => setParticipant({ ...participant, unit: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: '700' }}>Chức vụ / Vị trí của bạn *</label>
                <select
                  className="input"
                  value={participant.role}
                  onChange={(e) => setParticipant({ ...participant, role: e.target.value })}
                  required
                >
                  <option value="">-- Chọn chức vụ / vị trí --</option>
                  {getRoleOptions().map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* CÂU HỎI NHÂN KHẨU HỌC BỔ SUNG NẾU CÓ */}
            {demographicQuestions.map((q) => (
              <div key={q.code} style={{ paddingTop: '0.5rem' }}>
                <label className="form-label" style={{ fontWeight: '600' }}>{q.text} *</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(q.options || []).map((opt) => (
                    <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.65rem 0.85rem', backgroundColor: answers[q.code] === opt ? '#EEF2FF' : '#F9FAFB', borderRadius: '8px', border: answers[q.code] === opt ? '2px solid var(--primary)' : '1px solid var(--border-color)', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name={q.code}
                        value={opt}
                        checked={answers[q.code] === opt}
                        onChange={() => setAnswers({ ...answers, [q.code]: opt })}
                      />
                      <span style={{ fontSize: '0.9rem', fontWeight: answers[q.code] === opt ? '600' : '400' }}>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            {/* GIỚI TÍNH */}
            <div style={{ paddingTop: '0.5rem' }}>
              <label className="form-label" style={{ fontWeight: '600' }}>Giới tính</label>
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                {['Nam', 'Nữ', 'Không nêu'].map((g) => (
                  <label key={g} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input 
                      type="radio" 
                      name="gender" 
                      value={g} 
                      checked={participant.gender === g}
                      onChange={() => setParticipant({ ...participant, gender: g })}
                    />
                    {g}
                  </label>
                ))}
              </div>
            </div>

          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.5rem' }}>
              Bắt đầu đánh giá
              <ArrowRight size={18} />
            </button>
          </div>
        </form>
      ) : (
        /* ========================================================= */
        /* BƯỚC 2: ĐÁNH GIÁ THANG ĐO LIKERT & CÂU HỎI MỞ */
        /* ========================================================= */
        <div className="card" style={{ padding: '2rem' }}>
          
          <div style={{ marginBottom: '1.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.35rem', color: '#1E293B' }}>
              Phần II: Nội dung đánh giá (Thang đo Likert 5 mức độ)
            </h2>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.8rem', color: '#475569', backgroundColor: '#F8FAFC', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              <span><strong>1:</strong> Hoàn toàn không đồng ý</span>
              <span>•</span>
              <span><strong>2:</strong> Không đồng ý</span>
              <span>•</span>
              <span style={{ color: '#2563EB', fontWeight: '700' }}><strong>3:</strong> Trung lập / Phân vân</span>
              <span>•</span>
              <span><strong>4:</strong> Đồng ý</span>
              <span>•</span>
              <span><strong>5:</strong> Hoàn toàn đồng ý</span>
            </div>
          </div>

          {/* DANH SÁCH CÂU HỎI LIKERT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
            {likertQuestions.map((q, idx) => {
              const qKey = q.code || `q_${idx}`;
              const selectedVal = answers[qKey];
              const showGroup = q.group && (idx === 0 || likertQuestions[idx - 1].group !== q.group);

              return (
                <div key={qKey}>
                  {showGroup && (
                    <div style={{ margin: '1rem 0 0.75rem', paddingBottom: '0.35rem', borderBottom: '2px solid #E2E8F0' }}>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--primary)', margin: 0 }}>
                        {q.group}
                      </h3>
                    </div>
                  )}

                  <div style={{ padding: '1.25rem', backgroundColor: '#F9FAFB', borderRadius: 'var(--radius-lg)', border: selectedVal ? '1px solid #BFDBFE' : '1px solid var(--border-color)', transition: 'border 0.2s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '0.2rem 0.5rem', backgroundColor: '#EEF2FF', color: 'var(--primary)', borderRadius: '4px' }}>
                        {q.code || `Câu ${idx + 1}`}
                      </span>
                      {q.variable && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', border: '1px solid var(--border-color)', padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: 'white' }}>
                          Biến {q.variable}
                        </span>
                      )}
                    </div>

                    <div style={{ fontWeight: '600', marginBottom: '1.25rem', fontSize: '0.95rem', lineHeight: '1.5', color: '#1E293B' }}>
                      {q.text}
                    </div>

                    {/* LƯỚI NÚT LIKERT 5 MỨC ĐỘ */}
                    <div className={`likert-scale likert-scale-${scaleOptions.length}`} style={{ display: 'grid', gridTemplateColumns: `repeat(${scaleOptions.length}, 1fr)`, gap: '0.5rem' }}>
                      {scaleOptions.map((opt) => {
                        const isChosen = selectedVal === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setAnswers({ ...answers, [qKey]: opt.value })}
                            className={`likert-btn ${isChosen ? 'selected' : ''}`}
                          >
                            <div style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.25rem' }}>{opt.value}</div>
                            <div style={{ lineHeight: '1.3' }}>{opt.label}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CÂU HỎI TỰ LUẬN ĐỊNH TÍNH MỞ */}
          {qualitativeQuestions.length > 0 && (
            <div style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: '2px dashed var(--border-color)' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.25rem', color: '#1E293B' }}>
                  Phần III: Câu hỏi mở (Định tính &amp; Đề xuất)
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Xin vui lòng chia sẻ thêm góc nhìn, khó khăn thực tế và giải pháp đề xuất đối với nhà trường.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                {qualitativeQuestions.map((q, idx) => {
                  const qKey = q.code || `txt_${idx}`;
                  const val = answers[qKey] || '';

                  return (
                    <div key={qKey} style={{ padding: '1.25rem', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '0.2rem 0.5rem', backgroundColor: '#FEF3C7', color: '#92400E', borderRadius: '4px' }}>
                          Câu mở {idx + 1}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{q.code}</span>
                      </div>
                      <div style={{ fontWeight: '600', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                        {q.text}
                      </div>
                      <textarea
                        className="input"
                        style={{ width: '100%', minHeight: '110px', resize: 'vertical', lineHeight: '1.6', fontFamily: 'inherit', fontSize: '0.9rem', padding: '0.75rem' }}
                        placeholder={q.placeholder || 'Vui lòng chia sẻ nhận xét chi tiết của bạn tại đây...'}
                        value={val}
                        onChange={(e) => setAnswers({ ...answers, [qKey]: e.target.value })}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* NÚT ĐIỀU HƯỚNG */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <button type="button" className="btn btn-outline" onClick={() => setStep(1)} disabled={loading}>
              <ArrowLeft size={18} />
              Quay lại thông tin chung
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.75rem' }}>
              {loading ? 'Đang lưu kết quả...' : (
                <>
                  <Send size={18} />
                  Nộp phiếu khảo sát
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicSurvey;
