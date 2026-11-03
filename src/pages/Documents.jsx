import React, { useState, useEffect } from 'react';
import { Search, Upload, FileText, Trash2, X, Download, FolderOpen, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { documentsAPI } from '../services/api';
import Toast from '../components/Toast';
import { SkeletonCard } from '../components/Skeleton';

let cachedDocuments = null;

const formatDisplayDate = (val) => {
  if (!val) return '';
  if (typeof val === 'string' && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(val)) return val;
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const Documents = () => {
  const { currentUser } = useAuth();
  const [documents, setDocuments] = useState(cachedDocuments || []);
  const [loading, setLoading] = useState(!cachedDocuments);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [deleteConfirmDoc, setDeleteConfirmDoc] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    type: 'Tham khảo',
    file: null
  });

  // Toast
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 3000);
  };

  const fetchDocuments = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const result = await documentsAPI.getAll();
      setDocuments(result);
      cachedDocuments = result;
    } catch (error) {
      console.error('Error fetching documents:', error);
      if (!silent) showToast('Không thể tải danh sách tài liệu', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments(!!cachedDocuments);
  }, []);

  const handleOpenUpload = () => {
    setFormData({
      title: '',
      type: 'Tham khảo',
      file: null
    });
    setIsUploadOpen(true);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast('Vui lòng nhập tên tài liệu', 'error');
      return;
    }
    if (!formData.file) {
      showToast('Vui lòng chọn file', 'error');
      return;
    }
    
    try {
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('type', formData.type);
      fd.append('file', formData.file);

      const created = await documentsAPI.create(fd);
      setDocuments([created, ...documents]);
      setIsUploadOpen(false);
      showToast('Tải lên tài liệu thành công!');
    } catch (err) {
      showToast(err.message || 'Lỗi khi thêm tài liệu', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await documentsAPI.delete(id);
      setDocuments(documents.filter(d => d.id !== id));
      setDeleteConfirmDoc(null);
      showToast('Đã xóa tài liệu thành công!');
    } catch (err) {
      showToast(err.message || 'Lỗi khi xóa tài liệu', 'error');
    }
  };

  const handleDownload = async (doc) => {
    if (!doc.file_path) {
      showToast('Tài liệu này không có file đính kèm', 'error');
      return;
    }
    showToast(`Đang chuẩn bị tải xuống: ${doc.title}...`);
    try {
      await documentsAPI.download(doc.id, doc.original_name || doc.title);
      showToast(`Tải xuống thành công: ${doc.title}`);
    } catch (err) {
      showToast(err.message || 'Lỗi khi tải tài liệu', 'error');
    }
  };

  const filteredDocs = documents.filter(doc => {
    const matchesQuery = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? doc.type === selectedCategory : true;
    return matchesQuery && matchesCategory;
  });

  return (
    <div>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Kho tài liệu</h1>
          <p style={{ color: 'var(--text-muted)' }}>Quản lý tài liệu nghiên cứu, thang đo chuẩn và báo cáo khoa học</p>
        </div>
        {currentUser?.role !== 'viewer' && (
          <div className="page-header-actions">
            <button className="btn btn-primary" onClick={handleOpenUpload} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Upload size={18} />
              Upload tài liệu
            </button>
          </div>
        )}
      </div>

      <div className="card documents-filter-bar" style={{ marginBottom: '2rem', padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <Search size={18} />
          </div>
          <input 
            type="text" 
            className="input" 
            placeholder="Tìm kiếm theo tên tài liệu..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.5rem', backgroundColor: '#F9FAFB', border: '1px solid var(--border-color)', width: '100%' }}
          />
        </div>
        <div style={{ minWidth: '180px' }}>
          <select 
            className="input" 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ backgroundColor: '#F9FAFB', border: '1px solid var(--border-color)', width: '100%' }}
          >
            <option value="">Tất cả phân loại</option>
            <option value="Lý thuyết">Lý thuyết</option>
            <option value="Báo cáo">Báo cáo</option>
            <option value="Tham khảo">Tham khảo</option>
            <option value="Dữ liệu">Dữ liệu thô</option>
          </select>
        </div>
      </div>

      {loading && documents.length === 0 ? (
        <div className="docs-card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <FolderOpen size={28} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            {documents.length === 0 ? 'Kho tài liệu hiện đang trống' : 'Không tìm thấy tài liệu phù hợp'}
          </h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: '400px' }}>
            {documents.length === 0 
              ? 'Chưa có tài liệu nghiên cứu nào được tải lên hệ thống.'
              : 'Hãy thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác.'}
          </p>
          {currentUser?.role !== 'viewer' && documents.length === 0 && (
            <button className="btn btn-primary" onClick={handleOpenUpload}>
              <Upload size={18} />
              Tải lên tài liệu ngay
            </button>
          )}
        </div>
      ) : (
        <div className="docs-card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          {filteredDocs.map(doc => (
            <div key={doc.id} className="card" style={{ padding: '1.5rem', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ padding: '0.75rem', backgroundColor: doc.bg || '#EFF6FF', borderRadius: 'var(--radius-md)', color: doc.color || '#3B82F6' }}>
                    <FileText size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontWeight: '600', marginBottom: '0.25rem', fontSize: '1rem', lineHeight: '1.4' }}>{doc.title}</h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{doc.size}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: '600', color: doc.color || '#3B82F6', border: `1px solid ${doc.color || '#3B82F6'}`, padding: '0.125rem 0.5rem', borderRadius: '4px', backgroundColor: doc.bg || '#EFF6FF' }}>
                  {doc.type}
                </span>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '0.25rem' }}>{formatDisplayDate(doc.date)}</span>
                  <button 
                    className="btn-outline"
                    style={{ padding: '0.375rem', borderRadius: 'var(--radius-md)', color: 'var(--primary)' }}
                    title="Tải về"
                    onClick={() => handleDownload(doc)}
                  >
                    <Download size={15} />
                  </button>
                  {currentUser?.role !== 'viewer' && (
                    <button 
                      className="btn-outline"
                      style={{ padding: '0.375rem', borderRadius: 'var(--radius-md)', color: 'var(--danger)' }}
                      title="Xóa tài liệu"
                      onClick={() => setDeleteConfirmDoc(doc)}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Upload tài liệu */}
      {isUploadOpen && (
        <div className="modal-backdrop" onClick={() => setIsUploadOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Tải lên tài liệu nghiên cứu</h2>
              <button className="modal-close-btn" onClick={() => setIsUploadOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUploadSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Tên tài liệu *</label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="VD: Tổng hợp lý thuyết Chuyển đổi số"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Phân loại tài liệu</label>
                    <select 
                      className="input"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="Lý thuyết">Lý thuyết</option>
                      <option value="Báo cáo">Báo cáo</option>
                      <option value="Tham khảo">Tham khảo</option>
                      <option value="Dữ liệu">Dữ liệu thô</option>
                    </select>
                  </div>
                </div>

                <div style={{ position: 'relative', padding: '1.5rem', border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-lg)', textAlign: 'center', backgroundColor: '#F9FAFB' }}>
                  <input 
                    type="file" 
                    onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.sav,.txt"
                  />
                  <Upload size={32} color="var(--primary)" style={{ margin: '0 auto 0.5rem' }} />
                  <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                    {formData.file ? formData.file.name : 'Chọn tệp từ máy tính hoặc kéo thả vào đây'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>PDF, DOCX, XLSX, SAV tối đa 50MB</div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsUploadOpen(false)}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn btn-primary">
                  Lưu vào kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xác nhận xóa */}
      {deleteConfirmDoc && (
        <div className="modal-backdrop" onClick={() => setDeleteConfirmDoc(null)}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-body" style={{ textAlign: 'center', paddingTop: '2rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#FEE2E2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <AlertTriangle size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Xác nhận xóa tài liệu?</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Bạn có chắc chắn muốn xóa tài liệu <strong>{deleteConfirmDoc.title}</strong> không?
              </p>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button className="btn btn-outline" onClick={() => setDeleteConfirmDoc(null)}>
                Hủy bỏ
              </button>
              <button 
                className="btn" 
                style={{ backgroundColor: '#EF4444', color: 'white' }}
                onClick={() => handleDelete(deleteConfirmDoc.id)}
              >
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
