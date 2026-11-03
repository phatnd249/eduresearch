import React, { useState, useEffect } from 'react';
import { Plus, Edit, Share2, Trash2, BarChart2, X, AlertTriangle, FileSpreadsheet, ListPlus, Sparkles, CheckCircle, QrCode, Copy, Eye, Download, Check, Building2, Users, GraduationCap, Briefcase, Filter, RefreshCw } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { useAuth } from '../context/AuthContext';
import { surveysAPI } from '../services/api';
import Toast from '../components/Toast';
import { SkeletonTableRows } from '../components/Skeleton';

// 4 MẪU BỘ CÂU HỎI CHUẨN THEO CHỨC VỤ
const ROLE_QUESTIONNAIRES = {
  leadership: {
    code: 'leadership',
    roleName: 'Ban Giám hiệu & Hội đồng trường',
    badgeColor: '#1E3A8A',
    badgeBg: '#DBEAFE',
    icon: Building2,
    defaultTitle: 'Bộ 1: Ban Giám hiệu & Hội đồng trường — Chiến lược, thể chế và quản trị số vĩ mô',
    subtitle: 'Đánh giá ở tầm vĩ mô: Thể chế, chiến lược, quản trị số, phân bổ nguồn lực và lợi thế cạnh tranh tổng thể',
    variables: 'STR, LEA, CAP, RES, SER, REA',
    defaultTarget: 50,
    questions: [
      { code: 'STR1', text: 'Nhà trường đã xây dựng chiến lược phát triển tổng thể, tích hợp rõ ràng các xu hướng số hóa và chuyển đổi giáo dục đại học.', variable: 'STR', type: 'likert', group: '1. Chiến lược & Thể chế vĩ mô (STR)' },
      { code: 'STR2', text: 'Kế hoạch chiến lược của nhà trường được rà soát, định kỳ điều chỉnh linh hoạt theo sự biến động của môi trường giáo dục.', variable: 'STR', type: 'likert', group: '1. Chiến lược & Thể chế vĩ mô (STR)' },
      { code: 'LEA1', text: 'Hội đồng trường / Ban Giám hiệu thể hiện tầm nhìn và năng lực lãnh đạo số mạnh mẽ trong chỉ đạo và điều hành.', variable: 'LEA', type: 'likert', group: '2. Năng lực Lãnh đạo số (LEA)' },
      { code: 'LEA2', text: 'Nhà trường ban hành các cơ chế, thể chế quản trị linh hoạt, phân cấp mạnh mẽ cho các đơn vị để tạo sự chủ động.', variable: 'LEA', type: 'likert', group: '2. Năng lực Lãnh đạo số (LEA)' },
      { code: 'CAP1', text: 'Cơ cấu tổ chức của nhà trường có khả năng tái cấu trúc và thích ứng nhanh trước các mô hình đào tạo mới.', variable: 'CAP', type: 'likert', group: '3. Năng lực Thích ứng Tổ chức (CAP)' },
      { code: 'RES1', text: 'Việc phân bổ ngân sách, tài chính và hạ tầng CNTT được ưu tiên gắn liền với các mục tiêu chiến lược trọng điểm.', variable: 'RES', type: 'likert', group: '4. Phân bổ Nguồn lực & Đầu tư (RES)' },
      { code: 'RES2', text: 'Nhà trường có chính sách thu hút, phát triển và giữ chân đội ngũ nhân sự chất lượng cao đáp ứng chuẩn mực mới.', variable: 'RES', type: 'likert', group: '4. Phân bổ Nguồn lực & Đầu tư (RES)' },
      { code: 'SER1', text: 'Nhà trường duy trì được vị thế, uy tín và lợi thế cạnh tranh bền vững so với các cơ sở giáo dục đại học khác.', variable: 'SER', type: 'likert', group: '5. Lợi thế Cạnh tranh & Uy tín (SER)' },
      { code: 'REA1', text: 'Toàn hệ thống nhà trường đã đạt được sự sẵn sàng cao về mọi mặt để thích ứng thành công với các xu hướng giáo dục mới.', variable: 'REA', type: 'likert', group: '6. Mức độ Sẵn sàng Thích ứng (REA)' },
      { code: 'REA2', text: 'Nhà trường có khả năng dự báo và ứng phó hiệu quả trước các rủi ro, thách thức trong quá trình chuyển đổi tổ chức.', variable: 'REA', type: 'likert', group: '6. Mức độ Sẵn sàng Thích ứng (REA)' },
      { code: 'TXT_BARRIER_BGH', text: 'Theo Ông/Bà, đâu là rào cản lớn nhất về mặt cơ chế, thể chế hoặc nguồn lực trong quá trình chuyển đổi của nhà trường?', variable: 'QUALITATIVE', type: 'textarea', placeholder: 'Ý kiến về cơ chế, thể chế, phân bổ nguồn lực...' },
      { code: 'TXT_SUGGESTION_BGH', text: 'Ông/Bà có đề xuất định hướng chiến lược trọng tâm gì để gia tăng lợi thế cạnh tranh của nhà trường trong 3–5 năm tới?', variable: 'QUALITATIVE', type: 'textarea', placeholder: 'Đề xuất định hướng chiến lược trọng tâm...' }
    ],
    hypotheses: [
      { code: 'H1', name: 'STR ➔ REA', description: 'Chiến lược phát triển (STR) tác động thuận chiều đến mức độ sẵn sàng chuyển đổi (REA)', independent: 'STR', dependent: 'REA' },
      { code: 'H2', name: 'LEA ➔ REA', description: 'Lãnh đạo số (LEA) tác động thuận chiều đến mức độ sẵn sàng chuyển đổi (REA)', independent: 'LEA', dependent: 'REA' },
      { code: 'H3', name: 'CAP ➔ SER', description: 'Năng lực thích ứng tổ chức (CAP) có tác động tích cực đến lợi thế cạnh tranh (SER)', independent: 'CAP', dependent: 'SER' },
      { code: 'H4', name: 'RES ➔ REA', description: 'Nguồn lực và ngân sách (RES) tác động thuận chiều đến sự sẵn sàng tổ chức (REA)', independent: 'RES', dependent: 'REA' }
    ]
  },
  dept_head: {
    code: 'dept_head',
    roleName: 'Trưởng / Phó Khoa, Phòng / Ban',
    badgeColor: '#065F46',
    badgeBg: '#D1FAE5',
    icon: Briefcase,
    defaultTitle: 'Bộ 2: Trưởng / Phó Khoa, Phòng / Ban — Triển khai chiến lược và quy trình vận hành cấp trung',
    subtitle: 'Đánh giá ở cấp trung: Triển khai chiến lược, quy trình vận hành, quản lý nhân sự và chất lượng dịch vụ nội bộ',
    variables: 'STR, LEA, CAP, RES, SER, REA',
    defaultTarget: 80,
    questions: [
      { code: 'STR1', text: 'Đơn vị của tôi hiểu rõ và chủ động cụ thể hóa các mục tiêu chiến lược của nhà trường thành kế hoạch hành động.', variable: 'STR', type: 'likert', group: '1. Triển khai Chiến lược tại đơn vị (STR)' },
      { code: 'STR2', text: 'Kế hoạch hoạt động của đơn vị được liên kết chặt chẽ với các chỉ số đánh giá hiệu quả (KPIs) chung của trường.', variable: 'STR', type: 'likert', group: '1. Triển khai Chiến lược tại đơn vị (STR)' },
      { code: 'LEA1', text: 'Lãnh đạo đơn vị tích cực hỗ trợ, tạo điều kiện cho cán bộ/giảng viên ứng dụng các phương pháp và quy trình làm việc mới.', variable: 'LEA', type: 'likert', group: '2. Lãnh đạo cấp trung & Đổi mới (LEA)' },
      { code: 'LEA2', text: 'Lãnh đạo đơn vị thường xuyên khen thưởng, động viên các ý tưởng đổi mới sáng tạo từ cán bộ/giảng viên.', variable: 'LEA', type: 'likert', group: '2. Lãnh đạo cấp trung & Đổi mới (LEA)' },
      { code: 'CAP1', text: 'Quy trình phối hợp công việc giữa đơn vị của tôi với các phòng/khoa/ban khác diễn ra mượt mà, giảm bớt thủ tục hành chính.', variable: 'CAP', type: 'likert', group: '3. Năng lực Quy trình & Phối hợp (CAP)' },
      { code: 'CAP2', text: 'Đơn vị có khả năng xử lý linh hoạt và nhanh chóng các sự cố phát sinh trong quá trình vận hành.', variable: 'CAP', type: 'likert', group: '3. Năng lực Quy trình & Phối hợp (CAP)' },
      { code: 'RES1', text: 'Trang thiết bị, phần mềm quản lý và hạ tầng công nghệ được cung cấp đầy đủ, đáp ứng tốt nhu cầu làm việc của đơn vị.', variable: 'RES', type: 'likert', group: '4. Nguồn lực & Hạ tầng đơn vị (RES)' },
      { code: 'RES2', text: 'Cán bộ/nhân sự tại đơn vị thường xuyên được bồi dưỡng nâng cao năng lực chuyên môn và kỹ năng số.', variable: 'RES', type: 'likert', group: '4. Nguồn lực & Hạ tầng đơn vị (RES)' },
      { code: 'SER1', text: 'Đơn vị duy trì chất lượng phục vụ/hỗ trợ cao đối với các đơn vị khác, giảng viên và người học.', variable: 'SER', type: 'likert', group: '5. Chất lượng Dịch vụ & Hỗ trợ (SER)' },
      { code: 'REA1', text: 'Đơn vị của tôi đạt mức độ sẵn sàng cao trong việc thay đổi thói quen làm việc để đáp ứng yêu cầu chuyển đổi chung.', variable: 'REA', type: 'likert', group: '6. Mức độ Sẵn sàng Chuyển đổi (REA)' },
      { code: 'TXT_BARRIER_DEPT', text: 'Khó khăn hoặc điểm nghẽn lớn nhất mà đơn vị của Thầy/Cô gặp phải trong quy trình vận hành và phối hợp liên phòng ban là gì?', variable: 'QUALITATIVE', type: 'textarea', placeholder: 'Ý kiến về quy trình, thủ tục hành chính...' },
      { code: 'TXT_SUGGESTION_DEPT', text: 'Thầy/Cô có đề xuất gì để cải tiến cơ chế phối hợp và phân quyền cho cấp đơn vị khoa/phòng ban hiệu quả hơn?', variable: 'QUALITATIVE', type: 'textarea', placeholder: 'Đề xuất cải tiến cơ chế quản trị và phân quyền...' }
    ],
    hypotheses: [
      { code: 'H1', name: 'STR ➔ CAP', description: 'Hiểu rõ chiến lược (STR) tác động tích cực đến năng lực phối hợp quy trình (CAP)', independent: 'STR', dependent: 'CAP' },
      { code: 'H2', name: 'LEA ➔ REA', description: 'Lãnh đạo đơn vị đổi mới (LEA) thúc đẩy mức độ sẵn sàng thay đổi (REA)', independent: 'LEA', dependent: 'REA' },
      { code: 'H3', name: 'RES ➔ SER', description: 'Hạ tầng và bồi dưỡng nhân lực (RES) tác động thuận chiều đến chất lượng phục vụ (SER)', independent: 'RES', dependent: 'SER' }
    ]
  },
  lecturer_staff: {
    code: 'lecturer_staff',
    roleName: 'Giảng viên / Giáo viên / Nhân viên',
    badgeColor: '#7C2D12',
    badgeBg: '#FFEDD5',
    icon: Users,
    defaultTitle: 'Bộ 3: Giảng viên / Giáo viên / Nhân viên — Công cụ làm việc, phương pháp giảng dạy và văn hóa đổi mới',
    subtitle: 'Đánh giá trực tiếp: Công cụ làm việc, phương pháp giảng dạy, văn hóa đổi mới và sự hỗ trợ từ tổ chức',
    variables: 'STR, LEA, CAP, RES, SER, REA',
    defaultTarget: 150,
    questions: [
      { code: 'STR1', text: 'Tôi được phổ biến rõ ràng về định hướng phát triển và các chiến lược chuyển đổi của nhà trường.', variable: 'STR', type: 'likert', group: '1. Nhận thức Chiến lược (STR)' },
      { code: 'LEA1', text: 'Lãnh đạo nhà trường/khoa luôn lắng nghe, chia sẻ và đồng hành cùng giảng viên/nhân viên khi triển khai cái mới.', variable: 'LEA', type: 'likert', group: '2. Sự Đồng hành của Lãnh đạo (LEA)' },
      { code: 'CAP1', text: 'Tôi chủ động áp dụng các phương pháp giảng dạy hiện đại, công nghệ số hoặc quy trình mới vào công việc chuyên môn.', variable: 'CAP', type: 'likert', group: '3. Năng lực Thích ứng Chuyên môn (CAP)' },
      { code: 'CAP2', text: 'Bản thân tôi có khả năng thích ứng nhanh với các thay đổi về công nghệ và quy trình làm việc tại trường.', variable: 'CAP', type: 'likert', group: '3. Năng lực Thích ứng Chuyên môn (CAP)' },
      { code: 'RES1', text: 'Hạ tầng CNTT, mạng Internet và phần mềm giảng dạy/quản lý của trường hoạt động ổn định và hiệu quả.', variable: 'RES', type: 'likert', group: '4. Hạ tầng & Môi trường Làm việc (RES)' },
      { code: 'RES2', text: 'Cơ sở vật chất, phòng làm việc/giảng dạy được trang bị đầy đủ, tạo môi trường làm việc thuận lợi.', variable: 'RES', type: 'likert', group: '4. Hạ tầng & Môi trường Làm việc (RES)' },
      { code: 'SER1', text: 'Nhà trường cung cấp các khóa đào tạo, tập huấn thiết thực giúp tôi nâng cao kỹ năng ứng dụng công nghệ/chuyển đổi.', variable: 'SER', type: 'likert', group: '5. Đào tạo & Tiếp nhận Phản hồi (SER)' },
      { code: 'SER2', text: 'Các kênh phản hồi, góp ý của cán bộ/giảng viên được nhà trường ghi nhận và phản hồi kịp thời.', variable: 'SER', type: 'likert', group: '5. Đào tạo & Tiếp nhận Phản hồi (SER)' },
      { code: 'REA1', text: 'Tôi sẵn sàng điều chỉnh thói quen và nâng cao năng lực cá nhân để đáp ứng các yêu cầu chuyển đổi của nhà trường.', variable: 'REA', type: 'likert', group: '6. Thái độ Sẵn sàng & Niềm tin (REA)' },
      { code: 'REA2', text: 'Tôi tin tưởng vào sự thành công và phát triển bền vững của nhà trường trong giai đoạn chuyển đổi hiện nay.', variable: 'REA', type: 'likert', group: '6. Thái độ Sẵn sàng & Niềm tin (REA)' },
      { code: 'TXT_BARRIER_STAFF', text: 'Thầy/Cô/Anh/Chị gặp khó khăn gì nhiều nhất về hạ tầng, công cụ số hay thời gian làm việc hiện nay?', variable: 'QUALITATIVE', type: 'textarea', placeholder: 'Ý kiến về công cụ, phần mềm, thiết bị...' },
      { code: 'TXT_SUGGESTION_STAFF', text: 'Thầy/Cô/Anh/Chị có nguyện vọng hoặc đề xuất gì về chính sách đãi ngộ, tập huấn để an tâm cống hiến tốt hơn?', variable: 'QUALITATIVE', type: 'textarea', placeholder: 'Đề xuất về tập huấn, đãi ngộ và môi trường...' }
    ],
    hypotheses: [
      { code: 'H1', name: 'STR ➔ REA', description: 'Nhận thức chiến lược (STR) tác động tích cực đến sự sẵn sàng đổi mới cá nhân (REA)', independent: 'STR', dependent: 'REA' },
      { code: 'H2', name: 'LEA ➔ CAP', description: 'Sự đồng hành của lãnh đạo (LEA) thúc đẩy năng lực ứng dụng công nghệ (CAP)', independent: 'LEA', dependent: 'CAP' },
      { code: 'H3', name: 'RES ➔ CAP', description: 'Hạ tầng và điều kiện làm việc (RES) nâng cao năng lực thích ứng chuyên môn (CAP)', independent: 'RES', dependent: 'CAP' },
      { code: 'H4', name: 'SER ➔ REA', description: 'Tập huấn và tiếp nhận phản hồi (SER) củng cố niềm tin và sự thích ứng cá nhân (REA)', independent: 'SER', dependent: 'REA' }
    ]
  },
  student_alumni: {
    code: 'student_alumni',
    roleName: 'Học sinh / Sinh viên / Cựu SV / Sau ĐH',
    badgeColor: '#4C1D95',
    badgeBg: '#EDE9FE',
    icon: GraduationCap,
    defaultTitle: 'Bộ 4: Người học & Cựu người học — Trải nghiệm dịch vụ đào tạo, môi trường và uy tín thương hiệu',
    subtitle: 'Đánh giá từ góc độ thụ hưởng: Trải nghiệm người học, chất lượng dịch vụ đào tạo, môi trường và giá trị thương hiệu',
    variables: 'SER, RES, CAP, STR, REA',
    defaultTarget: 200,
    questions: [
      { code: 'SER1', text: 'Chương trình đào tạo mang tính cập nhật, thực tiễn và đáp ứng tốt nhu cầu của thị trường lao động.', variable: 'SER', type: 'likert', group: '1. Chất lượng Dịch vụ Đào tạo & Hỗ trợ (SER)' },
      { code: 'SER2', text: 'Giảng viên sử dụng các phương pháp giảng dạy tích cực, ứng dụng công nghệ và tương tác hiệu quả với người học.', variable: 'SER', type: 'likert', group: '1. Chất lượng Dịch vụ Đào tạo & Hỗ trợ (SER)' },
      { code: 'SER3', text: 'Các dịch vụ hành chính (xác nhận học vụ, bảng điểm, đăng ký môn học...) được thực hiện nhanh chóng, tiện lợi trên nền tảng số.', variable: 'SER', type: 'likert', group: '1. Chất lượng Dịch vụ Đào tạo & Hỗ trợ (SER)' },
      { code: 'SER4', text: 'Các hoạt động hỗ trợ người học (tư vấn tâm lý, hướng nghiệp, học bổng...) được nhà trường thực hiện chu đáo, chuyên nghiệp.', variable: 'SER', type: 'likert', group: '1. Chất lượng Dịch vụ Đào tạo & Hỗ trợ (SER)' },
      { code: 'RES1', text: 'Phòng học, phòng thí nghiệm, thư viện và hạ tầng Internet của trường đáp ứng tốt nhu cầu học tập và nghiên cứu.', variable: 'RES', type: 'likert', group: '2. Môi trường Cơ sở vật chất & Học liệu số (RES)' },
      { code: 'RES2', text: 'Các nền tảng học tập trực tuyến (LMS, phần mềm học tập) hỗ trợ đắc lực cho quá trình tự học của tôi/người học.', variable: 'RES', type: 'likert', group: '2. Môi trường Cơ sở vật chất & Học liệu số (RES)' },
      { code: 'CAP1', text: 'Nhà trường nhanh chóng tiếp thu ý kiến đóng góp của người học/cựu sinh viên để cải thiện chất lượng dịch vụ đào tạo.', variable: 'CAP', type: 'likert', group: '3. Năng lực Lắng nghe & Tiếp thu (CAP)' },
      { code: 'STR1', text: 'Nhà trường thể hiện định hướng phát triển hiện đại, tiên phong trong ứng dụng công nghệ và đổi mới sáng tạo.', variable: 'STR', type: 'likert', group: '4. Định hướng Tiên phong Đổi mới (STR)' },
      { code: 'REA1', text: 'Tôi nhận thấy nhà trường có khả năng thích ứng tốt và duy trì chất lượng đào tạo ổn định trước những thay đổi.', variable: 'REA', type: 'likert', group: '5. Uy tín & Sự Hài lòng Thụ hưởng (REA)' },
      { code: 'REA2', text: 'Tôi hài lòng và tự hào về uy tín, chất lượng đào tạo của nhà trường khi học tập hoặc giới thiệu cho người khác.', variable: 'REA', type: 'likert', group: '5. Uy tín & Sự Hài lòng Thụ hưởng (REA)' },
      { code: 'TXT_BARRIER_STUDENT', text: 'Những rào cản hoặc điểm chưa hài lòng lớn nhất mà Bạn gặp phải về dịch vụ hoặc cơ sở vật chất của trường là gì?', variable: 'QUALITATIVE', type: 'textarea', placeholder: 'Ý kiến về thủ tục học vụ, Wifi, học liệu, phòng học...' },
      { code: 'TXT_SUGGESTION_STUDENT', text: 'Bạn có mong muốn hoặc đề xuất cụ thể nào để nhà trường nâng cấp trải nghiệm học tập và hỗ trợ sinh viên tốt hơn?', variable: 'QUALITATIVE', type: 'textarea', placeholder: 'Đề xuất cải tiến dịch vụ người học và cơ sở vật chất...' }
    ],
    hypotheses: [
      { code: 'H1', name: 'RES ➔ SER', description: 'Môi trường CSVC và LMS (RES) tác động thuận chiều đến chất lượng đào tạo (SER)', independent: 'RES', dependent: 'SER' },
      { code: 'H2', name: 'SER ➔ REA', description: 'Chất lượng dịch vụ đào tạo (SER) tác động tích cực đến sự hài lòng và tự hào thương hiệu (REA)', independent: 'SER', dependent: 'REA' },
      { code: 'H3', name: 'CAP ➔ REA', description: 'Năng lực lắng nghe phản hồi (CAP) củng cố niềm tin và sự gắn kết người học (REA)', independent: 'CAP', dependent: 'REA' }
    ]
  }
};

const SAMPLE_QUESTIONS = {
  STR: [
    { code: 'STR1', text: 'Nhà trường đã xây dựng chiến lược phát triển tổng thể, tích hợp rõ ràng các xu hướng số hóa và chuyển đổi giáo dục đại học.', variable: 'STR', type: 'likert' },
    { code: 'STR2', text: 'Kế hoạch chiến lược của nhà trường được rà soát, định kỳ điều chỉnh linh hoạt theo sự biến động của môi trường giáo dục.', variable: 'STR', type: 'likert' }
  ],
  LEA: [
    { code: 'LEA1', text: 'Lãnh đạo thể hiện tầm nhìn và năng lực điều hành mạnh mẽ, đồng hành cùng các đơn vị trong đổi mới.', variable: 'LEA', type: 'likert' },
    { code: 'LEA2', text: 'Nhà trường ban hành các cơ chế, thể chế quản trị linh hoạt, phân cấp mạnh mẽ tạo sự chủ động.', variable: 'LEA', type: 'likert' }
  ],
  CAP: [
    { code: 'CAP1', text: 'Cơ cấu tổ chức và quy trình phối hợp công việc diễn ra mượt mà, thích ứng nhanh với các yêu cầu mới.', variable: 'CAP', type: 'likert' },
    { code: 'CAP2', text: 'Đơn vị và cá nhân có khả năng xử lý linh hoạt và nhanh chóng các sự cố phát sinh trong vận hành.', variable: 'CAP', type: 'likert' }
  ],
  RES: [
    { code: 'RES1', text: 'Trang thiết bị, hạ tầng CNTT và đường truyền mạng được đầu tư đầy đủ, hoạt động ổn định.', variable: 'RES', type: 'likert' },
    { code: 'RES2', text: 'Đội ngũ nhân sự được bồi dưỡng nâng cao năng lực chuyên môn và kỹ năng số thường xuyên.', variable: 'RES', type: 'likert' }
  ],
  SER: [
    { code: 'SER1', text: 'Dịch vụ đào tạo và hành chính được thực hiện nhanh chóng, tiện lợi trên nền tảng số.', variable: 'SER', type: 'likert' },
    { code: 'SER2', text: 'Chất lượng phục vụ và hỗ trợ người học, giảng viên luôn được duy trì ở mức cao và chuyên nghiệp.', variable: 'SER', type: 'likert' }
  ],
  REA: [
    { code: 'REA1', text: 'Toàn hệ thống đạt mức độ sẵn sàng cao trong việc thay đổi thói quen để thích ứng với yêu cầu chuyển đổi.', variable: 'REA', type: 'likert' },
    { code: 'REA2', text: 'Có niềm tin vững chắc và sự hài lòng cao về uy tín, sự phát triển bền vững của cơ sở giáo dục.', variable: 'REA', type: 'likert' }
  ]
};

const Surveys = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);

  // Bộ lọc danh sách khảo sát theo Trường và Chức vụ
  const [filterInstitution, setFilterInstitution] = useState('all');
  const [filterAudience, setFilterAudience] = useState('all');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isQuestionBuilderOpen, setIsQuestionBuilderOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // QR Code Modal State
  const [qrModalSurvey, setQrModalSurvey] = useState(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Question builder tabs
  const [builderTab, setBuilderTab] = useState('questions'); // questions, hypotheses
  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [currentHypotheses, setCurrentHypotheses] = useState([]);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionCode, setNewQuestionCode] = useState('');
  const [newQuestionVar, setNewQuestionVar] = useState('STR');
  const [newQuestionType, setNewQuestionType] = useState('likert');
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);
  const [editingQuestionText, setEditingQuestionText] = useState('');

  // Form states cho Tạo mới / Chỉnh sửa
  const [selectedRoleTemplate, setSelectedRoleTemplate] = useState('leadership');
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    institution: 'Trường Đại học Sư phạm',
    audience: 'leadership',
    questions_count: 12,
    status: 'Active',
    scale: 'Likert 5',
    target: 50,
    variables: 'STR, LEA, CAP, RES, SER, REA',
    questions: [],
    hypotheses: []
  });

  // Toast
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 3000);
  };

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const result = await surveysAPI.getAll();
      setSurveys(result);
    } catch (error) {
      console.error('Error fetching surveys:', error);
      showToast('Không thể tải danh sách khảo sát', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, []);

  // Khi chọn một template bộ câu hỏi theo chức vụ
  const applyRoleTemplate = (roleKey, instName) => {
    const tmpl = ROLE_QUESTIONNAIRES[roleKey];
    setSelectedRoleTemplate(roleKey);
    const inst = instName !== undefined ? instName : formData.institution;
    if (tmpl) {
      setFormData(prev => ({
        ...prev,
        audience: roleKey,
        title: `${tmpl.defaultTitle} — ${inst || 'Trường Đại học'}`,
        subtitle: tmpl.subtitle,
        variables: tmpl.variables,
        target: tmpl.defaultTarget,
        questions_count: tmpl.questions.length,
        questions: tmpl.questions,
        hypotheses: tmpl.hypotheses
      }));
    } else {
      // Custom
      setFormData(prev => ({
        ...prev,
        audience: 'custom',
        title: prev.title || `Khảo sát chuyên đề — ${inst || 'Trường Đại học'}`,
        subtitle: 'Bảng hỏi khảo sát tự thiết kế tùy biến',
        variables: 'STR, LEA, CAP, RES, SER, REA',
        questions_count: 10,
        questions: [],
        hypotheses: []
      }));
    }
  };

  const handleOpenCreate = () => {
    const defaultInst = 'Trường Đại học Sư phạm';
    const tmpl = ROLE_QUESTIONNAIRES.leadership;
    setSelectedRoleTemplate('leadership');
    setFormData({
      title: `${tmpl.defaultTitle} — ${defaultInst}`,
      subtitle: tmpl.subtitle,
      institution: defaultInst,
      audience: 'leadership',
      questions_count: tmpl.questions.length,
      status: 'Active',
      scale: 'Likert 5',
      target: tmpl.defaultTarget,
      variables: tmpl.variables,
      questions: tmpl.questions,
      hypotheses: tmpl.hypotheses
    });
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!formData.title.trim()) {
      showToast('Vui lòng nhập tiêu đề khảo sát', 'error');
      return;
    }
    if (!formData.institution.trim()) {
      showToast('Vui lòng nhập tên Trường / Đơn vị khảo sát', 'error');
      return;
    }
    try {
      setIsSubmitting(true);
      const created = await surveysAPI.create(formData);
      setSurveys([created, ...surveys]);
      setIsCreateOpen(false);
      showToast(`Đã tạo thành công bộ khảo sát cho ${formData.institution}!`);
    } catch (err) {
      showToast(err.message || 'Lỗi khi tạo khảo sát', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (survey) => {
    setSelectedSurvey(survey);
    setSelectedRoleTemplate(survey.audience || 'custom');
    setFormData({
      title: survey.title,
      subtitle: survey.subtitle || '',
      institution: survey.institution || 'Cơ sở giáo dục đại học',
      audience: survey.audience || 'custom',
      questions_count: survey.questions_count,
      status: survey.status,
      scale: survey.scale,
      target: survey.target,
      variables: Array.isArray(survey.variables) ? survey.variables.join(', ') : (survey.variables || ''),
      questions: survey.questions || [],
      hypotheses: survey.hypotheses || []
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSurvey || isSubmitting) return;
    try {
      setIsSubmitting(true);
      const updated = await surveysAPI.update(selectedSurvey.id, formData);
      setSurveys(surveys.map(s => s.id === updated.id ? updated : s));
      setIsEditOpen(false);
      setSelectedSurvey(null);
      showToast('Cập nhật khảo sát thành công!');
    } catch (err) {
      showToast(err.message || 'Lỗi khi cập nhật khảo sát', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Nút đổi trạng thái nhanh trực tiếp trên bảng
  const handleToggleStatus = async (survey) => {
    if (currentUser?.role === 'viewer') return;
    const nextStatus = survey.status === 'Active' ? 'Closed' : (survey.status === 'Closed' ? 'Draft' : 'Active');
    try {
      await surveysAPI.updateStatus(survey.id, nextStatus);
      setSurveys(surveys.map(s => s.id === survey.id ? { ...s, status: nextStatus } : s));
      showToast(`Đã đổi trạng thái khảo sát thành: ${nextStatus === 'Active' ? 'Đang mở' : (nextStatus === 'Closed' ? 'Đã đóng' : 'Bản nháp')}`);
    } catch (err) {
      showToast('Không thể đổi trạng thái', 'error');
    }
  };

  // Mở modal tạo mã QR code
  const handleOpenQRModal = async (survey) => {
    setQrModalSurvey(survey);
    setCopiedLink(false);
    const surveyUrl = `${window.location.origin}/survey/${survey.id}`;
    try {
      const url = await QRCode.toDataURL(surveyUrl, {
        width: 280,
        margin: 2,
        color: {
          dark: '#0F172A',
          light: '#FFFFFF'
        }
      });
      setQrCodeDataUrl(url);
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  };

  const handleDownloadQR = () => {
    if (!qrCodeDataUrl || !qrModalSurvey) return;
    const link = document.createElement('a');
    link.download = `QR_KhaoSat_${qrModalSurvey.id}_${qrModalSurvey.institution || 'Edu'}.png`;
    link.href = qrCodeDataUrl;
    link.click();
    showToast('Đã tải xuống ảnh mã QR (.png)!');
  };

  const handleCopySurveyLink = (surveyId) => {
    const url = `${window.location.origin}/survey/${surveyId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    showToast('Đã sao chép đường dẫn khảo sát vào Clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Nhân bản khảo sát 1-Click
  const handleCloneSurvey = async (survey) => {
    if (currentUser?.role === 'viewer' || isSubmitting) return;
    try {
      setIsSubmitting(true);
      const cloned = await surveysAPI.clone(survey.id);
      setSurveys([cloned, ...surveys]);
      showToast(`Đã nhân bản thành công bảng hỏi: ${cloned.title}!`);
    } catch (err) {
      showToast(err.message || 'Lỗi khi nhân bản bảng hỏi', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xem trước khảo sát (Preview mode)
  const handlePreviewSurvey = (surveyId) => {
    window.open(`/survey/${surveyId}?preview=true`, '_blank');
  };

  // Mở modal Thiết kế câu hỏi & Khai báo giả thuyết
  const handleOpenQuestionBuilder = (survey) => {
    setSelectedSurvey(survey);
    setCurrentQuestions(survey.questions || []);
    setCurrentHypotheses(survey.hypotheses || []);
    setBuilderTab('questions');
    setIsQuestionBuilderOpen(true);
  };

  // Nạp nguyên vẹn một bộ câu hỏi mẫu vào bảng hỏi
  const handleLoadFullRoleQuestions = (roleKey) => {
    const tmpl = ROLE_QUESTIONNAIRES[roleKey];
    if (!tmpl) return;
    setCurrentQuestions(tmpl.questions);
    setCurrentHypotheses(tmpl.hypotheses);
    showToast(`Đã nạp trọn bộ ${tmpl.questions.length} câu hỏi & ${tmpl.hypotheses.length} giả thuyết của ${tmpl.roleName}!`);
  };

  // Sinh câu hỏi mẫu theo biến
  const handleGenerateSampleQuestions = (varName) => {
    const samples = SAMPLE_QUESTIONS[varName] || [
      { code: `${varName}1`, text: `Nhận định 1 của nhân tố ${varName} trong thực tế.`, variable: varName, type: 'likert' },
      { code: `${varName}2`, text: `Nhận định 2 của nhân tố ${varName} trong thực tế.`, variable: varName, type: 'likert' }
    ];

    const existingCodes = currentQuestions.map(q => q.code);
    const toAdd = samples.filter(s => !existingCodes.includes(s.code));

    if (toAdd.length === 0) {
      showToast(`Các câu hỏi mẫu của biến ${varName} đã có trong bảng hỏi!`, 'info');
      return;
    }

    setCurrentQuestions([...currentQuestions, ...toAdd]);
    showToast(`Đã tự động sinh ${toAdd.length} câu hỏi mẫu chuẩn cho biến ${varName}!`);
  };

  // Thêm câu hỏi tùy chỉnh
  const handleAddCustomQuestion = () => {
    if (!newQuestionText.trim()) {
      showToast('Vui lòng nhập nội dung câu hỏi', 'error');
      return;
    }
    const defaultPrefix = newQuestionType === 'textarea' || newQuestionType === 'text' ? 'TXT' : newQuestionVar;
    const code = newQuestionCode.trim() || `${defaultPrefix}${currentQuestions.length + 1}`;
    const newQ = {
      code,
      text: newQuestionText.trim(),
      variable: newQuestionType === 'textarea' || newQuestionType === 'text' ? 'QUALITATIVE' : newQuestionVar,
      type: newQuestionType
    };
    setCurrentQuestions([...currentQuestions, newQ]);
    setNewQuestionText('');
    setNewQuestionCode('');
    showToast(`Đã thêm câu hỏi ${code}!`);
  };

  // Xóa câu hỏi
  const handleDeleteQuestion = (index) => {
    const updated = currentQuestions.filter((_, i) => i !== index);
    setCurrentQuestions(updated);
  };

  // Lưu chỉnh sửa câu hỏi trực tiếp
  const handleSaveEditQuestion = (index) => {
    if (!editingQuestionText.trim()) {
      showToast('Nội dung câu hỏi không được để trống', 'error');
      return;
    }
    const updated = [...currentQuestions];
    updated[index] = { ...updated[index], text: editingQuestionText.trim() };
    setCurrentQuestions(updated);
    setEditingQuestionIndex(null);
    showToast(`Đã cập nhật câu hỏi [${updated[index].code}]!`);
  };

  // Thêm giả thuyết nghiên cứu
  const handleAddHypothesis = (indVar, depVar) => {
    const code = `H${currentHypotheses.length + 1}`;
    const newHypo = {
      code,
      name: `${indVar} ➔ ${depVar}`,
      description: `Nhân tố ${indVar} có tác động tích cực và có ý nghĩa thống kê đến ${depVar}`,
      independent: indVar,
      dependent: depVar
    };
    setCurrentHypotheses([...currentHypotheses, newHypo]);
    showToast(`Đã khai báo giả thuyết ${code}!`);
  };

  // Lưu cấu hình câu hỏi và giả thuyết vào CSDL
  const handleSaveQuestionBuilder = async () => {
    if (!selectedSurvey || isSubmitting) return;
    try {
      setIsSubmitting(true);
      const updated = await surveysAPI.update(selectedSurvey.id, {
        questions: currentQuestions,
        questions_count: currentQuestions.length,
        hypotheses: currentHypotheses
      });
      setSurveys(surveys.map(s => s.id === updated.id ? updated : s));
      setIsQuestionBuilderOpen(false);
      showToast('Đã lưu thiết kế câu hỏi & giả thuyết nghiên cứu vào CSDL!');
    } catch (err) {
      showToast('Lỗi khi lưu bộ câu hỏi', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      await surveysAPI.delete(id);
      setSurveys(surveys.filter(s => s.id !== id));
      setDeleteConfirmId(null);
      showToast('Đã xóa khảo sát thành công!');
    } catch (err) {
      showToast(err.message || 'Lỗi khi xóa khảo sát', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = (survey) => {
    const shareUrl = `${window.location.origin}/survey/${survey.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      showToast(`Đã sao chép link khảo sát #${survey.id}!`);
    } else {
      showToast(`Link khảo sát: ${shareUrl}`);
    }
  };

  const handleAnalyze = (survey) => {
    navigate(`/analytics?surveyId=${survey.id}`);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active': return <span className="badge badge-success" title="Bấm để chuyển trạng thái">Đang mở (Active)</span>;
      case 'Draft': return <span className="badge badge-neutral" title="Bấm để chuyển trạng thái">Nháp (Draft)</span>;
      case 'Closed': return <span className="badge badge-warning" title="Bấm để chuyển trạng thái">Đã đóng (Closed)</span>;
      default: return null;
    }
  };

  const getRoleBadge = (audience) => {
    const tmpl = ROLE_QUESTIONNAIRES[audience];
    if (tmpl) {
      return (
        <span style={{ fontSize: '0.725rem', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: '600', backgroundColor: tmpl.badgeBg, color: tmpl.badgeColor, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
          <tmpl.icon size={12} />
          {tmpl.roleName}
        </span>
      );
    }
    return (
      <span style={{ fontSize: '0.725rem', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: '500', backgroundColor: '#F3F4F6', color: '#4B5563' }}>
        Khảo sát chung
      </span>
    );
  };

  // Danh sách các trường có trong DB để lọc
  const uniqueInstitutions = Array.from(new Set(surveys.map(s => s.institution).filter(Boolean)));

  // Lọc khảo sát
  const filteredSurveys = surveys.filter(s => {
    const matchInst = filterInstitution === 'all' || s.institution === filterInstitution;
    const matchAud = filterAudience === 'all' || s.audience === filterAudience;
    return matchInst && matchAud;
  });

  return (
    <div>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

      {/* HEADER & NÚT TẠO MỚI */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Bảng hỏi khảo sát
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Quản trị 4 bộ câu hỏi theo chức vụ, định danh theo trường/đơn vị và khai báo giả thuyết mô hình SEM
          </p>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            type="button"
            className="btn btn-outline" 
            onClick={async () => {
              try {
                setLoading(true);
                await surveysAPI.syncCounts();
                await fetchSurveys();
                showToast('Đã đồng bộ số lượng phản hồi theo thời gian thực!');
              } catch {
                await fetchSurveys();
              }
            }}
            disabled={loading}
            title="Đồng bộ lại số lượng phản hồi theo thời gian thực"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Đồng bộ số liệu</span>
          </button>
          {currentUser?.role !== 'viewer' && (
            <button className="btn btn-primary" onClick={handleOpenCreate} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={18} />
              Tạo bảng hỏi mới
            </button>
          )}
        </div>
      </div>

      {/* THANH BỘ LỌC ĐỊNH DANH THEO TRƯỜNG & CHỨC VỤ */}
      <div className="surveys-filter-bar" style={{ display: 'flex', gap: '1rem', alignItems: 'center', backgroundColor: 'white', padding: '0.875rem 1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '600' }}>
          <Filter size={16} /> Bộ lọc:
        </div>

        {/* Lọc theo Trường / Cơ sở */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Building2 size={16} color="var(--primary)" />
          <select 
            className="input" 
            style={{ minWidth: '220px', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
            value={filterInstitution}
            onChange={(e) => setFilterInstitution(e.target.value)}
          >
            <option value="all">-- Tất cả Trường / Cơ sở ({surveys.length}) --</option>
            {uniqueInstitutions.map(inst => (
              <option key={inst} value={inst}>{inst}</option>
            ))}
          </select>
        </div>

        {/* Lọc theo Bộ chức vụ */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={16} color="#059669" />
          <select 
            className="input" 
            style={{ minWidth: '220px', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
            value={filterAudience}
            onChange={(e) => setFilterAudience(e.target.value)}
          >
            <option value="all">-- Tất cả nhóm chức vụ --</option>
            <option value="leadership">Bộ 1: Ban Giám hiệu & Hội đồng trường</option>
            <option value="dept_head">Bộ 2: Trưởng / Phó Khoa, Phòng / Ban</option>
            <option value="lecturer_staff">Bộ 3: Giảng viên / Giáo viên / Nhân viên</option>
            <option value="student_alumni">Bộ 4: Người học & Cựu người học</option>
          </select>
        </div>

        {(filterInstitution !== 'all' || filterAudience !== 'all') && (
          <button 
            className="btn btn-outline" 
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
            onClick={() => { setFilterInstitution('all'); setFilterAudience('all'); }}
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {loading ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container">
            <table className="table">
              <thead style={{ backgroundColor: '#F9FAFB' }}>
                <tr>
                  <th>Tiêu đề &amp; Đơn vị định danh</th>
                  <th>Đối tượng chức vụ</th>
                  <th>Trạng thái</th>
                  <th className="table-hide-mobile">Thang đo</th>
                  <th>Tiến độ mẫu (N)</th>
                  <th className="table-hide-mobile">Biến nghiên cứu</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <SkeletonTableRows columns={7} rows={4} />
            </table>
          </div>
        </div>
      ) : filteredSurveys.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <FileSpreadsheet size={28} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>Chưa có bảng hỏi nào phù hợp</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: '400px' }}>
            Không tìm thấy bảng hỏi nào khớp với bộ lọc hiện tại. Hãy chọn bộ lọc khác hoặc tạo bảng hỏi mới!
          </p>
          {currentUser?.role !== 'viewer' && (
            <button className="btn btn-primary" onClick={handleOpenCreate}>
              <Plus size={18} />
              Tạo khảo sát ngay
            </button>
          )}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container">
            <table className="table">
              <thead style={{ backgroundColor: '#F9FAFB' }}>
                <tr>
                  <th>Tiêu đề &amp; Đơn vị định danh</th>
                  <th>Đối tượng chức vụ</th>
                  <th>Trạng thái</th>
                  <th className="table-hide-mobile">Thang đo</th>
                  <th>Tiến độ mẫu (N)</th>
                  <th className="table-hide-mobile">Biến nghiên cứu</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredSurveys.map((survey) => (
                  <tr key={survey.id}>
                    <td>
                      <div style={{ fontWeight: '600', marginBottom: '0.35rem', color: '#1E293B' }}>{survey.title}</div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.75rem' }}>
                        {/* THẺ ĐỊNH DANH TRƯỜNG / ĐƠN VỊ */}
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.15rem 0.5rem', backgroundColor: '#F3E8FF', color: '#6B21A8', borderRadius: '4px', fontWeight: '600' }}>
                          <Building2 size={12} />
                          {survey.institution || 'Cơ sở giáo dục đại học'}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>•</span>
                        <span style={{ color: 'var(--text-muted)' }}>{survey.questions_count} câu hỏi</span>
                        <span style={{ color: 'var(--text-muted)' }}>•</span>
                        <span style={{ color: 'var(--text-muted)' }}>{(survey.hypotheses || []).length} giả thuyết SEM</span>
                      </div>
                    </td>
                    <td>
                      {getRoleBadge(survey.audience)}
                    </td>
                    <td>
                      <button 
                        onClick={() => handleToggleStatus(survey)}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: currentUser?.role !== 'viewer' ? 'pointer' : 'default' }}
                      >
                        {getStatusBadge(survey.status)}
                      </button>
                    </td>
                    <td className="table-hide-mobile">
                      <span style={{ fontSize: '0.75rem', backgroundColor: '#EFF6FF', color: '#3B82F6', padding: '0.25rem 0.5rem', borderRadius: '4px', fontWeight: '500' }}>
                        {survey.scale}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600', marginBottom: '0.2rem', fontSize: '0.85rem' }}>
                        {survey.responses_count} / {survey.target}
                      </div>
                      {survey.valid_responses_count !== undefined && survey.valid_responses_count < survey.responses_count && (
                        <div style={{ fontSize: '0.7rem', color: '#059669', marginBottom: '0.25rem', fontWeight: '500' }}>
                          ({survey.valid_responses_count} hợp lệ)
                        </div>
                      )}
                      <div style={{ width: '100px', height: '5px', backgroundColor: 'var(--bg-surface-hover)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            width: `${Math.min(100, (survey.responses_count / (survey.target || 1)) * 100)}%`, 
                            height: '100%', 
                            backgroundColor: survey.responses_count >= survey.target ? '#10B981' : 'var(--primary)', 
                            borderRadius: '3px' 
                          }}
                        ></div>
                      </div>
                    </td>
                    <td className="table-hide-mobile">
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {Array.isArray(survey.variables) && survey.variables.map(v => (
                          <span key={v} style={{ fontSize: '0.65rem', border: '1px solid var(--border-color)', borderRadius: '3px', padding: '0.1rem 0.3rem', color: '#475569', backgroundColor: '#F8FAFC', fontWeight: '600' }}>
                            {v}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {/* NÚT PHÂN TÍCH 5 KHÂU APA 7 */}
                        <Link 
                          to={`/analytics?surveyId=${survey.id}`}
                          className="btn-outline" 
                          style={{ padding: '0.35rem', borderRadius: 'var(--radius-md)', color: '#4338CA', backgroundColor: '#EEF2FF', borderColor: '#C7D2FE', display: 'inline-flex', alignItems: 'center' }} 
                          title="Phân tích thống kê 5 khâu chuẩn APA 7 cho khảo sát này"
                        >
                          <BarChart2 size={16} />
                        </Link>

                        {/* NÚT THIẾT KẾ CÂU HỎI & GIẢ THUYẾT */}
                        <button 
                          className="btn-outline" 
                          style={{ padding: '0.35rem', borderRadius: 'var(--radius-md)', color: 'var(--primary)', backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }} 
                          title="Thiết kế bộ câu hỏi & Khai báo giả thuyết"
                          onClick={() => handleOpenQuestionBuilder(survey)}
                        >
                          <ListPlus size={16} />
                        </button>


                        {/* NÚT MÃ QR CODE */}
                        <button 
                          className="btn-outline" 
                          style={{ padding: '0.35rem', borderRadius: 'var(--radius-md)', color: '#0284C7', backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }} 
                          title="Tạo mã QR Code để quét điện thoại"
                          onClick={() => handleOpenQRModal(survey)}
                        >
                          <QrCode size={16} />
                        </button>

                        {/* NÚT XEM TRƯỚC (PREVIEW) */}
                        <button 
                          className="btn-outline" 
                          style={{ padding: '0.35rem', borderRadius: 'var(--radius-md)', color: '#059669', backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }} 
                          title="Xem trước biểu mẫu khảo sát (Preview)"
                          onClick={() => handlePreviewSurvey(survey.id)}
                        >
                          <Eye size={16} />
                        </button>

                        {/* NÚT NHÂN BẢN (CLONE) 1-CLICK */}
                        {currentUser?.role !== 'viewer' && (
                          <button 
                            className="btn-outline" 
                            style={{ padding: '0.35rem', borderRadius: 'var(--radius-md)', color: '#D97706', backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }} 
                            title="Nhân bản bảng hỏi (Clone)"
                            onClick={() => handleCloneSurvey(survey)}
                          >
                            <Copy size={16} />
                          </button>
                        )}

                        {currentUser?.role !== 'viewer' && (
                          <button 
                            className="btn-outline" 
                            style={{ padding: '0.35rem', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }} 
                            title="Chỉnh sửa thông tin"
                            onClick={() => handleOpenEdit(survey)}
                          >
                            <Edit size={16} />
                          </button>
                        )}
                        <button 
                          className="btn-outline" 
                          style={{ padding: '0.35rem', borderRadius: 'var(--radius-md)', color: 'var(--primary)' }} 
                          title="Sao chép link khảo sát"
                          onClick={() => handleShare(survey)}
                        >
                          <Share2 size={16} />
                        </button>
                        <button 
                          className="btn-outline" 
                          style={{ padding: '0.35rem', borderRadius: 'var(--radius-md)', color: '#8B5CF6' }} 
                          title="Phân tích dữ liệu học thuật"
                          onClick={() => handleAnalyze(survey)}
                        >
                          <BarChart2 size={16} />
                        </button>
                        {currentUser?.role !== 'viewer' && (
                          <button 
                            className="btn-outline" 
                            style={{ padding: '0.35rem', borderRadius: 'var(--radius-md)', color: 'var(--danger)' }} 
                            title="Xóa khảo sát"
                            onClick={() => setDeleteConfirmId(survey.id)}
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

      {/* ========================================================= */}
      {/* MODAL TẠO MỚI BẢNG HỎI (HỖ TRỢ THEO CHỨC VỤ & ĐƠN VỊ ĐỊNH DANH) */}
      {/* ========================================================= */}
      {isCreateOpen && (
        <div className="modal-backdrop" onClick={() => setIsCreateOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '820px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Khởi tạo Bảng hỏi Khảo sát mới</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Lựa chọn bộ mẫu chuẩn hóa theo chức vụ và định danh theo trường/cơ sở giáo dục để thu thập xử lý
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setIsCreateOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                
                {/* 1. CHỌN MẪU BỘ CÂU HỎI THEO CHỨC VỤ */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label" style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={16} color="var(--primary)" />
                    Bước 1: Chọn Bộ câu hỏi chuẩn hóa theo Chức vụ / Đối tượng:
                  </label>
                  <div className="form-grid-2col" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                    {Object.keys(ROLE_QUESTIONNAIRES).map((roleKey) => {
                      const tmpl = ROLE_QUESTIONNAIRES[roleKey];
                      const isSelected = selectedRoleTemplate === roleKey;
                      const IconComp = tmpl.icon;

                      return (
                        <div
                          key={roleKey}
                          onClick={() => applyRoleTemplate(roleKey)}
                          style={{
                            padding: '0.875rem 1rem',
                            borderRadius: '8px',
                            border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                            backgroundColor: isSelected ? '#EFF6FF' : '#F9FAFB',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <div style={{ padding: '0.35rem', borderRadius: '6px', backgroundColor: tmpl.badgeBg, color: tmpl.badgeColor }}>
                              <IconComp size={16} />
                            </div>
                            <span style={{ fontWeight: '700', fontSize: '0.875rem', color: isSelected ? 'var(--primary)' : 'var(--text-main)' }}>
                              {tmpl.roleName}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                            {tmpl.subtitle}
                          </div>
                          <div style={{ marginTop: '0.4rem', fontSize: '0.7rem', color: 'var(--primary)', fontWeight: '600' }}>
                            ✓ 10 câu Likert + 2 câu mở định tính
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. ĐỊNH DANH THEO TRƯỜNG / ĐƠN VỊ ĐIỀN */}
                <div style={{ padding: '1rem', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '1.25rem' }}>
                  <label className="form-label" style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Building2 size={16} color="var(--primary)" />
                    Bước 2: Tên Trường / Đơn vị thực hiện khảo sát (Định danh dữ liệu) *
                  </label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="VD: Trường Đại học Sư phạm Hà Nội, Trường ĐH Bách Khoa..." 
                    value={formData.institution}
                    onChange={(e) => {
                      const newInst = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        institution: newInst,
                        title: selectedRoleTemplate && ROLE_QUESTIONNAIRES[selectedRoleTemplate] 
                          ? `${ROLE_QUESTIONNAIRES[selectedRoleTemplate].defaultTitle} — ${newInst || 'Trường Đại học'}`
                          : prev.title
                      }));
                    }}
                    required
                  />
                  <span className="form-hint">Mọi phiếu phản hồi thu thập sẽ được gắn định danh vào trường/cơ sở này để phục vụ phân tích so sánh và làm sạch dữ liệu.</span>
                </div>

                {/* 3. TIÊU ĐỀ & MÔ TẢ CHI TIẾT */}
                <div className="form-group">
                  <label className="form-label">Tiêu đề bảng hỏi khảo sát *</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Mục tiêu &amp; Phạm vi nghiên cứu (Subtitle)</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  />
                </div>

                <div className="form-grid-3col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Thang đo đo lường</label>
                    <select 
                      className="input"
                      value={formData.scale}
                      onChange={(e) => setFormData({ ...formData, scale: e.target.value })}
                    >
                      <option value="Likert 5">Likert 5 mức độ (Chuẩn)</option>
                      <option value="Likert 7">Likert 7 mức độ</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Mục tiêu số mẫu (N)</label>
                    <input 
                      type="number" 
                      className="input" 
                      value={formData.target}
                      onChange={(e) => setFormData({ ...formData, target: parseInt(e.target.value) || 50 })}
                      min="10"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Trạng thái khởi tạo</label>
                    <select 
                      className="input"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Active">Đang mở (Active)</option>
                      <option value="Draft">Bản nháp (Draft)</option>
                      <option value="Closed">Đã đóng (Closed)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Các biến nghiên cứu trong mô hình</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={formData.variables}
                    onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
                  />
                </div>

                {/* XEM TRƯỚC SỐ CÂU HỎI ĐÃ NẠP TỰ ĐỘNG */}
                <div style={{ padding: '0.75rem 1rem', backgroundColor: '#ECFDF5', borderRadius: '6px', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', color: '#065F46', fontWeight: '600' }}>
                    ✓ Đã tự động nạp {formData.questions.length} câu hỏi &amp; {formData.hypotheses.length} giả thuyết SEM cho bộ này.
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#047857' }}>
                    Có thể tùy biến thêm bớt trong mục Thiết kế câu hỏi sau khi tạo.
                  </span>
                </div>

              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsCreateOpen(false)} disabled={isSubmitting}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Đang tạo...' : 'Tạo khảo sát'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL CHỈNH SỬA BẢNG HỎI */}
      {/* ========================================================= */}
      {isEditOpen && selectedSurvey && (
        <div className="modal-backdrop" onClick={() => setIsEditOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Chỉnh sửa bảng hỏi #{selectedSurvey.id}</h2>
              <button className="modal-close-btn" onClick={() => setIsEditOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Tên Trường / Đơn vị khảo sát (Định danh) *</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={formData.institution}
                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tiêu đề khảo sát *</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Mục tiêu &amp; Phạm vi (Subtitle)</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  />
                </div>

                <div className="form-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Nhóm chức vụ / Đối tượng</label>
                    <select
                      className="input"
                      value={formData.audience}
                      onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                    >
                      <option value="leadership">Ban Giám hiệu &amp; Hội đồng trường</option>
                      <option value="dept_head">Trưởng / Phó Khoa, Phòng / Ban</option>
                      <option value="lecturer_staff">Giảng viên / Giáo viên / Nhân viên</option>
                      <option value="student_alumni">Học sinh / Sinh viên / Cựu SV / Sau ĐH</option>
                      <option value="custom">Tùy chỉnh khác</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Mục tiêu số mẫu (N)</label>
                    <input 
                      type="number" 
                      className="input" 
                      value={formData.target}
                      onChange={(e) => setFormData({ ...formData, target: parseInt(e.target.value) || 100 })}
                    />
                  </div>
                </div>

                <div className="form-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Thang đo đo lường</label>
                    <select 
                      className="input"
                      value={formData.scale}
                      onChange={(e) => setFormData({ ...formData, scale: e.target.value })}
                    >
                      <option value="Likert 5">Likert 5 mức độ</option>
                      <option value="Likert 7">Likert 7 mức độ</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Trạng thái</label>
                    <select 
                      className="input"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Active">Đang mở (Active)</option>
                      <option value="Draft">Bản nháp (Draft)</option>
                      <option value="Closed">Đã đóng (Closed)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Các biến nghiên cứu</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={formData.variables}
                    onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
                  />
                </div>

                {/* LIÊN KẾT NHANH SANG THIẾT KẾ CÂU HỎI */}
                <div style={{ padding: '0.875rem 1rem', backgroundColor: '#EEF2FF', borderRadius: '8px', border: '1px solid #C7D2FE', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginTop: '1.25rem' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.875rem', color: '#1E3A8A', marginBottom: '0.2rem' }}>
                      Nội dung câu hỏi ({formData.questions?.length || 0} câu) &amp; Giả thuyết ({formData.hypotheses?.length || 0})
                    </div>
                    <div style={{ fontSize: '0.775rem', color: '#4B5563' }}>
                      Chỉnh sửa câu chữ, thêm/bớt câu hỏi hoặc khai báo các giả thuyết SEM cho bảng hỏi này
                    </div>
                  </div>
                  <button 
                    type="button" 
                    className="btn btn-outline"
                    style={{ backgroundColor: 'white', borderColor: '#93C5FD', color: 'var(--primary)', fontSize: '0.8rem', padding: '0.45rem 0.85rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    onClick={() => {
                      setIsEditOpen(false);
                      handleOpenQuestionBuilder(selectedSurvey);
                    }}
                  >
                    <ListPlus size={16} />
                    Chỉnh sửa câu hỏi
                  </button>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsEditOpen(false)} disabled={isSubmitting}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL THIẾT KẾ BỘ CÂU HỎI & KHAI BÁO GIẢ THUYẾT */}
      {/* ========================================================= */}
      {isQuestionBuilderOpen && selectedSurvey && (
        <div className="modal-backdrop" onClick={() => setIsQuestionBuilderOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '840px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Thiết kế bộ câu hỏi: {selectedSurvey.title}</h2>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <span>Trường: <strong>{selectedSurvey.institution || 'Chung'}</strong></span>
                  <span>•</span>
                  <span>Thang đo: {selectedSurvey.scale}</span>
                  <span>•</span>
                  <span>Tổng số: {currentQuestions.length} câu hỏi</span>
                  <span>•</span>
                  <span>{currentHypotheses.length} giả thuyết SEM</span>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setIsQuestionBuilderOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', backgroundColor: '#F9FAFB', padding: '0 1rem' }}>
              <button
                type="button"
                onClick={() => setBuilderTab('questions')}
                className={`tab-btn ${builderTab === 'questions' ? 'active' : ''}`}
              >
                1. Bộ câu hỏi nghiên cứu ({currentQuestions.length})
              </button>
              <button
                type="button"
                onClick={() => setBuilderTab('hypotheses')}
                className={`tab-btn ${builderTab === 'hypotheses' ? 'active' : ''}`}
              >
                2. Khai báo Giả thuyết SEM ({currentHypotheses.length})
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '62vh', overflowY: 'auto' }}>
              {builderTab === 'questions' ? (
                <div>
                  {/* THANH NẠP NHANH TRỌN BỘ CÂU HỎI THEO CHỨC VỤ */}
                  <div style={{ padding: '0.875rem 1rem', backgroundColor: '#F0FDF4', borderRadius: 'var(--radius-md)', border: '1px solid #BBF7D0', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                      <CheckCircle size={16} color="#16A34A" />
                      <span style={{ fontWeight: '700', fontSize: '0.85rem', color: '#15803D' }}>
                        Nạp nhanh trọn bộ 10 câu Likert theo nhóm chức vụ:
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', backgroundColor: 'white', color: '#1E3A8A', border: '1px solid #BFDBFE' }}
                        onClick={() => handleLoadFullRoleQuestions('leadership')}
                      >
                        Nạp Bộ 1 (BGH &amp; Hội đồng trường)
                      </button>
                      <button
                        type="button"
                        className="btn"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', backgroundColor: 'white', color: '#065F46', border: '1px solid #A7F3D0' }}
                        onClick={() => handleLoadFullRoleQuestions('dept_head')}
                      >
                        Nạp Bộ 2 (Trưởng/Phó Khoa, Phòng)
                      </button>
                      <button
                        type="button"
                        className="btn"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', backgroundColor: 'white', color: '#7C2D12', border: '1px solid #FED7AA' }}
                        onClick={() => handleLoadFullRoleQuestions('lecturer_staff')}
                      >
                        Nạp Bộ 3 (Giảng viên &amp; CBNV)
                      </button>
                      <button
                        type="button"
                        className="btn"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', backgroundColor: 'white', color: '#4C1D95', border: '1px solid #DDD6FE' }}
                        onClick={() => handleLoadFullRoleQuestions('student_alumni')}
                      >
                        Nạp Bộ 4 (Người học &amp; Cựu SV)
                      </button>
                    </div>
                  </div>

                  {/* TÍNH NĂNG SINH THEO TỪNG BIẾN */}
                  <div style={{ padding: '0.875rem 1rem', backgroundColor: '#EFF6FF', borderRadius: 'var(--radius-md)', border: '1px solid #BFDBFE', marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.8rem', color: '#1E40AF', marginBottom: '0.5rem', fontWeight: '600' }}>
                      Hoặc chèn câu hỏi đo lường theo từng biến nghiên cứu:
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {['STR', 'LEA', 'CAP', 'RES', 'SER', 'REA'].map(v => (
                        <button
                          key={v}
                          type="button"
                          className="btn"
                          style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', backgroundColor: 'white', color: '#1E40AF', border: '1px solid #93C5FD' }}
                          onClick={() => handleGenerateSampleQuestions(v)}
                        >
                          + Biến <strong>{v}</strong>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* FORM THÊM CÂU HỎI TÙY CHỈNH */}
                  <div style={{ padding: '1rem', backgroundColor: '#F9FAFB', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
                    <span style={{ fontWeight: '600', fontSize: '0.85rem', display: 'block', marginBottom: '0.75rem' }}>
                      Thêm câu hỏi tùy chỉnh mới:
                    </span>
                    <div className="question-add-grid" style={{ display: 'grid', gridTemplateColumns: '110px 140px 100px 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                      <select 
                        className="input" 
                        value={newQuestionVar}
                        onChange={(e) => setNewQuestionVar(e.target.value)}
                        title="Thuộc biến nghiên cứu"
                      >
                        {['STR', 'LEA', 'CAP', 'RES', 'SER', 'REA', 'QUALITATIVE', 'KHAC'].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>

                      <select
                        className="input"
                        value={newQuestionType}
                        onChange={(e) => setNewQuestionType(e.target.value)}
                        title="Loại câu hỏi"
                      >
                        <option value="likert">Thang đo Likert</option>
                        <option value="textarea">Tự luận (Văn bản)</option>
                        <option value="text">Câu trả lời ngắn</option>
                        <option value="choice">Một lựa chọn</option>
                      </select>

                      <input 
                        type="text" 
                        className="input" 
                        placeholder="Mã (STR3/TXT)" 
                        value={newQuestionCode}
                        onChange={(e) => setNewQuestionCode(e.target.value)}
                      />

                      <input 
                        type="text" 
                        className="input" 
                        placeholder={newQuestionType === 'textarea' ? 'VD: Ý kiến nhận xét, đề xuất của bạn...' : 'Nội dung câu hỏi khảo sát...'} 
                        value={newQuestionText}
                        onChange={(e) => setNewQuestionText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomQuestion(); } }}
                      />

                      <button 
                        type="button" 
                        className="btn btn-primary"
                        onClick={handleAddCustomQuestion}
                      >
                        Thêm
                      </button>
                    </div>
                  </div>

                  {/* DANH SÁCH CÂU HỎI HIỆN TẠI */}
                  <div>
                    <span style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '0.75rem', display: 'block' }}>
                      Danh sách câu hỏi trong bảng ({currentQuestions.length} câu):
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {currentQuestions.map((q, idx) => {
                        const isText = q.type === 'textarea' || q.type === 'text';
                        const typeLabel = q.type === 'textarea' ? 'Tự luận' : (q.type === 'text' ? 'Text ngắn' : (q.type === 'choice' ? 'Trắc nghiệm' : 'Likert'));
                        const typeBadgeStyle = isText
                          ? { backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }
                          : (q.type === 'choice' ? { backgroundColor: '#F3E8FF', color: '#6B21A8' } : { backgroundColor: '#EEF2FF', color: '#3730A3' });

                        return (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: 'white', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                              <span style={{ fontWeight: '700', fontSize: '0.8rem', padding: '0.2rem 0.5rem', backgroundColor: '#EEF2FF', color: 'var(--primary)', borderRadius: '4px', minWidth: '50px', textAlign: 'center' }}>
                                {q.code}
                              </span>
                              <span style={{ fontSize: '0.75rem', fontWeight: '600', padding: '0.15rem 0.5rem', borderRadius: '4px', ...typeBadgeStyle }}>
                                {typeLabel}
                              </span>
                              {q.variable && (
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', border: '1px solid var(--border-color)', padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: '#F9FAFB' }}>
                                  {q.variable}
                                </span>
                              )}
                              {editingQuestionIndex === idx ? (
                                <div style={{ display: 'flex', gap: '0.5rem', flex: 1, alignItems: 'center' }}>
                                  <input 
                                    type="text" 
                                    className="input" 
                                    style={{ flex: 1, fontSize: '0.85rem', padding: '0.3rem 0.6rem' }}
                                    value={editingQuestionText}
                                    onChange={(e) => setEditingQuestionText(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSaveEditQuestion(idx);
                                      } else if (e.key === 'Escape') {
                                        setEditingQuestionIndex(null);
                                      }
                                    }}
                                    autoFocus
                                  />
                                  <button 
                                    type="button" 
                                    className="btn btn-primary" 
                                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                                    onClick={() => handleSaveEditQuestion(idx)}
                                  >
                                    Lưu
                                  </button>
                                  <button 
                                    type="button" 
                                    className="btn btn-outline" 
                                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                                    onClick={() => setEditingQuestionIndex(null)}
                                  >
                                    Hủy
                                  </button>
                                </div>
                              ) : (
                                <span style={{ fontSize: '0.875rem', color: 'var(--text-main)', flex: 1 }}>{q.text}</span>
                              )}
                            </div>
                            {editingQuestionIndex !== idx && (
                              <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                                <button 
                                  type="button" 
                                  style={{ color: 'var(--primary)', padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer' }}
                                  onClick={() => {
                                    setEditingQuestionIndex(idx);
                                    setEditingQuestionText(q.text);
                                  }}
                                  title="Chỉnh sửa nội dung câu hỏi này"
                                >
                                  <Edit size={16} />
                                </button>
                                <button 
                                  type="button" 
                                  style={{ color: 'var(--danger)', padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer' }}
                                  onClick={() => handleDeleteQuestion(idx)}
                                  title="Xóa câu hỏi này"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* TAB GIẢ THUYẾT NGHIÊN CỨU SEM */
                <div>
                  <div style={{ padding: '1rem', backgroundColor: '#F0FDF4', borderRadius: 'var(--radius-md)', border: '1px solid #BBF7D0', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <CheckCircle size={18} color="#16A34A" />
                      <span style={{ fontWeight: '700', fontSize: '0.875rem', color: '#15803D' }}>
                        Khai báo giả thuyết nghiên cứu (Mô hình SEM):
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#15803D', marginBottom: '0.75rem' }}>
                      Các giả thuyết này sẽ được sử dụng trực tiếp trong tab Kiểm định giả thuyết (Phân tích hồi quy &amp; PLS-SEM):
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button 
                        type="button" 
                        className="btn" 
                        style={{ fontSize: '0.75rem', backgroundColor: 'white', color: '#15803D', border: '1px solid #86EFAC' }}
                        onClick={() => handleAddHypothesis('STR', 'REA')}
                      >
                        + Khai báo H: STR ➔ REA
                      </button>
                      <button 
                        type="button" 
                        className="btn" 
                        style={{ fontSize: '0.75rem', backgroundColor: 'white', color: '#15803D', border: '1px solid #86EFAC' }}
                        onClick={() => handleAddHypothesis('LEA', 'REA')}
                      >
                        + Khai báo H: LEA ➔ REA
                      </button>
                      <button 
                        type="button" 
                        className="btn" 
                        style={{ fontSize: '0.75rem', backgroundColor: 'white', color: '#15803D', border: '1px solid #86EFAC' }}
                        onClick={() => handleAddHypothesis('CAP', 'SER')}
                      >
                        + Khai báo H: CAP ➔ SER
                      </button>
                      <button 
                        type="button" 
                        className="btn" 
                        style={{ fontSize: '0.75rem', backgroundColor: 'white', color: '#15803D', border: '1px solid #86EFAC' }}
                        onClick={() => handleAddHypothesis('RES', 'REA')}
                      >
                        + Khai báo H: RES ➔ REA
                      </button>
                      <button 
                        type="button" 
                        className="btn" 
                        style={{ fontSize: '0.75rem', backgroundColor: 'white', color: '#15803D', border: '1px solid #86EFAC' }}
                        onClick={() => handleAddHypothesis('RES', 'SER')}
                      >
                        + Khai báo H: RES ➔ SER
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {currentHypotheses.map((h, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'white', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{h.code}:</span>
                            <span style={{ fontWeight: '600' }}>{h.name}</span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{h.description}</div>
                        </div>
                        <button 
                          type="button" 
                          style={{ color: 'var(--danger)', padding: '0.25rem', background: 'none' }}
                          onClick={() => setCurrentHypotheses(currentHypotheses.filter((_, i) => i !== idx))}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setIsQuestionBuilderOpen(false)} disabled={isSubmitting}>
                Đóng
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSaveQuestionBuilder} disabled={isSubmitting}>
                {isSubmitting ? 'Đang lưu...' : 'Lưu cấu hình câu hỏi & giả thuyết'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL MÃ QR CODE */}
      {/* ========================================================= */}
      {qrModalSurvey && (
        <div className="modal-backdrop" onClick={() => setQrModalSurvey(null)}>
          <div className="modal-content" style={{ maxWidth: '460px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Mã QR Khảo Sát #{qrModalSurvey.id}</h2>
              <button className="modal-close-btn" onClick={() => setQrModalSurvey(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', backgroundColor: '#F3E8FF', color: '#6B21A8', borderRadius: '4px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Building2 size={12} />
                  {qrModalSurvey.institution || 'Cơ sở giáo dục đại học'}
                </span>
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', marginBottom: '0.25rem', color: 'var(--text-main)' }}>
                {qrModalSurvey.title}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Người tham gia chỉ cần mở Camera điện thoại hoặc Zalo quét mã dưới đây để vào làm bài ngay lập tức:
              </p>

              {qrCodeDataUrl && (
                <div style={{ padding: '1rem', backgroundColor: 'white', borderRadius: '12px', border: '2px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', marginBottom: '1.25rem' }}>
                  <img src={qrCodeDataUrl} alt="Mã QR Khảo sát" style={{ width: '220px', height: '220px', maxWidth: '100%', display: 'block' }} />
                </div>
              )}

              <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                <input 
                  type="text" 
                  readOnly 
                  value={`${window.location.origin}/survey/${qrModalSurvey.id}`}
                  style={{ flex: 1, background: 'none', border: 'none', fontSize: '0.75rem', color: 'var(--text-main)', outline: 'none' }}
                />
                <button 
                  type="button" 
                  className="btn" 
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', backgroundColor: copiedLink ? '#10B981' : 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  onClick={() => handleCopySurveyLink(qrModalSurvey.id)}
                >
                  {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                  {copiedLink ? 'Đã chép' : 'Sao chép'}
                </button>
              </div>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center', gap: '1rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => setQrModalSurvey(null)}>
                Đóng
              </button>
              <button type="button" className="btn btn-primary" onClick={handleDownloadQR}>
                <Download size={16} /> Tải ảnh QR (.png)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN XÓA */}
      {deleteConfirmId && (
        <div className="modal-backdrop" onClick={() => setDeleteConfirmId(null)}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-body" style={{ textAlign: 'center', paddingTop: '2rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#FEE2E2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <AlertTriangle size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Xác nhận xóa bảng hỏi?</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Hành động này sẽ xóa vĩnh viễn bảng hỏi cùng tất cả các dữ liệu phản hồi liên quan đã thu thập. Không thể hoàn tác!
              </p>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button className="btn btn-outline" onClick={() => setDeleteConfirmId(null)} disabled={isSubmitting}>
                Hủy bỏ
              </button>
              <button 
                className="btn btn-danger" 
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang xóa...' : 'Đồng ý xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Surveys;
