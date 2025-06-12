// script.js

// Basic Modularity: Wrap related functions and elements in objects
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

    init: function() {
        this.imageOverlay = document.getElementById('modalOverlay');
        this.imageModal = document.getElementById('imageModal');
        this.zoomedImage = document.getElementById('zoomedImage');
        this.closeButton = document.getElementById('closeImageModalButton');
        this.prevButton = document.getElementById('prevImageButton');
        this.nextButton = document.getElementById('nextImageButton');
        this.caption = document.getElementById('modalCaption');
        this.spinner = document.getElementById('modalLoadingSpinner');
        this.miniMapContainer = document.getElementById('modalMiniMap');

        if (this.imageOverlay) this.imageOverlay.addEventListener('click', this.hide.bind(this));
        if (this.imageModal) this.imageModal.addEventListener('click', this.hide.bind(this)); 
        if (this.closeButton) {
            this.closeButton.addEventListener('click', this.hide.bind(this));
            this.closeButton.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') this.hide.bind(this)(e); });
        }
        if (this.prevButton) this.prevButton.addEventListener('click', function(e){ e.stopPropagation(); this.showPrev(); }.bind(this));
        if (this.nextButton) this.nextButton.addEventListener('click', function(e){ e.stopPropagation(); this.showNext(); }.bind(this));

        if (this.zoomedImage) this.zoomedImage.addEventListener('click', function(e){ e.stopPropagation(); });
        if (this.spinner) this.spinner.addEventListener('click', function(e){ e.stopPropagation(); });
        if (this.caption) this.caption.addEventListener('click', function(e){ e.stopPropagation(); });
        if (this.miniMapContainer) this.miniMapContainer.addEventListener('click', this.handleMiniMapClick.bind(this));


        document.addEventListener('keydown', this.handleKeydown.bind(this));
         if (this.imageModal) {
            this.imageModal.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
            this.imageModal.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
            this.imageModal.addEventListener('touchend', this.handleTouchEnd.bind(this), false);
         }
         this.xDown = null;
         this.yDown = null;
    },

     handleMiniMapClick: function(event) {
         const clickedThumbnail = event.target.closest('img');
          if (clickedThumbnail) {
              event.stopPropagation(); 
              const index = parseInt(clickedThumbnail.getAttribute('data-index'));
               if (!isNaN(index) && index !== this.currentImageIndex) {
                   this.jumpToImage(index);
               }
          }
     },

    handleTouchStart: function(evt) {
         if (this.imageModal && this.imageModal.style.display === 'flex') {
            this.xDown = evt.touches[0].clientX;
            this.yDown = evt.touches[0].clientY;
         }
    },
    handleTouchMove: function(evt) {
         if (this.imageModal && this.imageModal.style.display === 'flex') {
            if (this.xDown !== null && this.yDown !== null) {
                const xDiff = this.xDown - evt.touches[0].clientX;
                const yDiff = this.yDown - evt.touches[0].clientY;
                if (Math.abs(xDiff) > Math.abs(yDiff)) { 
                    evt.preventDefault();
                }
            }
         }
    },
    handleTouchEnd: function(evt) {
         if (this.imageModal && this.imageModal.style.display !== 'flex' || (!this.xDown && !this.yDown)) {
             return;
         }
         const xUp = evt.changedTouches[0].clientX;
         const yUp = evt.changedTouches[0].clientY;
         const xDiff = this.xDown - xUp;
         const yDiff = this.yDown - yUp;
         this.xDown = null;
         this.yDown = null;
         const sensitivity = 50;
         if (Math.abs(xDiff) > Math.abs(yDiff)) {
             if (Math.abs(xDiff) > sensitivity) {
                if (xDiff > 0) { this.showNext(); }
                else { this.showPrev(); }
             }
         }
    },
    handleKeydown: function(event) {
        if (this.imageModal && this.imageModal.style.display === 'flex') {
            if (event.key === 'Escape') { this.hide(); }
            else if (event.key === 'ArrowLeft') { event.preventDefault(); this.showPrev(); }
            else if (event.key === 'ArrowRight') { event.preventDefault(); this.showNext(); }
        }
    },
    show: function(galleryImages, thumbnailImages, drugTitle, initialIndex = 0) {
        this.currentGalleryImages = galleryImages || [];
        this.currentMiniMapThumbnails = thumbnailImages || [];
        this.currentImageIndex = initialIndex;
        this.currentDrugTitle = drugTitle || '';

        if (!this.imageOverlay || !this.imageModal || !this.closeButton || !this.caption || !this.prevButton || !this.nextButton || !this.zoomedImage || !this.spinner || !this.miniMapContainer) {
             return;
        }
        this.imageOverlay.style.display = 'block';
        this.imageModal.style.display = 'flex';
        this.closeButton.style.display = 'block';
        this.caption.style.display = 'none';
        this.prevButton.style.display = 'none';
        this.nextButton.style.display = 'none';
        this.miniMapContainer.style.display = 'none';

        setTimeout(() => {
            this.imageOverlay.style.opacity = 1;
            this.imageModal.style.opacity = 1;
            this.closeButton.style.opacity = 1;
            this.closeButton.focus();
        }, 10);
        document.body.classList.add('modal-open');
        this.renderMiniMap();
        this.displayCurrent();
    },
    hide: function() {
         if (!this.imageOverlay || !this.imageModal || !this.closeButton) return;
        this.imageOverlay.style.opacity = 0;
        this.imageModal.style.opacity = 0;
        this.closeButton.style.opacity = 0;
        if(this.caption) this.caption.style.opacity = 0;
        if(this.prevButton) this.prevButton.style.opacity = 0;
        if(this.nextButton) this.nextButton.style.opacity = 0;
        if(this.miniMapContainer) this.miniMapContainer.style.opacity = 0;

        setTimeout(() => {
            this.imageOverlay.style.display = 'none';
            this.imageModal.style.display = 'none';
            this.closeButton.style.display = 'none';
            if(this.caption) this.caption.style.display = 'none';
            if(this.prevButton) this.prevButton.style.display = 'none';
            if(this.nextButton) this.nextButton.style.display = 'none';
            if(this.miniMapContainer) this.miniMapContainer.style.display = 'none';
            if(this.zoomedImage) { this.zoomedImage.src = ''; this.zoomedImage.alt = ''; }
            if(this.spinner) this.spinner.style.display = 'none';
            if(this.zoomedImage) this.zoomedImage.style.display = 'block';
            this.currentGalleryImages = [];
            this.currentMiniMapThumbnails = [];
            this.currentImageIndex = 0;
            this.currentDrugTitle = '';
            if(this.miniMapContainer) this.miniMapContainer.innerHTML = '';
            document.body.classList.remove('modal-open');
        }, 300);
    },
     jumpToImage: function(index) {
          if (index >= 0 && index < this.currentGalleryImages.length) {
              this.currentImageIndex = index;
              this.displayCurrent();
          }
     },
    displayCurrent: function() {
        if (!this.zoomedImage || !this.spinner || !this.caption || !this.prevButton || !this.nextButton || !this.miniMapContainer) return;

        this.spinner.style.display = 'block';
        this.zoomedImage.style.display = 'none'; 
        this.zoomedImage.style.opacity = 0;      
        this.caption.style.opacity = 0;
        this.prevButton.style.opacity = 0;
        this.nextButton.style.opacity = 0;
        this.miniMapContainer.style.opacity = 0;


        if (this.currentGalleryImages.length > 0 && this.currentImageIndex >= 0 && this.currentImageIndex < this.currentGalleryImages.length) {
            const imageUrl = this.currentGalleryImages[this.currentImageIndex];
            this.zoomedImage.alt = this.currentDrugTitle || `تصویر ${this.currentImageIndex + 1}`;

            const tempImg = new Image();
            tempImg.onload = () => {
                 this.spinner.style.display = 'none';
                 this.zoomedImage.src = tempImg.src; 
                 this.zoomedImage.style.display = 'block';
                 this.updateMiniMapActiveState();
                 setTimeout(() => {
                     this.zoomedImage.style.opacity = 1;
                     this.caption.textContent = `${this.currentDrugTitle ? escapeHtml(this.currentDrugTitle) + ' - ' : ''}${this.currentImageIndex + 1} از ${this.currentGalleryImages.length}`;
                     this.caption.style.display = 'block';
                     this.caption.style.opacity = 1;
                      if (this.currentGalleryImages.length > 1) {
                           this.prevButton.style.display = 'flex'; this.prevButton.style.opacity = 1;
                           this.nextButton.style.display = 'flex'; this.nextButton.style.opacity = 1;
                      } else {
                           this.prevButton.style.display = 'none';
                           this.nextButton.style.display = 'none';
                      }
                      if (this.miniMapContainer && this.currentMiniMapThumbnails.length > 0) {
                           this.miniMapContainer.style.display = 'block';
                          setTimeout(() => { this.miniMapContainer.style.opacity = 1; }, 50);
                      }
                 }, 20); 
            };
            tempImg.onerror = () => {
                 this.spinner.style.display = 'none';
                 this.zoomedImage.style.display = 'none';
                 this.caption.textContent = 'خطا در بارگذاری عکس';
                 this.caption.style.display = 'block';
                 this.caption.style.opacity = 1;
                 this.prevButton.style.display = 'none';
                 this.nextButton.style.display = 'none';
                 this.miniMapContainer.style.display = 'none';
                 console.error('Failed to load image:', imageUrl);
            };
            tempImg.src = imageUrl;
        } else {
            this.zoomedImage.src = ''; this.zoomedImage.alt = ''; this.zoomedImage.style.display = 'none';
            this.caption.textContent = 'عکسی یافت نشد.'; this.caption.style.display = 'block'; this.caption.style.opacity = 1;
            this.prevButton.style.display = 'none';
            this.nextButton.style.display = 'none';
            this.spinner.style.display = 'none';
            this.miniMapContainer.style.display = 'none';
        }
    },
     renderMiniMap: function() {
         if (!this.miniMapContainer || !this.currentMiniMapThumbnails) return;
         this.miniMapContainer.innerHTML = '';
         if (this.currentMiniMapThumbnails.length > 0) {
              this.currentMiniMapThumbnails.forEach((thumbUrl, index) => {
                   const thumbImg = document.createElement('img');
                   thumbImg.src = thumbUrl;
                   thumbImg.alt = `نمای کوچک ${index + 1} از ${escapeHtml(this.currentDrugTitle)}`;
                   thumbImg.setAttribute('data-index', index);
                   thumbImg.loading = 'lazy';
                   this.miniMapContainer.appendChild(thumbImg);
              });
         } else {
              this.miniMapContainer.style.display = 'none';
         }
     },
     updateMiniMapActiveState: function() {
         if (!this.miniMapContainer) return;
         const thumbnails = this.miniMapContainer.querySelectorAll('img');
         if (thumbnails.length === 0) return;
         thumbnails.forEach((thumb, index) => {
             if (index === this.currentImageIndex) {
                  thumb.classList.add('active');
                  thumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
             } else {
                  thumb.classList.remove('active');
             }
         });
     },
    showNext: function() {
         if (this.currentGalleryImages.length <= 1) return;
         this.currentImageIndex = (this.currentImageIndex + 1) % this.currentGalleryImages.length;
         this.displayCurrent();
    },
    showPrev: function() {
         if (this.currentGalleryImages.length <= 1) return;
         this.currentImageIndex = (this.currentImageIndex - 1 + this.currentGalleryImages.length) % this.currentGalleryImages.length;
         this.displayCurrent();
    }
};

const SearchApp = {
    searchForm: null, termInput: null, resultDiv: null, mainLoadingSpinner: null,
    initialMessage: null, corsWarning: null, clearInputButton: null,
    searchHistoryDiv: null, searchHistoryListUl: null, statusIndicator: null,
    ownerFilterSelect: null, sortSelect: null,
    currentSortKey: 'none', currentSortDirection: 'asc',
    currentFilterKey: 'owner', currentFilterValue: 'all',
    allResultsOnCurrentPage: [],
    LOCAL_STORAGE_HISTORY_KEY: 'drugSearchHistory', MAX_HISTORY_ITEMS: 5,
    LOCAL_STORAGE_SORT_KEY: 'drugSearchSortKey',
    LOCAL_STORAGE_SORT_DIR_KEY: 'drugSearchSortDir',
    LOCAL_STORAGE_FILTER_VAL_KEY: 'drugSearchFilterVal',
    // LOCAL_STORAGE_THEME_KEY defined globally below
    targetBaseUrl: 'https://irc.fda.gov.ir', searchEndpoint: '/nfi/Search',

    init: function() {
        this.searchForm = document.querySelector('#subscribe .subscribe-inputs1 form');
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
            this.termInput.addEventListener('input', this.handleClearButtonVisibility.bind(this));
        }
        if (this.clearInputButton) {
             this.clearInputButton.addEventListener('click', this.handleClearInputClick.bind(this));
             this.clearInputButton.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') this.handleClearInputClick.bind(this)(e); });
        }

         const urlParams = getQueryParams(window.location.search);
         const initialTerm = urlParams['Term'] || '';
         const initialPage = urlParams['PageNumber'] ? parseInt(urlParams['PageNumber']) : 1;
         if (initialTerm) {
             if(this.termInput) this.termInput.value = initialTerm;
              this.handleInputDirection();
              this.handleClearButtonVisibility();
             this.performSearch(initialTerm, initialPage);
         } else {
              this.showInitialMessages();
         }
         window.addEventListener('popstate', this.handlePopstate.bind(this));
    },

    loadUserPreferences: function() {
        const savedSortKey = localStorage.getItem(this.LOCAL_STORAGE_SORT_KEY);
        const savedSortDir = localStorage.getItem(this.LOCAL_STORAGE_SORT_DIR_KEY);
        const savedFilterVal = localStorage.getItem(this.LOCAL_STORAGE_FILTER_VAL_KEY);

        if (savedSortKey) {
            this.currentSortKey = savedSortKey;
        }
        if (savedSortDir) {
            this.currentSortDirection = savedSortDir;
        }
        if (savedFilterVal) {
            this.currentFilterValue = savedFilterVal;
        }
    },

     showInitialMessages: function() {
          if (this.initialMessage) this.initialMessage.style.display = 'block';
          if (this.mainLoadingSpinner && this.mainLoadingSpinner.parentElement === this.resultDiv) {
               this.mainLoadingSpinner.parentElement.remove();
           }
          this.resultDiv.classList.remove('loading-container', 'error');
          const statusIndicator = this.resultDiv.querySelector('#currentStatusIndicator');
          if(statusIndicator) statusIndicator.style.display = 'none';
     },
     handlePopstate: function(event) {
         const urlParams = getQueryParams(window.location.search);
         const poppedTerm = urlParams['Term'] || '';
         const poppedPage = urlParams['PageNumber'] ? parseInt(urlParams['PageNumber']) : 1;
         const currentTerm = this.termInput ? this.termInput.value.trim() : '';
         const currentPage = getQueryParams(window.location.search)['PageNumber'] || 1;

         if (poppedTerm !== currentTerm || poppedPage !== parseInt(currentPage)) {
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
         } else if (!poppedTerm && currentTerm) {
             if (this.termInput) this.termInput.value = '';
             this.resultDiv.innerHTML = '';
             this.showInitialMessages();
         }
     },
    handleInputDirection: function() {
        if (!this.termInput) return;
        const value = this.termInput.value;
        const rtlRegex = /[\u0600-\u06FF]/;
        const inputContainer = this.termInput.parentElement;
        if (rtlRegex.test(value) || value === '') {
            this.termInput.style.direction = 'rtl';
            this.termInput.style.textAlign = 'right';
            if (inputContainer) inputContainer.setAttribute('dir', 'rtl');
        } else {
            this.termInput.style.direction = 'ltr';
            this.termInput.style.textAlign = 'left';
            if (inputContainer) inputContainer.setAttribute('dir', 'ltr');
        }
    },
     handleClearButtonVisibility: function() {
         if (!this.termInput || !this.clearInputButton) return;
         this.clearInputButton.style.display = this.termInput.value.length > 0 ? 'block' : 'none';
     },
     handleClearInputClick: function(event) {
         if(event) event.preventDefault();
         if (!this.termInput) return;
         this.termInput.value = '';
         const inputEvent = new Event('input', { bubbles: true });
         this.termInput.dispatchEvent(inputEvent);
         this.termInput.focus();
         this.resultDiv.innerHTML = '';
         this.showInitialMessages();
         history.pushState({}, '', window.location.pathname);
         this.currentSortKey = 'none'; this.currentSortDirection = 'asc';
         this.currentFilterKey = 'owner'; this.currentFilterValue = 'all';
         localStorage.removeItem(this.LOCAL_STORAGE_SORT_KEY);
         localStorage.removeItem(this.LOCAL_STORAGE_SORT_DIR_KEY);
         localStorage.removeItem(this.LOCAL_STORAGE_FILTER_VAL_KEY);
         this.allResultsOnCurrentPage = [];
     },
    attachEventListeners: function() {
         if (this.searchForm) this.searchForm.addEventListener('submit', this.handleSearchSubmit.bind(this));
         if (this.resultDiv) this.resultDiv.addEventListener('click', this.handleResultAreaClick.bind(this));
         if (this.searchHistoryListUl) this.searchHistoryListUl.addEventListener('click', this.handleHistoryItemClick.bind(this));
         if (this.resultDiv) {
            this.resultDiv.addEventListener('change', (event) => {
                if (event.target.closest('.sort-controls select')) {
                    this.handleSortChange(event);
                } else if (event.target.closest('.filter-controls select')) {
                    this.handleFilterChange(event);
                }
            });
         }
    },
     handleSearchSubmit: function(event) {
        event.preventDefault();
        const searchTerm = this.termInput ? this.termInput.value.trim() : '';
        if (!searchTerm) {
             if (this.resultDiv) {
                 this.resultDiv.innerHTML = '';
                 this.resultDiv.className = 'error';
                 this.resultDiv.innerHTML = `<div role="alert"><p style="color: red; text-align: center;">لطفاً کلمه کلیدی برای جستجو وارد نمایید!</p></div>`;
             }
            return;
        }
         this.currentSortKey = 'none'; this.currentSortDirection = 'asc';
         this.currentFilterKey = 'owner'; this.currentFilterValue = 'all';
         localStorage.removeItem(this.LOCAL_STORAGE_SORT_KEY);
         localStorage.removeItem(this.LOCAL_STORAGE_SORT_DIR_KEY);
         localStorage.removeItem(this.LOCAL_STORAGE_FILTER_VAL_KEY);

         this.performSearch(searchTerm);
         this.saveSearchTermToHistory(searchTerm);
     },
     handleResultAreaClick: async function(event) {
         const clickedImageContainer = event.target.closest('.drug-card .card-image');
         const clickedSuggestionLink = event.target.closest('.suggestions-list a');
         const clickedExpandButton = event.target.closest('.expand-details-button');
         const clickedCopyButton = event.target.closest('.copy-button');

         if (clickedImageContainer) {
            event.preventDefault();
            const detailUrl = clickedImageContainer.getAttribute('data-detail-url');
            const drugTitle = clickedImageContainer.getAttribute('data-drug-title');
            await this.fetchAndShowImageModal(detailUrl, drugTitle);
         } else if (clickedSuggestionLink) {
             event.preventDefault();
             const suggestedTerm = clickedSuggestionLink.getAttribute('data-suggested-term');
             if (suggestedTerm && this.termInput) {
                 this.termInput.value = suggestedTerm;
                 this.handleInputDirection(); 
                 this.handleClearButtonVisibility(); 
                 this.performSearch(suggestedTerm);
             }
         } else if (clickedExpandButton) {
              const detailsSection = clickedExpandButton.previousElementSibling;
               if (detailsSection && detailsSection.classList.contains('other-details')) {
                    const isExpanded = detailsSection.classList.toggle('expanded');
                    clickedExpandButton.classList.toggle('expanded');
                    clickedExpandButton.setAttribute('aria-expanded', isExpanded);
               }
         } else if (clickedCopyButton) {
             const targetSelector = clickedCopyButton.getAttribute('data-copy-target');
              const textToCopyElement = clickedCopyButton.closest('.detail-row')?.querySelector(targetSelector);
               if (textToCopyElement) {
                    const textToCopy = textToCopyElement.textContent.trim();
                    copyTextToClipboard(textToCopy);
                    clickedCopyButton.classList.add('copied', 'icon-copied');
                     setTimeout(() => {
                         clickedCopyButton.classList.remove('copied', 'icon-copied');
                     }, 1500);
               }
         }
    },
    handleSortChange: function(event) {
         const changedSelect = event.target.closest('.sort-controls select');
          if (changedSelect) {
              const selectedValue = changedSelect.value;
              const [sortKey, sortDirection] = selectedValue.split('-');
               this.currentSortKey = sortKey;
               this.currentSortDirection = sortDirection || 'asc';

               localStorage.setItem(this.LOCAL_STORAGE_SORT_KEY, this.currentSortKey);
               localStorage.setItem(this.LOCAL_STORAGE_SORT_DIR_KEY, this.currentSortDirection);

               if (this.currentSortKey !== 'none') {
                   this.sortResults(this.currentSortKey, this.currentSortDirection);
               } else {
                   this.filterResults(this.currentFilterKey, this.currentFilterValue);
               }
               this.updateStatusIndicator();
          }
    },
    handleFilterChange: function(event) {
         const changedSelect = event.target.closest('.filter-controls select');
          if (changedSelect) {
              const filterKey = changedSelect.getAttribute('data-filter-key');
              const filterValue = changedSelect.value;
               if (filterKey) {
                    this.currentFilterKey = filterKey; 
                    this.currentFilterValue = filterValue;

                    localStorage.setItem(this.LOCAL_STORAGE_FILTER_VAL_KEY, this.currentFilterValue);
                    
                    this.filterResults(filterKey, filterValue);
                     if (this.currentSortKey !== 'none') {
                         this.sortResults(this.currentSortKey, this.currentSortDirection);
                     }
                    this.updateStatusIndicator();
               }
          }
    },
     handleHistoryItemClick: function(event) {
         const clickedLink = event.target.closest('.search-history li a');
         if (clickedLink) {
             event.preventDefault();
             const searchTerm = clickedLink.getAttribute('data-term');
             if (searchTerm && this.termInput) {
                 this.termInput.value = searchTerm;
                 this.handleInputDirection();
                 this.handleClearButtonVisibility();
                 this.currentSortKey = 'none'; this.currentSortDirection = 'asc';
                 this.currentFilterKey = 'owner'; this.currentFilterValue = 'all';
                 localStorage.removeItem(this.LOCAL_STORAGE_SORT_KEY);
                 localStorage.removeItem(this.LOCAL_STORAGE_SORT_DIR_KEY);
                 localStorage.removeItem(this.LOCAL_STORAGE_FILTER_VAL_KEY);
                 this.performSearch(searchTerm);
             }
         }
     },
     loadSearchHistory: function() {
         if (!this.searchHistoryDiv || !this.searchHistoryListUl) return;
         try {
             const history = JSON.parse(localStorage.getItem(this.LOCAL_STORAGE_HISTORY_KEY)) || [];
             this.renderSearchHistory(history);
         } catch (e) { localStorage.removeItem(this.LOCAL_STORAGE_HISTORY_KEY); this.renderSearchHistory([]); }
     },
     saveSearchTermToHistory: function(term) {
          if (!term || term.length < 2) return;
          let history = JSON.parse(localStorage.getItem(this.LOCAL_STORAGE_HISTORY_KEY)) || [];
          history = history.filter(item => item.toLowerCase() !== term.toLowerCase());
          history.unshift(term);
          if (history.length > this.MAX_HISTORY_ITEMS) {
              history = history.slice(0, this.MAX_HISTORY_ITEMS);
          }
          try {
              localStorage.setItem(this.LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(history));
              this.renderSearchHistory(history);
          } catch (e) { console.error("Error saving history:", e); }
     },
     renderSearchHistory: function(history) {
         if (!this.searchHistoryDiv || !this.searchHistoryListUl) return;
         this.searchHistoryListUl.innerHTML = '';
         if (history && history.length > 0) {
             history.forEach(term => {
                 const li = document.createElement('li');
                 const a = document.createElement('a');
                 a.href = '#';
                 a.textContent = escapeHtml(term);
                 a.setAttribute('data-term', term);
                 li.appendChild(a);
                 this.searchHistoryListUl.appendChild(li);
             });
             this.searchHistoryDiv.style.display = 'block';
         } else {
             this.searchHistoryDiv.style.display = 'none';
         }
     },
     fetchAndShowImageModal: async function(detailUrl, drugTitle) {
         if (!ImageModal.imageOverlay || !ImageModal.imageModal || !ImageModal.spinner) return;
         ImageModal.spinner.style.display = 'block';
         ImageModal.show([],[], drugTitle); 
         if (ImageModal.caption) ImageModal.caption.style.display = 'none';
         if (ImageModal.prevButton) ImageModal.prevButton.style.display = 'none';
         if (ImageModal.nextButton) ImageModal.nextButton.style.display = 'none';
         if (ImageModal.zoomedImage) ImageModal.zoomedImage.style.display = 'none';
         if (ImageModal.miniMapContainer) ImageModal.miniMapContainer.style.display = 'none';

         try {
             const detailResponse = await fetch(detailUrl);
             const detailHtmlString = await detailResponse.text();
             if (!detailResponse.ok) {
                   throw new Error(`HTTP error ${detailResponse.status}.`);
             }
             const parser = new DOMParser();
             const detailDoc = parser.parseFromString(detailHtmlString, 'text/html');
             
             const galleryLinkElements = detailDoc.querySelectorAll('.searchBox1 a[data-lightbox="image-1"], .alignBtn a[data-lightbox="image-1"]');

             let tempImageUrls = [];
             let tempThumbnailUrls = [];

             galleryLinkElements.forEach((linkElement, idx) => {
                 const rawFullHref = linkElement.getAttribute('href');
                 
                 if (rawFullHref && rawFullHref.trim() !== '' && rawFullHref.trim() !== '#') {
                    let absoluteFullHref = rawFullHref.startsWith('/') ? 
                                           `${this.targetBaseUrl}${rawFullHref}` : 
                                           rawFullHref;
                    
                    if (absoluteFullHref === this.targetBaseUrl || 
                        absoluteFullHref === (this.targetBaseUrl + '/') ||
                        absoluteFullHref.endsWith('/#')
                        ) {
                        return; 
                    }

                    tempImageUrls.push(absoluteFullHref);

                    const thumbImg = linkElement.querySelector('img');
                    const rawThumbSrc = thumbImg ? thumbImg.getAttribute('src') : null;

                    if (rawThumbSrc && rawThumbSrc.trim() !== '' && rawThumbSrc.trim() !== '#') {
                        let absoluteThumbSrc = rawThumbSrc.startsWith('/') ? 
                                               `${this.targetBaseUrl}${rawThumbSrc}` : 
                                               rawThumbSrc;
                        tempThumbnailUrls.push(absoluteThumbSrc);
                    } else {
                        tempThumbnailUrls.push(absoluteFullHref); 
                    }
                 }
             });

             let finalImageUrls = [];
             let finalThumbnailUrls = [];

             if (tempImageUrls.length > 1) {
                 finalImageUrls = tempImageUrls.slice(0, -1);
                 if (tempThumbnailUrls.length === tempImageUrls.length) { 
                     finalThumbnailUrls = tempThumbnailUrls.slice(0, -1);
                 } else if (tempThumbnailUrls.length > 1) {  
                     finalThumbnailUrls = tempThumbnailUrls.slice(0, -1);
                     console.warn("Thumbnail/image URL array lengths mismatched. Sliced thumbnails independently.");
                 } else {  
                     finalThumbnailUrls = finalImageUrls; 
                     console.warn("Thumbnail/image URL array lengths mismatched significantly or not enough thumbnails. Using (sliced) full image URLs for thumbnails.");
                 }
             } else {
                 finalImageUrls = tempImageUrls;
                 finalThumbnailUrls = tempThumbnailUrls;
             }

             if (finalImageUrls.length > 0) {
                  ImageModal.show(finalImageUrls, finalThumbnailUrls, drugTitle, 0);
             } else {
                  if (ImageModal.spinner) ImageModal.spinner.style.display = 'none';
                  if (ImageModal.caption) {
                     ImageModal.caption.textContent = 'عکسی در صفحه جزئیات یافت نشد.';
                     ImageModal.caption.style.display = 'block';
                     ImageModal.caption.style.opacity = 1;
                 }
                 ImageModal.currentGalleryImages = []; ImageModal.currentMiniMapThumbnails = []; ImageModal.currentImageIndex = 0;
             }

         } catch (detailError) {
             console.error('Error fetching detail page for images:', detailError);
              if (ImageModal.spinner) ImageModal.spinner.style.display = 'none';
             if (ImageModal.caption) {
                 ImageModal.caption.textContent = `خطا: ${detailError.message}`;
                 ImageModal.caption.style.display = 'block';
                 ImageModal.caption.style.opacity = 1;
             }
             ImageModal.currentGalleryImages = []; ImageModal.currentMiniMapThumbnails = []; ImageModal.currentImageIndex = 0;
         }
     },
    performSearch: async function(searchTerm, pageNumber = 1, pageSize = 10) {
         if (!this.resultDiv) return;
         this.resultDiv.innerHTML = '';
         const mainSpinnerContainer = document.createElement('div');
         mainSpinnerContainer.className = 'loading-container';
         mainSpinnerContainer.setAttribute('role', 'status');
         const mainSpinnerElement = document.createElement('div');
         mainSpinnerElement.className = 'spinner';
         const loadingMessage = document.createElement('p');
         loadingMessage.textContent = `در حال جستجو برای "${escapeHtml(searchTerm)}" صفحه ${pageNumber}...`;
         mainSpinnerContainer.appendChild(mainSpinnerElement);
         mainSpinnerContainer.appendChild(loadingMessage);
         this.resultDiv.appendChild(mainSpinnerContainer);
         this.mainLoadingSpinner = mainSpinnerElement;

        const encodedSearchTerm = encodeURIComponent(searchTerm);
        const targetUrl = `${this.targetBaseUrl}${this.searchEndpoint}?Term=${encodedSearchTerm}&PageNumber=${pageNumber}&PageSize=${pageSize}`;
        const url = new URL(window.location.href);
        url.searchParams.set('Term', searchTerm);
        url.searchParams.set('PageNumber', pageNumber);
        history.pushState({ term: searchTerm, page: pageNumber }, '', url.toString());

        try {
            const response = await fetch(targetUrl);
            const htmlString = await response.text();
            if (!response.ok) throw new Error(`HTTP error ${response.status}.`);
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlString, 'text/html');
            const resultItems = doc.querySelectorAll('.RowSearchSty');
            let paginationElement = doc.querySelector('.pagination');
            const noResultsTitleElement = doc.querySelector('.txtSearchTitle1');
            const suggestionLinks = doc.querySelectorAll('.titleNotFind a');
            this.resultDiv.innerHTML = '';
            if (noResultsTitleElement && suggestionLinks.length > 0 && resultItems.length === 0) {
                 this.renderNoResults(noResultsTitleElement, suggestionLinks);
                 this.allResultsOnCurrentPage = [];
            } else if (resultItems.length > 0) {
                 this.renderResults(resultItems, paginationElement);
            } else {
                 this.renderGenericNoResults();
                 this.allResultsOnCurrentPage = [];
            }
        } catch (error) { this.renderError(error); this.allResultsOnCurrentPage = []; }
    },
     renderResults: function(resultItems, paginationElement) {
         const owners = new Set();
         resultItems.forEach(item => {
             item.querySelectorAll('.searchRow > .row label').forEach(label => {
                 if (label.textContent.trim().includes('صاحب برند')) {
                     const valueElement = label.closest('.col-lg-4, .col-md-4, .col-sm-6, .col-xs-12')?.querySelector('span.txtSearch1, span.priceTxt, bdo, span.txtAlignLTR');
                     if (valueElement) owners.add(valueElement.textContent.trim());
                 }
             });
         });
         const sortedOwners = Array.from(owners).sort((a,b) => a.localeCompare(b, 'fa'));
         let resultsHtml = `<h3 style="color: #1f3a65; margin-bottom: 20px; text-align: right; font-size: 1.4rem;">نتایج جستجو:</h3>
             <div class="sort-controls">
                 <label for="sortSelect">مرتب‌سازی:</label>
                 <select id="sortSelect" aria-label="گزینه مرتب سازی نتایج">
                      <option value="none">مرتبط‌ترین</option>
                      <option value="price-asc">قیمت (کم به زیاد)</option>
                      <option value="price-desc">قیمت (زیاد به کم)</option>
                      <option value="persian-title-asc">نام فارسی (الفبا)</option>
                      <option value="english-title-asc">نام انگلیسی (الفبا)</option>
                 </select>
             </div>
             <div class="filter-controls">
                  <div class="filter-group">
                     <label for="ownerFilter">صاحب برند:</label>
                     <select id="ownerFilter" data-filter-key="owner" aria-label="فیلتر بر اساس صاحب برند">
                         <option value="all">همه</option>
                         ${sortedOwners.map(owner => `<option value="${escapeHtml(owner)}">${escapeHtml(owner)}</option>`).join('')}
                     </select>
                  </div>
             </div>
            <div id="currentStatusIndicator" aria-live="polite" style="display: none;"></div>
            <ul id="resultsList" class="results-list">`;

        resultItems.forEach((item, index) => { 
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
                     if (labelText.includes('صاحب برند')) { details.brandOwner = valueText; ownerName = valueText;}
                     else if (labelText.includes('صاحب پروانه')) details.licenseHolder = valueText;
                     else if (labelText.includes('قیمت هر بسته')) { rawPrice = valueText; details.price = addCommas(valueText);}
                     else if (labelText.includes('بسته بندی')) details.packaging = valueText;
                     else if (labelText.includes('کد فرآورده')) details.productCode = valueText;
                     else if (labelText.includes('کد ژنریک')) details.genericCode = valueText;
                 }
            });
            const uniqueIdBase = `item_${index}_${Date.now()}`; 

            resultsHtml += `
                <li class="result-item">
                    <div class="drug-card" data-raw-price="${rawPrice}" data-owner="${escapeHtml(ownerName)}">
                        ${imageUrl ? `<div class="card-image" data-detail-url="${absoluteDetailLink}" data-drug-title="${escapeHtml(persianTitle)}"><img src="${imageUrl}" alt="تصویر ${escapeHtml(persianTitle)}" loading="lazy" onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 100 100\\'%3E%3Crect width=\\'100\\' height=\\'100\\' fill=\\'%23e0e0e0\\'/%3E%3Ctext x=\\'50\\' y=\\'60\\' font-size=\\'40\\' text-anchor=\\'middle\\' fill=\\'%23999\\'%3E?%3C/text%3E%3C/svg%3E'; this.style.objectFit='contain';" /></div>` : ''}
                        <div class="card-content">
                            <h3>${this.highlightSearchTerm(escapeHtml(persianTitle), this.termInput ? this.termInput.value : '')}</h3>
                            <p class="english-title" dir="ltr">${this.highlightSearchTerm(escapeHtml(englishTitle), this.termInput ? this.termInput.value : '')}</p>
                            <div class="main-details">${details.price ? `<div class="price-group"><span class="price-label">قیمت:</span><span class="price" dir="ltr">${details.price}</span><span class="price-unit">ریال</span></div>` : ''}</div>
                            <div class="other-details">
                                 ${ownerName ? `<div class="detail-row"><label>صاحب برند:</label> <span>${escapeHtml(ownerName)}</span></div>` : ''}
                                 ${details.licenseHolder ? `<div class="detail-row"><label>صاحب پروانه:</label> <span>${escapeHtml(details.licenseHolder)}</span></div>` : ''}
                                 ${details.packaging ? `<div class="detail-row"><label>بسته بندی:</label> <bdo>${escapeHtml(details.packaging)}</bdo></div>` : ''}
                                ${details.productCode ? `<div class="detail-row"><label>کد فرآورده:</label> <span class="copy-text" id="prodCode_${uniqueIdBase}">${escapeHtml(details.productCode)}</span> <i class="fas fa-copy copy-button" role="button" tabindex="0" data-copy-target="#prodCode_${uniqueIdBase}" title="کپی کردن کد فرآورده" aria-label="کپی کردن کد فرآورده ${escapeHtml(details.productCode)}"></i></div>` : ''}
                                ${details.genericCode ? `<div class="detail-row"><label>کد ژنریک:</label> <span class="copy-text" id="genCode_${uniqueIdBase}">${escapeHtml(details.genericCode)}</span> <i class="fas fa-copy copy-button" role="button" tabindex="0" data-copy-target="#genCode_${uniqueIdBase}" title="کپی کردن کد ژنریک" aria-label="کپی کردن کد ژنریک ${escapeHtml(details.genericCode)}"></i></div>` : ''}
                            </div>
                            <button class="expand-details-button" aria-expanded="false"></button>
                            <a href="${absoluteDetailLink}" target="_blank" class="detail-link" rel="noopener noreferrer">مشاهده جزئیات در سایت اصلی</a>
                        </div>
                    </div>
                </li>`;
        });
        resultsHtml += '</ul>';
        if (paginationElement) {
            resultsHtml += '<div class="pagination-container"><ul class="pagination" role="navigation" aria-label="ناوبری صفحات">';
            paginationElement.querySelectorAll('li a').forEach(link => {
                const originalLinkText = link.textContent;
                const linkClass = link.parentElement.className;
                const buttonText = getIconicPaginationText(originalLinkText);
                const hrefParams = getQueryParams(link.getAttribute('href'));
                const pageNum = hrefParams['PageNumber'] ? parseInt(hrefParams['PageNumber']) : 1;
                const termForPagination = hrefParams['Term'] || (this.termInput ? this.termInput.value.trim() : '');
                let ariaAttrs = `data-page="${pageNum}" data-term="${escapeHtml(termForPagination)}"`;
                if (linkClass.includes('active')) ariaAttrs += ` aria-current="page" aria-label="صفحه ${pageNum}, صفحه فعلی"`;
                else ariaAttrs += ` aria-label="رفتن به صفحه ${pageNum}"`;
                if (linkClass.includes('disabled')) ariaAttrs += ` aria-disabled="true"`;

                resultsHtml += `<li class="${linkClass}"><a href="#" ${ariaAttrs}>${buttonText}</a></li>`;
            });
           resultsHtml += '</ul></div>';
        }
        this.resultDiv.innerHTML = resultsHtml;

        if (this.resultDiv.querySelector('.pagination')) {
             this.resultDiv.querySelectorAll('.pagination a:not([aria-disabled="true"])').forEach(link => {
                  link.addEventListener('click', function(e) {
                      e.preventDefault();
                      const page = this.getAttribute('data-page');
                      const term = this.getAttribute('data-term');
                      if (page && term) {
                          if(SearchApp.termInput) SearchApp.termInput.value = term;
                           SearchApp.currentSortKey = 'none'; SearchApp.currentSortDirection = 'asc';
                           SearchApp.currentFilterKey = 'owner'; SearchApp.currentFilterValue = 'all';
                           localStorage.removeItem(SearchApp.LOCAL_STORAGE_SORT_KEY);
                           localStorage.removeItem(SearchApp.LOCAL_STORAGE_SORT_DIR_KEY);
                           localStorage.removeItem(SearchApp.LOCAL_STORAGE_FILTER_VAL_KEY);
                          SearchApp.performSearch(term, parseInt(page));
                      }
                  });
             });
         }
         this.ownerFilterSelect = this.resultDiv.querySelector('#ownerFilter');
         this.sortSelect = this.resultDiv.querySelector('#sortSelect');
         this.statusIndicator = this.resultDiv.querySelector('#currentStatusIndicator');
        
        if(this.ownerFilterSelect) this.ownerFilterSelect.value = this.currentFilterValue;
        if(this.sortSelect) {
            const sortValue = this.currentSortKey === 'none' ? 'none' : `${this.currentSortKey}-${this.currentSortDirection}`;
            this.sortSelect.value = sortValue;
        }


        const resultsListUl = this.resultDiv.querySelector('#resultsList');
        if(resultsListUl) {
            this.allResultsOnCurrentPage = Array.from(resultsListUl.querySelectorAll('li.result-item'));
            this.filterResults(this.currentFilterKey, this.currentFilterValue);
            if (this.currentSortKey !== 'none') {
                this.sortResults(this.currentSortKey, this.currentSortDirection);
            }
            this.updateStatusIndicator();
            this.allResultsOnCurrentPage.forEach(item => {
                const otherDetails = item.querySelector('.other-details');
                const expandButton = item.querySelector('.expand-details-button');
                if (otherDetails && expandButton) {
                    const isCollapsible = otherDetails.scrollHeight > otherDetails.clientHeight + 5; 
                    otherDetails.classList.toggle('is-collapsible', isCollapsible);
                    expandButton.style.display = isCollapsible ? 'block' : 'none';
                    expandButton.setAttribute('aria-expanded', otherDetails.classList.contains('expanded'));
                }
            });
        } else { this.allResultsOnCurrentPage = []; this.updateStatusIndicator(); }
     },
     sortResults: function(sortKey, sortDirection) {
         const resultsListUl = this.resultDiv.querySelector('#resultsList');
         if (!resultsListUl || !this.allResultsOnCurrentPage || this.allResultsOnCurrentPage.length === 0) return;
         this.allResultsOnCurrentPage.sort((a, b) => {
             let aValue, bValue, comparison = 0;
             if (sortKey === 'price') {
                 aValue = parseFloat((a.querySelector('.drug-card')?.getAttribute('data-raw-price') || '0').replace(/,/g, ''));
                 bValue = parseFloat((b.querySelector('.drug-card')?.getAttribute('data-raw-price') || '0').replace(/,/g, ''));
                 if (isNaN(aValue)) aValue = sortDirection === 'asc' ? Infinity : -Infinity; 
                 if (isNaN(bValue)) bValue = sortDirection === 'asc' ? Infinity : -Infinity;
                 if (aValue > bValue) comparison = 1; else if (aValue < bValue) comparison = -1;
             } else if (sortKey === 'persian-title') {
                 aValue = a.querySelector('h3')?.textContent.trim() || '';
                 bValue = b.querySelector('h3')?.textContent.trim() || '';
                 comparison = aValue.localeCompare(bValue, 'fa', {sensitivity: 'base'});
             } else if (sortKey === 'english-title') {
                 aValue = a.querySelector('.english-title')?.textContent.trim() || '';
                 bValue = b.querySelector('.english-title')?.textContent.trim() || '';
                 comparison = aValue.localeCompare(bValue, 'en', {sensitivity: 'base'});
             }
             return sortDirection === 'desc' ? comparison * -1 : comparison;
         });
         const fragment = document.createDocumentFragment();
         this.allResultsOnCurrentPage.forEach(item => {
             if (item.style.display !== 'none') fragment.appendChild(item);
         });
         resultsListUl.innerHTML = '';
         resultsListUl.appendChild(fragment);
     },
     filterResults: function(filterKey, filterValue) {
         const resultsListUl = this.resultDiv.querySelector('#resultsList');
          if (!resultsListUl || !this.allResultsOnCurrentPage || this.allResultsOnCurrentPage.length === 0) {
             this.updateStatusIndicator(); 
             return;
         }
         const activeFilters = [];
         if (this.currentFilterKey === 'owner' && this.currentFilterValue !== 'all') {
             activeFilters.push({ key: 'owner', value: this.currentFilterValue });
         }
         this.allResultsOnCurrentPage.forEach(item => {
             const drugCard = item.querySelector('.drug-card');
             if (!drugCard) return;
             let showItem = true;
             for (const filter of activeFilters) {
                 const itemValue = drugCard.getAttribute(`data-${filter.key}`);
                 if (itemValue !== filter.value) { showItem = false; break; }
             }
             item.style.display = showItem ? 'list-item' : 'none';
         });
          if (this.currentSortKey !== 'none') {
              this.sortResults(this.currentSortKey, this.currentSortDirection);
          } else { 
               const fragment = document.createDocumentFragment();
                this.allResultsOnCurrentPage.forEach(item => {
                    if (item.style.display !== 'none') fragment.appendChild(item);
                });
                resultsListUl.innerHTML = '';
                resultsListUl.appendChild(fragment);
          }
         this.updateStatusIndicator();
     },
     updateStatusIndicator: function() {
         const indicatorElement = this.resultDiv.querySelector('#currentStatusIndicator');
         if (!indicatorElement) return;
         let statusText = '';
         const totalItemsOnPage = this.allResultsOnCurrentPage ? this.allResultsOnCurrentPage.length : 0;
         const visibleItems = this.allResultsOnCurrentPage ? this.allResultsOnCurrentPage.filter(item => item.style.display !== 'none').length : 0;

         if (totalItemsOnPage > 0) {
              statusText += `نمایش ${visibleItems} از ${totalItemsOnPage} نتیجه`;
         } else if (this.termInput && this.termInput.value) { 
              statusText += `هیچ نتیجه‌ای برای "${escapeHtml(this.termInput.value)}" یافت نشد.`;
         } else { 
             indicatorElement.style.display = 'none';
             return;
         }

         if (this.currentSortKey !== 'none' && totalItemsOnPage > 0) {
             let sortDirText = this.currentSortDirection === 'asc' ? 'صعودی' : 'نزولی';
             let sortKeyText = '';
             if (this.currentSortKey === 'price') sortKeyText = 'قیمت';
             else if (this.currentSortKey === 'persian-title') sortKeyText = 'نام فارسی';
             else if (this.currentSortKey === 'english-title') sortKeyText = 'نام انگلیسی';
             statusText += ` | مرتب‌سازی: ${sortKeyText} (${sortDirText})`;
         }
         if (this.currentFilterKey === 'owner' && this.currentFilterValue !== 'all' && totalItemsOnPage > 0) {
              statusText += ` | فیلتر صاحب برند: "${escapeHtml(this.currentFilterValue)}"`;
         }
          indicatorElement.textContent = statusText;
          indicatorElement.style.display = 'block';
     },
    highlightSearchTerm: function(text, term) {
        if (!text || !term || term.length < 1) return text; 
        const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedTerm})`, 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    },
     renderNoResults: function(noResultsTitleElement, suggestionLinks) {
         const noResultsMessage = noResultsTitleElement.textContent.trim();
         let resultsHtml = `
             <div class="no-results-container" role="region" aria-labelledby="noResultsHeading">
                 <h3 id="noResultsHeading">${escapeHtml(noResultsMessage)}</h3>`;
         if (suggestionLinks.length > 0) {
            resultsHtml += `<p>شاید منظور شما یکی از موارد زیر است:</p><ul class="suggestions-list">`;
            suggestionLinks.forEach(link => {
                const suggestedText = link.textContent.trim();
                const hrefParams = getQueryParams(link.getAttribute('href'));
                const suggestedTerm = hrefParams['term'] || suggestedText;
                resultsHtml += `<li><a href="#" data-suggested-term="${escapeHtml(suggestedTerm)}">${escapeHtml(suggestedText)}</a></li>`;
            });
            resultsHtml += `</ul>`;
         }
         resultsHtml += `</div>`;
         this.resultDiv.innerHTML = resultsHtml;
         this.resultDiv.className = '';
         this.updateStatusIndicator();
     },
     renderGenericNoResults: function() {
         this.resultDiv.innerHTML = `<div class="no-results-container" role="status"><p>نتیجه‌ای برای جستجوی شما یافت نشد.</p></div>`;
         this.resultDiv.className = '';
         this.updateStatusIndicator();
     },
     renderError: function(error) {
        console.error('Search failed:', error);
        let errorMessage = '<p style="color: red;">مشکل در دریافت یا پردازش نتایج جستجو.</p>';
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
             errorMessage += '<p>عدم دسترسی به اینترنت یا مشکل در ارتباط با سرور سایت مرجع (احتمالاً CORS).</p>';
        } else if (error.message.startsWith('HTTP error')) {
             errorMessage += `<p>خطای سرور: ${error.message}</p>`;
        } else { errorMessage += `<p>جزئیات: ${escapeHtml(error.message)}</p>`; }
        this.resultDiv.innerHTML = `<div class="error" role="alert" style="padding: 20px; text-align: right;">${errorMessage}</div>`;
        this.updateStatusIndicator();
    }
};

// --- Theme Toggle Functionality ---
const LOCAL_STORAGE_THEME_KEY = 'drugSearchTheme';
const themeToggleBtn = document.getElementById('themeToggleBtn');
// Icons are referenced after DOMContentLoaded to ensure they exist if script is in <head>
let sunIcon, moonIcon; 

function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        if (sunIcon) sunIcon.style.display = 'none';
        if (moonIcon) moonIcon.style.display = 'inline-block';
        if (themeToggleBtn) themeToggleBtn.setAttribute('aria-label', 'تغییر به حالت روشن');
    } else {
        document.body.classList.remove('dark-mode');
        if (sunIcon) sunIcon.style.display = 'inline-block';
        if (moonIcon) moonIcon.style.display = 'none';
        if (themeToggleBtn) themeToggleBtn.setAttribute('aria-label', 'تغییر به حالت تاریک');
    }
}

function toggleTheme() {
    let currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    let newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    localStorage.setItem(LOCAL_STORAGE_THEME_KEY, newTheme);
    applyTheme(newTheme);
}

function loadInitialTheme() {
    const savedTheme = localStorage.getItem(LOCAL_STORAGE_THEME_KEY);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme) {
        applyTheme(savedTheme);
    } else if (prefersDark) {
        applyTheme('dark');
    } else {
        applyTheme('light');
    }
}
// --- End Theme Toggle Functionality ---


// Back to Top Button Functionality
const backToTopButton = document.getElementById("backToTopBtn");

if (backToTopButton) {
    window.onscroll = function() {scrollFunction()};

    function scrollFunction() {
        if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
            if (backToTopButton) backToTopButton.style.display = "flex"; 
        } else {
            if (backToTopButton) backToTopButton.style.display = "none";
        }
    }

    backToTopButton.addEventListener('click', function() {
        document.body.scrollTop = 0; 
        document.documentElement.scrollTop = 0; 
    });
}


function getQueryParams(url) {
    const params = {};
    if (!url) return params;
    const queryStartIndex = url.indexOf('?');
    if (queryStartIndex === -1) return params;
    const queryString = url.substring(queryStartIndex + 1);
    if (queryString) {
        try {
            const urlParams = new URLSearchParams(queryString);
            for (const [key, value] of urlParams) { params[key] = value; }
        } catch(e) { console.error("Error parsing query:", queryString, e); }
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
    if (trimmedText === '>>') return '«'; 
    if (trimmedText === '<') return '›';  
    if (trimmedText === '>') return '‹';  
    if (trimmedText === '<<') return '»'; 
    return /^\d+$/.test(trimmedText) ? trimmedText : originalText;
}
 function escapeHtml(unsafe) {
     if (typeof unsafe !== 'string') return unsafe === null || typeof unsafe === 'undefined' ? '' : String(unsafe);
     return unsafe.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">").replace(/"/g, "\"").replace(/'/g, "'");
 }
 async function copyTextToClipboard(text) {
     try {
         await navigator.clipboard.writeText(text);
     } catch (err) {
         console.error('Failed to copy: ', err);
         alert('امکان کپی خودکار وجود ندارد. لطفاً دستی کپی کنید.');
     }
 }

document.addEventListener('DOMContentLoaded', function() {
    // Get icon references after DOM is loaded
    if (themeToggleBtn) { // Ensure themeToggleBtn itself was found
        sunIcon = themeToggleBtn.querySelector('.fa-sun');
        moonIcon = themeToggleBtn.querySelector('.fa-moon');
        themeToggleBtn.addEventListener('click', toggleTheme); // Add listener here
    }
    
    loadInitialTheme(); 

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() { // Register after page loaded to not delay initial render
            navigator.serviceWorker.register('./sw.js')
                .then(function(registration) {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                })
                .catch(function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                });
        });
    }
     
    setTimeout(() => { 
         SearchApp.init(); 
     }, 50);
});