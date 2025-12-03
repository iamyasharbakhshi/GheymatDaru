// script.js

// --- Utility Functions ---
function getQueryParams(url) {
    const params = {};
    if (!url) return params;
    try {
        const queryString = typeof url === 'string' ? url.split('?')[1] : null;
        if (!queryString && !(url instanceof URLSearchParams)) return params;
        
        const urlParams = typeof url === 'string' ? new URLSearchParams(queryString) : url;
        for (const [key, value] of urlParams) { 
            params[key] = value; 
        }
    } catch(e) { console.error("Error parsing query:", e); }
    return params;
}

function addCommas(nStr) {
    nStr = String(nStr);
    const x = nStr.split('.');
    let x1 = x[0];
    const x2 = x.length > 1 ? '.' + x[1] : '';
    const rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) { x1 = x1.replace(rgx, '$1,$2'); }
    return x1 + x2;
}

function toPersianDigits(str) {
    if (!str) return '';
    return str.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
}

// --- Robust Translation Function ---
function translatePackaging(text) {
    if (!text) return '';

    // 1. Normalize: Uppercase, replace non-breaking spaces with normal spaces
    let translated = text.toUpperCase().replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();

    // 2. Dictionary: Ordered by Length (Longest First) to prevent partial replacements
    const dict = [
        { en: 'WITH APPLICATOR', fa: 'همراه با اپلیکاتور' },
        { en: 'BLISTER PACK', fa: 'بلیستر' }, // Simplified for better fit
        { en: 'SUPPOSITORY', fa: 'شیاف' },
        { en: 'SUSPENSION', fa: 'سوسپانسیون' },
        { en: 'CARTRIDGE', fa: 'کارتریج' },
        { en: 'SOLUTION', fa: 'محلول' },
        { en: 'OINTMENT', fa: 'پماد' },
        { en: 'CAPSULE', fa: 'کپسول' },
        { en: 'INHALER', fa: 'اسپری تنفسی' },
        { en: 'PACKAGE', fa: 'بسته' },
        { en: 'AMPULE', fa: 'آمپول' },
        { en: 'TABLET', fa: 'قرص' },
        { en: 'SACHET', fa: 'ساشه' },
        { en: 'BOTTLE', fa: 'بطری' },
        { en: 'CARTON', fa: 'کارتن' },
        { en: 'CREAM', fa: 'کرم' },
        { en: 'SPRAY', fa: 'اسپری' },
        { en: 'PACK', fa: 'بسته' }, // Will only match if BLISTER PACK/PACKAGE didn't match
        { en: 'DROP', fa: 'قطره' },
        { en: 'TUBE', fa: 'تیوپ' },
        { en: 'VIAL', fa: 'ویال' },
        { en: 'BOX', fa: 'جعبه' },
        { en: 'PEN', fa: 'قلم' },
        { en: 'GEL', fa: 'ژل' },
        { en: ' IN ', fa: ' در ' }, // Spaces important
        { en: ' OF ', fa: ' از ' },
        { en: ',', fa: '،' }
    ];

    dict.forEach(item => {
        // Escape special regex characters if any
        const safeKey = item.en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(safeKey, 'gi');
        translated = translated.replace(regex, item.fa);
    });

    // 3. Final cleanup and digit conversion
    return toPersianDigits(translated);
}

async function copyTextToClipboard(text, buttonElement) {
    try {
        await navigator.clipboard.writeText(text);
        if(buttonElement){
            const icon = buttonElement.querySelector('i') || buttonElement;
            const originalClass = icon.className;
            icon.className = "fas fa-check text-green-500 scale-110 transition-transform";
            setTimeout(() => {
                icon.className = originalClass;
            }, 1500);
        }
    } catch (err) {
        console.error('Failed to copy', err);
    }
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// --- Image Modal Module ---
const ImageModal = {
    overlay: null,
    panel: null,
    zoomedImage: null,
    spinner: null,
    caption: null,
    closeBtn: null,
    miniMap: null,
    
    currentImages: [],
    currentIndex: 0,
    
    init() {
        this.overlay = document.getElementById('modalOverlay');
        this.backdrop = document.getElementById('modalBackdrop');
        this.panel = document.getElementById('modalPanel');
        this.zoomedImage = document.getElementById('zoomedImage');
        this.spinner = document.getElementById('modalLoadingSpinner');
        this.caption = document.getElementById('modalCaption');
        this.closeBtn = document.getElementById('closeImageModalButton');
        this.miniMap = document.getElementById('modalMiniMap');
        this.prevBtn = document.getElementById('prevImageButton');
        this.nextBtn = document.getElementById('nextImageButton');

        if (!this.overlay) return;

        const closeHandler = () => this.hide();
        this.closeBtn?.addEventListener('click', closeHandler);
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay || e.target === this.backdrop) closeHandler();
        });

        this.prevBtn?.addEventListener('click', (e) => { e.stopPropagation(); this.nav(-1); });
        this.nextBtn?.addEventListener('click', (e) => { e.stopPropagation(); this.nav(1); });

        document.addEventListener('keydown', (e) => {
            if (this.overlay.classList.contains('hidden')) return;
            if (e.key === 'Escape') this.hide();
            if (e.key === 'ArrowLeft') this.nav(-1);
            if (e.key === 'ArrowRight') this.nav(1);
        });
    },

    show(images, thumbnails, title, index = 0) {
        this.currentImages = images;
        this.currentIndex = index;
        this.title = title;

        this.overlay.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');

        requestAnimationFrame(() => {
            this.backdrop.classList.remove('opacity-0');
            this.panel.classList.remove('opacity-0', 'scale-95');
            this.panel.classList.add('opacity-100', 'scale-100');
        });

        this.loadImage();
        this.renderMiniMap(thumbnails);
    },

    hide() {
        this.backdrop.classList.add('opacity-0');
        this.panel.classList.remove('opacity-100', 'scale-100');
        this.panel.classList.add('opacity-0', 'scale-95');

        setTimeout(() => {
            this.overlay.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
            this.zoomedImage.src = '';
        }, 300);
    },

    loadImage() {
        if (!this.currentImages.length) return;
        
        const url = this.currentImages[this.currentIndex];
        this.spinner.style.display = 'flex';
        this.zoomedImage.style.opacity = '0.5';

        const img = new Image();
        img.onload = () => {
            this.zoomedImage.src = url;
            this.zoomedImage.style.opacity = '1';
            this.spinner.style.display = 'none';
            this.updateCaption();
            this.updateNavButtons();
            this.highlightMiniMap();
        };
        img.onerror = () => {
            this.spinner.style.display = 'none';
            this.caption.textContent = 'خطا در بارگذاری تصویر';
        };
        img.src = url;
    },

    nav(direction) {
        if (this.currentImages.length <= 1) return;
        this.currentIndex = (this.currentIndex + direction + this.currentImages.length) % this.currentImages.length;
        this.loadImage();
    },

    updateCaption() {
        this.caption.textContent = `${this.title} (${this.currentIndex + 1} از ${this.currentImages.length})`;
    },

    updateNavButtons() {
        const show = this.currentImages.length > 1;
        if(this.prevBtn) this.prevBtn.style.display = show ? 'flex' : 'none';
        if(this.nextBtn) this.nextBtn.style.display = show ? 'flex' : 'none';
    },

    renderMiniMap(thumbnails) {
        if (!this.miniMap || !thumbnails || thumbnails.length <= 1) {
            this.miniMap.classList.add('hidden');
            return;
        }
        this.miniMap.classList.remove('hidden');
        this.miniMap.innerHTML = thumbnails.map((src, i) => `
            <img src="${src}" data-idx="${i}" 
                 class="h-12 w-12 object-cover rounded-md cursor-pointer border-2 transition-all ${i === this.currentIndex ? 'border-primary-500 scale-110' : 'border-transparent opacity-70 hover:opacity-100'}" 
                 onclick="ImageModal.jump(${i})">
        `).join('');
    },

    jump(index) {
        this.currentIndex = index;
        this.loadImage();
    },
    
    highlightMiniMap() {
        if(!this.miniMap) return;
        const thumbs = this.miniMap.querySelectorAll('img');
        thumbs.forEach((t, i) => {
            if (i === this.currentIndex) {
                t.classList.add('border-primary-500', 'scale-110');
                t.classList.remove('border-transparent', 'opacity-70');
                t.scrollIntoView({ behavior: 'smooth', inline: 'center' });
            } else {
                t.classList.remove('border-primary-500', 'scale-110');
                t.classList.add('border-transparent', 'opacity-70');
            }
        });
    }
};

// --- Search Application ---
const SearchApp = {
    baseUrl: 'https://irc.fda.gov.ir',
    endpoints: { search: '/nfi/Search' },
    storageKeys: { history: 'drugHistory_v2', theme: 'drugTheme' },
    
    elements: {},
    
    state: {
        results: [],
        currentSort: 'none',
        currentFilter: 'all'
    },

    init() {
        this.elements = {
            form: document.querySelector('form'),
            input: document.getElementById('Term'),
            clearBtn: document.getElementById('clearSearchInput'),
            resultsArea: document.getElementById('simulationResult'),
            initialMsg: document.getElementById('initialMessage'),
            skeleton: document.getElementById('loadingSkeleton'),
            historyContainer: document.getElementById('searchHistory'),
            historyList: document.getElementById('searchHistoryList'),
        };

        ImageModal.init();
        this.loadHistory();
        this.bindEvents();
        
        const params = getQueryParams(window.location.search);
        if (params.Term) {
            this.elements.input.value = decodeURIComponent(params.Term);
            this.handleInputState();
            this.performSearch(params.Term, params.PageNumber || 1);
        }
    },

    bindEvents() {
        this.elements.form.addEventListener('submit', (e) => {
            e.preventDefault();
            const term = this.elements.input.value.trim();
            if (term) {
                this.addToHistory(term);
                this.performSearch(term);
            }
        });

        this.elements.input.addEventListener('input', () => this.handleInputState());
        
        this.elements.clearBtn.addEventListener('click', () => {
            this.elements.input.value = '';
            this.elements.input.focus();
            this.handleInputState();
            this.resetView();
        });

        this.elements.historyList.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (btn) {
                const term = btn.dataset.term;
                this.elements.input.value = term;
                this.handleInputState();
                this.performSearch(term);
            }
        });

        this.elements.resultsArea.addEventListener('click', (e) => this.handleResultClick(e));
        
        this.elements.resultsArea.addEventListener('change', (e) => {
            if (e.target.id === 'sortSelect') {
                this.state.currentSort = e.target.value;
                this.renderResultsGrid();
            } else if (e.target.id === 'filterSelect') {
                this.state.currentFilter = e.target.value;
                this.renderResultsGrid();
            }
        });
        
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.term) {
                this.elements.input.value = e.state.term;
                this.performSearch(e.state.term, e.state.page);
            } else {
                this.resetView();
            }
        });
    },

    handleInputState() {
        const val = this.elements.input.value;
        if (val.length > 0) this.elements.clearBtn.classList.remove('hidden');
        else this.elements.clearBtn.classList.add('hidden');
        
        const isRTL = /[\u0600-\u06FF]/.test(val);
        this.elements.input.dir = isRTL || !val ? 'rtl' : 'ltr';
    },

    resetView() {
        this.elements.initialMsg.classList.remove('hidden');
        this.elements.skeleton.classList.add('hidden');
        // Clear all dynamic containers
        const containers = ['resultsControls', 'resultsGrid', 'resultsPagination'];
        containers.forEach(id => {
            const el = document.getElementById(id);
            if(el) el.remove();
        });
    },

    setupResultContainers() {
        // Ensure the order is always Controls -> Grid -> Pagination
        this.elements.resultsArea.innerHTML = '';
        
        const controls = document.createElement('div');
        controls.id = 'resultsControls';
        
        const grid = document.createElement('div');
        grid.id = 'resultsGrid';
        grid.className = 'grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in';
        
        const pagination = document.createElement('div');
        pagination.id = 'resultsPagination';
        
        this.elements.resultsArea.appendChild(controls);
        this.elements.resultsArea.appendChild(grid);
        this.elements.resultsArea.appendChild(pagination);
    },

    async performSearch(term, page = 1) {
        this.elements.initialMsg.classList.add('hidden');
        
        // Remove old view logic
        this.resetView(); 
        
        this.elements.skeleton.classList.remove('hidden');
        this.elements.skeleton.classList.add('grid');

        const newUrl = `?Term=${encodeURIComponent(term)}&PageNumber=${page}`;
        window.history.pushState({ term, page }, '', newUrl);

        try {
            const fetchUrl = `${this.baseUrl}${this.endpoints.search}?Term=${encodeURIComponent(term)}&PageNumber=${page}&PageSize=12`;
            const response = await fetch(fetchUrl);
            if (!response.ok) throw new Error('Network response was not ok');
            
            const html = await response.text();
            this.parseAndRender(html, term, page);

        } catch (error) {
            console.error(error);
            this.elements.skeleton.classList.add('hidden');
            this.elements.resultsArea.innerHTML += `
                <div class="glass-panel bg-red-50/50 dark:bg-red-900/20 border-red-200 p-6 rounded-2xl text-center text-red-600 animate-fade-in mt-4">
                    <i class="fas fa-wifi text-4xl mb-3"></i>
                    <p>خطا در برقراری ارتباط. لطفا اینترنت خود را بررسی کنید.</p>
                </div>`;
        }
    },

    parseAndRender(html, term, currentPage) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const rows = doc.querySelectorAll('.RowSearchSty');
        
        this.elements.skeleton.classList.add('hidden');
        this.elements.skeleton.classList.remove('grid');

        if (rows.length === 0) {
            this.renderEmptyState(doc);
            return;
        }

        this.setupResultContainers();

        this.state.results = Array.from(rows).map((row, idx) => {
            const data = {
                id: idx,
                titleFa: row.querySelector('.titleSearch-Link-RtlAlter a')?.textContent.trim() || '',
                titleEn: row.querySelector('.titleSearch-Link-ltrAlter a')?.textContent.trim().replace(/[()]/g, '') || '',
                img: row.querySelector('.BoxImgSearch img')?.src ? this.baseUrl + row.querySelector('.BoxImgSearch img').getAttribute('src') : null,
                detailUrl: this.baseUrl + (row.querySelector('.titleSearch-Link-RtlAlter a')?.getAttribute('href') || ''),
                details: {}
            };

            row.querySelectorAll('.searchRow .col-lg-4, .searchRow .col-md-4').forEach(col => {
                const label = col.querySelector('label')?.textContent.trim();
                const val = col.querySelector('span, bdo')?.textContent.trim();
                
                if (label && val) {
                    if (label.includes('قیمت')) data.price = parseInt(val.replace(/,/g, '')) || 0;
                    if (label.includes('برند')) data.owner = val;
                    if (label.includes('کد ژنریک')) data.genericCode = val;
                    if (label.includes('فرآورده')) data.productCode = val;
                    // Apply translation logic here
                    if (label.includes('بسته')) data.packaging = translatePackaging(val);
                    if (label.includes('پروانه')) data.licenseHolder = val;
                }
            });
            return data;
        });

        this.renderControls();
        this.renderResultsGrid();
        this.renderPagination(doc.querySelector('.pagination'), currentPage, term);
    },

    renderControls() {
        const owners = [...new Set(this.state.results.map(r => r.owner).filter(Boolean))].sort();
        const container = document.getElementById('resultsControls');
        
        container.innerHTML = `
            <div class="glass-panel bg-white/50 dark:bg-gray-800/50 p-4 rounded-2xl mb-6 flex flex-col sm:flex-row gap-4 animate-fade-in">
                <div class="flex-1">
                    <label class="text-xs text-gray-500 mb-1 block px-1">مرتب‌سازی</label>
                    <div class="relative">
                        <select id="sortSelect" class="w-full appearance-none bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 outline-none text-sm transition-shadow">
                            <option value="none">پیش‌فرض</option>
                            <option value="priceAsc">ارزان‌ترین</option>
                            <option value="priceDesc">گران‌ترین</option>
                            <option value="alpha">الفبا</option>
                        </select>
                        <i class="fas fa-chevron-down absolute left-3 top-3 text-gray-400 text-xs pointer-events-none"></i>
                    </div>
                </div>
                <div class="flex-1">
                    <label class="text-xs text-gray-500 mb-1 block px-1">فیلتر صاحب برند</label>
                    <div class="relative">
                        <select id="filterSelect" class="w-full appearance-none bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 outline-none text-sm transition-shadow">
                            <option value="all">همه موارد</option>
                            ${owners.map(o => `<option value="${o}">${o}</option>`).join('')}
                        </select>
                        <i class="fas fa-filter absolute left-3 top-3 text-gray-400 text-xs pointer-events-none"></i>
                    </div>
                </div>
            </div>
        `;
        
        if(this.state.currentSort !== 'none') document.getElementById('sortSelect').value = this.state.currentSort;
        if(this.state.currentFilter !== 'all') document.getElementById('filterSelect').value = this.state.currentFilter;
    },

    renderResultsGrid() {
        const grid = document.getElementById('resultsGrid');
        if (!grid) return;

        grid.innerHTML = '';

        let displayData = [...this.state.results];
        
        if (this.state.currentFilter !== 'all') {
            displayData = displayData.filter(d => d.owner === this.state.currentFilter);
        }

        if (this.state.currentSort === 'priceAsc') displayData.sort((a, b) => a.price - b.price);
        if (this.state.currentSort === 'priceDesc') displayData.sort((a, b) => b.price - a.price);
        if (this.state.currentSort === 'alpha') displayData.sort((a, b) => a.titleFa.localeCompare(b.titleFa));

        if (displayData.length === 0) {
            grid.innerHTML = '<div class="col-span-full text-center py-10 text-gray-500">موردی با این فیلتر یافت نشد.</div>';
        } else {
            const frag = document.createDocumentFragment();
            
            displayData.forEach(item => {
                const priceFormatted = item.price ? addCommas(toPersianDigits(item.price)) : 'نامشخص';
                const hasImage = !!item.img;
                
                const card = document.createElement('div');
                card.className = "glass-panel bg-white/60 dark:bg-gray-800/60 rounded-2xl p-5 hover:transform hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-xl dark:shadow-none relative group flex flex-col h-full";
                card.innerHTML = `
                    <div class="flex items-start justify-between mb-4">
                        <span class="bg-blue-100 dark:bg-blue-900/50 text-primary-700 dark:text-blue-300 px-3 py-1 rounded-lg text-xs font-bold truncate max-w-[70%]">
                            ${item.owner || 'برند نامشخص'}
                        </span>
                        ${item.productCode ? `
                        <button class="copy-btn text-gray-400 hover:text-primary-500 transition-colors" data-copy="${item.productCode}" title="کپی کد فرآورده: ${item.productCode}">
                            <i class="far fa-copy"></i>
                        </button>` : ''}
                    </div>

                    <div class="flex gap-4 mb-4">
                        <div class="w-24 h-24 flex-shrink-0 bg-white dark:bg-gray-700 rounded-xl p-1 shadow-sm flex items-center justify-center cursor-pointer image-trigger" data-url="${item.detailUrl}" data-title="${item.titleFa}">
                            ${hasImage 
                                ? `<img src="${item.img}" class="w-full h-full object-contain hover:scale-105 transition-transform" loading="lazy" alt="${item.titleFa}">`
                                : `<i class="fas fa-image text-3xl text-gray-300 dark:text-gray-600"></i>`
                            }
                        </div>
                        
                        <div class="flex-1 min-w-0 flex flex-col justify-center">
                            <h3 class="font-bold text-gray-800 dark:text-white mb-1 line-clamp-2 leading-tight">${item.titleFa}</h3>
                            <p class="text-xs text-gray-500 dark:text-gray-400 font-sans dir-ltr truncate mb-2">${item.titleEn}</p>
                            
                            <div class="space-y-1 border-r-2 border-gray-200 dark:border-gray-600 pr-2 mr-1">
                                ${item.packaging ? `
                                    <p class="text-xs text-gray-600 dark:text-gray-400 truncate" title="${item.packaging}">
                                        <i class="fas fa-box-open ml-1 text-primary-500/70"></i>${item.packaging}
                                    </p>` : ''}
                                ${item.licenseHolder ? `
                                    <p class="text-xs text-gray-600 dark:text-gray-400 truncate" title="${item.licenseHolder}">
                                        <i class="fas fa-certificate ml-1 text-primary-500/70"></i>${item.licenseHolder}
                                    </p>` : ''}
                            </div>
                        </div>
                    </div>

                    ${item.genericCode ? `
                    <div class="mb-4 text-xs">
                         <span class="inline-flex items-center bg-gray-100 dark:bg-gray-700/50 px-2 py-1 rounded text-gray-600 dark:text-gray-400">
                            <span class="opacity-50 ml-1">کد ژنریک:</span> ${toPersianDigits(item.genericCode)}
                         </span>
                    </div>` : ''}

                    <div class="mt-auto pt-4 border-t border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between">
                        <div class="flex flex-col">
                            <span class="text-xs text-gray-500">قیمت مصرف کننده</span>
                            <span class="text-lg font-bold text-primary-600 dark:text-primary-400">
                                ${priceFormatted} <span class="text-xs font-normal text-gray-500">ریال</span>
                            </span>
                        </div>
                        <a href="${item.detailUrl}" target="_blank" class="w-10 h-10 rounded-xl bg-primary-50 dark:bg-gray-700 text-primary-600 dark:text-gray-200 flex items-center justify-center hover:bg-primary-600 hover:text-white transition-all shadow-sm hover:shadow-primary-500/30">
                            <i class="fas fa-arrow-left"></i>
                        </a>
                    </div>
                `;
                frag.appendChild(card);
            });
            grid.appendChild(frag);
        }
    },

    renderPagination(originalNav, currentPage, term) {
        if (!originalNav) return;
        const container = document.getElementById('resultsPagination');
        
        const nav = document.createElement('nav');
        nav.className = 'pagination-nav mt-10 flex justify-center';
        
        const ul = document.createElement('ul');
        ul.className = 'flex flex-wrap gap-2 justify-center items-center p-2 bg-white/50 dark:bg-gray-800/50 rounded-2xl glass-panel';

        originalNav.querySelectorAll('li a').forEach(link => {
            const href = link.getAttribute('href');
            if (!href) return;
            
            const params = getQueryParams(href);
            const pageNum = parseInt(params.PageNumber) || 1;
            const text = link.textContent.trim();
            const isActive = pageNum == currentPage;

            let content = text;
            if (text === '>>') content = '<i class="fas fa-angle-double-right"></i>';
            if (text === '<<') content = '<i class="fas fa-angle-double-left"></i>';
            if (text === '>') content = '<i class="fas fa-angle-right"></i>';
            if (text === '<') content = '<i class="fas fa-angle-left"></i>';
            
            if (/^\d+$/.test(content)) content = toPersianDigits(content);

            const li = document.createElement('li');
            const btn = document.createElement('button');
            
            btn.className = `w-10 h-10 flex items-center justify-center rounded-xl text-sm transition-all ${
                isActive 
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/40 font-bold scale-110' 
                : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`;
            btn.innerHTML = content;
            
            btn.addEventListener('click', () => {
                this.performSearch(term, pageNum);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });

            li.appendChild(btn);
            ul.appendChild(li);
        });

        nav.appendChild(ul);
        container.innerHTML = '';
        container.appendChild(nav);
    },

    renderEmptyState(doc) {
        const suggestions = Array.from(doc.querySelectorAll('.titleNotFind a')).map(a => {
            return { text: a.textContent.trim(), term: getQueryParams(a.href).term };
        });

        const html = `
            <div class="glass-panel flex flex-col items-center justify-center py-16 px-4 text-center rounded-3xl animate-fade-in">
                <div class="bg-orange-100 dark:bg-orange-900/30 p-6 rounded-full mb-6">
                    <i class="fas fa-search-minus text-4xl text-orange-500"></i>
                </div>
                <h3 class="text-xl font-bold mb-2">نتیجه‌ای یافت نشد</h3>
                <p class="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                    دارویی با این نام پیدا نشد. لطفا املا را بررسی کنید یا از کلمات کلیدی کوتاه‌تر استفاده کنید.
                </p>
                ${suggestions.length ? `
                    <div class="flex flex-wrap gap-2 justify-center">
                        <span class="w-full text-sm text-gray-400 mb-2">پیشنهادات:</span>
                        ${suggestions.map(s => `
                            <button class="suggestion-btn px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full text-sm hover:border-primary-500 hover:text-primary-500 transition-colors shadow-sm" data-term="${s.text}">
                                ${s.text}
                            </button>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
        this.elements.resultsArea.innerHTML = html;

        this.elements.resultsArea.querySelectorAll('.suggestion-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const t = btn.dataset.term;
                this.elements.input.value = t;
                this.performSearch(t);
            });
        });
    },

    async handleResultClick(e) {
        const imgTrigger = e.target.closest('.image-trigger');
        if (imgTrigger) {
            const detailUrl = imgTrigger.dataset.url;
            const title = imgTrigger.dataset.title;
            this.fetchAndShowGallery(detailUrl, title);
            return;
        }

        const copyBtn = e.target.closest('.copy-btn');
        if (copyBtn) {
            e.stopPropagation();
            const text = copyBtn.dataset.copy;
            copyTextToClipboard(text, copyBtn);
        }
    },

    async fetchAndShowGallery(detailUrl, title) {
        ImageModal.show([], [], title);
        
        try {
            const res = await fetch(detailUrl);
            const html = await res.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const links = doc.querySelectorAll('a[data-lightbox="image-1"]');
            let images = [];
            
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href) images.push(href.startsWith('http') ? href : this.baseUrl + href);
            });
            
            images = [...new Set(images)];
            
            if (images.length > 0) {
                ImageModal.show(images, images, title, 0);
            } else {
                ImageModal.loadImage(); 
            }
        } catch (e) {
            console.error('Gallery Fetch Error', e);
            ImageModal.caption.textContent = 'خطا در دریافت تصاویر';
            ImageModal.spinner.style.display = 'none';
        }
    },

    addToHistory(term) {
        let history = this.getHistory();
        history = history.filter(t => t !== term);
        history.unshift(term);
        history = history.slice(0, 5);
        localStorage.setItem(this.storageKeys.history, JSON.stringify(history));
        this.renderHistory(history);
    },

    getHistory() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKeys.history)) || [];
        } catch { return []; }
    },

    loadHistory() {
        this.renderHistory(this.getHistory());
    },

    renderHistory(items) {
        if (!items.length) {
            this.elements.historyContainer.classList.add('hidden');
            return;
        }
        this.elements.historyContainer.classList.remove('hidden');
        this.elements.historyList.innerHTML = items.map(t => `
            <li>
                <button data-term="${t}" class="bg-white/70 dark:bg-gray-800/70 hover:bg-white dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg text-xs border border-gray-200 dark:border-gray-700 transition-all hover:shadow-sm">
                    ${t}
                </button>
            </li>
        `).join('');
    }
};

// --- Theme Manager ---
const ThemeManager = {
    btn: document.getElementById('themeToggleBtn'),
    init() {
        if (!this.btn) return;
        
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        this.btn.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            if (document.documentElement.classList.contains('dark')) {
                localStorage.theme = 'dark';
            } else {
                localStorage.theme = 'light';
            }
        });
    }
};

// --- Back To Top ---
const BackToTop = {
    btn: document.getElementById('backToTopBtn'),
    init() {
        if(!this.btn) return;
        window.addEventListener('scroll', debounce(() => {
            if (window.scrollY > 300) {
                this.btn.classList.remove('translate-y-20', 'opacity-0');
            } else {
                this.btn.classList.add('translate-y-20', 'opacity-0');
            }
        }, 50));
        
        this.btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
    BackToTop.init();
    setTimeout(() => { SearchApp.init(); }, 10);
});
