class EPUBReader {
    constructor() {
        this.currentBook = null;
        this.currentChapterIndex = 0;
        this.chapters = [];
        this.resourceMap = new Map();
        this.viewMode = 'paged';
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
        
        // 音频播放相关属性 - 基于参考代码
        this.audioPlayer = null;
        this.isAudioPlaying = false;
        this.currentAudioFile = null;
        this.audioQueue = [];
        this.audioGroups = new Map();
        this.enableAutoPageTurning = false; // 自动翻页开关
        this.enableAutoScrolling = true; // 新增：自动滚动控制
        this.pageTurnTimeout = null; // 页面翻页定时器
        this.autoPageCheckInterval = null;
        this.currentAudioIndex = -1;
        this.mediaOverlayData = [];
        this.HIGHLIGHT_CLASS = 'audio-highlight';
        
        this.initializeUI();
    }
    
    initializeUI() {
        // 主要UI元素
        this.sidebar = document.getElementById('sidebar');
        this.toggleSidebarBtn = document.getElementById('toggleSidebar');
        this.closeSidebarBtn = document.getElementById('closeSidebar');
        this.tocContainer = document.getElementById('tocContainer');
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
        
        // 音频设置控件
        this.autoPlayAudio = document.getElementById('autoPlayAudio');
        this.syncTextHighlight = document.getElementById('syncTextHighlight');
        this.audioVolume = document.getElementById('audioVolume');
        
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
        
        // 音频播放器元素
        this.audioPlayerContainer = document.getElementById('audioPlayer');
        this.audioPlayPauseBtn = document.getElementById('audioPlayPause');
        this.audioStopBtn = document.getElementById('audioStop');
        this.audioRewindBtn = document.getElementById('audioRewind');
        this.audioForwardBtn = document.getElementById('audioForward');
        this.audioTitle = document.getElementById('audioTitle');
        this.currentTime = document.getElementById('currentTime');
        this.duration = document.getElementById('duration');
        this.audioProgress = document.getElementById('audioProgress');
        this.audioMuteBtn = document.getElementById('audioMute');
        this.volumeSlider = document.getElementById('volumeSlider');
        
        this.bindEvents();
        this.initializeAudioPlayer();
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
        
        // 音频设置事件
        this.autoPlayAudio.addEventListener('change', () => this.saveSettings());
        this.syncTextHighlight.addEventListener('change', () => this.saveSettings());
        this.audioVolume.addEventListener('input', () => {
            this.saveSettings();
            if (this.audioPlayer) {
                this.setVolume(this.audioVolume.value / 100);
            }
        });
        
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

    // 初始化音频播放器 - 基于参考代码
    initializeAudioPlayer() {
        this.audioPlayer = new Audio();
        
        // 音频事件监听
        this.audioPlayer.addEventListener('loadedmetadata', () => {
            if (this.duration) {
                this.duration.textContent = this.formatTime(this.audioPlayer.duration);
            }
            if (this.audioProgress) {
                this.audioProgress.max = this.audioPlayer.duration;
            }
        });
        
        this.audioPlayer.addEventListener('timeupdate', () => {
            if (this.currentTime) {
                this.currentTime.textContent = this.formatTime(this.audioPlayer.currentTime);
            }
            if (this.audioProgress) {
                this.audioProgress.value = this.audioPlayer.currentTime;
            }
            // 重要：在这里调用高亮更新
            this.updateAudioHighlight();
        });
        
        this.audioPlayer.addEventListener('ended', () => {
            this.isAudioPlaying = false;
            if (this.audioPlayPauseBtn) {
                this.audioPlayPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            }
            this.showToast('音频播放结束');
        });
        
        this.audioPlayer.addEventListener('error', (e) => {
            console.error('音频播放错误:', e);
            this.showToast('音频播放错误: ' + e.message);
        });
        
        // 音频控制按钮事件
        if (this.audioPlayPauseBtn) {
            this.audioPlayPauseBtn.addEventListener('click', () => this.toggleAudioPlayback());
        }
        if (this.audioStopBtn) {
            this.audioStopBtn.addEventListener('click', () => this.stopAudio());
        }
        if (this.audioRewindBtn) {
            this.audioRewindBtn.addEventListener('click', () => this.seekAudio(-10));
        }
        if (this.audioForwardBtn) {
            this.audioForwardBtn.addEventListener('click', () => this.seekAudio(10));
        }
        if (this.audioProgress) {
            this.audioProgress.addEventListener('input', () => {
                this.audioPlayer.currentTime = this.audioProgress.value;
            });
        }
        if (this.audioMuteBtn) {
            this.audioMuteBtn.addEventListener('click', () => this.toggleMute());
        }
        if (this.volumeSlider) {
            this.volumeSlider.addEventListener('input', () => {
                this.setVolume(this.volumeSlider.value / 100);
            });
        }
    }

    // 音频播放控制方法
    toggleAudioPlayback() {
        if (this.isAudioPlaying) {
            this.pauseAudio();
        } else {
            this.playAudio();
        }
    }

    playAudio() {
        if (this.audioPlayer && this.audioPlayer.src) {
            this.audioPlayer.play().then(() => {
                this.isAudioPlaying = true;
                if (this.audioPlayPauseBtn) {
                    this.audioPlayPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
                }
                if (this.audioPlayerContainer) {
                    this.audioPlayerContainer.classList.add('show');
                }
            }).catch(error => {
                console.error('播放失败:', error);
                this.showToast('播放失败: ' + error.message);
            });
        } else {
            this.showToast('没有可播放的音频');
        }
    }

    pauseAudio() {
        if (this.audioPlayer) {
            this.audioPlayer.pause();
        }
        this.isAudioPlaying = false;
        if (this.audioPlayPauseBtn) {
            this.audioPlayPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    }

    stopAudio() {
        if (this.audioPlayer) {
            this.audioPlayer.pause();
            this.audioPlayer.currentTime = 0;
        }
        this.isAudioPlaying = false;
        
        if (this.autoPageCheckInterval) {
            clearInterval(this.autoPageCheckInterval);
        }
        
        if (this.audioPlayPauseBtn) {
            this.audioPlayPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
        
        this.clearAudioHighlight();
    }

    seekAudio(seconds) {
        if (this.audioPlayer && this.audioPlayer.src) {
            this.audioPlayer.currentTime += seconds;
            if (this.audioPlayer.currentTime < 0) {
                this.audioPlayer.currentTime = 0;
            }
        }
    }

    toggleMute() {
        if (this.audioPlayer) {
            this.audioPlayer.muted = !this.audioPlayer.muted;
            if (this.audioMuteBtn) {
                this.audioMuteBtn.innerHTML = this.audioPlayer.muted ? 
                    '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
            }
        }
    }

    setVolume(volume) {
        if (this.audioPlayer) {
            this.audioPlayer.volume = volume;
        }
        if (this.volumeSlider) {
            this.volumeSlider.value = volume * 100;
        }
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return '00:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // 基于参考代码的音频高亮系统
    updateAudioHighlight() {
        if (!this.isAudioPlaying || !this.currentAudioFile) return;
        
        const currentTime = this.audioPlayer.currentTime;
        const currentFragment = this.findFragmentByTime(currentTime);
        
        if (currentFragment && currentFragment.index !== this.currentAudioIndex) {
            console.log('=== 音频高亮更新 ===', {
                播放时间: currentTime.toFixed(2),
                前一个片段: this.currentAudioIndex,
                新片段: currentFragment.index,
                片段ID: currentFragment.fragmentId
            });
            
            // 清除之前的高亮
            if (this.currentAudioIndex >= 0) {
                this.highlightCurrentFragment(false, this.currentAudioIndex);
            }
            
            // 更新当前片段索引
            this.currentAudioIndex = currentFragment.index;
            
            // 尝试高亮新片段
            const highlightSuccess = this.highlightCurrentFragment(true, this.currentAudioIndex);
            
            if (!highlightSuccess && this.enableAutoPageTurning) {
                console.log('高亮失败，启动自动翻页');
                // 如果高亮失败且自动翻页启用，尝试翻页
                setTimeout(() => {
                    this.autoTurnToCurrentPage(currentFragment);
                }, 100);
            }
        }
    }

    // 强制翻页到指定片段
    forceTurnToPage(currentFragment) {
        console.log('强制翻页到片段:', currentFragment.fragmentId);
        
        // 方法1: 在当前章节的所有页面中搜索
        if (this.sections && this.sections.length > 0) {
            for (let i = 0; i < this.sections.length; i++) {
                if (this.sections[i].includes(currentFragment.fragmentId)) {
                    this.showSection(i);
                    
                    // 翻页后重新高亮
                    setTimeout(() => {
                        this.highlightCurrentFragment(true, currentFragment.index);
                        this.scrollToFragmentById(currentFragment.fragmentId);
                    }, 500);
                    return;
                }
            }
        }
        
        // 方法2: 智能预测翻页
        this.smartPageTurn(currentFragment);
    }

    // 智能翻页预测
    smartPageTurn(currentFragment) {
        // 基于片段索引预测页面
        const totalFragments = this.mediaOverlayData.length;
        const currentFragmentIndex = currentFragment.index;
        
        if (this.sections && this.sections.length > 0) {
            // 简单线性映射：假设片段均匀分布在页面中
            const estimatedPage = Math.floor((currentFragmentIndex / totalFragments) * this.sections.length);
            const targetPage = Math.max(0, Math.min(this.sections.length - 1, estimatedPage));
            
            console.log(`智能预测翻页: 片段 ${currentFragmentIndex}/${totalFragments} -> 第 ${targetPage + 1} 页`);
            
            this.showSection(targetPage);
            
            // 翻页后重新高亮
            setTimeout(() => {
                this.highlightCurrentFragment(true, currentFragment.index);
                this.scrollToFragmentById(currentFragment.fragmentId);
            }, 500);
        }
    }

    // 检查并翻页
    checkAndTurnPage(currentFragment) {
        const fragmentId = currentFragment.fragmentId;
        
        // 检查元素是否在当前可见页面
        const isInCurrentPage = this.isElementInCurrentPage(fragmentId);
        
        if (!isInCurrentPage) {
            console.log('检测到需要翻页');
            this.autoTurnToCurrentPage(currentFragment);
        }
    }

    // 检查元素是否在当前可见页面
    isElementInCurrentPage(fragmentId) {
        // 检查主文档
        if (document.getElementById(fragmentId)) return true;
        
        // 检查iframe
        const iframe = document.querySelector('#pageContent iframe');
        if (iframe && iframe.contentDocument && iframe.contentDocument.getElementById(fragmentId)) {
            return true;
        }
        
        // 检查当前显示的页面区块
        const activeSection = document.querySelector('.page-section.active');
        if (activeSection && activeSection.querySelector(`#${fragmentId}`)) {
            return true;
        }
        
        return false;
    }

    // 自动翻页到当前片段所在的页面
    autoTurnToCurrentPage(currentFragment) {
        if (!currentFragment || !currentFragment.fragmentId) return;
        
        const fragmentId = currentFragment.fragmentId;
        console.log('🚀 自动翻页到片段:', fragmentId);
        
        // 1. 直接在所有页面中查找包含该片段的页面
        const targetPageIndex = this.findPageContainingFragment(fragmentId);
        
        if (targetPageIndex !== -1 && targetPageIndex !== this.currentSectionIndex) {
            console.log(`🔄 翻页: ${this.currentSectionIndex + 1} -> ${targetPageIndex + 1}`);
            this.showSection(targetPageIndex);
            
            // 翻页后高亮并滚动
            setTimeout(() => {
                const targetEl = this.findElementInCurrentPage(fragmentId);
                if (targetEl) {
                    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    targetEl.classList.add(this.HIGHLIGHT_CLASS, 'active');
                    console.log('✅ 翻页后高亮成功');
                }
            }, 300);
        } else if (targetPageIndex === this.currentSectionIndex) {
            console.log('✅ 已在正确页面');
            // 在当前页面滚动到元素
            const targetEl = this.findElementInCurrentPage(fragmentId);
            if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
            console.log('❌ 未找到包含片段的页面');
        }
    }

    // 执行实际的页面翻页
    performPageTurn(targetPageIndex, fragmentId, fragmentIndex) {
        console.log(`🔄 执行翻页: 第 ${this.currentSectionIndex + 1} 页 -> 第 ${targetPageIndex + 1} 页`);
        
        // 保存当前状态
        const currentPage = this.currentSectionIndex;
        
        // 执行翻页
        this.showSection(targetPageIndex);
        
        // 监听页面切换完成
        let checkCount = 0;
        const maxChecks = 10;
        
        const checkPageTurnComplete = () => {
            checkCount++;
            
            if (this.currentSectionIndex === targetPageIndex) {
                console.log('✅ 页面切换完成');
                
                // 等待页面渲染后查找元素并滚动
                setTimeout(() => {
                    const targetEl = this.findElementInCurrentPage(fragmentId);
                    if (targetEl) {
                        console.log('✅ 翻页后找到元素，开始滚动');
                        this.scrollToElement(targetEl);
                        // 重新高亮
                        this.highlightCurrentFragment(true, fragmentIndex);
                    } else {
                        console.log('❌ 翻页后仍未找到元素');
                        if (checkCount < maxChecks) {
                            setTimeout(checkPageTurnComplete, 100);
                        }
                    }
                }, 200);
                
            } else if (checkCount < maxChecks) {
                console.log(`等待页面切换... (${checkCount}/${maxChecks})`);
                setTimeout(checkPageTurnComplete, 100);
            } else {
                console.log('❌ 页面切换超时');
            }
        };
        
        // 开始检查
        setTimeout(checkPageTurnComplete, 100);
    }

    scrollToElement(element) {
        if (!element) return;
        
        try {
            console.log('开始滚动到元素...');
            
            // 检查元素是否在 iframe 中
            const iframe = document.querySelector('#pageContent iframe');
            if (iframe && iframe.contentDocument && iframe.contentDocument.contains(element)) {
                // 在 iframe 中滚动
                console.log('在 iframe 中滚动');
                element.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center',
                    inline: 'nearest'
                });
            } else {
                // 在主文档中滚动
                console.log('在主文档中滚动');
                element.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center',
                    inline: 'nearest'
                });
            }
            
            console.log('✅ 滚动指令已发送');
            
            // 添加视觉反馈
            element.style.transition = 'all 0.3s ease';
            setTimeout(() => {
                if (element) {
                    element.style.transition = '';
                }
            }, 300);
            
        } catch (e) {
            console.warn('滚动失败:', e);
            // 备用滚动方法
            try {
                const rect = element.getBoundingClientRect();
                const yOffset = rect.top + window.pageYOffset - 100;
                window.scrollTo({ top: yOffset, behavior: 'smooth' });
            } catch (fallbackError) {
                console.error('备用滚动也失败:', fallbackError);
            }
        }
    }

    fallbackPageTurn(currentFragment) {
        console.log('使用备用翻页方法');
        
        // 基于片段索引估算页面
        if (this.mediaOverlayData.length > 0 && this.sections && this.sections.length > 0) {
            const fragmentIndex = currentFragment.index;
            const totalFragments = this.mediaOverlayData.length;
            const totalPages = this.sections.length;
            
            // 简单线性映射
            const estimatedPage = Math.floor((fragmentIndex / totalFragments) * totalPages);
            const safePage = Math.max(0, Math.min(totalPages - 1, estimatedPage));
            
            console.log(`估算翻页: 片段 ${fragmentIndex}/${totalFragments} -> 第 ${safePage + 1} 页`);
            
            this.showSection(safePage);
            
            // 翻页后尝试高亮
            setTimeout(() => {
                const success = this.highlightCurrentFragment(true, currentFragment.index);
                if (success) {
                    console.log('✅ 备用方法高亮成功');
                } else {
                    console.log('❌ 备用方法高亮失败');
                }
            }, 500);
        }
    }

    // 在当前章节的所有页面中查找包含片段的页面
    findPageContainingFragment(fragmentId) {
        if (!this.sections || this.sections.length === 0) return -1;
        
        for (let i = 0; i < this.sections.length; i++) {
            if (this.sections[i].includes(fragmentId)) {
                return i;
            }
        }
        return -1;
    }

    // 添加调试信息，检查分页系统状态
    checkPaginationSystem() {
        console.log('=== 分页系统状态检查 ===');
        console.log('分页数据:', this.sections ? `有 ${this.sections.length} 页` : '无');
        console.log('当前页面:', this.currentSectionIndex);
        
        // 检查DOM中的页面区块
        const sections = document.querySelectorAll('.page-section');
        console.log('DOM中的页面区块:', sections.length);
        
        sections.forEach((section, i) => {
            console.log(`区块 ${i}: display=${section.style.display}, active=${section.classList.contains('active')}`);
        });
        
        // 检查页面指示器
        if (this.currentPageSpan) {
            console.log('当前页面指示器:', this.currentPageSpan.textContent);
        }
        if (this.totalPagesSpan) {
            console.log('总页数指示器:', this.totalPagesSpan.textContent);
        }
    }

    findAndDisplayCorrectPage(fragment) {
        const fragmentId = this.extractFragmentId(fragment.textSrc);
        if (!fragmentId) return;
        
        // 方法1: 在当前章节的分页中查找
        if (this.sections && this.sections.length > 0) {
            for (let i = 0; i < this.sections.length; i++) {
                const sectionContent = this.sections[i];
                if (sectionContent.includes(fragmentId)) {
                    console.log(`找到片段在第 ${i + 1} 页`);
                    this.showSection(i);
                    
                    // 等待页面渲染后滚动到片段
                    setTimeout(() => {
                        this.scrollToFragmentById(fragmentId);
                    }, 300);
                    return;
                }
            }
        }
        
        // 方法2: 使用文本内容匹配（备用方案）
        this.findPageByTextContent(fragment, fragmentId);
    }

    // 通过文本内容查找页面
    findPageByTextContent(fragment, fragmentId) {
        // 获取片段的文本内容（从SMIL数据或通过其他方式）
        const fragmentText = this.getFragmentText(fragment);
        if (!fragmentText) return;
        
        console.log('通过文本内容查找页面:', fragmentText.substring(0, 50));
        
        // 在当前章节的所有页面中搜索
        if (this.sections && this.sections.length > 0) {
            for (let i = 0; i < this.sections.length; i++) {
                const sectionContent = this.sections[i];
                if (sectionContent.includes(fragmentText) || 
                    this.fuzzyMatch(sectionContent, fragmentText)) {
                    console.log(`通过文本匹配找到片段在第 ${i + 1} 页`);
                    this.showSection(i);
                    
                    setTimeout(() => {
                        this.scrollToFragmentById(fragmentId);
                    }, 500);
                    return;
                }
            }
        }
        
        console.log('❌ 无法找到包含片段的页面');
    }

    // 获取片段的文本内容
    getFragmentText(fragment) {
        // 这里可以从SMIL数据中获取更多信息，或者通过其他方式
        // 暂时返回空，依赖ID查找
        return '';
    }

    // 模糊匹配文本
    fuzzyMatch(text, search) {
        if (!text || !search) return false;
        return text.toLowerCase().includes(search.toLowerCase());
    }

    // 在当前页面查找元素
    findElementInCurrentPage(fragmentId) {
        // 在主文档中查找
        let targetEl = document.getElementById(fragmentId);
        
        // 在iframe中查找
        if (!targetEl) {
            const iframe = document.querySelector('#pageContent iframe');
            if (iframe && iframe.contentDocument) {
                targetEl = iframe.contentDocument.getElementById(fragmentId);
            }
        }
        
        // 在当前页面区块中查找
        if (!targetEl) {
            const activeSection = document.querySelector('.page-section.active');
            if (activeSection) {
                targetEl = activeSection.querySelector(`#${fragmentId}`);
            }
        }
        
        return targetEl;
    }

    scrollToFragmentById(fragmentId) {
        if (!fragmentId) return;
        
        console.log('滚动到片段:', fragmentId);
        
        try {
            let targetEl = null;
            
            // 在主文档中查找
            targetEl = document.getElementById(fragmentId);
            
            // 在iframe中查找
            if (!targetEl) {
                const iframe = document.querySelector('#pageContent iframe');
                if (iframe && iframe.contentDocument) {
                    targetEl = iframe.contentDocument.getElementById(fragmentId);
                }
            }
            
            // 在当前页面的内容中查找
            if (!targetEl && this.pageContent) {
                targetEl = this.pageContent.querySelector(`#${fragmentId}`);
            }
            
            if (targetEl) {
                // 使用平滑滚动
                targetEl.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center',
                    inline: 'nearest'
                });
                
                // 添加视觉反馈
                targetEl.style.transition = 'all 0.3s ease';
                setTimeout(() => {
                    if (targetEl) {
                        targetEl.style.transition = '';
                    }
                }, 300);
                
                console.log('✅ 滚动成功:', fragmentId);
            } else {
                console.log('❌ 未找到要滚动的元素:', fragmentId);
                
                // 如果找不到元素，可能是需要翻页
                this.schedulePageTurnCheck(fragmentId);
            }
        } catch (e) {
            console.warn('滚动失败:', e);
        }
    }

    // 调度页面检查，用于处理跨页面的片段
    schedulePageTurnCheck(fragmentId) {
        if (this.pageTurnTimeout) {
            clearTimeout(this.pageTurnTimeout);
        }
        
        this.pageTurnTimeout = setTimeout(() => {
            const fragment = this.findFragmentById(fragmentId);
            if (fragment) {
                console.log('检测到需要翻页的片段:', fragmentId);
                this.autoTurnToCurrentPage({
                    index: fragment.originalIndex,
                    fragmentId: fragmentId
                });
            }
        }, 500);
    }

    // 根据片段ID查找片段
    findFragmentById(fragmentId) {
        for (let i = 0; i < this.mediaOverlayData.length; i++) {
            const fragment = this.mediaOverlayData[i];
            const currentFragmentId = this.extractFragmentId(fragment.textSrc);
            if (currentFragmentId === fragmentId) {
                return {
                    ...fragment,
                    index: i
                };
            }
        }
        return null;
    }

    findFragmentByTime(currentTime) {
        const fragments = this.audioGroups.get(this.currentAudioFile);
        
        if (!fragments) {
            console.log('没有找到该音频文件的片段:', this.currentAudioFile);
            return null;
        }
        
        console.log('在该音频文件中查找片段，总片段数:', fragments.length);
        
        for (let i = 0; i < fragments.length; i++) {
            const fragment = fragments[i];
            const startTime = this.timeToSeconds(fragment.clipBegin);
            const endTime = this.timeToSeconds(fragment.clipEnd);
            
            // 添加容错范围
            const timeTolerance = 0.5; // 0.5秒容错
            
            if (currentTime >= (startTime - timeTolerance) && currentTime < (endTime + timeTolerance)) {
                const fragmentId = this.extractFragmentId(fragment.textSrc);
                console.log(`找到片段 ${i}: ${startTime}s - ${endTime}s, ID: ${fragmentId}`);
                
                return {
                    index: fragment.originalIndex,
                    fragmentId: fragmentId,
                    startTime: startTime,
                    endTime: endTime
                };
            }
        }
        
        console.log('未找到对应时间点的片段，当前时间:', currentTime);
        return null;
    }

    timeToSeconds(timeStr) {
        if (!timeStr) return 0;
        if (timeStr.endsWith('s')) {
            return parseFloat(timeStr.slice(0, -1));
        }
        const parts = timeStr.split(':').map(parseFloat);
        if (parts.length === 3) {
            return parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
        return parseFloat(timeStr); 
    }

    extractFragmentId(textSrc) {
        const textParts = textSrc.split('#');
        return textParts.length > 1 ? textParts[1] : null;
    }

    highlightCurrentFragment(highlight, index) {
        const fragment = this.mediaOverlayData[index];
        if (!fragment) return false;
        
        const fragmentId = this.extractFragmentId(fragment.textSrc);
        if (!fragmentId) return false;

        // 如果要开启高亮，先检查是否需要翻页
        if (highlight && this.enableAutoPageTurning) {
            const targetPageIndex = this.findPageContainingFragment(fragmentId);
            if (targetPageIndex !== -1 && targetPageIndex !== this.currentSectionIndex) {
                console.log(`🎯 需要翻页到第 ${targetPageIndex + 1} 页`);
                this.autoTurnToCurrentPage({
                    index: index,
                    fragmentId: fragmentId
                });
                return false; // 翻页中，暂时不高亮
            }
        }
        
        // 执行高亮
        const targetEl = this.findElementInCurrentPage(fragmentId);
        if (targetEl) {
            targetEl.classList.toggle(this.HIGHLIGHT_CLASS, highlight);
            targetEl.classList.toggle('active', highlight);
            return true;
        }
        
        return false;
    }

    // 强制每5秒检查一次是否需要翻页（备用方案）
    startAutoPageTurnCheck() {
        if (this.autoPageCheckInterval) {
            clearInterval(this.autoPageCheckInterval);
        }
        
        this.autoPageCheckInterval = setInterval(() => {
            if (this.isAudioPlaying && this.currentAudioIndex >= 0) {
                const currentFragment = this.mediaOverlayData[this.currentAudioIndex];
                if (currentFragment) {
                    const fragmentId = this.extractFragmentId(currentFragment.textSrc);
                    const targetEl = this.findElementInCurrentPage(fragmentId);
                    
                    if (!targetEl) {
                        console.log('🕒 定时检查：需要翻页');
                        this.autoTurnToCurrentPage({
                            index: this.currentAudioIndex,
                            fragmentId: fragmentId
                        });
                    }
                }
            }
        }, 5000); // 每5秒检查一次
    }


    // 检查元素是否在可见区域内
    isElementInViewport(element) {
        if (!element) return false;
        
        try {
            let rect;
            let viewportHeight, viewportWidth;
            
            // 检查元素是否在 iframe 中
            const iframe = document.querySelector('#pageContent iframe');
            if (iframe && iframe.contentDocument && iframe.contentDocument.contains(element)) {
                // 元素在 iframe 中，使用 iframe 的坐标系
                rect = element.getBoundingClientRect();
                viewportHeight = iframe.clientHeight;
                viewportWidth = iframe.clientWidth;
                console.log('使用 iframe 坐标系');
            } else {
                // 元素在主文档中
                rect = element.getBoundingClientRect();
                viewportHeight = window.innerHeight || document.documentElement.clientHeight;
                viewportWidth = window.innerWidth || document.documentElement.clientWidth;
                console.log('使用主文档坐标系');
            }
            
            console.log('元素位置详情:', {
                top: rect.top,
                bottom: rect.bottom,
                left: rect.left,
                right: rect.right,
                height: rect.height,
                width: rect.width,
                viewportHeight: viewportHeight,
                viewportWidth: viewportWidth
            });
            
            // 宽松的可见性检查：只要元素的任何部分在视口内就认为可见
            const isVisible = (
                rect.top <= viewportHeight && 
                rect.bottom >= 0 &&
                rect.left <= viewportWidth && 
                rect.right >= 0
            );
            
            // 更严格的检查：元素的主要部分在视口内
            const isMainlyVisible = (
                rect.top >= -rect.height * 0.5 &&  // 允许一半高度在视口外
                rect.bottom <= viewportHeight + rect.height * 0.5 &&
                rect.left >= -rect.width * 0.5 &&
                rect.right <= viewportWidth + rect.width * 0.5
            );
            
            console.log('可见性结果:', {
                宽松可见: isVisible,
                主要可见: isMainlyVisible
            });
            
            return isMainlyVisible; // 使用主要可见性检查
            
        } catch (error) {
            console.warn('可见性检查失败:', error);
            return false;
        }
    }

    clearAudioHighlight() {
        const highlightedElements = document.querySelectorAll('.' + this.HIGHLIGHT_CLASS);
        highlightedElements.forEach(el => {
            el.classList.remove(this.HIGHLIGHT_CLASS, 'active');
        });
    }

    scrollToFragment(textSrc) {
        const fragmentId = this.extractFragmentId(textSrc);
        if (fragmentId) {
            const targetEl = document.getElementById(fragmentId);
            if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    // 基于参考代码的Media Overlay解析
    async loadAudioFromEPUB(book) {
        try {
            // 等待book完全加载
            await book.ready;
            
            console.log('开始加载音频信息...');
            
            const manifest = await book.loaded.manifest;
            console.log('EPUB Manifest 条目数量:', Object.keys(manifest).length);
            
            // 更宽泛的 SMIL 文件查找条件
            const smilItems = Object.values(manifest).filter(item => {
                if (!item || !item.href) return false;
                
                const href = item.href.toLowerCase();
                const type = (item.type || '').toLowerCase();
                const id = (item.id || '').toLowerCase();
                
                return (
                    type.includes('smil') ||
                    href.includes('.smil') ||
                    id.includes('smil') ||
                    href.includes('mediaoverlay') ||
                    id.includes('mediaoverlay') ||
                    type === 'application/smil+xml' ||
                    type === 'application/smil'
                );
            });
            
            console.log('找到SMIL文件:', smilItems.length);
            
            if (smilItems.length === 0) {
                this.showToast('未找到Media Overlay数据（SMIL文件）');
                
                // 显示所有manifest条目用于调试
                console.log('所有manifest条目:');
                Object.values(manifest).forEach((item, index) => {
                    console.log(`${index}: ${item.href} - ${item.type} - ${item.id}`);
                });
                
                return;
            }

            this.showToast(`找到 ${smilItems.length} 个SMIL文件，正在解析...`);
            
            // 逐个处理SMIL文件
            this.mediaOverlayData = [];
            let totalFragments = 0;
            let successfulFiles = 0;
            
            for (const smilItem of smilItems) {
                try {
                    console.log('--- 开始处理SMIL文件:', smilItem.href, '---');
                    const result = await this.processSingleSmilFile(smilItem);
                    if (result && result.fragmentsAdded > 0) {
                        this.mediaOverlayData.push(...result.fragments);
                        totalFragments += result.fragmentsAdded;
                        successfulFiles++;
                        console.log(`✅ 成功处理 ${smilItem.href}: ${result.fragmentsAdded} 个片段`);
                    } else {
                        console.log(`⚠️ 处理 ${smilItem.href} 无有效片段`);
                    }
                } catch (error) {
                    console.error(`❌ 处理 ${smilItem.href} 失败:`, error);
                }
            }
            
            console.log('解析完成:', {
                总SMIL文件: smilItems.length,
                成功解析: successfulFiles,
                总片段数: totalFragments
            });
            
            if (this.mediaOverlayData.length === 0) {
                this.showToast('无法解析有效的媒体覆盖数据');
                return;
            }

            // 分组音频片段
            this.audioGroups = this.groupFragmentsByAudio();
            console.log('音频分组数量:', this.audioGroups.size);
            
            // 显示分组信息和调试数据
            console.log('=== 媒体覆盖数据详细分析 ===');
            console.log('媒体覆盖数据总数:', this.mediaOverlayData.length);
            console.log('音频分组详情:');
            
            this.audioGroups.forEach((fragments, audioFile) => {
                console.log(`📁 音频文件 ${audioFile}: ${fragments.length} 个片段`);
                
                // 显示前3个片段的详细信息用于调试
                fragments.slice(0, 3).forEach((fragment, index) => {
                    const fragmentId = this.extractFragmentId(fragment.textSrc);
                    console.log(`  片段 ${index}:`, {
                        textSrc: fragment.textSrc,
                        fragmentId: fragmentId,
                        audioSrc: fragment.audioSrc,
                        clipBegin: fragment.clipBegin,
                        clipEnd: fragment.clipEnd,
                        originalIndex: fragment.originalIndex
                    });
                });
            });

            // 检查高亮系统所需的数据
            console.log('=== 高亮系统数据检查 ===');
            if (this.mediaOverlayData.length > 0) {
                const sampleFragment = this.mediaOverlayData[0];
                console.log('示例片段数据:', {
                    textSrc: sampleFragment.textSrc,
                    fragmentId: this.extractFragmentId(sampleFragment.textSrc),
                    audioSrc: sampleFragment.audioSrc
                });
                
                // 检查HTML元素是否存在
                const sampleFragmentId = this.extractFragmentId(sampleFragment.textSrc);
                if (sampleFragmentId) {
                    console.log('检查HTML元素是否存在...');
                    
                    // 在主文档中查找
                    let element = document.getElementById(sampleFragmentId);
                    if (element) {
                        console.log('✅ 在主文档中找到元素:', sampleFragmentId);
                    } else {
                        console.log('❌ 在主文档中未找到元素:', sampleFragmentId);
                        
                        // 在iframe中查找
                        const iframe = document.querySelector('#pageContent iframe');
                        if (iframe && iframe.contentDocument) {
                            element = iframe.contentDocument.getElementById(sampleFragmentId);
                            if (element) {
                                console.log('✅ 在iframe中找到元素:', sampleFragmentId);
                            } else {
                                console.log('❌ 在iframe中也未找到元素:', sampleFragmentId);
                            }
                        }
                    }
                }
            }
            
            if (this.audioTitle) {
                this.audioTitle.textContent = `发现 ${this.mediaOverlayData.length} 个同步片段`;
            }
            
            this.showToast(`音频加载完成，找到 ${this.mediaOverlayData.length} 个同步片段`);

            // 自动播放逻辑 - 添加高亮系统测试
            if (this.autoPlayAudio && this.autoPlayAudio.checked && this.audioGroups.size > 0) {
                const firstAudioFile = Array.from(this.audioGroups.keys())[0];
                const fragments = this.audioGroups.get(firstAudioFile);
                console.log('准备播放第一个音频:', firstAudioFile, '包含', fragments.length, '个片段');
                
                // 启用自动翻页
                this.enableAutoPageTurning = true;
                console.log('✅ 自动翻页功能已启用');
                
                setTimeout(() => {
                    this.playAudioFile(firstAudioFile).catch(error => {
                        console.error('自动播放失败:', error);
                        this.showToast('自动播放失败: ' + error.message);
                    });
                }, 2000);
            }
            
        } catch (error) {
            console.error('加载音频信息失败:', error);
            this.showToast('加载音频失败: ' + error.message);
        }
    }

    async buildPlaybackQueue(smilItems) {
        this.mediaOverlayData = [];
        
        const processingPromises = smilItems.map(smilItem => this.processSingleSmilFile(smilItem));
        const results = await Promise.allSettled(processingPromises);

        let totalFragments = 0;
        
        results.forEach(result => {
            if (result.status === 'fulfilled' && result.value) {
                totalFragments += result.value.fragmentsAdded;
                this.mediaOverlayData.push(...result.value.fragments);
            }
        });
    }

    async processSingleSmilFile(smilItem) {
        try {
            console.log('正在处理SMIL文件:', smilItem.href);
            
            let contentText = '';
            let finalPath = '';
            
            // 🚀 方法1: 直接使用原始路径（不添加前缀）
            try {
                finalPath = smilItem.href;
                console.log('尝试直接路径:', finalPath);
                
                // 使用 book.load() 方法
                const smilContent = await this.book.load(finalPath);
                
                if (smilContent instanceof Blob) {
                    contentText = await smilContent.text();
                } else if (typeof smilContent === 'string') {
                    contentText = smilContent;
                }
                
                if (contentText) {
                    console.log('✅ 使用直接路径成功:', finalPath);
                } else {
                    throw new Error("No content");
                }
                
            } catch (loadError) {
                console.log('❌ 直接路径失败:', loadError.message);
                
                // 🚀 方法2: 尝试使用 resolveSmilPath 解析的路径
                try {
                    finalPath = this.resolveSmilPath(smilItem.href);
                    console.log('尝试解析路径:', finalPath);
                    
                    const smilContent = await this.book.load(finalPath);
                    
                    if (smilContent instanceof Blob) {
                        contentText = await smilContent.text();
                    } else if (typeof smilContent === 'string') {
                        contentText = smilContent;
                    }
                    
                    if (contentText) {
                        console.log('✅ 使用解析路径成功:', finalPath);
                    } else {
                        throw new Error("No content");
                    }
                    
                } catch (loadError2) {
                    console.log('❌ 解析路径失败:', loadError2.message);
                    
                    // 🚀 方法3: 尝试使用 archive 方法
                    if (this.book.archive) {
                        try {
                            console.log('尝试 archive.getText 直接路径:', smilItem.href);
                            contentText = await this.book.archive.getText(smilItem.href);
                            
                            if (contentText) {
                                console.log('✅ archive.getText 直接路径成功');
                                finalPath = smilItem.href;
                            } else {
                                throw new Error("No content");
                            }
                        } catch (archiveError) {
                            console.log('❌ archive.getText 直接路径失败:', archiveError.message);
                            
                            try {
                                console.log('尝试 archive.getText 解析路径:', finalPath);
                                contentText = await this.book.archive.getText(finalPath);
                                
                                if (contentText) {
                                    console.log('✅ archive.getText 解析路径成功');
                                }
                            } catch (archiveError2) {
                                console.log('❌ archive.getText 解析路径失败:', archiveError2.message);
                            }
                        }
                    }
                }
            }
            
            // 检查内容是否为空
            if (!contentText || contentText.trim().length === 0) {
                console.warn('SMIL 文件内容为空或无效，最终尝试路径:', finalPath);
                
                // 🚀 最终尝试: 调试 EPUB 结构
                try {
                    console.log('调试 EPUB 结构...');
                    const manifest = await this.book.loaded.manifest;
                    const spine = await this.book.loaded.spine;
                    
                    console.log('Manifest 中的所有文件:');
                    Object.values(manifest).forEach(item => {
                        if (item.href && (item.href.includes('.smil') || item.href.includes('MediaOverlay'))) {
                            console.log('SMIL相关文件:', item.href, item.type);
                        }
                    });
                    
                    console.log('Spine 项目:');
                    spine.forEach(item => {
                        console.log('Spine项目:', item.href, item.id);
                    });
                    
                } catch (debugError) {
                    console.log('调试信息获取失败:', debugError);
                }
                
                return { fragments: [], fragmentsAdded: 0, smilHref: smilItem.href };
            }
            
            console.log('SMIL 文件内容长度:', contentText.length);
            
            const fragments = [];
            const parser = new DOMParser();
            
            try {
                // 解析 XML
                const xmlDoc = parser.parseFromString(contentText, "application/xml");
                
                // 检查 XML 解析错误
                const parseError = xmlDoc.getElementsByTagName("parsererror")[0];
                if (parseError) {
                    console.error('XML解析错误:', parseError.textContent);
                    return { fragments: [], fragmentsAdded: 0, smilHref: smilItem.href };
                }
                
                // 查找 par 元素
                const parElements = xmlDoc.getElementsByTagName('par');
                console.log('找到 par 元素数量:', parElements.length);
                
                let fragmentsAdded = 0;
                
                for (let i = 0; i < parElements.length; i++) {
                    const par = parElements[i];
                    const textElements = par.getElementsByTagName('text');
                    const audioElements = par.getElementsByTagName('audio');
                    
                    if (textElements.length > 0 && audioElements.length > 0) {
                        const text = textElements[0];
                        const audio = audioElements[0];
                        
                        let textSrc = text.getAttribute('src');
                        let audioSrc = audio.getAttribute('src');
                        
                        // 兼容不同的属性命名
                        const clipBegin = audio.getAttribute('clipBegin') || 
                                        audio.getAttribute('clip-begin');
                        const clipEnd = audio.getAttribute('clipEnd') || 
                                    audio.getAttribute('clip-end');
                        
                        if (textSrc && audioSrc) {
                            // 解析路径 - 使用更简单的方法
                            const resolvedTextSrc = this.simpleResolvePath(textSrc, smilItem.href);
                            const resolvedAudioSrc = this.simpleResolvePath(audioSrc, smilItem.href);
                            
                            console.log('解析片段:', {
                                textSrc,
                                audioSrc,
                                resolvedTextSrc,
                                resolvedAudioSrc,
                                clipBegin,
                                clipEnd
                            });
                            
                            fragments.push({
                                textSrc: resolvedTextSrc,
                                audioSrc: resolvedAudioSrc,
                                clipBegin: clipBegin,
                                clipEnd: clipEnd,
                                originalIndex: fragmentsAdded,
                                smilFile: smilItem.href
                            });
                            
                            fragmentsAdded++;
                            
                            if (fragmentsAdded <= 3) {
                                console.log(`片段 ${fragmentsAdded}: ${resolvedTextSrc} -> ${resolvedAudioSrc}`);
                            }
                        }
                    }
                }
                
                console.log('成功解析片段数量:', fragmentsAdded);
                return { 
                    fragments, 
                    fragmentsAdded,
                    smilHref: smilItem.href
                };
                
            } catch (parseError) {
                console.error('解析SMIL内容失败:', parseError);
                return { fragments: [], fragmentsAdded: 0, smilHref: smilItem.href };
            }
            
        } catch (error) {
            console.error(`SMIL文件 ${smilItem.href} 处理失败:`, error);
            return { fragments: [], fragmentsAdded: 0, smilHref: smilItem.href };
        }
    }

    // 添加简化的路径解析方法
    simpleResolvePath(relativePath, baseFile) {
        if (!relativePath) return '';
        
        // 如果已经是绝对路径，直接返回
        if (relativePath.startsWith('/')) {
            return relativePath;
        }

        // 获取基准目录
        const baseDir = baseFile.includes('/') 
            ? baseFile.substring(0, baseFile.lastIndexOf('/') + 1)
            : '';
        
        // 简单拼接路径
        let fullPath = baseDir + relativePath;
        
        // 处理简单的相对路径
        const pathParts = fullPath.split('/').filter(part => part !== '');
        const resolvedParts = [];
        
        for (const part of pathParts) {
            if (part === '..') {
                if (resolvedParts.length > 0) {
                    resolvedParts.pop();
                }
            } else if (part !== '.') {
                resolvedParts.push(part);
            }
        }
        
        return '/' + resolvedParts.join('/');
    }

    resolveSmilPath(smilPath) {
        console.log('原始SMIL路径:', smilPath);
        
        // 如果已经是绝对路径，直接返回
        if (smilPath.startsWith('/')) {
            return smilPath;
        }
        
        // 尝试获取 packagePath
        let packagePath = '';
        try {
            if (this.book && this.book.container) {
                packagePath = this.book.container.packagePath || '';
                console.log('Package路径:', packagePath);
            }
        } catch (error) {
            console.log('获取packagePath失败:', error);
        }
        
        // 构建路径
        let finalPath = smilPath;
        
        if (packagePath && packagePath.includes('/')) {
            const baseDir = packagePath.substring(0, packagePath.lastIndexOf('/') + 1);
            finalPath = baseDir + smilPath;
        }
        
        // 确保以斜杠开头
        if (!finalPath.startsWith('/')) {
            finalPath = '/' + finalPath;
        }
        
        // 清理路径中的重复斜杠
        finalPath = finalPath.replace(/\/+/g, '/');
        
        console.log('解析SMIL路径:', smilPath, '->', finalPath);
        return finalPath;
    }

    resolvePath(relativePath, baseFile) {
        if (!relativePath) return '';
        
        if (relativePath.startsWith('/')) {
            return relativePath;
        }

        const baseDir = baseFile.substring(0, baseFile.lastIndexOf('/') + 1);
        let fullPath = baseDir + relativePath;

        const pathParts = fullPath.split('/');
        const resolvedParts = [];
        
        for (const part of pathParts) {
            if (part === '..') {
                if (resolvedParts.length > 0 && resolvedParts[resolvedParts.length - 1] !== '..') {
                    resolvedParts.pop();
                }
            } else if (part !== '.' && part !== '') {
                resolvedParts.push(part);
            }
        }
        
        let finalPath = '/' + resolvedParts.join('/');
        if (finalPath.startsWith('//')) {
            finalPath = finalPath.substring(1);
        }
        
        return finalPath;
    }

    groupFragmentsByAudio() {
        const groups = new Map();
        
        this.mediaOverlayData.forEach((fragment, index) => {
            const audioFile = fragment.audioSrc;
            if (!groups.has(audioFile)) {
                groups.set(audioFile, []);
            }
            groups.get(audioFile).push({
                ...fragment,
                originalIndex: index
            });
        });
        
        return groups;
    }

    // 播放指定音频文件
    async playAudioFile(audioFile) {
        try {
            console.log('🎵 开始播放音频文件:', audioFile);
            
            // 启用自动翻页
            this.enableAutoPageTurning = true;
            this.startAutoPageTurnCheck();
            
            // 获取音频URL
            const audioUrl = await this.getAudioUrl(audioFile);
            
            if (!audioUrl) {
                throw new Error('无法获取音频URL');
            }
            
            // 设置音频源
            if (this.audioPlayer) {
                this.audioPlayer.src = audioUrl;
                this.audioPlayer.currentTime = 0;
                
                // 重置状态
                this.clearAudioHighlight();
                this.currentAudioIndex = -1;
                this.currentAudioFile = audioFile;
                
                // 开始播放
                await this.audioPlayer.play();
                this.isAudioPlaying = true;
                
                if (this.audioPlayPauseBtn) {
                    this.audioPlayPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
                }
                
                console.log('🎵 音频播放开始，自动翻页已启用');
                this.showToast('开始播放，自动翻页中...');
                
            } else {
                throw new Error('音频播放器未初始化');
            }
            
        } catch (error) {
            console.error('播放音频文件失败:', error);
            this.showToast('播放音频失败: ' + error.message);
            throw error;
        }
    }

    // 强制定位到片段
    forcePositionToFragment(fragmentId, fragmentIndex) {
        console.log('🎯 强制定位到片段:', fragmentId);
        
        let targetEl = this.findElementInCurrentPage(fragmentId);
        
        if (targetEl) {
            console.log('✅ 找到元素，直接滚动');
            this.scrollToElement(targetEl);
            this.highlightCurrentFragment(true, fragmentIndex);
        } else {
            console.log('❌ 未找到元素，尝试翻页');
            this.autoTurnToCurrentPage({
                index: fragmentIndex,
                fragmentId: fragmentId
            });
        }
    }

    updateFragmentId(id) {
        // 这个方法在参考代码中存在，但在你的代码中缺失
        // 如果你需要显示当前片段ID，可以在这里实现
        console.log('当前片段ID:', id);
    }

    updateStatus(message, type = 'success') {
        // 这个方法在参考代码中存在，但在你的代码中缺失
        const statusEl = document.getElementById('player-status');
        if (statusEl) {
            statusEl.innerHTML = '<span class="' + type + '">' + message + '</span>';
        }
    }

    async getAudioUrl(audioPath) {
        console.log('获取音频URL:', audioPath);
        
        // 音频路径现在是类似 "/Audio/00000-00001.mp3" 的格式
        let internalPath = audioPath.startsWith('/') ? audioPath.substring(1) : audioPath;
        
        // 1. 初始化路径尝试列表
        const pathsToTest = [];

        // 2. 添加原始解析结果 (绝对路径和相对路径)
        pathsToTest.push('/' + internalPath); // /OEBPS/Audio/...
        pathsToTest.push(internalPath); // OEBPS/Audio/...

        // 3. 清理路径（如果 internalPath 包含 OEBPS/ 或 OPS/，尝试去除）
        let cleanedPath = internalPath;
        if (cleanedPath.toLowerCase().startsWith('oebps/') || cleanedPath.toLowerCase().startsWith('ops/')) {
            const parts = cleanedPath.split('/');
            parts.shift(); // 移除 OEBPS 或 OPS
            cleanedPath = parts.join('/');
            pathsToTest.push(cleanedPath); // Audio/...
            pathsToTest.push('/' + cleanedPath); // /Audio/...
        }
        
        // 4. 路径猜测：增加 OPS/ OEBPS/ 前缀 (以防原始解析未包含)
        const primaryPrefixes = ['OEBPS', 'OPS'];
        for (const prefix of primaryPrefixes) {
            // a) OEBPS/Audio/... (不带斜杠，EPUB内部精确键名)
            if (!internalPath.startsWith(prefix + '/')) {
                pathsToTest.push(prefix + '/' + internalPath); 
                // b) /OEBPS/Audio/... (带斜杠，绝对路径形式)
                pathsToTest.push('/' + prefix + '/' + internalPath); 
            }
        }

        // 5. 进行所有路径的尝试
        const finalPaths = [...new Set(pathsToTest)]; // 去重

        for (const pathForArchive of finalPaths) {
            
            console.log(`尝试获取音频: ${pathForArchive}`); 

            // --- 尝试 Blob 获取 (优先) ---
            try {
                const blob = await this.book.archive.getBlob(pathForArchive); 
                const url = URL.createObjectURL(blob);
                console.log(`✅ 音频URL获取成功 (Blob): ${pathForArchive}`);
                return url;
            } catch (error) {
                // 忽略 Blob 失败
            }
        }
        
        // 6. 如果所有尝试都失败，抛出错误
        throw new Error('File not found in the epub: ' + internalPath);
    }

    // 获取音频 MIME 类型的方法
    getAudioMimeType(fileName) {
        const extension = fileName.split('.').pop().toLowerCase();
        
        const mimeTypes = {
            'mp3': 'audio/mpeg',
            'mp4': 'audio/mp4',
            'm4a': 'audio/mp4',
            'm4b': 'audio/mp4',
            'ogg': 'audio/ogg',
            'wav': 'audio/wav',
            'aac': 'audio/aac',
            'flac': 'audio/flac',
            'webm': 'audio/webm'
        };
        
        const mimeType = mimeTypes[extension] || 'audio/mp4'; // 默认使用 audio/mp4
        
        console.log('文件扩展名:', extension, 'MIME类型:', mimeType);
        return mimeType;
    }

    // 初始化设置分组折叠功能
    initializeSettingGroups() {
        const groupHeaders = document.querySelectorAll('.setting-group-header');
        groupHeaders.forEach(header => {
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
            case ' ':
                e.preventDefault();
                this.toggleAudioPlayback();
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
        if (this.toggleThemeBtn) {
            this.toggleThemeBtn.innerHTML = this.isDarkMode ? 
                '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        }
        this.saveSettings();
    }

    // 设置相关方法
    toggleSettings() {
        if (this.settingsSidebar) {
            this.settingsSidebar.classList.toggle('open');
            if (this.settingsSidebar.classList.contains('open') && this.sidebar) {
                this.sidebar.classList.remove('open');
            }
        }
    }

    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('epubReaderSettings') || '{}');
        
        if (this.fontSize) this.fontSize.value = settings.fontSize || 'medium';
        if (this.theme) this.theme.value = settings.theme || 'light';
        if (this.offlineMode) this.offlineMode.checked = settings.offlineMode || false;
        if (this.syncProgress) this.syncProgress.checked = settings.syncProgress !== false;
        this.isDarkMode = settings.darkMode || false;
        if (this.autoPlayAudio) this.autoPlayAudio.checked = settings.autoPlayAudio !== false;
        if (this.syncTextHighlight) this.syncTextHighlight.checked = settings.syncTextHighlight !== false;
        if (this.audioVolume) this.audioVolume.value = settings.audioVolume || 80;
        
        document.body.classList.toggle('dark-mode', this.isDarkMode);
        if (this.toggleThemeBtn) {
            this.toggleThemeBtn.innerHTML = this.isDarkMode ? 
                '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        }
        
        this.applyFontSize();
        this.applyTheme();
        
        setTimeout(() => {
            if (this.audioPlayer) {
                this.setVolume((settings.audioVolume || 80) / 100);
            }
        }, 100);
    }

    saveSettings() {
        const settings = {
            fontSize: this.fontSize ? this.fontSize.value : 'medium',
            theme: this.theme ? this.theme.value : 'light',
            offlineMode: this.offlineMode ? this.offlineMode.checked : false,
            syncProgress: this.syncProgress ? this.syncProgress.checked : true,
            darkMode: this.isDarkMode,
            autoPlayAudio: this.autoPlayAudio ? this.autoPlayAudio.checked : true,
            syncTextHighlight: this.syncTextHighlight ? this.syncTextHighlight.checked : true,
            audioVolume: this.audioVolume ? this.audioVolume.value : 80
        };
        
        localStorage.setItem('epubReaderSettings', JSON.stringify(settings));
    }

    applyFontSize() {
        const fontSize = this.fontSize ? this.fontSize.value : 'medium';
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
        const theme = this.theme ? this.theme.value : 'light';
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
        
        if (this.ankiHost) this.ankiHost.value = this.ankiSettings.host;
        if (this.ankiPort) this.ankiPort.value = this.ankiSettings.port;
        if (this.ankiDeck) this.ankiDeck.value = this.ankiSettings.deck;
        if (this.ankiModel) this.ankiModel.value = this.ankiSettings.model;
        if (this.ankiTagsField) this.ankiTagsField.value = this.ankiSettings.tagsField || 'epub-reader';
        
        this.restoreFieldSelections();
        
        if (this.ankiSettings.host && this.ankiSettings.port) {
            setTimeout(() => {
                this.testAnkiConnection();
            }, 1000);
        }
    }

    saveAnkiSettings() {
        this.ankiSettings = {
            host: this.ankiHost ? this.ankiHost.value : '127.0.0.1',
            port: this.ankiPort ? parseInt(this.ankiPort.value) : 8765,
            deck: this.ankiDeck ? this.ankiDeck.value : '',
            model: this.ankiModel ? this.ankiModel.value : '',
            wordField: this.ankiWordField ? this.ankiWordField.value : '',
            meaningField: this.ankiMeaningField ? this.ankiMeaningField.value : '',
            sentenceField: this.ankiSentenceField ? this.ankiSentenceField.value : '',
            tagsField: this.ankiTagsField ? this.ankiTagsField.value : 'epub-reader'
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
            
            const currentDeck = this.ankiDeck ? this.ankiDeck.value : '';
            
            if (this.ankiDeck) {
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
            }
            
        } catch (error) {
            console.error('获取牌组列表错误:', error);
            this.showToast('获取牌组列表失败');
        }
    }

    async loadAnkiModels() {
        try {
            const models = await this.ankiRequest('modelNames', {});
            
            const currentModel = this.ankiModel ? this.ankiModel.value : '';
            
            if (this.ankiModel) {
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
            if (select) {
                select.innerHTML = '<option value="">选择字段</option>';
                fields.forEach(field => {
                    const option = document.createElement('option');
                    option.value = field;
                    option.textContent = field;
                    select.appendChild(option);
                });
            }
        });
        
        this.restoreFieldSelections();
    }

    setDefaultFields(fields) {
        const fieldMap = fields.map(f => f.toLowerCase());
        
        if (!this.ankiSettings.wordField && this.ankiWordField) {
            if (fieldMap.includes('word')) {
                this.ankiWordField.value = 'word';
            } else if (fieldMap.includes('front')) {
                this.ankiWordField.value = 'front';
            } else if (fields.length > 0) {
                this.ankiWordField.selectedIndex = 0;
            }
        }
        
        if (!this.ankiSettings.sentenceField && this.ankiSentenceField) {
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
        
        if (!this.ankiSettings.meaningField && this.ankiMeaningField) {
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
        if (this.ankiSettings.wordField && this.ankiWordField) {
            this.ankiWordField.value = this.ankiSettings.wordField;
        }
        if (this.ankiSettings.meaningField && this.ankiMeaningField) {
            this.ankiMeaningField.value = this.ankiSettings.meaningField;
        }
        if (this.ankiSettings.sentenceField && this.ankiSentenceField) {
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

        const originalHTML = this.addToAnkiBtn ? this.addToAnkiBtn.innerHTML : '';
        if (this.addToAnkiBtn) {
            this.addToAnkiBtn.disabled = true;
            this.addToAnkiBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 添加中...';
        }

        try {
            this.restoreSelection();
            await this.processAnkiCard();
            this.showToast('✅ 单词已成功添加到Anki!');
            this.hideDictionaryModal();
        } catch (error) {
            console.error('添加卡片失败:', error);
            this.showToast('❌ 添加失败: ' + error.message);
        } finally {
            if (this.addToAnkiBtn) {
                this.addToAnkiBtn.disabled = false;
                this.addToAnkiBtn.innerHTML = originalHTML;
            }
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
            
            let paragraph = range.startContainer.parentElement;
            while (paragraph && paragraph.nodeType === Node.ELEMENT_NODE && 
                   !['P', 'DIV', 'SECTION', 'ARTICLE', 'BLOCKQUOTE'].includes(paragraph.tagName) &&
                   paragraph.parentElement) {
                paragraph = paragraph.parentElement;
            }
            
            if (paragraph && paragraph.textContent) {
                const fullParagraph = paragraph.textContent.trim();
                const selectedIndex = fullParagraph.indexOf(selectedText);
                if (selectedIndex !== -1) {
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
        let sentenceStart = 0;
        for (let i = selectionStart - 1; i >= 0; i--) {
            if (['.', '!', '?', '\n'].includes(text[i])) {
                sentenceStart = i + 1;
                break;
            }
        }
        
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
            .replace(/[^a-zA-Z00-9\.!?]*$/, '')
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
            if (this.selectionToolbar && !this.selectionToolbar.contains(e.target)) {
                this.hideSelectionToolbar();
            }
        });
        
        document.addEventListener('touchstart', (e) => {
            if (e.target.closest('.edge-tap-area')) {
                this.touchStartTime = Date.now();
                this.touchStartTarget = e.target;
                return;
            }
            
            if (this.selectionToolbar && !this.selectionToolbar.contains(e.target)) {
                this.hideSelectionToolbar();
            }
        });

        document.addEventListener('touchmove', (e) => {
            if (this.touchStartTarget && e.target !== this.touchStartTarget) {
                this.touchStartTarget = null;
            }
        });

        document.addEventListener('touchend', (e) => {
            if (this.touchStartTarget) {
                const touchDuration = Date.now() - this.touchStartTime;
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
        if (this.dictionaryModal && this.dictionaryModal.classList.contains('show')) {
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
        if (this.selectionToolbar) {
            this.selectionToolbar.classList.remove('show');
        }
        if (this.selectionTimeout) {
            clearTimeout(this.selectionTimeout);
            this.selectionTimeout = null;
        }
    }

    showSelectionToolbar(selection) {
        if (!selection.rangeCount || !this.selectionToolbar) return;
        
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
        let finalY = toolbarY - toolbarRect.height - 5;
        
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
            if (toast.parentNode) {
                document.body.removeChild(toast);
            }
        }, 3000);
    }

    loadChapter(index) {
        if (index < 0 || index >= this.chapters.length) return;
        
        this.currentChapterIndex = index;
        const chapter = this.chapters[index];
        
        this.splitChapterIntoPages(chapter.content);
        if (this.pageContent) {
            this.pageContent.className = 'page-content paged-mode';
        }
        if (this.currentPageSpan) {
            this.currentPageSpan.textContent = '1';
        }
        if (this.totalPagesSpan) {
            this.totalPagesSpan.textContent = this.sections.length;
        }
        
        this.updateTOCHighlight();
        this.bindSelectionEventsToNewContent();
        if (this.pageContent) {
            this.pageContent.scrollTop = 0;
        }
    }

    bindSelectionEventsToNewContent() {
        const contentElements = this.pageContent ? this.pageContent.querySelectorAll('p, span, div, li, h1, h2, h3, h4, h5, h6') : [];
        
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
        
        const pageContentWidth = this.pageContent ? this.pageContent.offsetWidth - 40 : 600;
        tempDiv.style.cssText = `
            position: absolute;
            left: -9999px;
            top: -9999px;
            width: ${pageContentWidth}px;
            padding: 20px;
            font-size: inherit;
            line-height: inherit;
            box-sizing: border-box;
        `;
        
        const pageStyles = this.pageContent ? window.getComputedStyle(this.pageContent) : { fontSize: '1.1rem', lineHeight: '1.6', fontFamily: 'sans-serif' };
        tempDiv.style.fontSize = pageStyles.fontSize;
        tempDiv.style.lineHeight = pageStyles.lineHeight;
        tempDiv.style.fontFamily = pageStyles.fontFamily;
        
        document.body.appendChild(tempDiv);
        
        const container = this.pageContent;
        const containerHeight = container ? container.offsetHeight : 600;
        const containerWidth = pageContentWidth;
        
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
        if (!this.pageContent) return;
        
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
        if (index < 0 || index >= this.sections.length) {
            console.log(`❌ 无效的页面索引: ${index}, 总页数: ${this.sections.length}`);
            return;
        }
        
        console.log(`🔄 显示第 ${index + 1} 页`);
        
        // 更新页面显示
        const sections = this.pageContent.querySelectorAll('.page-section');
        let foundSections = false;
        
        sections.forEach((section, i) => {
            if (i === index) {
                section.style.display = 'block';
                section.classList.add('active');
                foundSections = true;
            } else {
                section.style.display = 'none';
                section.classList.remove('active');
            }
        });
        
        if (!foundSections) {
            console.log('❌ 未找到页面区块元素');
            return;
        }
        
        // 更新状态
        this.currentSectionIndex = index;
        
        // 更新页面指示器
        if (this.currentPageSpan) {
            this.currentPageSpan.textContent = (index + 1).toString();
        }
        
        console.log(`✅ 页面显示完成: 第 ${index + 1} 页`);
    }

    toggleSidebar() {
        if (this.sidebar) {
            this.sidebar.classList.toggle('open');
            if (this.sidebar.classList.contains('open') && this.settingsSidebar) {
                this.settingsSidebar.classList.remove('open');
            }
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
        
        if (this.dictionaryModal) {
            this.dictionaryModal.classList.add('show');
        }
        if (this.dictionaryOverlay) {
            this.dictionaryOverlay.classList.add('show');
        }
        if (this.dictionaryFooter) {
            this.dictionaryFooter.style.display = 'none';
        }
        
        if (this.dictionaryContent) {
            this.dictionaryContent.innerHTML = `
                <div class="loading">
                    <div class="loader"></div>
                    <p>查询 "${this.selectedText}"...</p>
                </div>
            `;
        }
        
        this.saveCurrentSelection();
        
        this.fetchDictionaryData(this.selectedText)
            .then(result => {
                this.displayDictionaryResult(result);
                if (this.dictionaryFooter) {
                    this.dictionaryFooter.style.display = 'block';
                }
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
        if (!this.dictionaryContent) return;
        
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
        if (!this.dictionaryContent) return;
        
        this.dictionaryContent.innerHTML = `
            <div class="error">
                <p>查询失败: ${error.message}</p>
                <p>请检查网络连接或尝试其他单词</p>
            </div>
        `;
    }
    
    hideDictionaryModal() {
        if (this.dictionaryModal) {
            this.dictionaryModal.classList.remove('show');
        }
        if (this.dictionaryOverlay) {
            this.dictionaryOverlay.classList.remove('show');
        }
        if (this.dictionaryFooter) {
            this.dictionaryFooter.style.display = 'none';
        }
        
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
            if (this.uploadArea) {
                this.uploadArea.innerHTML = '<div class="loader"></div><p>正在解析EPUB文件...</p>';
            }
            
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
                height: "100%",
                flow: "scrolled-doc",
                iframeSandbox: 'allow-scripts allow-same-origin'
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
            
            // 加载音频文件 - 基于参考代码的Media Overlay解析
            await this.loadAudioFromEPUB(this.book);
            
            this.initializeBook();
            
        } catch (error) {
            if (this.uploadArea) {
                this.uploadArea.innerHTML = `
                    <div class="upload-icon">❌</div>
                    <h3>加载失败</h3>
                    <p>${error.message}</p>
                    <button class="btn" onclick="location.reload()">重新上传</button>
                `;
            }
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
        if (this.uploadContainer) {
            this.uploadContainer.style.display = 'none';
        }
        if (this.swipeContainer) {
            this.swipeContainer.style.display = 'block';
        }
        if (this.pageContent) {
            this.pageContent.style.display = 'block';
        }
        if (this.totalPagesSpan) {
            this.totalPagesSpan.textContent = this.chapters.length;
        }
        this.generateTOC();
        this.loadChapter(0);
    }
    
    generateTOC() {
        if (!this.tocContainer) return;
        
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
            // 比较href，考虑相对路径和绝对路径
            if (chapter.href === href || 
                chapter.href.endsWith(href) || 
                href.endsWith(chapter.href)) {
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

    resolvePath(relativePath, baseFile) {
        if (!relativePath) return '';
        
        // 如果已经是绝对路径，直接返回
        if (relativePath.startsWith('/')) {
            return relativePath;
        }

        // 如果没有基准文件，返回相对路径
        if (!baseFile) {
            return '/' + relativePath;
        }

        // 解析基准目录
        const baseDir = baseFile.startsWith('/') 
            ? baseFile.substring(0, baseFile.lastIndexOf('/') + 1)
            : baseFile.substring(0, baseFile.lastIndexOf('/') + 1);
        
        let fullPath = baseDir + relativePath;

        // 处理相对路径 (.. 和 .)
        const pathParts = fullPath.split('/').filter(part => part !== '');
        const resolvedParts = [];
        
        for (const part of pathParts) {
            if (part === '..') {
                if (resolvedParts.length > 0) {
                    resolvedParts.pop();
                }
            } else if (part !== '.') {
                resolvedParts.push(part);
            }
        }
        
        let finalPath = '/' + resolvedParts.join('/');
        
        console.log('解析路径:', relativePath, '基于', baseFile, '->', finalPath);
        return finalPath;
    }
}

// 初始化阅读器
document.addEventListener('DOMContentLoaded', () => {
    window.reader = new EPUBReader();
});