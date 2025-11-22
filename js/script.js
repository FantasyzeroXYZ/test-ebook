class EPUBReader {
    constructor() {
        this.currentBook = null;
        this.currentChapterIndex = 0;
        this.chapters = [];
        this.resourceMap = new Map();
        this.dictionaryButton = null;
        this.dictionaryModal = null;
        this.lastSelectionTime = 0;
        this.isSelecting = false;
        this.dictionaryButtonTimeout = null;
        this.viewMode = 'scroll';
        this.currentSectionIndex = 0;
        this.sections = [];
        this.selectionToolbar = null;
        this.lookupWordBtn = null;
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
            audioField: '',
            tagsField: ''
        };
        
        // 新增属性
        this.navigationMap = []; // 真正的目录结构
        
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
        
        // 边缘点击区域
        this.leftEdgeTapArea = document.getElementById('leftEdgeTapArea');
        this.rightEdgeTapArea = document.getElementById('rightEdgeTapArea');
        
        // 设置相关元素
        this.toggleSettingsBtn = document.getElementById('toggleSettings');
        this.settingsSidebar = document.getElementById('settingsSidebar');
        this.closeSettingsBtn = document.getElementById('closeSettings');
        
        // 设置控件
        this.viewModeSelect = document.getElementById('viewMode');
        this.autoScroll = document.getElementById('autoScroll');
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
        this.ankiAudioField = document.getElementById('ankiAudioField');
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
            e.stopPropagation(); // 阻止事件冒泡
            this.fileInput.click();
        });
        
        // 设置按钮事件
        this.toggleSettingsBtn.addEventListener('click', () => this.toggleSettings());
        this.closeSettingsBtn.addEventListener('click', () => this.toggleSettings());
        
        // 设置控件事件
        this.viewModeSelect.addEventListener('change', (e) => {
            this.switchViewMode(e.target.value);
            this.saveSettings();
        });
        this.autoScroll.addEventListener('change', () => this.saveSettings());
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
            e.stopPropagation(); // 阻止事件冒泡
            this.fileInput.click();
        });
        this.fileInput.addEventListener('change', (e) => {
            console.log('文件选择事件触发');
            this.handleFileSelect(e);
        });
        
        // 边缘点击翻页事件
        this.leftEdgeTapArea.addEventListener('click', () => this.prevPage());
        this.rightEdgeTapArea.addEventListener('click', () => this.nextPage());
        
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
            this.ankiWordField, this.ankiMeaningField, 
            this.ankiSentenceField, this.ankiAudioField, this.ankiTagsField
        ];

        fieldSelectors.forEach(select => {
            select.addEventListener('change', () => this.saveAnkiSettings());
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

        // 键盘快捷键
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // 窗口大小变化事件
        window.addEventListener('resize', () => this.handleResize());
    }

    // 初始化设置分组折叠功能
    initializeSettingGroups() {
        const groupHeaders = document.querySelectorAll('.setting-group-header');
        groupHeaders.forEach(header => {
            header.addEventListener('click', () => {
                header.classList.toggle('collapsed');
            });
            // 默认全部折叠
            header.classList.add('collapsed');
        });
    }

    // 窗口大小变化处理
    handleResize() {
        if (this.viewMode === 'paged' && this.chapters.length > 0) {
            // 防抖处理，避免频繁重新分页
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                const currentChapter = this.chapters[this.currentChapterIndex];
                if (currentChapter) {
                    console.log('窗口大小变化，重新分页...');
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
        }
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
        
        this.viewModeSelect.value = settings.viewMode || 'scroll';
        this.autoScroll.checked = settings.autoScroll || false;
        this.fontSize.value = settings.fontSize || 'medium';
        this.theme.value = settings.theme || 'light';
        this.offlineMode.checked = settings.offlineMode || false;
        this.syncProgress.checked = settings.syncProgress !== false;
        
        this.applyFontSize();
        this.applyTheme();
        this.switchViewMode(this.viewModeSelect.value);
    }

    saveSettings() {
        const settings = {
            viewMode: this.viewModeSelect.value,
            autoScroll: this.autoScroll.checked,
            fontSize: this.fontSize.value,
            theme: this.theme.value,
            offlineMode: this.offlineMode.checked,
            syncProgress: this.syncProgress.checked
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
        
        this.restoreFieldSelections();
        
        if (this.ankiSettings.host && this.ankiSettings.port) {
            setTimeout(() => {
                this.testAnkiConnection().then(() => {
                    console.log('Anki连接测试完成');
                });
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
            audioField: this.ankiAudioField.value,
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
            console.log('加载到的牌组:', decks);
            
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
            console.log('加载到的模板:', models);
            
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
            
            console.log('加载到的字段:', fields);
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
            this.ankiSentenceField,
            this.ankiAudioField,
            this.ankiTagsField
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
        
        if (!this.ankiSettings.audioField) {
            if (fieldMap.includes('audio')) {
                this.ankiAudioField.value = 'audio';
            } else if (fieldMap.includes('sound')) {
                this.ankiAudioField.value = 'sound';
            } else if (fields.length > 3) {
                this.ankiAudioField.selectedIndex = 3;
            }
        }
        
        if (!this.ankiSettings.tagsField) {
            if (fieldMap.includes('tags')) {
                this.ankiTagsField.value = 'tags';
            } else if (fields.length > 4) {
                this.ankiTagsField.selectedIndex = 4;
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
        if (this.ankiSettings.audioField) {
            this.ankiAudioField.value = this.ankiSettings.audioField;
        }
        if (this.ankiSettings.tagsField) {
            this.ankiTagsField.value = this.ankiSettings.tagsField;
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
        // 检查连接状态
        if (!this.ankiConnected) {
            const connected = await this.testAnkiConnection();
            if (!connected) {
                this.showToast('请先连接Anki!');
                return;
            }
        }

        // 确保有选中的文本
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

        // 验证必要字段
        if (!this.ankiSettings.wordField || !this.ankiSettings.sentenceField) {
            this.showToast('请配置单词字段和句子字段!');
            return;
        }

        // 保存原始按钮状态
        const originalHTML = this.addToAnkiBtn.innerHTML;
        this.addToAnkiBtn.disabled = true;
        this.addToAnkiBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 添加中...';

        try {
            // 恢复选择范围以确保音频处理能正常工作
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
        console.log('句子字段内容:', sentence);
        
        const definition = this.getWordDefinition();
        
        const note = {
            deckName: this.ankiSettings.deck,
            modelName: this.ankiSettings.model,
            fields: {
                [this.ankiSettings.wordField]: word,
                [this.ankiSettings.sentenceField]: sentence
            },
            options: { allowDuplicate: false },
            tags: ['epub-reader']
        };
        
        if (this.ankiSettings.meaningField && definition) {
            note.fields[this.ankiSettings.meaningField] = definition;
        }
        
        if (this.ankiSettings.tagsField) {
            note.fields[this.ankiSettings.tagsField] = 'epub-reader';
        }
        
        console.log('准备添加到Anki的笔记:', note);
        
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
            let elementWithId = range.startContainer.parentElement;
            
            // 向上查找有ID的元素
            while (elementWithId && !elementWithId.id && elementWithId.parentElement) {
                elementWithId = elementWithId.parentElement;
            }
            
            if (!elementWithId || !elementWithId.id) {
                return selectedText;
            }
            
            const elementId = elementWithId.id;
            
            // 从DOM中获取该ID元素的完整文本内容
            const textElement = document.getElementById(elementId);
            if (textElement) {
                const fullText = textElement.textContent || textElement.innerText;
                const cleanedText = this.cleanSentenceText(fullText);
                console.log('获取的完整句子:', cleanedText);
                return cleanedText || selectedText;
            }
            
            return selectedText;
            
        } catch (error) {
            console.error('获取句子失败:', error);
            return selectedText;
        }
    }

    cleanSentenceText(text) {
        return text
            .replace(/<[^>]*>/g, '') // 移除HTML标签
            .replace(/\s+/g, ' ') // 合并多余空格
            .replace(/[\r\n\t]/g, ' ') // 替换换行和制表符
            .replace(/^[^a-zA-Z]*/, '') // 移除开头的非字母字符
            .replace(/[^a-zA-Z0-9\.!?]*$/, '') // 移除结尾的非字母数字和标点
            .trim();
    }

    async addCardToAnki(note) {
        console.log('准备添加卡片到 Anki:', note);

        try {
            const result = await this.ankiRequest('addNote', { note });
            
            if (result) {
                console.log('✅ 卡片添加成功，ID:', result);
                return result;
            } else {
                console.warn('AnkiConnect 返回空结果，可能未创建卡片');
                throw new Error('卡片创建失败');
            }
            
        } catch (error) {
            if (error.message.includes('duplicate')) {
                console.warn('检测到重复卡片，跳过添加');
                throw new Error('已存在相同卡片');
            } else {
                console.error('添加卡片失败:', error);
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
            if (!this.selectionToolbar.contains(e.target)) {
                this.hideSelectionToolbar();
            }
        });

        document.addEventListener('selectionchange', () => {
            this.handleSelectionChange();
        });

        const preventContextMenu = (e) => {
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
            
            this.readerContent.addEventListener('touchend', (e) => {
                const touchDuration = Date.now() - this.touchStartTime;
                if (touchDuration > 500) {
                    setTimeout(() => {
                        this.handleSelectionChange();
                    }, 100);
                }
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
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        
        console.log('选中的文本:', selectedText, '长度:', selectedText.length);
        
        if (this.selectionTimeout) {
            clearTimeout(this.selectionTimeout);
        }
        
        if (selectedText.length > 0 && selectedText.length < 100) {
            this.selectedText = selectedText;
            
            this.selectionTimeout = setTimeout(() => {
                this.showSelectionToolbar(selection);
                
                if (/Android/i.test(navigator.userAgent)) {
                    setTimeout(() => {
                        if (e) {
                            e.preventDefault();
                            e.stopPropagation();
                        }
                    }, 50);
                }
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
        let finalY = toolbarY - toolbarRect.height - 10;
        
        if (finalX < 10) finalX = 10;
        if (finalX + toolbarRect.width > viewportWidth - 10) {
            finalX = viewportWidth - toolbarRect.width - 10;
        }
        
        if (finalY < 10) {
            finalY = toolbarY + rect.height + 10;
        }
        
        if (finalY + toolbarRect.height > viewportHeight - 10) {
            finalY = viewportHeight - toolbarRect.height - 10;
        }
        
        this.selectionToolbar.style.left = finalX + 'px';
        this.selectionToolbar.style.top = finalY + 'px';
        this.selectionToolbar.style.transform = 'translateY(-110%)';
        
        this.selectionToolbar.classList.add('show');
        
        console.log('显示自定义工具栏，选中文本:', this.selectedText, '位置:', finalX, finalY);
        
        // 保存选择范围
        this.saveCurrentSelection();
        
        if (/Android/i.test(navigator.userAgent)) {
            document.addEventListener('contextmenu', this.preventAndroidToolbar, { once: true });
        }
    }

    preventAndroidToolbar(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }

    lookupWord() {
        if (!this.selectedText) {
            // 如果没有保存的选中文本，尝试从当前选择中获取
            const selection = window.getSelection();
            this.selectedText = selection.toString().trim();
        }
        
        if (!this.selectedText) {
            this.showToast('请先选择文本');
            return;
        }
        
        this.hideSelectionToolbar();
        this.showDictionaryModal();
        
        // 不清除选择，保留选择状态用于后续处理
        // window.getSelection().removeAllRanges();
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
            console.warn('无法高亮此选择:', e);
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
            console.error('复制失败:', err);
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

    switchViewMode(mode) {
        if (this.viewMode === mode) return;
        
        this.viewMode = mode;
        
        if (this.currentChapterIndex !== undefined && this.chapters.length > 0) {
            this.loadChapter(this.currentChapterIndex);
        }
    }

    loadChapter(index) {
        console.log('加载章节:', index);
        if (index < 0 || index >= this.chapters.length) {   
            console.error('章节索引超出范围:', index);
            return;
        }
        
        this.currentChapterIndex = index;
        const chapter = this.chapters[index];

        console.log('当前章节信息:', {
            title: chapter.title,
            contentLength: chapter.content.length
        });
        
        if (this.viewMode === 'scroll') {
            console.log('使用滚动模式显示内容');
            this.pageContent.innerHTML = chapter.content;
            this.pageContent.className = 'page-content scroll-mode';
            this.currentPageSpan.textContent = (index + 1).toString();
            this.totalPagesSpan.textContent = this.chapters.length;
        } else {
            console.log('使用分页模式显示内容');
            this.splitChapterIntoPages(chapter.content);
            this.pageContent.className = 'page-content paged-mode';
            this.currentPageSpan.textContent = '1';
            this.totalPagesSpan.textContent = this.sections.length;
        }

        // 检查页面内容是否成功显示
        setTimeout(() => {
            console.log('页面内容检查:', {
                innerHTML: this.pageContent.innerHTML.length,
                childNodes: this.pageContent.childNodes.length,
                textContent: this.pageContent.textContent?.substring(0, 100)
            });
        }, 100);
        
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
            
            element.addEventListener('touchstart', (e) => {
                this.touchStartTime = Date.now();
            });
            
            element.addEventListener('touchend', (e) => {
                const touchDuration = Date.now() - this.touchStartTime;
                if (touchDuration > 400) {
                    setTimeout(() => {
                        this.handleSelectionChange(e);
                    }, 100);
                }
            });
        });
    }

    splitChapterIntoPages(content) {
        // 如果已经是分页模式且内容没有变化，不需要重新分页
        if (this.sections.length > 0 && this.lastContent === content) {
            console.log('内容未变化，跳过重新分页');
            return;
        }
        
        this.lastContent = content;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        
        // 应用相同的样式
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
        
        // 复制页面内容的样式
        const pageStyles = window.getComputedStyle(this.pageContent);
        tempDiv.style.fontSize = pageStyles.fontSize;
        tempDiv.style.lineHeight = pageStyles.lineHeight;
        tempDiv.style.fontFamily = pageStyles.fontFamily;
        
        document.body.appendChild(tempDiv);
        
        const container = this.pageContent;
        const containerHeight = container.offsetHeight;
        const containerWidth = container.offsetWidth - 40; // 考虑padding
        
        this.sections = [];
        
        // 获取所有需要分页的元素
        const elements = this.getPageElements(tempDiv);
        
        if (elements.length === 0) {
            // 如果没有子元素，直接使用整个内容
            this.sections.push(content);
        } else {
            let currentPageElements = [];
            let currentHeight = 0;
            
            for (let element of elements) {
                const elementInfo = this.getElementInfo(element, containerWidth);
                
                // 如果当前页已经有内容，并且添加这个元素会超出容器高度
                if (currentHeight > 0 && currentHeight + elementInfo.totalHeight > containerHeight - 40) {
                    // 保存当前页
                    this.savePageSection(currentPageElements);
                    currentPageElements = [];
                    currentHeight = 0;
                }
                
                // 如果单个元素本身就超过容器高度
                if (elementInfo.totalHeight > containerHeight - 40) {
                    // 如果当前页有内容，先保存当前页
                    if (currentPageElements.length > 0) {
                        this.savePageSection(currentPageElements);
                        currentPageElements = [];
                        currentHeight = 0;
                    }
                    
                    // 处理超大元素：尝试分割
                    const splitElements = this.splitLargeElement(element, containerHeight - 40, containerWidth);
                    currentPageElements.push(...splitElements);
                    currentHeight = this.calculateElementsHeight(currentPageElements, containerWidth);
                } else {
                    currentPageElements.push(element);
                    currentHeight += elementInfo.totalHeight;
                }
            }
            
            // 添加最后一页
            if (currentPageElements.length > 0) {
                this.savePageSection(currentPageElements);
            }
        }
        
        // 清理临时元素
        document.body.removeChild(tempDiv);
        
        if (this.sections.length === 0) {
            this.sections.push(content);
        }
        
        console.log('分页结果:', this.sections.length, '页');
        
        this.renderPagedContent();
        this.currentSectionIndex = 0;
        this.showSection(0);
    }

    // 保存页面部分
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
                    // 包含常见的文本容器元素
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
        
        return {
            height,
            marginTop,
            marginBottom,
            totalHeight
        };
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
        const elementType = element.tagName.toLowerCase();
        
        if (this.isTextElement(element)) {
            // 对于文本元素，按段落或句子分割
            const chunks = this.splitTextElement(element, maxHeight, containerWidth);
            elements.push(...chunks);
        } else {
            // 对于其他元素，直接添加并在需要时添加继续标记
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

    // 判断是否为文本元素
    isTextElement(element) {
        return ['p', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(element.tagName.toLowerCase());
    }

    // 分割文本元素
    splitTextElement(element, maxHeight, containerWidth) {
        const elements = [];
        const originalHTML = element.innerHTML;
        const className = element.className;
        const style = element.style.cssText;
        
        // 如果是空元素，直接返回
        if (!element.textContent.trim()) {
            return [element.cloneNode(true)];
        }
        
        // 先尝试按段落分割
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
                    // 如果段落还是太大，进一步分割
                    const chunks = this.splitBySentences(pElement, maxHeight, containerWidth);
                    elements.push(...chunks);
                } else {
                    elements.push(pElement);
                }
            }
        } else {
            // 没有段落，按句子分割
            const chunks = this.splitBySentences(element, maxHeight, containerWidth);
            elements.push(...chunks);
        }
        
        return elements;
    }

    // 按句子分割
    splitBySentences(element, maxHeight, containerWidth) {
        const elements = [];
        const text = element.textContent || '';
        const className = element.className;
        const style = element.style.cssText;
        const tagName = element.tagName.toLowerCase();
        
        // 按句子分割（简单的分割规则）
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
                // 当前块已经超过高度，保存之前的块（不包括当前句子）
                currentChunk.pop(); // 移除最后一个句子
                const chunkElement = document.createElement(tagName);
                chunkElement.className = className;
                chunkElement.style.cssText = style;
                chunkElement.textContent = currentChunk.join(' ');
                elements.push(chunkElement);
                
                // 开始新的块
                currentChunk = [sentence];
                currentHTML = sentence + ' ';
            }
        }
        
        // 添加最后一个块
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
        
        console.log('渲染分页内容完成，共', this.sections.length, '页');
        
        // 重新绑定事件
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
        if (this.viewMode === 'scroll') {
            if (this.currentChapterIndex > 0) {
                this.loadChapter(this.currentChapterIndex - 1);
            }
        } else {
            if (this.currentSectionIndex > 0) {
                this.showSection(this.currentSectionIndex - 1);
            } else if (this.currentChapterIndex > 0) {
                this.loadChapter(this.currentChapterIndex - 1);
            }
        }
    }
    
    nextPage() {
        if (this.viewMode === 'scroll') {
            if (this.currentChapterIndex < this.chapters.length - 1) {
                this.loadChapter(this.currentChapterIndex + 1);
            }
        } else {
            if (this.currentSectionIndex < this.sections.length - 1) {
                this.showSection(this.currentSectionIndex + 1);
            } else if (this.currentChapterIndex < this.chapters.length - 1) {
                this.loadChapter(this.currentChapterIndex + 1);
            }
        }
    }
    
    showDictionaryModal() {
        console.log('显示词典弹窗，选中文本:', this.selectedText);
        
        this.hideSelectionToolbar();
        
        // 不清除选择，保留选择状态
        // window.getSelection().removeAllRanges();
        
        this.dictionaryModal.classList.add('show');
        this.dictionaryOverlay.classList.add('show');
        this.dictionaryFooter.style.display = 'none';
        
        this.dictionaryContent.innerHTML = `
            <div class="loading">
                <div class="loader"></div>
                <p>查询 "${this.selectedText}"...</p>
            </div>
        `;
        
        // 保存当前选择范围，防止丢失
        this.saveCurrentSelection();
        
        this.fetchDictionaryData(this.selectedText)
            .then(result => {
                this.displayDictionaryResult(result);
                this.dictionaryFooter.style.display = 'block';
            })
            .catch(error => this.displayDictionaryError(error));
    }

    // 保存当前选择范围
    saveCurrentSelection() {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            this.savedSelectionRange = selection.getRangeAt(0).cloneRange();
        }
    }

    // 恢复选择范围
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
        
        // 清除保存的选择范围
        this.savedSelectionRange = null;
        this.currentWordData = null;
        
        // 最终清除选择
        window.getSelection().removeAllRanges();
    }
    
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file && file.name.endsWith('.epub')) {
            this.loadEPUB(file);
        }
    }
    
    // 使用epub.js加载EPUB文件
    async loadEPUB(file) {
        try {
            console.log('开始加载EPUB文件:', file.name);
            this.uploadArea.innerHTML = '<div class="loader"></div><p>正在解析EPUB文件...</p>';
            
            // 使用epub.js创建书籍对象
            this.book = ePub(file);
            
            // 等待书籍加载完成
            await new Promise((resolve, reject) => {
                this.book.ready.then(resolve).catch(reject);
            });
            
            // 获取书籍元数据
            const metadata = await this.book.loaded.metadata;
            const title = metadata.title || '未知标题';
            const creator = metadata.creator || '未知作者';
            
            // 获取书籍导航
            const navigation = await this.book.loaded.navigation;
            
            // 获取书籍目录
            this.chapters = [];
            this.navigationMap = navigation.toc || [];
            
            // 创建rendition来获取内容
            const rendition = this.book.renderTo("pageContent", {
                width: "100%",
                height: "100%"
            });
            
            // 使用spine顺序构建章节
            const spine = this.book.spine;
            
            for (let i = 0; i < spine.length; i++) {
                const item = spine.get(i);
                
                if (item && item.linear !== false) { // 只处理linear项目
                    try {
                        // 使用rendition.display来获取章节内容
                        await rendition.display(item.href);
                        
                        // 获取渲染后的内容
                        const iframe = document.querySelector("#pageContent iframe");
                        let content = '';
                        
                        if (iframe && iframe.contentDocument) {
                            content = iframe.contentDocument.body.innerHTML;
                        } else {
                            // 备用方法：直接使用section
                            const section = await this.book.load(item.href);
                            if (section.render) {
                                content = await section.render();
                            } else if (section.document) {
                                content = section.document.body.innerHTML;
                            }
                        }
                        
                        // 查找章节标题
                        let chapterTitle = `第${i + 1}章`;
                        for (const navItem of this.navigationMap) {
                            if (navItem.href === item.href) {
                                chapterTitle = navItem.label;
                                break;
                            }
                        }
                        
                        // 处理内容中的资源
                        content = await this.processContentImages(content, item.href);
                        
                        this.chapters.push({
                            id: item.id,
                            title: chapterTitle,
                            content: content,
                            href: item.href
                        });
                        
                    } catch (e) {
                        console.warn(`无法加载章节: ${item.href}`, e);
                        this.chapters.push({
                            id: item.id,
                            title: `第${i + 1}章`,
                            content: `<p>无法加载此章节: ${e.message}</p>`,
                            href: item.href
                        });
                    }
                }
            }
            
            // 销毁rendition
            rendition.destroy();
            
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
                
    // 处理章节内容中的图片
    async processContentImages(content, baseHref) {
        try {
            console.log('开始处理内容图片，baseHref:', baseHref);
            
            if (!content || content.trim() === '') {
                console.warn('内容为空');
                return content;
            }
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(content, 'text/html');
            
            // 检查解析结果
            if (doc.querySelector('parsererror')) {
                console.error('HTML解析错误，返回原始内容');
                return content;
            }
            
            // 处理图片
            const images = doc.querySelectorAll('img');
            console.log('找到图片数量:', images.length);
            
            for (const img of images) {
                const src = img.getAttribute('src');
                console.log('处理图片:', src);
                
                if (src && !src.startsWith('data:')) {
                    try {
                        // 使用epub.js的URL创建方法
                        const url = this.book.path.resolve(src, baseHref);
                        console.log('解析后的图片URL:', url);
                        
                        const blob = await this.book.load(url);
                        
                        if (blob) {
                            const blobUrl = URL.createObjectURL(blob);
                            img.src = blobUrl;
                            console.log('图片加载成功:', src);
                        } else {
                            console.warn('无法获取图片blob:', src);
                        }
                    } catch (e) {
                        console.warn('图片加载失败:', src, e);
                        img.style.backgroundColor = '#f0f0f0';
                        img.alt = '图片加载失败: ' + src;
                    }
                }
            }
            
            // 处理链接
            const links = doc.querySelectorAll('a[href]');
            console.log('找到链接数量:', links.length);
            
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href && !href.startsWith('#') && !href.startsWith('http')) {
                    // 将相对链接转换为绝对路径
                    const fullPath = this.book.path.resolve(href, baseHref);
                    link.setAttribute('data-href', fullPath);
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.handleInternalLink(fullPath);
                    });
                }
            });
            
            const processedContent = doc.body.innerHTML;
            console.log('内容处理完成，长度:', processedContent.length);
            return processedContent;
            
        } catch (error) {
            console.error('处理内容图片时出错:', error);
            return content; // 返回原始内容作为后备
        }
    }

    handleInternalLink(href) {
        console.log('处理内部链接:', href);
        
        // 查找对应的章节
        for (let i = 0; i < this.chapters.length; i++) {
            const chapter = this.chapters[i];
            if (chapter.href === href) {
                this.loadChapter(i);
                return;
            }
        }
        
        // 如果没有找到匹配的章节，尝试加载新章节
        this.loadNewChapter(href)
            .then(chapter => {
                this.chapters.push(chapter);
                this.loadChapter(this.chapters.length - 1);
            })
            .catch(error => {
                console.error('加载链接内容失败:', error);
                this.showToast('无法加载链接内容');
            });
    }

    // 加载新章节
    async loadNewChapter(href) {
        try {
            const section = await this.book.load(href);
            let content = section.content || '';
            
            // 处理章节中的图片
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
            // 使用真正的目录结构
            this.renderNavigationTree(this.navigationMap, this.tocContainer);
        } else {
            // 使用章节顺序
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
            
            // 查找对应的章节索引
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
            
            // 递归渲染子项目
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

    // 辅助方法
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