// --- CONFIGURATION ---
const PROXY = 'https://api.allorigins.win/get?url=';

const API = {
    members: 'https://jkt48.com/api/v1/members?lang=id',
    memberDetail: (id) => `https://jkt48.com/api/v1/members/${id}?lang=id`,
    schedules: (m, y) => `https://jkt48.com/api/v1/schedules?lang=id&month=${m}&year=${y}`
};

// --- STATE ---
let currentTab = 'members';
let membersData = []; // Cache for members list
let currentScheduleDate = new Date();

// DOM IDs
const ids = {
    navMem: document.getElementById('nav-members'),
    navSched: document.getElementById('nav-schedules'),
    viewMem: document.getElementById('view-members'),
    viewSched: document.getElementById('view-schedules'),
    
    globalLoading: document.getElementById('global-loading'),
    globalError: document.getElementById('global-error'),
    errorMsg: document.getElementById('error-message'),
    
    membersGrid: document.getElementById('members-grid'),
    membersEmpty: document.getElementById('members-empty'),
    searchMember: document.getElementById('search-member'),
    
    schedList: document.getElementById('schedules-list'),
    schedEmpty: document.getElementById('schedules-empty'),
    schedLabel: document.getElementById('schedule-month-label'),
    
    modal: document.getElementById('member-modal'),
    modalContent: document.getElementById('modal-content')
};

const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

// --- CORE FETCH WRAPPER ---
async function fetchProxy(url) {
    const encoded = encodeURIComponent(url);
    const res = await fetch(PROXY + encoded);
    
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    const wrapped = await res.json();
    
    if (!wrapped.contents) throw new Error("Format proxy salah.");
    const data = JSON.parse(wrapped.contents);
    
    if (!data || !data.status) throw new Error(data.message || "Endpoint error");
    return data.data;
}

// --- ROUTER / TAB MANAGER ---
function switchTab(tab) {
    if (currentTab === tab && membersData.length > 0) return; // Already there and loaded
    currentTab = tab;
    
    // Update Nav UI
    ids.navMem.className = tab === 'members' 
        ? "px-4 py-1.5 text-sm font-semibold rounded-md bg-white text-slate-800 shadow-sm transition transform active:scale-95 duration-200"
        : "px-4 py-1.5 text-sm font-semibold rounded-md text-slate-500 hover:text-slate-800 hover:bg-white/50 transition transform active:scale-95 duration-200";
        
    ids.navSched.className = tab === 'schedules' 
        ? "px-4 py-1.5 text-sm font-semibold rounded-md bg-white text-slate-800 shadow-sm transition transform active:scale-95 duration-200"
        : "px-4 py-1.5 text-sm font-semibold rounded-md text-slate-500 hover:text-slate-800 hover:bg-white/50 transition transform active:scale-95 duration-200";
        
    // Switch Views
    ids.viewMem.classList.toggle('hidden', tab !== 'members');
    ids.viewSched.classList.toggle('hidden', tab !== 'schedules');
    ids.globalError.classList.add('hidden');
    
    // Load Data
    if (tab === 'members') loadMembers();
    if (tab === 'schedules') loadSchedules();
}

function retryCurrentTab() {
    if (currentTab === 'members') loadMembers(true);
    if (currentTab === 'schedules') loadSchedules(true);
}

// --- MEMBERS LOGIC ---
async function loadMembers(force = false) {
    if (membersData.length > 0 && !force) return;
    
    ids.viewMem.classList.add('hidden');
    ids.globalError.classList.add('hidden');
    ids.globalLoading.style.display = 'flex';
    
    try {
        const data = await fetchProxy(API.members);
        membersData = data || [];
        renderMembersData(membersData);
        ids.globalLoading.style.display = 'none';
        ids.viewMem.classList.remove('hidden');
    } catch (err) {
        ids.globalLoading.style.display = 'none';
        ids.globalError.style.display = 'flex';
        ids.errorMsg.textContent = err.message;
        console.error(err);
    }
}

function renderMembersData(list) {
    ids.membersGrid.innerHTML = '';
    
    if (list.length === 0) {
        ids.membersEmpty.classList.remove('hidden');
        return;
    }
    ids.membersEmpty.classList.add('hidden');
    
    list.forEach(m => {
        const card = document.createElement('div');
        card.className = "member-card group bg-white border border-slate-200 rounded-2xl overflow-hidden cursor-pointer hover:shadow-xl hover:shadow-jktred/5 hover:-translate-y-1 transition duration-300";
        card.onclick = () => openMemberModal(m.jkt48_member_id);
        
        const safeName = m.name.replace(/[\\/*?:"<>|]/g, '').trim();
        card.innerHTML = `
            <div class="aspect-[3/4] relative img-skeleton bg-slate-100">
                <img src="${m.photo ? 'assets/img/' + safeName + '.jpg' : ''}" alt="${m.name}" loading="lazy" class="absolute inset-0 w-full h-full object-cover z-10 transition duration-500 group-hover:scale-105" onload="this.parentElement.classList.remove('img-skeleton')" onerror="this.src='https://placehold.co/300x400/f1f5f9/cbd5e1?text=No+Photo'">
                <div class="absolute top-2 right-2 z-20 px-2 py-1 bg-white/90 backdrop-blur text-[10px] font-bold text-slate-600 rounded-full shadow-sm">${m.type || 'MEMBER'}</div>
            </div>
            <div class="px-4 py-4 p-4 text-center">
                <h3 class="font-bold text-slate-800 leading-tight group-hover:text-jktred transition duration-200">${m.name}</h3>
                <p class="text-xs text-slate-400 mt-1 font-medium">${m.nickname}</p>
            </div>
        `;
        ids.membersGrid.appendChild(card);
    });
}

function filterMembers() {
    const q = ids.searchMember.value.toLowerCase();
    const filtered = membersData.filter(m => m.name.toLowerCase().includes(q) || m.nickname.toLowerCase().includes(q));
    renderMembersData(filtered);
}

// --- SCHEDULES LOGIC ---
function prevMonth() {
    currentScheduleDate.setMonth(currentScheduleDate.getMonth() - 1);
    loadSchedules(true);
}
function nextMonth() {
    currentScheduleDate.setMonth(currentScheduleDate.getMonth() + 1);
    loadSchedules(true);
}

async function loadSchedules(force = false) {
    ids.viewSched.classList.add('hidden');
    ids.globalError.classList.add('hidden');
    ids.globalLoading.style.display = 'flex';
    
    const m = currentScheduleDate.getMonth() + 1; // 1-12
    const y = currentScheduleDate.getFullYear();
    ids.schedLabel.textContent = `${monthNames[m-1]} ${y}`;
    
    try {
        const data = await fetchProxy(API.schedules(m, y));
        renderSchedulesData(data || []);
        ids.globalLoading.style.display = 'none';
        ids.viewSched.classList.remove('hidden');
    } catch (err) {
        ids.globalLoading.style.display = 'none';
        ids.globalError.style.display = 'flex';
        ids.errorMsg.textContent = err.message;
        console.error(err);
    }
}

function renderSchedulesData(list) {
    ids.schedList.innerHTML = '';
    if (list.length === 0) {
        ids.schedEmpty.classList.remove('hidden');
        ids.schedEmpty.style.display = 'flex';
        return;
    }
    ids.schedEmpty.classList.add('hidden');
    ids.schedEmpty.style.display = 'none';
    
    list.forEach(s => {
        // Date parsing 2026-03-31T17:00:00.000Z
        const d = new Date(s.date);
        const dayNum = d.getDate().toString().padStart(2, '0');
        const dayStr = d.toLocaleDateString('id-ID', { weekday: 'short' });
        
        let typeClass = "bg-slate-100 text-slate-600";
        if (s.type === 'SHOW') typeClass = "bg-red-50 text-jktred border border-red-100";
        else if (s.type === 'EVENT') typeClass = "bg-blue-50 text-blue-600 border border-blue-100";
        
        const birthdayBadge = s.birthday_member ? `<span class="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded flex items-center gap-1">🎂 M-BA</span>` : '';
        
        const row = document.createElement('div');
        row.className = "flex flex-col sm:flex-row bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition duration-200";
        
        row.innerHTML = `
            <div class="sm:w-32 bg-slate-50 flex flex-row sm:flex-col items-center justify-center p-4 border-b sm:border-b-0 sm:border-r border-slate-100 gap-2 sm:gap-0">
                <span class="text-xs font-bold text-slate-400 uppercase">${dayStr}</span>
                <span class="text-2xl sm:text-3xl font-extrabold text-slate-800 leading-none">${dayNum}</span>
            </div>
            <div class="p-5 flex-1 flex flex-col justify-center">
                <div class="flex items-center gap-2 mb-2">
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded uppercase ${typeClass}">${s.type || 'Lainnya'}</span>
                    ${birthdayBadge}
                    <span class="text-xs font-bold text-slate-400 ml-auto">${s.start_time.substring(0,5)} - ${s.end_time.substring(0,5)} WIB</span>
                </div>
                <h3 class="font-bold text-lg text-slate-900 leading-tight mb-1">${s.title}</h3>
                <p class="text-sm text-slate-500">${s.jkt48_member_type || 'JKT48'}</p>
            </div>
        `;
        ids.schedList.appendChild(row);
    });
}

// --- MEMBER DETAIL MODAL ---
async function openMemberModal(id) {
    if (!id) return;
    
    // Set loading state UI in modal
    ids.modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    // Reset Data
    document.getElementById('detail-img').src = '';
    document.getElementById('detail-name').textContent = 'Loading...';
    document.getElementById('detail-nickname').textContent = '-';
    document.getElementById('detail-blood-val').textContent = '-';
    document.getElementById('detail-type').textContent = '-';
    document.getElementById('detail-height').textContent = '-';
    document.getElementById('detail-zodiac').textContent = '-';
    document.getElementById('detail-birth').textContent = '-';
    
    ['ig','tw','tt'].forEach(x => document.getElementById(`btn-${x}`).classList.add('hidden'));

    setTimeout(() => {
        ids.modalContent.classList.remove('scale-95', 'opacity-0');
        ids.modalContent.classList.add('scale-100', 'opacity-100');
    }, 10);
    
    try {
        const m = await fetchProxy(API.memberDetail(id));
        
        const safeName = m.name.replace(/[\\/*?:"<>|]/g, '').trim();
        document.getElementById('detail-img').src = m.photo ? `assets/img/${safeName}.jpg` : '';
        document.getElementById('detail-img').onerror = function() { this.src='https://placehold.co/300x400/f1f5f9/cbd5e1?text=No+Photo'; };
        document.getElementById('detail-name').textContent = m.name;
        document.getElementById('detail-nickname').textContent = m.nickname;
        document.getElementById('detail-blood-val').textContent = m.blood_type || '-';
        document.getElementById('detail-type').textContent = m.type || 'MEMBER';
        document.getElementById('detail-height').textContent = m.body_height || '-';
        document.getElementById('detail-zodiac').textContent = m.horoscope || '-';
        
        // Bday Format
        if (m.birth_date) {
            const dateObj = new Date(m.birth_date);
            document.getElementById('detail-birth').textContent = dateObj.toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric'});
        } else {
            document.getElementById('detail-birth').textContent = '-';
        }
        
        // Socials
        if (m.instagram_account) {
            const e = document.getElementById('btn-ig');
            e.href = `https://instagram.com/${m.instagram_account}`;
            e.classList.remove('hidden');
        }
        if (m.twitter_account) {
            const e = document.getElementById('btn-tw');
            e.href = `https://twitter.com/${m.twitter_account}`;
            e.classList.remove('hidden');
        }
        if (m.tiktok_account) {
            const e = document.getElementById('btn-tt');
            e.href = `https://tiktok.com/@${m.tiktok_account}`;
            e.classList.remove('hidden');
        }
        
    } catch (err) {
        document.getElementById('detail-name').textContent = 'Gagal memuat profil.';
        console.error(err);
    }
}

function closeModal() {
    ids.modalContent.classList.remove('scale-100', 'opacity-100');
    ids.modalContent.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        ids.modal.classList.add('hidden');
        document.body.style.overflow = '';
    }, 300);
}

// Initial Boot
switchTab('members');
