const APIs = {
    '2shoot': 'https://jkt48.com/api/v1/exclusives/EX579E/bonus?lang=id',
    'mng': 'https://jkt48.com/api/v1/exclusives/EXE588/bonus?lang=id'
};

let currentEvent = '2shoot';
let allMembers = [];

// DOM Elements
const btn2Shoot = document.getElementById('btn-2shoot');
const btnMnG = document.getElementById('btn-mng');
const btnRefresh = document.getElementById('btn-refresh');
const btnRetry = document.getElementById('btn-retry');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');

const loadingState = document.getElementById('loading');
const errorState = document.getElementById('error');
const emptyState = document.getElementById('empty-state');
const errorMessage = document.getElementById('error-message');
const membersGrid = document.getElementById('members-grid');

const statSold = document.getElementById('stat-sold');
const statSessions = document.getElementById('stat-sessions');
const statSoldout = document.getElementById('stat-soldout');

// Tailwind Active/Inactive classes
const activeBtnClass = "flex-1 px-4 py-2 text-sm font-medium rounded-md bg-jktred text-white transition shadow-sm";
const inactiveBtnClass = "flex-1 px-4 py-2 text-sm font-medium rounded-md text-slate-400 hover:text-white hover:bg-slate-700/50 transition";

// Events
btn2Shoot.addEventListener('click', () => switchEvent('2shoot'));
btnMnG.addEventListener('click', () => switchEvent('mng'));
btnRefresh.addEventListener('click', () => loadData(currentEvent));
btnRetry.addEventListener('click', () => loadData(currentEvent));
searchInput.addEventListener('input', handleSearch);
sortSelect.addEventListener('change', () => renderMembers(searchInput.value));

// Format number (e.g., 1000 -> 1.000)
const formatNum = (num) => {
    return new Intl.NumberFormat('id-ID').format(num);
};

function switchEvent(eventName) {
    if (currentEvent === eventName) return;
    
    currentEvent = eventName;
    if (eventName === '2shoot') {
        btn2Shoot.className = activeBtnClass;
        btnMnG.className = inactiveBtnClass;
    } else {
        btnMnG.className = activeBtnClass;
        btn2Shoot.className = inactiveBtnClass;
    }
    
    searchInput.value = ''; // reset search
    loadData(currentEvent);
}

function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    renderMembers(query);
}

function showState(state) {
    // Hidden class is standard tailwind `hidden` with `!important` ideally, or just standard `hidden` if layout is flex.
    loadingState.classList.add('hidden');
    // Using style.display because Tailwind's hidden might be overridden by flex
    loadingState.style.display = 'none';
    errorState.style.display = 'none';
    emptyState.style.display = 'none';
    membersGrid.style.display = 'none';

    if (state === 'loading') loadingState.style.display = 'flex';
    else if (state === 'error') errorState.style.display = 'flex';
    else if (state === 'empty') emptyState.style.display = 'flex';
    else if (state === 'data') membersGrid.style.display = 'grid';
}

async function loadData(eventName) {
    showState('loading');
    
    // Reset stats
    statSold.textContent = '-';
    statSessions.textContent = '-';
    statSoldout.textContent = '-';
    
    try {
        const rawUrl = APIs[eventName];
        const proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent(rawUrl);
        
        const response = await fetch(proxyUrl);
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }
        
        const proxyJson = await response.json();
        
        if (!proxyJson.contents) {
             throw new Error("Data gagal di-fetch oleh proxy.");
        }
        
        const resJson = JSON.parse(proxyJson.contents);
        
        if (!resJson.status) {
            throw new Error(resJson.message || 'Gagal mengambil data dari API pusat.');
        }
        
        processRawData(resJson.data);
        renderMembers();
        
    } catch (err) {
        console.error('Fetch error:', err);
        showState('error');
        errorMessage.textContent = err.message || 'Gagal terhubung ke server. Periksa koneksi internet.';
    }
}

function processRawData(sessionsData) {
    const membersMap = {};
    
    sessionsData.forEach(sessionData => {
        const sessionLabel = sessionData.label;
        const timeRange = `${sessionData.start_time.substring(0,5)} - ${sessionData.end_time.substring(0,5)}`;
        
        if (sessionData.session_members && Array.isArray(sessionData.session_members)) {
            sessionData.session_members.forEach(m => {
                const name = m.member_name;
                
                if (!membersMap[name]) {
                    membersMap[name] = {
                        name: name,
                        totalSold: 0,
                        sessionsCount: 0,
                        sessionsSoldOut: 0,
                        sessions: []
                    };
                }
                
                membersMap[name].totalSold += m.tickets_sold;
                membersMap[name].sessionsCount++;
                
                const isSoldOut = m.quota === 0;
                if (isSoldOut && m.tickets_sold > 0) {
                    membersMap[name].sessionsSoldOut++;
                }
                
                membersMap[name].sessions.push({
                    sessionLabel: sessionLabel,
                    timeRange: timeRange,
                    jalur: m.label,
                    quota: m.quota,
                    ticketsSold: m.tickets_sold,
                    price: m.price,
                    isSoldOut: isSoldOut
                });
            });
        }
    });
    
    // We do not sort here anymore, sorting is handled dynamically in renderMembers
    allMembers = Object.values(membersMap);
}

function renderMembers(searchQuery = '') {
    let filteredMembers = [...allMembers];
    
    if (searchQuery) {
        filteredMembers = filteredMembers.filter(m => m.name.toLowerCase().includes(searchQuery));
    }
    
    // Sort Members based on dropdown selection
    const sortValue = sortSelect.value;
    filteredMembers.sort((a, b) => {
        if (sortValue === 'sold-desc') return b.totalSold - a.totalSold;
        if (sortValue === 'sold-asc') return a.totalSold - b.totalSold;
        if (sortValue === 'name-asc') return a.name.localeCompare(b.name);
        if (sortValue === 'name-desc') return b.name.localeCompare(a.name);
        return 0;
    });
    
    if (filteredMembers.length === 0) {
        showState('empty');
        updateStats(allMembers);
        return;
    }
    
    membersGrid.innerHTML = '';
    
    filteredMembers.forEach(member => {
        const card = document.createElement('div');
        // Tailwind Card styling
        card.className = 'bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg hover:-translate-y-1 hover:border-slate-500 transition duration-300 flex flex-col';
        
        const sessionsHtml = member.sessions.map(s => {
            const isSold = s.isSoldOut;
            const badgeClass = isSold ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-400';
            const badgeText = isSold ? 'HABIS' : `SISA ${s.quota}`;
            const borderIndication = isSold ? 'border-l-4 border-l-red-500 opacity-60' : 'border-l-4 border-l-emerald-500';
            
            return `
                <div class="px-5 py-3 flex justify-between items-center border-b border-slate-700/50 last:border-0 ${borderIndication} bg-slate-800/50">
                    <div class="flex flex-col gap-1">
                        <span class="text-sm font-semibold text-slate-200">${s.sessionLabel} <span class="text-xs text-slate-400 font-normal">(${s.jalur})</span></span>
                        <span class="text-xs text-slate-500">${s.timeRange}</span>
                    </div>
                    <div class="flex flex-col items-end gap-1">
                        <span class="text-[10px] font-bold px-2 py-1 rounded tracking-wider ${badgeClass}">${badgeText}</span>
                        <span class="text-[10px] text-slate-400">${s.ticketsSold} Terjual</span>
                    </div>
                </div>
            `;
        }).join('');
        
        card.innerHTML = `
            <div class="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-800 z-10 transition">
                <div class="text-lg font-bold text-white tracking-tight leading-tight">${member.name}</div>
                <div class="text-xs bg-slate-900 shadow-inner text-slate-300 font-medium px-2 py-1 rounded border border-slate-700 whitespace-nowrap ml-2">${formatNum(member.totalSold)} Tiket</div>
            </div>
            <div class="flex flex-col relative">
                ${sessionsHtml}
            </div>
        `;
        
        membersGrid.appendChild(card);
    });
    
    showState('data');
    updateStats(allMembers);
}

function updateStats(membersArray) {
    let sold = 0;
    let sessions = 0;
    let soldOuts = 0;
    
    membersArray.forEach(m => {
        sold += m.totalSold;
        sessions += m.sessionsCount;
        soldOuts += m.sessionsSoldOut;
    });
    
    statSold.textContent = formatNum(sold);
    statSessions.textContent = formatNum(sessions);
    statSoldout.textContent = formatNum(soldOuts);
}

// Initial Load
loadData(currentEvent);
