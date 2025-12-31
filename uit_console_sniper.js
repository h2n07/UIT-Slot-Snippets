// =========================================================================
// UIT SLOT SNIPER - CONSOLE VERSION (DRAGGABLE + MINIMIZABLE)
// Repo: https://github.com/h2n07/UIT-Slot-Snippets
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

    // Âm thanh thông báo
    const alertSound = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");

    // --- TÍNH NĂNG CHỌN NHANH ---
    window.uit_autoSelectCourse = function(classCode) {
        try {
            console.log(`%c[Action] Đang tìm lớp ${classCode}...`, 'color:blue');
            const allRows = [...document.querySelectorAll('form table tr')];
            const targetRow = allRows.find(row => {
                const cell = row.querySelector('td:nth-child(2)');
                return cell && cell.textContent.trim() === classCode;
            });

            if (targetRow) {
                targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const originalBg = targetRow.style.backgroundColor;
                targetRow.style.backgroundColor = '#fef08a';
                targetRow.style.transition = 'background-color 0.5s';
                setTimeout(() => targetRow.style.backgroundColor = originalBg, 3000);

                const checkbox = targetRow.querySelector('td:first-child input[type="checkbox"]');
                if (checkbox) {
                    if (!checkbox.checked) {
                        checkbox.click();
                        console.log(`%c✅ Đã tick chọn lớp ${classCode}!`, 'color:green; font-weight:bold; font-size:14px');
                        showToast(`Đã chọn: ${classCode}`);
                    } else {
                        showToast(`Lớp ${classCode} đã chọn rồi!`);
                    }
                }
            } else {
                alert(`Không tìm thấy lớp ${classCode} trong bảng đăng ký.`);
            }
        } catch (e) { console.error(e); }
    };

    function showToast(msg) {
        const toast = document.createElement('div');
        toast.innerText = msg;
        toast.style.cssText = `position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:rgba(0,0,0,0.8); color:white; padding:10px 20px; border-radius:20px; z-index:1000000; font-size:14px; transition: opacity 0.5s;`;
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(()=>toast.remove(), 500); }, 2000);
    }

    // --- HÀM TOKEN ---
    function getAutoToken() {
        const manualToken = localStorage.getItem(STORAGE_KEY_TOKEN);
        if (manualToken) return manualToken;
        const commonKeys = ['token', 'access_token', 'auth', 'user', 'user_token'];
        for (const key of commonKeys) {
            const val = localStorage.getItem(key);
            if (val && val.startsWith('eyJ')) return val;
            try { if (JSON.parse(val).token) return JSON.parse(val).token; } catch (e) {}
        }
        // Quét toàn bộ localStorage để tìm token nếu key lạ
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const val = localStorage.getItem(key);
            if (val && typeof val === 'string' && val.startsWith('eyJ') && val.length > 50) return val;
        }
        return null;
    }

    // --- 2. GIAO DIỆN UI (DRAGGABLE) ---
    const oldUi = document.getElementById('uit-sniper-ui');
    if (oldUi) oldUi.remove();

    const ui = document.createElement('div');
    ui.id = 'uit-sniper-ui';
    ui.style.cssText = `
        position: fixed; top: 20px; right: 20px; width: 380px;
        background: rgba(15, 23, 42, 0.95); color: #fff;
        border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        z-index: 999999; font-family: 'Segoe UI', sans-serif; font-size: 13px;
        border: 1px solid #334155; backdrop-filter: blur(5px);
        display: flex; flex-direction: column;
    `;
    
    ui.innerHTML = `
        <div id="ui-header" style="padding: 12px 16px; border-bottom: 1px solid #334155; display: flex; justify-content: space-between; align-items: center; cursor: move; user-select: none; background: rgba(30, 41, 59, 0.5); border-radius: 8px 8px 0 0;">
            <div style="font-weight: bold; color: #38bdf8;">🎯 UIT SLOT SNIPER <span style="font-size:10px; color:#64748b">v2.2</span></div>
            <div style="display:flex; gap:10px;">
                <button id="btn-minimize" title="Thu nhỏ" style="background:none; border:none; color:#94a3b8; cursor:pointer; font-size:18px; line-height:1;">−</button>
                <button id="btn-close-ui" title="Đóng" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:18px; line-height:1;">&times;</button>
            </div>
        </div>
        <div id="ui-body">
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
            <div id="ui-results" style="border-top: 1px solid #334155; max-height: 350px; overflow-y: auto;"></div>
        </div>
    `;
    document.body.appendChild(ui);

    // Elements
    const logBox = ui.querySelector('#ui-log');
    const resultBox = ui.querySelector('#ui-results');
    const statusLabel = ui.querySelector('#ui-status');
    const uiBody = ui.querySelector('#ui-body');
    const uiHeader = ui.querySelector('#ui-header');
    const btnMinimize = ui.querySelector('#btn-minimize');

    // --- DRAG LOGIC (Di chuyển) ---
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    uiHeader.onmousedown = function(e) {
        // Không drag khi click vào nút
        if (e.target.tagName === 'BUTTON') return;
        
        e.preventDefault();
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialLeft = ui.offsetLeft;
        initialTop = ui.offsetTop;
        
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    };

    function elementDrag(e) {
        e.preventDefault();
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        ui.style.top = (initialTop + dy) + "px";
        ui.style.left = (initialLeft + dx) + "px";
        ui.style.right = 'auto'; // Hủy right: 20px mặc định để di chuyển tự do
    }

    function closeDragElement() {
        isDragging = false;
        document.onmouseup = null;
        document.onmousemove = null;
    }

    // --- MINIMIZE LOGIC (Thu nhỏ) ---
    let isMinimized = false;
    btnMinimize.onclick = function() {
        isMinimized = !isMinimized;
        if (isMinimized) {
            uiBody.style.display = 'none';
            btnMinimize.innerHTML = '+';
            uiHeader.style.borderRadius = '8px'; // Bo tròn lại khi thu nhỏ
            uiHeader.style.borderBottom = 'none';
        } else {
            uiBody.style.display = 'block';
            btnMinimize.innerHTML = '−';
            uiHeader.style.borderRadius = '8px 8px 0 0';
            uiHeader.style.borderBottom = '1px solid #334155';
        }
    };

    function log(msg, color = '#cbd5e1') {
        const time = new Date().toLocaleTimeString('vi-VN', {hour12:false});
        const div = document.createElement('div');
        div.innerHTML = `<span style="color: #64748b">[${time}]</span> <span style="color: ${color}">${msg}</span>`;
        logBox.appendChild(div);
        logBox.scrollTop = logBox.scrollHeight;
    }

    // --- 3. LOGIC CHÍNH ---
    let token = getAutoToken();
    if (!token) {
        token = prompt("⚠️ Nhập Bearer Token (F12 -> Network -> Header):");
        if (token) localStorage.setItem(STORAGE_KEY_TOKEN, token);
    }

    if (!token) {
        log("Hủy bỏ do thiếu Token.", "#ef4444");
        statusLabel.innerText = "Lỗi: Thiếu Token";
        return;
    }

    const savedKeywords = localStorage.getItem(STORAGE_KEY_KEYWORDS) || "IT005, SS, MA005";
    const inputCourses = prompt("Nhập MÃ LỚP/MÔN (phân cách dấu phẩy):", savedKeywords);
    
    if (!inputCourses) {
        log("Hủy bỏ.", "#ef4444");
        return;
    }
    localStorage.setItem(STORAGE_KEY_KEYWORDS, inputCourses);
    const keywords = inputCourses.split(',').map(s => s.trim().toUpperCase()).filter(s => s);

    log(`Đang săn: ${keywords.join(', ')}`, "#38bdf8");

    async function checkSlots() {
        try {
            const res = await fetch(API_URL, {
                headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/json' }
            });

            if (res.status === 401) {
                log("Token hết hạn! F5 và nhập lại.", "#ef4444");
                localStorage.removeItem(STORAGE_KEY_TOKEN);
                stop();
                return;
            }

            const data = await res.json();
            const allCourses = data.courses || [];
            
            const targets = allCourses.filter(c => {
                const code = (c.malop || '').toUpperCase();
                const subject = (c.mamh || '').toUpperCase();
                const name = (c.tenmh || '').toUpperCase();
                return keywords.some(k => code.includes(k) || subject.includes(k) || name.includes(k));
            });

            resultBox.innerHTML = '';
            let availableCount = 0;

            if (targets.length === 0) {
                resultBox.innerHTML = '<div style="padding:10px; text-align:center; color:#64748b;">Không tìm thấy lớp nào khớp keyword</div>';
            }

            targets.forEach(c => {
                const con = (c.siso || 0) - (c.dadk || 0);
                if (con <= 0) return; 

                availableCount++;
                let timeInfo = "Chưa có lịch";
                let lecturer = "Chưa có GV";

                if (c.tghoc) {
                    const matchTime = c.tghoc.match(/(Thứ\s*[\d\*]+|Chủ nhật).*?(Tiết\s*[\d\w\-\*]+)/i);
                    timeInfo = matchTime ? `${matchTime[1]} - ${matchTime[2]}` : c.tghoc.split(',').slice(1,3).join(' ');
                    
                    const matchGV = c.tghoc.match(/Giảng viên:\s*([^,]+)/i);
                    if (matchGV) lecturer = matchGV[1].trim();
                    else if (c.magv) lecturer = `MGV: ${c.magv}`;
                }

                const row = document.createElement('div');
                row.style.cssText = `padding: 12px 16px; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center; background: rgba(34, 197, 94, 0.1);`;
                
                row.innerHTML = `
                    <div style="flex: 1; min-width: 0; padding-right: 10px;">
                        <div style="display: flex; align-items: baseline; gap: 8px;">
                            <span style="font-weight:bold; color: #4ade80; font-size: 15px;">${c.malop}</span>
                            <span style="font-size: 11px; color: #94a3b8; background: #1e293b; padding: 1px 4px; border-radius: 3px;">${c.dadk}/${c.siso}</span>
                        </div>
                        <div style="font-size: 13px; color: #e2e8f0; margin: 2px 0;">${c.tenmh}</div>
                        <div style="font-size: 11px; color: #fcd34d;">📅 ${timeInfo}</div>
                        <div style="font-size: 11px; color: #60a5fa;">👨‍🏫 ${lecturer}</div>
                    </div>
                    <div style="text-align: right; display:flex; flex-direction:column; gap:6px; align-items:flex-end;">
                        <div style="font-size: 13px; color: #4ade80; border: 1px solid #4ade80; padding: 2px 8px; border-radius: 4px;">CÒN ${con}</div>
                        <button onclick="window.uit_autoSelectCourse('${c.malop}')" 
                            style="background: #2563eb; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; cursor: pointer;">
                            ⚡ Chọn
                        </button>
                    </div>
                `;
                resultBox.appendChild(row);
            });

            if (availableCount > 0) {
                log(`!!! CÓ ${availableCount} LỚP TRỐNG !!!`, "#4ade80");
                statusLabel.innerText = "CÓ SLOT!";
                statusLabel.style.color = "#4ade80";
                alertSound.play().catch(()=>{});
                document.title = `(${availableCount}) CÓ SLOT !!!`;
            } else {
                resultBox.innerHTML = '<div style="padding:20px; text-align:center; color:#94a3b8;">Đang quét... chưa có lớp trống.</div>';
                log(`Check ${targets.length} lớp. Full hết.`, "#94a3b8");
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
        document.getElementById('btn-restart').disabled = true;
        document.getElementById('btn-stop').disabled = false;
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
        log("Đã dừng tool.");
    }

    document.getElementById('btn-close-ui').onclick = () => { stop(); ui.remove(); };
    document.getElementById('btn-stop').onclick = stop;
    document.getElementById('btn-restart').onclick = start;

    start();
})();
