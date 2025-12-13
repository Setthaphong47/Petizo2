// /mnt/data/vaccine-notification.js
(function() {
    'use strict';

    const API_URL = window.CONFIG?.API_URL || '/api';
    let currentNotifications = [];

    // ----------------- Utility / Helpers -----------------
    function logDebug(...args) {
        const enabled = true;
        if (enabled) console.log(...args);
    }

    function normalizeVaccineName(name) {
        if (!name) return '';
        return name.toString()
            .toLowerCase()
            // remove "(ครั้งที่ ...)" and similar parentheses
            .replace(/\([\s\S]*?ครั้งที่[\s\S]*?\)/g, '')
            // remove english booster, thai บูสเตอร์
            .replace(/\bboost(?:er)?\b/g, '')
            .replace(/บูสเตอร์/gi, '')
            // remove special chars except thai/english/numbers/space
            .replace(/[^a-z0-9ก-๙\s]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function calculateAgeInWeeks(birthDate) {
        if (!birthDate) return 0;
        const today = new Date();
        const birth = new Date(birthDate);
        if (isNaN(birth.getTime())) return 0;
        const diffTime = Math.abs(today - birth);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.floor(diffDays / 7);
    }

    function daysUntil(dateString) {
        if (!dateString) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const targetDate = new Date(dateString);
        if (isNaN(targetDate.getTime())) return null;
        targetDate.setHours(0, 0, 0, 0);
        const diffTime = targetDate - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    function formatThaiDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
                            'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        return `${date.getDate()} ${thaiMonths[date.getMonth()]} ${date.getFullYear() + 543}`;
    }

    // ----------------- UI Injection -----------------
    function injectNotificationModal() {
        if (document.getElementById('notificationModal')) {
            logDebug('Modal already exists');
            return;
        }

        const modalHTML = `
            <div class="notification-modal" id="notificationModal" role="dialog" aria-modal="true">
                <div class="notification-content" id="notificationContent">
                    <div class="notification-header">
                        <h2 class="notification-title">
                            <span><img src="/icon/alarm.png" alt="Notification" style="width:26px;height:26px;"></span>
                            <span>การแจ้งเตือนวัคซีน</span>
                        </h2>
                        <button class="close-modal-btn" id="closeModalBtn" aria-label="ปิด">×</button>
                    </div>
                    <div class="notification-body" id="notificationList">
                        <div class="loading">
                            <div class="spinner" aria-hidden="true"></div>
                            <div>กำลังโหลดการแจ้งเตือน</div>
                        </div>
                    </div>
                    <div class="notification-footer">
                        <button class="view-all-btn" id="viewAllNotifications">ดูทั้งหมด</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        logDebug('Modal HTML injected');
    }

    function injectNotificationStyles() {
        if (document.getElementById('notificationStyles')) return;
        const styles = `
            <style id="notificationStyles">
                .notification-modal { display: none; position: fixed; inset:0; background: rgba(0,0,0,0.5); z-index:10000; padding:20px; align-items:center; justify-content:center; }
                .notification-modal.active { display:flex; }
                .notification-content { background:white; border-radius:16px; width:100%; max-width:640px; max-height:80vh; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 8px 30px rgba(2,6,23,0.2); }
                .notification-header { padding:18px 20px; border-bottom:1px solid #f0f0f0; display:flex; justify-content:space-between; align-items:center; background: linear-gradient(135deg,#00bcd4 0%,#00e5ff 100%); color:white; }
                .notification-header .notification-title { font-size:18px; font-weight:700; display:flex; align-items:center; gap:10px; margin:0; }
                .close-modal-btn { width:36px; height:36px; border:none; background: rgba(255,255,255,0.15); border-radius:50%; cursor:pointer; font-size:22px; color:white; display:flex; align-items:center; justify-content:center; }
                .notification-body { padding:20px; overflow-y:auto; flex:1; background:#fbfbfc; }
                .notification-item { background:white; border:2px solid #e9ecef; border-radius:12px; padding:14px; margin-bottom:14px; transition:all 0.15s; cursor:pointer; position:relative; }
                .notification-item:hover { transform:translateY(-4px); box-shadow:0 6px 18px rgba(0,0,0,0.06); }
                .notification-close-btn { position:absolute; top:8px; right:10px; background:transparent; border:none; color:#888; font-size:18px; font-weight:bold; cursor:pointer; border-radius:50%; width:28px; height:28px; line-height:1; display:flex; align-items:center; justify-content:center; transition:background 0.15s; z-index:2; }
                .notification-close-btn:hover, .notification-close-btn:focus { background:#ffeaea; color:#d32f2f; }
                .notification-item.urgent { border-color:#ff6b6b; }
                .notification-item.warning { border-color:#ffb84d; }
                .notification-item.info { border-color:#00bcd4; }
                .notification-top { display:flex; gap:14px; align-items:flex-start; }
                .notification-icon { width:44px; height:44px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; background:#f0f8ff; }
                .notification-details { flex:1; }
                .pet-name { font-size:16px; font-weight:700; color:#111; margin-bottom:4px; }
                .vaccine-name { font-size:14px; font-weight:600; color:#444; margin-bottom:8px; }
                .notification-message { font-size:13px; color:#666; margin-bottom:6px; }
                .notification-date { font-size:12px; color:#888; }
                .notification-footer { padding:12px 20px; border-top:1px solid #f0f0f0; text-align:right; }
                .view-all-btn { background:#00bcd4; color:white; border:none; padding:8px 14px; border-radius:8px; font-weight:600; cursor:pointer; }
                .loading { text-align:center; color:#9aa1a8; padding:30px 0; }
                .spinner { width:36px; height:36px; border:4px solid #f3f3f3; border-top:4px solid #00bcd4; border-radius:50%; animation:spin 1s linear infinite; margin:0 auto 10px; }
                @keyframes spin { to { transform:rotate(360deg); } }
                @media (max-width:520px) {
                    .notification-content { max-width: 96%; border-radius:12px; }
                    .notification-header { padding:14px; }
                    .notification-body { padding:14px; }
                }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', styles);
        logDebug('Styles injected');
    }

    // ---- Replace the existing loadNotificationsCore with this debug-heavy version ----
    async function loadNotificationsCore() {
        logDebug('Loading notifications (core) - START');
        const token = localStorage.getItem('token');
        if (!token) {
            logDebug('No token found, skipping notifications');
            updateBadge(0);
            return [];
        }

        try {
            // 1) Load user's pets
            const petsResp = await fetch(`${API_URL}/pets`, { headers: { 'Authorization': `Bearer ${token}` } });
            logDebug('petsResp status:', petsResp.status);
            if (!petsResp.ok) {
                logDebug('Failed to fetch pets, status:', petsResp.status);
                updateBadge(0);
                return [];
            }
            const pets = await petsResp.json();
            logDebug('Pets loaded (count):', Array.isArray(pets) ? pets.length : typeof pets, pets);

            if (!pets || pets.length === 0) {
                displayEmptyState();
                return [];
            }

            // 2) Load vaccine schedules once
            const schedulesResp = await fetch(`${API_URL}/vaccine-schedules`);
            logDebug('schedulesResp status:', schedulesResp.status);
            const schedules = schedulesResp.ok ? await schedulesResp.json() : [];
            logDebug('Schedules loaded (count):', Array.isArray(schedules) ? schedules.length : 0, schedules);

            let allNotifications = [];

            // 3) For each pet, load vaccination history & compute notifications
            for (const pet of pets) {
                logDebug('--- START processing pet ---', pet.id, pet.name, pet.birth_date || pet.birthDate || pet.birthDateString);
                try {
                    const historyUrl = `${API_URL}/pets/${pet.id}/vaccinations`;
                    logDebug('Fetching history for pet', pet.id, 'url:', historyUrl);
                    const historyResp = await fetch(historyUrl, { headers: { 'Authorization': `Bearer ${token}` } });
                    logDebug(`historyResp for pet ${pet.id} status:`, historyResp.status);

                    if (!historyResp.ok) {
                        // record a debug notification so we know this pet's history failed
                        logDebug('Failed to fetch history for pet', pet.id, 'status:', historyResp.status);
                        // continue processing schedules for this pet (we won't skip silently)
                    }

                    const vaccinations = historyResp.ok ? await historyResp.json() : [];
                    logDebug(`Vaccinations for pet ${pet.id} (count):`, Array.isArray(vaccinations) ? vaccinations.length : 0, vaccinations);

                    // push urgent/warning from vaccination history
                    if (Array.isArray(vaccinations)) {
                        for (const vaccination of vaccinations) {
                            if (!vaccination) continue;
                            if (vaccination.next_due_date) {
                                const daysLeft = daysUntil(vaccination.next_due_date);
                                logDebug(`pet ${pet.id} vacc ${vaccination.vaccine_name} next_due_date ${vaccination.next_due_date} daysLeft:`, daysLeft);
                                if (daysLeft < 0) {
                                    allNotifications.push({ type:'urgent', petName:pet.name, petId:pet.id, vaccineName:vaccination.vaccine_name, message:`วัคซีนเลยกำหนดฉีดแล้ว ${Math.abs(daysLeft)} วัน`, dueDate:vaccination.next_due_date, daysLeft});
                                } else if (daysLeft <= 30) {
                                    allNotifications.push({ type:'warning', petName:pet.name, petId:pet.id, vaccineName:vaccination.vaccine_name, message:`ใกล้ถึงกำหนดฉีดวัคซีนในอีก ${daysLeft} วัน`, dueDate:vaccination.next_due_date, daysLeft});
                                }
                            }
                        }
                    }

                    // compute ageInWeeks (null if birth date missing/invalid)
                    const birthDateVal = pet.birth_date || pet.birthDate || pet.birthDateString || null;
                    const ageInWeeks = birthDateVal ? calculateAgeInWeeks(birthDateVal) : null;
                    logDebug(`pet ${pet.id} ageInWeeks:`, ageInWeeks);

                    try {
                        const recommendedUrl = `${API_URL}/pets/${pet.id}/recommended-vaccines`;
                        logDebug('Fetching recommended vaccines for pet', pet.id, 'url:', recommendedUrl);
                        const recommendedResp = await fetch(recommendedUrl, { headers: { 'Authorization': `Bearer ${token}` } });
                        logDebug(`recommendedResp for pet ${pet.id} status:`, recommendedResp.status);
                        
                        if (recommendedResp.ok) {
                            const recommendedData = await recommendedResp.json();
                            const recommendedVaccines = recommendedData.vaccines || [];
                            logDebug(`Recommended vaccines for pet ${pet.id} (count):`, recommendedVaccines.length, recommendedVaccines);
                            // เพิ่มเฉพาะวัคซีนที่ status เป็น 'due' หรือ 'overdue' เข้าการแจ้งเตือน
                            recommendedVaccines.forEach(vaccine => {
                                if (vaccine.status === 'overdue') {
                                    const daysLate = vaccine.days_until_due !== null ? Math.abs(vaccine.days_until_due) : 0;
                                    allNotifications.push({
                                        type: 'urgent',
                                        petName: pet.name,
                                        petId: pet.id,
                                        vaccineName: vaccine.vaccine_name,
                                        description: vaccine.description || '',
                                        message: `เกินกำหนดแล้ว ${daysLate} วัน`,
                                        dueDate: vaccine.due_date,
                                        daysLeft: vaccine.days_until_due,
                                        age_weeks_min: vaccine.age_weeks_min,
                                        age_weeks_max: vaccine.age_weeks_max
                                    });
                                } else if (vaccine.status === 'due') {
                                    const daysLeft = vaccine.days_until_due || 0;
                                    allNotifications.push({
                                        type: 'warning',
                                        petName: pet.name,
                                        petId: pet.id,
                                        vaccineName: vaccine.vaccine_name,
                                        description: vaccine.description || '',
                                        message: daysLeft >= 0 ? `ใกล้ถึงกำหนดฉีดในอีก ${daysLeft} วัน` : `ถึงกำหนดฉีดแล้ว`,
                                        dueDate: vaccine.due_date,
                                        daysLeft: vaccine.days_until_due,
                                        age_weeks_min: vaccine.age_weeks_min,
                                        age_weeks_max: vaccine.age_weeks_max
                                    });
                                }
                                // ไม่แสดง 'upcoming' และ 'completed' ในการแจ้งเตือน
                            });
                        }
                    } catch (recommendedErr) {
                        logDebug('Error fetching recommended vaccines for pet', pet.id, recommendedErr);
                    }

                    logDebug('--- END processing pet ---', pet.id, pet.name);
                } catch (errPet) {
                    logDebug('Error in pet loop for pet', pet.id, errPet);
                    // do not stop processing other pets
                }
            } // end for pets

            // final sort & return
            logDebug('All notifications before sort count:', allNotifications.length, allNotifications);
            allNotifications.sort((a,b) => {
                const urgencyOrder = { 'urgent':0, 'warning':1, 'info':2 };
                if (urgencyOrder[a.type] !== urgencyOrder[b.type]) return urgencyOrder[a.type] - urgencyOrder[b.type];
                const aDays = (typeof a.daysLeft === 'number') ? a.daysLeft : Infinity;
                const bDays = (typeof b.daysLeft === 'number') ? b.daysLeft : Infinity;
                return aDays - bDays;
            });

            logDebug('Total notifications computed (after sort):', allNotifications.length);
            return allNotifications;
        } catch (err) {
            console.error('Error loading notifications core (outer):', err);
            updateBadge(0);
            return [];
        }
    }

    // ----------------- Display / UI helpers -----------------
    function displayNotifications(notifications) {
        const container = document.getElementById('notificationList');
        if (!container) return;

        if (!notifications || notifications.length === 0) {
            displayEmptyState();
            return;
        }

        // inject urgent style (ถ้ายังไม่มี)
        if (!document.getElementById('notificationUrgentStyles')) {
            const urgentStyles = `
            <style id="notificationUrgentStyles">
            .notification-item.urgent {
                display: flex; align-items: flex-start;
                background: #fff6f6;
                border: 2px solid #ff6b6b;
                border-radius: 14px;
                padding: 18px 20px;
                margin-bottom: 16px;
                box-shadow: 0 2px 8px rgba(255,107,107,0.08);
            }
            .urgent-icon img {
                width: 38px; height: 38px; margin-right: 16px;
            }
            .urgent-content { flex: 1; }
            .urgent-content .pet-name {
                font-size: 17px; font-weight: bold; color: #d32f2f; margin-bottom: 2px;
            }
            .urgent-content .vaccine-name {
                font-size: 15px; color: #444; margin-bottom: 6px;
            }
            .urgent-content .urgent-message {
                font-size: 14px; color: #d32f2f; font-weight: 600; margin-bottom: 4px;
            }
            .urgent-content .due-date {
                font-size: 13px; color: #888; margin-bottom: 8px;
            }
            .urgent-detail-btn {
                background: #ff6b6b; color: #fff; border: none; border-radius: 8px;
                padding: 6px 16px; font-weight: 600; cursor: pointer; font-size: 13px;
                transition: background 0.15s;
            }
            .urgent-detail-btn:hover { background: #d32f2f; }
            </style>
            `;
            document.head.insertAdjacentHTML('beforeend', urgentStyles);
        }

        // Render notifications
        container.innerHTML = notifications.map((notif, idx) => {
            if (notif.type === 'urgent') {
                // สั้น กระชับ ตามหลัก UX/UI
                let message = notif.message || '';
                if (typeof notif.daysLeft === 'number' && notif.daysLeft < 0) {
                    message = `เกินกำหนดฉีดวัคซีนแล้ว ${formatOverdue(Math.abs(notif.daysLeft))}`;
                }
                return `
                <div class="notification-item urgent" data-petid="${notif.petId}" data-idx="${idx}">
                  <div class="urgent-icon"><img src="/icon/syringe.png" alt="Vaccine"></div>
                  <div class="urgent-content">
                    <div class="pet-name">${escapeHtml(notif.petName || 'ไม่ทราบชื่อ')}</div>
                    <div class="vaccine-name">${escapeHtml(notif.vaccineName || '')}</div>
                    <div class="urgent-message">${escapeHtml(message)}</div>
                    ${notif.dueDate ? `<div class="due-date">กำหนดเดิม: ${formatThaiDate(notif.dueDate)}</div>` : ''}
                    <button class="urgent-detail-btn" data-petid="${notif.petId}">ดูรายละเอียด</button>
                  </div>
                </div>
                `;
            } else {
                // ...เดิมสำหรับ warning/info...
                // ฟังก์ชันแปลงช่วงอายุเป็นข้อความภาษาไทย
                function formatAgeRange(min, max) {
                    if (min == null && max == null) return '-';
                    if (min == null) return `${max} สัปดาห์`;
                    if (max == null) return `${min} สัปดาห์`;
                    if (min === max) return `${min} สัปดาห์`;
                    return `${min}-${max} สัปดาห์`;
                }
                const urgencyClass = notif.type || 'info';
                const dueHtml = notif.dueDate ? `<div style="margin-top:8px;"><span class="notification-date">กำหนดฉีด: ${formatThaiDate(notif.dueDate)}</span></div>` : '';
                const descHtml = notif.description ? `<div class="vaccine-description" style="background:none;padding:0;margin-bottom:8px;">${escapeHtml(notif.description)}</div>` : '';
                const ageRangeHtml = `<div class="vaccine-age-range"><b>ช่วงอายุ :</b> <span style="color:#1976d2;font-weight:bold">${formatAgeRange(notif.age_weeks_min, notif.age_weeks_max)}</span></div>`;
                return `
                    <div class="notification-item ${urgencyClass}" data-petid="${notif.petId}" data-idx="${idx}">
                        <div class="notification-top">
                            <div class="notification-icon"><img src="/icon/syringe.png" alt="Vaccine" style="width:24px;height:24px;"></div>
                            <div class="notification-details">
                                <div class="pet-name">${escapeHtml(notif.petName || 'ไม่ทราบชื่อ')}</div>
                                <div class="vaccine-name">${escapeHtml(notif.vaccineName || '')}</div>
                                ${descHtml}
                                ${ageRangeHtml}
                                <div class="notification-message">${escapeHtml(notif.message || '')}</div>
                                ${dueHtml}
                            </div>
                        </div>
                    </div>
                `;
            }
        }).join('');
    // แปลงจำนวนวัน overdue เป็น เดือน/ปี/วัน ตามเงื่อนไขที่กำหนด
    function formatOverdue(days) {
        if (days >= 360) {
            const years = Math.floor(days / 360);
            const months = Math.floor((days % 360) / 30);
            // const remDays = days % 30; // ไม่แสดงวัน
            let result = `${years} ปี`;
            if (months > 0) result += ` ${months} เดือน`;
            return result;
        } else if (days >= 30) {
            const months = Math.floor(days / 30);
            // const remDays = days % 30; // ไม่แสดงวัน
            return `${months} เดือน`;
        } else {
            return `${days} วัน`;
        }
    }

        // ไม่มีปุ่มลบแจ้งเตือนอีกต่อไป

        // urgent: click ที่ปุ่มเท่านั้น, warning/info: click ทั้งกล่อง
        Array.from(container.querySelectorAll('.notification-item.urgent .urgent-detail-btn')).forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const petId = btn.getAttribute('data-petid');
                if (petId) window.location.href = `pet-details.html?id=${petId}`;
            });
        });
        Array.from(container.querySelectorAll('.notification-item.warning, .notification-item.info')).forEach(item => {
            item.addEventListener('click', () => {
                const petId = item.getAttribute('data-petid');
                if (petId) window.location.href = `pet-details.html?id=${petId}`;
            });
        });

    }

    // Remove notification from UI (and memory)
    function removeNotification(idx) {
        if (typeof idx !== 'number') return;
        currentNotifications.splice(idx, 1);
        displayNotifications(currentNotifications);
    }

    function displayEmptyState() {
        const container = document.getElementById('notificationList');
        if (!container) return;
        container.innerHTML = `
            <div class="empty-notifications">
                <div class="empty-icon"><img src="/icon/warning.png" alt="No Notifications" style="width:50px;height:50px;"></div>
                <div class="empty-text">ไม่มีการแจ้งเตือน</div>
            </div>
        `;
        updateBadge(0);
    }

    function updateBadge(count) {
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    // small HTML escape to avoid injection when inserting text
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // ----------------- Public initialization & wiring -----------------
    let modalEl = null;
    let modalBackdropHandler = null;
    let escKeyHandler = null;

    function toggleModal() {
        modalEl = modalEl || document.getElementById('notificationModal');
        if (!modalEl) return;
        const isActive = modalEl.classList.contains('active');
        if (isActive) {
            closeModal();
        } else {
            openModal();
        }
    }

    function openModal() {
        modalEl = document.getElementById('notificationModal');
        if (!modalEl) return;
        modalEl.classList.add('active');
        modalEl.style.display = 'flex';
        // reload notifications when opening
        loadAndRenderNotifications();
    }

    function closeModal() {
        modalEl = document.getElementById('notificationModal');
        if (!modalEl) return;
        modalEl.classList.remove('active');
        modalEl.style.display = 'none';
    }

    function setupButtonHandlers() {
        const notificationBtn = document.getElementById('notificationBtn');
        const closeBtn = document.getElementById('closeModalBtn');
        const viewAllBtn = document.getElementById('viewAllNotifications');

        modalEl = modalEl || document.getElementById('notificationModal');

        // ensure modal exists
        if (!modalEl) {
            // try to inject and rebind
            injectNotificationModal();
            modalEl = document.getElementById('notificationModal');
        }

        // notification button toggles modal
        if (notificationBtn) {
            notificationBtn.removeEventListener('click', toggleModal);
            notificationBtn.addEventListener('click', function(e) {
                e.preventDefault();
                toggleModal();
            });
        }

        // close button (×)
        const closeBtnEl = closeBtn || (modalEl ? modalEl.querySelector('.close-modal-btn') : null);
        if (closeBtnEl) {
            closeBtnEl.removeEventListener('click', closeModal);
            closeBtnEl.addEventListener('click', function(e) {
                e.preventDefault();
                closeModal();
            });
        }

        // view all button
        if (viewAllBtn) {
            viewAllBtn.removeEventListener('click', viewAllHandler);
            viewAllBtn.addEventListener('click', viewAllHandler);
        }

        // backdrop click to close (ปิดฟีเจอร์นี้ ไม่ให้ปิด modal เมื่อคลิกนอก notification-content)
        if (modalEl && modalBackdropHandler) {
            modalEl.removeEventListener('click', modalBackdropHandler);
            modalBackdropHandler = null;
        }

        // Escape key closes
        if (escKeyHandler) document.removeEventListener('keydown', escKeyHandler);
        escKeyHandler = function(e) {
            if (e.key === 'Escape' || e.key === 'Esc') {
                closeModal();
            }
        };
        document.addEventListener('keydown', escKeyHandler);

        // expose small API for console
        window.NotificationSystem = window.NotificationSystem || {};
        window.NotificationSystem.toggleModal = toggleModal;
        window.NotificationSystem.openModal = openModal;
        window.NotificationSystem.closeModal = closeModal;
        window.NotificationSystem.loadNotifications = loadAndRenderNotifications;
    }

    function viewAllHandler(e) {
        e.preventDefault();
        const modal = document.getElementById('notificationModal');
        if (modal) modal.classList.remove('active');
        window.location.href = 'vaccination-record.html';
    }

    async function loadAndRenderNotifications() {
        const notifications = await loadNotificationsCore();
        currentNotifications = notifications || [];
        displayNotifications(currentNotifications);
        updateBadge(currentNotifications.length);
    }

    // ----------------- Initialization -----------------
    async function initNotificationSystem() {
        logDebug('Initializing notification system');
        const token = localStorage.getItem('token');
        if (!token) {
            logDebug('User not logged in, skipping notification system');
            return;
        }

        injectNotificationModal();
        injectNotificationStyles();
        setupButtonHandlers();
        // initial load (do not block UI)
        loadAndRenderNotifications();

        // refresh every 5 minutes
        setInterval(() => {
            const t = localStorage.getItem('token');
            if (t) loadAndRenderNotifications();
        }, 5 * 60 * 1000);

        logDebug('Notification system initialized');
    }

    // ----------------- Export public API -----------------
    window.NotificationSystem = window.NotificationSystem || {};
    window.NotificationSystem.init = initNotificationSystem;
    window.NotificationSystem.toggleModal = window.NotificationSystem.toggleModal || toggleModal;
    window.NotificationSystem.openModal = window.NotificationSystem.openModal || openModal;
    window.NotificationSystem.closeModal = window.NotificationSystem.closeModal || closeModal;
    window.NotificationSystem.loadNotifications = window.NotificationSystem.loadNotifications || loadAndRenderNotifications;

    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNotificationSystem);
    } else {
        initNotificationSystem();
    }

})();
