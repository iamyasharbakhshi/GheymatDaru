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
    if (!nStr) return '۰';
    nStr = String(nStr).replace(/,/g, '');
    const x = nStr.split('.');
    let x1 = x[0];
    const x2 = x.length > 1 ? '.' + x[1] : '';
    const rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) { x1 = x1.replace(rgx, '$1,$2'); }
    return x1 + x2;
}

function toPersianDigits(str) {
    if (str === null || str === undefined) return '';
    return str.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
}

function translatePackaging(text) {
    if (!text) return '';

    let translated = text.toUpperCase().replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();

    const dict = [
        { en: 'WITH APPLICATOR', fa: 'همراه با اپلیکاتور' },
        { en: 'BLISTER PACK', fa: 'بلیستر' },
        { en: 'SUSPENSION', fa: 'سوسپانسیون' },
        { en: 'SUPPOSITORY', fa: 'شیاف' },
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
        { en: 'PACK', fa: 'بسته' },
        { en: 'DROP', fa: 'قطره' },
        { en: 'TUBE', fa: 'تیوب' },
        { en: 'VIAL', fa: 'ویال' },
        { en: 'BOX', fa: 'جعبه' },
        { en: 'PEN', fa: 'قلم' },
        { en: 'GEL', fa: 'ژل' },
        { en: ' IN ', fa: ' در ' },
        { en: ' OF ', fa: ' از ' },
        { en: ',', fa: '،' }
    ];

    dict.forEach(item => {
        const safeKey = item.en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(safeKey, 'gi');
        translated = translated.replace(regex, item.fa);
    });

    return toPersianDigits(translated);
}

async function copyTextToClipboard(text, buttonElement) {
    try {
        await navigator.clipboard.writeText(text);
        if (buttonElement) {
            const icon = buttonElement.querySelector('i') || buttonElement;
            const originalClass = icon.className;
            icon.className = "fa-solid fa-check text-emerald-500 scale-110 transition-transform";
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
            if (this.overlay && !this.overlay.classList.contains('hidden')) {
                if (e.key === 'Escape') this.hide();
                if (e.key === 'ArrowLeft') this.nav(-1);
                if (e.key === 'ArrowRight') this.nav(1);
            }
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
        if (!this.overlay) return;
        this.backdrop.classList.add('opacity-0');
        this.panel.classList.remove('opacity-100', 'scale-100');
        this.panel.classList.add('opacity-0', 'scale-95');

        setTimeout(() => {
            this.overlay.classList.add('hidden');
            if (DrugDetailModal.modal.classList.contains('hidden')) {
                document.body.classList.remove('overflow-hidden');
            }
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
        this.caption.textContent = `${this.title} (${toPersianDigits(this.currentIndex + 1)} از ${toPersianDigits(this.currentImages.length)})`;
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
                 class="h-12 w-12 object-cover rounded-md cursor-pointer border-2 transition-all ${i === this.currentIndex ? 'border-brand-500 scale-105' : 'border-transparent opacity-70 hover:opacity-100'}" 
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
                t.classList.add('border-brand-500', 'scale-105');
                t.classList.remove('border-transparent', 'opacity-70');
                t.scrollIntoView({ behavior: 'smooth', inline: 'center' });
            } else {
                t.classList.remove('border-brand-500', 'scale-105');
                t.classList.add('border-transparent', 'opacity-70');
            }
        });
    }
};

// --- In-App Drug Detail Modal & Parser ---
const DrugDetailModal = {
    modal: null,
    backdrop: null,
    panel: null,
    content: null,
    title: null,
    closeBtn: null,
    baseUrl: 'https://irc.ttac.ir',

    init() {
        this.modal = document.getElementById('drugDetailModal');
        this.backdrop = document.getElementById('drugDetailBackdrop');
        this.panel = document.getElementById('drugDetailPanel');
        this.content = document.getElementById('drugDetailContent');
        this.title = document.getElementById('drugDetailTitle');
        this.closeBtn = document.getElementById('closeDrugDetailModal');

        if (!this.modal) return;

        this.closeBtn?.addEventListener('click', () => this.hide());
        this.backdrop?.addEventListener('click', () => this.hide());
        
        document.addEventListener('keydown', (e) => {
            if (!this.modal.classList.contains('hidden') && e.key === 'Escape') {
                this.hide();
            }
        });
    },

    showLoading(drugName) {
        this.title.textContent = drugName || 'در حال بارگذاری اطلاعات دارو...';
        this.content.innerHTML = `
            <div class="flex flex-col items-center justify-center py-20 text-slate-400">
                <div class="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p class="font-medium text-sm">در حال دریافت و تحلیل اطلاعات کامل دارو...</p>
            </div>
        `;
        this.modal.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
        requestAnimationFrame(() => {
            this.backdrop.classList.remove('opacity-0');
            this.panel.classList.remove('opacity-0', 'scale-95');
            this.panel.classList.add('opacity-100', 'scale-100');
        });
    },

    hide() {
        if (!this.modal) return;
        this.backdrop.classList.add('opacity-0');
        this.panel.classList.remove('opacity-100', 'scale-100');
        this.panel.classList.add('opacity-0', 'scale-95');

        setTimeout(() => {
            this.modal.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
        }, 300);
    },

    async open(detailUrl, fallbackTitle) {
        this.showLoading(fallbackTitle);

        try {
            const res = await fetch(detailUrl);
            if (!res.ok) throw new Error('خطا در دریافت صفحه جزئیات');
            const html = await res.text();
            this.parseAndRender(html, fallbackTitle);
        } catch (err) {
            console.error(err);
            this.content.innerHTML = `
                <div class="p-8 text-center bg-rose-50 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-800">
                    <i class="fa-solid fa-triangle-exclamation text-rose-500 text-3xl mb-3"></i>
                    <h4 class="font-bold text-rose-800 dark:text-rose-200">خطا در بارگذاری جزئیات</h4>
                    <p class="text-sm text-slate-500 dark:text-slate-400 mt-2">لطفاً اتصال اینترنت یا وضعیت فیلترشکن خود را بررسی کرده و مجدداً تلاش نمایید.</p>
                </div>
            `;
        }
    },

    parseAndRender(html, fallbackTitle) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Helper to grab labels & values cleanly
        const getFieldValue = (labelText) => {
            const labels = Array.from(doc.querySelectorAll('label'));
            const target = labels.find(l => l.textContent.includes(labelText));
            if (!target) return null;
            const container = target.closest('div');
            if (!container) return null;
            const valEl = container.querySelector('span, bdo');
            return valEl ? valEl.textContent.trim() : null;
        };

        const data = {
            nameFa: fallbackTitle || '',
            nameEn: getFieldValue('نام :') || '',
            genericName: getFieldValue('نام عمومی :') || '',
            dosageForm: getFieldValue('شکل دارویی :') || '',
            route: getFieldValue('نحوه مصرف :') || '',
            brandOwner: getFieldValue('صاحب برند :') || '',
            licenseHolder: getFieldValue('صاحب پروانه :') || '',
            manufacturer: getFieldValue('تولید کننده :') || '',
            expirationDate: getFieldValue('تاریخ اعتبار پروانه :') || '',
            packagePrice: getFieldValue('قیمت مصرف کننده هر بسته') || '',
            unitPrice: getFieldValue('قیمت واحد') || '',
            gtin: getFieldValue('GTIN') || '',
            irc: getFieldValue('IRC') || '',
            packageCount: getFieldValue('تعداد در بسته') || '',
            activeIngredients: getFieldValue('ترکیبات') || '',
            indications: '',
            mechanism: '',
            pharmacokinetics: '',
            warnings: '',
            sideEffects: '',
            interactions: '',
            advice: '',
            atcTree: [],
            galleryImages: [],
            similarProducts: []
        };

        // Text Info Sections
        const textBlocks = doc.querySelectorAll('.paddingSearchTXT');
        textBlocks.forEach(block => {
            const label = block.querySelector('label')?.textContent.trim() || '';
            const val = block.querySelector('.txtSearch1')?.textContent.trim() || '';
            if (label.includes('موارد مصرف')) data.indications = val;
            if (label.includes('مکانیسم اثر')) data.mechanism = val;
            if (label.includes('فارماکوکینتیک')) data.pharmacokinetics = val;
            if (label.includes('هشدارها')) data.warnings = val;
            if (label.includes('عوارض جانبی')) data.sideEffects = val;
            if (label.includes('تداخل های دارویی')) data.interactions = val;
            if (label.includes('نکات قابل توصیه')) data.advice = val;
        });

        // ATC Hierarchy
        const atcRows = doc.querySelectorAll('.graphBox');
        atcRows.forEach(row => {
            const code = row.querySelector('.txtEnglish-ltr1 a')?.textContent.trim() || '';
            const desc = row.querySelector('.colorMediumPurple a')?.textContent.trim() || '';
            if (code && desc) {
                data.atcTree.push({ code, desc });
            }
        });

        // Gallery Packaging / Appearance Images
        const imgLinks = doc.querySelectorAll('a[data-lightbox="image-1"]');
        imgLinks.forEach(a => {
            const href = a.getAttribute('href');
            if (href && !href.includes('chem.nlm.nih.gov')) {
                data.galleryImages.push(href.startsWith('http') ? href : this.baseUrl + href);
            }
        });
        data.galleryImages = [...new Set(data.galleryImages)];

        // Similar Products Table
        const similarRows = doc.querySelectorAll('.table tbody tr');
        similarRows.forEach(tr => {
            const tds = tr.querySelectorAll('td');
            if (tds.length >= 5) {
                const link = tds[1].querySelector('a');
                const name = link ? link.textContent.trim() : tds[1].textContent.trim();
                const detailHref = link ? (this.baseUrl + link.getAttribute('href')) : '';
                const brandOwner = tds[2]?.textContent.trim() || '';
                const licensee = tds[4]?.textContent.trim() || '';
                data.similarProducts.push({ name, detailHref, brandOwner, licensee });
            }
        });

        this.title.textContent = data.nameEn ? `${data.nameFa} (${data.nameEn})` : data.nameFa;

        // Construct Rich Modern Template
        this.content.innerHTML = `
            <!-- Top Banner Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Price Box -->
                <div class="p-5 rounded-2xl bg-gradient-to-br from-brand-50 to-emerald-100/50 dark:from-brand-950/40 dark:to-emerald-900/10 border border-brand-200 dark:border-brand-800/60 flex items-center justify-between">
                    <div>
                        <span class="text-xs font-semibold text-brand-700 dark:text-brand-400 block mb-1">قیمت مصوب مصرف‌کننده (بسته)</span>
                        <div class="text-2xl font-black text-brand-900 dark:text-emerald-300">
                            ${toPersianDigits(addCommas(data.packagePrice))} <span class="text-xs font-medium">ریال</span>
                        </div>
                    </div>
                    ${data.unitPrice ? `
                    <div class="text-left border-r border-brand-200 dark:border-brand-800/60 pr-4">
                        <span class="text-[11px] text-slate-500 dark:text-slate-400 block">قیمت واحد</span>
                        <span class="text-base font-bold text-slate-700 dark:text-slate-300">${toPersianDigits(addCommas(data.unitPrice))} <span class="text-[10px]">ریال</span></span>
                    </div>` : ''}
                </div>

                <!-- Generic Box -->
                <div class="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex flex-col justify-center">
                    <span class="text-xs text-slate-400 font-medium mb-1">نام عمومی و قدرت دارویی</span>
                    <p class="text-sm font-bold text-slate-800 dark:text-slate-100 dir-ltr text-right select-all truncate" title="${data.genericName}">
                        ${data.genericName || 'ثبت نشده'}
                    </p>
                </div>
            </div>

            <!-- Specifications Grid -->
            <div>
                <h3 class="text-base font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <i class="fa-solid fa-list-check text-brand-500"></i> مشخصات فنی و تجاری دارو
                </h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
                    <div class="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800">
                        <span class="text-slate-400 block mb-1">شکل دارویی و نحوه مصرف</span>
                        <span class="font-bold text-slate-800 dark:text-slate-200 dir-ltr text-right block">${data.dosageForm} - ${data.route}</span>
                    </div>
                    <div class="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800">
                        <span class="text-slate-400 block mb-1">صاحب نام تجاری (برند)</span>
                        <span class="font-bold text-slate-800 dark:text-slate-200 truncate block">${data.brandOwner || '—'}</span>
                    </div>
                    <div class="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800">
                        <span class="text-slate-400 block mb-1">صاحب پروانه / تولید کننده</span>
                        <span class="font-bold text-slate-800 dark:text-slate-200 truncate block">${data.manufacturer || data.licenseHolder || '—'}</span>
                    </div>
                    <div class="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800">
                        <span class="text-slate-400 block mb-1">بسته‌بندی</span>
                        <span class="font-bold text-slate-800 dark:text-slate-200 block truncate" title="${data.packageCount}">${translatePackaging(data.packageCount) || data.packageCount || '—'}</span>
                    </div>
                    <div class="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800">
                        <span class="text-slate-400 block mb-1">شناسه تجاری (GTIN)</span>
                        <span class="font-mono font-bold text-slate-800 dark:text-slate-200 select-all block">${toPersianDigits(data.gtin) || '—'}</span>
                    </div>
                    <div class="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800">
                        <span class="text-slate-400 block mb-1">کد ثبت فرآورده (IRC)</span>
                        <span class="font-mono font-bold text-slate-800 dark:text-slate-200 select-all block">${toPersianDigits(data.irc) || '—'}</span>
                    </div>
                </div>
            </div>

            <!-- Product Packaging & Appearance Images -->
            ${data.galleryImages.length > 0 ? `
            <div>
                <h3 class="text-base font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <i class="fa-solid fa-camera text-brand-500"></i> تصاویر بسته بندی و شکل ظاهری دارو
                </h3>
                <div class="flex gap-3 overflow-x-auto pb-2">
                    ${data.galleryImages.map((src, i) => `
                        <div class="w-28 h-28 flex-shrink-0 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 cursor-pointer hover:border-brand-500 transition-all flex items-center justify-center detail-img-trigger" data-idx="${i}">
                            <img src="${src}" class="max-h-full max-w-full object-contain" alt="Drug image">
                        </div>
                    `).join('')}
                </div>
            </div>` : ''}

            <!-- Therapeutic & Clinical Information -->
            ${(data.indications || data.warnings || data.sideEffects || data.interactions || data.advice) ? `
            <div>
                <h3 class="text-base font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <i class="fa-solid fa-notes-medical text-brand-500"></i> اطلاعات درمانی و بالینی
                </h3>
                <div class="space-y-3">
                    ${data.indications ? `
                    <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                        <div class="font-bold text-xs text-brand-600 dark:text-brand-400 mb-1 flex items-center gap-2">
                            <i class="fa-solid fa-check"></i> موارد مصرف
                        </div>
                        <p class="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">${data.indications}</p>
                    </div>` : ''}

                    ${data.warnings ? `
                    <div class="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/50">
                        <div class="font-bold text-xs text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-2">
                            <i class="fa-solid fa-triangle-exclamation"></i> هشدارها
                        </div>
                        <p class="text-xs text-amber-900 dark:text-amber-200/90 leading-relaxed">${data.warnings}</p>
                    </div>` : ''}

                    ${data.sideEffects ? `
                    <div class="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-800/50">
                        <div class="font-bold text-xs text-rose-600 dark:text-rose-400 mb-1 flex items-center gap-2">
                            <i class="fa-solid fa-heart-pulse"></i> عوارض جانبی
                        </div>
                        <p class="text-xs text-rose-900 dark:text-rose-200/90 leading-relaxed">${data.sideEffects}</p>
                    </div>` : ''}

                    ${data.interactions ? `
                    <div class="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-800/50">
                        <div class="font-bold text-xs text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-2">
                            <i class="fa-solid fa-capsules"></i> تداخل‌های دارویی
                        </div>
                        <p class="text-xs text-blue-900 dark:text-blue-200/90 leading-relaxed">${data.interactions}</p>
                    </div>` : ''}

                    ${data.advice ? `
                    <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                        <div class="font-bold text-xs text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                            <i class="fa-solid fa-circle-info"></i> نکات قابل توصیه
                        </div>
                        <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">${data.advice}</p>
                    </div>` : ''}
                </div>
            </div>` : ''}

            <!-- ATC Classification -->
            ${data.atcTree.length > 0 ? `
            <div>
                <h3 class="text-base font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <i class="fa-solid fa-sitemap text-brand-500"></i> طبقه‌بندی آناتومیک درمانی شیمیایی (کد ATC)
                </h3>
                <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-2">
                    ${data.atcTree.map(item => `
                        <div class="flex items-center justify-between text-xs py-1.5 border-b last:border-none border-slate-200/60 dark:border-slate-800">
                            <span class="font-mono font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-2 py-0.5 rounded">${item.code}</span>
                            <span class="text-slate-600 dark:text-slate-300 font-medium dir-ltr text-right">${item.desc}</span>
                        </div>
                    `).join('')}
                </div>
            </div>` : ''}

            <!-- Similar / Alternative Products -->
            ${data.similarProducts.length > 0 ? `
            <div>
                <h3 class="text-base font-extrabold text-slate-900 dark:text-white mb-4 flex items-center justify-between">
                    <span class="flex items-center gap-2"><i class="fa-solid fa-tablets text-brand-500"></i> محصولات مشابه و هم‌گروه</span>
                    <span class="text-xs font-normal text-slate-400">(${toPersianDigits(data.similarProducts.length)} مورد)</span>
                </h3>
                <div class="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                    <table class="w-full text-right text-xs">
                        <thead class="bg-slate-100 dark:bg-slate-900/80 text-slate-500">
                            <tr>
                                <th class="p-3">نام دارو</th>
                                <th class="p-3 hidden sm:table-cell">صاحب نام تجاری</th>
                                <th class="p-3">صاحب امتیاز</th>
                                <th class="p-3 text-center">مشاهده</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                            ${data.similarProducts.map(p => `
                                <tr class="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                                    <td class="p-3 font-bold text-slate-800 dark:text-slate-200">${p.name}</td>
                                    <td class="p-3 text-slate-500 hidden sm:table-cell">${p.brandOwner || '—'}</td>
                                    <td class="p-3 text-slate-500">${p.licensee || '—'}</td>
                                    <td class="p-3 text-center">
                                        ${p.detailHref ? `
                                        <button class="open-similar-btn p-2 rounded-lg bg-brand-50 hover:bg-brand-100 dark:bg-brand-950 dark:hover:bg-brand-900 text-brand-600 dark:text-brand-400 transition-colors" data-url="${p.detailHref}" data-name="${p.name}">
                                            <i class="fa-solid fa-arrow-left text-xs"></i>
                                        </button>` : '—'}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>` : ''}
        `;

        // Bind image triggers in modal
        this.content.querySelectorAll('.detail-img-trigger').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.idx) || 0;
                ImageModal.show(data.galleryImages, data.galleryImages, data.nameFa, idx);
            });
        });

        // Bind similar product click to fetch in-place
        this.content.querySelectorAll('.open-similar-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const nextUrl = btn.dataset.url;
                const nextName = btn.dataset.name;
                this.open(nextUrl, nextName);
            });
        });
    }
};

// --- Search Application ---
const SearchApp = {
    baseUrl: 'https://irc.ttac.ir',
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
        DrugDetailModal.init();
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
        
        this.elements.clearBtn?.addEventListener('click', () => {
            this.elements.input.value = '';
            this.elements.input.focus();
            this.handleInputState();
            this.resetView();
        });

        this.elements.historyList?.addEventListener('click', (e) => {
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
        if (val.length > 0) this.elements.clearBtn?.classList.remove('hidden');
        else this.elements.clearBtn?.classList.add('hidden');
        
        const isRTL = /[\u0600-\u06FF]/.test(val);
        this.elements.input.dir = isRTL || !val ? 'rtl' : 'ltr';
    },

    resetView() {
        this.elements.initialMsg?.classList.remove('hidden');
        this.elements.skeleton?.classList.add('hidden');
        const containers = ['resultsControls', 'resultsGrid', 'resultsPagination'];
        containers.forEach(id => {
            const el = document.getElementById(id);
            if(el) el.remove();
        });
    },

    setupResultContainers() {
        this.elements.resultsArea.innerHTML = '';
        
        const controls = document.createElement('div');
        controls.id = 'resultsControls';
        
        const grid = document.createElement('div');
        grid.id = 'resultsGrid';
        grid.className = 'grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in';
        
        const pagination = document.createElement('div');
        pagination.id = 'resultsPagination';
        
        this.elements.resultsArea.appendChild(controls);
        this.elements.resultsArea.appendChild(grid);
        this.elements.resultsArea.appendChild(pagination);
    },

    async performSearch(term, page = 1) {
        this.elements.initialMsg?.classList.add('hidden');
        this.resetView(); 
        this.elements.skeleton?.classList.remove('hidden');
        this.elements.skeleton?.classList.add('grid');

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
            this.elements.skeleton?.classList.add('hidden');
            
            let errorTitle = 'خطا در برقراری ارتباط';
            let errorDesc = 'لطفاً اتصال اینترنت خود را بررسی کرده و دوباره تلاش کنید.';
            let errorIcon = 'fa-wifi';
            let errorClass = 'text-rose-600 bg-rose-50/50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800';

            if (navigator.onLine) {
                errorTitle = 'عدم دسترسی به سرور سامانه دارویی';
                errorDesc = `
                    <div class="space-y-2">
                        <p class="font-bold">این سامانه فقط از طریق آی‌پی‌های (IP) داخل ایران پاسخ می‌دهد.</p>
                        <p>لطفاً اگر <span class="text-rose-600 font-bold dark:text-rose-400">فیلترشکن (VPN)</span> شما روشن است، آن را قطع کرده و مجدد جستجو کنید.</p>
                    </div>`;
                errorIcon = 'fa-shield-halved';
                errorClass = 'text-amber-700 bg-amber-50/80 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800';
            }

            this.elements.resultsArea.innerHTML += `
                <div class="glass-card ${errorClass} p-8 rounded-3xl text-center mt-4 border">
                    <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/50 dark:bg-black/20 mb-4">
                        <i class="fa-solid ${errorIcon} text-2xl"></i>
                    </div>
                    <h3 class="text-lg font-bold mb-2">${errorTitle}</h3>
                    <div class="text-sm opacity-90 leading-relaxed">${errorDesc}</div>
                </div>`;
        }
    },

    parseAndRender(html, term, currentPage) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const rows = doc.querySelectorAll('.RowSearchSty');
        
        this.elements.skeleton?.classList.add('hidden');
        this.elements.skeleton?.classList.remove('grid');

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
            <div class="glass-card p-3 sm:p-4 rounded-2xl mb-4 flex flex-col sm:flex-row gap-3">
                <div class="flex-1">
                    <label class="text-[11px] font-bold text-slate-400 mb-1 block px-1">مرتب‌سازی نتایج</label>
                    <div class="relative">
                        <select id="sortSelect" class="w-full appearance-none bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-500 outline-none text-xs transition-shadow">
                            <option value="none">پیش‌فرض سامانه‌ای</option>
                            <option value="priceAsc">ارزان‌ترین قیمت</option>
                            <option value="priceDesc">گران‌ترین قیمت</option>
                            <option value="alpha">حروف الفبا</option>
                        </select>
                        <i class="fa-solid fa-chevron-down absolute left-3 top-3 text-slate-400 text-xs pointer-events-none"></i>
                    </div>
                </div>
                <div class="flex-1">
                    <label class="text-[11px] font-bold text-slate-400 mb-1 block px-1">فیلتر برند دارویی</label>
                    <div class="relative">
                        <select id="filterSelect" class="w-full appearance-none bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-500 outline-none text-xs transition-shadow">
                            <option value="all">تمام برندها</option>
                            ${owners.map(o => `<option value="${o}">${o}</option>`).join('')}
                        </select>
                        <i class="fa-solid fa-filter absolute left-3 top-3 text-slate-400 text-xs pointer-events-none"></i>
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
            grid.innerHTML = '<div class="col-span-full text-center py-10 text-slate-400">موردی با این مشخصات یافت نشد.</div>';
        } else {
            const frag = document.createDocumentFragment();
            
            displayData.forEach(item => {
                const priceFormatted = item.price ? addCommas(toPersianDigits(item.price)) : 'نامشخص';
                const hasImage = !!item.img;
                
                const card = document.createElement('div');
                card.className = "glass-card rounded-2xl p-5 hover:border-brand-500/50 hover:shadow-card-hover transition-all duration-300 relative group flex flex-col justify-between cursor-pointer drug-card-trigger";
                card.dataset.url = item.detailUrl;
                card.dataset.title = item.titleFa;

                card.innerHTML = `
                    <div>
                        <!-- Header Badges -->
                        <div class="flex items-start justify-between gap-2 mb-3">
                            <span class="bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 px-2.5 py-1 rounded-lg text-[11px] font-bold truncate max-w-[75%] border border-brand-200/50 dark:border-brand-800/50">
                                ${item.owner || 'برند ثبت نشده'}
                            </span>
                            ${item.productCode ? `
                            <button class="copy-btn text-slate-400 hover:text-brand-500 p-1 transition-colors" data-copy="${item.productCode}" title="کپی کد فرآورده: ${item.productCode}">
                                <i class="fa-regular fa-copy"></i>
                            </button>` : ''}
                        </div>

                        <!-- Main Info & Image -->
                        <div class="flex gap-4 mb-3">
                            <div class="w-20 h-20 flex-shrink-0 bg-slate-100 dark:bg-slate-800/80 rounded-xl p-1.5 flex items-center justify-center overflow-hidden border border-slate-200/60 dark:border-slate-800">
                                ${hasImage 
                                    ? `<img src="${item.img}" class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" loading="lazy" alt="${item.titleFa}">`
                                    : `<i class="fa-solid fa-pills text-2xl text-slate-300 dark:text-slate-600"></i>`
                                }
                            </div>
                            
                            <div class="flex-1 min-w-0">
                                <h3 class="font-extrabold text-slate-900 dark:text-white text-base mb-1 line-clamp-2 leading-snug group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                                    ${item.titleFa}
                                </h3>
                                <p class="text-[11px] text-slate-400 font-medium dir-ltr text-right truncate mb-2">${item.titleEn}</p>
                                
                                <div class="space-y-1">
                                    ${item.packaging ? `
                                        <p class="text-[11px] text-slate-500 dark:text-slate-400 truncate" title="${item.packaging}">
                                            <i class="fa-solid fa-box-open ml-1 text-slate-400"></i>${item.packaging}
                                        </p>` : ''}
                                </div>
                            </div>
                        </div>

                        ${item.genericCode ? `
                        <div class="mb-3 text-[11px]">
                             <span class="inline-flex items-center bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded-md text-slate-600 dark:text-slate-400">
                                <span class="opacity-60 ml-1">کد ژنریک:</span> ${toPersianDigits(item.genericCode)}
                             </span>
                        </div>` : ''}
                    </div>

                    <!-- Bottom Price & Modal Trigger -->
                    <div class="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                        <div>
                            <span class="text-[10px] text-slate-400 block font-medium">قیمت مصوب</span>
                            <span class="text-base font-extrabold text-slate-900 dark:text-emerald-400">
                                ${priceFormatted} <span class="text-[10px] font-medium text-slate-400">ریال</span>
                            </span>
                        </div>
                        <button type="button" class="w-9 h-9 rounded-xl bg-slate-100 hover:bg-brand-600 dark:bg-slate-800 dark:hover:bg-brand-600 text-slate-600 hover:text-white dark:text-slate-300 dark:hover:text-white flex items-center justify-center transition-all shadow-sm">
                            <i class="fa-solid fa-arrow-left text-xs"></i>
                        </button>
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
        nav.className = 'mt-10 flex justify-center';
        
        const ul = document.createElement('ul');
        ul.className = 'flex flex-wrap gap-1.5 justify-center items-center p-2 glass-card rounded-2xl';

        originalNav.querySelectorAll('li a').forEach(link => {
            const href = link.getAttribute('href');
            if (!href) return;
            
            const params = getQueryParams(href);
            const pageNum = parseInt(params.PageNumber) || 1;
            const text = link.textContent.trim();
            const isActive = pageNum == currentPage;

            let content = text;
            if (text === '>>') content = '<i class="fa-solid fa-angles-right text-xs"></i>';
            if (text === '<<') content = '<i class="fa-solid fa-angles-left text-xs"></i>';
            if (text === '>') content = '<i class="fa-solid fa-angle-right text-xs"></i>';
            if (text === '<') content = '<i class="fa-solid fa-angle-left text-xs"></i>';
            
            if (/^\d+$/.test(content)) content = toPersianDigits(content);

            const li = document.createElement('li');
            const btn = document.createElement('button');
            
            btn.className = `w-9 h-9 flex items-center justify-center rounded-xl text-xs font-semibold transition-all ${
                isActive 
                ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30' 
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
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
            <div class="glass-card flex flex-col items-center justify-center py-16 px-4 text-center rounded-3xl">
                <div class="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mb-4">
                    <i class="fa-solid fa-magnifying-glass-chart text-2xl"></i>
                </div>
                <h3 class="text-base font-bold text-slate-900 dark:text-white mb-2">دارویی با این عنوان یافت نشد</h3>
                <p class="text-xs text-slate-400 mb-6 max-w-sm">
                    لطفاً املا را بررسی نمایید یا عنوان فارسی یا انگلیسی دارو را به شکل مختصرتر وارد کنید.
                </p>
                ${suggestions.length ? `
                    <div class="flex flex-wrap gap-2 justify-center max-w-md">
                        <span class="w-full text-xs text-slate-400 mb-1">پیشنهادات سیستم:</span>
                        ${suggestions.map(s => `
                            <button class="suggestion-btn px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs hover:bg-brand-50 dark:hover:bg-brand-950/60 hover:text-brand-600 transition-colors" data-term="${s.text}">
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
        // Copy Product Code click
        const copyBtn = e.target.closest('.copy-btn');
        if (copyBtn) {
            e.stopPropagation();
            const text = copyBtn.dataset.copy;
            copyTextToClipboard(text, copyBtn);
            return;
        }

        // Open Complete Modal in our site instead of redirecting
        const cardTrigger = e.target.closest('.drug-card-trigger');
        if (cardTrigger) {
            const detailUrl = cardTrigger.dataset.url;
            const title = cardTrigger.dataset.title;
            if (detailUrl) {
                DrugDetailModal.open(detailUrl, title);
            }
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
            this.elements.historyContainer?.classList.add('hidden');
            return;
        }
        this.elements.historyContainer?.classList.remove('hidden');
        if (this.elements.historyList) {
            this.elements.historyList.innerHTML = items.map(t => `
                <li>
                    <button data-term="${t}" class="bg-slate-100 dark:bg-surface-cardDark hover:bg-brand-50 dark:hover:bg-brand-950/60 text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 px-3 py-1 rounded-lg text-xs border border-slate-200/60 dark:border-slate-800 transition-all">
                        ${t}
                    </button>
                </li>
            `).join('');
        }
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
            localStorage.theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
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
