import React, { useState, useEffect } from 'react';
import { Download, Upload, Filter, MessageSquare, CheckCircle, XCircle, Trash2, Eye, X, ExternalLink, Sparkles, AlertTriangle, FileSpreadsheet, Building2, School, Hash, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { responsesAPI, surveysAPI } from '../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import Toast from '../components/Toast';
import { SkeletonStatCard, SkeletonChart, SkeletonTableRows } from '../components/Skeleton';

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6B7280'];

const Responses = () => {
  const { currentUser } = useAuth();
  const [surveys, setSurveys] = useState([]);
  const [selectedSurveyId, setSelectedSurveyId] = useState('');
  const [data, setData] = useState({ list: [], stats: { total: 0, valid: 0, invalid: 0 }, charts: { roleData: [], genderData: [] } });
  const [loading, setLoading] = useState(true);

  // Status & Institution Filters
  const [statusFilter, setStatusFilter] = useState('all'); // all, valid, invalid
  const [institutionFilter, setInstitutionFilter] = useState('all');

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Helper hiển thị ngày tháng
  const formatDisplayDate = (val) => {
    if (!val) return '';
    if (typeof val === 'string' && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(val)) return val;
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  // Modals
  const [viewResponse, setViewResponse] = useState(null);
  const [showCleanModal, setShowCleanModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Import State
  const [parsedImportData, setParsedImportData] = useState([]);
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);
  const [importSurveyId, setImportSurveyId] = useState('');
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Toast
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 3000);
  };

  // Load surveys list
  useEffect(() => {
    const fetchSurveysList = async () => {
      try {
        const sList = await surveysAPI.getAll();
        setSurveys(sList);
        if (sList.length > 0) {
          setSelectedSurveyId(sList[0].id.toString());
        }
      } catch (err) {
        console.error('Error fetching surveys for responses:', err);
      }
    };
    fetchSurveysList();
  }, []);

  // Fetch responses when selected survey changes
  const fetchResponses = async (surveyId = selectedSurveyId) => {
    try {
      setLoading(true);
      const result = await responsesAPI.getBySurvey(surveyId);
      setData(result);
    } catch (error) {
      console.error('Error fetching responses:', error);
      showToast('Không thể tải dữ liệu phản hồi', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResponses();
  }, [selectedSurveyId]);

  const handleDeleteResponse = async (id) => {
    try {
      await responsesAPI.delete(id);
      showToast('Đã xóa phản hồi thành công!');
      fetchResponses();
    } catch (err) {
      showToast(err.message || 'Lỗi khi xóa phản hồi', 'error');
    }
  };

  // Export to Excel / CSV with UTF-8 BOM
  const handleExportExcel = () => {
    if (data.list.length === 0) {
      showToast('Không có dữ liệu để xuất', 'error');
      return;
    }

    const headers = ['Mã phản hồi', 'Khảo sát ID', 'Trường / Cơ sở', 'Đối tượng / Chức vụ', 'Khoa / Đơn vị', 'Giới tính', 'Thời gian làm bài', 'Trạng thái', 'Ngày nhận'];
    const rows = data.list.map(r => [
      `#${r.id}`,
      r.survey_id,
      `"${r.institution || 'Cơ sở giáo dục'}"`,
      `"${r.role}"`,
      `"${r.unit}"`,
      `"${r.gender}"`,
      `"${r.time_taken}"`,
      r.status === 'valid' ? 'Hợp lệ' : 'Không hợp lệ',
      `"${formatDisplayDate(r.date)}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `danh_sach_phan_hoi_khao_sat_${selectedSurveyId || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã xuất dữ liệu phản hồi ra file CSV (Excel) thành công!');
  };

  // Smart Data Cleaning: phát hiện straightlining hoặc speeders
  const detectSuspectResponses = (list) => {
    return list.filter(r => {
      const timeStr = (r.time_taken || '').toLowerCase();
      const isFast = (timeStr.includes('giây') && parseInt(timeStr) < 25) || timeStr.includes('15s') || timeStr.includes('10s');
      
      let isStraightlining = false;
      if (r.answers && typeof r.answers === 'object') {
        const numericValues = Object.values(r.answers).filter(v => typeof v === 'number' || (!isNaN(Number(v)) && typeof v !== 'boolean')).map(Number);
        if (numericValues.length >= 4) {
          const first = numericValues[0];
          const allSame = numericValues.every(v => v === first);
          if (allSame) isStraightlining = true;
        }
      }
      return isFast || isStraightlining || r.status === 'invalid';
    });
  };

  const suspectResponses = detectSuspectResponses(data.list);

  // Bulk selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredList.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBulkStatus = async (status) => {
    if (selectedIds.length === 0 || bulkProcessing) return;
    try {
      setBulkProcessing(true);
      await responsesAPI.bulkStatus(selectedIds, status);
      showToast(`Đã cập nhật trạng thái ${selectedIds.length} phiếu thành "${status === 'valid' ? 'Hợp lệ' : 'Không hợp lệ'}"!`);
      setSelectedIds([]);
      await fetchResponses();
    } catch (err) {
      showToast(err.message || 'Lỗi cập nhật hàng loạt', 'error');
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0 || bulkProcessing) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn ${selectedIds.length} phiếu đã chọn?`)) return;
    try {
      setBulkProcessing(true);
      await responsesAPI.bulkDelete(selectedIds, selectedSurveyId && selectedSurveyId !== 'all' ? selectedSurveyId : null);
      showToast(`Đã xóa thành công ${selectedIds.length} phiếu phản hồi!`);
      setSelectedIds([]);
      await fetchResponses();
    } catch (err) {
      showToast(err.message || 'Lỗi xóa hàng loạt', 'error');
    } finally {
      setBulkProcessing(false);
    }
  };

  // Đánh số lại ID toàn bộ phản hồi từ #1 đến #N
  const handleReindexIds = async () => {
    if (bulkProcessing) return;
    if (!window.confirm('Bạn có muốn đánh số lại toàn bộ ID của các phiếu phản hồi từ #1 đến #N theo thứ tự chuẩn không? Chuỗi ID mới tiếp theo cũng sẽ tự động tính từ N + 1.')) return;
    try {
      setBulkProcessing(true);
      const res = await responsesAPI.reindexIds();
      showToast(res?.message || 'Đã đánh số lại ID toàn bộ phản hồi thành công!');
      await fetchResponses();
    } catch (err) {
      showToast(err.message || 'Lỗi khi đánh số lại ID', 'error');
    } finally {
      setBulkProcessing(false);
    }
  };

  // Xóa toàn bộ phản hồi và khởi tạo chuỗi ID về 1
  const handleClearAllResponses = async () => {
    if (bulkProcessing) return;
    const surveyLabel = selectedSurveyId && selectedSurveyId !== 'all' ? `của Khảo sát #${selectedSurveyId}` : 'toàn bộ hệ thống';
    if (!window.confirm(`CẢNH BÁO: Bạn có chắc chắn muốn XÓA SẠCH tất cả phiếu phản hồi ${surveyLabel}? Chuỗi ID sẽ được khởi tạo lại về #1 cho các phiếu nộp mới sau này!`)) return;
    try {
      setBulkProcessing(true);
      const res = await responsesAPI.clearAll(selectedSurveyId && selectedSurveyId !== 'all' ? selectedSurveyId : null);
      showToast(res?.message || 'Đã xóa sạch dữ liệu và khởi tạo lại chuỗi ID về 1!');
      setSelectedIds([]);
      await fetchResponses();
    } catch (err) {
      showToast(err.message || 'Lỗi khi xóa sạch phản hồi', 'error');
    } finally {
      setBulkProcessing(false);
    }
  };

  // 1-Click loại trừ phiếu nghi vấn (Đánh dấu không hợp lệ)
  const handleExcludeSuspects = async () => {
    if (bulkProcessing) return;
    try {
      setBulkProcessing(true);
      const suspectIds = suspectResponses.map(r => r.id);
      if (suspectIds.length === 0) {
        showToast('Không có phiếu lỗi nào cần xử lý!');
        return;
      }
      await responsesAPI.bulkStatus(suspectIds, 'invalid');
      showToast(`Đã loại trừ ${suspectIds.length} phiếu nghi vấn (chuyển Không hợp lệ)!`);
      setShowCleanModal(false);
      await fetchResponses();
    } catch (err) {
      showToast(err.message || 'Lỗi khi loại trừ phiếu nghi vấn', 'error');
    } finally {
      setBulkProcessing(false);
    }
  };

  // Xóa vĩnh viễn toàn bộ phiếu nghi vấn khỏi cơ sở dữ liệu
  const handlePermanentDeleteSuspects = async () => {
    if (bulkProcessing) return;
    const suspectIds = suspectResponses.map(r => r.id);
    if (suspectIds.length === 0) {
      showToast('Không có phiếu lỗi nào cần xử lý!');
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn XÓA VĨNH VIỄN ${suspectIds.length} phiếu lỗi khỏi cơ sở dữ liệu?`)) return;
    try {
      setBulkProcessing(true);
      await responsesAPI.bulkDelete(suspectIds, selectedSurveyId && selectedSurveyId !== 'all' ? selectedSurveyId : null);
      showToast(`Đã xóa vĩnh viễn ${suspectIds.length} phiếu lỗi khỏi hệ thống!`);
      setShowCleanModal(false);
      await fetchResponses();
    } catch (err) {
      showToast(err.message || 'Lỗi khi xóa phiếu lỗi', 'error');
    } finally {
      setBulkProcessing(false);
    }
  };

  // Tải file mẫu CSV theo đúng khảo sát đang chọn
  const handleDownloadTemplate = () => {
    const targetId = importSurveyId || selectedSurveyId;
    const currentSurvey = surveys.find(s => s.id.toString() === targetId?.toString()) || surveys[0];
    
    let likertCodes = [];
    if (currentSurvey && currentSurvey.questions) {
      const qs = typeof currentSurvey.questions === 'string' ? JSON.parse(currentSurvey.questions) : currentSurvey.questions;
      likertCodes = qs.filter(q => !q.type || q.type === 'likert').map(q => q.code);
    }
    if (likertCodes.length === 0) {
      likertCodes = ['SER1', 'SER2', 'SER3', 'SER4', 'RES1', 'RES2', 'CAP1', 'STR1', 'REA1', 'REA2'];
    }

    const headers = ['role', 'unit', 'institution', 'gender', 'time_taken', 'status', ...likertCodes, 'TXT_BARRIER', 'TXT_SUGGESTION'].join(',');
    const sampleScores1 = likertCodes.map(() => 4).join(',');
    const sampleScores2 = likertCodes.map(() => 5).join(',');
    const instName = currentSurvey?.institution || 'Trường Đại học Lạc Hồng';
    const sampleRow1 = `Sinh viên đang theo học (Năm 1 - 2),Khoa Công nghệ Thông tin,"${instName}",Nam,4 phút 20 giây,valid,${sampleScores1},"Cần nâng cấp hạ tầng mạng Wifi","Tăng cường các buổi tọa đàm với chuyên gia doanh nghiệp"`;
    const sampleRow2 = `Sinh viên đang theo học (Năm 3 - 4),Khoa Quản trị - Kinh tế Quốc tế,"${instName}",Nữ,5 phút 10 giây,valid,${sampleScores2},"Hệ thống LMS cần đồng bộ bài thi nhanh hơn","Mở rộng không gian Co-working space 24/7"`;
    
    const csvContent = '\uFEFF' + [headers, sampleRow1, sampleRow2].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mau_nhap_lieu_khao_sat_${currentSurvey?.id || 'eduresearch'}.csv`;
    link.click();
    showToast('Đã tải xuống file CSV mẫu theo chuẩn câu hỏi của khảo sát!');
  };

  // Parse CSV text sang danh sách đối tượng
  const parseCSVText = (text) => {
    const cleanText = text.replace(/^\uFEFF/, '');
    const lines = cleanText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = [];
    
    for (let i = 1; i < lines.length; i++) {
      const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
      const values = [];
      let match;
      while ((match = regex.exec(lines[i])) !== null) {
        if (match.index === regex.lastIndex) regex.lastIndex++;
        let val = match[1] || '';
        val = val.trim().replace(/^"|"$/g, '').replace(/""/g, '"');
        values.push(val);
        if (regex.lastIndex >= lines[i].length) break;
      }
      
      const rowObj = {};
      const answersObj = {};
      
      headers.forEach((h, idx) => {
        const val = values[idx] || '';
        if (['role', 'unit', 'institution', 'gender', 'time_taken', 'status'].includes(h)) {
          rowObj[h] = val;
        } else if (h) {
          const num = Number(val);
          answersObj[h] = isNaN(num) || val === '' ? val : num;
        }
      });
      
      rowObj.answers = answersObj;
      if (!rowObj.role) rowObj.role = 'Người tham gia';
      if (!rowObj.unit) rowObj.unit = 'Đơn vị khảo sát';
      if (!rowObj.institution) rowObj.institution = 'Cơ sở giáo dục đại học';
      if (!rowObj.status) rowObj.status = 'valid';
      if (!rowObj.time_taken) rowObj.time_taken = '3 phút';
      
      rows.push(rowObj);
    }
    return rows;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const parsed = parseCSVText(text);
      setParsedImportData(parsed);
      setImportText(text);
      showToast(`Đã đọc thành công ${parsed.length} dòng dữ liệu từ file!`);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    const targetSurveyId = importSurveyId || (selectedSurveyId && selectedSurveyId !== 'all' ? selectedSurveyId : '');
    if (!targetSurveyId) {
      showToast('Vui lòng chọn khảo sát đích trước khi nhập dữ liệu', 'error');
      return;
    }
    if (parsedImportData.length === 0) {
      showToast('Chưa có dữ liệu nào để nhập', 'error');
      return;
    }
    try {
      setImporting(true);
      const res = await responsesAPI.import(targetSurveyId, parsedImportData);
      const importedCount = res?.count ?? parsedImportData.length;

      // Đóng popup và xóa dữ liệu tạm ngay khi nhập thành công
      setShowImportModal(false);
      setParsedImportData([]);
      setImportText('');
      showToast(res?.message || `Đã nhập thành công ${importedCount} phiếu phản hồi vào hệ thống!`);

      // Cập nhật lại danh sách phản hồi ngay sau khi thêm
      const targetIdStr = String(targetSurveyId);
      if (!selectedSurveyId || selectedSurveyId === 'all') {
        await fetchResponses(selectedSurveyId);
      } else if (selectedSurveyId !== targetIdStr) {
        setSelectedSurveyId(targetIdStr);
      } else {
        await fetchResponses(targetIdStr);
      }
    } catch (err) {
      showToast(err.message || 'Lỗi khi nhập dữ liệu', 'error');
    } finally {
      setImporting(false);
    }
  };

  const uniqueInstitutions = Array.from(new Set(data.list.map(r => r.institution).filter(Boolean)));

  const filteredList = data.list.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (institutionFilter !== 'all' && (r.institution || '') !== institutionFilter) return false;
    return true;
  });

  const getStatusBadge = (status) => {
    return status === 'valid' 
      ? <span className="badge" style={{ backgroundColor: '#D1FAE5', color: '#10B981', border: '1px solid #A7F3D0' }}><CheckCircle size={14} style={{ marginRight: '4px' }}/> Hợp lệ</span>
      : <span className="badge" style={{ backgroundColor: '#FEE2E2', color: '#EF4444', border: '1px solid #FECACA' }}><XCircle size={14} style={{ marginRight: '4px' }}/> Không hợp lệ</span>;
  };

  return (
    <div>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Phản hồi khảo sát</h1>
          <p style={{ color: 'var(--text-muted)' }}>Dữ liệu phiếu thu thập trực tuyến theo trường/đơn vị &amp; Quản lý làm sạch dữ liệu</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select 
            className="input" 
            style={{ backgroundColor: '#F9FAFB', border: '1px solid var(--border-color)', minWidth: '220px' }}
            value={selectedSurveyId}
            onChange={(e) => setSelectedSurveyId(e.target.value)}
          >
            <option value="">Tất cả khảo sát</option>
            {surveys.map(s => (
              <option key={s.id} value={s.id}>
                #{s.id} - {s.title}
              </option>
            ))}
          </select>

          {/* LỌC THEO TRƯỜNG / CƠ SỞ */}
          <select 
            className="input"
            style={{ backgroundColor: '#F9FAFB', border: '1px solid var(--border-color)', minWidth: '180px' }}
            value={institutionFilter}
            onChange={(e) => setInstitutionFilter(e.target.value)}
          >
            <option value="all">Tất cả Trường / Đơn vị</option>
            {uniqueInstitutions.map(inst => (
              <option key={inst} value={inst}>{inst}</option>
            ))}
          </select>

          <select 
            className="input"
            style={{ backgroundColor: '#F9FAFB', border: '1px solid var(--border-color)', width: '150px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="valid">Hợp lệ</option>
            <option value="invalid">Không hợp lệ</option>
          </select>

          {/* NÚT LỌC SẠCH DỮ LIỆU THÔNG MINH */}
          <button 
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', color: '#2563EB', fontWeight: '600' }}
            onClick={() => setShowCleanModal(true)}
            title="Quét và xử lý các phiếu bất thường (Straightlining, Speeders)"
          >
            <Sparkles size={16} />
            Lọc sạch dữ liệu ({suspectResponses.length})
          </button>

          {/* CHUYỂN SANG PHÂN TÍCH 5 KHÂU */}
          <Link 
            to={`/analytics?surveyId=${selectedSurveyId || ''}`}
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#F0FDF4', borderColor: '#BBF7D0', color: '#166534', fontWeight: '600', textDecoration: 'none' }}
            title="Chuyển sang phân tích thống kê 5 khâu chuẩn APA 7th Edition"
          >
            <Sparkles size={16} />
            Phân tích 5 khâu APA 7
          </Link>

          {/* NÚT ĐÁNH SỐ LẠI ID */}
          {currentUser?.role !== 'viewer' && data.list.length > 0 && (
            <button 
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#334155', fontWeight: '600' }}
              onClick={handleReindexIds}
              disabled={bulkProcessing}
              title="Đánh số lại toàn bộ ID từ #1 đến #N và reset chuỗi sinh mã tự động"
            >
              <Hash size={16} />
              {bulkProcessing ? 'Đang xử lý...' : 'Đánh số lại ID (1...N)'}
            </button>
          )}

          {/* NÚT ĐẶT LẠI DỮ LIỆU / XÓA SẠCH */}
          {currentUser?.role !== 'viewer' && data.list.length > 0 && (
            <button 
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#FFF1F2', borderColor: '#FECDD3', color: '#BE123C', fontWeight: '600' }}
              onClick={handleClearAllResponses}
              disabled={bulkProcessing}
              title="Xóa toàn bộ phản hồi và reset ID về 1 cho các phiếu mới"
            >
              <RotateCcw size={15} />
              Xóa sạch (Reset về 1)
            </button>
          )}

          {/* NÚT NHẬP EXCEL / CSV */}
          {currentUser?.role !== 'viewer' && (
            <button 
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={() => {
                const initId = (selectedSurveyId && selectedSurveyId !== 'all')
                  ? selectedSurveyId
                  : (surveys.length > 0 ? surveys[0].id.toString() : '');
                setImportSurveyId(initId);
                setShowImportModal(true);
              }}
            >
              <Upload size={16} /> 
              Nhập Excel/CSV
            </button>
          )}

          <button className="btn btn-primary" onClick={handleExportExcel}>
            <Download size={18} /> 
            Xuất Excel
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          {/* 3 Stat Cards Skeleton */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </div>

          {/* 2 Charts Skeleton */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <SkeletonChart height="240px" />
            <SkeletonChart height="240px" />
          </div>

          {/* Table Skeleton */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-container">
              <table className="table" style={{ fontSize: '0.875rem' }}>
                <thead style={{ backgroundColor: '#F9FAFB' }}>
                  <tr>
                    <th style={{ width: '40px' }}></th>
                    <th style={{ width: '60px' }}>Mã #</th>
                    <th>Trường / Cơ sở</th>
                    <th>Đối tượng</th>
                    <th>Đơn vị</th>
                    <th>Giới tính</th>
                    <th>Thời gian</th>
                    <th>Ngày gửi</th>
                    <th>Trạng thái</th>
                    <th style={{ textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <SkeletonTableRows columns={10} rows={5} />
              </table>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem' }}>
              <div style={{ padding: '1rem', backgroundColor: '#EFF6FF', borderRadius: 'var(--radius-lg)', color: '#3B82F6' }}>
                <MessageSquare size={32} />
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{data.stats.total}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Tổng số phản hồi</div>
              </div>
            </div>
            
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem' }}>
              <div style={{ padding: '1rem', backgroundColor: '#D1FAE5', borderRadius: 'var(--radius-lg)', color: '#10B981' }}>
                <CheckCircle size={32} />
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{data.stats.valid}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Phản hồi hợp lệ</div>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem' }}>
              <div style={{ padding: '1rem', backgroundColor: '#FEE2E2', borderRadius: 'var(--radius-lg)', color: '#EF4444' }}>
                <XCircle size={32} />
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{data.stats.invalid}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Phản hồi không hợp lệ</div>
              </div>
            </div>
          </div>

          {data.list.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '2rem' }}>
              <div className="card">
                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center' }}>Phân bố Giới tính</h3>
                <div style={{ height: '240px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.charts.genderData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {data.charts.genderData?.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  {data.charts.genderData?.map((item, index) => (
                    <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length] }}></span>
                      {item.name}: {item.value}
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Phân bố Đối tượng tham gia</h3>
                <div style={{ height: '240px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={data.charts.roleData} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#4B5563', fontSize: 12, fontWeight: 500}} width={100} />
                      <Tooltip cursor={{fill: '#F3F4F6'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                      <Bar dataKey="value" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {filteredList.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <MessageSquare size={28} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>Chưa có phản hồi nào</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: '420px' }}>
                Khảo sát này chưa có phiếu trả lời nào. Bạn có thể mở biểu mẫu trực tuyến để điền thử nghiệm hoặc chia sẻ đường dẫn cho đối tượng nghiên cứu.
              </p>
              <Link 
                to={selectedSurveyId && selectedSurveyId !== 'all' ? `/survey/${selectedSurveyId}` : (surveys[0]?.id ? `/survey/${surveys[0].id}` : '/survey')} 
                className="btn btn-primary" 
                target="_blank"
              >
                <ExternalLink size={16} />
                Mở khảo sát trực tuyến
              </Link>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* THANH THAO TÁC HÀNG LOẠT KHI CÓ CHỌN PHIẾU */}
              {selectedIds.length > 0 && (
                <div style={{
                  backgroundColor: '#EEF2FF',
                  borderBottom: '1px solid #C7D2FE',
                  padding: '0.75rem 1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '0.875rem' }}>
                      Đã chọn {selectedIds.length} / {filteredList.length} phiếu
                    </span>
                    <button 
                      className="btn-outline" 
                      style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: 'white' }}
                      onClick={() => setSelectedIds([])}
                    >
                      Bỏ chọn tất cả
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      className="btn btn-outline"
                      style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', backgroundColor: '#D1FAE5', color: '#065F46', borderColor: '#A7F3D0' }}
                      onClick={() => handleBulkStatus('valid')}
                      disabled={bulkProcessing}
                    >
                      <CheckCircle size={14} /> {bulkProcessing ? 'Đang lưu...' : 'Đánh dấu Hợp lệ'}
                    </button>
                    <button 
                      className="btn btn-outline"
                      style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', backgroundColor: '#FEF3C7', color: '#92400E', borderColor: '#FDE68A' }}
                      onClick={() => handleBulkStatus('invalid')}
                      disabled={bulkProcessing}
                    >
                      <XCircle size={14} /> {bulkProcessing ? 'Đang lưu...' : 'Đánh dấu Nghi vấn / Loại trừ'}
                    </button>
                    {currentUser?.role !== 'viewer' && (
                      <button 
                        className="btn btn-outline"
                        style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', backgroundColor: '#FEE2E2', color: '#991B1B', borderColor: '#FECACA' }}
                        onClick={handleBulkDelete}
                        disabled={bulkProcessing}
                      >
                        <Trash2 size={14} /> {bulkProcessing ? 'Đang xóa...' : `Xóa ${selectedIds.length} phiếu`}
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="table-container">
                <table className="table" style={{ fontSize: '0.875rem' }}>
                  <thead style={{ backgroundColor: '#F9FAFB' }}>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={filteredList.length > 0 && selectedIds.length === filteredList.length}
                          onChange={handleSelectAll}
                          style={{ cursor: 'pointer' }}
                        />
                      </th>
                      <th style={{ width: '60px' }}>Mã #</th>
                      <th>Trường / Cơ sở</th>
                      <th>Đối tượng</th>
                      <th>Đơn vị</th>
                      <th>Giới tính</th>
                      <th>Thời gian hoàn thành</th>
                      <th>Ngày gửi</th>
                      <th>Trạng thái</th>
                      <th style={{ textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredList.map((res) => (
                      <tr key={res.id} style={{ backgroundColor: selectedIds.includes(res.id) ? '#F5F3FF' : 'inherit' }}>
                        <td style={{ textAlign: 'center' }}>
                          <input 
                            type="checkbox" 
                            checked={selectedIds.includes(res.id)}
                            onChange={() => handleToggleSelect(res.id)}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
                        <td style={{ fontWeight: '600', color: 'var(--text-muted)' }}>#{res.id}</td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: '600', padding: '0.15rem 0.45rem', backgroundColor: '#F3E8FF', color: '#6B21A8', borderRadius: '4px' }}>
                            <Building2 size={12} />
                            {res.institution || 'Cơ sở giáo dục'}
                          </span>
                        </td>
                        <td style={{ fontWeight: '600' }}>{res.role}</td>
                        <td>{res.unit}</td>
                        <td>{res.gender}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{res.time_taken}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{formatDisplayDate(res.date)}</td>
                        <td>{getStatusBadge(res.status)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <button 
                              className="btn-outline" 
                              style={{ padding: '0.375rem', borderRadius: 'var(--radius-md)', color: 'var(--primary)' }}
                              title="Xem chi tiết"
                              onClick={() => setViewResponse(res)}
                            >
                              <Eye size={16} />
                            </button>
                            {currentUser?.role !== 'viewer' && (
                              <button 
                                className="btn-outline" 
                                style={{ padding: '0.375rem', borderRadius: 'var(--radius-md)', color: 'var(--danger)' }}
                                title="Xóa phản hồi"
                                onClick={() => handleDeleteResponse(res.id)}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal Xem chi tiết phản hồi */}
      {viewResponse && (
        <div className="modal-backdrop" onClick={() => setViewResponse(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Chi tiết phiếu phản hồi #{viewResponse.id}</h2>
              <button className="modal-close-btn" onClick={() => setViewResponse(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Trường / Cơ sở đào tạo</div>
                  <div style={{ fontWeight: '700', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Building2 size={14} />
                    {viewResponse.institution || 'Cơ sở giáo dục đại học'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Trạng thái</div>
                  <div>{getStatusBadge(viewResponse.status)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Khảo sát ID</div>
                  <div style={{ fontWeight: '600' }}>Khảo sát #{viewResponse.survey_id}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Đối tượng / Chức vụ</div>
                  <div style={{ fontWeight: '600' }}>{viewResponse.role}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Đơn vị / Khoa phòng</div>
                  <div style={{ fontWeight: '600' }}>{viewResponse.unit}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Giới tính</div>
                  <div style={{ fontWeight: '600' }}>{viewResponse.gender}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Thời gian thực hiện</div>
                  <div style={{ fontWeight: '600' }}>{viewResponse.time_taken}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Thời điểm nhận phiếu</div>
                  <div style={{ fontWeight: '600' }}>{formatDisplayDate(viewResponse.date)}</div>
                </div>
              </div>

              {/* CÂU TRẢ LỜI CỤ THỂ (LIKERT & Ý KIẾN VĂN BẢN) */}
              {viewResponse.answers && Object.keys(viewResponse.answers).length > 0 && (
                <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--text-main)' }}>
                    Chi tiết câu trả lời thu thập được:
                  </div>

                  {/* THANG ĐO LIKERT */}
                  {Object.entries(viewResponse.answers).filter(([_, val]) => typeof val === 'number' || (!isNaN(Number(val)) && typeof val !== 'boolean')).length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        Điểm đánh giá thang đo (Likert):
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {Object.entries(viewResponse.answers)
                          .filter(([_, val]) => typeof val === 'number' || (!isNaN(Number(val)) && typeof val !== 'boolean'))
                          .map(([key, val]) => (
                            <span 
                              key={key} 
                              style={{ 
                                fontSize: '0.75rem', 
                                padding: '0.2rem 0.5rem', 
                                backgroundColor: '#EEF2FF', 
                                color: 'var(--primary)', 
                                borderRadius: '4px',
                                border: '1px solid #C7D2FE',
                                fontWeight: '600'
                              }}
                            >
                              {key}: {val}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Ý KIẾN ĐỊNH TÍNH VĂN BẢN (TEXT/TEXTAREA) */}
                  {Object.entries(viewResponse.answers).filter(([_, val]) => typeof val === 'string' && isNaN(Number(val)) && val.trim().length > 0).length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#B45309' }}>
                        Ý kiến đóng góp &amp; Nhận xét tự luận (Định tính):
                      </div>
                      {Object.entries(viewResponse.answers)
                        .filter(([_, val]) => typeof val === 'string' && isNaN(Number(val)) && val.trim().length > 0)
                        .map(([key, val]) => (
                          <div 
                            key={key} 
                            style={{ 
                              padding: '0.75rem 1rem', 
                              backgroundColor: '#FFFBEB', 
                              borderRadius: 'var(--radius-md)', 
                              border: '1px solid #FDE68A' 
                            }}
                          >
                            <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#92400E', backgroundColor: '#FEF3C7', padding: '0.1rem 0.4rem', borderRadius: '4px', display: 'inline-block', marginBottom: '0.35rem' }}>
                              {key}
                            </span>
                            <div style={{ fontSize: '0.85rem', color: '#78350F', fontStyle: 'italic', lineHeight: '1.5' }}>
                              "{val}"
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              <div style={{ padding: '1rem', backgroundColor: '#F9FAFB', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginTop: '1rem' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Đánh giá chất lượng dữ liệu:</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {viewResponse.status === 'valid' 
                    ? '✓ Phiếu trả lời đầy đủ 100% câu hỏi, thời gian điền đạt chuẩn kiểm tra độ tin cậy.'
                    : '⚠ Phiếu có thời gian điền quá nhanh hoặc phát hiện câu trả lời cùng 1 đáp án (straightlining).'}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setViewResponse(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LỌC SẠCH DỮ LIỆU THÔNG MINH (SMART DATA CLEANING) */}
      {showCleanModal && (
        <div className="modal-backdrop" onClick={() => setShowCleanModal(false)}>
          <div className="modal-content" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ padding: '6px', backgroundColor: '#EFF6FF', color: '#2563EB', borderRadius: '8px' }}>
                  <Sparkles size={20} />
                </div>
                <h2 className="modal-title">Lọc sạch dữ liệu thông minh (Data Cleaning)</h2>
              </div>
              <button className="modal-close-btn" onClick={() => setShowCleanModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ padding: '1rem', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <AlertTriangle size={20} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: '700', color: '#92400E', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                      Phát hiện {suspectResponses.length} phiếu có nguy cơ làm nhiễu dữ liệu khoa học
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#78350F', lineHeight: '1.5' }}>
                      Theo chuẩn phân tích thống kê EFA &amp; hồi quy, các phiếu trả lời kiểu <b>Straightlining</b> (đánh cùng 1 điểm cho toàn bộ thang đo) hoặc <b>Speeders</b> (điền dưới 20 giây) sẽ làm sai lệch phương sai và giả định đa biến.
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.875rem', fontWeight: '700', marginBottom: '0.75rem' }}>
                Danh sách phiếu nghi vấn ({suspectResponses.length}):
              </div>

              {suspectResponses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  <CheckCircle size={32} color="#10B981" style={{ margin: '0 auto 0.5rem auto' }} />
                  <div>Tập dữ liệu sạch hoàn hảo! Không phát hiện dấu hiệu bất thường nào.</div>
                </div>
              ) : (
                <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                  <table className="table" style={{ fontSize: '0.8rem', margin: 0 }}>
                    <thead style={{ backgroundColor: '#F9FAFB' }}>
                      <tr>
                        <th>Mã</th>
                        <th>Đối tượng</th>
                        <th>Thời gian làm</th>
                        <th>Dấu hiệu nhận diện</th>
                        <th>Trạng thái hiện tại</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suspectResponses.map(s => {
                        const isStraightlining = s.answers && Object.values(s.answers).filter(v => typeof v === 'number').length >= 4 && Object.values(s.answers).filter(v => typeof v === 'number').every((val, _, arr) => val === arr[0]);
                        const isFast = (s.time_taken || '').toLowerCase().includes('giây') && parseInt(s.time_taken) < 25;
                        return (
                          <tr key={s.id}>
                            <td style={{ fontWeight: 'bold' }}>#{s.id}</td>
                            <td>{s.role}</td>
                            <td>{s.time_taken}</td>
                            <td>
                              {isStraightlining && <span className="badge badge-warning" style={{ marginRight: '4px' }}>Straightlining (Đều nhau)</span>}
                              {isFast && <span className="badge badge-danger">Làm quá nhanh (&lt; 25s)</span>}
                              {!isStraightlining && !isFast && <span className="badge badge-warning">Đã đánh dấu lỗi</span>}
                            </td>
                            <td>{getStatusBadge(s.status)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <button className="btn btn-outline" onClick={() => setShowCleanModal(false)}>
                Đóng
              </button>
              {suspectResponses.length > 0 && currentUser?.role !== 'viewer' && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button 
                    className="btn btn-outline"
                    style={{ borderColor: '#F59E0B', color: '#D97706' }}
                    onClick={handleExcludeSuspects}
                    disabled={bulkProcessing}
                    title="Chuyển trạng thái sang Không hợp lệ để loại khỏi phân tích thống kê"
                  >
                    <XCircle size={16} />
                    {bulkProcessing ? 'Đang xử lý...' : `Đánh dấu Không hợp lệ (${suspectResponses.length})`}
                  </button>
                  <button 
                    className="btn btn-primary"
                    style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }}
                    onClick={handlePermanentDeleteSuspects}
                    disabled={bulkProcessing}
                    title="Xóa hoàn toàn các dòng dữ liệu này khỏi cơ sở dữ liệu"
                  >
                    <Trash2 size={16} />
                    {bulkProcessing ? 'Đang xóa...' : `Xóa vĩnh viễn (${suspectResponses.length})`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL NHẬP EXCEL / CSV */}
      {showImportModal && (
        <div className="modal-backdrop" onClick={() => setShowImportModal(false)}>
          <div className="modal-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ padding: '6px', backgroundColor: '#ECFDF5', color: '#10B981', borderRadius: '8px' }}>
                  <FileSpreadsheet size={20} />
                </div>
                <h2 className="modal-title">Nhập dữ liệu phản hồi từ CSV / Excel</h2>
              </div>
              <button className="modal-close-btn" onClick={() => setShowImportModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '1.25rem', padding: '1rem', backgroundColor: '#F8FAFC', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>Mẫu định dạng bảng dữ liệu:</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sử dụng các cột chuẩn: role, unit, gender, SP1..SP4, LD1..LD4, DX1..DX4, AT1..AT4</div>
                  </div>
                  <button 
                    className="btn btn-outline" 
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', backgroundColor: 'white' }}
                    onClick={handleDownloadTemplate}
                  >
                    <Download size={14} /> Tải file mẫu .csv
                  </button>
                </div>
              </div>

              {/* CHỌN KHẢO SÁT TIẾP NHẬN DỮ LIỆU */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  Khảo sát tiếp nhận dữ liệu phản hồi: <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select 
                  className="input" 
                  style={{ width: '100%', padding: '0.6rem 0.75rem', backgroundColor: '#F8FAFC' }}
                  value={importSurveyId}
                  onChange={(e) => setImportSurveyId(e.target.value)}
                >
                  <option value="" disabled>-- Vui lòng chọn khảo sát đích --</option>
                  {surveys.map(s => (
                    <option key={s.id} value={s.id}>
                      #{s.id} - {s.title} ({s.institution || 'Chung'})
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Tất cả các câu trả lời trong file CSV sẽ được nhập vào khảo sát này.
                </div>
              </div>

              {/* KHUNG TẢI FILE */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Chọn file CSV từ máy tính:</label>
                <input 
                  type="file" 
                  accept=".csv,text/csv" 
                  className="input" 
                  onChange={handleFileUpload}
                  style={{ padding: '0.5rem', cursor: 'pointer' }}
                />
              </div>

              {/* PREVIEW DỮ LIỆU ĐÃ PARSE */}
              {parsedImportData.length > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#059669' }}>
                      ✓ Đã phân tích sẵn sàng {parsedImportData.length} phản hồi:
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Xem trước 3 dòng đầu</span>
                  </div>
                  <div style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                    <table className="table" style={{ fontSize: '0.75rem', margin: 0 }}>
                      <thead style={{ backgroundColor: '#F1F5F9' }}>
                        <tr>
                          <th>#</th>
                          <th>Đối tượng</th>
                          <th>Đơn vị</th>
                          <th>Giới tính</th>
                          <th>Số câu Likert</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedImportData.slice(0, 3).map((r, i) => (
                          <tr key={i}>
                            <td>{i + 1}</td>
                            <td style={{ fontWeight: '600' }}>{r.role}</td>
                            <td>{r.unit}</td>
                            <td>{r.gender}</td>
                            <td>{Object.keys(r.answers || {}).length} điểm đo</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowImportModal(false)}>
                Hủy bỏ
              </button>
              <button 
                className="btn btn-primary"
                disabled={parsedImportData.length === 0 || importing || !importSurveyId}
                onClick={handleConfirmImport}
              >
                {importing ? 'Đang nhập...' : `Xác nhận nhập (${parsedImportData.length} phiếu)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Responses;
