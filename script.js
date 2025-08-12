// script.js
// Utility Functions
function getQueryParams(url) {
    const params = {};
    if (!url) return params;
    
    try {
        // If url is a string, parse it
        if (typeof url === 'string') {
            const queryString = url.split('?')[1];
            if (!queryString) return params;
            
            const urlParams = new URLSearchParams(queryString);
            for (const [key, value] of urlParams) { 
                params[key] = value; 
            }
        } 
        // If url is already a URLSearchParams object
        else if (url instanceof URLSearchParams) {
            for (const [key, value] of url) { 
                params[key] = value; 
            }
        }
    } catch(e) { 
        console.error("Error parsing query:", url, e); 
    }
    
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

function getIconicPaginationText(originalText) {
    const trimmedText = originalText.trim();
    if (trimmedText === '>>') return '« <span class="hidden md:inline">ابتدا</span>';
    if (trimmedText === '<') return '› <span class="hidden md:inline">بعدی</span>';
    if (trimmedText === '>') return '<span class="hidden md:inline">قبلی</span> ‹';
    if (trimmedText === '<<') return '<span class="hidden md:inline">انتها</span> »';
    return /^\d+$/.test(trimmedText) ? trimmedText : originalText;
}

function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe === null || typeof unsafe === 'undefined' ? '' : String(unsafe);
    return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

async function copyTextToClipboard(text, buttonElement) {
    try {
        await navigator.clipboard.writeText(text);
        if(buttonElement){
            const originalIcon = buttonElement.className;
            buttonElement.className = "fas fa-check text-green-500 cursor-default";
            setTimeout(() => {
                buttonElement.className = originalIcon;
            }, 1500);
        }
    } catch (err) {
        console.error('Failed to copy: ', err);
        alert('امکان کپی خودکار وجود ندارد. لطفاً دستی کپی کنید.');
    }
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Image Modal Module
const ImageModal = {
    imageOverlay: null,
    imageModal: null,
    zoomedImage: null,
    closeButton: null,
    prevButton: null,
    nextButton: null,
    caption: null,
    spinner: null,
    miniMapContainer: null,
    currentGalleryImages: [],
    currentMiniMapThumbnails: [],
    currentImageIndex: 0,
    currentDrugTitle: '',
    touchStartX: 0,
    touchEndX: 0,
    
    init() {
        this.imageOverlay = document.getElementById('modalOverlay');
        this.imageModal = document.getElementById('imageModal');
        this.zoomedImage = document.getElementById('zoomedImage');
        this.closeButton = document.getElementById('closeImageModalButton');
        this.prevButton = document.getElementById('prevImageButton');
        this.nextButton = document.getElementById('nextImageButton');
        this.caption = document.getElementById('modalCaption');
        this.spinner = document.getElementById('modalLoadingSpinner');
        this.miniMapContainer = document.getElementById('modalMiniMap');
        
        // Event delegation for modal
        if (this.imageOverlay) {
            this.imageOverlay.addEventListener('click', this.hide.bind(this));
        }
        if (this.closeButton) {
            this.closeButton.addEventListener('click', this.hide.bind(this));
            this.closeButton.addEventListener('keydown', (e) => { 
                if (e.key === 'Enter' || e.key === ' ') this.hide(e); 
            });
        }
        if (this.prevButton) {
            this.prevButton.addEventListener('click', (e) => { 
                e.stopPropagation(); 
                this.showPrev(); 
            });
        }
        if (this.nextButton) {
            this.nextButton.addEventListener('click', (e) => { 
                e.stopPropagation(); 
                this.showNext(); 
            });
        }
        
        // Prevent modal from closing when clicking on its content
        if (this.imageModal) {
            this.imageModal.addEventListener('click', (e) => e.stopPropagation());
            // Touch events for swipe
            this.imageModal.addEventListener('touchstart', (e) => {
                this.touchStartX = e.changedTouches[0].screenX;
            });
            this.imageModal.addEventListener('touchend', (e) => {
                this.touchEndX = e.changedTouches[0].screenX;
                this.handleSwipe();
            });
        }
        
        // Keyboard navigation
        document.addEventListener('keydown', this.handleKeydown.bind(this));
    },
    
    handleSwipe() {
        if (this.touchEndX < this.touchStartX - 50) {
            this.showNext();
        }
        if (this.touchEndX > this.touchStartX + 50) {
            this.showPrev();
        }
    },
    
    handleKeydown(event) {
        if (this.imageModal && !this.imageModal.classList.contains('hidden')) {
            if (event.key === 'Escape') { 
                this.hide(); 
            } else if (event.key === 'ArrowLeft') { 
                event.preventDefault(); 
                this.showPrev(); 
            } else if (event.key === 'ArrowRight') { 
                event.preventDefault(); 
                this.showNext(); 
            }
        }
    },
    
    show(galleryImages, thumbnailImages, drugTitle, initialIndex = 0) {
        this.currentGalleryImages = galleryImages || [];
        this.currentMiniMapThumbnails = thumbnailImages || [];
        this.currentImageIndex = initialIndex;
        this.currentDrugTitle = drugTitle || '';
        
        if (!this.imageOverlay || !this.imageModal) return;
        
        this.imageOverlay.classList.remove('hidden');
        this.imageModal.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
        
        // Use requestAnimationFrame for smooth transitions
        requestAnimationFrame(() => {
            this.imageOverlay.style.opacity = 1;
            this.imageModal.style.opacity = 1;
            this.closeButton.focus();
        });
        
        this.renderMiniMap();
        this.displayCurrent();
    },
    
    hide() {
        if (!this.imageOverlay || !this.imageModal) return;
        
        this.imageOverlay.style.opacity = 0;
        this.imageModal.style.opacity = 0;
        
        setTimeout(() => {
            this.imageOverlay.classList.add('hidden');
            this.imageModal.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
            if(this.zoomedImage) { 
                this.zoomedImage.src = ''; 
                this.zoomedImage.alt = ''; 
            }
            this.currentGalleryImages = [];
            this.currentMiniMapThumbnails = [];
            this.currentImageIndex = 0;
            this.currentDrugTitle = '';
            if(this.miniMapContainer) this.miniMapContainer.innerHTML = '';
        }, 300);
    },
    
    jumpToImage(index) {
        if (index >= 0 && index < this.currentGalleryImages.length) {
            this.currentImageIndex = index;
            this.displayCurrent();
        }
    },
    
    displayCurrent() {
        if (!this.zoomedImage || !this.spinner || !this.caption || !this.prevButton || !this.nextButton || !this.miniMapContainer) return;
        
        this.spinner.style.display = 'flex';
        this.zoomedImage.style.opacity = 0;
        
        if (this.currentGalleryImages.length > 0 && this.currentImageIndex >= 0 && this.currentImageIndex < this.currentGalleryImages.length) {
            const imageUrl = this.currentGalleryImages[this.currentImageIndex];
            this.zoomedImage.alt = this.currentDrugTitle || `تصویر ${this.currentImageIndex + 1}`;
            
            const tempImg = new Image();
            tempImg.onload = () => {
                this.spinner.style.display = 'none';
                this.zoomedImage.src = tempImg.src;
                this.updateMiniMapActiveState();
                
                requestAnimationFrame(() => {
                    this.zoomedImage.style.opacity = 1;
                    this.caption.textContent = `${this.currentDrugTitle ? escapeHtml(this.currentDrugTitle) + ' - ' : ''}${this.currentImageIndex + 1} از ${this.currentGalleryImages.length}`;
                    
                    if (this.currentGalleryImages.length > 1) {
                        this.prevButton.classList.remove('hidden');
                        this.nextButton.classList.remove('hidden');
                    } else {
                        this.prevButton.classList.add('hidden');
                        this.nextButton.classList.add('hidden');
                    }
                    
                    if (this.miniMapContainer && this.currentMiniMapThumbnails.length > 1) {
                        this.miniMapContainer.classList.remove('hidden');
                    } else {
                        this.miniMapContainer.classList.add('hidden');
                    }
                });
            };
            
            tempImg.onerror = () => {
                this.spinner.style.display = 'none';
                this.caption.textContent = 'خطا در بارگذاری عکس';
                console.error('Failed to load image:', imageUrl);
            };
            
            tempImg.src = imageUrl;
        } else {
            this.spinner.style.display = 'none';
            this.caption.textContent = 'عکسی یافت نشد.';
        }
    },
    
    renderMiniMap() {
        if (!this.miniMapContainer || !this.currentMiniMapThumbnails) return;
        
        this.miniMapContainer.innerHTML = '';
        
        if (this.currentMiniMapThumbnails.length > 1) {
            // Use document fragment for better performance
            const fragment = document.createDocumentFragment();
            
            this.currentMiniMapThumbnails.forEach((thumbUrl, index) => {
                const thumbImg = document.createElement('img');
                thumbImg.src = thumbUrl;
                thumbImg.alt = `نمای کوچک ${index + 1}`;
                thumbImg.setAttribute('data-index', index);
                thumbImg.loading = 'lazy';
                thumbImg.className = 'inline-block h-16 w-16 object-cover mr-2 cursor-pointer border-2 border-transparent hover:border-blue-500 rounded-md';
                fragment.appendChild(thumbImg);
            });
            
            this.miniMapContainer.appendChild(fragment);
            this.miniMapContainer.addEventListener('click', this.handleMiniMapClick.bind(this));
        }
    },
    
    handleMiniMapClick(event) {
        const clickedThumbnail = event.target.closest('img');
        if (clickedThumbnail) {
            event.stopPropagation();
            const index = parseInt(clickedThumbnail.getAttribute('data-index'));
            if (!isNaN(index) && index !== this.currentImageIndex) {
                this.jumpToImage(index);
            }
        }
    },
    
    updateMiniMapActiveState() {
        if (!this.miniMapContainer) return;
        
        const thumbnails = this.miniMapContainer.querySelectorAll('img');
        thumbnails.forEach((thumb, index) => {
            if (index === this.currentImageIndex) {
                thumb.classList.add('border-blue-500');
                thumb.classList.remove('border-transparent');
                thumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            } else {
                thumb.classList.remove('border-blue-500');
                thumb.classList.add('border-transparent');
            }
        });
    },
    
    showNext() {
        if (this.currentGalleryImages.length <= 1) return;
        this.currentImageIndex = (this.currentImageIndex + 1) % this.currentGalleryImages.length;
        this.displayCurrent();
    },
    
    showPrev() {
        if (this.currentGalleryImages.length <= 1) return;
        this.currentImageIndex = (this.currentImageIndex - 1 + this.currentGalleryImages.length) % this.currentGalleryImages.length;
        this.displayCurrent();
    }
};

// Search App Module
const SearchApp = {
    searchForm: null,
    termInput: null,
    resultDiv: null,
    initialMessage: null,
    clearInputButton: null,
    searchHistoryDiv: null,
    searchHistoryListUl: null,
    ownerFilterSelect: null,
    sortSelect: null,
    currentSortKey: 'none',
    currentSortDirection: 'asc',
    currentFilterKey: 'owner',
    currentFilterValue: 'all',
    allResultsOnCurrentPage: [],
    LOCAL_STORAGE_HISTORY_KEY: 'drugSearchHistory',
    MAX_HISTORY_ITEMS: 5,
    LOCAL_STORAGE_SORT_KEY: 'drugSearchSortKey',
    LOCAL_STORAGE_SORT_DIR_KEY: 'drugSearchSortDir',
    LOCAL_STORAGE_FILTER_VAL_KEY: 'drugSearchFilterVal',
    targetBaseUrl: 'https://irc.fda.gov.ir',
    searchEndpoint: '/nfi/Search',
    
    init() {
        this.searchForm = document.querySelector('#subscribe form');
        this.termInput = document.getElementById('Term');
        this.resultDiv = document.getElementById('simulationResult');
        this.initialMessage = document.getElementById('initialMessage');
        this.clearInputButton = document.getElementById('clearSearchInput');
        this.searchHistoryDiv = document.getElementById('searchHistory');
        this.searchHistoryListUl = document.getElementById('searchHistoryList');
        
        this.loadUserPreferences();
        ImageModal.init();
        this.attachEventListeners();
        this.loadSearchHistory();
        
        if (this.termInput) {
            this.handleInputDirection();
            this.handleClearButtonVisibility();
            this.termInput.addEventListener('input', this.handleInputDirection.bind(this));
            this.termInput.addEventListener('input', debounce(this.handleClearButtonVisibility.bind(this), 300));
        }
        
        if (this.clearInputButton) {
            this.clearInputButton.addEventListener('click', this.handleClearInputClick.bind(this));
            this.clearInputButton.addEventListener('keydown', (e) => { 
                if (e.key === 'Enter' || e.key === ' ') this.handleClearInputClick(e); 
            });
        }
        
        const urlParams = getQueryParams(window.location.search);
        const initialTerm = urlParams['Term'] || '';
        const initialPage = urlParams['PageNumber'] ? parseInt(urlParams['PageNumber']) : 1;
        
        if (initialTerm) {
            if(this.termInput) this.termInput.value = initialTerm;
            this.handleInputDirection();
            this.handleClearButtonVisibility();
            
            // Use a small delay to ensure everything is initialized
            setTimeout(() => {
                this.performSearch(initialTerm, initialPage);
            }, 100);
        } else {
            this.showInitialMessages();
        }
        
        window.addEventListener('popstate', this.handlePopstate.bind(this));
    },
    
    loadUserPreferences() {
        this.currentSortKey = localStorage.getItem(this.LOCAL_STORAGE_SORT_KEY) || 'none';
        this.currentSortDirection = localStorage.getItem(this.LOCAL_STORAGE_SORT_DIR_KEY) || 'asc';
        this.currentFilterValue = localStorage.getItem(this.LOCAL_STORAGE_FILTER_VAL_KEY) || 'all';
    },
    
    showInitialMessages() {
        if (this.initialMessage) this.initialMessage.classList.remove('hidden');
        this.resultDiv.innerHTML = '';
        this.resultDiv.appendChild(this.initialMessage);
    },
    
    handlePopstate(event) {
        const urlParams = getQueryParams(window.location.search);
        const poppedTerm = urlParams['Term'] || '';
        const poppedPage = urlParams['PageNumber'] ? parseInt(urlParams['PageNumber']) : 1;
        
        console.log(`Popstate: term=${poppedTerm}, page=${poppedPage}`);
        
        if (this.termInput) this.termInput.value = poppedTerm;
        this.handleInputDirection();
        this.handleClearButtonVisibility();
        this.loadUserPreferences();
        
        if (poppedTerm) {
            this.performSearch(poppedTerm, poppedPage);
        } else {
            this.resultDiv.innerHTML = '';
            this.showInitialMessages();
        }
    },
    
    handleInputDirection() {
        if (!this.termInput) return;
        const value = this.termInput.value;
        const rtlRegex = /[\u0600-\u06FF]/;
        if (rtlRegex.test(value) || value === '') {
            this.termInput.dir = 'rtl';
        } else {
            this.termInput.dir = 'ltr';
        }
    },
    
    handleClearButtonVisibility() {
        if (!this.termInput || !this.clearInputButton) return;
        if (this.termInput.value.length > 0) {
            this.clearInputButton.classList.remove('hidden');
        } else {
            this.clearInputButton.classList.add('hidden');
        }
    },
    
    handleClearInputClick(event) {
        if(event) event.preventDefault();
        if (!this.termInput) return;
        
        this.termInput.value = '';
        this.termInput.dispatchEvent(new Event('input', { bubbles: true }));
        this.termInput.focus();
        this.showInitialMessages();
        history.pushState({}, '', window.location.pathname);
        
        this.currentSortKey = 'none';
        this.currentSortDirection = 'asc';
        this.currentFilterValue = 'all';
        localStorage.removeItem(this.LOCAL_STORAGE_SORT_KEY);
        localStorage.removeItem(this.LOCAL_STORAGE_SORT_DIR_KEY);
        localStorage.removeItem(this.LOCAL_STORAGE_FILTER_VAL_KEY);
        this.allResultsOnCurrentPage = [];
    },
    
    attachEventListeners() {
        if (this.searchForm) {
            this.searchForm.addEventListener('submit', this.handleSearchSubmit.bind(this));
        }
        
        if (this.resultDiv) {
            // Event delegation for result area
            this.resultDiv.addEventListener('click', this.handleResultAreaClick.bind(this));
            this.resultDiv.addEventListener('change', (event) => {
                if (event.target.id === 'sortSelect') {
                    this.handleSortChange(event);
                } else if (event.target.id === 'ownerFilter') {
                    this.handleFilterChange(event);
                }
            });
        }
        
        if (this.searchHistoryListUl) {
            this.searchHistoryListUl.addEventListener('click', this.handleHistoryItemClick.bind(this));
        }
    },
    
    handleSearchSubmit(event) {
        event.preventDefault();
        const searchTerm = this.termInput ? this.termInput.value.trim() : '';
        
        if (!searchTerm) {
            this.resultDiv.innerHTML = `<div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 text-center" role="alert"><p class="font-bold">لطفاً کلمه کلیدی برای جستجو وارد نمایید!</p></div>`;
            return;
        }
        
        this.currentSortKey = 'none';
        this.currentSortDirection = 'asc';
        this.currentFilterValue = 'all';
        localStorage.removeItem(this.LOCAL_STORAGE_SORT_KEY);
        localStorage.removeItem(this.LOCAL_STORAGE_SORT_DIR_KEY);
        localStorage.removeItem(this.LOCAL_STORAGE_FILTER_VAL_KEY);
        
        this.performSearch(searchTerm);
        this.saveSearchTermToHistory(searchTerm);
    },
    
    handleResultAreaClick(event) {
        const clickedImageContainer = event.target.closest('.drug-image-container');
        const clickedSuggestionLink = event.target.closest('.suggestions-list a');
        const clickedCopyButton = event.target.closest('.copy-button');
        const clickedPaginationLink = event.target.closest('.pagination a');
        
        if (clickedImageContainer) {
            event.preventDefault();
            const detailUrl = clickedImageContainer.getAttribute('data-detail-url');
            const drugTitle = clickedImageContainer.getAttribute('data-drug-title');
            this.fetchAndShowImageModal(detailUrl, drugTitle);
        } else if (clickedSuggestionLink) {
            event.preventDefault();
            const suggestedTerm = clickedSuggestionLink.getAttribute('data-suggested-term');
            if (suggestedTerm && this.termInput) {
                this.termInput.value = suggestedTerm;
                this.handleInputDirection();
                this.handleClearButtonVisibility();
                this.performSearch(suggestedTerm);
            }
        } else if (clickedCopyButton) {
            const targetSelector = clickedCopyButton.getAttribute('data-copy-target');
            const textToCopyElement = document.querySelector(targetSelector);
            if (textToCopyElement) {
                const textToCopy = textToCopyElement.textContent.trim();
                copyTextToClipboard(textToCopy, clickedCopyButton);
            }
        } else if (clickedPaginationLink) {
            event.preventDefault();
            event.stopPropagation();
            
            // Check if the link is disabled
            if (clickedPaginationLink.getAttribute('aria-disabled') === 'true') {
                return;
            }
            
            const page = clickedPaginationLink.getAttribute('data-page');
            const term = clickedPaginationLink.getAttribute('data-term');
            
            if (page && term) {
                console.log(`Pagination clicked: page=${page}, term=${term}`);
                this.performSearch(term, parseInt(page));
            } else {
                console.error('Missing page or term in pagination link', clickedPaginationLink);
            }
        }
    },
    
    handleSortChange(event) {
        const [sortKey, sortDirection] = event.target.value.split('-');
        this.currentSortKey = sortKey;
        this.currentSortDirection = sortDirection || 'asc';
        localStorage.setItem(this.LOCAL_STORAGE_SORT_KEY, this.currentSortKey);
        localStorage.setItem(this.LOCAL_STORAGE_SORT_DIR_KEY, this.currentSortDirection);
        this.applySortingAndFiltering();
    },
    
    handleFilterChange(event) {
        this.currentFilterKey = 'owner';
        this.currentFilterValue = event.target.value;
        localStorage.setItem(this.LOCAL_STORAGE_FILTER_VAL_KEY, this.currentFilterValue);
        this.applySortingAndFiltering();
    },
    
    handleHistoryItemClick(event) {
        const clickedLink = event.target.closest('a');
        if (clickedLink) {
            event.preventDefault();
            const searchTerm = clickedLink.getAttribute('data-term');
            if (searchTerm && this.termInput) {
                this.termInput.value = searchTerm;
                this.handleInputDirection();
                this.handleClearButtonVisibility();
                this.currentSortKey = 'none';
                this.currentSortDirection = 'asc';
                this.currentFilterValue = 'all';
                localStorage.removeItem(this.LOCAL_STORAGE_SORT_KEY);
                localStorage.removeItem(this.LOCAL_STORAGE_SORT_DIR_KEY);
                localStorage.removeItem(this.LOCAL_STORAGE_FILTER_VAL_KEY);
                this.performSearch(searchTerm);
            }
        }
    },
    
    loadSearchHistory() {
        if (!this.searchHistoryDiv || !this.searchHistoryListUl) return;
        
        try {
            const history = JSON.parse(localStorage.getItem(this.LOCAL_STORAGE_HISTORY_KEY)) || [];
            this.renderSearchHistory(history);
        } catch (e) { 
            localStorage.removeItem(this.LOCAL_STORAGE_HISTORY_KEY); 
            this.renderSearchHistory([]); 
        }
    },
    
    saveSearchTermToHistory(term) {
        if (!term || term.length < 2) return;
        
        let history = JSON.parse(localStorage.getItem(this.LOCAL_STORAGE_HISTORY_KEY)) || [];
        history = history.filter(item => item.toLowerCase() !== term.toLowerCase());
        history.unshift(term);
        history = history.slice(0, this.MAX_HISTORY_ITEMS);
        localStorage.setItem(this.LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(history));
        this.renderSearchHistory(history);
    },
    
    renderSearchHistory(history) {
        if (!this.searchHistoryDiv || !this.searchHistoryListUl) return;
        
        this.searchHistoryListUl.innerHTML = '';
        
        if (history && history.length > 0) {
            // Use document fragment for better performance
            const fragment = document.createDocumentFragment();
            
            history.forEach(term => {
                const li = document.createElement('li');
                li.innerHTML = `<a href="#" data-term="${escapeHtml(term)}" class="block bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium py-1 px-3 rounded-full text-sm transition-colors">${escapeHtml(term)}</a>`;
                fragment.appendChild(li);
            });
            
            this.searchHistoryListUl.appendChild(fragment);
            this.searchHistoryDiv.classList.remove('hidden');
        } else {
            this.searchHistoryDiv.classList.add('hidden');
        }
    },
    
    fetchAndShowImageModal: async function(detailUrl, drugTitle) {
        ImageModal.show([],[], drugTitle);
        
        try {
            const detailResponse = await fetch(detailUrl);
            if (!detailResponse.ok) throw new Error(`HTTP error ${detailResponse.status}.`);
            
            const detailHtmlString = await detailResponse.text();
            const parser = new DOMParser();
            const detailDoc = parser.parseFromString(detailHtmlString, 'text/html');
            
            const galleryLinkElements = detailDoc.querySelectorAll('.searchBox1 a[data-lightbox="image-1"], .alignBtn a[data-lightbox="image-1"]');
            let tempImageUrls = [], tempThumbnailUrls = [];
            
            galleryLinkElements.forEach(link => {
                const rawFullHref = link.getAttribute('href');
                if (rawFullHref && rawFullHref.trim() !== '' && rawFullHref.trim() !== '#') {
                    let absoluteFullHref = rawFullHref.startsWith('/') ? `${this.targetBaseUrl}${rawFullHref}` : rawFullHref;
                    tempImageUrls.push(absoluteFullHref);
                    
                    const thumbImg = link.querySelector('img');
                    const rawThumbSrc = thumbImg ? thumbImg.getAttribute('src') : null;
                    let absoluteThumbSrc = rawThumbSrc && rawThumbSrc.startsWith('/') ? `${this.targetBaseUrl}${rawThumbSrc}` : rawThumbSrc || absoluteFullHref;
                    tempThumbnailUrls.push(absoluteThumbSrc);
                }
            });
            
            // The last image is often a duplicate "show all" link, remove it.
            const finalImageUrls = tempImageUrls.length > 1 ? tempImageUrls.slice(0, -1) : tempImageUrls;
            const finalThumbnailUrls = tempThumbnailUrls.length > 1 ? tempThumbnailUrls.slice(0, -1) : tempThumbnailUrls;
            
            if (finalImageUrls.length > 0) {
                ImageModal.show(finalImageUrls, finalThumbnailUrls, drugTitle, 0);
            } else {
                ImageModal.displayCurrent(); // Will show "not found" message
            }
        } catch (detailError) {
            console.error('Error fetching detail page for images:', detailError);
            ImageModal.caption.textContent = `خطا در بارگذاری تصاویر: ${detailError.message}`;
            ImageModal.spinner.style.display = 'none';
        }
    },
    
    performSearch: async function(searchTerm, pageNumber = 1, pageSize = 10) {
        if (!this.resultDiv || !this.termInput) return;
        
        if(this.initialMessage) this.initialMessage.classList.add('hidden');
        
        // Show loading spinner
        this.resultDiv.innerHTML = `
            <div class="flex flex-col items-center justify-center p-10">
                <div class="spinner animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
                <p class="text-gray-600 dark:text-gray-400">در حال جستجو برای "${escapeHtml(searchTerm)}" صفحه ${pageNumber}...</p>
            </div>`;
        
        const encodedSearchTerm = encodeURIComponent(searchTerm);
        const targetUrl = `${this.targetBaseUrl}${this.searchEndpoint}?Term=${encodedSearchTerm}&PageNumber=${pageNumber}&PageSize=${pageSize}`;
        
        // Update URL without reloading the page
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('Term', searchTerm);
        currentUrl.searchParams.set('PageNumber', pageNumber);
        history.pushState({ term: searchTerm, page: pageNumber }, '', currentUrl.toString());
        
        try {
            console.log(`Fetching: ${targetUrl}`);
            const response = await fetch(targetUrl);
            if (!response.ok) throw new Error(`HTTP error ${response.status}.`);
            
            const htmlString = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlString, 'text/html');
            
            const resultItems = doc.querySelectorAll('.RowSearchSty');
            const paginationElement = doc.querySelector('.pagination');
            const noResultsTitleElement = doc.querySelector('.txtSearchTitle1');
            const suggestionLinks = doc.querySelectorAll('.titleNotFind a');
            
            this.resultDiv.innerHTML = ''; // Clear spinner
            
            if (noResultsTitleElement && suggestionLinks.length > 0 && resultItems.length === 0) {
                this.renderNoResults(noResultsTitleElement, suggestionLinks);
                this.allResultsOnCurrentPage = [];
            } else if (resultItems.length > 0) {
                this.renderResults(resultItems, paginationElement);
            } else {
                this.renderGenericNoResults();
                this.allResultsOnCurrentPage = [];
            }
        } catch (error) { 
            console.error('Search failed:', error);
            this.renderError(error); 
            this.allResultsOnCurrentPage = []; 
        }
    },
    
    renderResults(resultItems, paginationElement) {
        const owners = new Set();
        const resultsData = Array.from(resultItems).map((item, index) => {
            const persianLinkElement = item.querySelector('.titleSearch-Link-RtlAlter a');
            const englishLinkElement = item.querySelector('.titleSearch-Link-ltrAlter a');
            const persianTitle = persianLinkElement ? persianLinkElement.textContent.trim() : 'N/A';
            let englishTitle = englishLinkElement ? englishLinkElement.textContent.trim().replace(/^\(|\)$/g, '').trim() : 'N/A';
            const detailLink = persianLinkElement ? persianLinkElement.getAttribute('href') : '#';
            const absoluteDetailLink = detailLink && detailLink !== '#' && !detailLink.startsWith('http') ? `${this.targetBaseUrl}${detailLink}` : detailLink;
            const imageElement = item.querySelector('.BoxImgSearch img');
            const imageUrl = imageElement ? `${this.targetBaseUrl}${imageElement.getAttribute('src')}` : '';
            
            let details = {}, rawPrice = '0', ownerName = '';
            item.querySelectorAll('.searchRow > .row label').forEach(label => {
                const labelText = label.textContent.trim();
                const valueElement = label.closest('.col-lg-4, .col-md-4, .col-sm-6, .col-xs-12')?.querySelector('span.txtSearch1, span.priceTxt, bdo, span.txtAlignLTR');
                if (valueElement) {
                    const valueText = valueElement.textContent.trim();
                    if (labelText.includes('صاحب برند')) { 
                        details.brandOwner = valueText; 
                        ownerName = valueText; 
                        owners.add(ownerName); 
                    } else if (labelText.includes('صاحب پروانه')) {
                        details.licenseHolder = valueText;
                    } else if (labelText.includes('قیمت هر بسته')) { 
                        rawPrice = valueText; 
                        details.price = addCommas(valueText); 
                    } else if (labelText.includes('بسته بندی')) {
                        details.packaging = valueText;
                    } else if (labelText.includes('کد فرآورده')) {
                        details.productCode = valueText;
                    } else if (labelText.includes('کد ژنریک')) {
                        details.genericCode = valueText;
                    }
                }
            });
            
            return { 
                index, 
                persianTitle, 
                englishTitle, 
                absoluteDetailLink, 
                imageUrl, 
                details, 
                rawPrice, 
                ownerName 
            };
        });
        
        const sortedOwners = Array.from(owners).sort((a, b) => a.localeCompare(b, 'fa'));
        
        // Build controls and container HTML
        let resultsContainerHtml = `
            <div class="space-y-4">
                <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex flex-col md:flex-row gap-4 items-center">
                    <div class="flex-1 w-full md:w-auto">
                        <label for="sortSelect" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">مرتب‌سازی:</label>
                        <select id="sortSelect" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500">
                            <option value="none">مرتبط‌ترین</option>
                            <option value="price-asc">قیمت (کم به زیاد)</option>
                            <option value="price-desc">قیمت (زیاد به کم)</option>
                            <option value="persian-title-asc">نام فارسی (الفبا)</option>
                            <option value="english-title-asc">نام انگلیسی (الفبا)</option>
                        </select>
                    </div>
                    <div class="flex-1 w-full md:w-auto">
                        <label for="ownerFilter" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">صاحب برند:</label>
                        <select id="ownerFilter" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500">
                            <option value="all">همه</option>
                            ${sortedOwners.map(owner => `<option value="${escapeHtml(owner)}">${escapeHtml(owner)}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div id="currentStatusIndicator" class="text-sm text-gray-600 dark:text-gray-400 p-2 text-center" aria-live="polite"></div>
                <div id="resultsList" class="space-y-4"></div>
            </div>`;
        
        this.resultDiv.innerHTML = resultsContainerHtml;
        const resultsListContainer = this.resultDiv.querySelector('#resultsList');
        
        // Use document fragment for better performance
        const fragment = document.createDocumentFragment();
        
        resultsData.forEach(data => {
            const uniqueIdBase = `item_${data.index}_${Date.now()}`;
            const itemHtml = `
                <div class="result-item bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all duration-300" data-raw-price="${data.rawPrice}" data-owner="${escapeHtml(data.ownerName)}" data-persian-title="${escapeHtml(data.persianTitle)}" data-english-title="${escapeHtml(data.englishTitle)}">
                    <div class="flex flex-col md:flex-row">
                        ${data.imageUrl ? `
                        <div class="md:w-1/4 p-4 flex items-center justify-center">
                            <a href="#" class="drug-image-container cursor-pointer" data-detail-url="${data.absoluteDetailLink}" data-drug-title="${escapeHtml(data.persianTitle)}">
                                <img src="${data.imageUrl}" alt="تصویر ${escapeHtml(data.persianTitle)}" class="max-h-40 object-contain rounded-md" loading="lazy" onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 100 100\\'%3E%3Crect width=\\'100\\' height=\\'100\\' fill=\\'%23e0e0e0\\'/%3E%3Ctext x=\\'50\\' y=\\'60\\' font-size=\\'40\\' text-anchor=\\'middle\\' fill=\\'%23999\\'%3E?%3C/text%3E%3C/svg%3E';">
                            </a>
                        </div>` : '<div class="md:w-1/4 p-4 flex items-center justify-center"><div class="w-full h-40 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center text-gray-400">بدون تصویر</div></div>'}
                        <div class="flex-grow p-4 space-y-3">
                            <div>
                                <h3 class="text-xl font-bold text-blue-800 dark:text-blue-300">${this.highlightSearchTerm(escapeHtml(data.persianTitle), this.termInput ? this.termInput.value : '')}</h3>
                                <p class="text-md text-gray-500 dark:text-gray-400" dir="ltr">${this.highlightSearchTerm(escapeHtml(data.englishTitle), this.termInput ? this.termInput.value : '')}</p>
                            </div>
                            ${data.details.price ? `<div class="text-lg font-semibold"><span class="text-gray-600 dark:text-gray-300">قیمت:</span> <span class="text-green-600 dark:text-green-400" dir="ltr">${data.details.price}</span> <span class="text-sm">ریال</span></div>` : ''}
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                ${data.details.brandOwner ? `<div><strong class="font-semibold">صاحب برند:</strong> ${escapeHtml(data.details.brandOwner)}</div>` : ''}
                                ${data.details.licenseHolder ? `<div><strong class="font-semibold">صاحب پروانه:</strong> ${escapeHtml(data.details.licenseHolder)}</div>` : ''}
                                ${data.details.packaging ? `<div><strong class="font-semibold">بسته بندی:</strong> ${escapeHtml(data.details.packaging)}</div>` : ''}
                                ${data.details.productCode ? `<div class="flex items-center gap-2"><strong class="font-semibold">کد فرآورده:</strong> <span id="prodCode_${uniqueIdBase}">${escapeHtml(data.details.productCode)}</span> <i class="fas fa-copy copy-button text-gray-400 hover:text-blue-500 cursor-pointer" role="button" tabindex="0" data-copy-target="#prodCode_${uniqueIdBase}" title="کپی"></i></div>` : ''}
                                ${data.details.genericCode ? `<div class="flex items-center gap-2"><strong class="font-semibold">کد ژنریک:</strong> <span id="genCode_${uniqueIdBase}">${escapeHtml(data.details.genericCode)}</span> <i class="fas fa-copy copy-button text-gray-400 hover:text-blue-500 cursor-pointer" role="button" tabindex="0" data-copy-target="#genCode_${uniqueIdBase}" title="کپی"></i></div>` : ''}
                            </div>
                        </div>
                    </div>
                     <div class="bg-gray-50 dark:bg-gray-700/50 p-3 text-center">
                        <a href="${data.absoluteDetailLink}" target="_blank" class="text-blue-600 dark:text-blue-400 hover:underline font-semibold" rel="noopener noreferrer">مشاهده جزئیات در سایت اصلی <i class="fas fa-external-link-alt text-xs"></i></a>
                    </div>
                </div>`;
            
            // Create a temporary div to hold the HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = itemHtml;
            fragment.appendChild(tempDiv.firstElementChild);
        });
        
        resultsListContainer.appendChild(fragment);
        
        if (paginationElement) {
            let paginationHtml = '<nav aria-label="ناوبری صفحات" class="pagination"><ul class="flex justify-center items-center gap-1 md:gap-2 mt-6">';
            
            paginationElement.querySelectorAll('li a').forEach(link => {
                const originalLinkText = link.textContent;
                const linkClass = link.parentElement.className;
                const buttonText = getIconicPaginationText(originalLinkText);
                const hrefParams = getQueryParams(link.getAttribute('href'));
                const pageNum = hrefParams['PageNumber'] ? parseInt(hrefParams['PageNumber']) : 1;
                const termForPagination = hrefParams['Term'] || (this.termInput ? this.termInput.value.trim() : '');
                
                let baseClasses = "px-3 py-2 md:px-4 md:py-2 rounded-md transition-colors text-sm md:text-base";
                let finalClasses = "";
                let ariaAttrs = `data-page="${pageNum}" data-term="${escapeHtml(termForPagination)}"`;
                
                if (linkClass.includes('active')) {
                    finalClasses = `${baseClasses} bg-blue-600 text-white font-bold cursor-default`;
                    ariaAttrs += ` aria-current="page" aria-label="صفحه ${pageNum}, صفحه فعلی"`;
                } else if (linkClass.includes('disabled')) {
                    finalClasses = `${baseClasses} bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed`;
                    ariaAttrs += ` aria-disabled="true"`;
                } else {
                    finalClasses = `${baseClasses} bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600`;
                    ariaAttrs += ` aria-label="رفتن به صفحه ${pageNum}"`;
                }
                
                paginationHtml += `<li><a href="#" class="${finalClasses}" ${ariaAttrs}>${buttonText}</a></li>`;
            });
            
            paginationHtml += '</ul></nav>';
            resultsListContainer.insertAdjacentHTML('afterend', paginationHtml);
        }
        
        this.sortSelect = this.resultDiv.querySelector('#sortSelect');
        this.ownerFilterSelect = this.resultDiv.querySelector('#ownerFilter');
        
        if(this.sortSelect) {
            const sortValue = this.currentSortKey === 'none' ? 'none' : `${this.currentSortKey}-${this.currentSortDirection}`;
            this.sortSelect.value = sortValue;
        }
        
        if(this.ownerFilterSelect) this.ownerFilterSelect.value = this.currentFilterValue;
        
        this.allResultsOnCurrentPage = Array.from(this.resultDiv.querySelectorAll('.result-item'));
        this.applySortingAndFiltering();
    },
    
    applySortingAndFiltering() {
        const resultsListUl = this.resultDiv.querySelector('#resultsList');
        if (!resultsListUl || !this.allResultsOnCurrentPage) return;
        
        // 1. Filter
        this.allResultsOnCurrentPage.forEach(item => {
            const owner = item.getAttribute('data-owner');
            const shouldShow = (this.currentFilterValue === 'all' || owner === this.currentFilterValue);
            item.style.display = shouldShow ? 'block' : 'none';
        });
        
        // 2. Sort the visible items
        const visibleItems = this.allResultsOnCurrentPage.filter(item => item.style.display !== 'none');
        
        if (this.currentSortKey !== 'none') {
            visibleItems.sort((a, b) => {
                let aValue, bValue, comparison = 0;
                
                if (this.currentSortKey === 'price') {
                    aValue = parseFloat(a.getAttribute('data-raw-price').replace(/,/g, '') || '0');
                    bValue = parseFloat(b.getAttribute('data-raw-price').replace(/,/g, '') || '0');
                    if (aValue > bValue) comparison = 1; 
                    else if (aValue < bValue) comparison = -1;
                } else { // 'persian-title' or 'english-title'
                    aValue = a.getAttribute(`data-${this.currentSortKey}`) || '';
                    bValue = b.getAttribute(`data-${this.currentSortKey}`) || '';
                    comparison = aValue.localeCompare(bValue, this.currentSortKey === 'persian-title' ? 'fa' : 'en');
                }
                
                return this.currentSortDirection === 'desc' ? comparison * -1 : comparison;
            });
        }
        
        // 3. Re-append to DOM in correct order
        visibleItems.forEach(item => resultsListUl.appendChild(item));
        this.updateStatusIndicator();
    },
    
    updateStatusIndicator() {
        const indicatorElement = this.resultDiv.querySelector('#currentStatusIndicator');
        if (!indicatorElement) return;
        
        const totalItemsOnPage = this.allResultsOnCurrentPage ? this.allResultsOnCurrentPage.length : 0;
        const visibleItemsCount = this.allResultsOnCurrentPage ? this.allResultsOnCurrentPage.filter(item => item.style.display !== 'none').length : 0;
        
        let statusText = '';
        if (totalItemsOnPage > 0) {
            statusText += `نمایش ${visibleItemsCount} از ${totalItemsOnPage} نتیجه`;
        } else if (this.termInput && this.termInput.value) {
            indicatorElement.style.display = 'none';
            return;
        }
        
        indicatorElement.textContent = statusText;
        indicatorElement.style.display = statusText ? 'block' : 'none';
    },
    
    highlightSearchTerm(text, term) {
        if (!text || !term || term.length < 1) return text;
        const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedTerm})`, 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    },
    
    renderNoResults(noResultsTitleElement, suggestionLinks) {
        const noResultsMessage = noResultsTitleElement.textContent.trim();
        
        let resultsHtml = `
             <div class="bg-yellow-100 dark:bg-gray-800 border-t-4 border-yellow-500 rounded-b text-yellow-900 dark:text-yellow-200 px-4 py-3 shadow-md text-center" role="alert">
                 <div class="py-1">
                    <p class="font-bold text-lg">${escapeHtml(noResultsMessage)}</p>
                    ${suggestionLinks.length > 0 ? `<p class="text-sm mt-2">شاید منظور شما یکی از موارد زیر است:</p>` : ''}
                 </div>
                 <ul class="suggestions-list flex flex-wrap justify-center gap-2 mt-4">`;
        
        suggestionLinks.forEach(link => {
            const suggestedText = link.textContent.trim();
            const suggestedTerm = getQueryParams(link.getAttribute('href'))['term'] || suggestedText;
            resultsHtml += `<li><a href="#" data-suggested-term="${escapeHtml(suggestedTerm)}" class="block bg-yellow-200 hover:bg-yellow-300 dark:bg-yellow-800 dark:hover:bg-yellow-700 text-sm font-medium px-3 py-1 rounded-full transition-colors">${escapeHtml(suggestedText)}</a></li>`;
        });
        
        resultsHtml += `</ul></div>`;
        this.resultDiv.innerHTML = resultsHtml;
    },
    
    renderGenericNoResults() {
        this.resultDiv.innerHTML = `<div class="bg-gray-100 dark:bg-gray-800 border-t-4 border-gray-500 rounded-b text-gray-900 dark:text-gray-200 px-4 py-3 shadow-md text-center" role="status"><p class="font-bold">نتیجه‌ای برای جستجوی شما یافت نشد.</p></div>`;
    },
    
    renderError(error) {
        console.error('Search failed:', error);
        let errorMessage = '<strong>خطا در ارتباط با سرور.</strong><p>لطفاً اتصال اینترنت خود را بررسی کرده و دوباره تلاش کنید.</p>';
        
        if (error.message.startsWith('HTTP error')) {
            errorMessage += `<p class="text-xs mt-2 text-red-600">جزئیات: ${error.message}</p>`;
        }
        
        this.resultDiv.innerHTML = `<div class="bg-red-100 border-t-4 border-red-500 rounded-b text-red-900 px-4 py-3 shadow-md" role="alert">${errorMessage}</div>`;
    }
};

// Theme Toggle Module
const theme = {
    key: 'drugSearchTheme',
    btn: null,
    sunIcon: null,
    moonIcon: null,
    
    init() {
        this.btn = document.getElementById('themeToggleBtn');
        if (!this.btn) return;
        
        this.sunIcon = this.btn.querySelector('.fa-sun');
        this.moonIcon = this.btn.querySelector('.fa-moon');
        
        this.btn.addEventListener('click', () => this.toggle());
        this.load();
    },
    
    toggle() {
        const newTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
        localStorage.setItem(this.key, newTheme);
        this.apply(newTheme);
    },
    
    apply(mode) {
        if (mode === 'dark') {
            document.documentElement.classList.add('dark');
            if (this.sunIcon) this.sunIcon.classList.add('hidden');
            if (this.moonIcon) this.moonIcon.classList.remove('hidden');
            if (this.btn) this.btn.setAttribute('aria-label', 'تغییر به حالت روشن');
        } else {
            document.documentElement.classList.remove('dark');
            if (this.sunIcon) this.sunIcon.classList.remove('hidden');
            if (this.moonIcon) this.moonIcon.classList.add('hidden');
            if (this.btn) this.btn.setAttribute('aria-label', 'تغییر به حالت تاریک');
        }
    },
    
    load() {
        const savedTheme = localStorage.getItem(this.key);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme) {
            this.apply(savedTheme);
        } else if (prefersDark) {
            this.apply('dark');
        } else {
            this.apply('light');
        }
    }
};

// Back to Top Button
const backToTopButton = document.getElementById("backToTopBtn");
if (backToTopButton) {
    window.addEventListener('scroll', debounce(() => {
        if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
            backToTopButton.classList.remove('hidden');
            backToTopButton.classList.add('flex');
        } else {
            backToTopButton.classList.remove('flex');
            backToTopButton.classList.add('hidden');
        }
    }, 100));
    
    backToTopButton.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// App Initialization
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the theme switcher first to prevent visual flicker
    theme.init();
    
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => console.log('ServiceWorker registration successful.'))
                .catch(err => console.log('ServiceWorker registration failed: ', err));
        });
    }
    
    // Defer main app init slightly to ensure smooth initial paint
    setTimeout(() => {
        SearchApp.init();
    }, 50);
});