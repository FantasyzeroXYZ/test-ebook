class EPUBReader {
    constructor() {
        this.currentBook = null;
        this.currentChapterIndex = 0;
        this.chapters = [];
        this.audioElements = {};
        this.smilData = {};
        this.isPlaying = false;
        this.currentAudio = null;
        this.currentHighlight = null;
        this.zip = null;
        this.resourceMap = new Map();
        this.currentSMILData = [];
        this.selectedText = '';
        this.dictionaryButton = null;
        this.dictionaryModal = null;
        this.lastSelectionTime = 0;
        this.isAudioReady = false;
        this.isSelecting = false;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.swipeThreshold = 50;
        this.dictionaryButtonTimeout = null;
        
        this.initializeUI();
    }
    
    initializeUI() {
        this.sidebar = document.getElementById('sidebar');
        this.toggleSidebarBtn = document.getElementById('toggleSidebar');
        this.closeSidebarBtn = document.getElementById('closeSidebar');
        this.tocContainer = document.getElementById('tocContainer');
        this.bookTitle = document.getElementById('bookTitle');
        this.bookAuthor = document.getElementById('bookAuthor');
        this.pageContent = document.getElementById('pageContent');
        this.uploadContainer = document.getElementById('uploadContainer');
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.currentPageSpan = document.getElementById('currentPage');
        this.totalPagesSpan = document.getElementById('totalPages');
        this.prevPageBtn = document.getElementById('prevPage');
        this.nextPageBtn = document.getElementById('nextPage');
        this.toggleAudioBtn = document.getElementById('toggleAudio');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.playerContainer = document.getElementById('playerContainer');
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.progressBar = document.getElementById('progressBar');
        this.progress = document.getElementById('progress');
        this.currentTimeSpan = document.getElementById('currentTime');
        this.durationSpan = document.getElementById('duration');
        this.playbackRateSelect = document.getElementById('playbackRate');
        this.swipeContainer = document.getElementById('swipeContainer');
        
        // 查词相关元素
        this.dictionaryButton = document.getElementById('dictionaryButton');
        this.dictionaryModal = document.getElementById('dictionaryModal');
        this.dictionaryOverlay = document.getElementById('dictionaryOverlay');
        this.closeModalBtn = document.getElementById('closeModal');
        this.dictionaryContent = document.getElementById('dictionaryContent');
        
        this.bindEvents();
    }
    
    bindEvents() {
        // 主要功能按钮事件
        this.toggleSidebarBtn.addEventListener('click', () => this.toggleSidebar());
        this.closeSidebarBtn.addEventListener('click', () => this.toggleSidebar());
        this.prevPageBtn.addEventListener('click', () => this.prevChapter());
        this.nextPageBtn.addEventListener('click', () => this.nextChapter());
        this.toggleAudioBtn.addEventListener('click', () => this.toggleAudio());
        this.uploadBtn.addEventListener('click', () => this.fileInput.click());
        
        // 上传区域事件
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // 音频控制事件
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.progressBar.addEventListener('click', (e) => this.seekAudio(e));
        this.playbackRateSelect.addEventListener('change', (e) => this.changePlaybackRate(e.target.value));
        
        // 触摸滑动事件
        this.swipeContainer.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.swipeContainer.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        // 鼠标滑动事件（桌面端）
        this.swipeContainer.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.swipeContainer.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        // 查词相关事件
        this.dictionaryButton.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.showDictionaryModal();
        });
        this.closeModalBtn.addEventListener('click', () => this.hideDictionaryModal());
        this.dictionaryOverlay.addEventListener('click', () => this.hideDictionaryModal());
        
        // 文本选择事件
        document.addEventListener('mousedown', (e) => {
            if (e.target !== this.dictionaryButton && !this.dictionaryButton.contains(e.target)) {
                this.isSelecting = true;
                if (this.dictionaryButtonTimeout) {
                    clearTimeout(this.dictionaryButtonTimeout);
                    this.dictionaryButtonTimeout = null;
                }
            }
        });
        
        document.addEventListener('mouseup', (e) => {
            if (this.isSelecting) {
                this.handleTextSelection(e);
                this.isSelecting = false;
            }
        });
        
        // 触摸文本选择事件
        document.addEventListener('touchstart', (e) => {
            if (e.target !== this.dictionaryButton && !this.dictionaryButton.contains(e.target)) {
                this.isSelecting = true;
                if (this.dictionaryButtonTimeout) {
                    clearTimeout(this.dictionaryButtonTimeout);
                    this.dictionaryButtonTimeout = null;
                }
            }
        });
        
        document.addEventListener('touchend', (e) => {
            if (this.isSelecting) {
                this.handleTextSelection(e);
                this.isSelecting = false;
            }
        });
        
        // 点击页面其他地方隐藏查词按钮
        document.addEventListener('click', (e) => {
            if (e.target !== this.dictionaryButton && !this.dictionaryButton.contains(e.target)) {
                this.dictionaryButtonTimeout = setTimeout(() => {
                    this.hideDictionaryButton();
                }, 3000);
            }
        });
        
        // 查词按钮本身的点击事件
        this.dictionaryButton.addEventListener('click', () => {
            if (this.dictionaryButtonTimeout) {
                clearTimeout(this.dictionaryButtonTimeout);
            }
        });
        
        // 拖拽上传事件
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('dragover');
        });
        
        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('dragover');
        });
        
        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].name.endsWith('.epub')) {
                this.loadEPUB(files[0]);
            }
        });
    }
    
    // 触摸事件处理
    handleTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
    }
    
    handleTouchEnd(e) {
        if (!this.touchStartX) return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const diffX = this.touchStartX - touchEndX;
        const diffY = this.touchStartY - touchEndY;
        
        // 只处理水平滑动，且垂直滑动距离较小
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > this.swipeThreshold) {
            if (diffX > 0) {
                this.nextChapter();
            } else {
                this.prevChapter();
            }
        }
        
        this.touchStartX = 0;
        this.touchStartY = 0;
    }
    
    // 鼠标滑动事件处理
    handleMouseDown(e) {
        this.touchStartX = e.clientX;
        this.touchStartY = e.clientY;
    }
    
    handleMouseUp(e) {
        if (!this.touchStartX) return;
        
        const diffX = this.touchStartX - e.clientX;
        const diffY = this.touchStartY - e.clientY;
        
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > this.swipeThreshold) {
            if (diffX > 0) {
                this.nextChapter();
            } else {
                this.prevChapter();
            }
        }
        
        this.touchStartX = 0;
        this.touchStartY = 0;
    }
    
    // 文本选择处理
    handleTextSelection(e) {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        
        console.log('选中的文本:', selectedText);
        
        // 防止快速连续触发
        const now = Date.now();
        if (now - this.lastSelectionTime < 100) return;
        this.lastSelectionTime = now;
        
        if (selectedText.length > 0 && selectedText.length < 100) {
            this.selectedText = selectedText;
            this.showDictionaryButton(e);
        } else {
            this.hideDictionaryButton();
        }
    }
    
    showDictionaryButton(e) {
        let clientX, clientY;
        
        if (e.type.includes('touch')) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        
        const buttonX = clientX + scrollX;
        const buttonY = clientY + scrollY - 50;
        
        console.log('显示查词按钮位置:', buttonX, buttonY);
        
        this.dictionaryButton.style.left = buttonX + 'px';
        this.dictionaryButton.style.top = buttonY + 'px';
        this.dictionaryButton.classList.add('show');
        
        // 清除之前的定时器
        if (this.dictionaryButtonTimeout) {
            clearTimeout(this.dictionaryButtonTimeout);
        }
        
        // 设置新的定时器，3秒后隐藏
        this.dictionaryButtonTimeout = setTimeout(() => {
            this.hideDictionaryButton();
        }, 3000);
    }
    
    hideDictionaryButton() {
        this.dictionaryButton.classList.remove('show');
        if (this.dictionaryButtonTimeout) {
            clearTimeout(this.dictionaryButtonTimeout);
            this.dictionaryButtonTimeout = null;
        }
    }
    
    async showDictionaryModal() {
        console.log('显示词典弹窗:', this.selectedText);
        
        this.hideDictionaryButton();
        this.dictionaryModal.classList.add('show');
        this.dictionaryOverlay.classList.add('show');
        
        // 显示加载状态
        this.dictionaryContent.innerHTML = `
            <div class="loading">
                <div class="loader"></div>
                <p>查询 "${this.selectedText}"...</p>
            </div>
        `;
        
        try {
            const result = await this.fetchDictionaryData(this.selectedText);
            this.displayDictionaryResult(result);
        } catch (error) {
            this.displayDictionaryError(error);
        }
    }
    
    async fetchDictionaryData(word) {
        try {
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
            
            if (!response.ok) {
                throw new Error('未找到该词的释义');
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('词典API请求失败:', error);
            throw new Error('网络请求失败，请检查网络连接');
        }
    }
    
    displayDictionaryResult(data) {
        if (!data || data.length === 0) {
            this.dictionaryContent.innerHTML = `
                <div class="error">
                    <p>未找到"${this.selectedText}"的释义</p>
                </div>
            `;
            return;
        }
        
        const wordData = data[0];
        let html = `
            <div class="dictionary-result">
                <div class="dictionary-word">${wordData.word}</div>
        `;
        
        if (wordData.phonetic) {
            html += `<div class="phonetic">/${wordData.phonetic}/</div>`;
        }
        
        wordData.meanings.forEach(meaning => {
            html += `
                <div class="dictionary-definition">
                    <strong>${meaning.partOfSpeech}</strong><br>
            `;
            
            meaning.definitions.forEach((def, index) => {
                if (index < 3) {
                    html += `
                        <div style="margin: 8px 0;">
                            ${index + 1}. ${def.definition}
                    `;
                    if (def.example) {
                        html += `<div class="dictionary-example">例: ${def.example}</div>`;
                    }
                    html += `</div>`;
                }
            });
            
            html += `</div>`;
        });
        
        html += `</div>`;
        this.dictionaryContent.innerHTML = html;
    }
    
    displayDictionaryError(error) {
        this.dictionaryContent.innerHTML = `
            <div class="error">
                <p>查询失败: ${error.message}</p>
                <p>请检查网络连接或尝试其他单词</p>
            </div>
        `;
    }
    
    hideDictionaryModal() {
        this.dictionaryModal.classList.remove('show');
        this.dictionaryOverlay.classList.remove('show');
        window.getSelection().removeAllRanges();
    }
    
    async safePlayAudio(audio) {
        try {
            await audio.play();
            return true;
        } catch (error) {
            console.warn('音频播放失败:', error);
            return false;
        }
    }
    
    stopAllAudio() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
        }
        this.isPlaying = false;
        this.playPauseBtn.textContent = '▶';
        this.clearHighlights();
    }
    
    toggleSidebar() {
        this.sidebar.classList.toggle('open');
    }
    
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file && file.name.endsWith('.epub')) {
            this.loadEPUB(file);
        }
    }
    
    async loadEPUB(file) {
        try {
            this.uploadArea.innerHTML = '<div class="loader"></div><p>正在解析EPUB文件...</p>';
            
            this.zip = await JSZip.loadAsync(file);
            await this.buildResourceMap();
            
            const containerContent = await this.getFileContent('META-INF/container.xml');
            const containerDoc = this.parseXML(containerContent);
            const rootfilePath = containerDoc.querySelector('rootfile').getAttribute('full-path');
            
            const opfContent = await this.getFileContent(rootfilePath);
            const opfDoc = this.parseXML(opfContent);
            
            const metadata = opfDoc.querySelector('metadata');
            const title = metadata.querySelector('dc\\:title, title')?.textContent || '未知标题';
            const creator = metadata.querySelector('dc\\:creator, creator')?.textContent || '未知作者';
            
            const manifest = this.parseManifest(opfDoc, rootfilePath);
            const readingOrder = this.parseSpine(opfDoc);
            
            this.chapters = await this.buildChapters(readingOrder, manifest, rootfilePath);
            
            if (this.chapters.length === 0) {
                throw new Error('未找到可读的章节内容');
            }
            
            this.currentBook = { title, author: creator };
            this.initializeBook();
            
        } catch (error) {
            console.error('加载EPUB文件失败:', error);
            this.uploadArea.innerHTML = `
                <div class="upload-icon">❌</div>
                <h3>加载失败</h3>
                <p>${error.message}</p>
                <button class="btn" onclick="location.reload()">重新上传</button>
            `;
        }
    }
    
    async buildResourceMap() {
        this.resourceMap.clear();
        const files = Object.keys(this.zip.files);
        
        for (const filePath of files) {
            if (!filePath.endsWith('/')) {
                try {
                    const file = this.zip.file(filePath);
                    if (file) {
                        const blob = await file.async('blob');
                        this.resourceMap.set(filePath, blob);
                        const normalizedPath = filePath.replace(/^\.\//, '');
                        if (normalizedPath !== filePath) {
                            this.resourceMap.set(normalizedPath, blob);
                        }
                    }
                } catch (e) {
                    console.warn(`无法加载资源: ${filePath}`, e);
                }
            }
        }
    }
    
    async getFileContent(path) {
        const possiblePaths = [
            path,
            path.replace(/^\.\//, ''),
            './' + path,
            path.startsWith('/') ? path.substring(1) : path
        ];
        
        for (const tryPath of possiblePaths) {
            const file = this.zip.file(tryPath);
            if (file) {
                return await file.async('text');
            }
        }
        
        throw new Error(`文件不存在: ${path}`);
    }
    
    parseXML(content) {
        return new DOMParser().parseFromString(content, 'text/xml');
    }
    
    parseManifest(opfDoc, rootfilePath) {
        const manifest = {};
        const rootDir = rootfilePath.includes('/') 
            ? rootfilePath.substring(0, rootfilePath.lastIndexOf('/') + 1)
            : '';
        
        const manifestItems = opfDoc.querySelectorAll('manifest item');
        manifestItems.forEach(item => {
            const id = item.getAttribute('id');
            const href = item.getAttribute('href');
            const mediaType = item.getAttribute('media-type');
            const mediaOverlay = item.getAttribute('media-overlay');
            
            let fullPath = href;
            if (rootDir && !href.startsWith('/') && !href.includes('://')) {
                fullPath = this.resolvePath(rootDir, href);
            }
            
            manifest[id] = {
                href: fullPath,
                mediaType,
                mediaOverlay
            };
        });
        
        return manifest;
    }
    
    resolvePath(base, relative) {
        if (relative.startsWith('/')) return relative.substring(1);
        
        const baseParts = base.split('/').filter(p => p);
        const relativeParts = relative.split('/').filter(p => p);
        
        for (const part of relativeParts) {
            if (part === '..') {
                baseParts.pop();
            } else if (part !== '.') {
                baseParts.push(part);
            }
        }
        
        return baseParts.join('/');
    }
    
    parseSpine(opfDoc) {
        const readingOrder = [];
        const spineItems = opfDoc.querySelectorAll('spine itemref');
        spineItems.forEach(item => {
            const idref = item.getAttribute('idref');
            readingOrder.push(idref);
        });
        return readingOrder;
    }
    
    async buildChapters(readingOrder, manifest, rootfilePath) {
        const chapters = [];
        
        for (const idref of readingOrder) {
            const item = manifest[idref];
            if (item && item.mediaType === 'application/xhtml+xml') {
                try {
                    const content = await this.loadHTMLContent(item.href);
                    const audioData = item.mediaOverlay 
                        ? await this.parseSMIL(manifest[item.mediaOverlay]?.href)
                        : null;
                    
                    // 获取章节标题
                    const title = await this.extractChapterTitle(item.href) || `第${chapters.length + 1}章`;
                    
                    chapters.push({
                        id: idref,
                        title: title,
                        content: content,
                        audio: audioData,
                        basePath: this.getBasePath(item.href)
                    });
                } catch (e) {
                    console.warn(`无法加载章节: ${item.href}`, e);
                    chapters.push({
                        id: idref,
                        title: `第${chapters.length + 1}章`,
                        content: `<p>无法加载此章节: ${e.message}</p>`,
                        audio: null
                    });
                }
            }
        }
        
        return chapters;
    }
    
    async extractChapterTitle(href) {
        try {
            const content = await this.getFileContent(href);
            const doc = new DOMParser().parseFromString(content, 'text/html');
            const title = doc.querySelector('title')?.textContent || 
                         doc.querySelector('h1')?.textContent ||
                         doc.querySelector('h2')?.textContent;
            return title ? title.trim() : null;
        } catch (e) {
            return null;
        }
    }
    
    getBasePath(filePath) {
        return filePath.includes('/') 
            ? filePath.substring(0, filePath.lastIndexOf('/') + 1)
            : '';
    }
    
    async loadHTMLContent(href) {
        const content = await this.getFileContent(href);
        return this.processHTMLContent(content, this.getBasePath(href));
    }
    
    processHTMLContent(html, basePath) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        
        const images = doc.querySelectorAll('img');
        images.forEach(img => {
            const src = img.getAttribute('src');
            if (src && !src.startsWith('data:')) {
                const fullPath = this.resolvePath(basePath, src);
                const blob = this.resourceMap.get(fullPath);
                if (blob) {
                    const blobUrl = URL.createObjectURL(blob);
                    img.src = blobUrl;
                }
            }
        });
        
        // 添加自适应样式类
        const body = doc.body;
        body.classList.add('epub-content');
        
        return body.innerHTML;
    }
    
    handleDoubleClick(e) {
        console.log('双击事件:', e);
        
        this.stopAllAudio();
        
        if (!this.currentAudio || this.currentSMILData.length === 0) {
            console.log('没有音频或SMIL数据');
            return;
        }
        
        const targetElement = e.target;
        console.log('双击目标元素:', targetElement);
        
        let elementWithId = targetElement;
        while (elementWithId && !elementWithId.id && elementWithId.parentElement && elementWithId.parentElement !== this.pageContent) {
            elementWithId = elementWithId.parentElement;
        }
        
        const elementId = elementWithId.id;
        console.log('找到的元素ID:', elementId);
        
        if (!elementId) {
            console.log('元素没有ID');
            return;
        }
        
        const segment = this.currentSMILData.find(s => s.textId === elementId);
        console.log('找到的音频段:', segment);
        
        if (segment) {
            this.currentAudio.currentTime = segment.start;
            this.playAudio();
            
            this.clearHighlights();
            elementWithId.classList.add('highlight', 'active-highlight');
            this.currentHighlight = elementWithId;
            this.scrollToHighlight(elementWithId);
        } else {
            console.log('未找到对应的音频段');
        }
    }
    
    async parseSMIL(smilPath) {
        if (!smilPath) return null;
        
        try {
            const smilContent = await this.getFileContent(smilPath);
            const smilDoc = this.parseXML(smilContent);
            
            const audioElements = smilDoc.querySelectorAll('audio');
            if (audioElements.length > 0) {
                const audioSrc = audioElements[0].getAttribute('src');
                const basePath = this.getBasePath(smilPath);
                const fullAudioPath = this.resolvePath(basePath, audioSrc);
                
                const smilData = this.extractSMILData(smilDoc);
                
                return {
                    src: fullAudioPath,
                    smilData: smilData
                };
            }
        } catch (e) {
            console.warn('解析SMIL文件失败:', e);
        }
        
        return null;
    }
    
    extractSMILData(smilDoc) {
        const data = [];
        const pars = smilDoc.querySelectorAll('par');
        
        pars.forEach(par => {
            const textElem = par.querySelector('text');
            const audioElem = par.querySelector('audio');
            
            if (textElem && audioElem) {
                const textSrc = textElem.getAttribute('src');
                const audioSrc = audioElem.getAttribute('src');
                const clipBegin = audioElem.getAttribute('clipBegin');
                const clipEnd = audioElem.getAttribute('clipEnd');
                
                if (textSrc) {
                    const textId = textSrc.includes('#') 
                        ? textSrc.split('#')[1] 
                        : textSrc;
                    
                    data.push({
                        textId: textId,
                        audioSrc: audioSrc,
                        start: this.parseTime(clipBegin),
                        end: this.parseTime(clipEnd)
                    });
                }
            }
        });
        
        data.sort((a, b) => a.start - b.start);
        return data;
    }
    
    parseTime(timeStr) {
        if (!timeStr) return 0;
        
        if (timeStr.includes(':')) {
            const parts = timeStr.split(':');
            if (parts.length === 3) {
                return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
            } else if (parts.length === 2) {
                return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
            }
        }
        
        return parseFloat(timeStr);
    }
    
    initializeBook() {
        this.uploadContainer.style.display = 'none';
        this.swipeContainer.style.display = 'block';
        this.pageContent.style.display = 'block';
        this.bookTitle.textContent = this.currentBook.title;
        this.bookAuthor.textContent = this.currentBook.author;
        this.totalPagesSpan.textContent = this.chapters.length;
        this.generateTOC();
        this.loadChapter(0);
    }
    
    generateTOC() {
        this.tocContainer.innerHTML = '';
        this.chapters.forEach((chapter, index) => {
            const tocItem = document.createElement('div');
            tocItem.className = 'toc-item';
            tocItem.textContent = chapter.title;
            tocItem.addEventListener('click', () => {
                this.stopAllAudio();
                this.loadChapter(index);
                if (window.innerWidth <= 768) {
                    this.toggleSidebar();
                }
            });
            this.tocContainer.appendChild(tocItem);
        });
    }
    
    loadChapter(index) {
        if (index < 0 || index >= this.chapters.length) return;
        
        this.currentChapterIndex = index;
        const chapter = this.chapters[index];
        
        this.pageContent.innerHTML = chapter.content;
        this.currentPageSpan.textContent = index + 1;
        this.updateTOCHighlight();
        
        this.currentSMILData = chapter.audio ? chapter.audio.smilData || [] : [];
        console.log('当前章节的SMIL数据:', this.currentSMILData);
        
        this.bindDoubleClickEvents();
        
        if (chapter.audio && chapter.audio.src) {
            this.prepareAudioPlayer(chapter);
        } else {
            this.playerContainer.style.display = 'none';
        }
        
        this.pageContent.scrollTop = 0;
    }
    
    bindDoubleClickEvents() {
        const oldElements = this.pageContent.querySelectorAll('[data-double-click]');
        oldElements.forEach(el => {
            el.removeEventListener('dblclick', this.handleDoubleClickBound);
        });
        
        const textElements = this.pageContent.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
        console.log('找到的可双击元素数量:', textElements.length);
        
        this.handleDoubleClickBound = (e) => this.handleDoubleClick(e);
        
        textElements.forEach(element => {
            element.setAttribute('data-double-click', 'true');
            element.addEventListener('dblclick', this.handleDoubleClickBound);
        });
    }
    
    updateTOCHighlight() {
        const tocItems = document.querySelectorAll('.toc-item');
        tocItems.forEach((item, index) => {
            item.classList.toggle('active', index === this.currentChapterIndex);
        });
    }
    
    async prepareAudioPlayer(chapter) {
        this.playerContainer.style.display = 'flex';
        
        if (!this.audioElements[chapter.id]) {
            try {
                const audioUrl = await this.createAudioFromZip(chapter.audio.src);
                const audio = new Audio(audioUrl);
                
                await new Promise((resolve, reject) => {
                    audio.addEventListener('canplaythrough', resolve);
                    audio.addEventListener('error', reject);
                });
                
                audio.addEventListener('timeupdate', () => {
                    this.updateProgress();
                    this.highlightCurrentText();
                });
                
                audio.addEventListener('loadedmetadata', () => {
                    this.durationSpan.textContent = this.formatTime(audio.duration);
                });
                
                audio.addEventListener('ended', () => this.audioEnded());
                
                this.audioElements[chapter.id] = audio;
                this.currentAudio = audio;
                this.isAudioReady = true;
            } catch (error) {
                console.error('加载音频失败:', error);
                this.playerContainer.style.display = 'none';
                return;
            }
        } else {
            this.currentAudio = this.audioElements[chapter.id];
            this.isAudioReady = true;
        }
        
        this.isPlaying = false;
        this.playPauseBtn.textContent = '▶';
        this.progress.style.width = '0%';
        this.currentTimeSpan.textContent = '0:00';
        
        this.clearHighlights();
    }
    
    highlightCurrentText() {
        if (!this.currentAudio || this.currentSMILData.length === 0) return;
        
        const currentTime = this.currentAudio.currentTime;
        
        let currentSegment = null;
        for (const segment of this.currentSMILData) {
            if (currentTime >= segment.start && currentTime < segment.end) {
                currentSegment = segment;
                break;
            }
        }
        
        this.clearHighlights();
        
        if (currentSegment) {
            const element = document.getElementById(currentSegment.textId);
            if (element) {
                element.classList.add('highlight', 'active-highlight');
                this.currentHighlight = element;
                
                this.scrollToHighlight(element);
            }
        }
    }
    
    scrollToHighlight(element) {
        if (!element) return;
        
        const elementRect = element.getBoundingClientRect();
        const pageRect = this.pageContent.getBoundingClientRect();
        
        if (elementRect.top < pageRect.top || elementRect.bottom > pageRect.bottom) {
            element.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'nearest'
            });
        }
    }
    
    clearHighlights() {
        const highlights = this.pageContent.querySelectorAll('.highlight, .active-highlight');
        highlights.forEach(element => {
            element.classList.remove('highlight', 'active-highlight');
        });
        this.currentHighlight = null;
    }
    
    async createAudioFromZip(audioPath) {
        const possiblePaths = [
            audioPath,
            audioPath.replace(/^\.\//, ''),
            './' + audioPath,
            audioPath.startsWith('/') ? audioPath.substring(1) : audioPath
        ];
        
        for (const tryPath of possiblePaths) {
            const blob = this.resourceMap.get(tryPath);
            if (blob) {
                return URL.createObjectURL(blob);
            }
        }
        
        throw new Error(`音频文件不存在: ${audioPath}`);
    }
    
    toggleAudio() {
        if (!this.currentAudio || !this.isAudioReady) return;
        this.isPlaying ? this.pauseAudio() : this.playAudio();
    }
    
    async playAudio() {
        if (!this.currentAudio || !this.isAudioReady) return;
        
        try {
            await this.safePlayAudio(this.currentAudio);
            this.isPlaying = true;
            this.playPauseBtn.textContent = '⏸';
        } catch (error) {
            console.warn('播放失败:', error);
            this.isPlaying = false;
            this.playPauseBtn.textContent = '▶';
        }
    }
    
    pauseAudio() {
        if (!this.currentAudio) return;
        this.currentAudio.pause();
        this.isPlaying = false;
        this.playPauseBtn.textContent = '▶';
        this.clearHighlights();
    }
    
    togglePlayPause() {
        this.isPlaying ? this.pauseAudio() : this.playAudio();
    }
    
    updateProgress() {
        if (!this.currentAudio) return;
        const progress = (this.currentAudio.currentTime / this.currentAudio.duration) * 100;
        this.progress.style.width = `${progress}%`;
        this.currentTimeSpan.textContent = this.formatTime(this.currentAudio.currentTime);
    }
    
    seekAudio(e) {
        if (!this.currentAudio) return;
        const rect = this.progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        this.currentAudio.currentTime = percent * this.currentAudio.duration;
        
        this.highlightCurrentText();
    }
    
    changePlaybackRate(rate) {
        if (this.currentAudio) {
            this.currentAudio.playbackRate = parseFloat(rate);
        }
    }
    
    audioEnded() {
        this.isPlaying = false;
        this.playPauseBtn.textContent = '▶';
        this.progress.style.width = '0%';
        this.currentTimeSpan.textContent = '0:00';
        this.clearHighlights();
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    
    prevChapter() {
        if (this.currentChapterIndex > 0) {
            this.stopAllAudio();
            this.loadChapter(this.currentChapterIndex - 1);
        }
    }
    
    nextChapter() {
        if (this.currentChapterIndex < this.chapters.length - 1) {
            this.stopAllAudio();
            this.loadChapter(this.currentChapterIndex + 1);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.reader = new EPUBReader();
});