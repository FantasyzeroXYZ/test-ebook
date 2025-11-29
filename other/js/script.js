// 全局变量
let book = null;
let rendition = null;
let currentLocation = null;
let isBookLoaded = false;
let currentLanguageMode = 'english';
let selectionTimeout = null;

// DOM 加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// 初始化应用
function initializeApp() {
    // 检查必要的库
    if (!checkLibrariesLoaded()) {
    return;
    }

    console.log('EPUB阅读器初始化完成');
    
    // 绑定事件
    bindEvents();
    
    // 恢复设置
    restoreSettings();
}

// 检查库是否加载
function checkLibrariesLoaded() {
    if (typeof JSZip === 'undefined') {
    showError('JSZip 库加载失败，请刷新页面重试');
    return false;
    }
    
    if (typeof ePub === 'undefined') {
    showError('EPUB.js 库加载失败，请刷新页面重试');
    return false;
    }
    
    return true;
}

// 绑定所有事件
function bindEvents() {
    // 文件输入事件
    const fileInput = document.getElementById('file-input');
    const fileInputWelcome = document.getElementById('file-input-welcome');
    
    if (fileInput) fileInput.addEventListener('change', handleFileSelect);
    if (fileInputWelcome) fileInputWelcome.addEventListener('change', handleFileSelect);
    
    // 控制按钮事件
    const prevBtn = document.getElementById('prev');
    const nextBtn = document.getElementById('next');
    if (prevBtn) prevBtn.addEventListener('click', goPrevPage);
    if (nextBtn) nextBtn.addEventListener('click', goNextPage);
    
    // 主题切换
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
    
    // 侧边栏切换（移动端）
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);
    
    // 阅读设置
    const fontSize = document.getElementById('fontsize');
    const lineHeight = document.getElementById('lineheight');
    const fontFamily = document.getElementById('fontfamily');
    
    if (fontSize) fontSize.addEventListener('input', updateFontSize);
    if (lineHeight) lineHeight.addEventListener('input', updateLineHeight);
    if (fontFamily) fontFamily.addEventListener('change', updateFontFamily);
    
    // 查词面板事件
    const dictClose = document.getElementById('dictionary-close');
    const panelOverlay = document.getElementById('panel-overlay');
    const searchBtn = document.getElementById('panel-search-btn');
    const searchInput = document.getElementById('panel-search-input');
    
    if (dictClose) dictClose.addEventListener('click', closeDictionaryPanel);
    if (panelOverlay) panelOverlay.addEventListener('click', closeDictionaryPanel);
    if (searchBtn) searchBtn.addEventListener('click', handleSearch);
    if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
        handleSearch();
        }
    });
    }
    
    // 文本选择监听
    document.addEventListener('mouseup', handleTextSelection);
}

// 处理文件选择
async function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // 检查文件类型
    if (!file.name.toLowerCase().endsWith('.epub')) {
    showError('请选择有效的 EPUB 文件');
    return;
    }
    
    showLoading(true);
    
    try {
    isBookLoaded = false;
    
    // 更新书籍信息显示
    updateBookInfo('加载中...', '');
    
    const arrayBuffer = await file.arrayBuffer();
    
    // 创建 EPUB 实例
    book = ePub(arrayBuffer);
    
    // 等待书籍加载完成
    await book.ready;
    
    // 获取元数据
    const metadata = book.packaging.metadata;
    
    // 更新书籍信息
    updateBookInfo(metadata.title || '未知标题', metadata.creator || '未知作者');
    
    // 加载封面
    await loadBookCover();
    
    // 初始化阅读器
    await initReader();
    
    // 生成目录
    await generateTOC();
    
    // 隐藏欢迎界面 - 安全地检查元素是否存在
    const welcomeContent = document.getElementById('welcome-content');
    if (welcomeContent) {
        welcomeContent.classList.add('hidden');
    }
    
    isBookLoaded = true;
    
    } catch (error) {
    console.error('加载EPUB文件失败:', error);
    showError('无法加载该EPUB文件：' + (error.message || '未知错误'));
    } finally {
    showLoading(false);
    }
}

// 更新书籍信息
function updateBookInfo(title, author) {
    const titleEl = document.querySelector('.book-title');
    const authorEl = document.querySelector('.book-author');
    
    if (titleEl) titleEl.textContent = title;
    if (authorEl) authorEl.textContent = author;
}

// 加载书籍封面
async function loadBookCover() {
    try {
    const coverUrl = await book.coverUrl();
    const bookCover = document.querySelector('.book-cover');
    if (coverUrl && bookCover) {
        bookCover.innerHTML = `<img src="${coverUrl}" alt="封面" onerror="this.style.display='none'">`;
    }
    } catch (err) {
    console.log('无法加载封面，使用默认图标');
    }
}

// 初始化阅读器
async function initReader() {
    // 清理之前的阅读器
    if (rendition) {
    try {
        rendition.destroy();
    } catch (e) {
        console.log('清理旧阅读器:', e);
    }
    }
    
    const viewer = document.getElementById('viewer');
    if (viewer) {
    viewer.innerHTML = '';
    }
    
    try {
    // 创建新的阅读器
    rendition = book.renderTo('viewer', {
        width: "100%",
        height: "100%",
        manager: "default",
        flow: "scrolled",
        spread: "none"
    });
    
    // 应用设置
    applySettings();
    
    // 生成位置信息
    await book.locations.generate(1024);
    
    // 恢复阅读位置或从头开始
    const lastPos = localStorage.getItem('epub_pos');
    if (lastPos) {
        try {
        await rendition.display(lastPos);
        } catch (e) {
        console.log('恢复位置失败，从头开始');
        await rendition.display();
        }
    } else {
        await rendition.display();
    }
    
    // 设置事件监听
    setupRenditionEvents();
    
    // 更新界面状态
    updateNavigationButtons();
    
    } catch (error) {
    console.error('初始化阅读器失败:', error);
    throw error;
    }
}

// 设置阅读器事件
function setupRenditionEvents() {
    if (!rendition) return;
    
    rendition.on('relocated', function(location) {
    currentLocation = location;
    savePosition();
    updateProgress();
    });
    
    rendition.on('rendered', function(section) {
    currentLocation = section;
    savePosition();
    updateProgress();
    // 延迟启用文本选择，确保iframe已加载
    setTimeout(enableTextSelection, 100);
    });
    
    rendition.on('displayError', function(error) {
    console.log('显示错误:', error);
    if (!error.message || !error.message.includes('No Section Found')) {
        showError('显示内容时出错: ' + (error.message || '未知错误'));
    }
    });
}

// 启用文本选择 - 修复版本
function enableTextSelection() {
    try {
    if (!rendition) return;
    
    const contents = rendition.getContents();
    if (!contents || !contents.length) return;
    
    contents.forEach((content) => {
        try {
        // 安全地获取文档对象
        const doc = content.contentDocument || (content.contentWindow && content.contentWindow.document);
        if (doc && doc.body) {
            doc.body.style.userSelect = 'text';
            doc.body.style.webkitUserSelect = 'text';
            
            // 添加iframe内的文本选择监听
            doc.addEventListener('mouseup', function(e) {
            handleIframeTextSelection(e, doc);
            });
        }
        } catch (error) {
        console.log('处理单个内容时出错:', error);
        }
    });
    } catch (error) {
    console.log('启用文本选择时出错:', error);
    }
}

// 处理iframe内的文本选择
function handleIframeTextSelection(event, doc) {
    if (selectionTimeout) {
    clearTimeout(selectionTimeout);
    }
    
    selectionTimeout = setTimeout(() => {
    try {
        const selection = doc.getSelection();
        const selectedText = selection.toString().trim();
        
        if (selectedText && selectedText.length > 0 && selectedText.length < 50) {
        if (currentLanguageMode === 'english') {
            searchWordInPanel(selectedText);
        } else {
            searchJapaneseWordInPanel(selectedText);
        }
        
        selection.removeAllRanges();
        }
    } catch (error) {
        console.log('处理iframe文本选择时出错:', error);
    }
    }, 100);
}

// 处理主文档的文本选择
function handleTextSelection() {
    if (selectionTimeout) {
    clearTimeout(selectionTimeout);
    }
    
    selectionTimeout = setTimeout(() => {
    try {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        
        if (selectedText && selectedText.length > 0 && selectedText.length < 50) {
        // 检查选择是否在阅读器内
        const viewer = document.getElementById('viewer');
        const isInViewer = viewer && viewer.contains(selection.anchorNode);
        
        if (isInViewer) {
            if (currentLanguageMode === 'english') {
            searchWordInPanel(selectedText);
            } else {
            searchJapaneseWordInPanel(selectedText);
            }
            
            selection.removeAllRanges();
        }
        }
    } catch (error) {
        console.log('处理文本选择时出错:', error);
    }
    }, 100);
}

// 翻页功能
function goPrevPage() {
    if (rendition && isBookLoaded) {
    rendition.prev().catch(handleNavigationError);
    }
}

function goNextPage() {
    if (rendition && isBookLoaded) {
    rendition.next().catch(handleNavigationError);
    }
}

// 处理导航错误
function handleNavigationError(error) {
    if (!error.message || !error.message.includes('No Section Found')) {
    console.log('导航错误:', error);
    }
}

// 应用阅读设置
function applySettings() {
    if (!rendition) return;
    
    const fontSize = document.getElementById('fontsize');
    const lineHeight = document.getElementById('lineheight');
    const fontFamily = document.getElementById('fontfamily');
    
    if (!fontSize || !lineHeight || !fontFamily) return;
    
    const fontSizeValue = fontSize.value + 'px';
    const lineHeightValue = lineHeight.value;
    const fontFamilyValue = fontFamily.value;
    
    try {
    rendition.themes.default({
        'body': {
        'font-size': fontSizeValue,
        'line-height': lineHeightValue,
        'font-family': fontFamilyValue,
        'color': 'var(--text-color)',
        'background-color': 'var(--card-bg)',
        'margin': '0',
        'padding': '20px'
        }
    });
    
    // 更新显示值
    const fontSizeValueEl = document.getElementById('fontsize-value');
    const lineHeightValueEl = document.getElementById('lineheight-value');
    
    if (fontSizeValueEl) fontSizeValueEl.textContent = fontSizeValue;
    if (lineHeightValueEl) lineHeightValueEl.textContent = lineHeightValue;
    } catch (error) {
    console.log('应用设置时出错:', error);
    }
}

// 生成目录
async function generateTOC() {
    try {
    const toc = book.navigation.toc;
    const tocList = document.getElementById('toc');
    
    if (!tocList) return;
    
    tocList.innerHTML = '';
    
    if (toc && toc.length > 0) {
        toc.forEach(item => {
        const li = document.createElement('li');
        li.className = 'toc-item';
        li.textContent = item.label;
        li.addEventListener('click', () => {
            if (rendition) {
            rendition.display(item.href).catch(handleNavigationError);
            // 移动端自动关闭侧边栏
            if (window.innerWidth <= 768) {
                const sidebar = document.querySelector('.sidebar');
                if (sidebar) sidebar.classList.remove('active');
            }
            }
        });
        tocList.appendChild(li);
        });
    } else {
        tocList.innerHTML = '<li class="toc-item">本书没有目录</li>';
    }
    } catch (error) {
    console.log('生成目录时出错:', error);
    const tocList = document.getElementById('toc');
    if (tocList) {
        tocList.innerHTML = '<li class="toc-item">目录加载失败</li>';
    }
    }
}

// 保存阅读位置
function savePosition() {
    if (currentLocation && currentLocation.start) {
    localStorage.setItem('epub_pos', currentLocation.start.cfi);
    }
}

// 更新阅读进度
function updateProgress() {
    if (!book || !book.locations || !currentLocation || !currentLocation.start) return;
    
    try {
    const percentage = book.locations.percentageFromCfi(currentLocation.start.cfi);
    const progressPercent = Math.round(percentage * 100);
    
    const progressPercentEl = document.getElementById('progress-percent');
    const progressFill = document.getElementById('progress-fill');
    const pageInfo = document.getElementById('page-info');
    
    if (progressPercentEl) progressPercentEl.textContent = `${progressPercent}%`;
    if (progressFill) progressFill.style.width = `${progressPercent}%`;
    
    if (book.locations.total && pageInfo) {
        const currentPage = Math.round(book.locations.total * percentage);
        pageInfo.textContent = `${currentPage} / ${book.locations.total}`;
    }
    } catch (error) {
    console.log('更新进度时出错:', error);
    }
}

// 更新导航按钮状态
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prev');
    const nextBtn = document.getElementById('next');
    
    if (prevBtn && nextBtn && isBookLoaded) {
    prevBtn.disabled = false;
    nextBtn.disabled = false;
    }
}

// 设置更新函数
function updateFontSize() {
    applySettings();
    saveSettings();
}

function updateLineHeight() {
    applySettings();
    saveSettings();
}

function updateFontFamily() {
    applySettings();
    saveSettings();
}

// 主题切换
function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('epub_theme', newTheme);
    
    // 更新图标
    const themeIcon = document.querySelector('#theme-toggle .btn-icon');
    if (themeIcon) {
    themeIcon.textContent = newTheme === 'light' ? '🌙' : '☀️';
    }
    
    applySettings();
}

// 侧边栏切换
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
    sidebar.classList.toggle('active');
    }
}

// 保存设置
function saveSettings() {
    const fontSize = document.getElementById('fontsize');
    const lineHeight = document.getElementById('lineheight');
    const fontFamily = document.getElementById('fontfamily');
    
    if (!fontSize || !lineHeight || !fontFamily) return;
    
    const settings = {
    fontSize: fontSize.value,
    lineHeight: lineHeight.value,
    fontFamily: fontFamily.value
    };
    localStorage.setItem('epub_settings', JSON.stringify(settings));
}

// 恢复设置
function restoreSettings() {
    // 主题
    const savedTheme = localStorage.getItem('epub_theme');
    if (savedTheme) {
    document.body.setAttribute('data-theme', savedTheme);
    const themeIcon = document.querySelector('#theme-toggle .btn-icon');
    if (themeIcon) {
        themeIcon.textContent = savedTheme === 'light' ? '🌙' : '☀️';
    }
    }
    
    // 阅读设置
    const savedSettings = localStorage.getItem('epub_settings');
    if (savedSettings) {
    try {
        const settings = JSON.parse(savedSettings);
        const fontSize = document.getElementById('fontsize');
        const lineHeight = document.getElementById('lineheight');
        const fontFamily = document.getElementById('fontfamily');
        
        if (fontSize) fontSize.value = settings.fontSize;
        if (lineHeight) lineHeight.value = settings.lineHeight;
        if (fontFamily) fontFamily.value = settings.fontFamily;
        
        applySettings();
    } catch (error) {
        console.log('恢复设置时出错:', error);
    }
    }
}

// 显示/隐藏加载状态
function showLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) {
    loading.classList.toggle('active', show);
    }
}

// 显示错误
function showError(message) {
    const errorText = document.getElementById('error-text');
    const errorMessage = document.getElementById('error-message');
    
    if (errorText && errorMessage) {
    errorText.textContent = message;
    errorMessage.classList.add('active');
    }
}

// 隐藏错误
function hideError() {
    const errorMessage = document.getElementById('error-message');
    if (errorMessage) {
    errorMessage.classList.remove('active');
    }
}

// ==================== 查词功能 ====================

// 打开词典面板
function openDictionaryPanel() {
    const dictionaryPanel = document.getElementById('dictionary-panel');
    const panelOverlay = document.getElementById('panel-overlay');
    
    if (dictionaryPanel && panelOverlay) {
    dictionaryPanel.classList.add('active');
    panelOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    }
}

// 关闭词典面板
function closeDictionaryPanel() {
    const dictionaryPanel = document.getElementById('dictionary-panel');
    const panelOverlay = document.getElementById('panel-overlay');
    
    if (dictionaryPanel && panelOverlay) {
    dictionaryPanel.classList.remove('active');
    panelOverlay.classList.remove('active');
    document.body.style.overflow = '';
    }
}

// 查询英语单词
async function searchWordInPanel(word) {
    if (!word.trim()) {
    showDictionaryError('请输入要查询的单词');
    return;
    }
    
    openDictionaryPanel();
    showDictionaryLoading();
    
    const searchInput = document.getElementById('panel-search-input');
    if (searchInput) {
    searchInput.value = word;
    }
    
    try {
    const apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
        if (response.status === 404) {
        throw new Error(`未找到单词 "${word}"`);
        } else {
        throw new Error(`查询失败: ${response.status}`);
        }
    }
    
    const data = await response.json();
    displayWordDataInPanel(data);
    } catch (error) {
    showDictionaryError(error.message);
    }
}

// 查询日语单词
async function searchJapaneseWordInPanel(word) {
    if (!word.trim()) {
    showDictionaryError('请输入要查询的单词');
    return;
    }
    
    openDictionaryPanel();
    showDictionaryLoading();
    
    const searchInput = document.getElementById('panel-search-input');
    if (searchInput) {
    searchInput.value = word;
    }
    
    try {
    const apiUrl = `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(word)}`;
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
        throw new Error(`查询失败: ${response.status}`);
    }
    
    const data = await response.json();
    displayJapaneseWordDataInPanel(data);
    } catch (error) {
    showDictionaryError(error.message);
    }
}

// 显示词典加载状态
function showDictionaryLoading() {
    const resultEl = document.getElementById('panel-dictionary-result');
    if (resultEl) {
    resultEl.innerHTML = '<div class="dict-loading">查询中...</div>';
    }
}

// 显示词典错误
function showDictionaryError(message) {
    const resultEl = document.getElementById('panel-dictionary-result');
    if (resultEl) {
    resultEl.innerHTML = `<div class="dict-error">${message}</div>`;
    }
}

// 显示英语单词数据
function displayWordDataInPanel(wordData) {
    const resultEl = document.getElementById('panel-dictionary-result');
    if (!resultEl) return;
    
    if (!Array.isArray(wordData) || wordData.length === 0) {
    showDictionaryError('未找到单词信息');
    return;
    }
    
    const word = wordData[0].word;
    let html = `
    <div class="word-header">
        <div class="word-title">${escapeHtml(word)}</div>
    </div>
    `;
    
    wordData.forEach((entry) => {
    html += `<div class="entry">`;
    
    // 发音
    if (entry.phonetics && entry.phonetics.length > 0) {
        const phonetic = entry.phonetics.find(p => p.text) || entry.phonetics[0];
        if (phonetic && phonetic.text) {
        html += `<div class="pronunciation">/${escapeHtml(phonetic.text)}/</div>`;
        }
    }
    
    // 释义
    if (entry.meanings && Array.isArray(entry.meanings)) {
        entry.meanings.forEach((meaning) => {
        if (meaning.partOfSpeech) {
            html += `<div class="part-of-speech">${escapeHtml(meaning.partOfSpeech)}</div>`;
        }
        
        if (meaning.definitions && Array.isArray(meaning.definitions)) {
            meaning.definitions.forEach((definition, index) => {
            html += `<div class="sense">`;
            html += `<div class="definition"><strong>${index + 1}.</strong> ${escapeHtml(definition.definition)}</div>`;
            
            if (definition.example) {
                html += `<div class="example">${escapeHtml(definition.example)}</div>`;
            }
            
            html += `</div>`;
            });
        }
        
        // 同义词和反义词
        if (meaning.synonyms && meaning.synonyms.length > 0) {
            html += `<div class="synonyms"><span>同义词:</span> ${meaning.synonyms.map(s => escapeHtml(s)).join(', ')}</div>`;
        }
        
        if (meaning.antonyms && meaning.antonyms.length > 0) {
            html += `<div class="antonyms"><span>反义词:</span> ${meaning.antonyms.map(a => escapeHtml(a)).join(', ')}</div>`;
        }
        });
    }
    
    html += `</div>`;
    });
    
    resultEl.innerHTML = html;
}

// 显示日语单词数据
function displayJapaneseWordDataInPanel(wordData) {
    const resultEl = document.getElementById('panel-dictionary-result');
    if (!resultEl) return;
    
    if (!wordData.data || !Array.isArray(wordData.data) || wordData.data.length === 0) {
    showDictionaryError('未找到该日语单词');
    return;
    }
    
    const entry = wordData.data[0];
    const japanese = entry.japanese[0];
    const word = japanese.word || japanese.reading;
    
    let html = `
    <div class="word-header">
        <div class="word-title">${escapeHtml(word)}</div>
    `;
    
    if (japanese.reading && japanese.word) {
    html += `<div class="pronunciation">${escapeHtml(japanese.reading)}</div>`;
    }
    
    html += `</div>`;
    
    if (entry.senses && Array.isArray(entry.senses)) {
    entry.senses.forEach((sense, index) => {
        html += `<div class="entry">`;
        html += `<div class="part-of-speech">${sense.parts_of_speech ? sense.parts_of_speech.join(', ') : ''}</div>`;
        
        if (sense.english_definitions && Array.isArray(sense.english_definitions)) {
        html += `<div class="sense">`;
        html += `<div class="definition"><strong>${index + 1}.</strong> ${sense.english_definitions.map(def => escapeHtml(def)).join(', ')}</div>`;
        html += `</div>`;
        }
        
        html += `</div>`;
    });
    }
    
    resultEl.innerHTML = html;
}

// 处理搜索
function handleSearch() {
    const input = document.getElementById('panel-search-input');
    if (!input) return;
    
    const word = input.value.trim();
    
    if (!word) {
    showDictionaryError('请输入要查询的单词');
    return;
    }
    
    if (currentLanguageMode === 'english') {
    searchWordInPanel(word);
    } else {
    searchJapaneseWordInPanel(word);
    }
}

// HTML转义
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}