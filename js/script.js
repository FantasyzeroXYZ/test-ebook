class EPUBReader {
    constructor() {
        this.currentBook = null;
        this.currentChapterIndex = 0;
        this.chapters = [];
        this.resourceMap = new Map();
        this.viewMode = 'paged'; // 只保留分页模式
        this.currentSectionIndex = 0;
        this.sections = [];
        this.selectionToolbar = null;
        this.selectedText = '';
        this.selectionTimeout = null;
        this.touchStartTime = 0;
        this.currentWordData = null;
        this.savedSelectionRange = null;
        this.ankiConnected = false;
        this.currentModelFields = [];
        this.ankiSettings = {
            host: '127.0.0.1',
            port: 8765,
            deck: '',
            model: '',
            wordField: '',
            meaningField: '',
            sentenceField: '',
            tagsField: 'epub-reader'
        };
        
        this.navigationMap = [];
        this.isDarkMode = false;
        
        this.initializeUI();
    }
    
    initializeUI() {
        // 主要UI元素
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
        this.uploadBtn = document.getElementById('uploadBtn');
        this.toggleThemeBtn = document.getElementById('toggleTheme');
        
        // 边缘点击区域
        this.leftEdgeTapArea = document.getElementById('leftEdgeTapArea');
        this.rightEdgeTapArea = document.getElementById('rightEdgeTapArea');
        
        // 设置相关元素
        this.toggleSettingsBtn = document.getElementById('toggleSettings');
        this.settingsSidebar = document.getElementById('settingsSidebar');
        this.closeSettingsBtn = document.getElementById('closeSettings');
        
        // 设置控件
        this.fontSize = document.getElementById('fontSize');
        this.theme = document.getElementById('theme');
        this.offlineMode = document.getElementById('offlineMode');
        this.syncProgress = document.getElementById('syncProgress');
        this.exportDataBtn = document.getElementById('exportData');
        this.clearDataBtn = document.getElementById('clearData');
        
        // Anki设置控件
        this.testAnkiConnectionBtn = document.getElementById('testAnkiConnection');
        this.ankiHost = document.getElementById('ankiHost');
        this.ankiPort = document.getElementById('ankiPort');
        this.ankiDeck = document.getElementById('ankiDeck');
        this.ankiModel = document.getElementById('ankiModel');
        this.ankiWordField = document.getElementById('ankiWordField');
        this.ankiMeaningField = document.getElementById('ankiMeaningField');
        this.ankiSentenceField = document.getElementById('ankiSentenceField');
        this.ankiTagsField = document.getElementById('ankiTagsField');
        this.saveAnkiSettingsBtn = document.getElementById('saveAnkiSettings');
        
        // 查词相关元素
        this.dictionaryModal = document.getElementById('dictionaryModal');
        this.dictionaryOverlay = document.getElementById('dictionaryOverlay');
        this.closeModalBtn = document.getElementById('closeModal');
        this.dictionaryContent = document.getElementById('dictionaryContent');
        this.dictionaryFooter = document.getElementById('dictionaryFooter');
        this.addToAnkiBtn = document.getElementById('addToAnkiBtn');

        // 选择工具栏
        this.selectionToolbar = document.getElementById('selectionToolbar');
        this.lookupWordBtn = document.getElementById('lookupWordBtn');
        this.highlightBtn = document.getElementById('highlightBtn');
        this.copyBtn = document.getElementById('copyBtn');
        this.shareBtn = document.getElementById('shareBtn');

        // 阅读区域容器
        this.swipeContainer = document.getElementById('swipeContainer');
        
        this.bindEvents();
        this.loadSettings();
        this.loadAnkiSettings();
        this.initializeSettingGroups();
    }
    
    bindEvents() {
        // 主要功能按钮事件
        this.toggleSidebarBtn.addEventListener('click', () => this.toggleSidebar());
        this.closeSidebarBtn.addEventListener('click', () => this.toggleSidebar());
        this.prevPageBtn.addEventListener('click', () => this.prevPage());
        this.nextPageBtn.addEventListener('click', () => this.nextPage());
        this.uploadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.fileInput.click();
        });
        
        // 主题切换
        this.toggleThemeBtn.addEventListener('click', () => this.toggleDarkMode());
        
        // 设置按钮事件
        this.toggleSettingsBtn.addEventListener('click', () => this.toggleSettings());
        this.closeSettingsBtn.addEventListener('click', () => this.toggleSettings());
        
        // 设置控件事件
        this.fontSize.addEventListener('change', () => {
            this.saveSettings();
            this.applyFontSize();
        });
        this.theme.addEventListener('change', () => {
            this.saveSettings();
            this.applyTheme();
        });
        this.offlineMode.addEventListener('change', () => this.saveSettings());
        this.syncProgress.addEventListener('change', () => this.saveSettings());
        this.exportDataBtn.addEventListener('click', () => this.exportData());
        this.clearDataBtn.addEventListener('click', () => this.clearData());
        
        // Anki设置事件
        this.testAnkiConnectionBtn.addEventListener('click', () => this.testAnkiConnection());
        this.saveAnkiSettingsBtn.addEventListener('click', () => this.saveAnkiSettings());
        
        // 上传区域事件
        this.uploadArea.addEventListener('click', (e) => {
            e.stopPropagation();
            this.fileInput.click();
        });
        this.fileInput.addEventListener('change', (e) => {
            this.handleFileSelect(e);
        });
        
        // 边缘点击翻页事件
        this.leftEdgeTapArea.addEventListener('click', (e) => {
            e.stopPropagation();
            this.prevPage();
        });
        this.rightEdgeTapArea.addEventListener('click', (e) => {
            e.stopPropagation();
            this.nextPage();
        });
        
        // 查词相关事件
        this.closeModalBtn.addEventListener('click', () => this.hideDictionaryModal());
        this.dictionaryOverlay.addEventListener('click', () => this.hideDictionaryModal());
        this.addToAnkiBtn.addEventListener('click', () => this.addToAnki());

        // 工具栏按钮事件
        this.lookupWordBtn.addEventListener('click', () => this.lookupWord());
        this.highlightBtn.addEventListener('click', () => this.highlightText());
        this.copyBtn.addEventListener('click', () => this.copyText());
        this.shareBtn.addEventListener('click', () => this.shareText());

        // 文本选择事件处理
        this.bindSelectionEvents();

        // 牌组和模板选择事件
        this.ankiDeck.addEventListener('change', () => {
            this.ankiSettings.deck = this.ankiDeck.value;
            this.saveAnkiSettings();
        });

        this.ankiModel.addEventListener('change', async () => {
            this.ankiSettings.model = this.ankiModel.value;
            await this.loadModelFields(this.ankiModel.value);
            this.saveAnkiSettings();
        });

        // 字段选择事件
        const fieldSelectors = [
            this.ankiWordField, this.ankiMeaningField, this.ankiSentenceField
        ];

        fieldSelectors.forEach(select => {
            select.addEventListener('change', () => this.saveAnkiSettings());
        });

        this.ankiTagsField.addEventListener('input', () => this.saveAnkiSettings());
        
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

        // 键盘快捷键
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // 窗口大小变化事件
        window.addEventListener('resize', () => this.handleResize());

        // 阻止词典弹窗内的选择事件
        this.dictionaryModal.addEventListener('mousedown', (e) => e.stopPropagation());
        this.dictionaryModal.addEventListener('touchstart', (e) => e.stopPropagation());
    }

    // 初始化设置分组折叠功能
    initializeSettingGroups() {
        const groupHeaders = document.querySelectorAll('.setting-group-header');
        groupHeaders.forEach(header => {
            // 默认全部折叠
            header.classList.add('collapsed');
            
            header.addEventListener('click', () => {
                header.classList.toggle('collapsed');
            });
        });
    }

    // 窗口大小变化处理
    handleResize() {
        if (this.chapters.length > 0) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                const currentChapter = this.chapters[this.currentChapterIndex];
                if (currentChapter) {
                    this.splitChapterIntoPages(currentChapter.content);
                }
            }, 250);
        }
    }

    // 键盘快捷键处理
    handleKeydown(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.prevPage();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.nextPage();
                break;
            case 'Escape':
                this.hideDictionaryModal();
                this.hideSelectionToolbar();
                break;
            case 'd':
            case 'D':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.toggleDarkMode();
                }
                break;
        }
    }

    // 切换夜间模式
    toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;
        document.body.classList.toggle('dark-mode', this.isDarkMode);
        this.toggleThemeBtn.innerHTML = this.isDarkMode ? 
            '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        this.saveSettings();
    }

    // 设置相关方法
    toggleSettings() {
        this.settingsSidebar.classList.toggle('open');
        if (this.settingsSidebar.classList.contains('open')) {
            this.sidebar.classList.remove('open');
        }
    }

    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('epubReaderSettings') || '{}');
        
        this.fontSize.value = settings.fontSize || 'medium';
        this.theme.value = settings.theme || 'light';
        this.offlineMode.checked = settings.offlineMode || false;
        this.syncProgress.checked = settings.syncProgress !== false;
        this.isDarkMode = settings.darkMode || false;
        
        // 应用设置
        document.body.classList.toggle('dark-mode', this.isDarkMode);
        this.toggleThemeBtn.innerHTML = this.isDarkMode ? 
            '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        
        this.applyFontSize();
        this.applyTheme();
    }

    saveSettings() {
        const settings = {
            fontSize: this.fontSize.value,
            theme: this.theme.value,
            offlineMode: this.offlineMode.checked,
            syncProgress: this.syncProgress.checked,
            darkMode: this.isDarkMode
        };
        
        localStorage.setItem('epubReaderSettings', JSON.stringify(settings));
    }

    applyFontSize() {
        const fontSize = this.fontSize.value;
        const sizes = {
            small: '0.9rem',
            medium: '1.1rem',
            large: '1.3rem',
            xlarge: '1.5rem'
        };
        
        document.documentElement.style.setProperty('--base-font-size', sizes[fontSize]);
        
        const pageContent = document.querySelector('.page-content');
        if (pageContent) {
            pageContent.style.fontSize = sizes[fontSize];
        }
    }

    applyTheme() {
        const theme = this.theme.value;
        const themes = {
            light: {
                '--primary-color': '#3498db',
                '--secondary-color': '#2c3e50',
                '--background-color': '#f5f5f5',
                '--text-color': '#333',
                '--border-color': '#ddd'
            },
            dark: {
                '--primary-color': '#3498db',
                '--secondary-color': '#34495e',
                '--background-color': '#1a1a1a',
                '--text-color': '#ecf0f1',
                '--border-color': '#34495e'
            },
            sepia: {
                '--primary-color': '#d35400',
                '--secondary-color': '#8b4513',
                '--background-color': '#f4ecd8',
                '--text-color': '#5c4b37',
                '--border-color': '#d2b48c'
            }
        };
        
        const themeColors = themes[theme];
        Object.keys(themeColors).forEach(key => {
            document.documentElement.style.setProperty(key, themeColors[key]);
        });
    }

    exportData() {
        const readingData = {
            currentBook: this.currentBook,
            currentChapterIndex: this.currentChapterIndex,
            settings: JSON.parse(localStorage.getItem('epubReaderSettings') || '{}')
        };
        
        const dataStr = JSON.stringify(readingData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'epub-reader-data.json';
        link.click();
        
        URL.revokeObjectURL(url);
        this.showToast('数据导出成功');
    }

    clearData() {
        if (confirm('确定要清除所有缓存数据吗？此操作不可撤销。')) {
            localStorage.removeItem('epubReaderSettings');
            localStorage.removeItem('epubReaderAnkiSettings');
            this.showToast('缓存数据已清除');
            location.reload();
        }
    }

    // Anki设置相关方法
    loadAnkiSettings() {
        const settings = JSON.parse(localStorage.getItem('epubReaderAnkiSettings') || '{}');
        this.ankiSettings = { ...this.ankiSettings, ...settings };
        
        this.ankiHost.value = this.ankiSettings.host;
        this.ankiPort.value = this.ankiSettings.port;
        this.ankiDeck.value = this.ankiSettings.deck;
        this.ankiModel.value = this.ankiSettings.model;
        this.ankiTagsField.value = this.ankiSettings.tagsField || 'epub-reader';
        
        this.restoreFieldSelections();
        
        if (this.ankiSettings.host && this.ankiSettings.port) {
            setTimeout(() => {
                this.testAnkiConnection();
            }, 1000);
        }
    }

    saveAnkiSettings() {
        this.ankiSettings = {
            host: this.ankiHost.value,
            port: parseInt(this.ankiPort.value),
            deck: this.ankiDeck.value,
            model: this.ankiModel.value,
            wordField: this.ankiWordField.value,
            meaningField: this.ankiMeaningField.value,
            sentenceField: this.ankiSentenceField.value,
            tagsField: this.ankiTagsField.value
        };
        
        localStorage.setItem('epubReaderAnkiSettings', JSON.stringify(this.ankiSettings));
        this.showToast('Anki设置已保存');
    }

    async testAnkiConnection() {
        try {
            this.showToast('正在测试Anki连接...');
            
            const response = await fetch(`http://${this.ankiSettings.host}:${this.ankiSettings.port}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'version',
                    version: 6
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.result) {
                    this.ankiConnected = true;
                    this.showToast(`Anki连接成功，版本: ${data.result}`);
                    
                    await this.loadAnkiDecks();
                    await this.loadAnkiModels();
                    return true;
                }
            }
            throw new Error('AnkiConnect响应错误');
        } catch (error) {
            this.ankiConnected = false;
            this.showToast('Anki连接失败，请检查AnkiConnect插件');
            console.error('Anki连接错误:', error);
            return false;
        }
    }

    async loadAnkiDecks() {
        try {
            const decks = await this.ankiRequest('deckNames', {});
            
            const currentDeck = this.ankiDeck.value;
            
            this.ankiDeck.innerHTML = '<option value="">选择牌组</option>';
            decks.forEach(deck => {
                const option = document.createElement('option');
                option.value = deck;
                option.textContent = deck;
                this.ankiDeck.appendChild(option);
            });
            
            if (this.ankiSettings.deck && decks.includes(this.ankiSettings.deck)) {
                this.ankiDeck.value = this.ankiSettings.deck;
            } else if (currentDeck && decks.includes(currentDeck)) {
                this.ankiDeck.value = currentDeck;
            }
            
        } catch (error) {
            console.error('获取牌组列表错误:', error);
            this.showToast('获取牌组列表失败');
        }
    }

    async loadAnkiModels() {
        try {
            const models = await this.ankiRequest('modelNames', {});
            
            const currentModel = this.ankiModel.value;
            
            this.ankiModel.innerHTML = '<option value="">选择模板</option>';
            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model;
                option.textContent = model;
                this.ankiModel.appendChild(option);
            });
            
            if (this.ankiSettings.model && models.includes(this.ankiSettings.model)) {
                this.ankiModel.value = this.ankiSettings.model;
                await this.loadModelFields(this.ankiSettings.model);
            } else if (currentModel && models.includes(currentModel)) {
                this.ankiModel.value = currentModel;
                await this.loadModelFields(currentModel);
            } else if (models.length > 0) {
                this.ankiModel.value = models[0];
                await this.loadModelFields(models[0]);
            }
            
        } catch (error) {
            console.error('获取模型列表错误:', error);
            this.showToast('获取模板列表失败');
        }
    }

    async loadModelFields(modelName) {
        try {
            const fields = await this.ankiRequest('modelFieldNames', { 
                modelName: modelName 
            });
            
            this.currentModelFields = fields;
            this.updateFieldSelectors(fields);
            
            if (!this.ankiSettings.wordField || !this.ankiSettings.sentenceField) {
                this.setDefaultFields(fields);
            }
            
        } catch (error) {
            console.error('获取模型字段错误:', error);
            this.showToast('获取字段列表失败');
        }
    }

    updateFieldSelectors(fields) {
        const fieldSelectors = [
            this.ankiWordField,
            this.ankiMeaningField,
            this.ankiSentenceField
        ];
        
        fieldSelectors.forEach(select => {
            select.innerHTML = '<option value="">选择字段</option>';
            fields.forEach(field => {
                const option = document.createElement('option');
                option.value = field;
                option.textContent = field;
                select.appendChild(option);
            });
        });
        
        this.restoreFieldSelections();
    }

    setDefaultFields(fields) {
        const fieldMap = fields.map(f => f.toLowerCase());
        
        if (!this.ankiSettings.wordField) {
            if (fieldMap.includes('word')) {
                this.ankiWordField.value = 'word';
            } else if (fieldMap.includes('front')) {
                this.ankiWordField.value = 'front';
            } else if (fields.length > 0) {
                this.ankiWordField.selectedIndex = 0;
            }
        }
        
        if (!this.ankiSettings.sentenceField) {
            if (fieldMap.includes('sentence')) {
                this.ankiSentenceField.value = 'sentence';
            } else if (fieldMap.includes('example')) {
                this.ankiSentenceField.value = 'example';
            } else if (fieldMap.includes('back')) {
                this.ankiSentenceField.value = 'back';
            } else if (fields.length > 1) {
                this.ankiSentenceField.selectedIndex = 1;
            }
        }
        
        if (!this.ankiSettings.meaningField) {
            if (fieldMap.includes('definition')) {
                this.ankiMeaningField.value = 'definition';
            } else if (fieldMap.includes('meaning')) {
                this.ankiMeaningField.value = 'meaning';
            } else if (fieldMap.includes('back')) {
                this.ankiMeaningField.value = 'back';
            } else if (fields.length > 2) {
                this.ankiMeaningField.selectedIndex = 2;
            }
        }
    }

    restoreFieldSelections() {
        if (this.ankiSettings.wordField) {
            this.ankiWordField.value = this.ankiSettings.wordField;
        }
        if (this.ankiSettings.meaningField) {
            this.ankiMeaningField.value = this.ankiSettings.meaningField;
        }
        if (this.ankiSettings.sentenceField) {
            this.ankiSentenceField.value = this.ankiSettings.sentenceField;
        }
    }

    async ankiRequest(action, params = {}) {
        const url = `http://${this.ankiSettings.host}:${this.ankiSettings.port}`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: action,
                    version: 6,
                    params: params
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            return result.result;
        } catch (error) {
            console.error('Anki请求失败:', error);
            throw new Error(`Anki请求失败: ${error.message}`);
        }
    }

    async addToAnki() {
        if (!this.ankiConnected) {
            const connected = await this.testAnkiConnection();
            if (!connected) {
                this.showToast('请先连接Anki!');
                return;
            }
        }

        if (!this.selectedText) {
            this.showToast('没有选中的文本');
            return;
        }

        if (!this.currentWordData) {
            this.showToast('请先查询单词释义');
            return;
        }

        if (!this.ankiSettings.deck || !this.ankiSettings.model) {
            this.showToast('请先配置Anki牌组和模板!');
            return;
        }

        if (!this.ankiSettings.wordField || !this.ankiSettings.sentenceField) {
            this.showToast('请配置单词字段和句子字段!');
            return;
        }

        const originalHTML = this.addToAnkiBtn.innerHTML;
        this.addToAnkiBtn.disabled = true;
        this.addToAnkiBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 添加中...';

        try {
            this.restoreSelection();
            await this.processAnkiCard();
            this.showToast('✅ 单词已成功添加到Anki!');
            this.hideDictionaryModal();
        } catch (error) {
            console.error('添加卡片失败:', error);
            this.showToast('❌ 添加失败: ' + error.message);
        } finally {
            this.addToAnkiBtn.disabled = false;
            this.addToAnkiBtn.innerHTML = originalHTML;
        }
    }

    async processAnkiCard() {
        const word = this.selectedText.trim();
        const sentence = this.getWordSentence(word);
        const definition = this.getWordDefinition();
        
        const note = {
            deckName: this.ankiSettings.deck,
            modelName: this.ankiSettings.model,
            fields: {
                [this.ankiSettings.wordField]: word,
                [this.ankiSettings.sentenceField]: sentence
            },
            options: { allowDuplicate: false },
            tags: this.ankiSettings.tagsField.split(',').map(tag => tag.trim()).filter(tag => tag)
        };
        
        if (this.ankiSettings.meaningField && definition) {
            note.fields[this.ankiSettings.meaningField] = definition;
        }
        
        await this.addCardToAnki(note);
    }

    getWordDefinition() {
        if (!this.currentWordData || !this.currentWordData.meanings) {
            return '暂无释义';
        }
        
        const meaning = this.currentWordData.meanings[0];
        if (!meaning) return '暂无释义';
        
        const definition = meaning.definitions[0]?.definition || '暂无释义';
        return `${meaning.partOfSpeech || ''} ${definition}`.trim();
    }

    getWordSentence(selectedText) {
        try {
            if (!this.savedSelectionRange) {
                return selectedText;
            }
            
            const range = this.savedSelectionRange;
            
            // 获取包含选中文本的段落
            let paragraph = range.startContainer.parentElement;
            while (paragraph && paragraph.nodeType === Node.ELEMENT_NODE && 
                   !['P', 'DIV', 'SECTION', 'ARTICLE', 'BLOCKQUOTE'].includes(paragraph.tagName) &&
                   paragraph.parentElement) {
                paragraph = paragraph.parentElement;
            }
            
            if (paragraph && paragraph.textContent) {
                // 获取完整的段落文本
                const fullParagraph = paragraph.textContent.trim();
                
                // 查找选中文本在段落中的位置
                const selectedIndex = fullParagraph.indexOf(selectedText);
                if (selectedIndex !== -1) {
                    // 尝试截取完整的句子
                    const sentence = this.extractCompleteSentence(fullParagraph, selectedIndex, selectedText.length);
                    return sentence || fullParagraph;
                }
                
                return fullParagraph;
            }
            
            return selectedText;
            
        } catch (error) {
            console.error('获取句子失败:', error);
            return selectedText;
        }
    }

    extractCompleteSentence(text, selectionStart, selectionLength) {
        // 查找句子开始位置
        let sentenceStart = 0;
        for (let i = selectionStart - 1; i >= 0; i--) {
            if (['.', '!', '?', '\n'].includes(text[i])) {
                sentenceStart = i + 1;
                break;
            }
        }
        
        // 查找句子结束位置
        let sentenceEnd = text.length;
        for (let i = selectionStart + selectionLength; i < text.length; i++) {
            if (['.', '!', '?', '\n'].includes(text[i])) {
                sentenceEnd = i + 1;
                break;
            }
        }
        
        const sentence = text.substring(sentenceStart, sentenceEnd).trim();
        return sentence || text;
    }

    cleanSentenceText(text) {
        return text
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .replace(/[\r\n\t]/g, ' ')
            .replace(/^[^a-zA-Z]*/, '')
            .replace(/[^a-zA-Z0-9\.!?]*$/, '')
            .trim();
    }

    async addCardToAnki(note) {
        try {
            const result = await this.ankiRequest('addNote', { note });
            
            if (result) {
                return result;
            } else {
                throw new Error('卡片创建失败');
            }
            
        } catch (error) {
            if (error.message.includes('duplicate')) {
                throw new Error('已存在相同卡片');
            } else {
                throw error;
            }
        }
    }

    // 文本选择事件绑定
    bindSelectionEvents() {
        document.addEventListener('mousedown', (e) => {
            if (!this.selectionToolbar.contains(e.target)) {
                this.hideSelectionToolbar();
            }
        });
        
        document.addEventListener('touchstart', (e) => {
            // 如果在边缘区域，允许长按选择
            if (e.target.closest('.edge-tap-area')) {
                this.touchStartTime = Date.now();
                this.touchStartTarget = e.target;
                return;
            }
            
            if (!this.selectionToolbar.contains(e.target)) {
                this.hideSelectionToolbar();
            }
        });

        document.addEventListener('touchmove', (e) => {
            // 如果开始触摸在边缘区域，但在移动，取消长按选择
            if (this.touchStartTarget && e.target !== this.touchStartTarget) {
                this.touchStartTarget = null;
            }
        });

        document.addEventListener('touchend', (e) => {
            if (this.touchStartTarget) {
                const touchDuration = Date.now() - this.touchStartTime;
                // 长按超过500ms在边缘区域也允许选择
                if (touchDuration > 500) {
                    this.touchStartTarget = null;
                    setTimeout(() => {
                        this.handleSelectionChange(e);
                    }, 100);
                }
                this.touchStartTarget = null;
            }
        });

        document.addEventListener('selectionchange', () => {
            this.handleSelectionChange();
        });

        const preventContextMenu = (e) => {
            if (e.target.closest('.dictionary-modal')) {
                return;
            }
            e.preventDefault();
            e.stopPropagation();
            return false;
        };

        this.readerContent = document.querySelector('.reader-content');
        if (this.readerContent) {
            this.readerContent.addEventListener('contextmenu', preventContextMenu);
            this.readerContent.addEventListener('touchstart', (e) => {
                this.touchStartTime = Date.now();
            });
        }

        document.addEventListener('contextmenu', (e) => {
            if (e.target.closest('.reader-content') || 
                e.target.closest('.page-content') ||
                e.target.closest('.page-section')) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        });

        document.addEventListener('touchend', (e) => {
            setTimeout(() => {
                this.handleSelectionChange(e);
            }, 100);
        });

        document.addEventListener('mouseup', (e) => {
            this.handleSelectionChange(e);
        });
    }

    handleSelectionChange(e) {
        // 如果词典弹窗显示，不处理选择事件
        if (this.dictionaryModal.classList.contains('show')) {
            this.hideSelectionToolbar();
            return;
        }

        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        
        if (this.selectionTimeout) {
            clearTimeout(this.selectionTimeout);
        }
        
        if (selectedText.length > 0 && selectedText.length < 100) {
            this.selectedText = selectedText;
            
            this.selectionTimeout = setTimeout(() => {
                this.showSelectionToolbar(selection);
            }, 150);
        } else {
            this.hideSelectionToolbar();
        }
    }

    hideSelectionToolbar() {
        this.selectionToolbar.classList.remove('show');
        if (this.selectionTimeout) {
            clearTimeout(this.selectionTimeout);
            this.selectionTimeout = null;
        }
    }

    showSelectionToolbar(selection) {
        if (!selection.rangeCount) return;
        
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        if (rect.width === 0 && rect.height === 0) return;
        
        const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        
        const toolbarX = rect.left + rect.width / 2 + scrollX;
        const toolbarY = rect.top + scrollY;
        
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const toolbarRect = this.selectionToolbar.getBoundingClientRect();
        
        let finalX = toolbarX - toolbarRect.width / 2;
        let finalY = toolbarY - toolbarRect.height - 5; // 减少距离
        
        // 边界检查
        if (finalX < 10) finalX = 10;
        if (finalX + toolbarRect.width > viewportWidth - 10) {
            finalX = viewportWidth - toolbarRect.width - 10;
        }
        
        if (finalY < 10) {
            finalY = toolbarY + rect.height + 5;
        }
        
        if (finalY + toolbarRect.height > viewportHeight - 10) {
            finalY = viewportHeight - toolbarRect.height - 10;
        }
        
        this.selectionToolbar.style.left = finalX + 'px';
        this.selectionToolbar.style.top = finalY + 'px';
        this.selectionToolbar.style.transform = 'translateY(-100%)';
        
        this.selectionToolbar.classList.add('show');
        
        // 保存选择范围
        this.saveCurrentSelection();
    }

    lookupWord() {
        if (!this.selectedText) {
            const selection = window.getSelection();
            this.selectedText = selection.toString().trim();
        }
        
        if (!this.selectedText) {
            this.showToast('请先选择文本');
            return;
        }
        
        this.hideSelectionToolbar();
        this.showDictionaryModal();
    }

    highlightText() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.className = 'highlight';
        span.style.backgroundColor = '#fff9c4';
        
        try {
            range.surroundContents(span);
            this.hideSelectionToolbar();
            window.getSelection().removeAllRanges();
            this.showToast('文本已高亮');
        } catch (e) {
            this.showToast('无法高亮此文本');
        }
    }

    copyText() {
        if (!this.selectedText) return;
        
        navigator.clipboard.writeText(this.selectedText).then(() => {
            this.hideSelectionToolbar();
            window.getSelection().removeAllRanges();
            this.showToast('文本已复制到剪贴板');
        }).catch(err => {
            const textArea = document.createElement('textarea');
            textArea.value = this.selectedText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast('文本已复制到剪贴板');
        });
    }

    shareText() {
        if (!this.selectedText) return;
        
        if (navigator.share) {
            navigator.share({
                title: '分享文本',
                text: this.selectedText
            }).then(() => {
                this.hideSelectionToolbar();
                window.getSelection().removeAllRanges();
            }).catch(err => {
                console.error('分享失败:', err);
            });
        } else {
            this.copyText();
        }
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #333;
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            z-index: 10001;
            font-size: 0.9rem;
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 3000);
    }

    loadChapter(index) {
        if (index < 0 || index >= this.chapters.length) return;
        
        this.currentChapterIndex = index;
        const chapter = this.chapters[index];
        
        this.splitChapterIntoPages(chapter.content);
        this.pageContent.className = 'page-content paged-mode';
        this.currentPageSpan.textContent = '1';
        this.totalPagesSpan.textContent = this.sections.length;
        
        this.updateTOCHighlight();
        this.bindSelectionEventsToNewContent();
        this.pageContent.scrollTop = 0;
    }

    bindSelectionEventsToNewContent() {
        const contentElements = this.pageContent.querySelectorAll('p, span, div, li, h1, h2, h3, h4, h5, h6');
        
        contentElements.forEach(element => {
            element.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
            });
        });
    }

    splitChapterIntoPages(content) {
        if (this.sections.length > 0 && this.lastContent === content) {
            return;
        }
        
        this.lastContent = content;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        
        tempDiv.style.cssText = `
            position: absolute;
            left: -9999px;
            top: -9999px;
            width: ${this.pageContent.offsetWidth - 40}px;
            padding: 20px;
            font-size: inherit;
            line-height: inherit;
            box-sizing: border-box;
        `;
        
        const pageStyles = window.getComputedStyle(this.pageContent);
        tempDiv.style.fontSize = pageStyles.fontSize;
        tempDiv.style.lineHeight = pageStyles.lineHeight;
        tempDiv.style.fontFamily = pageStyles.fontFamily;
        
        document.body.appendChild(tempDiv);
        
        const container = this.pageContent;
        const containerHeight = container.offsetHeight;
        const containerWidth = container.offsetWidth - 40;
        
        this.sections = [];
        
        const elements = this.getPageElements(tempDiv);
        
        if (elements.length === 0) {
            this.sections.push(content);
        } else {
            let currentPageElements = [];
            let currentHeight = 0;
            
            for (let element of elements) {
                const elementInfo = this.getElementInfo(element, containerWidth);
                
                if (currentHeight > 0 && currentHeight + elementInfo.totalHeight > containerHeight - 40) {
                    this.savePageSection(currentPageElements);
                    currentPageElements = [];
                    currentHeight = 0;
                }
                
                if (elementInfo.totalHeight > containerHeight - 40) {
                    if (currentPageElements.length > 0) {
                        this.savePageSection(currentPageElements);
                        currentPageElements = [];
                        currentHeight = 0;
                    }
                    
                    const splitElements = this.splitLargeElement(element, containerHeight - 40, containerWidth);
                    currentPageElements.push(...splitElements);
                    currentHeight = this.calculateElementsHeight(currentPageElements, containerWidth);
                } else {
                    currentPageElements.push(element);
                    currentHeight += elementInfo.totalHeight;
                }
            }
            
            if (currentPageElements.length > 0) {
                this.savePageSection(currentPageElements);
            }
        }
        
        document.body.removeChild(tempDiv);
        
        if (this.sections.length === 0) {
            this.sections.push(content);
        }
        
        this.renderPagedContent();
        this.currentSectionIndex = 0;
        this.showSection(0);
    }

    savePageSection(elements) {
        const sectionHTML = elements.map(el => el.outerHTML).join('');
        this.sections.push(sectionHTML);
    }

    getPageElements(container) {
        const elements = [];
        const walker = document.createTreeWalker(
            container,
            NodeFilter.SHOW_ELEMENT,
            {
                acceptNode: function(node) {
                    if (['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'PRE', 'UL', 'OL', 'LI', 'TABLE', 'FIGURE'].includes(node.tagName)) {
                        return NodeFilter.FILTER_ACCEPT;
                    }
                    return NodeFilter.FILTER_SKIP;
                }
            }
        );
        
        let node;
        while (node = walker.nextNode()) {
            elements.push(node.cloneNode(true));
        }
        
        return elements;
    }

    getElementInfo(element, containerWidth) {
        const temp = document.createElement('div');
        temp.appendChild(element.cloneNode(true));
        temp.style.cssText = `
            position: absolute;
            left: -9999px;
            top: -9999px;
            width: ${containerWidth}px;
            padding: 0;
            margin: 0;
        `;
        document.body.appendChild(temp);
        
        const height = temp.offsetHeight;
        const style = window.getComputedStyle(element);
        const marginTop = parseFloat(style.marginTop) || 0;
        const marginBottom = parseFloat(style.marginBottom) || 0;
        const totalHeight = height + marginTop + marginBottom;
        
        document.body.removeChild(temp);
        
        return { height, marginTop, marginBottom, totalHeight };
    }

    calculateElementsHeight(elements, containerWidth) {
        if (elements.length === 0) return 0;
        
        const tempContainer = document.createElement('div');
        tempContainer.style.cssText = `
            position: absolute;
            left: -9999px;
            top: -9999px;
            width: ${containerWidth}px;
            padding: 0;
            margin: 0;
        `;
        
        elements.forEach(element => {
            tempContainer.appendChild(element.cloneNode(true));
        });
        
        document.body.appendChild(tempContainer);
        const height = tempContainer.offsetHeight;
        document.body.removeChild(tempContainer);
        
        return height;
    }

    splitLargeElement(element, maxHeight, containerWidth) {
        const elements = [];
        
        if (this.isTextElement(element)) {
            const chunks = this.splitTextElement(element, maxHeight, containerWidth);
            elements.push(...chunks);
        } else {
            elements.push(element.cloneNode(true));
            if (this.getElementInfo(element, containerWidth).totalHeight > maxHeight) {
                const continueMarker = document.createElement('div');
                continueMarker.className = 'continue-marker';
                continueMarker.innerHTML = '(继续...)';
                continueMarker.style.cssText = `
                    text-align: center;
                    color: #666;
                    font-style: italic;
                    margin: 10px 0;
                `;
                elements.push(continueMarker);
            }
        }
        
        return elements;
    }

    isTextElement(element) {
        return ['p', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(element.tagName.toLowerCase());
    }

    splitTextElement(element, maxHeight, containerWidth) {
        const elements = [];
        const originalHTML = element.innerHTML;
        const className = element.className;
        const style = element.style.cssText;
        
        if (!element.textContent.trim()) {
            return [element.cloneNode(true)];
        }
        
        const paragraphs = originalHTML.split(/<\/p>\s*<p[^>]*>/i);
        if (paragraphs.length > 1) {
            for (let i = 0; i < paragraphs.length; i++) {
                let paragraph = paragraphs[i];
                if (i === 0) {
                    paragraph = paragraph.replace(/<p[^>]*>/i, '');
                }
                if (i === paragraphs.length - 1) {
                    paragraph = paragraph.replace(/<\/p>/i, '');
                }
                
                const pElement = document.createElement('p');
                pElement.className = className;
                pElement.style.cssText = style;
                pElement.innerHTML = paragraph;
                
                if (this.getElementInfo(pElement, containerWidth).totalHeight > maxHeight) {
                    const chunks = this.splitBySentences(pElement, maxHeight, containerWidth);
                    elements.push(...chunks);
                } else {
                    elements.push(pElement);
                }
            }
        } else {
            const chunks = this.splitBySentences(element, maxHeight, containerWidth);
            elements.push(...chunks);
        }
        
        return elements;
    }

    splitBySentences(element, maxHeight, containerWidth) {
        const elements = [];
        const text = element.textContent || '';
        const className = element.className;
        const style = element.style.cssText;
        const tagName = element.tagName.toLowerCase();
        
        const sentences = text.split(/([.!?])\s+/);
        let currentChunk = [];
        let currentHTML = '';
        
        for (let i = 0; i < sentences.length; i += 2) {
            const sentence = sentences[i] + (sentences[i + 1] || '');
            currentChunk.push(sentence);
            currentHTML += sentence + ' ';
            
            const tempElement = document.createElement(tagName);
            tempElement.className = className;
            tempElement.style.cssText = style;
            tempElement.textContent = currentHTML;
            
            document.body.appendChild(tempElement);
            const height = this.getElementInfo(tempElement, containerWidth).totalHeight;
            document.body.removeChild(tempElement);
            
            if (height > maxHeight && currentChunk.length > 1) {
                currentChunk.pop();
                const chunkElement = document.createElement(tagName);
                chunkElement.className = className;
                chunkElement.style.cssText = style;
                chunkElement.textContent = currentChunk.join(' ');
                elements.push(chunkElement);
                
                currentChunk = [sentence];
                currentHTML = sentence + ' ';
            }
        }
        
        if (currentChunk.length > 0) {
            const chunkElement = document.createElement(tagName);
            chunkElement.className = className;
            chunkElement.style.cssText = style;
            chunkElement.textContent = currentChunk.join(' ');
            elements.push(chunkElement);
        }
        
        return elements;
    }

    renderPagedContent() {
        const pagedContainer = document.createElement('div');
        pagedContainer.className = 'paged-content';
        pagedContainer.style.cssText = `
            height: 100%;
            position: relative;
            overflow: hidden;
        `;
        
        this.sections.forEach((sectionHtml, index) => {
            const section = document.createElement('div');
            section.className = 'page-section';
            section.innerHTML = sectionHtml;
            section.style.cssText = `
                position: ${index === 0 ? 'relative' : 'absolute'};
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                padding: 20px;
                box-sizing: border-box;
                overflow-y: auto;
                display: ${index === 0 ? 'block' : 'none'};
                background: inherit;
            `;
            pagedContainer.appendChild(section);
        });
        
        this.pageContent.innerHTML = '';
        this.pageContent.appendChild(pagedContainer);
        
        this.bindSelectionEventsToNewContent();
    }

    showSection(index) {
        const sections = this.pageContent.querySelectorAll('.page-section');
        sections.forEach((section, i) => {
            if (i === index) {
                section.style.display = 'block';
                section.classList.add('active');
            } else {
                section.style.display = 'none';
                section.classList.remove('active');
            }
        });
        this.currentSectionIndex = index;
        this.currentPageSpan.textContent = (index + 1).toString();
    }

    toggleSidebar() {
        this.sidebar.classList.toggle('open');
        if (this.sidebar.classList.contains('open')) {
            this.settingsSidebar.classList.remove('open');
        }
    }
    
    prevPage() {
        if (this.currentSectionIndex > 0) {
            this.showSection(this.currentSectionIndex - 1);
        } else if (this.currentChapterIndex > 0) {
            this.loadChapter(this.currentChapterIndex - 1);
        }
    }
    
    nextPage() {
        if (this.currentSectionIndex < this.sections.length - 1) {
            this.showSection(this.currentSectionIndex + 1);
        } else if (this.currentChapterIndex < this.chapters.length - 1) {
            this.loadChapter(this.currentChapterIndex + 1);
        }
    }
    
    showDictionaryModal() {
        this.hideSelectionToolbar();
        
        this.dictionaryModal.classList.add('show');
        this.dictionaryOverlay.classList.add('show');
        this.dictionaryFooter.style.display = 'none';
        
        this.dictionaryContent.innerHTML = `
            <div class="loading">
                <div class="loader"></div>
                <p>查询 "${this.selectedText}"...</p>
            </div>
        `;
        
        this.saveCurrentSelection();
        
        this.fetchDictionaryData(this.selectedText)
            .then(result => {
                this.displayDictionaryResult(result);
                this.dictionaryFooter.style.display = 'block';
            })
            .catch(error => this.displayDictionaryError(error));
    }

    saveCurrentSelection() {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            this.savedSelectionRange = selection.getRangeAt(0).cloneRange();
        }
    }

    restoreSelection() {
        if (this.savedSelectionRange) {
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(this.savedSelectionRange);
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
        this.currentWordData = wordData;
        
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
        this.dictionaryFooter.style.display = 'none';
        
        this.savedSelectionRange = null;
        this.currentWordData = null;
        
        window.getSelection().removeAllRanges();
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
            
            // 修复：使用正确的ePub库加载方式
            if (typeof ePub === 'undefined') {
                throw new Error('ePub库未加载，请检查脚本引入');
            }
            
            this.book = ePub(file);
            
            await new Promise((resolve, reject) => {
                this.book.ready.then(resolve).catch(reject);
            });
            
            const metadata = await this.book.loaded.metadata;
            const title = metadata.title || '未知标题';
            const creator = metadata.creator || '未知作者';
            
            const navigation = await this.book.loaded.navigation;
            
            this.chapters = [];
            this.navigationMap = navigation.toc || [];
            
            const rendition = this.book.renderTo("pageContent", {
                width: "100%",
                height: "100%"
            });
            
            const spine = this.book.spine;
            
            for (let i = 0; i < spine.length; i++) {
                const item = spine.get(i);
                
                if (item && item.linear !== false) {
                    try {
                        await rendition.display(item.href);
                        
                        const iframe = document.querySelector("#pageContent iframe");
                        let content = '';
                        
                        if (iframe && iframe.contentDocument) {
                            content = iframe.contentDocument.body.innerHTML;
                        } else {
                            const section = await this.book.load(item.href);
                            if (section.render) {
                                content = await section.render();
                            } else if (section.document) {
                                content = section.document.body.innerHTML;
                            }
                        }
                        
                        let chapterTitle = `第${i + 1}章`;
                        for (const navItem of this.navigationMap) {
                            if (navItem.href === item.href) {
                                chapterTitle = navItem.label;
                                break;
                            }
                        }
                        
                        content = await this.processContentImages(content, item.href);
                        
                        this.chapters.push({
                            id: item.id,
                            title: chapterTitle,
                            content: content,
                            href: item.href
                        });
                        
                    } catch (e) {
                        this.chapters.push({
                            id: item.id,
                            title: `第${i + 1}章`,
                            content: `<p>无法加载此章节: ${e.message}</p>`,
                            href: item.href
                        });
                    }
                }
            }
            
            rendition.destroy();
            
            if (this.chapters.length === 0) {
                throw new Error('未找到可读的章节内容');
            }
            
            this.currentBook = { title, author: creator };
            this.initializeBook();
            
        } catch (error) {
            this.uploadArea.innerHTML = `
                <div class="upload-icon">❌</div>
                <h3>加载失败</h3>
                <p>${error.message}</p>
                <button class="btn" onclick="location.reload()">重新上传</button>
            `;
        }
    }
                
    async processContentImages(content, baseHref) {
        try {
            if (!content || content.trim() === '') {
                return content;
            }
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(content, 'text/html');
            
            if (doc.querySelector('parsererror')) {
                return content;
            }
            
            const images = doc.querySelectorAll('img');
            
            for (const img of images) {
                const src = img.getAttribute('src');
                
                if (src && !src.startsWith('data:')) {
                    try {
                        const url = this.book.path.resolve(src, baseHref);
                        const blob = await this.book.load(url);
                        
                        if (blob) {
                            const blobUrl = URL.createObjectURL(blob);
                            img.src = blobUrl;
                        }
                    } catch (e) {
                        img.style.backgroundColor = '#f0f0f0';
                        img.alt = '图片加载失败: ' + src;
                    }
                }
            }
            
            const links = doc.querySelectorAll('a[href]');
            
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href && !href.startsWith('#') && !href.startsWith('http')) {
                    const fullPath = this.book.path.resolve(href, baseHref);
                    link.setAttribute('data-href', fullPath);
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.handleInternalLink(fullPath);
                    });
                }
            });
            
            return doc.body.innerHTML;
            
        } catch (error) {
            return content;
        }
    }

    handleInternalLink(href) {
        for (let i = 0; i < this.chapters.length; i++) {
            const chapter = this.chapters[i];
            if (chapter.href === href) {
                this.loadChapter(i);
                return;
            }
        }
        
        this.loadNewChapter(href)
            .then(chapter => {
                this.chapters.push(chapter);
                this.loadChapter(this.chapters.length - 1);
            })
            .catch(error => {
                this.showToast('无法加载链接内容');
            });
    }

    async loadNewChapter(href) {
        try {
            const section = await this.book.load(href);
            let content = section.content || '';
            
            content = await this.processContentImages(content, href);
            
            return {
                id: 'linked-' + Date.now(),
                title: '链接内容',
                content: content,
                href: href
            };
        } catch (error) {
            throw new Error(`无法加载章节: ${error.message}`);
        }
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
        
        if (this.navigationMap.length > 0) {
            this.renderNavigationTree(this.navigationMap, this.tocContainer);
        } else {
            this.chapters.forEach((chapter, index) => {
                const tocItem = document.createElement('div');
                tocItem.className = 'toc-item';
                tocItem.textContent = chapter.title;
                tocItem.addEventListener('click', () => {
                    this.loadChapter(index);
                    if (window.innerWidth <= 768) {
                        this.toggleSidebar();
                    }
                });
                this.tocContainer.appendChild(tocItem);
            });
        }
    }
    
    renderNavigationTree(navItems, container, level = 0) {
        navItems.forEach(item => {
            const tocItem = document.createElement('div');
            tocItem.className = 'toc-item';
            tocItem.style.paddingLeft = `${10 + level * 20}px`;
            tocItem.textContent = item.label;
            
            const chapterIndex = this.findChapterIndexByHref(item.href);
            
            if (chapterIndex !== -1) {
                tocItem.addEventListener('click', () => {
                    this.loadChapter(chapterIndex);
                    if (window.innerWidth <= 768) {
                        this.toggleSidebar();
                    }
                });
            } else {
                tocItem.style.color = '#999';
                tocItem.style.cursor = 'not-allowed';
            }
            
            container.appendChild(tocItem);
            
            if (item.subitems && item.subitems.length > 0) {
                this.renderNavigationTree(item.subitems, container, level + 1);
            }
        });
    }
    
    findChapterIndexByHref(href) {
        for (let i = 0; i < this.chapters.length; i++) {
            const chapter = this.chapters[i];
            if (chapter.href === href) {
                return i;
            }
        }
        return -1;
    }
    
    updateTOCHighlight() {
        const tocItems = document.querySelectorAll('.toc-item');
        tocItems.forEach((item, index) => {
            item.classList.toggle('active', index === this.currentChapterIndex);
        });
    }
    
    prevChapter() {
        if (this.currentChapterIndex > 0) {
            this.loadChapter(this.currentChapterIndex - 1);
        }
    }
    
    nextChapter() {
        if (this.currentChapterIndex < this.chapters.length - 1) {
            this.loadChapter(this.currentChapterIndex + 1);
        }
    }

    getBasePath(filePath) {
        return filePath.includes('/') 
            ? filePath.substring(0, filePath.lastIndexOf('/') + 1)
            : '';
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
}

// 初始化阅读器
document.addEventListener('DOMContentLoaded', () => {
    window.reader = new EPUBReader();
});