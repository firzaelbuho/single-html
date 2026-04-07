const CATEGORIES = [
    { id: 'Code', icon: 'fa-code', colors: 'bg-blue-500/10 text-blue-400 border-blue-500/20', cardClass: 'border-l-[5px] border-l-blue-500' },
    { id: 'Image', icon: 'fa-image', colors: 'bg-pink-500/10 text-pink-400 border-pink-500/20', cardClass: 'border-l-[5px] border-l-pink-500' },
    { id: 'Audio', icon: 'fa-music', colors: 'bg-purple-500/10 text-purple-400 border-purple-500/20', cardClass: 'border-l-[5px] border-l-purple-500' },
    { id: 'Video', icon: 'fa-video', colors: 'bg-red-500/10 text-red-400 border-red-500/20', cardClass: 'border-l-[5px] border-l-red-500' },
    { id: 'Text', icon: 'fa-align-left', colors: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', cardClass: 'border-l-[5px] border-l-emerald-500' },
    { id: 'Others', icon: 'fa-cube', colors: 'bg-amber-500/10 text-amber-400 border-amber-500/20', cardClass: 'border-l-[5px] border-l-amber-500' }
];

let prompts = JSON.parse(localStorage.getItem('prompt_manager_data')) || [];
let currentFilter = { category: 'all', tags: [], text: '', sort: 'newest' };
let selectedIds = new Set();
let editId = null;

let parsedImportData = [];
let exportSelectedIds = new Set();
let importSelectedIds = new Set();

const els = {
    promptContainer: document.getElementById('promptGrid'),
    categoryList: document.getElementById('categoryFilterList'),
    tagList: document.getElementById('tagFilterList'),
    searchInput: document.getElementById('searchInput'),
    sortSelect: document.getElementById('sortSelect'),
    currentSortLabel: document.getElementById('currentSortLabel'),
    currentViewTitle: document.getElementById('currentViewTitle'),
    bulkDeleteBtn: document.getElementById('bulkDeleteBtn'),
    selectedCount: document.getElementById('selectedCount'),
    newPromptBtn: document.getElementById('newPromptBtn'),
    exportBtn: document.getElementById('exportBtn'),
    importInput: document.getElementById('importInput'),
    sidebar: document.getElementById('sidebar'),
    sidebarBackdrop: document.getElementById('sidebarBackdrop'),
    openSidebarBtn: document.getElementById('openSidebarBtn'),
    closeSidebarBtn: document.getElementById('closeSidebarBtn'),
    
    modal: document.getElementById('promptModal'),
    modalTitle: document.getElementById('modalTitle'),
    form: document.getElementById('promptForm'),
    closeBtn: document.getElementById('closeModalBtn'),
    cancelBtn: document.getElementById('cancelBtn'),
    saveBtn: document.getElementById('saveBtn'),
    addVariantBtn: document.getElementById('addVariantBtn'),
    variantsContainer: document.getElementById('variantsContainer'),

    exportModal: document.getElementById('exportModal'),
    exportList: document.getElementById('exportPromptList'),
    closeExportModalBtn: document.getElementById('closeExportModalBtn'),
    cancelExportBtn: document.getElementById('cancelExportBtn'),
    confirmExportBtn: document.getElementById('confirmExportBtn'),
    exportSelectAll: document.getElementById('exportSelectAll'),
    exportSelectedCount: document.getElementById('exportSelectedCount'),

    importModal: document.getElementById('importModal'),
    importList: document.getElementById('importPromptList'),
    closeImportModalBtn: document.getElementById('closeImportModalBtn'),
    cancelImportBtn: document.getElementById('cancelImportBtn'),
    confirmImportBtn: document.getElementById('confirmImportBtn'),
    importSelectAll: document.getElementById('importSelectAll'),
    importSelectedCount: document.getElementById('importSelectedCount'),
    
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toastMessage')
};

function init() {
    setupEventListeners();
    renderSidebar();
    renderPrompts();
}

function isMobileViewport() {
    return window.innerWidth < 1024;
}

function openSidebar() {
    els.sidebar.classList.add('show');
    els.sidebarBackdrop.classList.add('show');
}

function closeSidebar() {
    els.sidebar.classList.remove('show');
    els.sidebarBackdrop.classList.remove('show');
}

function saveData() {
    localStorage.setItem('prompt_manager_data', JSON.stringify(prompts));
    renderSidebar();
}

window.showToast = function(message) {
    els.toastMessage.textContent = message;
    els.toast.classList.add('show');
    setTimeout(() => {
        els.toast.classList.remove('show');
    }, 3000);
}

// ==== Modal & Variants Logic ====

function createVariantInput(id = '', name = '', content = '') {
    const div = document.createElement('div');
    div.className = 'bg-[#0f172a]/50 p-3 rounded-xl border border-slate-700/50 relative variant-item shadow-sm';
    div.dataset.id = id || crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
    div.innerHTML = `
        <button type="button" class="absolute top-2 right-2 text-red-400 hover:text-red-300 remove-variant-btn p-1 transition-colors">
            <i class="fa-solid fa-xmark"></i>
        </button>
        <input type="text" class="variant-name w-full mb-3 px-3 py-1.5 text-sm border border-slate-700 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-[#0f172a] text-slate-200 placeholder-slate-500 font-semibold" placeholder="Variant Name (e.g. Snowy)" value="${name.replace(/"/g, '&quot;')}">
        <textarea rows="3" class="variant-content w-full px-3 py-2 text-sm border border-slate-700 rounded-lg font-mono focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none resize-y bg-[#0f172a] text-slate-300 placeholder-slate-500 leading-relaxed custom-scroll" placeholder="Variant content...">${content}</textarea>
    `;
    div.querySelector('.remove-variant-btn').addEventListener('click', () => div.remove());
    return div;
}

function openModal(id = null) {
    editId = id;
    els.form.reset();
    els.variantsContainer.innerHTML = '';
    
    if (id) {
        const prompt = prompts.find(p => p.id === id);
        if (prompt) {
            els.modalTitle.textContent = 'Edit Prompt';
            document.getElementById('promptTitle').value = prompt.title;
            document.getElementById('promptCategory').value = prompt.category;
            document.getElementById('promptTags').value = prompt.tags.join(', ');
            document.getElementById('promptContent').value = prompt.content;
            
            if (prompt.variants) {
                prompt.variants.forEach(v => {
                    els.variantsContainer.appendChild(createVariantInput(v.id, v.name, v.content));
                });
            }
        }
    } else {
        els.modalTitle.textContent = 'Create New Prompt';
        document.getElementById('promptCategory').value = 'Code';
    }
    els.modal.classList.add('show');
}

function closeModal() {
    els.modal.classList.remove('show');
    editId = null;
}

function savePrompt() {
    if (!els.form.checkValidity()) {
        els.form.reportValidity();
        return;
    }

    const title = document.getElementById('promptTitle').value.trim();
    const category = document.getElementById('promptCategory').value;
    const tagsStr = document.getElementById('promptTags').value;
    const content = document.getElementById('promptContent').value.trim();
    const tags = tagsStr.split(',').map(t => t.trim()).filter(t => t);
    
    const variants = Array.from(document.querySelectorAll('.variant-item')).map(item => ({
        id: item.dataset.id,
        name: item.querySelector('.variant-name').value.trim(),
        content: item.querySelector('.variant-content').value.trim()
    })).filter(v => v.name && v.content);

    if (editId) {
        const index = prompts.findIndex(p => p.id === editId);
        if (index > -1) {
            prompts[index] = {
                ...prompts[index],
                title, category, tags, content, variants,
                updated_at: new Date().toISOString()
            };
        }
    } else {
        const newPrompt = {
            id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
            title, category, tags, content, variants,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        prompts.push(newPrompt);
    }
    
    saveData();
    renderPrompts();
    closeModal();
    window.showToast(editId ? 'Prompt updated successfully' : 'Prompt created successfully');
}

// ==== Core Functions ====

function deletePrompt(id) {
    if(confirm('Are you sure you want to delete this prompt?')) {
        prompts = prompts.filter(p => p.id !== id);
        selectedIds.delete(id);
        saveData();
        renderPrompts();
        updateBulkDeleteUi();
        window.showToast('Prompt deleted');
    }
}

function duplicatePrompt(id) {
    const prompt = prompts.find(p => p.id === id);
    if (!prompt) return;

    const newPrompt = {
        ...prompt,
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        title: prompt.title + ' (Copy)',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    
    prompts.push(newPrompt);
    saveData();
    renderPrompts();
    window.showToast('Prompt duplicated successfully');
}

function toggleSelection(id) {
    if (selectedIds.has(id)) {
        selectedIds.delete(id);
    } else {
        selectedIds.add(id);
    }
    updateBulkDeleteUi();
}

function updateBulkDeleteUi() {
    if (selectedIds.size > 0) {
        els.bulkDeleteBtn.classList.remove('hidden');
        els.bulkDeleteBtn.classList.add('flex');
        els.selectedCount.textContent = selectedIds.size;
    } else {
        els.bulkDeleteBtn.classList.add('hidden');
        els.bulkDeleteBtn.classList.remove('flex');
    }
    
    document.querySelectorAll('.prompt-card').forEach(card => {
        const id = card.dataset.id;
        const checkbox = card.querySelector('.prompt-checkbox');
        if (checkbox) {
            if(selectedIds.has(id)) {
                card.classList.add('selected');
                checkbox.checked = true;
            } else {
                card.classList.remove('selected');
                checkbox.checked = false;
            }
        }
    });
}

function bulkDelete() {
    if(confirm(`Delete ${selectedIds.size} selected prompts?`)) {
        prompts = prompts.filter(p => !selectedIds.has(p.id));
        selectedIds.clear();
        saveData();
        renderPrompts();
        updateBulkDeleteUi();
        window.showToast('Prompts deleted');
    }
}

function getFilteredPrompts() {
    let filtered = prompts;
    if (currentFilter.text) {
        const q = currentFilter.text.toLowerCase();
        filtered = filtered.filter(p => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q));
    }
    if (currentFilter.category !== 'all') {
        filtered = filtered.filter(p => p.category === currentFilter.category);
    }
    if (currentFilter.tags.length > 0) {
        filtered = filtered.filter(p => currentFilter.tags.every(t => p.tags.includes(t)));
    }
    filtered.sort((a, b) => {
        const dA = new Date(a.created_at).getTime();
        const dB = new Date(b.created_at).getTime();
        if (currentFilter.sort === 'newest') return dB - dA;
        if (currentFilter.sort === 'oldest') return dA - dB;
        if (currentFilter.sort === 'alpha') return a.title.localeCompare(b.title);
        return 0;
    });
    return filtered;
}

function renderSidebar() {
    const allCount = prompts.length;
    els.categoryList.innerHTML = `
        <li class="mb-1">
            <button class="w-full flex items-center justify-between px-3 py-2 rounded-lg ${currentFilter.category === 'all' ? 'bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20 shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'} text-sm transition-colors" data-category="all">
                <div class="flex items-center"><i class="fa-solid fa-layer-group w-5 text-center mr-2"></i> All Prompts</div>
                <span class="${currentFilter.category === 'all' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-500'} text-[10px] font-bold py-0.5 px-2 rounded-full">${allCount}</span>
            </button>
        </li>
    `;
    
    CATEGORIES.forEach(cat => {
        const count = prompts.filter(p => p.category === cat.id).length;
        const isActive = currentFilter.category === cat.id;
        const btn = document.createElement('li');
        btn.className = "mb-1";
        btn.innerHTML = `
            <button class="w-full flex items-center justify-between px-3 py-2 rounded-lg ${isActive ? 'bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20 shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'} text-sm transition-colors" data-category="${cat.id}">
                <div class="flex items-center"><i class="fa-solid ${cat.icon} w-5 text-center mr-2"></i> ${cat.id}</div>
                <span class="${isActive ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-500'} text-[10px] font-bold py-0.5 px-2 rounded-full">${count}</span>
            </button>
        `;
        els.categoryList.appendChild(btn);
    });

    const allTagsMap = new Map();
    prompts.forEach(p => {
        p.tags.forEach(t => {
            allTagsMap.set(t, (allTagsMap.get(t) || 0) + 1);
        });
    });
    
    els.tagList.innerHTML = '';
    const sortedTags = Array.from(allTagsMap.entries()).sort((a,b) => b[1] - a[1]);
    
    if (sortedTags.length === 0) {
        els.tagList.innerHTML = '<span class="text-[11px] font-medium text-slate-600 italic px-1">No tags available</span>';
    } else {
        sortedTags.forEach(([tag, count]) => {
            const isActive = currentFilter.tags.includes(tag);
            const btn = document.createElement('button');
            btn.className = `px-2.5 py-1 rounded-md text-[11px] font-bold border transition-colors ${isActive ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-transparent text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-200'}`;
            btn.textContent = `${tag} (${count})`;
            btn.onclick = () => {
                if (isActive) {
                    currentFilter.tags = currentFilter.tags.filter(t => t !== tag);
                } else {
                    currentFilter.tags.push(tag);
                }
                renderSidebar();
                renderPrompts();
                if (isMobileViewport()) closeSidebar();
            };
            els.tagList.appendChild(btn);
        });
    }

    let title = currentFilter.category === 'all' ? 'All Prompts' : `${currentFilter.category} Prompts`;
    if (currentFilter.tags.length > 0) title += ` | Tags: ${currentFilter.tags.join(', ')}`;
    if (currentFilter.text) title += ` | Search: "${currentFilter.text}"`;
    els.currentViewTitle.textContent = title;
}

function renderPrompts() {
    const list = getFilteredPrompts();
    els.promptContainer.innerHTML = '';
    
    if (list.length === 0) {
        els.promptContainer.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-20 text-slate-500">
                <div class="w-20 h-20 mb-5 rounded-full bg-[#1e293b] border border-slate-700 text-indigo-400 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                    <i class="fa-solid fa-folder-open text-3xl"></i>
                </div>
                <p class="text-lg font-bold text-slate-300">No prompts found</p>
                <p class="text-sm mt-1 font-medium text-slate-500">Adjust your filters or create a new prompt.</p>
            </div>
        `;
        return;
    }
    
    list.forEach(prompt => {
        const catConfig = CATEGORIES.find(c => c.id === prompt.category) || CATEGORIES[5];
        const hasVariants = prompt.variants && prompt.variants.length > 0;
        
        const card = document.createElement('div');
        card.className = `prompt-card bg-[#1e293b] rounded-xl p-5 relative group flex flex-col ${catConfig.cardClass} ${selectedIds.has(prompt.id) ? 'selected' : ''}`;
        card.dataset.id = prompt.id;
        
        const tagsHtml = prompt.tags.map(t => `<span class="bg-[#0f172a] text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">${t}</span>`).join('');
        const dateStr = new Date(prompt.created_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'});
        
        // Variants HTML
        let tabsHtml = '';
        if (hasVariants) {
            tabsHtml = `
                <div class="flex space-x-2 overflow-x-auto mb-2 variant-tabs pb-1 custom-scroll">
                    <button class="variant-tab active px-2.5 py-0.5 text-[11px] font-bold rounded border border-indigo-500/30 bg-indigo-500/20 text-indigo-300 whitespace-nowrap transition-colors" data-content="${encodeURIComponent(prompt.content)}">Default</button>
                    ${prompt.variants.map((v) => `
                        <button class="variant-tab px-2.5 py-0.5 text-[11px] font-bold rounded border border-slate-700 bg-slate-800 text-slate-400 whitespace-nowrap hover:bg-slate-700 hover:text-slate-200 transition-colors" data-content="${encodeURIComponent(v.content)}">${v.name}</button>
                    `).join('')}
                </div>
            `;
        }

        card.innerHTML = `
            <div class="prompt-checkbox-container">
                <input type="checkbox" class="prompt-checkbox w-5 h-5 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-800 shadow-sm" ${selectedIds.has(prompt.id) ? 'checked' : ''}>
            </div>
            
            <div class="flex items-start justify-between mb-4 pl-8">
                <span class="inline-flex items-center px-2 py-1 rounded text-[11px] font-bold border ${catConfig.colors}">
                    <i class="fa-solid ${catConfig.icon} mr-1.5 text-[10px]"></i> ${prompt.category}
                </span>
                
                <div class="flex space-x-1 relative">
                    <button class="w-7 h-7 rounded-md bg-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-700 flex items-center justify-center transition-colors action-more" title="More Options">
                        <i class="fa-solid fa-ellipsis-vertical text-sm"></i>
                    </button>
                    
                    <!-- 3-Dots Dropdown Menu -->
                    <div class="card-dropdown absolute right-0 top-8 w-36 bg-[#1e293b] rounded-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5),0_0_0_1px_rgba(0,0,0,0.3)] border border-slate-700 z-20 py-1.5 origin-top-right">
                        <button class="w-full text-left px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-indigo-400 flex items-center transition-colors action-dropdown-duplicate cursor-pointer">
                            <i class="fa-regular fa-clone w-4 mr-2 text-indigo-500"></i> Duplicate
                        </button>
                        <div class="border-t border-slate-700/50 my-1"></div>
                        <button class="w-full text-left px-4 py-2 text-xs font-bold text-slate-300 hover:bg-red-500/10 hover:text-red-400 flex items-center transition-colors action-dropdown-delete cursor-pointer">
                            <i class="fa-solid fa-trash-can w-4 mr-2 text-red-500"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
            
            <h3 class="prompt-card-title font-bold text-white mb-2 text-[15px] pr-4 tracking-tight" title="${prompt.title}">${prompt.title}</h3>
            
            ${tabsHtml}
            
            <div class="flex-1 bg-[#0f172a] border border-slate-700/50 rounded-lg p-3 mb-4 mt-1 relative cursor-pointer hover:border-slate-500 transition-colors action-copy-area group" title="Click to copy block">
                <div class="absolute top-2 right-2 bg-slate-800 border border-slate-700 p-1.5 rounded text-slate-300 shadow-xl opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100 font-bold text-[10px]">
                    <i class="fa-regular fa-copy mr-1"></i> Copy
                </div>
                <p class="content-display text-[13px] text-slate-300 font-mono line-clamp-3 whitespace-pre-wrap leading-relaxed">${prompt.content}</p>
            </div>
            
            <div class="flex items-center justify-between mt-auto pt-1">
                <div class="flex flex-wrap gap-1.5 max-w-[70%] overflow-hidden max-h-6">
                    ${tagsHtml}
                </div>
                <span class="text-[11px] font-bold text-slate-500">${dateStr}</span>
            </div>
        `;
        
        let currentContent = prompt.content;

        card.addEventListener('click', (e) => {
            if (
                e.target.closest('.prompt-checkbox-container') ||
                e.target.closest('.action-more') ||
                e.target.closest('.card-dropdown') ||
                e.target.closest('.action-copy-area') ||
                e.target.closest('.variant-tab')
            ) {
                return;
            }
            openModal(prompt.id);
        });

        card.querySelector('.prompt-checkbox').addEventListener('click', (e) => {
            e.stopPropagation();
        });
        card.querySelector('.prompt-checkbox').addEventListener('change', () => toggleSelection(prompt.id));
        
        if (hasVariants) {
            const tabs = card.querySelectorAll('.variant-tab');
            const display = card.querySelector('.content-display');

            tabs.forEach(tab => {
                tab.addEventListener('click', (e) => {
                    e.stopPropagation();
                    tabs.forEach(t => t.classList.remove('active', 'border-indigo-500/30', 'bg-indigo-500/20', 'text-indigo-300'));
                    tabs.forEach(t => t.classList.add('border-slate-700', 'bg-slate-800', 'text-slate-400'));
                    
                    tab.classList.add('active', 'border-indigo-500/30', 'bg-indigo-500/20', 'text-indigo-300');
                    tab.classList.remove('border-slate-700', 'bg-slate-800', 'text-slate-400');
                    
                    currentContent = decodeURIComponent(tab.dataset.content);
                    display.textContent = currentContent;
                });
            });
        }

        // Copy logic
        card.querySelector('.action-copy-area').addEventListener('click', (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(currentContent); 
            window.showToast('Copied to clipboard'); 
        });

        // Dropdown actions
        const moreBtn = card.querySelector('.action-more');
        const dropdown = card.querySelector('.card-dropdown');
        
        moreBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.card-dropdown.show').forEach(d => {
                if (d !== dropdown) d.classList.remove('show');
            });
            dropdown.classList.toggle('show');
        });

        card.querySelector('.action-dropdown-duplicate').addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.remove('show');
            duplicatePrompt(prompt.id);
        });

        card.querySelector('.action-dropdown-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.remove('show');
            deletePrompt(prompt.id);
        });

        els.promptContainer.appendChild(card);
    });
}

// ==== Export/Import Modal Logic ====

function openExportModal() {
    if(prompts.length === 0) return window.showToast('No data to export');
    exportSelectedIds.clear();
    prompts.forEach(p => exportSelectedIds.add(p.id));
    els.exportSelectAll.checked = true;
    updateExportModalUi();
    els.exportModal.classList.add('show');
}

function updateExportModalUi() {
    els.exportList.innerHTML = '';
    prompts.forEach(p => {
        const li = document.createElement('li');
        li.className = 'px-4 py-3 flex items-start space-x-3 hover:bg-slate-800/50 transition-colors cursor-pointer';
        const isChecked = exportSelectedIds.has(p.id);
        li.innerHTML = `
            <div class="pt-0.5">
                <input type="checkbox" class="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900" ${isChecked ? 'checked' : ''}>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-bold text-slate-200 truncate">${p.title}</p>
                <p class="text-xs font-medium text-slate-500 truncate">${p.category} | ${p.content}</p>
            </div>
        `;
        const checkbox = li.querySelector('input');
        checkbox.addEventListener('change', (e) => {
            if(e.target.checked) exportSelectedIds.add(p.id);
            else exportSelectedIds.delete(p.id);
            syncExportSelectAll();
        });
        els.exportList.appendChild(li);
    });
    syncExportSelectAll();
}

function syncExportSelectAll() {
    els.exportSelectedCount.textContent = exportSelectedIds.size;
    els.exportSelectAll.checked = exportSelectedIds.size === prompts.length && prompts.length > 0;
    els.confirmExportBtn.disabled = exportSelectedIds.size === 0;
    if(exportSelectedIds.size > 0) {
        els.confirmExportBtn.classList.remove('cursor-not-allowed', 'opacity-50');
    } else {
        els.confirmExportBtn.classList.add('cursor-not-allowed', 'opacity-50');
    }
}

function executeExport() {
    const toExport = prompts.filter(p => exportSelectedIds.has(p.id));
    if(toExport.length === 0) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(toExport, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `prompts_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode); 
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    els.exportModal.classList.remove('show');
    window.showToast(`Exported ${toExport.length} prompts`);
}

function processImportFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const data = JSON.parse(event.target.result);
            if (Array.isArray(data)) {
                parsedImportData = data.filter(p => p.id && p.title && p.content);
                if (parsedImportData.length === 0) return window.showToast('No valid prompts found in JSON');
                openImportModal();
            } else {
                alert('Invalid JSON format. Expected an array of prompts.');
            }
        } catch (err) {
            alert('Error parsing JSON file');
        }
    };
    reader.readAsText(file);
    els.importInput.value = '';
}

function openImportModal() {
    importSelectedIds.clear();
    parsedImportData.forEach(p => importSelectedIds.add(p.id));
    els.importSelectAll.checked = true;
    updateImportModalUi();
    els.importModal.classList.add('show');
}

function updateImportModalUi() {
    els.importList.innerHTML = '';
    parsedImportData.forEach(p => {
        const li = document.createElement('li');
        li.className = 'px-4 py-3 flex items-start space-x-3 hover:bg-slate-800/50 transition-colors cursor-pointer';
        const isChecked = importSelectedIds.has(p.id);
        const exists = prompts.find(existing => existing.id === p.id);
        const statusBadge = exists 
            ? `<span class="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] px-1.5 py-0.5 rounded font-bold ml-2">Update</span>`
            : `<span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-1.5 py-0.5 rounded font-bold ml-2">New</span>`;

        li.innerHTML = `
            <div class="pt-0.5">
                <input type="checkbox" class="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900" ${isChecked ? 'checked' : ''}>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-bold text-slate-200 truncate">${p.title} ${statusBadge}</p>
                <p class="text-xs font-medium text-slate-500 truncate">${p.category || 'Other'} | ${p.content}</p>
            </div>
        `;
        const checkbox = li.querySelector('input');
        checkbox.addEventListener('change', (e) => {
            if(e.target.checked) importSelectedIds.add(p.id);
            else importSelectedIds.delete(p.id);
            syncImportSelectAll();
        });
        els.importList.appendChild(li);
    });
    syncImportSelectAll();
}

function syncImportSelectAll() {
    els.importSelectedCount.textContent = importSelectedIds.size;
    els.importSelectAll.checked = importSelectedIds.size === parsedImportData.length && parsedImportData.length > 0;
    els.confirmImportBtn.disabled = importSelectedIds.size === 0;
    if(importSelectedIds.size > 0) {
        els.confirmImportBtn.classList.remove('cursor-not-allowed', 'opacity-50');
    } else {
        els.confirmImportBtn.classList.add('cursor-not-allowed', 'opacity-50');
    }
}

function executeImport() {
    const toImport = parsedImportData.filter(p => importSelectedIds.has(p.id));
    if (toImport.length === 0) return;

    const mode = document.querySelector('input[name="importMode"]:checked').value;
    if (mode === 'replace') {
        if(!confirm('This will DELETE all your current prompts and replace them. Are you sure?')) return;
        prompts = [];
    }

    let added = 0; let updated = 0;
    toImport.forEach(p => {
        const index = prompts.findIndex(existing => existing.id === p.id);
        if (index > -1) { prompts[index] = p; updated++; } 
        else { prompts.push(p); added++; }
    });

    saveData();
    renderPrompts();
    els.importModal.classList.remove('show');
    window.showToast(`Import completed: ${added} added, ${updated} updated`);
}


function setupEventListeners() {
    els.newPromptBtn.addEventListener('click', () => openModal());
    els.openSidebarBtn.addEventListener('click', openSidebar);
    els.closeSidebarBtn.addEventListener('click', closeSidebar);
    els.sidebarBackdrop.addEventListener('click', closeSidebar);
    els.closeBtn.addEventListener('click', closeModal);
    els.cancelBtn.addEventListener('click', closeModal);
    els.saveBtn.addEventListener('click', savePrompt);
    els.addVariantBtn.addEventListener('click', () => els.variantsContainer.appendChild(createVariantInput()));
    
    // Adjusted click outside listener (Removed els.modal so it doesn't close on background click per user request)
    [els.exportModal, els.importModal].forEach(m => {
        m.addEventListener('click', (e) => {
            if (e.target === els.exportModal) els.exportModal.classList.remove('show');
            if (e.target === els.importModal) els.importModal.classList.remove('show');
        });
    });
    
    document.addEventListener('click', (e) => {
        document.querySelectorAll('.card-dropdown.show').forEach(d => {
            const moreBtn = d.closest('.flex').querySelector('.action-more');
            if (!moreBtn.contains(e.target) && !d.contains(e.target)) {
                d.classList.remove('show');
            }
        });
    });
    
    els.searchInput.addEventListener('input', (e) => {
        currentFilter.text = e.target.value;
        renderPrompts();
        renderSidebar(); 
    });
    els.sortSelect.addEventListener('change', (e) => {
        currentFilter.sort = e.target.value;
        els.currentSortLabel.textContent = e.target.options[e.target.selectedIndex].text;
        renderPrompts();
    });
    els.categoryList.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (btn && btn.dataset.category) {
            currentFilter.category = btn.dataset.category;
            renderSidebar();
            renderPrompts();
            if (isMobileViewport()) closeSidebar();
        }
    });

    els.bulkDeleteBtn.addEventListener('click', bulkDelete);
    els.exportBtn.addEventListener('click', openExportModal);
    els.closeExportModalBtn.addEventListener('click', () => els.exportModal.classList.remove('show'));
    els.cancelExportBtn.addEventListener('click', () => els.exportModal.classList.remove('show'));
    els.confirmExportBtn.addEventListener('click', executeExport);
    els.exportSelectAll.addEventListener('change', (e) => {
        if(e.target.checked) prompts.forEach(p => exportSelectedIds.add(p.id));
        else exportSelectedIds.clear();
        updateExportModalUi();
    });

    els.importInput.addEventListener('change', (e) => processImportFile(e.target.files[0]));
    els.closeImportModalBtn.addEventListener('click', () => els.importModal.classList.remove('show'));
    els.cancelImportBtn.addEventListener('click', () => els.importModal.classList.remove('show'));
    els.confirmImportBtn.addEventListener('click', executeImport);
    els.importSelectAll.addEventListener('change', (e) => {
        if(e.target.checked) parsedImportData.forEach(p => importSelectedIds.add(p.id));
        else importSelectedIds.clear();
        updateImportModalUi();
    });

    window.addEventListener('resize', () => {
        if (!isMobileViewport()) {
            closeSidebar();
        }
    });
}

init();
