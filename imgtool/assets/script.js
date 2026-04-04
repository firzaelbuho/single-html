/* assets/script.js */

const app = {
  activeTab: 'resizer',
  currentRatio: 1,
  cropper: null,
  resizerImageFile: null,
  iconImageFile: null,
  batchFiles: [],
  iconSizes: [16, 32, 48, 64, 128, 256, 512],
  
  init() {
    this.setupUI();
    this.setupResizer();
    this.setupIconGenerator();
    this.setupConverter();
    this.renderIconSizes();
  },

  setupUI() {
    // Sidebar toggles
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobile-overlay');
    const openBtn = document.getElementById('open-sidebar');
    const closeBtn = document.getElementById('close-sidebar');

    const toggleMenu = () => {
      sidebar.classList.toggle('-translate-x-full');
      overlay.classList.toggle('hidden');
      setTimeout(() => overlay.classList.toggle('opacity-0'), 10);
    };

    openBtn.addEventListener('click', toggleMenu);
    closeBtn.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', toggleMenu);
  },

  switchTab(tab) {
    this.activeTab = tab;
    
    // Update active nav button
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('bg-indigo-500/10', 'text-indigo-400');
      btn.classList.add('text-slate-400', 'hover:bg-slate-700/50', 'hover:text-white');
    });
    
    const activeBtn = document.getElementById(`tab-${tab}`);
    activeBtn.classList.remove('text-slate-400', 'hover:bg-slate-700/50', 'hover:text-white');
    activeBtn.classList.add('bg-indigo-500/10', 'text-indigo-400');

    // Update Header
    let title = 'IMG Resizer';
    if (tab === 'icon') title = 'Icon Generator';
    else if (tab === 'converter') title = 'Batch Converter';
    document.getElementById('mobile-header-title').innerText = title;

    // Show/Hide Sections
    document.getElementById('section-resizer').classList.add('hidden');
    document.getElementById('section-icon').classList.add('hidden');
    document.getElementById('section-converter').classList.add('hidden');
    
    const activeSection = document.getElementById(`section-${tab}`);
    activeSection.classList.remove('hidden');
    activeSection.classList.add('animate-fade-in');
    
    // Close sidebar on mobile
    if (window.innerWidth < 1024) {
      document.getElementById('sidebar').classList.add('-translate-x-full');
      document.getElementById('mobile-overlay').classList.add('hidden', 'opacity-0');
    }
  },

  setupResizer() {
    const uploadInput = document.getElementById('resizer-upload');
    const imageElement = document.getElementById('cropper-image');
    const emptyState = document.getElementById('resizer-empty-state');
    const cropperContainer = document.getElementById('cropper-container');
    const ratioBtns = document.querySelectorAll('.ratio-btn');
    const exportBtn = document.getElementById('resizer-export');
    
    uploadInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      this.resizerImageFile = file;
      const url = URL.createObjectURL(file);
      
      imageElement.src = url;
      imageElement.classList.remove('hidden');
      emptyState.classList.add('hidden');
      cropperContainer.classList.remove('hidden');
      document.getElementById('resizer-center-controls').classList.remove('hidden');
      
      // Init or replace cropper
      if (this.cropper) {
        this.cropper.replace(url);
      } else {
        this.cropper = new Cropper(imageElement, {
          aspectRatio: 1, // Default to 1:1
          viewMode: 1,
          dragMode: 'move',
          autoCropArea: 0.8,
          restore: false,
          guides: true,
          center: true,
          highlight: false,
          cropBoxMovable: true,
          cropBoxResizable: true,
          toggleDragModeOnDblclick: false,
        });
      }
      exportBtn.disabled = false;
    });

    const widthInput = document.getElementById('resizer-width');
    const heightInput = document.getElementById('resizer-height');

    // Ratio buttons
    ratioBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        // Reset all buttons style
        ratioBtns.forEach(b => {
          b.classList.remove('bg-indigo-500/20', 'text-indigo-400', 'border-indigo-500');
          b.classList.add('text-slate-300', 'hover:bg-slate-700', 'border-slate-700', 'bg-slate-800');
        });
        // Set active style
        btn.classList.add('bg-indigo-500/20', 'text-indigo-400', 'border-indigo-500');
        btn.classList.remove('text-slate-300', 'hover:bg-slate-700', 'border-slate-700', 'bg-slate-800');
        
        const ratio = parseFloat(btn.dataset.ratio);
        this.currentRatio = isNaN(ratio) ? NaN : ratio;

        if (this.cropper) {
          this.cropper.setAspectRatio(this.currentRatio);
        }

        // Auto update height if width has value
        if (!isNaN(this.currentRatio)) {
          const w = parseFloat(widthInput.value);
          if (!isNaN(w) && w > 0) {
              heightInput.value = Math.round(w / this.currentRatio);
          }
        }
      });
    });

    widthInput.addEventListener('input', (e) => {
      if (!isNaN(this.currentRatio)) {
        const w = parseFloat(e.target.value);
        if (!isNaN(w) && w > 0) {
          heightInput.value = Math.round(w / this.currentRatio);
        } else {
          heightInput.value = '';
        }
      }
    });

    heightInput.addEventListener('input', (e) => {
      if (!isNaN(this.currentRatio)) {
        const h = parseFloat(e.target.value);
        if (!isNaN(h) && h > 0) {
          widthInput.value = Math.round(h * this.currentRatio);
        } else {
          widthInput.value = '';
        }
      }
    });

    // Export Action
    exportBtn.disabled = true;
    exportBtn.addEventListener('click', () => this.exportResize());
  },

  centerImage(mode) {
    if (!this.cropper) return;
    const container = this.cropper.getContainerData();
    const canvas = this.cropper.getCanvasData();
    let updates = {};

    if (mode === 'horizontal' || mode === 'both') {
      updates.left = (container.width - canvas.width) / 2;
    }
    if (mode === 'vertical' || mode === 'both') {
      updates.top = (container.height - canvas.height) / 2;
    }

    this.cropper.setCanvasData(updates);
  },

  exportResize() {
    if (!this.cropper) return;
    
    const widthInput = document.getElementById('resizer-width');
    const heightInput = document.getElementById('resizer-height');
    const formatSelect = document.getElementById('resizer-format');
    
    const targetWidth = parseInt(widthInput.value, 10);
    const targetHeight = parseInt(heightInput.value, 10);
    const mimeType = formatSelect.value;
    
    // Get cropped canvas
    let options = {};
    if (!isNaN(targetWidth) && targetWidth > 0) options.width = targetWidth;
    if (!isNaN(targetHeight) && targetHeight > 0) options.height = targetHeight;
    // Cropper automatically scales to fit target width/height if specified
    
    const canvas = this.cropper.getCroppedCanvas(options);
    
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const ext = mimeType.split('/')[1];
      const a = document.createElement('a');
      a.href = url;
      a.download = `resized_${Date.now()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, mimeType, 0.9);
  },

  setupIconGenerator() {
    const uploadInput = document.getElementById('icon-upload');
    const emptyState = document.getElementById('icon-empty-state');
    const previewContainer = document.getElementById('icon-preview-container');
    const imgElement = document.getElementById('icon-image');
    const sizeInfo = document.getElementById('icon-original-size');
    const addBtn = document.getElementById('add-custom-size');
    const customInput = document.getElementById('icon-custom-size');
    const generateBtn = document.getElementById('icon-generate');
    
    generateBtn.disabled = true;

    uploadInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      this.iconImageFile = file;
      
      const url = URL.createObjectURL(file);
      
      imgElement.onload = () => {
        sizeInfo.innerText = `Original Size: ${imgElement.naturalWidth} x ${imgElement.naturalHeight}`;
        generateBtn.disabled = false;
      };
      
      imgElement.src = url;
      
      emptyState.classList.add('hidden');
      previewContainer.classList.remove('hidden');
    });

    addBtn.addEventListener('click', () => {
      const val = parseInt(customInput.value, 10);
      if (!isNaN(val) && val > 0) {
        if (!this.iconSizes.includes(val)) {
          this.iconSizes.push(val);
          this.iconSizes.sort((a,b) => a - b);
          this.renderIconSizes();
        }
        customInput.value = '';
      }
    });

    generateBtn.addEventListener('click', () => this.generateIcons());
  },

  renderIconSizes() {
    const list = document.getElementById('icon-sizes-list');
    list.innerHTML = ''; // clear
    
    this.iconSizes.forEach(size => {
      const label = document.createElement('label');
      label.className = 'checkbox-item';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = size;
      checkbox.checked = true; // default checked
      
      const span = document.createElement('span');
      span.innerText = `${size}x${size}`;
      
      label.appendChild(checkbox);
      label.appendChild(span);
      list.appendChild(label);
    });
  },

  async generateIcons() {
    if (!this.iconImageFile) return;
    
    const checkboxes = document.querySelectorAll('#icon-sizes-list input[type="checkbox"]:checked');
    const selectedSizes = Array.from(checkboxes).map(cb => parseInt(cb.value, 10));
    
    if (selectedSizes.length === 0) {
      alert("Please select at least one size.");
      return;
    }

    const generateBtn = document.getElementById('icon-generate');
    const progressContainer = document.getElementById('icon-progress');
    const progressBar = document.getElementById('icon-progress-bar');
    
    generateBtn.disabled = true;
    progressContainer.classList.remove('hidden');
    progressBar.style.width = '0%';
    
    const zip = new JSZip();
    const sourceImg = document.getElementById('icon-image');
    
    // We create an offscreen canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    for (let i = 0; i < selectedSizes.length; i++) {
       const size = selectedSizes[i];
       canvas.width = size;
       canvas.height = size;
       
       // Draw image, scaling it to cover the square
       // Assuming user uploaded a square as instructed, we simply stretch/fit.
       ctx.clearRect(0, 0, size, size);
       ctx.drawImage(sourceImg, 0, 0, size, size);
       
       const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
       zip.file(`icon_${size}x${size}.png`, blob);
       
       // Update progress (visual only, it's fast)
       progressBar.style.width = `${((i+1) / selectedSizes.length) * 100}%`;
    }
    
    progressBar.style.width = '100%';
    
    // Generate ZIP
    const content = await zip.generateAsync({type: 'blob'});
    
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `icons_${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    generateBtn.disabled = false;
    setTimeout(() => {
        progressContainer.classList.add('hidden');
        progressBar.style.width = '0%';
    }, 1000);
  },

  setupConverter() {
    const uploadInput = document.getElementById('converter-upload');
    const emptyState = document.getElementById('converter-empty-state');
    const fileList = document.getElementById('converter-file-list');
    const generateBtn = document.getElementById('converter-generate');
    
    uploadInput.addEventListener('change', (e) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      
      this.batchFiles = Array.from(files);
      
      emptyState.parentElement.classList.add('hidden');
      fileList.classList.remove('hidden');
      
      this.renderBatchFiles();
      generateBtn.disabled = this.batchFiles.length === 0;
    });

    generateBtn.addEventListener('click', () => this.generateBatch());
  },

  renderBatchFiles() {
    const list = document.getElementById('converter-file-list');
    list.innerHTML = '';
    
    this.batchFiles.forEach((file, index) => {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const row = document.createElement('div');
      row.className = 'flex items-center justify-between p-3 bg-slate-800 border border-slate-700 rounded-lg';
      row.innerHTML = `
        <div class="flex items-center gap-3 overflow-hidden">
           <i class="ph ph-file-image text-slate-400 text-xl"></i>
           <div class="truncate">
             <p class="text-sm text-slate-200 font-medium truncate">${file.name}</p>
             <p class="text-xs text-slate-500">${sizeMB} MB</p>
           </div>
        </div>
        <div class="flex items-center gap-2">
           <span id="batch-status-${index}" class="text-xs font-semibold px-2 py-1 rounded-md bg-slate-700 text-slate-400">Pending</span>
        </div>
      `;
      list.appendChild(row);
    });
  },

  async generateBatch() {
    if (this.batchFiles.length === 0) return;
    
    const generateBtn = document.getElementById('converter-generate');
    const formatSelect = document.getElementById('converter-format').value;
    const progressContainer = document.getElementById('converter-progress');
    const progressBar = document.getElementById('converter-progress-bar');
    
    generateBtn.disabled = true;
    progressContainer.classList.remove('hidden');
    progressBar.style.width = '0%';
    
    const zip = new JSZip();
    const ext = formatSelect.split('/')[1];

    for (let i = 0; i < this.batchFiles.length; i++) {
        const file = this.batchFiles[i];
        const statusBadge = document.getElementById(`batch-status-${i}`);
        
        statusBadge.className = 'text-xs font-semibold px-2 py-1 rounded-md bg-indigo-500/20 text-indigo-400 whitespace-nowrap';
        statusBadge.innerText = 'Converting...';

        try {
            const blob = await this.convertImage(file, formatSelect);
            
            // Generate new name
            const origName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
            zip.file(`${origName}.${ext}`, blob);

            statusBadge.className = 'text-xs font-semibold px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-400 whitespace-nowrap';
            statusBadge.innerText = 'Done';
        } catch(e) {
            statusBadge.className = 'text-xs font-semibold px-2 py-1 rounded-md bg-red-500/20 text-red-400 whitespace-nowrap';
            statusBadge.innerText = 'Failed';
        }

        progressBar.style.width = `${((i+1) / this.batchFiles.length) * 100}%`;
    }

    progressBar.style.width = '100%';
    
    const content = await zip.generateAsync({type: 'blob'});
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted_${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    generateBtn.disabled = false;
    setTimeout(() => {
        progressContainer.classList.add('hidden');
        progressBar.style.width = '0%';
    }, 2000);
  },

  convertImage(file, mimeType) {
      return new Promise((resolve, reject) => {
          const img = new Image();
          const url = URL.createObjectURL(file);
          img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = img.naturalWidth;
              canvas.height = img.naturalHeight;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0);
              canvas.toBlob((blob) => {
                  URL.revokeObjectURL(url);
                  if (blob) resolve(blob);
                  else reject(new Error('Canvas toBlob failed'));
              }, mimeType, 0.9);
          };
          img.onerror = () => {
              URL.revokeObjectURL(url);
              reject(new Error('Image load failed'));
          };
          img.src = url;
      });
  }
};

window.addEventListener('DOMContentLoaded', () => {
  app.init();
});
