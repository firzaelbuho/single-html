const STORAGE_KEY = 'superNoteData';

// Category Definitions
const CATEGORY_CONFIG = {
    normal: { icon: 'fa-regular fa-note-sticky', text: 'Normal', colorClass: 'text-gray-400', bgClass: 'bg-gray-800/50', borderClass: 'border-gray-700/50', badgeBg: 'bg-gray-800', badgeText: 'text-gray-300', accent: 'bg-gray-500' },
    todo: { icon: 'fa-solid fa-list-check', text: 'Todo List', colorClass: 'text-emerald-400', bgClass: 'bg-emerald-500/5', borderClass: 'border-emerald-500/20', badgeBg: 'bg-emerald-500/10', badgeText: 'text-emerald-400', accent: 'bg-emerald-500' },
    snippet: { icon: 'fa-solid fa-code', text: 'Code Snippet', colorClass: 'text-amber-400', bgClass: 'bg-amber-500/5', borderClass: 'border-amber-500/20', badgeBg: 'bg-amber-500/10', badgeText: 'text-amber-400', accent: 'bg-amber-500' },
    reminder: { icon: 'fa-solid fa-clock', text: 'Reminder', colorClass: 'text-rose-400', bgClass: 'bg-rose-500/5', borderClass: 'border-rose-500/20', badgeBg: 'bg-rose-500/10', badgeText: 'text-rose-400', accent: 'bg-rose-500' },
    link: { icon: 'fa-solid fa-link', text: 'Link', colorClass: 'text-blue-400', bgClass: 'bg-blue-500/5', borderClass: 'border-blue-500/20', badgeBg: 'bg-blue-500/10', badgeText: 'text-blue-400', accent: 'bg-blue-500' }
};

// State
let notes = [];
let currentFilterCategory = 'all';
let currentFilterTag = 'all';
let currentSort = 'newest';
let bulkSelectMode = false;
let selectedNoteIds = new Set();
let timerIntervals = {};

// DOM Elements
const noteGrid = document.getElementById('noteGrid');
const categoryFilterList = document.getElementById('categoryFilterList');
const tagFilterList = document.getElementById('tagFilterList');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const currentSortLabel = document.getElementById('currentSortLabel');
const currentViewTitle = document.getElementById('currentViewTitle');
const newNoteBtn = document.getElementById('newNoteBtn');
const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
const selectedCount = document.getElementById('selectedCount');

// Modal Elements
const noteModal = document.getElementById('noteModal');
const noteModalContent = document.getElementById('noteModalContent');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelBtn');
const noteForm = document.getElementById('noteForm');
const noteCategory = document.getElementById('noteCategory');
const variantsContainer = document.getElementById('variantsContainer');
const addVariantBtn = document.getElementById('addVariantBtn');
const variantTemplate = document.getElementById('variantTemplate');

// Export/Import Features
const exportBtn = document.getElementById('exportBtn');
const exportModal = document.getElementById('exportModal');
const closeExportModalBtn = document.getElementById('closeExportModalBtn');
const cancelExportBtn = document.getElementById('cancelExportBtn');
const exportSelectAll = document.getElementById('exportSelectAll');
const exportNoteList = document.getElementById('exportNoteList');
const confirmExportBtn = document.getElementById('confirmExportBtn');
const exportSelectedCount = document.getElementById('exportSelectedCount');

const importInput = document.getElementById('importInput');
const importModal = document.getElementById('importModal');
const closeImportModalBtn = document.getElementById('closeImportModalBtn');
const cancelImportBtn = document.getElementById('cancelImportBtn');
const importSelectAll = document.getElementById('importSelectAll');
const importNoteList = document.getElementById('importNoteList');
const confirmImportBtn = document.getElementById('confirmImportBtn');
const importSelectedCount = document.getElementById('importSelectedCount');

const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const toastIcon = document.getElementById('toastIcon');

// --------------------------------------------------------------------------
// Initialization
// --------------------------------------------------------------------------
function init() {
    loadData();
    setupEventListeners();
    renderSidebar();
    renderNotes();
}

function loadData() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            notes = JSON.parse(stored);
        } else {
            // Default welcome note
            notes = [{
                id: generateId(),
                title: 'Welcome to Super Note',
                categoryId: 'normal',
                tags: ['welcome'],
                createdAt: Date.now(),
                variants: [
                    { name: 'Introduction', content: 'This is a single-page app to manage notes. You can create snippets, todos, links, and reminders.' }
                ]
            }];
            saveData();
        }
    } catch (e) {
        console.error('Failed to load notes', e);
        notes = [];
    }
}

function saveData(showFeedback = false) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    if (showFeedback) showToast('Changes saved successfully', 'success');
}

function generateId() {
    return Math.random().toString(36).substr(2, 9) + '-' + Date.now();
}

// --------------------------------------------------------------------------
// Event Listeners
// --------------------------------------------------------------------------
function setupEventListeners() {
    // New Note
    newNoteBtn.addEventListener('click', () => openNoteModal());
    
    // Form buttons
    closeModalBtn.addEventListener('click', closeNoteModal);
    cancelBtn.addEventListener('click', closeNoteModal);
    noteForm.addEventListener('submit', handleNoteFormSubmit);
    
    // Variant buttons
    addVariantBtn.addEventListener('click', () => addVariantInputGroup());
    noteCategory.addEventListener('change', () => {
        // Change category dynamically -> rerender existing variant inputs based on new cat.
        const currentVariants = collectVariantsData();
        variantsContainer.innerHTML = '';
        if (currentVariants.length === 0) {
            addVariantInputGroup(); // Add one default if empty
        } else {
            currentVariants.forEach(v => addVariantInputGroup(v));
        }
    });

    // Filtering & Search
    searchInput.addEventListener('input', renderNotes);
    sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        const labels = { 'newest': 'Newest', 'oldest': 'Oldest', 'alpha': 'A-Z' };
        currentSortLabel.textContent = labels[currentSort];
        renderNotes();
    });

    // Bulk Delete
    bulkDeleteBtn.addEventListener('click', handleBulkDelete);

    // Export/Import
    exportBtn.addEventListener('click', openExportModal);
    closeExportModalBtn.addEventListener('click', closeExportModal);
    cancelExportBtn.addEventListener('click', closeExportModal);
    exportSelectAll.addEventListener('change', toggleExportSelectAll);
    confirmExportBtn.addEventListener('click', performExport);

    importInput.addEventListener('change', handleImportFileSelect);
    closeImportModalBtn.addEventListener('click', closeImportModal);
    cancelImportBtn.addEventListener('click', closeImportModal);
    importSelectAll.addEventListener('change', toggleImportSelectAll);
    confirmImportBtn.addEventListener('click', performImport);
}

// --------------------------------------------------------------------------
// Sidebar & Filtering
// --------------------------------------------------------------------------
function renderSidebar() {
    // Categories
    let catHtml = `<li class="mb-1">
        <button class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentFilterCategory === 'all' ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-300'}" onclick="setCategoryFilter('all')">
            <i class="fa-solid fa-layer-group w-5 text-center mr-1"></i> All Notes
        </button>
    </li>`;
    
    for (const [key, config] of Object.entries(CATEGORY_CONFIG)) {
        catHtml += `<li class="mb-1">
            <button class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentFilterCategory === key ? `bg-${key === 'todo' ? 'emerald' : key === 'snippet' ? 'amber' : key === 'reminder' ? 'rose' : key === 'link' ? 'blue' : 'gray'}-500/20 text-${key === 'todo' ? 'emerald' : key === 'snippet' ? 'amber' : key === 'reminder' ? 'rose' : key === 'link' ? 'blue' : 'gray'}-400` : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-300'}" onclick="setCategoryFilter('${key}')">
                <i class="${config.icon} w-5 text-center mr-1"></i> ${config.text}
            </button>
        </li>`;
    }
    categoryFilterList.innerHTML = catHtml;

    // Tags
    const tagSet = new Set();
    notes.forEach(p => p.tags && p.tags.forEach(t => {
        if(t.trim()) tagSet.add(t.toLowerCase().trim());
    }));
    const uniqueTags = Array.from(tagSet).sort();

    let tagHtml = `<button class="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${currentFilterTag === 'all' ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'}" onclick="setTagFilter('all')">All</button>`;
    
    uniqueTags.forEach(tag => {
        tagHtml += `<button class="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${currentFilterTag === tag ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'}" onclick="setTagFilter('${tag}')">${tag}</button>`;
    });
    tagFilterList.innerHTML = tagHtml;
}

function setCategoryFilter(cat) {
    currentFilterCategory = cat;
    renderSidebar();
    renderNotes();
    updateViewTitle();
}

function setTagFilter(tag) {
    currentFilterTag = tag;
    renderSidebar();
    renderNotes();
    updateViewTitle();
}

function updateViewTitle() {
    let title = 'All Notes';
    if(currentFilterCategory !== 'all') {
        title = CATEGORY_CONFIG[currentFilterCategory].text + 's';
    }
    if(currentFilterTag !== 'all') {
        title += ` (Tag: ${currentFilterTag})`;
    }
    currentViewTitle.textContent = title;
}

// --------------------------------------------------------------------------
// Core Render
// --------------------------------------------------------------------------
function getFilteredAndSortedNotes() {
    const q = searchInput.value.toLowerCase();
    
    let filtered = notes.filter(n => {
        const matchCat = currentFilterCategory === 'all' || n.categoryId === currentFilterCategory;
        const matchTag = currentFilterTag === 'all' || (n.tags && n.tags.some(t => t.toLowerCase() === currentFilterTag));
        const matchSearch = n.title.toLowerCase().includes(q) || 
                            n.variants.some(v => v.name.toLowerCase().includes(q) || (v.content && v.content.toLowerCase().includes(q)));
        return matchCat && matchTag && matchSearch;
    });

    filtered.sort((a, b) => {
        if (currentSort === 'newest') return b.createdAt - a.createdAt;
        if (currentSort === 'oldest') return a.createdAt - b.createdAt;
        if (currentSort === 'alpha') return a.title.localeCompare(b.title);
        return 0;
    });

    return filtered;
}

function clearTimers() {
    Object.values(timerIntervals).forEach(clearInterval);
    timerIntervals = {};
}

function renderNotes() {
    clearTimers();
    const filtered = getFilteredAndSortedNotes();
    
    if (filtered.length === 0) {
        noteGrid.innerHTML = `
            <div class="col-span-full py-20 flex flex-col items-center justify-center text-gray-500">
                <i class="fa-solid fa-ghost text-5xl mb-4 opacity-50"></i>
                <p class="text-lg font-semibold">No notes found.</p>
                <p class="text-sm mt-1">Try adjusting your search or filters.</p>
            </div>
        `;
        return;
    }

    let html = '';
    filtered.forEach(note => {
        const conf = CATEGORY_CONFIG[note.categoryId] || CATEGORY_CONFIG.normal;
        const isSelected = selectedNoteIds.has(note.id);
        
        let tagsHtml = '';
        if (note.tags && note.tags.length > 0) {
            tagsHtml = `<div class="flex flex-wrap gap-1 mb-3">
                ${note.tags.map(t => `<span class="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-gray-800/50 border border-gray-700/50 text-gray-400">${t}</span>`).join('')}
            </div>`;
        }

        let tabsHtml = '';
        if (note.variants.length > 1) {
            tabsHtml = `<div class="flex space-x-2 mb-3 px-5 overflow-x-auto custom-scroll pb-1 flex-shrink-0">`;
            note.variants.forEach((v, index) => {
                const isActive = index === 0;
                tabsHtml += `<button type="button" onclick="switchVariant(event, '${note.id}', ${index})" id="tab-btn-${note.id}-${index}" class="tab-btn-${note.id} text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-colors ${isActive ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-gray-300'} whitespace-nowrap focus:outline-none">${escapeHtml(v.name || `Variant ${index+1}`)}</button>`;
            });
            tabsHtml += `</div>`;
        }

        let variantsHtml = note.variants.map((v, index) => {
            let innerContent = '';
            let copyBtnHtml = '';
            
            if (note.categoryId === 'normal' || note.categoryId === 'snippet') {
                copyBtnHtml = `
                    <button type="button" class="absolute top-2 right-2 p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-md z-10 transition-colors shadow-xl border border-gray-700/50" onclick="copyVariantToClipboard(event, '${encodeURIComponent(v.content || '')}')" title="Copy to clipboard">
                        <i class="fa-regular fa-copy"></i>
                    </button>
                `;
            }
            
            if (note.categoryId === 'snippet') {
                const safeCode = escapeHtml(v.content || '');
                const langClass = v.language ? `language-${v.language}` : '';
                innerContent = `<div class="relative bg-gray-950 rounded-lg overflow-hidden border border-gray-800 h-full"><pre class="m-0 h-full"><code class="${langClass} hljs h-full block custom-scroll">${safeCode}</code></pre></div>`;
            } 
            else if (note.categoryId === 'todo') {
                let items = [];
                try { items = JSON.parse(v.content || '[]'); } catch(e){}
                innerContent = `<ul class="space-y-1">
                    ${items.map(item => `
                        <li class="flex items-start text-sm ${item.checked ? 'text-gray-500 line-through' : 'text-gray-300'}">
                            <i class="fa-regular ${item.checked ? 'fa-square-check text-emerald-500 mt-0.5' : 'fa-square text-gray-600 mt-0.5'} mr-2 text-xs"></i>
                            <span class="break-words flex-1">${escapeHtml(item.text)}</span>
                        </li>
                    `).join('')}
                </ul>`;
            }
            else if (note.categoryId === 'link') {
                innerContent = `<div><a href="${v.content}" target="_blank" onclick="event.stopPropagation()" class="inline-flex items-center text-sm font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 px-3 py-1.5 rounded-lg transition-colors break-all w-max"><i class="fa-solid fa-arrow-up-right-from-square mr-2 text-xs"></i> ${escapeHtml(v.content)}</a></div>`;
            }
            else if (note.categoryId === 'reminder') {
                innerContent = `
                    <div class="bg-gray-950 p-4 rounded-lg border border-gray-800 text-center flex flex-col items-center justify-center h-full">
                        <div class="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Target Time</div>
                        <div class="text-sm font-medium text-gray-300 mb-3 bg-gray-900 px-3 py-1.5 rounded-md border border-gray-800">${new Date(v.targetDate).toLocaleString()}</div>
                        <div class="text-2xl font-mono font-bold text-rose-400 tracking-tight" id="timer-${note.id}-${index}">Loading...</div>
                        ${v.content ? `<p class="mt-4 text-xs text-gray-400 italic font-medium px-4">"${escapeHtml(v.content)}"</p>` : ''}
                    </div>
                `;
            }
            else {
                // Normal plain content
                innerContent = `<div class="text-sm text-gray-300 whitespace-pre-wrap font-mono break-words bg-gray-950 p-4 rounded-lg border border-gray-800 h-full overflow-hidden custom-scroll">${escapeHtml(v.content || '')}</div>`;
            }

            return `
                <div id="variant-content-${note.id}-${index}" class="variant-content-${note.id} relative flex flex-col h-full ${index === 0 ? '' : 'hidden'}">
                    ${copyBtnHtml}
                    ${innerContent}
                </div>
            `;
        }).join('');

        const checkboxClass = isSelected ? 'opacity-100' : 'opacity-0 group-hover/card:opacity-100';
        const selectCheckHtml = `
            <div class="absolute top-4 left-4 z-30 ${checkboxClass} transition-opacity duration-200">
                 <input type="checkbox" onclick="event.stopPropagation()" onchange="toggleNoteSelection('${note.id}')" ${isSelected ? 'checked' : ''} class="w-5 h-5 rounded border-gray-600 bg-gray-800/90 text-indigo-500 focus:ring-indigo-500 cursor-pointer shadow-lg backdrop-blur-sm transition-all focus:ring-offset-gray-900 focus:ring-1">
            </div>
        `;

        const menuBtn = `
            <div class="relative group dropdown ml-3">
                <button type="button" class="text-gray-500 hover:text-gray-300 px-2 py-1 transition-colors rounded-md hover:bg-gray-800" onclick="toggleDropdown(event, '${note.id}')">
                    <i class="fa-solid fa-ellipsis-vertical"></i>
                </button>
                <div id="dropdown-${note.id}" class="hidden absolute right-0 mt-2 w-36 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 py-1 origin-top-right">
                    <button type="button" class="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors" onclick="duplicateNote(event, '${note.id}')">
                        <i class="fa-solid fa-copy mb-1 w-4 text-center mr-2 text-gray-400"></i> Duplicate
                    </button>
                    <button type="button" class="w-full text-left px-4 py-2 text-sm text-rose-400 hover:bg-gray-700 hover:text-rose-300 transition-colors" onclick="deleteNoteQuick(event, '${note.id}')">
                        <i class="fa-solid fa-trash-can mb-1 w-4 text-center mr-2 text-rose-500"></i> Delete
                    </button>
                </div>
            </div>
        `;

        html += `
            <div class="note-card bg-gray-900 border ${isSelected ? 'border-indigo-500 ring-1 ring-indigo-500' : conf.borderClass} rounded-2xl shadow-sm overflow-hidden flex flex-col h-[22rem] relative group/card">
                <!-- Category Color Accent Line -->
                <div class="absolute left-0 top-0 bottom-0 w-1 ${conf.accent} z-10"></div>
                
                ${selectCheckHtml}
                <!-- Clickable area to open modal -->
                <div class="px-5 py-4 flex-shrink-0 cursor-pointer" onclick="openNoteModal('${note.id}')">
                    <div class="flex items-start justify-between mb-3 border-b border-gray-800 pb-3">
                        <div class="flex flex-col pl-7 overflow-hidden pr-2">
                            <h4 class="font-bold text-gray-100 leading-tight mb-2 truncate" title="${escapeHtml(note.title)}">${escapeHtml(note.title)}</h4>
                            <span class="${conf.badgeBg} ${conf.badgeText} text-[10px] px-2 py-0.5 rounded shadow-sm font-bold w-max flex items-center">
                                <i class="${conf.icon} mr-1.5"></i> ${conf.text}
                            </span>
                        </div>
                        <div class="flex-shrink-0 flex items-center">
                            ${menuBtn}
                        </div>
                    </div>
                    ${tagsHtml}
                </div>
                ${tabsHtml}
                <div class="flex-1 px-5 pb-5 overflow-hidden relative cursor-pointer group" onclick="openNoteModal('${note.id}')">
                    ${variantsHtml}
                    <!-- Fade out mask at bottom -->
                    <div class="absolute bottom-5 left-5 right-5 h-8 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none group-hover:h-4 transition-all"></div>
                </div>
            </div>
        `;
    });

    noteGrid.innerHTML = html;

    // Apply Highlight.js to newly added code blocks
    document.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
    });

    // Start timers for reminders
    setupReminders(filtered);
}

function setupReminders(notesArray) {
    notesArray.forEach(note => {
        if (note.categoryId !== 'reminder') return;
        note.variants.forEach((v, index) => {
            if (v.targetDate) {
                const elId = `timer-${note.id}-${index}`;
                startCountdown(elId, new Date(v.targetDate).getTime());
            }
        });
    });
}

function startCountdown(elementId, targetTime) {
    const update = () => {
        const el = document.getElementById(elementId);
        if (!el) {
            clearInterval(timerIntervals[elementId]);
            return;
        }
        const now = Date.now();
        const diff = targetTime - now;
        
        if (diff <= 0) {
            el.innerHTML = '<span class="text-rose-500 border border-rose-500/30 px-2 py-0.5 rounded bg-rose-500/10">Time is up!</span>';
            clearInterval(timerIntervals[elementId]);
            return;
        }

        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diff / 1000 / 60) % 60);
        const s = Math.floor((diff / 1000) % 60);

        el.textContent = `${d}d ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };
    
    update(); // Run once immediately
    timerIntervals[elementId] = setInterval(update, 1000);
}


// --------------------------------------------------------------------------
// Bulk Actions
// --------------------------------------------------------------------------
function toggleNoteSelection(id) {
    if (selectedNoteIds.has(id)) {
        selectedNoteIds.delete(id);
    } else {
        selectedNoteIds.add(id);
    }
    updateBulkDeleteUI();
    renderNotes(); // Rerender to show selected state on cards
}

function updateBulkDeleteUI() {
    if (selectedNoteIds.size > 0) {
        bulkDeleteBtn.classList.remove('hidden');
        bulkDeleteBtn.classList.add('flex');
        selectedCount.textContent = selectedNoteIds.size;
    } else {
        bulkDeleteBtn.classList.add('hidden');
        bulkDeleteBtn.classList.remove('flex');
        bulkSelectMode = false; // Turn off if nothing selected? Actually, let's enable it fully if shift click or something. We'll just toggle it dynamically for now.
    }
}

function handleBulkDelete() {
    if(confirm(`Are you sure you want to delete ${selectedNoteIds.size} note(s)?`)) {
        notes = notes.filter(n => !selectedNoteIds.has(n.id));
        selectedNoteIds.clear();
        saveData(true);
        updateBulkDeleteUI();
        renderSidebar();
        renderNotes();
    }
}

// Intercept long press or alt+click to enter selection mode
document.addEventListener('keydown', (e) => {
    if (e.altKey && !bulkSelectMode) {
        bulkSelectMode = true;
        renderNotes();
    }
});
document.addEventListener('keyup', (e) => {
    if (e.key === 'Alt') {
        if (selectedNoteIds.size === 0) {
            bulkSelectMode = false;
            renderNotes();
        }
    }
});


// --------------------------------------------------------------------------
// Note Modal Logic (Create & Edit)
// --------------------------------------------------------------------------
function openNoteModal(noteId = null) {
    variantsContainer.innerHTML = ''; // clear variants
    
    if (noteId) {
        // Edit mode
        const note = notes.find(n => n.id === noteId);
        document.getElementById('modalTitle').textContent = 'Edit Note';
        document.getElementById('noteId').value = note.id;
        document.getElementById('noteTitle').value = note.title;
        document.getElementById('noteCategory').value = note.categoryId;
        document.getElementById('noteTags').value = (note.tags || []).join(', ');
        
        note.variants.forEach(v => addVariantInputGroup(v));
    } else {
        // Create mode
        document.getElementById('modalTitle').textContent = 'Create Note';
        document.getElementById('noteId').value = '';
        document.getElementById('noteTitle').value = '';
        document.getElementById('noteCategory').value = 'normal';
        document.getElementById('noteTags').value = '';
        
        addVariantInputGroup(); // 1 default empty variant
    }

    noteModal.classList.remove('opacity-0', 'pointer-events-none');
    noteModalContent.classList.remove('scale-95');
}

function closeNoteModal() {
    noteModal.classList.add('opacity-0', 'pointer-events-none');
    noteModalContent.classList.add('scale-95');
}

// Generate the specific inputs based on category
function addVariantInputGroup(variantData = null) {
    const template = variantTemplate.content.cloneNode(true);
    const entry = template.querySelector('.variant-entry');
    const container = template.querySelector('.variant-content-container');
    const nameInput = template.querySelector('.variant-name');
    const removeBtn = template.querySelector('.remove-variant-btn');

    nameInput.value = variantData ? variantData.name : (variantsContainer.children.length === 0 ? "Default" : `Variant ${variantsContainer.children.length + 1}`);

    const cat = noteCategory.value;
    entry.dataset.category = cat;
    
    if (cat === 'normal') {
        container.innerHTML = `
            <div>
                <label class="block text-xs font-semibold text-gray-400 mb-1">Content</label>
                <textarea class="variant-text w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-200 font-mono text-sm resize-y" rows="4" required>${variantData ? escapeHtml(variantData.content || '') : ''}</textarea>
            </div>
        `;
    } else if (cat === 'snippet') {
        const langs = ['text', 'html', 'css', 'javascript', 'typescript', 'python', 'java', 'kotlin', 'php', 'json', 'xml', 'c', 'cpp', 'csharp', 'go', 'rust', 'ruby', 'bash', 'sql'];
        const currentLang = variantData ? variantData.language : 'text';
        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                <div class="md:col-span-1">
                    <label class="block text-xs font-semibold text-gray-400 mb-1">Language</label>
                    <select class="variant-lang w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-200 select-dark text-sm">
                        ${langs.map(l => `<option value="${l}" ${l === currentLang ? 'selected' : ''}>${l}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div>
                <label class="block text-xs font-semibold text-gray-400 mb-1">Code</label>
                <textarea class="variant-code w-full px-4 py-3 bg-[#1a1b26] border border-gray-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[#a9b1d6] font-mono text-sm resize-y custom-scroll" rows="6" required spellcheck="false">${variantData ? escapeHtml(variantData.content || '') : ''}</textarea>
            </div>
        `;
    } else if (cat === 'link') {
        container.innerHTML = `
            <div>
                <label class="block text-xs font-semibold text-gray-400 mb-1">URL</label>
                <input type="url" class="variant-url w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-blue-400 text-sm" placeholder="https://..." value="${variantData ? escapeHtml(variantData.content || '') : ''}" required>
            </div>
        `;
    } else if (cat === 'reminder') {
        let vDateStr = '';
        let vTimeStr = '';
        if (variantData && variantData.targetDate) {
            const d = new Date(variantData.targetDate);
            const userDate = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
            vDateStr = userDate.toISOString().slice(0, 10);
            vTimeStr = userDate.toISOString().slice(11, 16);
        }
        container.innerHTML = `
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-semibold text-gray-400 mb-1">Target Date</label>
                    <input type="date" class="variant-date w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-200 text-sm" value="${vDateStr}" required>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-gray-400 mb-1">Target Time</label>
                    <input type="time" class="variant-time w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-200 text-sm" value="${vTimeStr}" required>
                </div>
            </div>
            <div class="mt-4">
                <label class="block text-xs font-semibold text-gray-400 mb-1">Description (Optional)</label>
                <textarea class="variant-text w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-200 text-sm resize-none" rows="2">${variantData ? escapeHtml(variantData.content || '') : ''}</textarea>
            </div>
        `;
    } else if (cat === 'todo') {
        let items = [];
        if (variantData && variantData.content) {
            try { items = JSON.parse(variantData.content); } catch (e){}
        }
        
        container.innerHTML = `
            <div>
                <label class="block text-xs font-semibold text-gray-400 mb-2">Checklist Items</label>
                <div class="todo-items-list space-y-2 mb-3">
                    <!-- populated via js below -->
                </div>
                <div class="flex space-x-2">
                    <input type="text" class="todo-new-input flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-200 text-sm" placeholder="Add new item...">
                    <button type="button" class="todo-add-btn px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg font-bold text-sm hover:bg-emerald-500/20"><i class="fa-solid fa-plus"></i></button>
                </div>
            </div>
        `;
        
        const listContainer = container.querySelector('.todo-items-list');
        const input = container.querySelector('.todo-new-input');
        const addBtn = container.querySelector('.todo-add-btn');

        const renderItems = () => {
            listContainer.innerHTML = '';
            items.forEach((item, idx) => {
                const row = document.createElement('div');
                row.className = 'flex items-center space-x-3 bg-gray-950 p-2 rounded-lg border border-gray-800';
                row.innerHTML = `
                    <input type="checkbox" ${item.checked ? 'checked' : ''} class="w-4 h-4 rounded border-gray-600 bg-gray-800 text-emerald-500 focus:ring-emerald-500 cursor-pointer">
                    <input type="text" class="flex-1 bg-transparent border-none text-sm focus:outline-none ${item.checked ? 'text-gray-500 line-through' : 'text-gray-200'}" value="${escapeHtml(item.text)}">
                    <button type="button" class="text-gray-500 hover:text-red-400"><i class="fa-solid fa-xmark"></i></button>
                `;
                
                const check = row.querySelector('input[type="checkbox"]');
                const textInput = row.querySelector('input[type="text"]');
                const delBtn = row.querySelector('button');

                check.addEventListener('change', (e) => {
                    item.checked = e.target.checked;
                    renderItems();
                });
                textInput.addEventListener('change', (e) => {
                    item.text = e.target.value;
                });
                delBtn.addEventListener('click', () => {
                    items.splice(idx, 1);
                    renderItems();
                });
                listContainer.appendChild(row);
            });
            // Attach string object to DOM so we can harvest it later on submit!
            listContainer.dataset.items = JSON.stringify(items);
        };
        
        renderItems();

        const addItem = () => {
            const val = input.value.trim();
            if (val) {
                items.push({ text: val, checked: false });
                input.value = '';
                renderItems();
            }
        };

        addBtn.addEventListener('click', addItem);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addItem();
            }
        });
    }

    removeBtn.addEventListener('click', () => {
        if (variantsContainer.children.length > 1) {
            entry.remove();
        } else {
            showToast('Note must have at least one variant.', 'error');
        }
    });

    variantsContainer.appendChild(entry);
}

function collectVariantsData() {
    const variants = [];
    const entries = variantsContainer.querySelectorAll('.variant-entry');
    
    entries.forEach(entry => {
        const cat = entry.dataset.category || noteCategory.value;
        const name = entry.querySelector('.variant-name').value;
        const v = { name, id: generateId() }; // id here is just a local key if needed
        
        if (cat === 'normal') {
            v.content = entry.querySelector('.variant-text').value;
        } else if (cat === 'snippet') {
            v.language = entry.querySelector('.variant-lang').value;
            v.content = entry.querySelector('.variant-code').value;
        } else if (cat === 'link') {
            v.content = entry.querySelector('.variant-url').value;
        } else if (cat === 'reminder') {
            const dStr = entry.querySelector('.variant-date').value;
            const tStr = entry.querySelector('.variant-time').value;
            v.targetDate = (dStr && tStr) ? new Date(`${dStr}T${tStr}`).toISOString() : null;
            v.content = entry.querySelector('.variant-text').value;
        } else if (cat === 'todo') {
            const lst = entry.querySelector('.todo-items-list');
            const currentItems = [];
            if (lst) {
                lst.querySelectorAll('div').forEach(row => {
                    const cb = row.querySelector('input[type="checkbox"]');
                    const txt = row.querySelector('input[type="text"]');
                    if (cb && txt) {
                        currentItems.push({ text: txt.value, checked: cb.checked });
                    }
                });
            }
            
            // Also capture pending item if user forgot to click Add
            const pendingInput = entry.querySelector('.todo-new-input');
            if (pendingInput && pendingInput.value.trim() !== '') {
                currentItems.push({ text: pendingInput.value.trim(), checked: false });
            }
            
            v.content = JSON.stringify(currentItems);
        }
        
        variants.push(v);
    });

    return variants;
}

function handleNoteFormSubmit(e) {
    e.preventDefault();
    const noteIdField = document.getElementById('noteId').value;
    const title = document.getElementById('noteTitle').value.trim();
    const categoryId = document.getElementById('noteCategory').value;
    const tagsStr = document.getElementById('noteTags').value;
    
    const tags = tagsStr.split(',').map(t => t.trim()).filter(t => t !== '');
    const variants = collectVariantsData();

    if (noteIdField) {
        // Edit
        const note = notes.find(n => n.id === noteIdField);
        if (note) {
            note.title = title;
            note.categoryId = categoryId;
            note.tags = tags;
            note.variants = variants;
            // dont change createdAt
        }
    } else {
        // Create
        notes.push({
            id: generateId(),
            title,
            categoryId,
            tags,
            createdAt: Date.now(),
            variants
        });
    }

    saveData(true);
    closeNoteModal();
    renderSidebar();
    renderNotes();
}

// --------------------------------------------------------------------------
// Export Logic
// --------------------------------------------------------------------------
function openExportModal() {
    exportSelectedCount.textContent = '0';
    exportSelectAll.checked = false;
    
    let html = '';
    notes.forEach(note => {
        html += `
            <li class="p-3 flex items-center space-x-3 hover:bg-gray-800/30 transition-colors">
                <input type="checkbox" value="${note.id}" class="export-note-cb w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500 cursor-pointer">
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-gray-200 truncate">${escapeHtml(note.title)}</p>
                    <p class="text-xs text-gray-500 truncate">${CATEGORY_CONFIG[note.categoryId] ? CATEGORY_CONFIG[note.categoryId].text : 'Unknown'} • ${new Date(note.createdAt).toLocaleDateString()}</p>
                </div>
            </li>
        `;
    });
    
    if(notes.length === 0){
        html = `<li class="p-4 text-center text-gray-500 text-sm">No notes available to export.</li>`;
    }

    exportNoteList.innerHTML = html;
    
    const checkboxes = exportNoteList.querySelectorAll('.export-note-cb');
    checkboxes.forEach(cb => {
        cb.addEventListener('change', updateExportCount);
    });

    exportModal.classList.remove('opacity-0', 'pointer-events-none');
    exportModal.firstElementChild.classList.remove('scale-95');
}

function closeExportModal() {
    exportModal.classList.add('opacity-0', 'pointer-events-none');
    exportModal.firstElementChild.classList.add('scale-95');
}

function toggleExportSelectAll(e) {
    const isChecked = e.target.checked;
    const checkboxes = exportNoteList.querySelectorAll('.export-note-cb');
    checkboxes.forEach(cb => {
        cb.checked = isChecked;
    });
    updateExportCount();
}

function updateExportCount() {
    const checked = exportNoteList.querySelectorAll('.export-note-cb:checked').length;
    exportSelectedCount.textContent = checked;
    confirmExportBtn.disabled = checked === 0;
    if (checked === 0) {
        confirmExportBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        confirmExportBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

function performExport() {
    const checkedBoxes = exportNoteList.querySelectorAll('.export-note-cb:checked');
    const selectedIds = Array.from(checkedBoxes).map(cb => cb.value);
    const dataToExport = notes.filter(n => selectedIds.includes(n.id));
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `super-note-export_${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast(`Exported ${dataToExport.length} note(s) successfully.`, 'success');
    closeExportModal();
}

// --------------------------------------------------------------------------
// Import Logic
// --------------------------------------------------------------------------
let pendingImportData = null;

function handleImportFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const json = JSON.parse(event.target.result);
            if (!Array.isArray(json)) throw new Error('Invalid format: Must be an array of objects.');
            pendingImportData = json;
            openImportModal();
        } catch (error) {
            showToast('Gagal memproses file JSON import.', 'error');
        }
        importInput.value = ''; // Reset input
    };
    reader.readAsText(file);
}

function openImportModal() {
    importSelectAll.checked = true;
    
    let html = '';
    pendingImportData.forEach((note, index) => {
        html += `
            <li class="p-3 flex items-center space-x-3 hover:bg-gray-800/30 transition-colors">
                <input type="checkbox" value="${index}" checked class="import-note-cb w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500 cursor-pointer">
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-gray-200 truncate">${escapeHtml(note.title || 'Untitled')}</p>
                    <p class="text-xs text-gray-500 truncate">${note.categoryId || 'Unknown'}</p>
                </div>
            </li>
        `;
    });

    importNoteList.innerHTML = html;
    updateImportCount();

    const checkboxes = importNoteList.querySelectorAll('.import-note-cb');
    checkboxes.forEach(cb => {
        cb.addEventListener('change', updateImportCount);
    });

    importModal.classList.remove('opacity-0', 'pointer-events-none');
    importModal.firstElementChild.classList.remove('scale-95');
}

function closeImportModal() {
    importModal.classList.add('opacity-0', 'pointer-events-none');
    importModal.firstElementChild.classList.add('scale-95');
    pendingImportData = null;
}

function toggleImportSelectAll(e) {
    const isChecked = e.target.checked;
    const checkboxes = importNoteList.querySelectorAll('.import-note-cb');
    checkboxes.forEach(cb => {
        cb.checked = isChecked;
    });
    updateImportCount();
}

function updateImportCount() {
    const checked = importNoteList.querySelectorAll('.import-note-cb:checked').length;
    importSelectedCount.textContent = checked;
    confirmImportBtn.disabled = checked === 0;
    if (checked === 0) {
        confirmImportBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        confirmImportBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

function performImport() {
    const checkedBoxes = importNoteList.querySelectorAll('.import-note-cb:checked');
    const selectedIndices = Array.from(checkedBoxes).map(cb => parseInt(cb.value));
    
    const dataToImport = selectedIndices.map(idx => pendingImportData[idx]);
    
    // Check mode
    const mode = document.querySelector('input[name="importMode"]:checked').value;
    
    if (mode === 'replace') {
        if (!confirm('Are you sure you want to delete all existing data and replace it?')) return;
        notes = dataToImport;
    } else {
        // Merge - we just append or try to merge by ID? Prompt says "merge with existing", we will just append. If id exists we generate new? Or just keep? Better generate new to avoid collisions.
        dataToImport.forEach(n => {
            const newNote = { ...n, id: generateId() };
            notes.push(newNote);
        });
    }

    saveData(true);
    closeImportModal();
    renderSidebar();
    renderNotes();
}

// --------------------------------------------------------------------------
// Utilities
// --------------------------------------------------------------------------
let toastTimeout;
function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    if (type === 'error') {
        toastIcon.className = 'w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center text-sm mr-3';
        toastIcon.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    } else {
        toastIcon.className = 'w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-sm mr-3';
        toastIcon.innerHTML = '<i class="fa-solid fa-check"></i>';
    }
    
    toast.classList.remove('translate-y-24', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
    
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-24', 'opacity-0');
    }, 3000);
}

function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

// Global click to close dropdowns
document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('[id^="dropdown-"]').forEach(el => el.classList.add('hidden'));
    }
});

// Utility Actions
function switchVariant(event, noteId, index) {
    event.stopPropagation(); // prevent modal open
    
    // update buttons
    document.querySelectorAll(`.tab-btn-${noteId}`).forEach((btn, i) => {
        if(i === index) {
            btn.classList.add('bg-indigo-500/20', 'text-indigo-400', 'border-indigo-500/30');
            btn.classList.remove('bg-gray-800', 'text-gray-400', 'border-gray-700', 'hover:bg-gray-700', 'hover:text-gray-300');
        } else {
            btn.classList.remove('bg-indigo-500/20', 'text-indigo-400', 'border-indigo-500/30');
            btn.classList.add('bg-gray-800', 'text-gray-400', 'border-gray-700', 'hover:bg-gray-700', 'hover:text-gray-300');
        }
    });

    // update contents
    document.querySelectorAll(`.variant-content-${noteId}`).forEach((content, i) => {
        if (i === index) {
            content.classList.remove('hidden');
        } else {
            content.classList.add('hidden');
        }
    });
}

function copyVariantToClipboard(event, encodedText) {
    event.stopPropagation(); // prevent modal open
    const decoded = decodeURIComponent(encodedText);
    const btn = event.currentTarget;
    
    const triggerCopySuccess = () => {
        const icon = btn.querySelector('i');
        icon.className = 'fa-solid fa-check text-emerald-400';
        setTimeout(() => { icon.className = 'fa-regular fa-copy text-gray-400'; }, 2000);
        showToast('Copied to clipboard!', 'success');
    };

    const fallbackCopy = () => {
        const ta = document.createElement('textarea');
        ta.value = decoded;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            triggerCopySuccess();
        } catch (err) {
            showToast('Failed to copy', 'error');
        }
        document.body.removeChild(ta);
    };

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(decoded).then(() => {
            triggerCopySuccess();
        }).catch(() => fallbackCopy());
    } else {
        fallbackCopy();
    }
}

function toggleDropdown(event, noteId) {
    event.stopPropagation();
    // close all others
    document.querySelectorAll('[id^="dropdown-"]').forEach(el => {
        if(el.id !== `dropdown-${noteId}`) el.classList.add('hidden');
    });
    
    const dp = document.getElementById(`dropdown-${noteId}`);
    if (dp) dp.classList.toggle('hidden');
}

function deleteNoteQuick(event, noteId) {
    event.stopPropagation();
    document.querySelectorAll('[id^="dropdown-"]').forEach(el => el.classList.add('hidden'));
    
    if (confirm('Delete this note?')) {
        notes = notes.filter(n => n.id !== noteId);
        saveData(true);
        renderSidebar();
        renderNotes();
    }
}

function duplicateNote(event, noteId) {
    event.stopPropagation();
    document.querySelectorAll('[id^="dropdown-"]').forEach(el => el.classList.add('hidden'));
    
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    
    const duplicated = JSON.parse(JSON.stringify(note)); // Deep clone
    duplicated.id = generateId();
    duplicated.title = duplicated.title + ' (Copy)';
    duplicated.createdAt = Date.now();
    
    // Regenerate variant ids
    duplicated.variants.forEach(v => {
        v.id = generateId();
    });
    
    // Add right after the target in array if sorted by newest, or at the start
    notes.unshift(duplicated);
    
    saveData(true);
    renderSidebar();
    renderNotes();
}

// Boot
document.addEventListener('DOMContentLoaded', init);
