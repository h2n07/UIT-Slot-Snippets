// =========================================================================
// UIT SLOT SNIPER - CONSOLE VERSION (AUTO TOKEN + SAVE CONFIG)
// Author: Your Name
// Repo: https://github.com/your-username/uit-slot-sniper
// =========================================================================

(async function() {
    console.clear();
    console.log("%c🚀 ĐANG KHỞI ĐỘNG UIT SNIPER...", "color: #00f; font-size: 20px; font-weight: bold;");

    // --- 1. CẤU HÌNH & HÀM TIỆN ÍCH ---
    const API_URL = 'https://dkhpapi.uit.edu.vn/courses';
    const CHECK_INTERVAL = 5000; // 5 giây check 1 lần
    const STORAGE_KEY_KEYWORDS = 'uit_sniper_keywords'; // Key lưu môn học
    const STORAGE_KEY_TOKEN = 'uit_sniper_manual_token'; // Key lưu token thủ công
    let intervalId = null;
    let isRunning = false;

    // Âm thanh thông báo (Tiếng Ping ngắn gọn)
    const alertSound = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");

    // Hàm tự động tìm Token trong LocalStorage
    function getAutoToken() {
        // 0. Ưu tiên token đã lưu thủ công từ lần trước (nếu có và chưa hết hạn)
        const manualToken = localStorage.getItem(STORAGE_KEY_TOKEN);
        if (manualToken) {
            console.log(`%c[Auto Token] Sử dụng token đã lưu thủ công`, "color: green");
            return manualToken;
        }

        // 1. Check các key phổ biến của trang web
        const commonKeys = ['token', 'access_token', 'auth', 'user', 'user_token'];
        for (const key of commonKeys) {
            const val = localStorage.getItem(key);
            if (val && val.startsWith('eyJ')) return val; // JWT thường bắt đầu bằng eyJ
            try {
                const parsed = JSON.parse(val);
                if (parsed && parsed.token) return parsed.token;
                if (parsed && parsed.accessToken) return parsed.accessToken;
            } catch (e) {}
        }
        
        // 2. Nếu không thấy, quét toàn bộ localStorage tìm chuỗi giống JWT
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const val = localStorage.getItem(key);
            if (val && typeof val === 'string' && val.startsWith('eyJ') && val.length > 50) {
                console.log(`%c[Auto Token] Tìm thấy token ở key: ${key}`, "color: green");
                return val;
            }
        }
        return null;
    }

    // --- 2. GIAO DIỆN UI (Mini Dashboard) ---
    // Xóa UI cũ nếu có
    const oldUi = document.getElementById('uit-sniper-ui');
    if (oldUi) oldUi.remove();

    const ui = document.createElement('div');
    ui.id = 'uit-sniper-ui';
    ui.style.cssText = `
        position: fixed; top: 10px; right: 10px; width: 350px;
        background: rgba(15, 23, 42, 0.95); color: #fff;
        border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        z-index: 999999; font-family: 'Segoe UI', sans-serif; font-size: 13px;
        border: 1px solid #334155; backdrop-filter: blur(5px);
        transition: all 0.3s ease;
    `;
    
    ui.innerHTML = `
        <div style="padding: 12px 16px; border-bottom: 1px solid #334155; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-weight: bold; color: #38bdf8;">🎯 UIT SLOT SNIPER</div>
            <button id="btn-close-ui" style="background:none; border:none; color:#94a3b8; cursor:pointer; font-size:16px;">&times;</button>
        </div>
        <div style="padding: 12px 16px;">
            <div style="margin-bottom: 8px; color: #94a3b8;">
                Trạng thái: <span id="ui-status" style="color: #fbbf24; font-weight: bold;">Đang chờ...</span>
            </div>
            <div id="ui-log" style="height: 100px; overflow-y: auto; background: #0f172a; border: 1px solid #334155; border-radius: 4px; padding: 8px; font-family: monospace; font-size: 11px; margin-bottom: 10px; color: #cbd5e1;">
                <div>> Ready to start...</div>
            </div>
            <div style="display: flex; gap: 8px;">
                <button id="btn-restart" style="flex: 1; padding: 6px; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Chạy lại</button>
                <button id="btn-stop" style="flex: 1; padding: 6px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Dừng</button>
            </div>
        </div>
        <div id="ui-results" style="border-top: 1px solid #334155; max-height: 300px; overflow-y: auto;"></div>
    `;
    document.body.appendChild(ui);

    // Helper update UI
    const logBox = ui.querySelector('#ui-log');
    const resultBox = ui.querySelector('#ui-results');
    const statusLabel = ui.querySelector('#ui-status');

    function log(msg, color = '#cbd5e1') {
        const time = new Date().toLocaleTimeString('vi-VN', {hour12:false});
        const div = document.createElement('div');
        div.innerHTML = `<span style="color: #64748b">[${time}]</span> <span style="color: ${color}">${msg}</span>`;
        logBox.appendChild(div);
        logBox.scrollTop = logBox.scrollHeight;
    }

    // --- 3. LOGIC CHÍNH ---

    // Bước 1: Lấy Token
    let token = getAutoToken();
    if (!token) {
        token = prompt("⚠️ Không tự tìm thấy Token. Vui lòng nhập Bearer Token thủ công (F12 -> Network -> Header):");
        if (token) {
            localStorage.setItem(STORAGE_KEY_TOKEN, token); // Lưu lại token thủ công
        }
    }

    if (!token) {
        log("Không có token. Hủy bỏ.", "#ef4444");
        statusLabel.innerText = "Lỗi: Thiếu Token";
        return;
    }

    // Bước 2: Nhập môn học (Lấy từ localStorage nếu có)
    const savedKeywords = localStorage.getItem(STORAGE_KEY_KEYWORDS) || "IT005, SS, MA005";
    const inputCourses = prompt("Nhập MÃ LỚP hoặc MÃ MÔN cần săn (phân cách dấu phẩy):", savedKeywords);
    
    if (!inputCourses) {
        log("Không nhập môn học. Hủy bỏ.", "#ef4444");
        return;
    }
    
    // Lưu lại từ khóa mới nhập
    localStorage.setItem(STORAGE_KEY_KEYWORDS, inputCourses);

    const keywords = inputCourses.split(',').map(s => s.trim().toUpperCase()).filter(s => s);

    log(`Token: ${token.substring(0, 10)}...`, "#38bdf8");
    log(`Mục tiêu: ${keywords.join(', ')}`, "#38bdf8");

    // Hàm fetch dữ liệu
    async function checkSlots() {
        try {
            const res = await fetch(API_URL, {
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Accept': 'application/json'
                }
            });

            if (res.status === 401) {
                log("Token hết hạn! Vui lòng lấy lại.", "#ef4444");
                localStorage.removeItem(STORAGE_KEY_TOKEN); // Xóa token lỗi để lần sau hỏi lại
                stop();
                return;
            }

            const data = await res.json();
            const allCourses = data.courses || [];
            
            // Lọc lớp theo từ khóa
            const targets = allCourses.filter(c => {
                const code = (c.malop || '').toUpperCase();
                const subject = (c.mamh || '').toUpperCase();
                const name = (c.tenmh || '').toUpperCase();
                return keywords.some(k => code.includes(k) || subject.includes(k) || name.includes(k));
            });

            // Update UI
            resultBox.innerHTML = '';
            let availableCount = 0;

            if (targets.length === 0) {
                resultBox.innerHTML = '<div style="padding:10px; text-align:center; color:#64748b;">Không tìm thấy lớp nào khớp keyword</div>';
            }

            targets.forEach(c => {
                const con = (c.siso || 0) - (c.dadk || 0);
                
                // Chỉ hiển thị lớp CÒN TRỐNG (con > 0)
                if (con <= 0) return;

                availableCount++;

                // Lấy thông tin Thứ + Tiết từ chuỗi tghoc
                let timeInfo = "Chưa có lịch cụ thể";
                if (c.tghoc) {
                    const match = c.tghoc.match(/(Thứ\s*[\d\*]+|Chủ nhật).*?(Tiết\s*[\d\w\-\*]+)/i);
                    if (match) {
                        timeInfo = `${match[1]} - ${match[2]}`;
                    } else {
                        timeInfo = c.tghoc.split(',').slice(1,3).join(' ').trim() || timeInfo;
                    }
                }

                const row = document.createElement('div');
                row.style.cssText = `
                    padding: 10px 16px; 
                    border-bottom: 1px solid #1e293b; 
                    display: flex; justify-content: space-between; 
                    align-items: center;
                    background: rgba(34, 197, 94, 0.15);
                `;
                
                row.innerHTML = `
                    <div style="width: 70%">
                        <div style="font-weight:bold; color: #4ade80; font-size: 14px;">${c.malop}</div>
                        <div style="font-size: 12px; color: #e2e8f0; margin-bottom: 2px;">${c.tenmh}</div>
                        <div style="font-size: 11px; color: #fcd34d; font-family: monospace;">📅 ${timeInfo}</div>
                    </div>
                    <div style="text-align: right">
                        <div style="font-size: 11px; color: #94a3b8">Đã ĐK: ${c.dadk}/${c.siso}</div>
                        <div style="font-size: 14px; font-weight: bold; color: #4ade80; border: 1px solid #4ade80; border-radius: 4px; padding: 2px 6px; display: inline-block; margin-top: 4px;">
                            CÒN ${con}
                        </div>
                    </div>
                `;
                resultBox.appendChild(row);
            });

            if (availableCount > 0) {
                log(`!!! PHÁT HIỆN ${availableCount} LỚP TRỐNG !!!`, "#4ade80");
                statusLabel.innerText = "CÓ SLOT!";
                statusLabel.style.color = "#4ade80";
                alertSound.play().catch(()=>{});
                document.title = `(${availableCount}) CÓ SLOT TRỐNG !!!`;
            } else {
                resultBox.innerHTML = '<div style="padding:20px; text-align:center; color:#94a3b8; font-style:italic;">Đang quét... chưa có lớp trống.</div>';
                log(`Đã check ${targets.length} lớp. Tất cả đều full.`, "#94a3b8");
                document.title = "UIT Sniper (Running...)";
                statusLabel.innerText = "Đang chạy...";
                statusLabel.style.color = "#38bdf8";
            }

        } catch (e) {
            log(`Lỗi mạng: ${e.message}`, "#ef4444");
        }
    }

    function start() {
        if (isRunning) return;
        isRunning = true;
        statusLabel.innerText = "Đang chạy...";
        statusLabel.style.color = "#38bdf8";
        document.getElementById('btn-restart').disabled = true;
        document.getElementById('btn-stop').disabled = false;
        document.getElementById('btn-restart').style.opacity = '0.5';
        document.getElementById('btn-stop').style.opacity = '1';
        
        checkSlots(); 
        intervalId = setInterval(checkSlots, CHECK_INTERVAL);
    }

    function stop() {
        isRunning = false;
        clearInterval(intervalId);
        statusLabel.innerText = "Đã dừng";
        statusLabel.style.color = "#f87171";
        document.getElementById('btn-restart').disabled = false;
        document.getElementById('btn-stop').disabled = true;
        document.getElementById('btn-restart').style.opacity = '1';
        document.getElementById('btn-stop').style.opacity = '0.5';
        log("Đã dừng tool.");
    }

    // Events
    document.getElementById('btn-close-ui').onclick = () => { stop(); ui.remove(); };
    document.getElementById('btn-stop').onclick = stop;
    document.getElementById('btn-restart').onclick = start;

    // Start
    start();

})();