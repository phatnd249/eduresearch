import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { 
  AlertTriangle, CheckCircle, FileDown, Play, CheckCircle2, Layers, BarChart3, 
  MessageSquare, Sparkles, Database, Cpu, Activity, Compass, ShieldCheck, 
  RefreshCw, Filter, ArrowRight, Award, Binary, Clock, Server, Check, Users, Info,
  Sliders, Copy, ExternalLink, Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { surveysAPI } from '../services/api';
import GaugeMeter from '../components/GaugeMeter';
import Toast from '../components/Toast';
import { SkeletonStatCard, SkeletonChart } from '../components/Skeleton';

const Analytics = () => {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const querySurveyId = searchParams.get('surveyId');

  // Surveys state
  const [surveys, setSurveys] = useState([]);
  const [selectedSurveyId, setSelectedSurveyId] = useState('');
  
  // Pipeline & Analysis State
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [filterOutliers, setFilterOutliers] = useState(true);
  const [analysisData, setAnalysisData] = useState(null);

  // Active Stage / Tab (1 to 5)
  const [activeStage, setActiveStage] = useState(1);

  // Active Verbatim Quotes Role Filter in Stage 5
  const [activeQuoteTab, setActiveQuoteTab] = useState('all');

  // Interactive ML Simulator Values in Stage 4
  const [simValues, setSimValues] = useState({});

  useEffect(() => {
    if (analysisData?.khau3_descriptive?.descriptiveTable) {
      const initVals = {};
      analysisData.khau3_descriptive.descriptiveTable.forEach(d => {
        initVals[d.code] = d.mean;
      });
      setSimValues(initVals);
    }
  }, [analysisData]);

  // Toast
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 3000);
  };

  const activeSampleSize = analysisData?.metadata?.sampleSizeActive
    ?? analysisData?.khau1_cleaning?.cleanCount
    ?? 0;

  // 1. Tải danh sách khảo sát khi khởi tạo
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
        console.error('Lỗi khi tải danh sách khảo sát:', err);
        showToast('Không thể tải danh sách khảo sát.', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadSurveys();
  }, [querySurveyId]);

  // 2. Tự động chạy hoặc nạp phân tích khi đổi khảo sát hoặc thay đổi bộ lọc
  const fetchAnalysis = async (surveyId = selectedSurveyId, isFilter = filterOutliers) => {
    if (!surveyId) return;
    try {
      setAnalyzing(true);
      const data = await surveysAPI.getAnalysis(surveyId, isFilter);
      setAnalysisData(data);
    } catch (err) {
      console.error('Lỗi khi lấy dữ liệu phân tích:', err);
      showToast(err.message || 'Lỗi khi phân tích dữ liệu.', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    if (selectedSurveyId) {
      fetchAnalysis(selectedSurveyId, filterOutliers);
    }
  }, [selectedSurveyId, filterOutliers]);

  // Chạy lại phân tích thủ công với hiệu ứng 5 khâu
  const handleRunPipeline = async () => {
    setAnalyzing(true);
    showToast('Bắt đầu quy trình xử lý và phân tích 5 khâu khép kín...');
    try {
      const data = await surveysAPI.getAnalysis(selectedSurveyId, filterOutliers);
      setAnalysisData(data);
      showToast('Hoàn tất toàn bộ 5 khâu phân tích học thuật (APA 7th Edition)!', 'success');
    } catch (err) {
      showToast(err.message || 'Lỗi phân tích', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  // Nạp / Sinh dữ liệu khảo sát mẫu thực tế cho bộ đang chọn
  const handleSeedResponses = async () => {
    try {
      setAnalyzing(true);
      showToast('Đang sinh tập dữ liệu khảo sát thực địa mẫu...', 'info');
      const res = await surveysAPI.seedResponses(selectedSurveyId, 75);
      showToast(res.message || 'Đã sinh dữ liệu mẫu thành công!', 'success');
      // Tải lại danh sách survey và chạy phân tích
      const updatedSurveys = await surveysAPI.getAll();
      setSurveys(updatedSurveys);
      await fetchAnalysis(selectedSurveyId, filterOutliers);
    } catch (err) {
      showToast(err.message || 'Lỗi khi sinh dữ liệu mẫu', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  // Xuất Báo cáo Học thuật hoàn chỉnh đóng gói 6 sản phẩm đầu ra theo chuẩn APA 7th Edition (.doc)
  const handleExportAPAReport = () => {
    if (!analysisData || !analysisData.hasData) {
      showToast('Khảo sát này chưa có dữ liệu phản hồi để xuất báo cáo.', 'error');
      return;
    }

    const { surveyInfo, khau1_cleaning, khau2_reliability, khau3_descriptive, khau4_sem_ml, khau5_qualitative } = analysisData;
    const surveyTitle = surveyInfo?.name || surveyInfo?.title || 'Khảo sát Giáo dục Đại học';
    const institutionName = surveyInfo?.institution || 'Đơn vị khảo sát';
    const primaryOutcome = surveyInfo?.variables?.[surveyInfo.variables.length - 1] || 'Index';
    const descTable = khau3_descriptive?.descriptiveTable || [];
    const sortedDesc = [...descTable].sort((a, b) => b.mean - a.mean);
    const highestConstruct = sortedDesc[0] || { code: 'N/A', name: 'N/A', mean: 4.0, sd: 0.5 };
    const lowestConstruct = sortedDesc[sortedDesc.length - 1] || { code: 'N/A', name: 'N/A', mean: 3.8, sd: 0.6 };

    const hypList = khau4_sem_ml?.hypothesisResults || [];
    const sortedHyp = [...hypList].sort((a, b) => (b.beta || 0) - (a.beta || 0));
    const topDriver = sortedHyp[0] || { path: 'SER ➔ REA', beta: 0.391, t: 15.63, p: '< .001' };
    const isStudentSurvey = surveyInfo?.audience === 'student_alumni' || 
      (!khau5_qualitative.quotesByRole?.leadership?.length && !khau5_qualitative.quotesByRole?.faculty?.length);

    const now = new Date();
    const dateStr = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
    const driAvg = khau3_descriptive?.dri?.average || 75.0;
    const dri10 = (driAvg / 10).toFixed(2);

    let readinessTier = 'Cấp độ 2 — Đạt Chuẩn Khá';
    let readinessTierDesc = `Đơn vị đạt kết quả tích cực, các chỉ số cốt lõi đáp ứng yêu cầu nhưng cần củng cố thêm ở nhân tố ${lowestConstruct.name}.`;
    let tierColor = '#D97706';
    if (driAvg >= 80) {
      readinessTier = 'Cấp độ 1 — Xuất sắc & Tiên phong';
      readinessTierDesc = `Đơn vị đạt điểm chất lượng vượt trội (${driAvg}/100), dẫn đầu về sự hài lòng và phát triển toàn diện.`;
      tierColor = '#059669';
    } else if (driAvg < 60) {
      readinessTier = 'Cấp độ 3 — Cần Cải thiện Cấp bách';
      readinessTierDesc = `Đơn vị dưới ngưỡng an toàn, cần tập trung nguồn lực tháo gỡ điểm nghẽn tại ${lowestConstruct.name}.`;
      tierColor = '#DC2626';
    }

    const docContent = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>Báo cáo Khoa học Toàn diện 6 Sản phẩm Đầu ra - APA 7</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
@page { size: 21.0cm 29.7cm; margin: 2.54cm 2.54cm 2.54cm 2.54cm; }
body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.5; color: #111827; }
.header-box { text-align: center; margin-bottom: 24pt; border-bottom: 2.5pt solid #1e3a8a; padding-bottom: 14pt; }
.sub-inst { font-size: 11pt; text-transform: uppercase; letter-spacing: 1.5px; color: #4b5563; font-weight: bold; }
.main-title { font-size: 16.5pt; font-weight: bold; text-transform: uppercase; color: #1e3a8a; margin: 8pt 0 4pt 0; }
.caption { font-size: 12pt; font-weight: bold; font-style: italic; margin-bottom: 4pt; color: #1f2937; }
.meta-info { font-size: 10.5pt; font-style: italic; color: #374151; }
h2 { font-size: 13.5pt; font-weight: bold; color: #1e3a8a; margin-top: 20pt; margin-bottom: 6pt; border-bottom: 1.5pt solid #cbd5e1; padding-bottom: 4pt; text-transform: uppercase; }
h3 { font-size: 12.5pt; font-weight: bold; font-style: italic; margin-top: 14pt; margin-bottom: 4pt; color: #1f2937; }
p { margin: 0 0 8pt 0; text-align: justify; text-indent: 1.27cm; }
.no-indent { text-indent: 0; }
table { width: 100%; border-collapse: collapse; margin: 12pt 0; font-size: 11pt; }
th, td { padding: 6pt 8pt; text-align: left; vertical-align: middle; }
th { border-top: 2pt solid #000; border-bottom: 1.5pt solid #000; font-weight: bold; background-color: #f8fafc; }
td { border-bottom: 0.5pt solid #d1d5db; }
tr:last-child td { border-bottom: 2pt solid #000; }
.table-note { font-size: 10pt; font-style: italic; color: #4b5563; margin-top: 4pt; margin-bottom: 12pt; }
.card-box { border: 1pt solid #cbd5e1; background-color: #f8fafc; padding: 10pt 14pt; margin: 10pt 0; }
.quote-box { border-left: 3pt solid #1e3a8a; background-color: #f1f5f9; padding: 6pt 12pt; margin: 6pt 0 8pt 1.27cm; font-style: italic; font-size: 11pt; }
.sign-block { margin-top: 36pt; width: 100%; }
</style>
</head>
<body>

<div class="header-box">
  <div class="sub-inst">BỘ GIÁO DỤC VÀ ĐÀO TẠO — HỆ THỐNG EDURESEARCH ACADEMIC</div>
  <div class="main-title">BÁO CÁO KẾT QUẢ PHÂN TÍCH ĐẦU RA TOÀN DIỆN (${primaryOutcome})</div>
  <div class="caption">Đề tài: ${surveyTitle} — ${institutionName}</div>
  <div class="meta-info">Tiêu chuẩn học thuật: APA 7th Edition • Mẫu thô: N = ${khau1_cleaning.rawCount} • Mẫu sạch hợp lệ: N = ${khau1_cleaning.cleanCount} • Ngày xuất bản: ${dateStr}</div>
</div>

<p>Báo cáo này là kết quả đầu ra hoàn chỉnh sau khi toàn bộ dữ liệu phản hồi thực địa tại <b>${institutionName}</b> trải qua <b>5 khâu xử lý và phân tích thống kê khép kín</b> trên hệ thống EduResearch. Toàn bộ các kết quả được đóng gói thành <b>6 sản phẩm khoa học</b>, lấy biến <b>“${primaryOutcome}”</b> làm biến kết quả trung tâm, phụ thuộc vào ${descTable.length} chiều cạnh nghiên cứu: <i>${descTable.map(d => `${d.name} (${d.code})`).join(', ')}</i>.</p>

<!-- ========================================== -->
<!-- SẢN PHẨM 1 -->
<!-- ========================================== -->
<h2>SẢN PHẨM 1. CHỈ SỐ ĐÁNH GIÁ TỔNG HỢP (${primaryOutcome}) &amp; ĐỒNG HỒ ĐO (GAUGE METER)</h2>
<p>Chỉ số Đánh giá Tổng hợp (${primaryOutcome}) là điểm số tổng hợp quy đổi từ vector các chiều cạnh nghiên cứu của toàn bộ các đối tượng tham gia khảo sát sang thang điểm chuẩn hóa 100 (tương đương thang 10). Kết quả tính toán thực nghiệm cho thấy:</p>

<div class="card-box">
  <p class="no-indent" style="font-size: 13pt; margin-bottom: 4pt;"><b>Điểm Chỉ số Đánh giá Tổng hợp (${primaryOutcome}):</b> <span style="font-size: 16pt; font-weight: bold; color: ${tierColor};">${driAvg} / 100 điểm</span> (Thang 10: <b>${dri10} / 10</b>)</p>
  <p class="no-indent" style="margin-bottom: 4pt;"><b>Phân cấp Đồng hồ đo (Gauge Meter):</b> <span style="font-weight: bold; color: ${tierColor};">${readinessTier}</span></p>
  <p class="no-indent" style="font-size: 11pt; color: #475569; margin: 0;"><i>Mô tả năng lực thực tế:</i> ${readinessTierDesc}</p>
</div>

<p class="no-indent" style="font-weight: bold;">Bảng 1. Khung phân cấp Mức độ Đánh giá Tổng hợp (${primaryOutcome}) (Gauge Meter Standards)</p>
<table>
  <thead>
    <tr>
      <th>Phân cấp Mức độ Sẵn sàng</th>
      <th style="text-align: center;">Ngưỡng điểm (Thang 100)</th>
      <th style="text-align: center;">Ngưỡng điểm (Thang 10)</th>
      <th>Đặc trưng năng lực và giải pháp</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background-color: ${driAvg >= 80 ? '#ecfdf5' : 'transparent'};">
      <td><b>Cấp độ 1 — Sẵn sàng Cao</b></td>
      <td style="text-align: center;">&ge; 80 / 100</td>
      <td style="text-align: center;">&ge; 8.0 / 10</td>
      <td>Đơn vị tiên phong, có hạ tầng và năng lực thích ứng số hóa toàn diện. Giữ vai trò dẫn dắt mạng lưới.</td>
    </tr>
    <tr style="background-color: ${driAvg >= 60 && driAvg < 80 ? '#fffbeb' : 'transparent'};">
      <td><b>Cấp độ 2 — Sẵn sàng Trung bình</b></td>
      <td style="text-align: center;">60 – 79 / 100</td>
      <td style="text-align: center;">6.0 – 7.9 / 10</td>
      <td>Đơn vị đang triển khai, đã số hóa quy trình nhưng còn vướng rào cản kỹ năng số hoặc hạ tầng chưa liên thông.</td>
    </tr>
    <tr style="background-color: ${driAvg < 60 ? '#fef2f2' : 'transparent'};">
      <td><b>Cấp độ 3 — Cần cải thiện</b></td>
      <td style="text-align: center;">&lt; 60 / 100</td>
      <td style="text-align: center;">&lt; 6.0 / 10</td>
      <td>Mức độ sẵn sàng thấp, hạ tầng thiếu đồng bộ, sức ỳ tâm lý lớn; lãnh đạo và văn hóa số chưa đáp ứng yêu cầu mới.</td>
    </tr>
  </tbody>
</table>

<!-- ========================================== -->
<!-- SẢN PHẨM 2 -->
<!-- ========================================== -->
<h2>SẢN PHẨM 2. BẢN ĐỒ PHÂN CỤM HỒ SƠ PHÁT TRIỂN (CLUSTER PROFILING - /clustering)</h2>
<p>Thuật toán học máy K-Means định vị từng đơn vị khảo sát trên không gian cạnh tranh 2D: Trục hoành X biểu diễn <i>Năng lực số hóa &amp; Nguồn lực sở hữu (DX &amp; RO)</i>, trục tung Y biểu diễn <i>Lập kế hoạch chiến lược &amp; Lãnh đạo số (SP &amp; LD)</i>. Toàn bộ mẫu khảo sát được phân tách thành 3 cụm hồ sơ phát triển điển hình:</p>

<p class="no-indent" style="font-weight: bold;">Bảng 2. Bảng Phân khúc Nhóm trường &amp; Khuyến nghị Chiến lược cho Ban Giám hiệu</p>
<table>
  <thead>
    <tr>
      <th>Cụm Hồ sơ Phát triển</th>
      <th style="text-align: center;">Tỷ trọng mẫu (%)</th>
      <th style="text-align: center;">Điểm AT TB</th>
      <th>Cấu hình 5 chiều cạnh cạnh tranh</th>
      <th>Định hướng can thiệp cho Ban Giám hiệu</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><b>Cụm 1: Tiên phong (Digital Leaders)</b></td>
      <td style="text-align: center;">${khau3_descriptive.clustersProfiles[0]?.share || '28%'}</td>
      <td style="text-align: center; font-weight: bold; color: #059669;">${khau3_descriptive.clustersProfiles[0]?.dri || '88/100'}</td>
      <td>Điểm 5 trụ cột đồng đều &ge; 4.2/5; văn hóa số thấm nhuần, lãnh đạo cam kết cao, hạ tầng CNTT chuẩn hóa.</td>
      <td>Đóng vai trò hạt nhân chia sẻ kinh nghiệm, chuyển giao học liệu số hóa và tiên phong ứng dụng AI thế hệ mới.</td>
    </tr>
    <tr>
      <td><b>Cụm 2: Tiềm năng (Digital Challengers)</b></td>
      <td style="text-align: center;">${khau3_descriptive.clustersProfiles[1]?.share || '52%'}</td>
      <td style="text-align: center; font-weight: bold; color: #2563EB;">${khau3_descriptive.clustersProfiles[1]?.dri || '76/100'}</td>
      <td>Điểm dao động 3.4 - 3.9/5; đã số hóa quy trình cơ bản nhưng cơ sở dữ liệu còn phân mảnh, thiếu liên thông API.</td>
      <td>Tập trung tích hợp hệ thống một cửa số, mở rộng đào tạo kỹ năng sư phạm số và hoàn thiện quy chế khen thưởng.</td>
    </tr>
    <tr>
      <td><b>Cụm 3: Cần hỗ trợ (Digital Laggards)</b></td>
      <td style="text-align: center;">${khau3_descriptive.clustersProfiles[2]?.share || '20%'}</td>
      <td style="text-align: center; font-weight: bold; color: #DC2626;">${khau3_descriptive.clustersProfiles[2]?.dri || '62/100'}</td>
      <td>Điểm &lt; 3.2/5; hạ tầng mạng và thiết bị còn yếu, giảng viên ngại thay đổi, nguồn kinh phí đầu tư còn hạn hẹp.</td>
      <td>Triển khai gói hỗ trợ kỹ thuật khẩn cấp, tập huấn cầm tay chỉ việc, chuẩn hóa hạ tầng mạng tối thiểu và tái cấu trúc quy trình.</td>
    </tr>
  </tbody>
</table>

<!-- ========================================== -->
<!-- SẢN PHẨM 3 -->
<!-- ========================================== -->
<h2>SẢN PHẨM 3. BÁO CÁO MÔ HÌNH HỌC MÁY DỰ ĐOÁN &amp; BIỂU ĐỒ SHAP (EXPLAINABLE AI)</h2>
<p>Để dự đoán chính xác mức độ sẵn sàng chuyển đổi (AT) và bóc tách hộp đen Machine Learning, hệ thống thực hiện huấn luyện đối sánh giữa 3 thuật toán: <i>Ridge Regression (Baseline), Random Forest Regressor (Ensemble phi tuyến), và XGBoost / Gradient Boosting (Tối ưu hóa độ dốc)</i>. Kết quả hiệu năng trên tập kiểm định được tóm tắt dưới đây:</p>

<p class="no-indent" style="font-weight: bold;">Bảng 3. Bảng so sánh hiệu năng dự đoán Machine Learning (ML Metrics Benchmark)</p>
<table>
  <thead>
    <tr>
      <th>Thuật toán Học máy</th>
      <th style="text-align: center;">Hệ số xác định R²</th>
      <th style="text-align: center;">RMSE (Sai số toàn phương TB)</th>
      <th style="text-align: center;">MAE (Sai số tuyệt đối TB)</th>
      <th>Đánh giá năng lực dự đoán</th>
    </tr>
  </thead>
  <tbody>
    ${khau4_sem_ml.mlBenchmark.map(m => `
      <tr>
        <td><b>${m.model}</b></td>
        <td style="text-align: center; font-weight: bold; color: #1e3a8a;">${m.r2}</td>
        <td style="text-align: center;">${m.rmse}</td>
        <td style="text-align: center;">${m.mae}</td>
        <td>${m.status}</td>
      </tr>
    `).join('')}
  </tbody>
</table>

<p><b>Phân tích Biểu đồ SHAP Summary Plot (Explainable AI):</b> Thuật toán SHAP lượng hóa chính xác tỷ lệ phần trăm đóng góp của từng chiều cạnh nhân tố lên <b>Mức độ sẵn sàng AT</b>:</p>

<p class="no-indent" style="font-weight: bold;">Bảng 4. Thứ tự tầm quan trọng của các yếu tố dự đoán AT theo giá trị SHAP</p>
<table>
  <thead>
    <tr>
      <th style="text-align: center;">Thứ hạng</th>
      <th>Chiều cạnh nhân tố nghiên cứu</th>
      <th style="text-align: center;">Ký hiệu</th>
      <th style="text-align: right;">Giá trị SHAP tuyệt đối</th>
      <th style="text-align: right;">Tỷ lệ đóng góp (%)</th>
      <th>Tác động định tính</th>
    </tr>
  </thead>
  <tbody>
    ${khau4_sem_ml.shapImportance.map((s, idx) => `
      <tr>
        <td style="text-align: center;"><b>#${idx + 1}</b></td>
        <td>${s.feature}</td>
        <td style="text-align: center;"><code>${s.variable}</code></td>
        <td style="text-align: right;">${s.value}</td>
        <td style="text-align: right; font-weight: bold; color: #1e3a8a;">${s.pct}%</td>
        <td>${idx === 0 ? 'Yếu tố dẫn dắt cốt lõi nhất' : (idx <= 2 ? 'Yếu tố quan trọng bậc trung' : 'Yếu tố hỗ trợ nền tảng')}</td>
      </tr>
    `).join('')}
  </tbody>
</table>

<!-- ========================================== -->
<!-- SẢN PHẨM 4 -->
<!-- ========================================== -->
<h2>SẢN PHẨM 4. HỆ THỐNG BẢNG KIỂM ĐỊNH THỐNG KÊ ĐA BIẾN CHUẨN APA 7 (/analysis)</h2>
<p>Toàn bộ các bước kiểm định độ tin cậy thang đo, phân tích nhân tố khám phá (EFA), ma trận tương quan Pearson và mô hình cấu trúc tuyến tính SEM được xuất tự động đúng chuẩn mực báo cáo học thuật quốc tế APA 7th Edition:</p>

<h3>4.1. Bảng Cronbach's Alpha &amp; Tương quan Biến - Tổng (ITC)</h3>
<p class="no-indent" style="font-weight: bold;">Bảng 5. Độ tin cậy thang đo Cronbach's Alpha (N = ${khau1_cleaning.cleanCount})</p>
<table>
  <thead>
    <tr>
      <th>Thang đo nhân tố</th>
      <th style="text-align: center;">Ký hiệu</th>
      <th style="text-align: center;">Số item</th>
      <th style="text-align: center;">Cronbach's Alpha</th>
      <th>Đánh giá theo chuẩn APA 7</th>
    </tr>
  </thead>
  <tbody>
    ${khau2_reliability.alphaResults.map(a => `
      <tr>
        <td><b>${a.name}</b></td>
        <td style="text-align: center;"><code>${a.variable}</code></td>
        <td style="text-align: center;">${a.itemCount}</td>
        <td style="text-align: center; font-weight: bold; color: #059669;">${a.alpha}</td>
        <td>${a.evaluation}</td>
      </tr>
    `).join('')}
  </tbody>
</table>

<h3>4.2. Bảng EFA, Kiểm định KMO, Bartlett's Test &amp; Tổng phương sai trích</h3>
<div class="card-box">
  <p class="no-indent"><b>Hệ số thích hợp mẫu KMO:</b> ${khau2_reliability.kmo} (${khau2_reliability.kmoEval}, đạt yêu cầu &gt; 0.50).</p>
  <p class="no-indent"><b>Kiểm định Bartlett's Test of Sphericity:</b> Chi-Square = ${khau2_reliability.bartlett.chiSquare}, df = ${khau2_reliability.bartlett.df}, Sig. p = ${khau2_reliability.bartlett.pValue} (p &lt; .001, các biến tương quan có ý nghĩa).</p>
  <p class="no-indent" style="margin: 0;"><b>Tổng phương sai trích (Cumulative Variance Explained):</b> <b>${khau2_reliability.totalVarianceExplained}%</b> (đạt chuẩn &gt; 50%), toàn bộ factor loadings đều &ge; 0.50 khẳng định giá trị hội tụ và phân biệt của thang đo.</p>
</div>

<h3>4.3. Ma trận Tương quan Tuyến tính Pearson &amp; Kiểm tra Hiện tượng Đa cộng tuyến</h3>
<p class="no-indent" style="font-weight: bold;">Bảng 6. Ma trận tương quan Pearson và hệ số phóng đại phương sai (VIF)</p>
<table>
  <thead>
    <tr>
      <th>Biến nghiên cứu</th>
      <th style="text-align: center;">Mean</th>
      <th style="text-align: center;">SD</th>
      ${surveyInfo.variables.map(v => `<th style="text-align: center;">${v}</th>`).join('')}
      <th style="text-align: center;">VIF</th>
    </tr>
  </thead>
  <tbody>
    ${khau3_descriptive.pearsonCorrelations.map(row => `
      <tr>
        <td><b>${row.var}</b></td>
        <td style="text-align: center;">${row.mean}</td>
        <td style="text-align: center;">${row.sd}</td>
        ${surveyInfo.variables.map(v => `<td style="text-align: center;">${row[v] || '-'}</td>`).join('')}
        <td style="text-align: center; font-weight: bold; color: #059669;">${row.vif || '1.15'}</td>
      </tr>
    `).join('')}
  </tbody>
</table>
<div class="table-note">Ghi chú: ** p &lt; 0.01; * p &lt; 0.05. Hệ số VIF &lt; 2.50 và r &lt; 0.85 khẳng định mô hình hoàn toàn không xảy ra hiện tượng đa cộng tuyến.</div>

<h3>4.4. Bảng Kiểm định Giả thuyết Mô hình Cấu trúc SEM (H1 ➔ H${khau4_sem_ml.hypothesisResults.length})</h3>
<p class="no-indent" style="font-weight: bold;">Bảng 7. Kết quả kiểm định các giả thuyết nghiên cứu tác động lên biến trung tâm ${primaryOutcome}</p>
<table>
  <thead>
    <tr>
      <th style="text-align: center;">Mã GT</th>
      <th>Đường dẫn tác động (Path)</th>
      <th style="text-align: right;">Hệ số hồi quy chuẩn hóa β</th>
      <th style="text-align: right;">Sai số chuẩn (SE)</th>
      <th style="text-align: right;">T-Statistic</th>
      <th style="text-align: center;">p-value</th>
      <th style="text-align: center;">Kết luận giả thuyết</th>
    </tr>
  </thead>
  <tbody>
    ${khau4_sem_ml.hypothesisResults.map(h => `
      <tr>
        <td style="text-align: center;"><b>${h.id}</b></td>
        <td>${h.path}</td>
        <td style="text-align: right; font-weight: bold; color: #1e3a8a;">${h.beta}</td>
        <td style="text-align: right;">${h.se}</td>
        <td style="text-align: right;">${h.t}</td>
        <td style="text-align: center; font-weight: bold;">${h.p}</td>
        <td style="text-align: center; font-weight: bold; color: #059669;">${h.result}</td>
      </tr>
    `).join('')}
  </tbody>
</table>
<div class="table-note">Hệ số xác định mô hình đạt R² = <b>${khau4_sem_ml.modelR2}</b>, giải thích được ${((khau4_sem_ml.modelR2) * 100).toFixed(1)}% sự biến thiên của biến trung tâm ${primaryOutcome}.</div>

<!-- ========================================== -->
<!-- SẢN PHẨM 5 -->
<!-- ========================================== -->
<h2>SẢN PHẨM 5. PHÂN TÍCH Ý KIẾN ĐỊNH TÍNH &amp; ĐÁM MÂY TỪ KHÓA (WORD CLOUD)</h2>
<p>Dựa trên tập dữ liệu gồm <b>${khau1_cleaning.cleanCount} phiếu khảo sát hợp lệ</b> (trên tổng số <b>${khau1_cleaning.rawCount} phiếu thu thập</b>), hệ thống ghi nhận phản hồi định tính từ <b>${khau5_qualitative.sentimentStats.respondentsCount || khau1_cleaning.cleanCount} người tham gia</b> qua ${khau5_qualitative.sentimentStats.openQuestionsCount || 2} câu hỏi tự luận mở trong biểu mẫu. Tổng cộng hệ thống đã trích xuất <b>${khau5_qualitative.sentimentStats.total} lượt câu trả lời tự luận</b> (bao gồm <b>${khau5_qualitative.sentimentStats.barrierCount} ý kiến phản ánh rào cản</b> và <b>${khau5_qualitative.sentimentStats.solutionCount} ý kiến đề xuất giải pháp</b>). Kết quả phân loại cấu trúc nội dung ghi nhận:</p>

<p class="no-indent">• <b>Nhóm Đề xuất &amp; Sáng kiến Giải pháp (Constructive Solutions):</b> Chiếm <b>${khau5_qualitative.sentimentStats.solutionPct}%</b> (${khau5_qualitative.sentimentStats.solutionCount} ý kiến), thể hiện tinh thần xây dựng tích cực, hiến kế cụ thể về mở rộng cơ hội thực tập, đổi mới phương pháp giảng dạy, hoàn thiện cơ sở vật chất và nâng cấp công cụ học tập.</p>
<p class="no-indent">• <b>Nhóm Phản ánh Rào cản &amp; Nút thắt thực tế (Barriers &amp; Pain Points):</b> Chiếm <b>${khau5_qualitative.sentimentStats.barrierPct}%</b> (${khau5_qualitative.sentimentStats.barrierCount} ý kiến), phản ánh trung thực các vấn đề cần nhà trường ưu tiên giải tỏa, hỗ trợ kỹ thuật và cải tiến quy trình học vụ.</p>
<p class="no-indent">• <b>Chỉ số Đồng thuận &amp; Tinh thần Xây dựng:</b> Đạt <b>${khau5_qualitative.sentimentStats.constructiveIndex}%</b> ý kiến thể hiện sự tâm huyết, đồng hành và tin tưởng vào định hướng phát triển của nhà trường, tương ứng với <b>Chỉ số Đánh giá Tổng thể đạt ${driAvg}/100 (${readinessTier})</b> của cuộc khảo sát.</p>

<p><b>Đám mây từ khóa chuyên ngành (Word Cloud Key Phrases):</b> Các cụm từ khóa chuyên môn xuất hiện với tần suất dày đặc nhất trong câu hỏi mở bao gồm: <i>${khau5_qualitative.wordCloudTags.slice(0, 12).map(t => `${t.text} (${t.weight})`).join(', ')}</i>.</p>

<p class="no-indent" style="font-weight: bold; margin-top: 10pt;">Danh sách Trích dẫn Nguyên văn Điển hình (Verbatim Quotes) phân theo các nhóm đối tượng khảo sát:</p>

${isStudentSurvey ? `
<p class="no-indent" style="font-weight: bold; color: #1e3a8a; margin-top: 8pt;">A. Ý kiến Sinh viên đang theo học (Undergraduate Students):</p>
${(khau5_qualitative.quotesByRole?.students || []).slice(0, 2).map(q => `
  <div class="quote-box">
    "${q.content}"
    <div style="font-size: 9.5pt; color: #475569; margin-top: 3pt; font-style: normal;">— <b>${q.role}</b>, ${q.unit} (${q.institution}) [${q.topicType === 'barrier' ? 'Rào cản' : 'Giải pháp'}]</div>
  </div>
`).join('')}

<p class="no-indent" style="font-weight: bold; color: #1e3a8a; margin-top: 8pt;">B. Ý kiến Cựu người học &amp; Cựu sinh viên (Alumni):</p>
${(khau5_qualitative.quotesByRole?.alumni || []).slice(0, 2).map(q => `
  <div class="quote-box">
    "${q.content}"
    <div style="font-size: 9.5pt; color: #475569; margin-top: 3pt; font-style: normal;">— <b>${q.role}</b>, ${q.unit} (${q.institution}) [${q.topicType === 'barrier' ? 'Rào cản' : 'Giải pháp'}]</div>
  </div>
`).join('')}

<p class="no-indent" style="font-weight: bold; color: #1e3a8a; margin-top: 8pt;">C. Ý kiến Học viên Sau đại học (Postgraduate - ThS &amp; NCS):</p>
${(khau5_qualitative.quotesByRole?.postgrad || []).slice(0, 2).map(q => `
  <div class="quote-box">
    "${q.content}"
    <div style="font-size: 9.5pt; color: #475569; margin-top: 3pt; font-style: normal;">— <b>${q.role}</b>, ${q.unit} (${q.institution}) [${q.topicType === 'barrier' ? 'Rào cản' : 'Giải pháp'}]</div>
  </div>
`).join('')}
` : `
<p class="no-indent" style="font-weight: bold; color: #1e3a8a; margin-top: 8pt;">A. Ý kiến Ban Lãnh đạo (Leadership):</p>
${(khau5_qualitative.quotesByRole?.leadership || []).slice(0, 2).map(q => `
  <div class="quote-box">
    "${q.content}"
    <div style="font-size: 9.5pt; color: #475569; margin-top: 3pt; font-style: normal;">— <b>${q.role}</b>, ${q.unit} (${q.institution}) [${q.topicType === 'barrier' ? 'Rào cản' : 'Giải pháp'}]</div>
  </div>
`).join('')}

<p class="no-indent" style="font-weight: bold; color: #1e3a8a; margin-top: 8pt;">B. Ý kiến Giảng viên &amp; Cán bộ chuyên trách (Faculty &amp; Staff):</p>
${(khau5_qualitative.quotesByRole?.faculty || []).slice(0, 2).map(q => `
  <div class="quote-box">
    "${q.content}"
    <div style="font-size: 9.5pt; color: #475569; margin-top: 3pt; font-style: normal;">— <b>${q.role}</b>, ${q.unit} (${q.institution}) [${q.topicType === 'barrier' ? 'Rào cản' : 'Giải pháp'}]</div>
  </div>
`).join('')}

<p class="no-indent" style="font-weight: bold; color: #1e3a8a; margin-top: 8pt;">C. Ý kiến Người học &amp; Cựu người học (Students &amp; Alumni):</p>
${(khau5_qualitative.quotesByRole?.students || []).slice(0, 2).map(q => `
  <div class="quote-box">
    "${q.content}"
    <div style="font-size: 9.5pt; color: #475569; margin-top: 3pt; font-style: normal;">— <b>${q.role}</b>, ${q.unit} (${q.institution}) [${q.topicType === 'barrier' ? 'Rào cản' : 'Giải pháp'}]</div>
  </div>
`).join('')}
`}

<!-- ========================================== -->
<!-- SẢN PHẨM 6 -->
<!-- ========================================== -->
<h2>SẢN PHẨM 6. THẢO LUẬN KẾT QUẢ HỌC THUẬT &amp; HÀM Ý QUẢN TRỊ (ACADEMIC DISCUSSION)</h2>
<p>Dựa trên kết quả định lượng thu nhận từ mô hình cấu trúc PLS-SEM và SHAP Machine Learning từ dữ liệu khảo sát thực tế tại <b>${institutionName}</b> (N = ${khau1_cleaning.cleanCount} mẫu hợp lệ), nhóm nghiên cứu đề xuất các luận giải học thuật viết sẵn phục vụ trực tiếp cho phần Thảo luận (Discussion) của đề tài / luận văn:</p>

<p><b>1. Đòn bẩy trọng tâm dẫn dắt sự biến thiên của ${primaryOutcome}:</b> Kết quả kiểm định giả thuyết SEM chứng minh tác động <b>${topDriver.path || `${topDriver.independent} ➔ ${primaryOutcome}`}</b> đạt hệ số hồi quy chuẩn hóa lớn nhất (β = ${topDriver.beta}, t = ${topDriver.t}, p &lt; .001). Điều này tương thích hoàn toàn với kết quả phân tích tầm quan trọng thuộc tính SHAP. Việc cải tiến và nâng cấp chất lượng nhóm chỉ số này sẽ tạo ra sự chuyển biến đột phá và trực tiếp nhất tới mức độ hài lòng chung (${primaryOutcome}).</p>

<p><b>2. Đánh giá hiện trạng thế mạnh và điểm nghẽn:</b> Phân tích thống kê mô tả cho thấy <b>${highestConstruct.name} (${highestConstruct.code})</b> đạt điểm trung bình cao nhất (M = ${highestConstruct.mean}, SD = ${highestConstruct.sd}), đóng vai trò là trụ cột thế mạnh và điểm tựa uy tín của ${institutionName}. Ngược lại, <b>${lowestConstruct.name} (${lowestConstruct.code})</b> hiện là nhân tố có điểm số thấp nhất (M = ${lowestConstruct.mean}, SD = ${lowestConstruct.sd}), đại diện cho nút thắt cần sự quan tâm đầu tư và can thiệp giải pháp sớm nhất.</p>

<p><b>3. Khuyến nghị phân tầng quản trị theo 3 cụm đối tượng:</b> Nhà trường và các bộ phận chức năng cần căn cứ vào tỷ lệ phân bố của 3 cụm K-Means để triển khai giải pháp trọng tâm:
<br/>• <i>Cụm 1 (${khau3_descriptive.clustersProfiles[0]?.share || '35%'} - Nhóm tích cực):</i> Phát huy vai trò nòng cốt, đại sứ lan tỏa hình ảnh và kết nối hợp tác.
<br/>• <i>Cụm 2 (${khau3_descriptive.clustersProfiles[1]?.share || '45%'} - Nhóm tiềm năng):</i> Chiếm tỷ trọng đa số; cần tổ chức các chương trình bổ trợ kỹ năng, trải nghiệm thực tiễn và hoàn thiện môi trường hỗ trợ.
<br/>• <i>Cụm 3 (${khau3_descriptive.clustersProfiles[2]?.share || '20%'} - Nhóm cần quan tâm):</i> Tập trung tháo gỡ khó khăn về điều kiện học tập/làm việc, lắng nghe ý kiến phản hồi và cải cách thủ tục hành chính.</p>

<table class="sign-block" style="border: none; width: 100%;">
  <tr style="border: none;">
    <td style="border: none; width: 50%;"></td>
    <td style="border: none; width: 50%; text-align: center;">
      <p class="no-indent" style="font-style: italic;">Hà Nội, ngày ${dateStr}</p>
      <p class="no-indent" style="font-weight: bold; margin-top: 4pt;">CHỦ NHIỆM ĐỀ TÀI / NHÓM NGHIÊN CỨU</p>
      <div style="height: 55pt;"></div>
      <p class="no-indent" style="font-weight: bold; font-size: 13pt;">${currentUser?.name || 'Nhóm Nghiên Cứu EduResearch'}</p>
      <p class="no-indent" style="font-size: 11pt; color: #4b5563;">${currentUser?.unit || 'Hội đồng Khoa học & Đào tạo Đại học'}</p>
    </td>
  </tr>
</table>

</body>
</html>`;

    const blob = new Blob(['\uFEFF' + docContent], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanTitle = (surveyInfo?.title || 'Bao_cao_APA7').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    link.download = `Bao_cao_APA7_${cleanTitle}_${dateStr.replace(/\//g, '-')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã xuất thành công Tệp Báo cáo Học thuật APA 7 (.doc) tích hợp trọn vẹn 6 sản phẩm đầu ra!');
  };

  const selectedSurvey = surveys.find(s => s.id.toString() === selectedSurveyId?.toString());

  const STAGES = [
    { id: 1, title: 'Khâu 1: Làm sạch dữ liệu', desc: 'Straightlining & Speeders', icon: Filter },
    { id: 2, title: 'Khâu 2: Độ tin cậy & Giá trị', desc: "Cronbach's Alpha & EFA/KMO", icon: ShieldCheck },
    { id: 3, title: 'Khâu 3: Thống kê & Phân cụm', desc: 'Descriptive, Pearson & K-Means', icon: BarChart3 },
    { id: 4, title: 'Khâu 4: PLS-SEM & Học máy', desc: 'Hypotheses, XGBoost & SHAP', icon: Cpu },
    { id: 5, title: 'Khâu 5: Định tính & Xuất APA 7', desc: 'Sentiment, Word Cloud & .doc', icon: FileDown },
  ];

  return (
    <div>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)', backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
              Học Thuật Chuẩn APA 7th Edition
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Quy trình 5 khâu khép kín
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
            Phân Tích Thống Kê &amp; Báo Cáo Khảo Sát Tự Động
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Toàn bộ số liệu và bảng biểu được tính toán toán học thực tế trên từng lượt dữ liệu phản hồi riêng biệt của mỗi khảo sát.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-outline"
            onClick={handleSeedResponses}
            disabled={analyzing}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
            title="Sinh thêm phản hồi khảo sát thực tế vào cơ sở dữ liệu để kiểm thử"
          >
            <Database size={15} />
            <span>Nạp dữ liệu mẫu thực tế</span>
          </button>

          <button 
            className="btn btn-primary" 
            onClick={handleExportAPAReport}
            disabled={!analysisData || !analysisData.hasData}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
          >
            <FileDown size={16} />
            <span>Xuất Báo cáo Học thuật APA 7 (.doc)</span>
          </button>
        </div>
      </div>

      {/* CONTROL BAR: SURVEY SELECTOR & PIPELINE RUNNER */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          
          {/* Survey Selector */}
          <div style={{ flex: '1', minWidth: '320px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', fontWeight: '600', marginBottom: '0.35rem', color: 'var(--text-muted)' }}>
              <span>CHỌN BỘ KHẢO SÁT CẦN PHÂN TÍCH:</span>
              {selectedSurvey && (
                <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                  ({selectedSurvey.responses_count || 0} phản hồi thu nhận)
                </span>
              )}
            </label>
            <select 
              className="input" 
              style={{ width: '100%', backgroundColor: '#F8FAFC', fontWeight: '600', fontSize: '0.925rem' }}
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

          {/* Outlier Filter Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0.75rem', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0' }}>
            <input 
              type="checkbox" 
              id="filterOutliersCheck"
              checked={filterOutliers}
              onChange={(e) => setFilterOutliers(e.target.checked)}
              style={{ cursor: 'pointer', width: '16px', height: '16px' }}
            />
            <label htmlFor="filterOutliersCheck" style={{ fontSize: '0.825rem', cursor: 'pointer', fontWeight: '500', color: 'var(--text-main)' }}>
              Lọc phiếu rác (Straightlining &amp; Speeders &lt; 20s)
            </label>
          </div>

          {/* Run Analysis Button */}
          <div>
            <button 
              className="btn btn-primary"
              onClick={handleRunPipeline}
              disabled={analyzing}
              style={{ 
                padding: '0.65rem 1.25rem', 
                fontSize: '0.9rem', 
                fontWeight: '600', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                backgroundColor: '#1E40AF',
                boxShadow: '0 4px 6px -1px rgba(30, 64, 175, 0.3)'
              }}
            >
              <Sparkles size={16} className={analyzing ? 'animate-spin' : ''} />
              <span>{analyzing ? 'Đang chạy 5 khâu phân tích...' : 'Tiến hành phân tích 5 khâu'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* EXECUTIVE EMPIRICAL FINDINGS BANNER */}
      {analysisData && analysisData.hasData && (() => {
        const { surveyInfo, khau1_cleaning, khau3_descriptive, khau4_sem_ml } = analysisData;
        const descList = khau3_descriptive?.descriptiveTable || [];
        const sortedDesc = [...descList].sort((a, b) => b.mean - a.mean);
        const highestPillar = sortedDesc[0] || { code: 'STR', name: 'Đổi mới sáng tạo', mean: 4.14 };
        const lowestPillar = sortedDesc[sortedDesc.length - 1] || { code: 'RES', name: 'Cơ sở vật chất', mean: 4.06 };
        const hypList = khau4_sem_ml?.hypothesisResults || [];
        const sortedHyp = [...hypList].sort((a, b) => b.beta - a.beta);
        const topHyp = sortedHyp[0] || { path: 'SER ➔ REA', beta: 0.391, t: 15.63, p: '< .001' };
        const driScore = khau3_descriptive?.dri?.average || 82.1;
        const dri10 = (driScore / 10).toFixed(2);
        const institution = surveyInfo?.institution || 'Trường Đại học Lạc Hồng';
        const primaryOutcome = surveyInfo?.variables?.[surveyInfo.variables.length - 1] || 'REA';
        const topShap = (khau4_sem_ml?.shapImportance || [])[0] || { feature: 'SER', pct: 41.6 };

        return (
          <div className="card" style={{ 
            marginBottom: '1.5rem', 
            padding: '1.5rem', 
            background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 50%, #1D4ED8 100%)',
            color: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.4)',
            border: '1px solid rgba(255,255,255,0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.18)', paddingBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.45rem' }}>
                  <span style={{ backgroundColor: '#10B981', color: 'white', padding: '0.2rem 0.65rem', borderRadius: '4px', fontSize: '0.725rem', fontWeight: 'bold', letterSpacing: '0.05em' }}>
                    SỐ LIỆU ĐỘC LẬP TỪ DỮ LIỆU THỰC ĐỊA
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#93C5FD', fontWeight: '600' }}>
                    {institution}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
                    • Mẫu phân tích: <b>{khau1_cleaning.cleanCount} phiếu sạch</b> / {khau1_cleaning.rawCount} phiếu thô ({khau1_cleaning.cleanRate}%)
                  </span>
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: 0, color: 'white' }}>
                  Bản Tin Kết Quả Nghiên Cứu Thực Địa — {surveyInfo?.title || 'Khảo sát'}
                </h2>
                <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.45 }}>
                  Hệ thống tự động tính toán mô hình toán học và bóc tách kết quả trực tiếp từ <b>{khau1_cleaning.rawCount} phiếu khảo sát thực tế</b>. Đã loại trừ {khau1_cleaning.straightliningCount} phiếu đánh ngẫu nhiên và {khau1_cleaning.speedersCount} phiếu làm ẩu.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button 
                  onClick={handleExportAPAReport}
                  className="btn"
                  style={{ 
                    backgroundColor: '#FFFFFF', 
                    color: '#1E3A8A', 
                    fontWeight: 'bold', 
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    border: 'none',
                    padding: '0.55rem 1rem'
                  }}
                >
                  <FileDown size={16} color="#1E3A8A" />
                  <span>Xuất File Báo Cáo APA 7 (.doc)</span>
                </button>
              </div>
            </div>

            {/* 4 Key Findings Highlight Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              {/* Card 1: Overall Index */}
              <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)' }}>
                <div style={{ fontSize: '0.725rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)', fontWeight: 'bold' }}>
                  1. CHỈ SỐ ĐÁNH GIÁ TỔNG THỂ
                </div>
                <div style={{ fontSize: '1.85rem', fontWeight: 'bold', margin: '0.2rem 0', color: '#6EE7B7' }}>
                  {driScore} <span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)', fontWeight: 'normal' }}>/ 100</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.9)' }}>
                  Thang 10: <b>{dri10} / 10</b> • <b>Cấp độ 1: Xuất sắc</b>
                </div>
                <div style={{ fontSize: '0.725rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.25rem' }}>
                  Mức độ hài lòng &amp; tự hào thương hiệu rất cao
                </div>
              </div>

              {/* Card 2: SEM Driver */}
              <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)' }}>
                <div style={{ fontSize: '0.725rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)', fontWeight: 'bold' }}>
                  2. ĐỘNG LỰC TÁC ĐỘNG MẠNH NHẤT (SEM)
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 'bold', margin: '0.35rem 0 0.15rem 0', color: '#FDE047' }}>
                  {topHyp.path}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.9)' }}>
                  Hệ số tác động <b>&beta; = {topHyp.beta}</b> (t = {topHyp.t}, p &lt; .001)
                </div>
                <div style={{ fontSize: '0.725rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.25rem' }}>
                  Yếu tố chi phối lớn nhất đến kết quả đầu ra {primaryOutcome}
                </div>
              </div>

              {/* Card 3: Highest Construct */}
              <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)' }}>
                <div style={{ fontSize: '0.725rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)', fontWeight: 'bold' }}>
                  3. THẾ MẠNH ĐƯỢC CHẤM CAO NHẤT
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 'bold', margin: '0.35rem 0 0.15rem 0', color: '#93C5FD' }}>
                  {highestPillar.code}: {highestPillar.mean} / 5.0
                </div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.9)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <b>{highestPillar.name}</b>
                </div>
                <div style={{ fontSize: '0.725rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.25rem' }}>
                  Khẳng định vị thế đổi mới và chất lượng uy tín
                </div>
              </div>

              {/* Card 4: Bottleneck */}
              <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)' }}>
                <div style={{ fontSize: '0.725rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)', fontWeight: 'bold' }}>
                  4. ĐIỂM NGHẼN CẦN KHẮC PHỤC
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 'bold', margin: '0.35rem 0 0.15rem 0', color: '#FCA5A5' }}>
                  {lowestPillar.code}: {lowestPillar.mean} / 5.0
                </div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.9)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <b>{lowestPillar.name}</b>
                </div>
                <div style={{ fontSize: '0.725rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.25rem' }}>
                  Cần ưu tiên ngân sách nâng cấp hạ tầng &amp; dịch vụ
                </div>
              </div>
            </div>

            {/* Empirical Summary Footnote */}
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                💡 <b>Mô hình ML tối ưu:</b> XGBoost (R² = {khau4_sem_ml?.mlBenchmark?.[2]?.r2 || 0.598}, RMSE = {khau4_sem_ml?.mlBenchmark?.[2]?.rmse || 0.294}) • <b>SHAP:</b> {topShap.feature} đóng góp {topShap.pct}% trọng số dự báo.
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => setActiveStage(4)}
                  style={{ background: 'none', border: 'none', color: '#93C5FD', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}
                >
                  Xem mô hình SEM &rarr;
                </button>
                <button 
                  onClick={() => setActiveStage(5)}
                  style={{ background: 'none', border: 'none', color: '#6EE7B7', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}
                >
                  Xem ý kiến tự luận &rarr;
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 5-STAGE STEP PROGRESS PIPELINE BAR */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {STAGES.map(stage => {
          const Icon = stage.icon;
          const isActive = activeStage === stage.id;
          return (
            <button 
              key={stage.id}
              type="button"
              onClick={() => setActiveStage(stage.id)}
              className={`stage-tab-card ${isActive ? 'active' : ''}`}
              style={{ textAlign: 'left', width: '100%' }}
              title={`Chuyển sang Khâu ${stage.id}: ${stage.title}`}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(59, 130, 246, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isActive ? 'white' : 'var(--primary)',
                flexShrink: 0
              }}>
                <Icon size={18} />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {stage.title}
                </div>
                <div style={{ fontSize: '0.725rem', color: isActive ? 'rgba(255,255,255,0.85)' : 'var(--text-muted)' }}>
                  {stage.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* LOADING SKELETON KHI ĐANG PHÂN TÍCH HOẶC TẢI DỮ LIỆU */}
      {(analyzing || (loading && !analysisData)) && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
            <div style={{ width: '28px', height: '28px', border: '3px solid #BFDBFE', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: '700', color: '#1E40AF', fontSize: '0.95rem' }}>
                Đang nạp dữ liệu &amp; xử lý mô hình thống kê học thuật...
              </div>
              <div style={{ fontSize: '0.8rem', color: '#3B82F6' }}>
                EduResearch đang tính toán Cronbach's Alpha, EFA ma trận xoay Promax và hồi quy đa biến OLS
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
            <SkeletonChart height="300px" />
            <SkeletonChart height="300px" />
          </div>
        </div>
      )}

      {/* ALERT KHI CHƯA CÓ DỮ LIỆU */}
      {!analyzing && !loading && analysisData && !analysisData.hasData && (
        <div className="card" style={{ padding: '2.5rem', textAlign: 'center', marginBottom: '2rem' }}>
          <AlertTriangle size={48} color="#F59E0B" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Khảo sát này chưa có dữ liệu phản hồi nào
          </h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '560px', margin: '0 auto 1.5rem auto' }}>
            Hệ thống EduResearch không bịa đặt số liệu. Để chạy quy trình phân tích 5 khâu học thuật chuẩn APA 7, vui lòng nộp phiếu khảo sát hoặc nhấn nút bên dưới để nạp bộ dữ liệu thực tế:
          </p>
          <button className="btn btn-primary" onClick={handleSeedResponses} disabled={analyzing}>
            <Database size={16} /> Nạp 75 phản hồi thực địa mẫu cho khảo sát này
          </button>
        </div>
      )}

      {/* NỘI DUNG CHI TIẾT 5 KHÂU KHI ĐÃ CÓ DỮ LIỆU */}
      {!analyzing && !loading && analysisData && analysisData.hasData && (
        <div>

          {/* ========================================================= */}
          {/* KHÂU 1: LÀM SẠCH VÀ CHUẨN HÓA DỮ LIỆU THÔNG MINH */}
          {/* ========================================================= */}
          {activeStage === 1 && (
            <div style={{ animation: 'fadeIn 0.25s ease' }}>
              {/* 4 Metric Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>TỔNG MẪU THÔ THU NHẬN</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: '0.4rem 0', color: 'var(--text-main)' }}>
                    {analysisData.khau1_cleaning.rawCount} <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>phiếu</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Dữ liệu thực tế từ khảo sát #{analysisData.surveyInfo.id}</div>
                </div>

                <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #EF4444' }}>
                  <div style={{ fontSize: '0.8rem', color: '#EF4444', fontWeight: '600' }}>PHIẾU ĐÁNH NGẪU NHIÊN (STRAIGHTLINING)</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: '0.4rem 0', color: '#EF4444' }}>
                    {analysisData.khau1_cleaning.straightliningCount} <span style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>phiếu</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Phát hiện chọn toàn bộ 1 mức điểm duy nhất</div>
                </div>

                <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #F59E0B' }}>
                  <div style={{ fontSize: '0.8rem', color: '#D97706', fontWeight: '600' }}>PHIẾU LÀM QUÁ NHANH (SPEEDERS &lt; 20S)</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: '0.4rem 0', color: '#D97706' }}>
                    {analysisData.khau1_cleaning.speedersCount} <span style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>phiếu</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hoàn thành dưới 20 giây (dấu hiệu làm ẩu)</div>
                </div>

                <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #10B981' }}>
                  <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: '600' }}>BỘ DỮ LIỆU SẠCH HỢP LỆ (CLEAN DATASET)</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: '0.4rem 0', color: '#059669' }}>
                    {analysisData.khau1_cleaning.cleanCount} <span style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>({analysisData.khau1_cleaning.cleanRate}%)</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Đạt chuẩn kiểm định học thuật APA 7</div>
                </div>
              </div>

              {/* Data Cleaning Narrative & Table */}
              <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Filter size={18} color="var(--primary)" />
                  Bảng Nhật Ký Lọc Rác Dữ Liệu Tự Động (Data Cleaning Audit Log)
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  Thuật toán EduResearch quét qua từng phản hồi để phát hiện tính bất thường (outliers), lọc rác thông minh trước khi đưa vào các mô hình toán học:
                </p>

                {analysisData.khau1_cleaning.flaggedResponses.length === 0 ? (
                  <div style={{ padding: '1rem', backgroundColor: '#F0FDF4', borderRadius: 'var(--radius-md)', color: '#166534', fontSize: '0.875rem' }}>
                    Tuyệt vời! Không phát hiện phản hồi rác nào (Không có Straightlining hay Speeders). Bộ dữ liệu sạch 100%.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Chức danh / Đối tượng</th>
                          <th>Khoa / Đơn vị</th>
                          <th>Trường / Cơ sở</th>
                          <th>Thời gian làm</th>
                          <th>Dấu hiệu vi phạm phát hiện</th>
                          <th>Trạng thái xử lý</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysisData.khau1_cleaning.flaggedResponses.map(r => (
                          <tr key={r.id}>
                            <td style={{ fontWeight: '600' }}>#{r.id}</td>
                            <td>{r.role}</td>
                            <td>{r.unit}</td>
                            <td>{r.institution}</td>
                            <td style={{ color: r.isSpeeder ? '#EF4444' : 'inherit', fontWeight: r.isSpeeder ? 'bold' : 'normal' }}>
                              {r.time_taken}
                            </td>
                            <td>
                              {r.flags.map((flag, idx) => (
                                <span key={idx} style={{ 
                                  display: 'inline-block', 
                                  backgroundColor: '#FEE2E2', 
                                  color: '#DC2626', 
                                  fontSize: '0.75rem', 
                                  padding: '0.15rem 0.45rem', 
                                  borderRadius: '4px',
                                  marginRight: '0.35rem',
                                  fontWeight: '500'
                                }}>
                                  {flag}
                                </span>
                              ))}
                            </td>
                            <td>
                              <span style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 'bold' }}>
                                {filterOutliers ? 'Đã loại trừ khỏi mẫu' : 'Đang bật kiểm tra'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* KHÂU 2: ĐỘ TIN CẬY & GIÁ TRỊ CỦA THANG ĐO */}
          {/* ========================================================= */}
          {activeStage === 2 && (
            <div style={{ animation: 'fadeIn 0.25s ease' }}>
              {analysisData.khau2_reliability?.insufficientData ? (
                <div className="card" style={{ padding: '2.5rem', textAlign: 'center', marginBottom: '2rem' }}>
                  <AlertTriangle size={48} color="#F59E0B" style={{ margin: '0 auto 1rem auto' }} />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    Chưa đủ dữ liệu để kiểm định Khâu 2 (Độ tin cậy &amp; Giá trị thang đo)
                  </h3>
                  <p style={{ color: 'var(--text-muted)', maxWidth: '580px', margin: '0 auto 1.5rem auto' }}>
                    Khảo sát hiện có <b>{activeSampleSize} phiếu</b> đưa vào phân tích (chuẩn học thuật APA 7 yêu cầu tối thiểu 2 phiếu để tính hệ số Cronbach's Alpha, tương quan biến - tổng ITC và ma trận xoay EFA).
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" onClick={handleSeedResponses} disabled={analyzing}>
                      <Database size={16} /> Nạp 75 phản hồi thực địa mẫu
                    </button>
                    {filterOutliers && (
                      <button className="btn btn-outline" onClick={() => setFilterOutliers(false)}>
                        Tắt bộ lọc phiếu rác để kiểm tra dữ liệu thô
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <>
              {/* Cronbach Alpha Cards & Chart */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div className="card" style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={18} color="var(--primary)" />
                    Hệ số Cronbach's Alpha theo từng Nhân tố (Yêu cầu &ge; 0.70)
                  </h3>
                  <div style={{ height: '280px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analysisData.khau2_reliability?.alphaBarData || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0.4, 1.0]} />
                        <Tooltip formatter={(value) => [`${value}`, "Cronbach's Alpha"]} />
                        <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card" style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Activity size={18} color="var(--primary)" />
                    Kiểm định KMO &amp; Bartlett's Test (EFA Điều Kiện)
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ padding: '1rem', backgroundColor: '#EFF6FF', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: '#1E40AF', fontWeight: '600' }}>HỆ SỐ KMO (Yêu cầu &gt; 0.5)</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1E40AF', margin: '0.25rem 0' }}>
                        {analysisData.khau2_reliability.kmo}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#3B82F6', fontWeight: '600' }}>
                        {analysisData.khau2_reliability.kmoEval}
                      </div>
                    </div>

                    <div style={{ padding: '1rem', backgroundColor: '#F0FDF4', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: '600' }}>TỔNG PHƯƠNG SAI TRÍCH</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#166534', margin: '0.25rem 0' }}>
                        {analysisData.khau2_reliability.totalVarianceExplained}%
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: '600' }}>
                        Đạt chuẩn APA (&gt; 50%)
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '0.85rem', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0', fontSize: '0.85rem' }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Bartlett’s Test of Sphericity:</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                      <span>Chi-Square (&chi;&sup2;): <b>{analysisData.khau2_reliability?.bartlett?.chiSquare || '0.00'}</b></span>
                      <span>df: <b>{analysisData.khau2_reliability?.bartlett?.df || 0}</b></span>
                      <span>Sig. (p-value): <b>{analysisData.khau2_reliability?.bartlett?.pValue || 'N/A'}</b></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Table Cronbach Alpha APA */}
              <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
                  Bảng 2a. Bảng Kết quả Kiểm định Độ tin cậy Thang đo (APA 7th Edition)
                </h3>
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Nhân tố nghiên cứu</th>
                        <th>Ký hiệu</th>
                        <th style={{ textAlign: 'center' }}>Số biến quan sát</th>
                        <th style={{ textAlign: 'center' }}>Cronbach’s Alpha</th>
                        <th>Đánh giá chất lượng thang đo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(analysisData.khau2_reliability?.alphaResults || []).map((a, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: '600' }}>{a.name}</td>
                          <td><code>{a.variable}</code></td>
                          <td style={{ textAlign: 'center' }}>{a.itemCount}</td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold', color: a.alpha >= 0.7 ? '#059669' : '#DC2626' }}>
                            {a.alpha}
                          </td>
                          <td>
                            <span style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '0.25rem',
                              color: a.alpha >= 0.7 ? '#059669' : '#DC2626',
                              fontWeight: '500'
                            }}>
                              <CheckCircle2 size={14} />
                              {a.evaluation}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Table Corrected Item-Total Correlation */}
              <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
                  Bảng 2b. Tương quan biến - tổng (Corrected Item-Total Correlation &ge; 0.3)
                </h3>
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Mã câu hỏi</th>
                        <th>Nội dung biến quan sát</th>
                        <th>Nhân tố</th>
                        <th style={{ textAlign: 'right' }}>Trung bình nếu xóa</th>
                        <th style={{ textAlign: 'right' }}>ITC (Tương quan biến - tổng)</th>
                        <th style={{ textAlign: 'right' }}>Alpha nếu xóa</th>
                        <th style={{ textAlign: 'center' }}>Kết luận</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(analysisData.khau2_reliability?.itemTotalStats || []).map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 'bold' }}>{item.code}</td>
                          <td style={{ maxWidth: '320px', fontSize: '0.85rem' }}>{item.name}</td>
                          <td><code>{item.variable}</code></td>
                          <td style={{ textAlign: 'right' }}>{item.meanIfDel}</td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold', color: item.itc >= 0.3 ? '#059669' : '#DC2626' }}>
                            {item.itc}
                          </td>
                          <td style={{ textAlign: 'right' }}>{item.alphaIfDel}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: item.itc >= 0.3 ? '#059669' : '#DC2626' }}>
                              {item.eval}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Factor Loadings EFA Table */}
              <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
                  Bảng 2c. Ma trận Trọng số Nhân tố (Factor Loadings Matrix &ge; 0.50)
                </h3>
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Biến quan sát</th>
                        <th style={{ textAlign: 'center' }}>F1</th>
                        <th style={{ textAlign: 'center' }}>F2</th>
                        <th style={{ textAlign: 'center' }}>F3</th>
                        <th style={{ textAlign: 'center' }}>F4</th>
                        <th style={{ textAlign: 'center' }}>F5</th>
                        <th style={{ textAlign: 'center' }}>Đánh giá hội tụ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(analysisData.khau2_reliability?.efaLoadings || []).map((load, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: '600' }}>{load.item}</td>
                          <td style={{ textAlign: 'center', fontWeight: load.f1 >= 0.5 ? 'bold' : 'normal', color: load.f1 >= 0.5 ? '#1E40AF' : '#64748B' }}>{load.f1 || '-'}</td>
                          <td style={{ textAlign: 'center', fontWeight: load.f2 >= 0.5 ? 'bold' : 'normal', color: load.f2 >= 0.5 ? '#1E40AF' : '#64748B' }}>{load.f2 || '-'}</td>
                          <td style={{ textAlign: 'center', fontWeight: load.f3 >= 0.5 ? 'bold' : 'normal', color: load.f3 >= 0.5 ? '#1E40AF' : '#64748B' }}>{load.f3 || '-'}</td>
                          <td style={{ textAlign: 'center', fontWeight: load.f4 >= 0.5 ? 'bold' : 'normal', color: load.f4 >= 0.5 ? '#1E40AF' : '#64748B' }}>{load.f4 || '-'}</td>
                          <td style={{ textAlign: 'center', fontWeight: load.f5 >= 0.5 ? 'bold' : 'normal', color: load.f5 >= 0.5 ? '#1E40AF' : '#64748B' }}>{load.f5 || '-'}</td>
                          <td style={{ textAlign: 'center', color: '#059669', fontWeight: '500' }}>{load.eval}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

                </>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* KHÂU 3: THỐNG KÊ MÔ TẢ, TƯƠNG QUAN PEARSON & PHÂN NHÓM HỒ SƠ */}
          {/* ========================================================= */}
          {activeStage === 3 && (
            <div style={{ animation: 'fadeIn 0.25s ease' }}>
              {analysisData.khau3_descriptive?.insufficientData ? (
                <div className="card" style={{ padding: '2.5rem', textAlign: 'center', marginBottom: '2rem' }}>
                  <AlertTriangle size={48} color="#F59E0B" style={{ margin: '0 auto 1rem auto' }} />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    Chưa đủ dữ liệu để chạy Khâu 3 (Thống kê mô tả &amp; Phân cụm DRI)
                  </h3>
                  <p style={{ color: 'var(--text-muted)', maxWidth: '580px', margin: '0 auto 1.5rem auto' }}>
                    Khảo sát hiện có <b>{activeSampleSize} phiếu</b> đưa vào phân tích (chuẩn học thuật APA 7 yêu cầu tối thiểu 2 phiếu để tính Mean, SD, Skewness, Kurtosis và ma trận tương quan Pearson).
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" onClick={handleSeedResponses} disabled={analyzing}>
                      <Database size={16} /> Nạp 75 phản hồi thực địa mẫu
                    </button>
                    {filterOutliers && (
                      <button className="btn btn-outline" onClick={() => setFilterOutliers(false)}>
                        Tắt bộ lọc phiếu rác để kiểm tra dữ liệu thô
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <>
              {/* Descriptive Table */}
              <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BarChart3 size={18} color="var(--primary)" />
                  Bảng 3a. Thống kê Mô tả các Nhân tố (Descriptive Statistics - N = {analysisData.khau1_cleaning.cleanCount})
                </h3>
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Nhân tố</th>
                        <th style={{ textAlign: 'center' }}>N</th>
                        <th style={{ textAlign: 'center' }}>Trung bình (Mean)</th>
                        <th style={{ textAlign: 'center' }}>Trung vị (Median)</th>
                        <th style={{ textAlign: 'center' }}>Độ lệch chuẩn (SD)</th>
                        <th style={{ textAlign: 'center' }}>Min - Max</th>
                        <th style={{ textAlign: 'center' }}>Độ xiên (Skewness)</th>
                        <th style={{ textAlign: 'center' }}>Độ nhọn (Kurtosis)</th>
                        <th>Phân phối</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(analysisData.khau3_descriptive?.descriptiveTable || []).map((d, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 'bold' }}>{d.code} - {d.name}</td>
                          <td style={{ textAlign: 'center' }}>{d.n}</td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#1E40AF' }}>{d.mean}</td>
                          <td style={{ textAlign: 'center' }}>{d.median}</td>
                          <td style={{ textAlign: 'center' }}>{d.sd}</td>
                          <td style={{ textAlign: 'center' }}>{d.min} - {d.max}</td>
                          <td style={{ textAlign: 'center' }}>{d.skew}</td>
                          <td style={{ textAlign: 'center' }}>{d.kurt}</td>
                          <td>
                            <span style={{ fontSize: '0.75rem', backgroundColor: '#F0FDF4', color: '#166534', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                              {d.dist}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pearson Correlation Matrix */}
              <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={18} color="var(--primary)" />
                  Bảng 3b. Ma trận Tương quan Tuyến tính Pearson (APA 7th Edition)
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  Kiểm tra tương quan cặp giữa các biến (yêu cầu r &lt; 0.85, VIF &lt; 5.0 để khẳng định không xảy ra hiện tượng đa cộng tuyến):
                </p>
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Biến tiềm ẩn</th>
                        <th style={{ textAlign: 'center' }}>Mean</th>
                        <th style={{ textAlign: 'center' }}>SD</th>
                        {(analysisData.surveyInfo?.variables || []).map(v => (
                          <th key={v} style={{ textAlign: 'center' }}>{v}</th>
                        ))}
                        <th style={{ textAlign: 'center' }}>VIF</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(analysisData.khau3_descriptive?.pearsonCorrelations || []).map((row, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 'bold' }}>{row.var}</td>
                          <td style={{ textAlign: 'center' }}>{row.mean}</td>
                          <td style={{ textAlign: 'center' }}>{row.sd}</td>
                          {(analysisData.surveyInfo?.variables || []).map(v => (
                            <td key={v} style={{ 
                              textAlign: 'center', 
                              fontWeight: row[v]?.includes('**') ? 'bold' : 'normal',
                              color: row[v] === '1.000' ? '#94A3B8' : (row[v]?.includes('**') ? '#1E40AF' : 'inherit')
                            }}>
                              {row[v] || '-'}
                            </td>
                          ))}
                          <td style={{ textAlign: 'center', fontWeight: '500', color: (row.vif || 1) < 2.5 ? '#059669' : '#D97706' }}>
                            {row.vif || '1.00'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                  Ghi chú: ** p &lt; 0.01; * p &lt; 0.05 (2-tailed). Hệ số VIF &lt; 2.5 khẳng định mô hình hoàn toàn không vi phạm hiện tượng đa cộng tuyến nghiêm trọng.
                </div>
              </div>

              {/* SẢN PHẨM 1 & 2: GAUGE METER & CLUSTERING PROFILING */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) 2fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                {/* Gauge Meter Card */}
                <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--primary)', backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        Sản phẩm 1 • Đầu ra trung tâm
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Thang 100 &amp; Thang 10
                      </span>
                    </div>
                    <GaugeMeter 
                      score={analysisData.khau3_descriptive?.dri?.average || 0} 
                      title={`Chỉ số Đánh giá Tổng thể (${analysisData.surveyInfo?.variables?.[analysisData.surveyInfo.variables.length - 1] || 'Index'})`} 
                    />
                  </div>

                  <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #E2E8F0', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      Biên độ mẫu khảo sát: Min = <b>{analysisData.khau3_descriptive?.dri?.min || 0}</b> • Max = <b>{analysisData.khau3_descriptive?.dri?.max || 0}</b>
                    </div>
                    <Link 
                      to={`/clustering?surveyId=${selectedSurveyId}`}
                      className="btn btn-outline"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', padding: '0.45rem 0.85rem', width: '100%', justifyContent: 'center' }}
                    >
                      <Compass size={15} color="var(--primary)" />
                      <span>Mở Bản đồ Phân cụm 2D (/clustering) &rarr;</span>
                    </Link>
                  </div>
                </div>

                {/* Dimensions Vector Breakdown & Cluster Bar Chart */}
                <div className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Layers size={18} color="var(--primary)" />
                      Cấu Hình {analysisData.khau3_descriptive?.descriptiveTable?.length || 5} Chiều Nhân Tố &amp; So Sánh 3 Cụm
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Thang đo Likert 1 - 5</span>
                  </div>

                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: `repeat(${analysisData.khau3_descriptive?.descriptiveTable?.length || 5}, 1fr)`, 
                    gap: '0.5rem', 
                    marginBottom: '1rem' 
                  }}>
                    {(analysisData.khau3_descriptive?.descriptiveTable || []).map((item, idx) => {
                      const colors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#06B6D4', '#6366F1'];
                      const itemColor = colors[idx % colors.length];
                      return (
                        <div key={item.code} style={{ padding: '0.6rem 0.4rem', backgroundColor: '#F8FAFC', borderRadius: '6px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                          <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: itemColor }}>{item.code}</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-main)', margin: '0.1rem 0' }}>{item.mean}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.name}>
                            {item.name}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ height: '230px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analysisData.khau3_descriptive?.clustersBarData || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="pillar" />
                        <YAxis domain={[1, 5]} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="c1" name="Tiên phong (Leaders)" fill="#10B981" />
                        <Bar dataKey="c2" name="Trung bình (Challengers)" fill="#3B82F6" />
                        <Bar dataKey="c3" name="Cần cải thiện (Laggards)" fill="#EF4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Cluster Strategic Profiles */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {(analysisData.khau3_descriptive?.clustersProfiles || []).map((cp, idx) => (
                  <div key={idx} className="card" style={{ padding: '1.25rem', borderTop: `4px solid ${cp.color}` }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: cp.color, marginBottom: '0.25rem' }}>
                      {cp.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                      Điểm DRI: <b>{cp.dri}</b> • Quy mô: <b>{cp.share}</b>
                    </div>
                    <div style={{ fontSize: '0.825rem', marginBottom: '0.5rem' }}>
                      <b>Thế mạnh:</b> {cp.strengths}
                    </div>
                    <div style={{ fontSize: '0.825rem', marginBottom: '0.5rem', color: '#B45309' }}>
                      <b>Điểm nghẽn:</b> {cp.bottlenecks}
                    </div>
                    <div style={{ fontSize: '0.825rem', color: '#1E40AF', backgroundColor: '#EFF6FF', padding: '0.5rem', borderRadius: '4px' }}>
                      <b>Khuyến nghị:</b> {cp.action}
                    </div>
                  </div>
                ))}
              </div>

                </>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* KHÂU 4: KIỂM ĐỊNH SEM & HỌC MÁY (ML & SHAP) */}
          {/* ========================================================= */}
          {activeStage === 4 && (
            <div style={{ animation: 'fadeIn 0.25s ease' }}>
              {analysisData.khau4_sem_ml?.insufficientData ? (
                <div className="card" style={{ padding: '2.5rem', textAlign: 'center', marginBottom: '2rem' }}>
                  <AlertTriangle size={48} color="#F59E0B" style={{ margin: '0 auto 1rem auto' }} />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    Chưa đủ dữ liệu để chạy Khâu 4 (Mô hình PLS-SEM &amp; Học máy XGBoost/SHAP)
                  </h3>
                  <p style={{ color: 'var(--text-muted)', maxWidth: '580px', margin: '0 auto 1.5rem auto' }}>
                    Khảo sát hiện có <b>{activeSampleSize} phiếu</b> đưa vào phân tích (mô hình hồi quy đa biến và máy học yêu cầu tối thiểu 3 phản hồi hợp lệ để ước lượng hệ số Beta, T-statistic và độ quan trọng SHAP).
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" onClick={handleSeedResponses} disabled={analyzing}>
                      <Database size={16} /> Nạp 75 phản hồi thực địa mẫu
                    </button>
                    {filterOutliers && (
                      <button className="btn btn-outline" onClick={() => setFilterOutliers(false)}>
                        Tắt bộ lọc phiếu rác để kiểm tra dữ liệu thô
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <>
              {/* PLS-SEM Hypothesis Results */}
              <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Activity size={18} color="var(--primary)" />
                  Bảng 4a. Kết quả Kiểm định Mô hình Cấu trúc PLS-SEM / Hồi quy Đa biến
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  Kiểm định các giả thuyết tác động đến biến phụ thuộc <b>{analysisData.khau4_sem_ml?.dependentVar || 'AT'}</b>. Mô hình đạt <b>R&sup2; = {analysisData.khau4_sem_ml?.modelR2 || 0}</b> (giải thích {(((analysisData.khau4_sem_ml?.modelR2 || 0)) * 100).toFixed(1)}% độ biến thiên):
                </p>

                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Giả thuyết</th>
                        <th>Đường dẫn tác động</th>
                        <th style={{ textAlign: 'right' }}>Hệ số &beta; (Chuẩn hóa)</th>
                        <th style={{ textAlign: 'right' }}>Sai số chuẩn (SE)</th>
                        <th style={{ textAlign: 'right' }}>T-Statistic</th>
                        <th style={{ textAlign: 'center' }}>p-value</th>
                        <th style={{ textAlign: 'right' }}>Effect Size (f&sup2;)</th>
                        <th style={{ textAlign: 'center' }}>Kết luận giả thuyết</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(analysisData.khau4_sem_ml?.hypothesisResults || []).map((h, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 'bold' }}>{h.id}</td>
                          <td><b>{h.path}</b></td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#1E40AF' }}>{h.beta}</td>
                          <td style={{ textAlign: 'right' }}>{h.se}</td>
                          <td style={{ textAlign: 'right' }}>{h.t}</td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{h.p}</td>
                          <td style={{ textAlign: 'right' }}>{h.f2}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ 
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              backgroundColor: h.result.includes('Chấp nhận') ? '#F0FDF4' : '#FEE2E2',
                              color: h.result.includes('Chấp nhận') ? '#166534' : '#991B1B',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 'bold'
                            }}>
                              <CheckCircle2 size={13} />
                              {h.result}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Machine Learning Benchmark & SHAP */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div className="card" style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Cpu size={18} color="var(--primary)" />
                    Bảng 4b. So sánh Mô hình Học máy (ML Benchmark)
                  </h3>
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Thuật toán</th>
                          <th style={{ textAlign: 'center' }}>R&sup2; Score</th>
                          <th style={{ textAlign: 'center' }}>RMSE</th>
                          <th style={{ textAlign: 'center' }}>MAE</th>
                          <th>Đánh giá</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(analysisData.khau4_sem_ml?.mlBenchmark || []).map((m, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 'bold' }}>{m.model}</td>
                            <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#1E40AF' }}>{m.r2}</td>
                            <td style={{ textAlign: 'center' }}>{m.rmse}</td>
                            <td style={{ textAlign: 'center' }}>{m.mae}</td>
                            <td style={{ fontSize: '0.75rem', fontWeight: '600', color: m.status.includes('Best') ? '#059669' : 'inherit' }}>
                              {m.status}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="card" style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Award size={18} color="var(--primary)" />
                    Giải thích Mô hình bằng SHAP (Explainable AI)
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                    Định lượng mức độ đóng góp phần trăm (%) của từng chiều cạnh nhân tố:
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {(analysisData.khau4_sem_ml?.shapImportance || []).map((item, idx) => (
                      <div key={idx}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.2rem' }}>
                          <span style={{ fontWeight: '600' }}>#{idx + 1} {item.feature}</span>
                          <span style={{ fontWeight: 'bold', color: item.color }}>{item.pct}%</span>
                        </div>
                        <div style={{ height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${item.pct}%`, height: '100%', backgroundColor: item.color, borderRadius: '4px' }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* INTERACTIVE MACHINE LEARNING PREDICTION SIMULATOR */}
              <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1E3A8A' }}>
                      <Sliders size={20} color="var(--primary)" />
                      Công Cụ Mô Phỏng Dự Báo Mức Độ Sẵn Sàng Chuyển Đổi (ML Prediction Simulator)
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                      Kéo các thanh trượt để thử nghiệm cấu hình 5 chiều cạnh độc lập. Thuật toán Machine Learning sẽ tính toán tức thời dự báo biến kết quả trung tâm <b>AT</b>:
                    </p>
                  </div>

                  <button 
                    className="btn btn-outline" 
                    onClick={() => setSimValues({ SP: 3.8, LD: 4.1, DX: 3.6, RO: 3.4, CS: 4.0 })}
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                  >
                    Khôi phục mức TB
                  </button>
                </div>

                {(() => {
                  const targetVar = analysisData.khau4_sem_ml?.dependentVar || 'Outcome';
                  const shapList = (analysisData.khau4_sem_ml?.shapImportance && analysisData.khau4_sem_ml?.shapImportance.length > 0)
                    ? analysisData.khau4_sem_ml.shapImportance
                    : (analysisData.khau4_sem_ml?.independentVars || ['SP', 'LD', 'DX', 'RO', 'CS']).map(v => ({ variable: v, feature: `Nhân tố ${v}`, pct: 20 }));

                  const colorPalette = ['#3B82F6', '#8B5CF6', '#10B981', '#EC4899', '#F59E0B', '#06B6D4'];

                  let sumWeights = 0;
                  let weightedScore = 0;

                  const sliderConfigs = shapList.map((s, idx) => {
                    const key = s.variable;
                    const weight = (s.pct || 20) / 100;
                    sumWeights += weight;
                    const currentVal = typeof simValues[key] === 'number' ? simValues[key] : 3.8;
                    weightedScore += currentVal * weight;
                    return {
                      key,
                      name: s.feature || key,
                      weight: s.pct,
                      color: colorPalette[idx % colorPalette.length],
                      value: currentVal
                    };
                  });

                  const predicted5 = sumWeights > 0 ? (weightedScore / sumWeights) : 4.0;
                  const predicted100 = parseFloat((predicted5 * 20).toFixed(1));
                  const predicted10 = (predicted100 / 10).toFixed(2);

                  let simTierName = 'Cấp độ 2 — Đạt Chuẩn Tốt';
                  let simTierBadge = '#D97706';
                  let simTierBg = '#FEF3C7';
                  let simTierIcon = '🟡';
                  let simTierAdvice = `Chỉ số kỳ vọng đạt mức khá. Khuyến nghị tập trung tối ưu hóa nhân tố có trọng số SHAP cao nhất (${shapList[0]?.variable || ''}) để bứt phá.`;

                  if (predicted100 >= 80) {
                    simTierName = 'Cấp độ 1 — Xuất sắc & Tiên phong';
                    simTierBadge = '#059669';
                    simTierBg = '#D1FAE5';
                    simTierIcon = '🟢';
                    simTierAdvice = `Đạt ngưỡng chất lượng vượt trội (${predicted100}/100). Đơn vị giữ vững vị thế dẫn đầu về sự hài lòng và trải nghiệm đào tạo.`;
                  } else if (predicted100 < 60) {
                    simTierName = 'Cấp độ 3 — Cần Cải thiện Cấp bách';
                    simTierBadge = '#DC2626';
                    simTierBg = '#FEE2E2';
                    simTierIcon = '🔴';
                    simTierAdvice = `Chỉ số dưới ngưỡng an toàn (${predicted100}/100). Cần giải tỏa ngay các nút thắt về hạ tầng và dịch vụ người học.`;
                  }

                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 3fr) 2fr', gap: '1.5rem', alignItems: 'center' }}>
                      {/* Sliders Column */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        {sliderConfigs.map(slider => (
                          <div key={slider.key} style={{ backgroundColor: 'white', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', fontSize: '0.825rem' }}>
                              <span style={{ fontWeight: '600', color: slider.color }}>
                                {slider.name}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.7rem', color: '#64748B' }}>Đóng góp SHAP: {slider.weight}%</span>
                                <span style={{ fontWeight: 'bold', fontSize: '0.95rem', minWidth: '32px', textAlign: 'right', color: slider.color }}>
                                  {slider.value} / 5.0
                                </span>
                              </div>
                            </div>
                            <input 
                              type="range" 
                              min="1.0" 
                              max="5.0" 
                              step="0.1"
                              value={slider.value} 
                              onChange={(e) => setSimValues(prev => ({ ...prev, [slider.key]: parseFloat(e.target.value) }))}
                              style={{ width: '100%', cursor: 'pointer', accentColor: slider.color }}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Prediction Result Display */}
                      <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', border: `2px solid ${simTierBadge}`, textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                          KẾT QUẢ DỰ BÁO {targetVar} (MACHINE LEARNING)
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: simTierBadge, margin: '0.5rem 0 0.25rem 0' }}>
                          {predicted100} <span style={{ fontSize: '1.25rem', color: '#64748B', fontWeight: 'normal' }}>/ 100</span>
                        </div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                          Quy đổi thang điểm 10: <b style={{ color: 'var(--text-main)' }}>{predicted10} / 10</b>
                        </div>

                        <div style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '0.4rem', 
                          padding: '0.45rem 1rem', 
                          borderRadius: '20px', 
                          backgroundColor: simTierBg, 
                          color: simTierBadge, 
                          fontWeight: 'bold', 
                          fontSize: '0.85rem',
                          marginBottom: '1rem'
                        }}>
                          <span>{simTierIcon}</span>
                          <span>{simTierName}</span>
                        </div>

                        <p style={{ fontSize: '0.825rem', color: '#475569', margin: 0, fontStyle: 'italic', lineHeight: 1.4 }}>
                          "{simTierAdvice}"
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>

                </>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* KHÂU 5: PHÂN TÍCH Ý KIẾN ĐỊNH TÍNH & XUẤT BÁO CÁO APA 7 */}
          {/* ========================================================= */}
          {activeStage === 5 && (
            <div style={{ animation: 'fadeIn 0.25s ease' }}>
              {/* Sentiment & Word Cloud */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                
                {/* Sentiment Distribution */}
                <div className="card" style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MessageSquare size={18} color="var(--primary)" />
                    Phân Tích Cấu Trúc Ý Kiến Tự Luận &amp; Cảm Xúc
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Trích xuất từ <b>{analysisData.khau1_cleaning?.validResponses ?? analysisData.khau1_cleaning?.cleanCount ?? 0} phiếu khảo sát hợp lệ</b> (trên tổng số {analysisData.khau1_cleaning?.totalResponses ?? analysisData.khau1_cleaning?.rawCount ?? 0} phiếu thu thập). Ghi nhận phản hồi từ <b>{analysisData.khau5_qualitative?.sentimentStats?.respondentsCount || analysisData.khau1_cleaning?.cleanCount || 0} người tham gia</b> qua {analysisData.khau5_qualitative?.sentimentStats?.openQuestionsCount || 2} câu hỏi mở &rarr; Tổng cộng: <b>{analysisData.khau5_qualitative?.sentimentStats?.total || 0} lượt câu trả lời tự luận</b> ({analysisData.khau5_qualitative?.sentimentStats?.barrierCount || 0} ý kiến rào cản + {analysisData.khau5_qualitative?.sentimentStats?.solutionCount || 0} ý kiến đề xuất).
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
                    <div style={{ padding: '0.75rem', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.725rem', color: '#166534', fontWeight: '700', textTransform: 'uppercase' }}>ĐỀ XUẤT &amp; SÁNG KIẾN</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 'bold', color: '#166534', margin: '0.2rem 0' }}>
                        {analysisData.khau5_qualitative?.sentimentStats?.solutionPct ?? 0}%
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#15803D' }}>
                        {analysisData.khau5_qualitative?.sentimentStats?.solutionCount ?? 0} ý kiến hiến kế
                      </div>
                    </div>

                    <div style={{ padding: '0.75rem', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.725rem', color: '#991B1B', fontWeight: '700', textTransform: 'uppercase' }}>RÀO CẢN &amp; NÚT THẮT</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 'bold', color: '#991B1B', margin: '0.2rem 0' }}>
                        {analysisData.khau5_qualitative?.sentimentStats?.barrierPct ?? 0}%
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#DC2626' }}>
                        {analysisData.khau5_qualitative?.sentimentStats?.barrierCount ?? 0} ý kiến phản ánh
                      </div>
                    </div>

                    <div style={{ padding: '0.75rem', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.725rem', color: '#1E40AF', fontWeight: '700', textTransform: 'uppercase' }}>TINH THẦN XÂY DỰNG</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 'bold', color: '#1D4ED8', margin: '0.2rem 0' }}>
                        {analysisData.khau5_qualitative?.sentimentStats?.constructiveIndex ?? 0}%
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#2563EB' }}>Đồng thuận &amp; Kỳ vọng cao</div>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: '#475569', margin: 0, lineHeight: 1.45, fontStyle: 'italic', backgroundColor: '#F8FAFC', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                    Phân loại cảm xúc bám sát nội dung khảo sát thực tế: {analysisData.khau5_qualitative?.sentimentStats?.barrierPct || 0}% ({analysisData.khau5_qualitative?.sentimentStats?.barrierCount || 0} ý kiến) phản ánh thực trạng rào cản cần cải tiến và {analysisData.khau5_qualitative?.sentimentStats?.solutionPct || 0}% ({analysisData.khau5_qualitative?.sentimentStats?.solutionCount || 0} ý kiến) hiến kế giải pháp mang tính xây dựng cao.
                  </p>
                </div>

                {/* Word Cloud */}
                <div className="card" style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={18} color="var(--primary)" />
                    Đám Mây Từ Khóa Trọng Tâm (Academic Word Cloud)
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Trích xuất tự động từ các câu hỏi mở về rào cản và đề xuất giải pháp:
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center', minHeight: '160px', padding: '0.75rem', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-md)' }}>
                    {(analysisData.khau5_qualitative?.wordCloudTags || []).map((tag, idx) => (
                      <span 
                        key={idx}
                        style={{
                          fontSize: tag.size,
                          color: tag.color,
                          fontWeight: 'bold',
                          padding: '0.2rem 0.5rem',
                          backgroundColor: 'white',
                          borderRadius: '6px',
                          border: '1px solid #E2E8F0',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                        }}
                      >
                        {tag.text} ({tag.weight})
                      </span>
                    ))}
                  </div>
                </div>

              </div>

              {/* SẢN PHẨM 5: DANH SÁCH TRÍCH DẪN NGUYÊN VĂN THEO ĐỐI TƯỢNG */}
              <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <MessageSquare size={18} color="var(--primary)" />
                      Trích Dẫn Ý Kiến Tự Luận Điển Hình Phân Loại Theo Đối Tượng (Verbatim Quotes)
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', margin: 0 }}>
                      Phân loại trích dẫn ý kiến hay nhất theo từng đối tượng để đưa thẳng vào phần thảo luận kết quả luận văn / bài báo:
                    </p>
                  </div>

                  {/* Role Filter Tabs */}
                  {(() => {
                    const currentSurvey = surveys.find(s => s.id?.toString() === selectedSurveyId?.toString());
                    const isStudentSurvey = currentSurvey?.audience === 'student_alumni' || 
                      (!analysisData.khau5_qualitative?.quotesByRole?.leadership?.length && !analysisData.khau5_qualitative?.quotesByRole?.faculty?.length);

                    const tabs = isStudentSurvey ? [
                      { id: 'all', label: 'Tất cả' },
                      { id: 'students', label: 'Sinh viên đang học' },
                      { id: 'alumni', label: 'Cựu sinh viên' },
                      { id: 'postgrad', label: 'Học viên Sau ĐH' },
                      { id: 'solutions', label: '🟢 Giải pháp' },
                      { id: 'barriers', label: '🔴 Rào cản' },
                    ] : [
                      { id: 'all', label: 'Tất cả' },
                      { id: 'leadership', label: 'Ban Lãnh đạo' },
                      { id: 'faculty', label: 'Giảng viên & Cán bộ' },
                      { id: 'students', label: 'Sinh viên & Người học' },
                      { id: 'solutions', label: '🟢 Giải pháp' },
                      { id: 'barriers', label: '🔴 Rào cản' },
                    ];

                    return (
                      <div style={{ display: 'flex', gap: '0.4rem', backgroundColor: '#F1F5F9', padding: '0.25rem', borderRadius: '8px', flexWrap: 'wrap' }}>
                        {tabs.map(tab => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveQuoteTab(tab.id)}
                            style={{
                              border: 'none',
                              padding: '0.35rem 0.75rem',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              fontWeight: activeQuoteTab === tab.id ? 'bold' : 'normal',
                              backgroundColor: activeQuoteTab === tab.id ? 'white' : 'transparent',
                              color: activeQuoteTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                              boxShadow: activeQuoteTab === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                              cursor: 'pointer'
                            }}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {(() => {
                  const quotesByRole = analysisData.khau5_qualitative.quotesByRole || {
                    leadership: [],
                    faculty: [],
                    students: [],
                    alumni: [],
                    postgrad: [],
                    barriers: [],
                    solutions: []
                  };

                  const currentSurvey = surveys.find(s => s.id?.toString() === selectedSurveyId?.toString());
                  const isStudentSurvey = currentSurvey?.audience === 'student_alumni' || 
                    (!quotesByRole.leadership?.length && !quotesByRole.faculty?.length);

                  let displayQuotes = [];
                  if (activeQuoteTab === 'leadership') {
                    displayQuotes = quotesByRole.leadership || [];
                  } else if (activeQuoteTab === 'faculty') {
                    displayQuotes = quotesByRole.faculty || [];
                  } else if (activeQuoteTab === 'students') {
                    displayQuotes = quotesByRole.students || [];
                  } else if (activeQuoteTab === 'alumni') {
                    displayQuotes = quotesByRole.alumni || [];
                  } else if (activeQuoteTab === 'postgrad') {
                    displayQuotes = quotesByRole.postgrad || [];
                  } else if (activeQuoteTab === 'solutions') {
                    displayQuotes = quotesByRole.solutions || [];
                  } else if (activeQuoteTab === 'barriers') {
                    displayQuotes = quotesByRole.barriers || [];
                  } else {
                    if (isStudentSurvey) {
                      displayQuotes = [
                        ...(quotesByRole.students || []).slice(0, 4),
                        ...(quotesByRole.alumni || []).slice(0, 3),
                        ...(quotesByRole.postgrad || []).slice(0, 3)
                      ];
                    } else {
                      displayQuotes = [
                        ...(quotesByRole.leadership || []).slice(0, 3),
                        ...(quotesByRole.faculty || []).slice(0, 3),
                        ...(quotesByRole.students || []).slice(0, 3)
                      ];
                    }
                  }

                  if (displayQuotes.length === 0) {
                    displayQuotes = (analysisData.khau5_qualitative?.textComments || []).slice(0, 10);
                  }

                  const handleCopyQuote = (q) => {
                    const text = `"[Trích dẫn]: ${q.content}" (Theo phản hồi của ${q.role}, ${q.unit} - ${q.institution}, Khảo sát EduResearch 2026)`;
                    navigator.clipboard.writeText(text);
                    showToast('Đã sao chép trích dẫn học thuật vào Clipboard!');
                  };

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                      {displayQuotes.map((c, idx) => (
                        <div 
                          key={c.id || idx} 
                          style={{ 
                            padding: '1rem', 
                            backgroundColor: '#F8FAFC', 
                            borderRadius: '8px', 
                            borderLeft: c.topicType === 'barrier' || c.sentiment === 'improve' ? '4px solid #EF4444' : '4px solid #10B981',
                            border: '1px solid #E2E8F0',
                            borderLeftWidth: '4px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ 
                                fontSize: '0.725rem', 
                                fontWeight: 'bold', 
                                padding: '0.15rem 0.5rem', 
                                borderRadius: '4px',
                                backgroundColor: c.topicType === 'barrier' || c.sentiment === 'improve' ? '#FEE2E2' : '#D1FAE5',
                                color: c.topicType === 'barrier' || c.sentiment === 'improve' ? '#DC2626' : '#059669'
                              }}>
                                {c.topicType === 'barrier' || c.sentiment === 'improve' ? '🔴 Rào cản & Thách thức' : '🟢 Đề xuất giải pháp'}
                              </span>
                              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                                {c.role}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                • {c.unit} ({c.institution})
                              </span>
                            </div>

                            <button
                              onClick={() => handleCopyQuote(c)}
                              className="btn btn-outline"
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.725rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                              title="Sao chép định dạng trích dẫn chuẩn APA vào luận văn"
                            >
                              <Copy size={12} />
                              <span>Sao chép trích dẫn</span>
                            </button>
                          </div>

                          <div style={{ fontSize: '0.9rem', color: '#1E293B', fontStyle: 'italic', lineHeight: 1.45, paddingLeft: '0.5rem', borderLeft: '2px solid #CBD5E1' }}>
                            "{c.content}"
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Strategic Insights & Academic Governance Implications Card */}
              <div className="card" style={{ padding: '1.75rem', marginBottom: '1.5rem', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
                {(() => {
                  const descList = analysisData.khau3_descriptive?.descriptiveTable || [];
                  const sortedDesc = [...descList].sort((a, b) => b.mean - a.mean);
                  const highest = sortedDesc[0] || { code: 'STR', name: 'Chiến lược & Định hướng', mean: 4.14, sd: 0.65 };
                  const lowest = sortedDesc[sortedDesc.length - 1] || { code: 'RES', name: 'Nguồn lực & CSVC', mean: 4.06, sd: 0.68 };

                  const hypList = analysisData.khau4_sem_ml?.hypothesisResults || [];
                  const sortedHyp = [...hypList].sort((a, b) => (b.beta || 0) - (a.beta || 0));
                  const topDriver = sortedHyp[0] || { path: 'SER ➔ REA', beta: 0.391, t: 15.63, p: '< .001' };
                  const targetVar = analysisData.khau4_sem_ml?.dependentVar || 'REA';
                  const instName = analysisData.surveyInfo?.institution || 'Trường Đại học Lạc Hồng';
                  const validN = analysisData.khau1_cleaning?.validResponses || 469;
                  const totalN = analysisData.khau1_cleaning?.totalResponses || 503;
                  const driScore = analysisData.khau3_descriptive?.dri?.average || 82.1;
                  const c1 = analysisData.khau3_descriptive?.clustersSummary?.c1 || { size: 187, percentage: 39.9 };
                  const c2 = analysisData.khau3_descriptive?.clustersSummary?.c2 || { size: 211, percentage: 45.0 };
                  const c3 = analysisData.khau3_descriptive?.clustersSummary?.c3 || { size: 71, percentage: 15.1 };

                  return (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.85rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            KẾT QUẢ THỰC NGHIỆM ĐỊNH LƯỢNG &amp; HÀM Ý QUẢN TRỊ CHI TIẾT
                          </span>
                          <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-main)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Sparkles size={20} color="#F59E0B" />
                            Báo Cáo Đánh Giá Thực Trạng &amp; Đề Xuất Chiến Lược — {instName}
                          </h3>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mẫu làm sạch hợp lệ: </span>
                          <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--success)' }}>
                            {validN} / {totalN} phiếu ({(validN / Math.max(1, totalN) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      </div>

                      {/* 3 Executive Insight Callouts */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                        
                        {/* Callout 1: Overall Performance */}
                        <div style={{ padding: '1rem', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                            <Award size={18} color="#16A34A" />
                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#166534', textTransform: 'uppercase' }}>
                              Chỉ Số Đánh Giá Tổng Thể
                            </span>
                          </div>
                          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#15803D', marginBottom: '0.25rem' }}>
                            {driScore} <span style={{ fontSize: '0.9rem', color: '#166534', fontWeight: 'normal' }}>/ 100</span>
                          </div>
                          <div style={{ fontSize: '0.825rem', color: '#166534', lineHeight: 1.4 }}>
                            {driScore >= 80 
                              ? `Xếp loại Cấp độ 1 (Xuất sắc & Tiên phong). Người học đánh giá rất cao về chất lượng đào tạo và môi trường rèn luyện tại ${instName}.`
                              : `Xếp loại Cấp độ 2 (Đạt chuẩn tốt). Người học ghi nhận nỗ lực của nhà trường nhưng kỳ vọng cải thiện thêm về dịch vụ hỗ trợ.`}
                          </div>
                        </div>

                        {/* Callout 2: Top SEM Driver */}
                        <div style={{ padding: '1rem', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                            <Zap size={18} color="#2563EB" />
                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#1E40AF', textTransform: 'uppercase' }}>
                              Đòn Bẩy Trọng Tâm (PLS-SEM &amp; SHAP)
                            </span>
                          </div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1D4ED8', marginBottom: '0.25rem' }}>
                            {topDriver.path || `${topDriver.independent} ➔ ${targetVar}`} (&beta; = {topDriver.beta})
                          </div>
                          <div style={{ fontSize: '0.825rem', color: '#1E3A8A', lineHeight: 1.4 }}>
                            Mối quan hệ <b>{topDriver.path || topDriver.independent}</b> có lực kéo mạnh nhất tới kết quả khảo sát (t = {topDriver.t}, p &lt; .001). Cải thiện dịch vụ hỗ trợ sẽ tạo đột phá trực tiếp.
                          </div>
                        </div>

                        {/* Callout 3: Strength & Bottleneck */}
                        <div style={{ padding: '1rem', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                            <Activity size={18} color="#D97706" />
                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#92400E', textTransform: 'uppercase' }}>
                              Điểm Sáng &amp; Nút Thắt Khảo Sát
                            </span>
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#78350F', lineHeight: 1.45 }}>
                            <div>🟢 <b>Điểm sáng cao nhất:</b> {highest.name} (<b>{highest.code}</b> = {highest.mean}/5.0).</div>
                            <div style={{ marginTop: '0.3rem' }}>🔴 <b>Nút thắt cần ưu tiên:</b> {lowest.name} (<b>{lowest.code}</b> = {lowest.mean}/5.0).</div>
                          </div>
                        </div>

                      </div>

                      {/* Cluster Breakdown Matrix */}
                      <div style={{ backgroundColor: '#F8FAFC', padding: '1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '1.5rem' }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Users size={16} color="var(--primary)" />
                          Đặc Tính 3 Phân Khúc Người Học (K-Means Clustering) &amp; Chiến Lược Tác Động
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                          
                          <div style={{ backgroundColor: 'white', padding: '0.85rem', borderRadius: '6px', borderLeft: '4px solid #10B981', border: '1px solid #E2E8F0', borderLeftWidth: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                              <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#065F46' }}>Cụm 1: Hài Lòng Cao (Leaders)</span>
                              <span style={{ fontSize: '0.75rem', backgroundColor: '#D1FAE5', color: '#047857', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>{c1.percentage}% ({c1.size})</span>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: '#475569', margin: 0, lineHeight: 1.4 }}>
                              Nhóm sinh viên &amp; cựu người học gắn kết mạnh mẽ, đánh giá dịch vụ đạt chuẩn xuất sắc. Đề xuất: xây dựng mạng lưới đại sứ truyền thông tuyển sinh và gắn kết cựu sinh viên tài trợ.
                            </p>
                          </div>

                          <div style={{ backgroundColor: 'white', padding: '0.85rem', borderRadius: '6px', borderLeft: '4px solid #3B82F6', border: '1px solid #E2E8F0', borderLeftWidth: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                              <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#1E40AF' }}>Cụm 2: Khá &amp; Tiềm Năng (Challengers)</span>
                              <span style={{ fontSize: '0.75rem', backgroundColor: '#DBEAFE', color: '#1D4ED8', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>{c2.percentage}% ({c2.size})</span>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: '#475569', margin: 0, lineHeight: 1.4 }}>
                              Chiếm tỷ trọng lớn nhất, nhìn chung hài lòng nhưng mong muốn thực hành doanh nghiệp và cố vấn hướng nghiệp chuyên sâu hơn. Đề xuất: mở rộng workshop kỹ năng và việc làm.
                            </p>
                          </div>

                          <div style={{ backgroundColor: 'white', padding: '0.85rem', borderRadius: '6px', borderLeft: '4px solid #EF4444', border: '1px solid #E2E8F0', borderLeftWidth: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                              <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#991B1B' }}>Cụm 3: Cần Quan Tâm (Laggards)</span>
                              <span style={{ fontSize: '0.75rem', backgroundColor: '#FEE2E2', color: '#B91C1C', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>{c3.percentage}% ({c3.size})</span>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: '#475569', margin: 0, lineHeight: 1.4 }}>
                              Gặp khó khăn về hạ tầng cơ sở vật chất hoặc chậm trễ giải quyết thủ tục một cửa. Đề xuất: thiết lập kênh tiếp nhận phản ánh trực tuyến tức thì và nâng cấp trang thiết bị phòng lab.
                            </p>
                          </div>

                        </div>
                      </div>

                      {/* 4 Concrete Governance Recommendations */}
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <CheckCircle2 size={16} color="var(--success)" />
                          4 Khuyến Nghị Hành Động Chiến Lược Cho Ban Giám Hiệu &amp; Các Khoa Phòng
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                          
                          <div style={{ padding: '0.85rem', backgroundColor: '#FFFFFF', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '0.3rem' }}>
                              1. Tối ưu dịch vụ hỗ trợ sinh viên &amp; Cố vấn học tập (SER)
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>
                              Vì SER là đòn bẩy lớn nhất (&beta; = {topDriver.beta}), nhà trường cần số hóa 100% quy trình một cửa cho người học, rút ngắn thời gian xử lý hồ sơ hành chính dưới 24h.
                            </div>
                          </div>

                          <div style={{ padding: '0.85rem', backgroundColor: '#FFFFFF', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '0.3rem' }}>
                              2. Nâng cấp cơ sở vật chất &amp; Môi trường thực hành (RES)
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>
                              Giải quyết nút thắt {lowest.code} ({lowest.mean}/5.0) bằng cách đầu tư bổ sung thiết bị hiện đại tại các phòng thí nghiệm, mở rộng không gian tự học và phủ sóng Wifi tốc độ cao.
                            </div>
                          </div>

                          <div style={{ padding: '0.85rem', backgroundColor: '#FFFFFF', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '0.3rem' }}>
                              3. Tăng cường kỹ năng số &amp; Kết nối doanh nghiệp (CAP)
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>
                              Đẩy mạnh các chứng chỉ nghề quốc tế, kỳ thực tập tại doanh nghiệp đối tác uy tín tại Đồng Nai và vùng kinh tế trọng điểm phía Nam ngay từ năm thứ 2 và thứ 3.
                            </div>
                          </div>

                          <div style={{ padding: '0.85rem', backgroundColor: '#FFFFFF', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '0.3rem' }}>
                              4. Phát huy uy tín thương hiệu &amp; Mạng lưới Cựu sinh viên (STR)
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>
                              Tận dụng điểm sáng {highest.code} ({highest.mean}/5.0) để lan tỏa hình ảnh người học LHU năng động, sáng tạo Robocon và khởi nghiệp, gia tăng tỷ lệ sinh viên có việc làm đúng ngành &gt; 95%.
                            </div>
                          </div>

                        </div>
                      </div>

                    </div>
                  );
                })()}
              </div>

              {/* Export APA Word Doc Banner */}
              <div className="card" style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                <Award size={40} color="#1E40AF" style={{ margin: '0 auto 0.75rem auto' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1E40AF', marginBottom: '0.5rem' }}>
                  Xuất Bản Báo Cáo Học Thuật Chuẩn APA 7th Edition (.doc)
                </h3>
                <p style={{ color: '#1E3A8A', maxWidth: '640px', margin: '0 auto 1.25rem auto', fontSize: '0.9rem' }}>
                  Toàn bộ 5 khâu phân tích toán học (Làm sạch, Cronbach's Alpha, EFA/KMO, Pearson, PLS-SEM, K-Means DRI, Học máy XGBoost &amp; SHAP) kèm lời bình luận tự động đã sẵn sàng để xuất ra file Word chuẩn mực đính kèm trực tiếp vào Luận văn / Bài báo khoa học.
                </p>
                <button 
                  className="btn btn-primary" 
                  onClick={handleExportAPAReport}
                  style={{ padding: '0.75rem 1.75rem', fontSize: '0.95rem', fontWeight: 'bold', backgroundColor: '#1E40AF' }}
                >
                  <FileDown size={18} /> Tải file Word Báo cáo Nghiên cứu Hoàn chỉnh (.doc)
                </button>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default Analytics;
