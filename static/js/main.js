/**
 * Batch Image Generator - Frontend JavaScript
 * จัดการ UI interactions, AJAX calls, และ real-time updates
 */

// ===== Global Variables =====
let currentJobId = null;
let statusCheckInterval = null;
let promptCounter = 0;
let promptCounterRef = 0;  // แยก counter สำหรับ Reference mode

// ===== API Key Management =====
const API_KEY_STORAGE_KEY = 'gemini_api_key';
const PRESETS_STORAGE_KEY = 'gemini_prompts_presets';
const THEME_STORAGE_KEY = 'gemini_theme';

// ===== DOM Elements =====
// API Key Modal Elements
const apiKeyModal = document.getElementById('apiKeyModal');
const apiKeyInput = document.getElementById('apiKeyInput');
const toggleApiKeyVisibility = document.getElementById('toggleApiKeyVisibility');
const testAndSaveKeyBtn = document.getElementById('testAndSaveKeyBtn');
const apiKeyStatus = document.getElementById('apiKeyStatus');
const changeApiKeyBtn = document.getElementById('changeApiKeyBtn');
const apiKeySettings = document.getElementById('apiKeySettings');
const themeLightBtn = document.getElementById('themeLightBtn');
const themeDarkBtn = document.getElementById('themeDarkBtn');

// Main Elements
const promptsContainer = document.getElementById('promptsContainer');
const addPromptBtn = document.getElementById('addPromptBtn');
const promptCount = document.getElementById('promptCount');
const modelSelect = document.getElementById('modelSelect');
const modeSelect = document.getElementById('modeSelect');
const aspectRatioSelect = document.getElementById('aspectRatioSelect');
const aspectRatioDropdownBtn = document.getElementById('aspectRatioDropdownBtn');
const aspectRatioDropdownMenu = document.getElementById('aspectRatioDropdownMenu');
const customAspectRatioInput = document.getElementById('customAspectRatioInput');
const customAspectRatioWidth = document.getElementById('customAspectRatioWidth');
const customAspectRatioHeight = document.getElementById('customAspectRatioHeight');
const customAspectRatioUnitSelect = document.getElementById('customAspectRatioUnitSelect');
const customAspectRatioLockBtn = document.getElementById('customAspectRatioLockBtn');
const customAspectRatioLockIcon = document.getElementById('customAspectRatioLockIcon');
const customAspectRatioError = document.getElementById('customAspectRatioError');

// Custom aspect ratio lock state
let customAspectRatioLocked = false;
let lockedAspectRatio = null;
const masterPromptsInput = document.getElementById('masterPromptsInput');
const suffixInput = document.getElementById('suffixInput');
const negativePromptsInput = document.getElementById('negativePromptsInput');
const presetSelect = document.getElementById('presetSelect');
const presetDropdownBtn = document.getElementById('presetDropdownBtn');
const presetDropdownMenu = document.getElementById('presetDropdownMenu');
const savePresetBtn = document.getElementById('savePresetBtn');
const deletePresetBtn = document.getElementById('deletePresetBtn');
const presetNameModal = document.getElementById('presetNameModal');
const presetNameInput = document.getElementById('presetNameInput');
const presetNameError = document.getElementById('presetNameError');
const presetNameSaveBtn = document.getElementById('presetNameSaveBtn');
const deletePresetModal = document.getElementById('deletePresetModal');
const deletePresetName = document.getElementById('deletePresetName');
const deletePresetConfirmBtn = document.getElementById('deletePresetConfirmBtn');
const generateBtn = document.getElementById('generateBtn');
const variationsPerPromptSelect = document.getElementById('variationsPerPrompt');
const variationsDropdownBtn = document.getElementById('variationsDropdownBtn');
const variationsDropdownLabel = document.getElementById('variationsDropdownLabel');
const variationsDropdownMenu = document.getElementById('variationsDropdownMenu');
const clearBtn = document.getElementById('clearBtn');

const progressSection = document.getElementById('progressSection');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const progressPercentage = document.getElementById('progressPercentage');
const progressSummary = document.getElementById('progressSummary');
const completedCount = document.getElementById('completedCount');
const failedCount = document.getElementById('failedCount');
const pendingCount = document.getElementById('pendingCount');
const promptList = document.getElementById('promptList');
const cancelJobBtn = document.getElementById('cancelJobBtn');

const resultsSection = document.getElementById('resultsSection');
const gallery = document.getElementById('gallery');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const deleteJobBtn = document.getElementById('deleteJobBtn');

const toast = document.getElementById('toast');
const loadingOverlay = document.getElementById('loadingOverlay');

// History Section Elements
const historySection = document.getElementById('historySection');
const historyList = document.getElementById('historyList');
const historyEmpty = document.getElementById('historyEmpty');
const historyToggleContainer = document.getElementById('historyToggleContainer');
const historyToggleBtn = document.getElementById('historyToggleBtn');
const refreshHistoryBtn = document.getElementById('refreshHistoryBtn');
const deleteAllHistoryBtn = document.getElementById('deleteAllHistoryBtn');

// Mode & Reference Elements
const modeTextOnlyBtn = document.getElementById('modeTextOnlyBtn');
const modeReferenceBtn = document.getElementById('modeReferenceBtn');
const modeTextOnly = document.getElementById('modeTextOnly');
const modeReference = document.getElementById('modeReference');
const referenceUploadZone = document.getElementById('referenceUploadZone');
const referenceFileInput = document.getElementById('referenceFileInput');
const referenceUploadPlaceholder = document.getElementById('referenceUploadPlaceholder');
const referencePreviewBlock = document.getElementById('referencePreviewBlock');
const referencePreviewImg = document.getElementById('referencePreviewImg');
const referenceRemoveBtn = document.getElementById('referenceRemoveBtn');
const referenceTypeSelect = document.getElementById('referenceTypeSelect');
const referenceTypeDropdownBtn = document.getElementById('referenceTypeDropdownBtn');
const referenceTypeDropdownMenu = document.getElementById('referenceTypeDropdownMenu');
const analyzeRefTypeBtn = document.getElementById('analyzeRefTypeBtn');
const promptsContainerRef = document.getElementById('promptsContainerRef');
const addPromptBtnRef = document.getElementById('addPromptBtnRef');
const promptCountRef = document.getElementById('promptCountRef');
const characterConsistencyCheck = document.getElementById('characterConsistencyCheck');
const characterConsistencyWrap = document.getElementById('characterConsistencyWrap');
const modeDropdownBtn = document.getElementById('modeDropdownBtn');
const modeDropdownMenu = document.getElementById('modeDropdownMenu');

// Reference type presets: { master, negative }
const REFERENCE_TYPE_PRESETS = {
    person: { master: 'same person as reference, consistent face and identity, ', negative: 'duplicate faces, deformed, extra limbs, wrong proportions, different person, different face' },
    animal: { master: 'same creature as reference, consistent anatomy and features, ', negative: 'extra limbs, wrong proportions, distorted features, different animal' },
    object: { master: 'same object as reference, accurate form and details, ', negative: 'distorted, blurry, wrong proportions, different object' }
};

// Store reference image data (base64 data URL)
let referenceImageData = null;

// Cleanup Section Elements
const cleanupSection = document.getElementById('cleanupSection');
const cleanupTotalFiles = document.getElementById('cleanupTotalFiles');
const cleanupStorageSize = document.getElementById('cleanupStorageSize');
const cleanupEnabled = document.getElementById('cleanupEnabled');
const cleanupLastRun = document.getElementById('cleanupLastRun');
const cleanupDays = document.getElementById('cleanupDays');
const refreshCleanupBtn = document.getElementById('refreshCleanupBtn');
const cleanupNowBtn = document.getElementById('cleanupNowBtn');

// History list state
const MAX_HISTORY_ITEMS_COLLAPSED = 5;
let historyJobsAll = [];
let historyExpanded = false;
const historyDayCollapsed = {};

// ===== API Key Functions =====

/**
 * ดึง API key จาก localStorage
 */
function getApiKey() {
    return localStorage.getItem(API_KEY_STORAGE_KEY);
}

/**
 * บันทึก API key ลง localStorage
 */
function saveApiKey(apiKey) {
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
}

/**
 * ลบ API key จาก localStorage
 */
function clearApiKey() {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
}

// ===== Theme (Light/Dark) =====
function applyTheme(theme) {
    const isDark = theme === 'dark';
    document.body.setAttribute('data-theme', isDark ? 'dark' : '');
    if (themeLightBtn) {
        themeLightBtn.classList.toggle('active', !isDark);
    }
    if (themeDarkBtn) {
        themeDarkBtn.classList.toggle('active', isDark);
    }
    localStorage.setItem(THEME_STORAGE_KEY, theme);
}

function initTheme() {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    const theme = (saved === 'dark' || saved === 'light') ? saved : 'light';
    applyTheme(theme);
}

// ===== Mode (Text only / Reference image) =====
function getCurrentMode() {
    return modeTextOnlyBtn?.classList.contains('active') ? 'text' : 'reference';
}

function switchMode(mode) {
    if (!modeTextOnly || !modeReference) return;
    if (mode === 'text') {
        modeTextOnly.style.display = 'block';
        modeReference.style.display = 'none';
        modeTextOnlyBtn?.classList.add('active');
        modeReferenceBtn?.classList.remove('active');
        if (characterConsistencyWrap) characterConsistencyWrap.style.display = 'block';
    } else {
        modeTextOnly.style.display = 'none';
        modeReference.style.display = 'block';
        modeTextOnlyBtn?.classList.remove('active');
        modeReferenceBtn?.classList.add('active');
        if (characterConsistencyWrap) characterConsistencyWrap.style.display = 'none';
    }
    updatePromptCount();
}

// ===== Reference Upload =====
function handleReferenceFile(file) {
    if (!file || !file.type.startsWith('image/')) {
        showToast('Please select JPG, PNG or WebP image', 'warning');
        return;
    }
    if (file.size > 10 * 1024 * 1024) {
        showToast('Image too large (max 10MB)', 'warning');
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        referenceImageData = e.target.result;
        if (referencePreviewImg) referencePreviewImg.src = referenceImageData;
        if (referenceUploadPlaceholder) referenceUploadPlaceholder.style.display = 'none';
        if (referencePreviewBlock) referencePreviewBlock.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// ===== Reference Type Preset =====
function loadReferenceTypePreset(type) {
    const preset = REFERENCE_TYPE_PRESETS[type];
    if (!preset) return;
    masterPromptsInput.value = preset.master;
    negativePromptsInput.value = preset.negative;
}

// ===== Preset Management =====

/**
 * อ่าน presets จาก localStorage
 */
function getPresets() {
    try {
        const raw = localStorage.getItem(PRESETS_STORAGE_KEY);
        if (!raw) return [];
        const data = JSON.parse(raw);
        return Array.isArray(data.presets) ? data.presets : [];
    } catch {
        return [];
    }
}

/**
 * บันทึก presets ลง localStorage
 */
function savePresets(presets) {
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify({ presets }));
}

/**
 * โหลด preset เข้า form
 */
function loadPresetToForm(name) {
    if (!name) return;
    const presets = getPresets();
    const p = presets.find(x => x.name === name);
    if (!p) return;
    masterPromptsInput.value = p.master_prompts || '';
    suffixInput.value = p.suffix || '';
    negativePromptsInput.value = p.negative_prompts || '';
}

/**
 * บันทึกค่าจาก form เป็น preset (overwrite ถ้าชื่อซ้ำ)
 */
function savePresetFromForm(name) {
    if (!name || !name.trim()) return false;
    const trimmed = name.trim();
    const presets = getPresets();
    const existing = presets.findIndex(x => x.name === trimmed);
    const newPreset = {
        name: trimmed,
        master_prompts: masterPromptsInput.value.trim(),
        suffix: suffixInput.value.trim(),
        negative_prompts: negativePromptsInput.value.trim()
    };
    if (existing >= 0) {
        presets[existing] = newPreset;
    } else {
        presets.push(newPreset);
    }
    savePresets(presets);
    return true;
}

/**
 * ลบ preset
 */
function deletePreset(name) {
    if (!name) return;
    const presets = getPresets().filter(x => x.name !== name);
    savePresets(presets);
}

/**
 * อัปเดต dropdown preset (custom dropdown + hidden select)
 */
function refreshPresetDropdown() {
    if (!presetSelect || !presetDropdownMenu) return;
    const current = presetSelect.value;
    const presets = getPresets();

    // อัปเดต hidden select
    presetSelect.innerHTML = '<option value="">-- Select preset --</option>';
    presets.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.name;
        opt.textContent = p.name;
        presetSelect.appendChild(opt);
    });
    presetSelect.value = current || '';

    // อัปเดต custom dropdown menu
    presetDropdownMenu.innerHTML = '<li><a class="dropdown-item" href="#" data-value="">-- Select preset --</a></li>';
    presets.forEach(p => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.className = 'dropdown-item';
        a.href = '#';
        a.dataset.value = p.name;
        a.textContent = p.name;
        li.appendChild(a);
        presetDropdownMenu.appendChild(li);
    });

    // อัปเดตปุ่ม
    const btnVal = presetDropdownBtn?.querySelector('.custom-dropdown-value');
    if (btnVal) {
        const selected = presets.find(p => p.name === presetSelect.value);
        btnVal.textContent = selected ? selected.name : '-- Select preset --';
    }

    if (deletePresetBtn) {
        deletePresetBtn.style.display = presetSelect.value ? 'inline-block' : 'none';
    }
}

// Bootstrap Modal instance
let apiKeyModalInstance = null;

/**
 * แสดง API Key Modal (Bootstrap)
 * ปิดได้เสมอ (กดนอก / Escape / ปุ่ม Close) — เตือนเมื่อยังไม่มี key ตอนใช้ฟีเจอร์
 */
function showApiKeyModal() {
    if (!apiKeyModalInstance) {
        apiKeyModalInstance = new bootstrap.Modal(document.getElementById('apiKeyModal'));
    }
    apiKeyInput.value = '';
    apiKeyStatus.style.display = 'none';
    apiKeyModalInstance.show();
    setTimeout(() => apiKeyInput.focus(), 300);
}

/**
 * ซ่อน API Key Modal (Bootstrap)
 */
function hideApiKeyModal() {
    if (apiKeyModalInstance) {
        apiKeyModalInstance.hide();
    }
}

/**
 * แสดง confirm modal แทน confirm() ให้ตรงธีม
 * @param {string} title - หัวข้อ
 * @param {string} message - ข้อความ (รองรับ \n และ HTML)
 * @param {string} okText - ข้อความปุ่ม OK (เช่น "Rerun", "Delete", "OK")
 * @param {string} okClass - class ปุ่ม OK (เช่น "btn-primary", "btn-danger")
 * @param {string} iconClass - class ไอคอน (เช่น "bi-arrow-clockwise", "bi-trash")
 * @returns {Promise<boolean>} - true เมื่อกด OK, false เมื่อ Cancel
 */
function showConfirmModal(title = 'Confirm', message = '', okText = 'OK', okClass = 'btn-primary', iconClass = 'bi-question-circle') {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        const titleEl = document.getElementById('confirmModalTitle');
        const iconEl = modal?.querySelector('.confirm-modal-icon');
        const bodyEl = document.getElementById('confirmModalBody');
        const okBtn = document.getElementById('confirmModalOkBtn');
        const cancelBtn = document.getElementById('confirmModalCancelBtn');

        if (!modal) {
            resolve(false);
            return;
        }

        if (titleEl) titleEl.textContent = title;
        if (iconEl) {
            iconEl.className = `bi ${iconClass} confirm-modal-icon`;
            iconEl.classList.remove('text-primary', 'text-danger');
            iconEl.classList.add(okClass === 'btn-danger' ? 'text-danger' : 'text-primary');
        }
        if (bodyEl) {
            const html = message.replace(/\n/g, '<br>');
            bodyEl.innerHTML = html;
        }
        if (okBtn) {
            okBtn.className = `btn ${okClass} px-4`;
            okBtn.innerHTML = `<i class="bi bi-check-lg me-1"></i> <span>${escapeHtml(okText)}</span>`;
        }

        let resolved = false;
        const doResolve = (val) => {
            if (resolved) return;
            resolved = true;
            okBtn.removeEventListener('click', handleOk);
            cancelBtn.removeEventListener('click', handleCancel);
            modal.removeEventListener('hidden.bs.modal', handleHidden);
            resolve(val);
        };

        const handleOk = () => {
            bsModal.hide();
            doResolve(true);
        };
        const handleCancel = () => {
            bsModal.hide();
            doResolve(false);
        };
        const handleHidden = () => doResolve(false);

        const bsModal = new bootstrap.Modal(modal);
        okBtn.addEventListener('click', handleOk);
        cancelBtn.addEventListener('click', handleCancel);
        modal.addEventListener('hidden.bs.modal', handleHidden);
        bsModal.show();
    });
}

/**
 * ตรวจสอบว่ามี API key หรือไม่ (ใช้ตอนโหลดหน้า)
 * ถ้ายังไม่มี key จะเปิด modal เตือน (ปิดได้)
 * ปุ่ม API Key แสดงตลอด — กรณีปิด modal โดยไม่ใส่ จะกดปุ่มเพื่อเปิดได้อีก
 */
function checkApiKey() {
    const apiKey = getApiKey();
    apiKeySettings.style.display = 'flex';  // แสดงปุ่มตลอด (flex เพื่อให้ gap ทำงาน)
    updateApiKeyButtonLabel();
    if (!apiKey) {
        showApiKeyModal();
        return false;
    }
    return true;
}

/**
 * อัปเดตข้อความปุ่ม API Key ตามว่ามี key หรือไม่
 */
function updateApiKeyButtonLabel() {
    if (!changeApiKeyBtn) return;
    const hasKey = !!getApiKey();
    const text = changeApiKeyBtn.querySelector('.btn-api-key-text');
    if (text) {
        text.textContent = hasKey ? 'Change API Key' : 'Set API Key';
    }
}

/**
 * ทดสอบ API key กับ backend
 */
async function validateApiKey(apiKey) {
    try {
        const response = await fetch('/api/validate-key', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ api_key: apiKey })
        });
        
        const result = await response.json();
        return result;
    } catch (error) {
        return {
            valid: false,
            error: 'Cannot connect to server: ' + error.message
        };
    }
}

/**
 * แสดงสถานะการทดสอบ API key (Bootstrap alert)
 */
function showApiKeyStatus(message, type) {
    apiKeyStatus.textContent = message;
    apiKeyStatus.className = 'alert';
    
    if (type === 'success') apiKeyStatus.classList.add('alert-success');
    else if (type === 'error') apiKeyStatus.classList.add('alert-danger');
    else if (type === 'testing') apiKeyStatus.classList.add('alert-info');
    else apiKeyStatus.classList.add('alert-secondary');
    
    apiKeyStatus.style.display = 'block';
}

/**
 * จัดการการทดสอบและบันทึก API key
 */
async function handleTestAndSaveKey() {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
        showApiKeyStatus('Please enter API key', 'error');
        return;
    }
    
    // แสดงสถานะกำลังทดสอบ
    testAndSaveKeyBtn.disabled = true;
    testAndSaveKeyBtn.textContent = '🔍 Testing...';
    showApiKeyStatus('Testing API key...', 'testing');
    
    // ทดสอบ API key
    const result = await validateApiKey(apiKey);
    
    if (result.valid) {
        // บันทึก API key
        saveApiKey(apiKey);
        showApiKeyStatus('✅ API key ถูกต้อง! บันทึกเรียบร้อย', 'success');
        
        // ซ่อน modal หลัง 1 วินาที
        setTimeout(() => {
            hideApiKeyModal();
            updateApiKeyButtonLabel();
            showToast('API key saved successfully', 'success');
        }, 1000);
    } else {
        showApiKeyStatus('❌ ' + (result.error || 'Invalid API key'), 'error');
    }
    
    // Reset ปุ่ม
    testAndSaveKeyBtn.disabled = false;
    testAndSaveKeyBtn.textContent = '🔍 Test & Save';
}

// ===== Utility Functions =====

/**
 * แสดง toast notification
 */
function showToast(message, type = 'info') {
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = toast.querySelector('.toast-icon');
    
    // อัปเดตข้อความ
    if (toastMessage) {
        toastMessage.textContent = message;
    }
    
    // ลบ type classes เดิมทั้งหมด
    toast.classList.remove('toast-success', 'toast-error', 'toast-warning', 'toast-info');
    
    // เพิ่ม type class ใหม่
    toast.classList.add(`toast-${type}`);
    
    // อัปเดต icon
    if (toastIcon) {
        toastIcon.className = 'toast-icon me-3 bi';
        switch(type) {
            case 'success':
                toastIcon.classList.add('bi-check-circle-fill');
                break;
            case 'error':
                toastIcon.classList.add('bi-x-circle-fill');
                break;
            case 'warning':
                toastIcon.classList.add('bi-exclamation-triangle-fill');
                break;
            default: // info
                toastIcon.classList.add('bi-info-circle-fill');
        }
    }
    
    // แสดง toast ด้วย Bootstrap API
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

/**
 * แสดง/ซ่อน loading overlay
 */
function setLoading(show) {
    loadingOverlay.style.display = show ? 'flex' : 'none';
}

/**
 * สร้าง prompt input item (แบบแรก - แถวแนวนอน: หมายเลข | input | X)
 */
function createPromptInputItem(value = '') {
    promptCounter++;
    const id = `prompt-${promptCounter}`;
    
    const div = document.createElement('div');
    div.className = 'prompt-input-item';
    div.dataset.id = id;
    
    div.innerHTML = `
        <div class="prompt-number">${promptCounter}</div>
        <input 
            type="text" 
            class="prompt-input"
            placeholder="e.g. A cute cat wearing sunglasses, digital art style"
            value="${escapeHtml(value)}"
            data-prompt-id="${id}"
        />
        <button class="btn-remove-prompt" data-remove-id="${id}" title="Remove this prompt">
            ✕
        </button>
    `;
    
    return div;
}

/**
 * เพิ่ม prompt input ใหม่
 */
function addPromptInput(value = '') {
    const item = createPromptInputItem(value);
    promptsContainer.appendChild(item);

    const input = item.querySelector('input');
    const removeBtn = item.querySelector('.btn-remove-prompt');
    input.addEventListener('input', updatePromptCount);
    removeBtn.addEventListener('click', () => removePromptInput(item));
    updatePromptCount();
    if (!value) input.focus();
}

/**
 * สร้าง prompt input item สำหรับ Reference mode (ใช้ promptCounterRef แยกจาก Text mode)
 */
function createPromptInputItemRef(value = '') {
    promptCounterRef++;
    const id = `prompt-ref-${promptCounterRef}`;

    const div = document.createElement('div');
    div.className = 'prompt-input-item';
    div.dataset.id = id;

    div.innerHTML = `
        <div class="prompt-number">${promptCounterRef}</div>
        <input 
            type="text" 
            class="prompt-input"
            placeholder="e.g. A cute cat wearing sunglasses, digital art style"
            value="${escapeHtml(value)}"
            data-prompt-id="${id}"
        />
        <button class="btn-remove-prompt" data-remove-id="${id}" title="Remove this prompt">
            ✕
        </button>
    `;

    return div;
}

/**
 * เพิ่ม prompt input ใหม่ (Reference mode)
 */
function addPromptInputRef(value = '') {
    if (!promptsContainerRef) return;
    const item = createPromptInputItemRef(value);
    promptsContainerRef.appendChild(item);

    const input = item.querySelector('input');
    const removeBtn = item.querySelector('.btn-remove-prompt');
    input.addEventListener('input', updatePromptCount);
    removeBtn.addEventListener('click', () => removePromptInputRef(item));
    updatePromptCount();
    if (!value) input.focus();
}

/**
 * ลบ prompt input
 */
function removePromptInput(item) {
    const items = promptsContainer.querySelectorAll('.prompt-input-item');
    if (items.length <= 1) {
        showToast('At least 1 prompt is required', 'warning');
        return;
    }
    item.style.opacity = '0';
    item.style.transform = 'translateX(-10px)';
    item.style.transition = 'all 0.3s ease';
    setTimeout(() => {
        item.remove();
        renumberPrompts();
        updatePromptCount();
    }, 300);
}

/**
 * ลบ prompt input (Reference mode)
 */
function removePromptInputRef(item) {
    const items = promptsContainerRef?.querySelectorAll('.prompt-input-item') || [];
    if (items.length <= 1) {
        showToast('At least 1 prompt is required', 'warning');
        return;
    }
    item.style.opacity = '0';
    item.style.transform = 'translateX(-10px)';
    item.style.transition = 'all 0.3s ease';
    setTimeout(() => {
        item.remove();
        renumberPromptsRef();
        updatePromptCount();
    }, 300);
}

/**
 * เรียงหมายเลข prompts ใหม่
 */
function renumberPrompts() {
    const items = promptsContainer.querySelectorAll('.prompt-input-item');
    items.forEach((item, index) => {
        const number = item.querySelector('.prompt-number');
        if (number) number.textContent = index + 1;
    });
    promptCounter = items.length;
}

/**
 * เรียงหมายเลข prompts ใหม่ (Reference mode)
 */
function renumberPromptsRef() {
    const items = promptsContainerRef?.querySelectorAll('.prompt-input-item') || [];
    items.forEach((item, index) => {
        const number = item.querySelector('.prompt-number');
        if (number) number.textContent = index + 1;
    });
    promptCounterRef = items.length;
}

// ===== Aspect Ratio Model Validation =====

/**
 * Reset aspect ratio เป็น 1:1
 */
function resetAspectRatioTo1x1() {
    const aspectRatioSelect = document.getElementById('aspectRatioSelect');
    const aspectRatioBtn = document.getElementById('aspectRatioDropdownBtn');
    const aspectRatioBtnValue = aspectRatioBtn?.querySelector('.custom-dropdown-value');
    
    if (aspectRatioSelect) {
        aspectRatioSelect.value = '1:1';
    }
    
    if (aspectRatioBtnValue) {
        aspectRatioBtnValue.innerHTML = '<span class="ratio-preview ratio-1-1"></span><span class="ratio-text">1:1 Square</span>';
    }
    
    // Hide custom input if visible
    if (customAspectRatioInput) customAspectRatioInput.style.display = 'none';
    if (customAspectRatioWidth) customAspectRatioWidth.value = '';
    if (customAspectRatioHeight) customAspectRatioHeight.value = '';
    if (customAspectRatioError) customAspectRatioError.style.display = 'none';
    
    // Reset lock state
    customAspectRatioLocked = false;
    lockedAspectRatio = null;
    if (customAspectRatioLockIcon) customAspectRatioLockIcon.className = 'bi bi-unlock';
    if (customAspectRatioLockBtn) {
        customAspectRatioLockBtn.title = 'Lock aspect ratio';
        customAspectRatioLockBtn.classList.remove('btn-secondary');
        customAspectRatioLockBtn.classList.add('btn-outline-secondary');
    }
}

/**
 * อัปเดตสถานะ enable/disable ของ aspect ratio options ตาม model
 */
function updateAspectRatioAvailability() {
    const modelSelect = document.getElementById('modelSelect');
    if (!modelSelect) return;
    
    const currentModel = modelSelect.value;
    const isPro = currentModel.includes('pro');
    const aspectRatioItems = document.querySelectorAll('#aspectRatioDropdownMenu .dropdown-item[data-requires-pro]');
    const customItem = document.querySelector('#aspectRatioDropdownMenu .dropdown-item[data-value="custom"]');
    
    aspectRatioItems.forEach(item => {
        if (isPro) {
            // Pro model: enable ทุก option
            item.classList.remove('disabled');
            item.style.pointerEvents = 'auto';
        } else {
            // Fast model: disable options ที่ต้องการ Pro
            item.classList.add('disabled');
            item.style.pointerEvents = 'none';
        }
    });
    
    // Custom option: ใช้ได้เฉพาะ Pro model
    if (customItem) {
        if (isPro) {
            customItem.classList.remove('disabled');
            customItem.style.pointerEvents = 'auto';
        } else {
            customItem.classList.add('disabled');
            customItem.style.pointerEvents = 'none';
            
            // ถ้าเลือก Custom อยู่และเปลี่ยนเป็น Fast → reset เป็น 1:1
            if (aspectRatioSelect?.value === 'custom') {
                resetAspectRatioTo1x1();
            }
        }
    }
}

/**
 * คำนวณ GCD (Greatest Common Divisor)
 */
function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b !== 0) {
        const temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}

/**
 * Toggle aspect ratio lock
 */
function toggleAspectRatioLock() {
    if (!customAspectRatioLockBtn || !customAspectRatioLockIcon) return;
    
    const w = customAspectRatioWidth?.value?.trim();
    const h = customAspectRatioHeight?.value?.trim();
    
    if (!w || !h) {
        showToast('Please enter both width and height before locking', 'warning');
        return;
    }
    
    const width = parseFloat(w);
    const height = parseFloat(h);
    
    if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
        showToast('Please enter valid width and height', 'warning');
        return;
    }
    
    customAspectRatioLocked = !customAspectRatioLocked;
    
    if (customAspectRatioLocked) {
        // Lock: คำนวณและเก็บ ratio
        lockedAspectRatio = width / height;
        customAspectRatioLockIcon.className = 'bi bi-lock-fill';
        customAspectRatioLockBtn.title = 'Unlock aspect ratio';
        customAspectRatioLockBtn.classList.remove('btn-outline-secondary');
        customAspectRatioLockBtn.classList.add('btn-secondary');
    } else {
        // Unlock: clear ratio
        lockedAspectRatio = null;
        customAspectRatioLockIcon.className = 'bi bi-unlock';
        customAspectRatioLockBtn.title = 'Lock aspect ratio';
        customAspectRatioLockBtn.classList.remove('btn-secondary');
        customAspectRatioLockBtn.classList.add('btn-outline-secondary');
    }
}

/**
 * Update aspect ratio when locked (auto calculate opposite dimension)
 */
function updateAspectRatioFromLock(changedField) {
    if (!customAspectRatioLocked || lockedAspectRatio === null) return;
    
    const w = customAspectRatioWidth?.value?.trim();
    const h = customAspectRatioHeight?.value?.trim();
    const unit = customAspectRatioUnitSelect?.value || 'px';
    
    if (changedField === 'width' && w) {
        const width = parseFloat(w);
        if (!isNaN(width) && width > 0) {
            let newHeight = Math.round(width / lockedAspectRatio);
            
            // Validate range สำหรับ px
            if (unit === 'px') {
                if (newHeight < 64) {
                    newHeight = 64;
                    // Auto-adjust width to maintain ratio
                    const adjustedWidth = Math.round(newHeight * lockedAspectRatio);
                    if (customAspectRatioWidth) customAspectRatioWidth.value = adjustedWidth;
                } else if (newHeight > 8192) {
                    newHeight = 8192;
                    // Auto-adjust width to maintain ratio
                    const adjustedWidth = Math.round(newHeight * lockedAspectRatio);
                    if (customAspectRatioWidth) customAspectRatioWidth.value = adjustedWidth;
                }
            }
            
            if (customAspectRatioHeight) {
                customAspectRatioHeight.value = newHeight;
                updateCustomAspectRatio();
            }
        }
    } else if (changedField === 'height' && h) {
        const height = parseFloat(h);
        if (!isNaN(height) && height > 0) {
            let newWidth = Math.round(height * lockedAspectRatio);
            
            // Validate range สำหรับ px
            if (unit === 'px') {
                if (newWidth < 64) {
                    newWidth = 64;
                    // Auto-adjust height to maintain ratio
                    const adjustedHeight = Math.round(newWidth / lockedAspectRatio);
                    if (customAspectRatioHeight) customAspectRatioHeight.value = adjustedHeight;
                } else if (newWidth > 8192) {
                    newWidth = 8192;
                    // Auto-adjust height to maintain ratio
                    const adjustedHeight = Math.round(newWidth / lockedAspectRatio);
                    if (customAspectRatioHeight) customAspectRatioHeight.value = adjustedHeight;
                }
            }
            
            if (customAspectRatioWidth) {
                customAspectRatioWidth.value = newWidth;
                updateCustomAspectRatio();
            }
        }
    }
}

/**
 * Parse custom aspect ratio จาก width และ height inputs
 * Returns: { success: boolean, ratio: string, error: string }
 */
function parseCustomAspectRatio() {
    const w = customAspectRatioWidth?.value?.trim();
    const h = customAspectRatioHeight?.value?.trim();
    const unit = customAspectRatioUnitSelect?.value || 'px';
    
    if (!w || !h) {
        return { success: false, ratio: null, error: 'Please enter both width and height' };
    }
    
    const width = parseFloat(w);
    const height = parseFloat(h);
    
    if (isNaN(width) || isNaN(height)) {
        return { success: false, ratio: null, error: 'Width and height must be numbers' };
    }
    
    if (width <= 0 || height <= 0) {
        return { success: false, ratio: null, error: 'Width and height must be positive' };
    }
    
    // สำหรับ px: validate range 64-8192
    // สำหรับ em/rem: ไม่มี range limit แต่ต้องเป็นบวก
    if (unit === 'px') {
        if (width < 64 || width > 8192 || height < 64 || height > 8192) {
            return { success: false, ratio: null, error: 'Dimensions must be between 64 and 8192 pixels' };
        }
    }
    
    // แปลงเป็น ratio โดยใช้ GCD (ใช้ค่าที่เป็นจำนวนเต็ม)
    const widthInt = Math.round(width);
    const heightInt = Math.round(height);
    const gcdValue = gcd(widthInt, heightInt);
    const ratioW = widthInt / gcdValue;
    const ratioH = heightInt / gcdValue;
    
    const ratio = ratioW / ratioH;
    if (ratio < 0.1 || ratio > 10) {
        return { success: false, ratio: null, error: 'Aspect ratio must be between 0.1 and 10' };
    }
    
    return { success: true, ratio: `${ratioW}:${ratioH}`, error: null };
}

/**
 * Parse prompts จาก inputs
 */
function parsePrompts() {
    const container = getCurrentMode() === 'reference' ? promptsContainerRef : promptsContainer;
    if (!container) return [];
    const inputs = container.querySelectorAll('input[data-prompt-id]');
    const prompts = [];
    inputs.forEach(input => {
        const value = input.value.trim();
        if (value) prompts.push(value);
    });
    return prompts;
}

/**
 * อัพเดทจำนวน prompts
 */
function updatePromptCount() {
    const container = getCurrentMode() === 'reference' ? promptsContainerRef : promptsContainer;
    const countEl = getCurrentMode() === 'reference' ? promptCountRef : promptCount;
    const prompts = parsePrompts();
    if (countEl) countEl.textContent = prompts.length;
    updateVariationsDropdownState(prompts.length);
}

/**
 * Enable/disable variations dropdown based on prompt count (only enabled when exactly 1 prompt)
 */
function updateVariationsDropdownState(promptCount) {
    if (!variationsDropdownBtn) return;
    const disabled = promptCount !== 1;
    variationsDropdownBtn.disabled = disabled;
    variationsDropdownBtn.title = disabled
        ? 'Only when 1 prompt'
        : 'Images (when 1 prompt)';

    if (disabled) {
        if (variationsPerPromptSelect) variationsPerPromptSelect.value = '1';
        if (variationsDropdownLabel) variationsDropdownLabel.textContent = '1';
        variationsDropdownMenu?.querySelectorAll('.dropdown-item').forEach(item => {
            item.classList.toggle('active', item.dataset.value === '1');
        });
    }
}

/**
 * สร้าง prompt item element
 */
function createPromptItem(prompt, index, status = 'pending') {
    const statusConfig = {
        pending: { icon: '⏳', text: 'Pending', class: 'secondary' },
        generating: { icon: '🔄', text: 'Generating...', class: 'primary' },
        completed: { icon: '✅', text: 'Completed', class: 'success' },
        failed: { icon: '❌', text: 'Failed', class: 'danger' },
        cancelled: { icon: '⏹', text: 'Cancelled', class: 'warning' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    
    const div = document.createElement('div');
    div.className = `card mb-2 border-${config.class}`;
    div.dataset.index = index;
    
    div.innerHTML = `
        <div class="card-body p-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="badge bg-${config.class} prompt-item-status">${config.icon} ${config.text}</span>
                <span class="badge bg-light text-dark">#${index + 1}</span>
            </div>
            <div class="d-flex gap-2 align-items-start">
                <div class="flex-grow-1 prompt-item-text small text-muted" style="line-height: 1.5;" title="${escapeHtml(prompt)}">
                    ${escapeHtml(prompt)}
                </div>
                <button type="button" class="btn btn-sm btn-link p-0 prompt-item-toggle text-decoration-none" aria-label="Expand">
                    <i class="bi bi-chevron-down"></i> <span class="prompt-toggle-label">Show more</span>
                </button>
            </div>
        </div>
    `;
    
    const textEl = div.querySelector('.prompt-item-text');
    const toggleBtn = div.querySelector('.prompt-item-toggle');
    
    // Initial clamp
    textEl.style.display = '-webkit-box';
    textEl.style.webkitBoxOrient = 'vertical';
    textEl.style.webkitLineClamp = '2';
    textEl.style.overflow = 'hidden';
    
    toggleBtn.addEventListener('click', () => {
        const isExpanded = textEl.style.webkitLineClamp === 'unset';
        if (isExpanded) {
            textEl.style.webkitLineClamp = '2';
            toggleBtn.innerHTML = '<i class="bi bi-chevron-down"></i> <span class="prompt-toggle-label">Show more</span>';
        } else {
            textEl.style.webkitLineClamp = 'unset';
            toggleBtn.innerHTML = '<i class="bi bi-chevron-up"></i> <span class="prompt-toggle-label">Show less</span>';
        }
    });
    
    return div;
}

/**
 * สร้าง gallery item element (Bootstrap)
 */
function createGalleryItem(result, index) {
    const div = document.createElement('div');
    div.className = 'col-md-4 col-sm-6';
    
    const imageUrl = `/static/generated/${result.filename}`;
    const promptHtml = escapeHtml(result.prompt);
    
    div.innerHTML = `
        <div class="card h-100 shadow-sm gallery-item-card">
            <img src="${imageUrl}" alt="Generated Image" class="card-img-top gallery-item-img" loading="lazy" style="object-fit: cover; height: 250px; cursor: pointer;" title="Click to view full size">
            <div class="card-body">
                <div class="mb-2">
                    <div class="gallery-item-prompt small text-muted" style="line-height: 1.4;" title="${promptHtml}">
                        ${promptHtml}
                    </div>
                    <button type="button" class="btn btn-sm btn-link p-0 mt-1 gallery-item-prompt-toggle text-decoration-none" aria-label="Expand">
                        <i class="bi bi-chevron-down"></i> <span>Show more</span>
                    </button>
                </div>
                <a href="${imageUrl}" download="${result.filename}" class="btn btn-primary btn-sm w-100">
                    <i class="bi bi-download"></i> Download
                </a>
            </div>
        </div>
    `;
    
    const textEl = div.querySelector('.gallery-item-prompt');
    const toggleBtn = div.querySelector('.gallery-item-prompt-toggle');
    
    // Initial clamp
    textEl.style.display = '-webkit-box';
    textEl.style.webkitBoxOrient = 'vertical';
    textEl.style.webkitLineClamp = '2';
    textEl.style.overflow = 'hidden';
    
    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isExpanded = textEl.style.webkitLineClamp === 'unset';
        if (isExpanded) {
            textEl.style.webkitLineClamp = '2';
            toggleBtn.innerHTML = '<i class="bi bi-chevron-down"></i> <span>Show more</span>';
        } else {
            textEl.style.webkitLineClamp = 'unset';
            toggleBtn.innerHTML = '<i class="bi bi-chevron-up"></i> <span>Show less</span>';
        }
    });

    // คลิกรูปเพื่อดูตัวอย่างเต็ม
    const imgEl = div.querySelector('.gallery-item-img');
    imgEl.addEventListener('click', () => {
        showImagePreview(imageUrl, result.filename, result.prompt);
    });

    return div;
}

/**
 * แสดง modal ดูตัวอย่างรูปเต็ม
 */
function showImagePreview(imageUrl, filename, prompt) {
    const modal = document.getElementById('imagePreviewModal');
    const imgEl = document.getElementById('imagePreviewImg');
    const promptEl = document.getElementById('imagePreviewPrompt');
    const downloadEl = document.getElementById('imagePreviewDownload');

    if (imgEl) imgEl.src = imageUrl;
    if (imgEl) imgEl.alt = prompt || 'Generated Image';
    if (promptEl) promptEl.textContent = prompt || '';
    if (downloadEl) {
        downloadEl.href = imageUrl;
        downloadEl.download = filename || 'image.png';
    }

    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

/**
 * Escape HTML เพื่อป้องกัน XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== API Functions =====

/**
 * เริ่มต้น generation
 */
async function startGeneration() {
    const apiKey = getApiKey();
    if (!apiKey) {
        showToast('Please enter API key first', 'warning');
        showApiKeyModal();
        return;
    }

    let prompts = parsePrompts();
    if (prompts.length === 0) {
        showToast('Please enter at least 1 prompt', 'warning');
        return;
    }

    // ขยาย prompts ตามจำนวนรูปต่อ prompt ที่เลือก (1 prompt → N รูปหลายแบบ)
    const selectedVariations = Math.max(1, parseInt(variationsPerPromptSelect?.value || '1', 10) || 1);
    const variations = prompts.length === 1 ? selectedVariations : 1;
    if (variations > 1) {
        const confirmed = await showConfirmModal(
            'Confirm variations',
            `Generate ${variations} different images from the same prompt? This will create ${variations} images total.`,
            'Yes',
            'btn-primary',
            'bi-layers'
        );
        if (!confirmed) return;

        const expanded = [];
        prompts.forEach(p => {
            for (let i = 0; i < variations; i++) expanded.push(p);
        });
        prompts = expanded;
    }

    const isReferenceMode = getCurrentMode() === 'reference';
    if (isReferenceMode && !referenceImageData) {
        showToast('Please upload a reference image first', 'warning');
        return;
    }

    const charConsistency = !isReferenceMode && characterConsistencyCheck?.checked;
    let mode = modeSelect.value;
    if (charConsistency) mode = 'sequential';

    // Validate and get aspect ratio (handle custom)
    let aspectRatio = aspectRatioSelect.value;
    if (aspectRatio === 'custom') {
        // ตรวจสอบว่าเป็น Pro model หรือไม่
        const isPro = modelSelect.value.includes('pro');
        if (!isPro) {
            showToast('Custom aspect ratio only works with Pro model', 'warning');
            resetAspectRatioTo1x1();
            return;
        }
        
        const parsed = parseCustomAspectRatio();
        if (!parsed.success) {
            showToast(`Invalid aspect ratio: ${parsed.error}`, 'error');
            if (customAspectRatioError) {
                customAspectRatioError.textContent = parsed.error;
                customAspectRatioError.style.display = 'block';
            }
            if (customAspectRatioWidth) customAspectRatioWidth.focus();
            return;
        }
        aspectRatio = parsed.ratio;
    }

    const data = {
        api_key: apiKey,
        prompts: prompts,
        model: modelSelect.value,
        mode: mode,
        aspect_ratio: aspectRatio,
        master_prompts: masterPromptsInput.value.trim(),
        suffix: suffixInput.value.trim(),
        negative_prompts: negativePromptsInput.value.trim(),
        character_consistency: charConsistency
    };

    if (isReferenceMode) {
        data.reference_image = referenceImageData;
        data.reference_type = referenceTypeSelect?.value || '';
    }

    const apiUrl = isReferenceMode ? '/api/generate-with-reference' : '/api/generate';

    try {
        setLoading(true);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            currentJobId = result.job_id;
            
            // แสดง progress section
            progressSection.style.display = 'block';
            resultsSection.style.display = 'none';
            if (progressSummary) progressSummary.textContent = `0 / ${prompts.length} · 0%`;
            
            // สร้าง prompt list
            promptList.innerHTML = '';
            prompts.forEach((prompt, index) => {
                promptList.appendChild(createPromptItem(prompt, index, 'pending'));
            });
            
            // เริ่ม polling status
            requestNotificationPermission();
            startStatusPolling();

            // Disable generate button และแสดงปุ่มหยุด
            generateBtn.disabled = true;
            if (cancelJobBtn) cancelJobBtn.style.display = 'inline-flex';
            
            showToast(`Generating ${prompts.length} images...`, 'success');
            
            // Scroll to progress section
            progressSection.scrollIntoView({ behavior: 'smooth' });
        } else {
            showToast(`Error: ${result.error}`, 'error');
        }
    } catch (error) {
        showToast(`Connection error: ${error.message}`, 'error');
    } finally {
        setLoading(false);
    }
}

// ===== Browser Notifications =====

function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

function sendBatchNotification(completed, total) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    new Notification('Batch complete!', {
        body: `Generated ${completed}/${total} images`,
        icon: '/static/favicon.ico'
    });
}

/**
 * เริ่มต้น status polling
 */
function startStatusPolling() {
    if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
    }
    
    statusCheckInterval = setInterval(checkStatus, 1000);
}

/**
 * หยุด status polling
 */
function stopStatusPolling() {
    if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
        statusCheckInterval = null;
    }
}

/**
 * ตรวจสอบสถานะของ job
 */
async function checkStatus() {
    if (!currentJobId) return;
    
    try {
        const response = await fetch(`/api/status/${currentJobId}`);
        const result = await response.json();
        
        if (result.success) {
            updateProgress(result.job);
            
            // ถ้าเสร็จ / ยกเลิก / error หยุด polling และแสดงผลลัพธ์ (รูปที่ได้แล้วยังแสดง)
            if (result.job.status === 'completed' || result.job.status === 'error' || result.job.status === 'cancelled') {
                stopStatusPolling();
                displayResults(result.job);
                generateBtn.disabled = false;
                if (cancelJobBtn) {
                    cancelJobBtn.style.display = 'none';
                    cancelJobBtn.disabled = false;
                    cancelJobBtn.innerHTML = '<i class="bi bi-stop-circle me-1"></i> Stop / Cancel';
                }
                
                if (result.job.status === 'completed') {
                    showToast('Image generation complete!', 'success');
                    sendBatchNotification(result.job.completed - result.job.failed, result.job.total);
                } else if (result.job.status === 'cancelled') {
                    showToast('Cancelled. Showing completed images.', 'warning');
                } else {
                    showToast('Error generating images', 'error');
                }
            }
        }
    } catch (error) {
        console.error('Status check error:', error);
    }
}

/**
 * อัพเดท progress UI
 */
function updateProgress(job) {
    const { total, completed, failed } = job;
    const pending = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Log detailed errors to console for debugging
    if (job.results && job.results.length > 0) {
        job.results.forEach((result, idx) => {
            if (result.status === 'failed' && result.error) {
                console.error(`❌ Image ${idx + 1} failed:`, result.error);
                console.error(`   Prompt:`, result.prompt);
            }
        });
    }
    
    // Update progress bar
    progressFill.style.width = `${percentage}%`;
    progressText.textContent = `${completed} / ${total}`;
    progressPercentage.textContent = `${percentage}%`;
    if (progressSummary) progressSummary.textContent = `${completed} / ${total} · ${percentage}%`;
    
    // Update status badges
    completedCount.textContent = completed - failed;
    failedCount.textContent = failed;
    pendingCount.textContent = pending;
    
    // Update prompt items
    if (job.results && job.results.length > 0) {
        job.results.forEach((result, index) => {
            const promptItem = promptList.querySelector(`[data-index="${index}"]`);
            if (promptItem) {
                const statusConfig = {
                    pending: { icon: '⏳', text: 'Pending', class: 'secondary' },
                    generating: { icon: '🔄', text: 'Generating...', class: 'primary' },
                    completed: { icon: '✅', text: 'Completed', class: 'success' },
                    failed: { icon: '❌', text: 'Failed', class: 'danger' },
                    cancelled: { icon: '⏹', text: 'Cancelled', class: 'warning' }
                };
                
                let status = 'pending';
                if (result.status === 'completed') status = 'completed';
                else if (result.status === 'failed') status = 'failed';
                else if (result.status === 'cancelled') status = 'cancelled';
                
                const config = statusConfig[status] || statusConfig.pending;
                
                // Update card border color
                promptItem.className = `card mb-2 border-${config.class}`;
                promptItem.dataset.index = index;
                
                // Update status badge
                const statusEl = promptItem.querySelector('.prompt-item-status');
                if (statusEl) {
                    statusEl.className = `badge bg-${config.class} prompt-item-status`;
                    statusEl.textContent = `${config.icon} ${config.text}`;
                }
            }
        });
        
        // Mark currently generating (if processing)
        if (job.status === 'processing' && completed < total) {
            const nextItem = promptList.querySelector(`[data-index="${completed}"]`);
            if (nextItem && !nextItem.classList.contains('completed') && !nextItem.classList.contains('failed')) {
                nextItem.classList.remove('pending');
                nextItem.classList.add('generating');
                
                const statusEl = nextItem.querySelector('.prompt-item-status');
                if (statusEl) {
                    statusEl.textContent = '🔄 Generating...';
                }
            }
        }
    }
}

/**
 * แสดงผลลัพธ์
 */
function displayResults(job) {
    // แสดง results section
    resultsSection.style.display = 'block';
    
    // Clear gallery
    gallery.innerHTML = '';
    
    // เพิ่มรูปที่สร้างสำเร็จ
    const successResults = job.results.filter(r => r.status === 'completed');
    
    if (successResults.length > 0) {
        successResults.forEach((result, index) => {
            gallery.appendChild(createGalleryItem(result, index));
        });
        
        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    } else {
        const msg = job.status === 'cancelled'
            ? 'Cancelled. No images generated.'
            : 'No images generated.';
        gallery.innerHTML = `<p style="text-align: center; color: var(--text-secondary); padding: 40px;">${msg}</p>`;
    }
}

/**
 * Download all images as ZIP
 */
async function downloadAll() {
    if (!currentJobId) return;
    
    try {
        window.location.href = `/api/download-all/${currentJobId}`;
        showToast('Downloading ZIP...', 'success');
    } catch (error) {
        showToast(`Download error: ${error.message}`, 'error');
    }
}

/**
 * ลบ job และรูปภาพทั้งหมด
 */
async function deleteJob() {
    if (!currentJobId) return;
    
    const confirmed = await showConfirmModal(
        'Delete All Images?',
        'This cannot be undone.',
        'Delete',
        'btn-danger',
        'bi-trash'
    );
    if (!confirmed) return;
    
    try {
        const response = await fetch(`/api/delete/${currentJobId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Clear UI
            resultsSection.style.display = 'none';
            progressSection.style.display = 'none';
            gallery.innerHTML = '';
            currentJobId = null;
            
            showToast('All images deleted', 'success');
        } else {
            showToast(`Error: ${result.error}`, 'error');
        }
    } catch (error) {
        showToast(`Delete error: ${error.message}`, 'error');
    }
}

/**
 * Clear form
 */
async function clearForm() {
    if (statusCheckInterval) {
        const confirmed = await showConfirmModal(
            'Cancel Generation?',
            'Generation is in progress. Cancel and clear?',
            'Yes, Cancel',
            'btn-warning',
            'bi-exclamation-triangle'
        );
        if (!confirmed) return;
        stopStatusPolling();
    }
    
    // Clear all prompt inputs (both modes)
    promptsContainer.innerHTML = '';
    if (promptsContainerRef) promptsContainerRef.innerHTML = '';
    promptCounter = 0;
    promptCounterRef = 0;

    // Add one empty prompt
    addPromptInput();
    if (getCurrentMode() === 'reference') addPromptInputRef();

    masterPromptsInput.value = '';
    suffixInput.value = '';
    negativePromptsInput.value = '';

    if (presetSelect) presetSelect.value = '';
    if (deletePresetBtn) deletePresetBtn.style.display = 'none';

    // Clear reference mode
    referenceImageData = null;
    if (referencePreviewImg) referencePreviewImg.src = '';
    if (referenceUploadPlaceholder) referenceUploadPlaceholder.style.display = 'block';
    if (referencePreviewBlock) referencePreviewBlock.style.display = 'none';
    if (referenceTypeSelect) referenceTypeSelect.value = '';
    const refTypeBtnVal = referenceTypeDropdownBtn?.querySelector('.custom-dropdown-value');
    if (refTypeBtnVal) refTypeBtnVal.textContent = '-- Select type --';

    progressSection.style.display = 'none';
    resultsSection.style.display = 'none';
    if (cancelJobBtn) cancelJobBtn.style.display = 'none';
    
    currentJobId = null;
    generateBtn.disabled = false;
}

/**
 * ยกเลิก job ที่กำลังทำงาน
 */
async function cancelJob() {
    if (!currentJobId || !cancelJobBtn) return;
    
    cancelJobBtn.disabled = true;
    cancelJobBtn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i> Stopping...';
    
    try {
        const response = await fetch(`/api/cancel/${currentJobId}`, { method: 'POST' });
        const result = await response.json();
        if (result.success) {
            showToast('Cancellation requested (wait up to ~5 seconds)', 'info');
        } else {
            showToast(result.error || 'Cancellation failed', 'error');
            cancelJobBtn.disabled = false;
            cancelJobBtn.textContent = '⏹ Stop / Cancel';
        }
    } catch (error) {
        showToast('Connection error: ' + error.message, 'error');
        cancelJobBtn.disabled = false;
        cancelJobBtn.textContent = '⏹ Stop / Cancel';
    }
}

// ===== History Functions =====

/**
 * Fetch job history from API
 */
async function fetchHistory() {
    try {
        const response = await fetch('/api/history');
        const result = await response.json();
        
        if (result.success) {
            historyJobsAll = result.jobs || [];
            // รีเซ็ตสถานะเป็นแบบย่อทุกครั้งที่โหลดใหม่
            historyExpanded = false;
            renderHistory();
        }
    } catch (error) {
        console.error('Failed to fetch history:', error);
    }
}

/**
 * Render history list
 */
function renderHistory() {
    if (!historyList || !historyEmpty) return;
    
    const jobs = historyJobsAll || [];
    if (!historyList || !historyEmpty) return;
    
    historyList.innerHTML = '';
    
    if (jobs.length === 0) {
        historyEmpty.style.display = 'block';
        const summaryEl = document.getElementById('historySummary');
        const totalPromptsEl = document.getElementById('historyTotalPrompts');
        const totalImagesEl = document.getElementById('historyTotalImages');
        if (summaryEl) summaryEl.style.display = 'none';
        if (totalPromptsEl) totalPromptsEl.textContent = '0';
        if (totalImagesEl) totalImagesEl.textContent = '0';
        return;
    }

    historyEmpty.style.display = 'none';

    // จัดกลุ่มตามวัน + นับรวมทั้งหมด
    let totalPromptsAll = 0;
    let totalImagesAll = 0;
    const groupsByDate = {};
    jobs.forEach(job => {
        const promptsCount = job.total || (job.prompts ? job.prompts.length : 0);
        const imagesCount = job.success_count ?? job.completed ?? 0;

        totalPromptsAll += promptsCount;
        totalImagesAll += imagesCount;

        const d = new Date(job.created_at);
        const dateKey = d.toISOString().slice(0, 10); // YYYY-MM-DD
        const dateLabel = d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        if (!groupsByDate[dateKey]) {
            groupsByDate[dateKey] = {
                label: dateLabel,
                jobs: [],
                prompts: 0,
                images: 0
            };
        }
        const group = groupsByDate[dateKey];
        group.jobs.push(job);
        group.prompts += promptsCount;
        group.images += imagesCount;
    });

    const dateKeysSorted = Object.keys(groupsByDate).sort((a, b) => b.localeCompare(a)); // ใหม่ → เก่า

    const summaryEl = document.getElementById('historySummary');
    const totalPromptsEl = document.getElementById('historyTotalPrompts');
    const totalImagesEl = document.getElementById('historyTotalImages');
    if (summaryEl) summaryEl.style.display = 'block';
    if (totalPromptsEl) totalPromptsEl.textContent = totalPromptsAll;
    if (totalImagesEl) totalImagesEl.textContent = totalImagesAll;

    // สรุปรวมแยกตามวัน (ใต้ summary)
    if (summaryEl) {
        let dailyContainer = document.getElementById('historyDailySummary');
        if (!dailyContainer) {
            dailyContainer = document.createElement('div');
            dailyContainer.id = 'historyDailySummary';
            dailyContainer.className = 'small text-muted mt-1';
            summaryEl.appendChild(dailyContainer);
        }
        const dailyEntries = dateKeysSorted.map(key => groupsByDate[key]);
        dailyContainer.innerHTML = dailyEntries
            .map(d => `${d.label}: ${d.prompts} prompts · ${d.images} images`)
            .join('<br>');
    }

    // จัดการปุ่ม Show more / Show less ตามจำนวน jobs ทั้งหมด
    if (historyToggleContainer && historyToggleBtn) {
        if (jobs.length > MAX_HISTORY_ITEMS_COLLAPSED) {
            historyToggleContainer.style.display = 'block';
        } else {
            historyToggleContainer.style.display = 'none';
        }
    }

    // คำนวณ jobs ที่จะแสดงจริงตามโหมดย่อ/ขยาย
    let remainingVisible = historyExpanded ? Infinity : MAX_HISTORY_ITEMS_COLLAPSED;
    let visibleJobsCount = 0;

    dateKeysSorted.forEach(dateKey => {
        const group = groupsByDate[dateKey];

        const groupContainer = document.createElement('div');
        groupContainer.className = 'history-day-group';

        const header = document.createElement('div');
        header.className = 'history-day-header d-flex justify-content-between align-items-center';
        header.dataset.dateKey = dateKey;

        const headerText = document.createElement('div');
        headerText.className = 'history-day-title';
        headerText.textContent = `${group.label} — ${group.prompts} prompts · ${group.images} images`;

        const headerIcon = document.createElement('div');
        headerIcon.className = 'history-day-toggle-icon';
        const icon = document.createElement('i');
        const collapsed = !!historyDayCollapsed[dateKey];
        icon.className = collapsed ? 'bi bi-chevron-right' : 'bi bi-chevron-down';
        headerIcon.appendChild(icon);

        header.appendChild(headerText);
        header.appendChild(headerIcon);

        const body = document.createElement('div');
        body.className = 'history-day-body';

        // เลือก jobs ที่จะแสดงในก้อนนี้ตามโหมดและสถานะพับ/ขยาย
        let jobsForThisGroup = [];
        if (historyExpanded) {
            // โหมดขยาย: แสดงทุก job ในทุกวัน แต่ถ้าวันนั้นถูกพับ ให้ไม่นับเป็น visible
            jobsForThisGroup = group.jobs;
            if (!collapsed) {
                visibleJobsCount += jobsForThisGroup.length;
            }
        } else {
            // โหมดย่อ: แสดงเฉพาะ jobs จากวันที่ไม่ถูกพับ จนครบโควตา MAX_HISTORY_ITEMS_COLLAPSED
            if (!collapsed && remainingVisible > 0) {
                jobsForThisGroup = group.jobs.slice(0, Math.max(0, remainingVisible));
                remainingVisible -= jobsForThisGroup.length;
                visibleJobsCount += jobsForThisGroup.length;
            } else {
                jobsForThisGroup = [];
            }
        }

        jobsForThisGroup.forEach(job => {
            const item = document.createElement('div');
            item.className = 'list-group-item list-group-item-action';
        
        const statusIcon = job.status === 'completed' ? '✅' : 
                          job.status === 'cancelled' ? '⏹️' : '❌';
        const dateStr = new Date(job.created_at).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const refBadge = job.has_reference ? '<span class="badge bg-info ms-1" title="Reference image">Ref</span>' : '';
        const ccBadge = job.character_consistency ? '<span class="badge bg-secondary ms-1" title="Character consistency">CC</span>' : '';
        const totalPrompts = job.total || (job.prompts ? job.prompts.length : 0);
        const imagesCreated = job.success_count ?? job.completed ?? 0;

        item.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                    <div class="fw-bold mb-2">
                        ${statusIcon} ${totalPrompts} prompts · ${imagesCreated} images ${refBadge}${ccBadge}
                    </div>
                    <div class="d-flex flex-wrap gap-3 small text-muted">
                        <span><i class="bi bi-clock"></i> ${dateStr}</span>
                        <span><i class="bi bi-cpu"></i> ${job.model.includes('pro') ? 'Pro' : 'Fast'}</span>
                        <span><i class="bi bi-aspect-ratio"></i> ${job.aspect_ratio || '1:1'}</span>
                        <span><i class="bi bi-gear"></i> ${job.mode === 'sequential' ? 'Sequential' : 'Parallel'}</span>
                    </div>
                </div>
                <div class="btn-group btn-group-sm" role="group">
                    <button class="btn btn-outline-primary btn-history-view" data-job-id="${job.id}" title="View preview and details">
                        <i class="bi bi-eye"></i> View
                    </button>
                    <button class="btn btn-outline-primary btn-history-rerun" data-job-id="${job.id}" title="${job.has_reference ? 'Rerun not supported' : 'View preview then Rerun'}" ${job.has_reference ? 'disabled' : ''}>
                        <i class="bi bi-arrow-clockwise"></i> Rerun
                    </button>
                    <button class="btn btn-outline-danger btn-history-delete" data-job-id="${job.id}" title="Delete from history">
                        <i class="bi bi-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;

        const viewBtn = item.querySelector('.btn-history-view');
        viewBtn.addEventListener('click', () => showHistoryPreview(job.id));

        const rerunBtn = item.querySelector('.btn-history-rerun');
        if (!job.has_reference) {
            rerunBtn.addEventListener('click', () => showHistoryPreview(job.id));
        }

        const deleteBtn = item.querySelector('.btn-history-delete');
        deleteBtn.addEventListener('click', () => deleteHistoryJob(job.id));
        
        body.appendChild(item);
    });

    // ถ้า group นี้ไม่มี job ที่จะแสดง และไม่ได้ถูกพับในโหมดย่อ → ข้ามทั้งก้อน
    // (แต่ถ้าเป็นวันที่ถูกพับ ให้คงหัวข้อวันไว้ แม้จะไม่มี job แสดงใน less mode)
    if (body.children.length === 0 && !collapsed && !historyExpanded) {
        return;
    }

    // จัดการสถานะพับ/ขยาย (ให้ re-render ใหม่ทั้ง list เพื่ออัปเดตโควตา less history)
    body.style.display = collapsed ? 'none' : '';
    header.addEventListener('click', () => {
        const isCollapsed = !!historyDayCollapsed[dateKey];
        historyDayCollapsed[dateKey] = !isCollapsed;
        renderHistory();
    });

    groupContainer.appendChild(header);
    groupContainer.appendChild(body);
    historyList.appendChild(groupContainer);
    });

    // อัปเดตข้อความปุ่ม Show all history ตามจำนวนที่ซ่อน
    if (historyToggleContainer && historyToggleBtn) {
        if (jobs.length > MAX_HISTORY_ITEMS_COLLAPSED) {
            const hiddenCount = Math.max(0, jobs.length - visibleJobsCount);
            historyToggleBtn.textContent = historyExpanded
                ? 'Show less history'
                : `Show all history (${hiddenCount})`;
        } else {
            historyToggleContainer.style.display = 'none';
        }
    }
}

/**
 * Delete all jobs from history
 */
async function deleteAllHistory() {
    const confirmed = await showConfirmModal(
        'Delete All History?',
        'Delete all jobs from history? This cannot be undone.',
        'Delete All',
        'btn-danger',
        'bi-trash'
    );
    if (!confirmed) return;
    
    try {
        const response = await fetch('/api/history/all', {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('All history deleted', 'success');
            fetchHistory();
        } else {
            showToast(`Error: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Error deleting all history:', error);
        showToast('Failed to delete history', 'error');
    }
}

/**
 * Delete a job from history
 */
async function deleteHistoryJob(jobId) {
    const confirmed = await showConfirmModal(
        'Delete Job?',
        'Delete this job from history?',
        'Delete',
        'btn-danger',
        'bi-trash'
    );
    if (!confirmed) return;
    
    try {
        const response = await fetch(`/api/history/${jobId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Job deleted from history', 'success');
            fetchHistory(); // Refresh history list
        } else {
            showToast(`Error: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Error deleting history job:', error);
        showToast('Failed to delete', 'error');
    }
}

/**
 * Show history preview modal (images and details before Rerun)
 */
async function showHistoryPreview(jobId) {
    try {
        const response = await fetch(`/api/history/${jobId}`);
        const result = await response.json();
        if (!result.success || !result.job) {
            showToast('Failed to load job details', 'error');
            return;
        }
        const job = result.job;

        document.getElementById('historyPreviewModel').textContent = job.model?.includes('pro') ? 'Pro' : 'Fast';
        document.getElementById('historyPreviewMode').textContent = job.mode === 'sequential' ? 'Sequential' : 'Parallel';
        document.getElementById('historyPreviewAspect').textContent = job.aspect_ratio || '1:1';

        const promptsEl = document.getElementById('historyPreviewPrompts');
        promptsEl.innerHTML = '';
        (job.prompts || []).forEach((p, i) => {
            const div = document.createElement('div');
            div.className = 'prompt-item';
            div.textContent = `${i + 1}. ${p}`;
            promptsEl.appendChild(div);
        });

        const masterNegEl = document.getElementById('historyPreviewMasterNegative');
        const master = job.master_prompts ? `Master: ${job.master_prompts}` : '';
        const neg = job.negative_prompts ? `Negative: ${job.negative_prompts}` : '';
        masterNegEl.textContent = [master, neg].filter(Boolean).join(' | ') || '(none)';

        const imagesEl = document.getElementById('historyPreviewImages');
        const noImagesEl = document.getElementById('historyPreviewNoImages');
        imagesEl.innerHTML = '';
        const results = job.results || [];
        if (results.length === 0) {
            noImagesEl.style.display = 'block';
        } else {
            noImagesEl.style.display = 'none';
            results.forEach((r, i) => {
                const col = document.createElement('div');
                col.className = 'col-6 col-md-4 col-lg-3';
                const url = `/static/generated/${r.filename}`;
                col.innerHTML = `
                    <div class="history-preview-thumb" title="${escapeHtml(r.prompt || '')}">
                        <img src="${url}" alt="Image ${i + 1}" onerror="this.parentElement.innerHTML='<div class=\\'text-muted small p-2\\'>Image unavailable</div>'">
                    </div>
                `;
                const thumb = col.querySelector('.history-preview-thumb');
                thumb.addEventListener('click', () => showImagePreview(url, r.filename, r.prompt));
                imagesEl.appendChild(col);
            });
        }

        const rerunBtn = document.getElementById('historyPreviewRerunBtn');
        rerunBtn.style.display = job.has_reference ? 'none' : 'inline-block';
        rerunBtn.onclick = null;
        if (!job.has_reference) {
            rerunBtn.onclick = async () => {
                const modal = document.getElementById('historyPreviewModal');
                const bsModal = bootstrap.Modal.getInstance(modal);
                if (bsModal) bsModal.hide();
                await rerunJob(job.id, job);
            };
        }

        const modal = document.getElementById('historyPreviewModal');
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    } catch (error) {
        console.error('Error loading history preview:', error);
        showToast('Failed to load preview: ' + error.message, 'error');
    }
}

/**
 * Rerun a job from history
 */
async function rerunJob(jobId, jobData) {
    const apiKey = getApiKey();
    if (!apiKey) {
        showToast('Please enter API key first', 'warning');
        showApiKeyModal();
        return;
    }

    try {
        setLoading(true);
        
        const response = await fetch(`/api/rerun/${jobId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ api_key: apiKey })
        });
        
        const result = await response.json();
        
        if (result.success) {
            currentJobId = result.job_id;
            
            // แสดง progress section
            progressSection.style.display = 'block';
            resultsSection.style.display = 'none';
            if (progressSummary) progressSummary.textContent = `0 / ${jobData.prompts.length} · 0%`;
            
            // สร้าง prompt list
            promptList.innerHTML = '';
            jobData.prompts.forEach((prompt, index) => {
                promptList.appendChild(createPromptItem(prompt, index, 'pending'));
            });
            
            // เริ่ม polling status
            requestNotificationPermission();
            startStatusPolling();

            // Disable generate button
            generateBtn.disabled = true;
            if (cancelJobBtn) cancelJobBtn.style.display = 'inline-flex';
            
            showToast(`Rerunning ${jobData.total} images...`, 'success');
            
            // Scroll to progress
            progressSection.scrollIntoView({ behavior: 'smooth' });
        } else {
            showToast('Error: ' + (result.error || 'Failed to rerun job'), 'error');
        }
    } catch (error) {
        showToast('Connection error: ' + error.message, 'error');
    } finally {
        setLoading(false);
    }
}

// ===== Cleanup Functions =====

/**
 * Fetch cleanup status from API
 */
async function fetchCleanupStatus() {
    try {
        const response = await fetch('/api/cleanup/status');
        const result = await response.json();
        
        if (result.success) {
            const { cleanup, storage } = result;
            
            // Update UI
            cleanupTotalFiles.textContent = storage.total_files || 0;
            cleanupStorageSize.textContent = `${storage.total_size_mb || 0} MB`;
            cleanupEnabled.textContent = cleanup.enabled ? '✅ Enabled' : '❌ Disabled';
            cleanupLastRun.textContent = cleanup.last_cleanup 
                ? new Date(cleanup.last_cleanup).toLocaleString('th-TH')
                : 'Never';
            cleanupDays.textContent = cleanup.cleanup_days || 7;
        }
    } catch (error) {
        console.error('Failed to fetch cleanup status:', error);
    }
}

/**
 * Perform cleanup now
 */
async function performCleanupNow() {
    const confirmed = await showConfirmModal(
        'Clean Up Now?',
        'Delete all old generated images?',
        'Delete',
        'btn-danger',
        'bi-trash'
    );
    if (!confirmed) return;
    
    cleanupNowBtn.disabled = true;
    cleanupNowBtn.textContent = '🧹 Deleting...';
    
    try {
        const response = await fetch('/api/cleanup/now', { method: 'POST' });
        const result = await response.json();
        
        if (result.success) {
            showToast(`Deleted ${result.deleted} old files`, 'success');
            // Refresh status
            await fetchCleanupStatus();
        } else {
            showToast('❌ ' + (result.error || 'Cleanup failed'), 'error');
        }
    } catch (error) {
        showToast('❌ Connection error: ' + error.message, 'error');
    } finally {
        cleanupNowBtn.disabled = false;
        cleanupNowBtn.textContent = '🧹 Clean Now';
    }
}

// ===== Event Listeners =====

// API Key Modal Events
if (toggleApiKeyVisibility) {
    toggleApiKeyVisibility.addEventListener('click', () => {
        const type = apiKeyInput.type === 'password' ? 'text' : 'password';
        apiKeyInput.type = type;
        toggleApiKeyVisibility.innerHTML = type === 'password' 
            ? '<i class="bi bi-eye"></i>' 
            : '<i class="bi bi-eye-slash"></i>';
    });
}

if (testAndSaveKeyBtn) {
    testAndSaveKeyBtn.addEventListener('click', handleTestAndSaveKey);
}

if (apiKeyInput) {
    // Enter key สำหรับทดสอบ API key
    apiKeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleTestAndSaveKey();
        }
    });
}

if (changeApiKeyBtn) {
    changeApiKeyBtn.addEventListener('click', () => {
        showApiKeyModal();
    });
}

// Theme toggle buttons
if (themeLightBtn) {
    themeLightBtn.addEventListener('click', () => applyTheme('light'));
}
if (themeDarkBtn) {
    themeDarkBtn.addEventListener('click', () => applyTheme('dark'));
}

// Custom dropdown sync (เลือก option แล้วอัพเดท select + ปุ่ม)
document.querySelectorAll('.custom-dropdown-menu .dropdown-item[data-value]').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        
        // ถ้าเป็น disabled item ให้ไม่ทำงาน
        if (item.classList.contains('disabled')) {
            return;
        }
        
        const value = item.dataset.value;
        const display = item.dataset.display || item.textContent.trim();
        const dropdown = item.closest('.custom-dropdown');
        if (dropdown) {
            const select = dropdown.querySelector('select');
            const btnVal = dropdown.querySelector('.custom-dropdown-btn .custom-dropdown-value');
            if (select && btnVal) {
                // Handle custom aspect ratio
                if (select.id === 'aspectRatioSelect' && value === 'custom') {
                    // ตรวจสอบว่าเป็น Pro model หรือไม่
                    const modelSelect = document.getElementById('modelSelect');
                    const isPro = modelSelect?.value?.includes('pro');
                    if (!isPro) {
                        showToast('Custom aspect ratio only works with Pro model', 'warning');
                        return;
                    }
                    
                    select.value = 'custom';
                    btnVal.innerHTML = '<i class="bi bi-pencil-square me-1"></i>Custom';
                    
                    // Query element ใหม่ทุกครั้ง (หาใน parent container ของ dropdown)
                    const dropdownContainer = dropdown.closest('.col-md-4') || dropdown.parentElement;
                    let customInput = dropdownContainer?.querySelector('#customAspectRatioInput') || document.getElementById('customAspectRatioInput');
                    const customWidth = document.getElementById('customAspectRatioWidth');
                    
                    // แสดง custom input ทันที (ไม่ต้องรอ dropdown ปิด)
                    if (customInput) {
                        customInput.removeAttribute('style');
                        customInput.style.display = 'block';
                    }
                    if (customWidth) {
                        setTimeout(() => customWidth.focus(), 100);
                    }
                    return;
                }
                
                // Hide custom input if selecting preset ratio
                if (select.id === 'aspectRatioSelect' && value !== 'custom') {
                    if (customAspectRatioInput) customAspectRatioInput.style.display = 'none';
                    if (customAspectRatioWidth) customAspectRatioWidth.value = '';
                    if (customAspectRatioHeight) customAspectRatioHeight.value = '';
                    if (customAspectRatioError) customAspectRatioError.style.display = 'none';
                    
                    // Reset lock state
                    customAspectRatioLocked = false;
                    lockedAspectRatio = null;
                    if (customAspectRatioLockIcon) customAspectRatioLockIcon.className = 'bi bi-unlock';
                    if (customAspectRatioLockBtn) {
                        customAspectRatioLockBtn.title = 'Lock aspect ratio';
                        customAspectRatioLockBtn.classList.remove('btn-secondary');
                        customAspectRatioLockBtn.classList.add('btn-outline-secondary');
                    }
                }
                
                select.value = value;
                // Aspect Ratio: อัพเดททั้ง preview + text
                const ratioPreview = item.querySelector('.ratio-preview');
                if (ratioPreview && item.dataset.display) {
                    const ratioClass = [...ratioPreview.classList].find(c => c.startsWith('ratio-')) || 'ratio-1-1';
                    btnVal.innerHTML = `<span class="ratio-preview ${ratioClass}"></span><span class="ratio-text">${display}</span>`;
                } else {
                    btnVal.textContent = display;
                }
                
                // ถ้าเป็น Model dropdown: ตรวจสอบ aspect ratio
                if (select.id === 'modelSelect') {
                    const isPro = value.includes('pro');
                    const currentAspectRatio = document.getElementById('aspectRatioSelect')?.value;
                    
                    // ถ้าเปลี่ยนเป็น Fast และมี aspect ratio ที่ไม่ใช่ 1:1
                    if (!isPro && currentAspectRatio !== '1:1') {
                        if (currentAspectRatio === 'custom') {
                            showToast('Custom aspect ratio only works with Pro model. Switching to 1:1.', 'warning');
                            resetAspectRatioTo1x1();
                        } else {
                            showToast('Aspect ratio other than 1:1 only works with Pro model. Switching to 1:1.', 'warning');
                            resetAspectRatioTo1x1();
                        }
                    }
                    
                    // อัพเดตสถานะ enable/disable
                    updateAspectRatioAvailability();
                }
            }
        }
    });
});

// Character consistency: บังคับ Sequential เมื่อเปิด
function updateCharacterConsistencyMode() {
    const checked = characterConsistencyCheck?.checked;
    const parallelItem = modeDropdownMenu?.querySelector('[data-value="parallel"]');
    if (checked) {
        if (modeSelect) modeSelect.value = 'sequential';
        const btnVal = modeDropdownBtn?.querySelector('.custom-dropdown-value');
        if (btnVal) btnVal.textContent = 'Sequential (one by one)';
        if (parallelItem) parallelItem.classList.add('disabled');
    } else {
        if (parallelItem) parallelItem.classList.remove('disabled');
    }
}
if (characterConsistencyCheck) {
    characterConsistencyCheck.addEventListener('change', updateCharacterConsistencyMode);
}

// Mode tabs
if (modeTextOnlyBtn) modeTextOnlyBtn.addEventListener('click', () => switchMode('text'));
if (modeReferenceBtn) modeReferenceBtn.addEventListener('click', () => {
    switchMode('reference');
    if (promptsContainerRef?.children.length === 0) addPromptInputRef();
});

// Reference upload zone
if (referenceUploadZone) {
    referenceUploadZone.addEventListener('click', (e) => {
        if (e.target.closest('.reference-remove-btn')) return;
        referenceFileInput?.click();
    });
    referenceUploadZone.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); });
    referenceUploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer?.files?.[0];
        if (file) handleReferenceFile(file);
    });
}
if (referenceFileInput) {
    referenceFileInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file) handleReferenceFile(file);
        e.target.value = '';
    });
}
if (referenceRemoveBtn) {
    referenceRemoveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        referenceImageData = null;
        referencePreviewImg.src = '';
        referenceUploadPlaceholder.style.display = 'block';
        referencePreviewBlock.style.display = 'none';
        if (referenceTypeSelect) referenceTypeSelect.value = '';
        const btnVal = referenceTypeDropdownBtn?.querySelector('.custom-dropdown-value');
        if (btnVal) btnVal.textContent = '-- Select type --';
    });
}

// Reference type dropdown - load preset on change
if (referenceTypeDropdownMenu) {
    referenceTypeDropdownMenu.addEventListener('click', (e) => {
        const item = e.target.closest('.dropdown-item[data-value]');
        if (!item) return;
        e.preventDefault();
        const value = item.dataset.value;
        const display = item.textContent.trim();
        if (referenceTypeSelect) referenceTypeSelect.value = value || '';
        const btnVal = referenceTypeDropdownBtn?.querySelector('.custom-dropdown-value');
        if (btnVal) btnVal.textContent = display;
        if (value) loadReferenceTypePreset(value);
    });
}

// Auto-detect reference type
if (analyzeRefTypeBtn) {
    analyzeRefTypeBtn.addEventListener('click', async () => {
        if (!referenceImageData) {
            showToast('Please upload an image first', 'warning');
            return;
        }
        const apiKey = getApiKey();
        if (!apiKey) {
            showToast('Please enter API key first', 'warning');
            showApiKeyModal();
            return;
        }
        analyzeRefTypeBtn.disabled = true;
        analyzeRefTypeBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Detecting...';
        try {
            const res = await fetch('/api/analyze-reference-type', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ api_key: apiKey, reference_image: referenceImageData })
            });
            const result = await res.json();
            if (result.success && result.type) {
                referenceTypeSelect.value = result.type;
                const btnVal = referenceTypeDropdownBtn?.querySelector('.custom-dropdown-value');
                const labels = { person: 'Person', animal: 'Animal', object: 'Object' };
                if (btnVal) btnVal.textContent = labels[result.type] || result.type;
                loadReferenceTypePreset(result.type);
                showToast(`Detected: ${labels[result.type] || result.type}`, 'success');
            } else {
                showToast(result.error || 'Detection failed', 'error');
            }
        } catch (err) {
            showToast('Connection error: ' + err.message, 'error');
        } finally {
            analyzeRefTypeBtn.disabled = false;
            analyzeRefTypeBtn.innerHTML = '<i class="bi bi-magic"></i> Auto-detect';
        }
    });
}

// Add prompt button
if (addPromptBtn) addPromptBtn.addEventListener('click', () => addPromptInput());
if (addPromptBtnRef) addPromptBtnRef.addEventListener('click', () => addPromptInputRef());

// Generate button
generateBtn.addEventListener('click', startGeneration);

// Preset modals
let presetNameModalInstance = null;
let deletePresetModalInstance = null;
let pendingDeletePresetName = null;

function showPresetNameModal() {
    if (!presetNameModalInstance) {
        presetNameModalInstance = new bootstrap.Modal(presetNameModal);
    }
    if (presetNameInput) presetNameInput.value = '';
    if (presetNameError) presetNameError.style.display = 'none';
    presetNameModalInstance.show();
    setTimeout(() => presetNameInput?.focus(), 300);
}

function showDeletePresetModal(name) {
    if (!deletePresetModalInstance) {
        deletePresetModalInstance = new bootstrap.Modal(deletePresetModal);
    }
    pendingDeletePresetName = name || '';
    if (deletePresetName) deletePresetName.textContent = pendingDeletePresetName;
    deletePresetModalInstance.show();
}

// Preset dropdown - event delegation (options เป็น dynamic)
if (presetDropdownMenu) {
    presetDropdownMenu.addEventListener('click', (e) => {
        const item = e.target.closest('.dropdown-item[data-value]');
        if (!item) return;
        e.preventDefault();
        const value = item.dataset.value;
        const display = item.textContent.trim();
        if (presetSelect) presetSelect.value = value || '';
        const btnVal = presetDropdownBtn?.querySelector('.custom-dropdown-value');
        if (btnVal) btnVal.textContent = display;
        loadPresetToForm(value);
        if (deletePresetBtn) {
            deletePresetBtn.style.display = value ? 'inline-block' : 'none';
        }
    });
}
if (savePresetBtn) {
    savePresetBtn.addEventListener('click', () => showPresetNameModal());
}
if (presetNameSaveBtn && presetNameInput) {
    presetNameSaveBtn.addEventListener('click', () => {
        const name = presetNameInput.value.trim();
        if (!name) {
            if (presetNameError) {
                presetNameError.style.display = 'block';
                presetNameError.textContent = 'Please enter a preset name';
            }
            return;
        }
        if (presetNameError) presetNameError.style.display = 'none';
        if (savePresetFromForm(name)) {
            presetNameModalInstance?.hide();
            refreshPresetDropdown();
            presetSelect.value = name;
            if (deletePresetBtn) deletePresetBtn.style.display = 'inline-block';
            showToast('Preset saved', 'success');
        }
    });
}
if (presetNameInput) {
    presetNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') presetNameSaveBtn?.click();
    });
    presetNameInput.addEventListener('input', () => {
        if (presetNameError) presetNameError.style.display = 'none';
    });
}
if (deletePresetBtn) {
    deletePresetBtn.addEventListener('click', () => {
        const name = presetSelect?.value;
        if (!name) return;
        showDeletePresetModal(name);
    });
}
if (deletePresetConfirmBtn) {
    deletePresetConfirmBtn.addEventListener('click', () => {
        const name = pendingDeletePresetName;
        if (!name) return;
        deletePreset(name);
        pendingDeletePresetName = null;
        deletePresetModalInstance?.hide();
        refreshPresetDropdown();
        masterPromptsInput.value = '';
        suffixInput.value = '';
        negativePromptsInput.value = '';
        if (presetSelect) presetSelect.value = '';
        if (deletePresetBtn) deletePresetBtn.style.display = 'none';
        showToast('Preset deleted', 'info');
    });
}

// Variations dropdown (images per prompt)
if (variationsDropdownMenu) {
    variationsDropdownMenu.addEventListener('click', (e) => {
        const item = e.target.closest('a[data-value]');
        if (!item) return;
        e.preventDefault();
        const val = item.dataset.value;
        if (variationsPerPromptSelect) variationsPerPromptSelect.value = val;
        if (variationsDropdownLabel) variationsDropdownLabel.textContent = val;
        variationsDropdownMenu.querySelectorAll('.dropdown-item').forEach(menuItem => {
            menuItem.classList.toggle('active', menuItem === item);
        });
    });
}

// Clear button
clearBtn.addEventListener('click', clearForm);

// Download all button
downloadAllBtn.addEventListener('click', downloadAll);

// Delete job button
deleteJobBtn.addEventListener('click', deleteJob);

// Cancel job button
if (cancelJobBtn) cancelJobBtn.addEventListener('click', cancelJob);

// History buttons
if (refreshHistoryBtn) refreshHistoryBtn.addEventListener('click', fetchHistory);
if (deleteAllHistoryBtn) deleteAllHistoryBtn.addEventListener('click', deleteAllHistory);
if (historyToggleBtn) {
    historyToggleBtn.addEventListener('click', () => {
        historyExpanded = !historyExpanded;
        renderHistory();
    });
}

// Cleanup buttons
if (refreshCleanupBtn) refreshCleanupBtn.addEventListener('click', fetchCleanupStatus);
if (cleanupNowBtn) cleanupNowBtn.addEventListener('click', performCleanupNow);

// Usage guide copy button
const copyUsageGuideBtn = document.getElementById('copyUsageGuideBtn');
const usageGuideCopyContent = document.getElementById('usageGuideCopyContent');
if (copyUsageGuideBtn && usageGuideCopyContent) {
    copyUsageGuideBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(usageGuideCopyContent.value);
            showToast('Copied! ส่งให้ ChatGPT ได้เลย', 'success');
        } catch (err) {
            showToast('Copy ไม่สำเร็จ', 'error');
        }
    });
}

// ===== Initialization =====

// โหลด theme ก่อน (ป้องกัน flash)
initTheme();

// เช็ค API key ตอนโหลดหน้า
checkApiKey();

// Add initial prompt input
addPromptInput();

// Custom aspect ratio input handlers
function updateCustomAspectRatio() {
    if (customAspectRatioError) customAspectRatioError.style.display = 'none';
    
    // ถ้า lock อยู่ → ไม่ต้อง parse ใหม่ (ใช้ locked ratio)
    if (customAspectRatioLocked && lockedAspectRatio !== null) {
        const parsed = parseCustomAspectRatio();
        if (parsed.success) {
            if (aspectRatioSelect) aspectRatioSelect.value = parsed.ratio;
            if (customAspectRatioError) customAspectRatioError.style.display = 'none';
            
            // Update button display
            if (aspectRatioDropdownBtn) {
                const btnVal = aspectRatioDropdownBtn.querySelector('.custom-dropdown-value');
                if (btnVal) {
                    btnVal.innerHTML = `<i class="bi bi-pencil-square me-1"></i>Custom (${parsed.ratio})`;
                }
            }
        }
        return;
    }
    
    // ถ้า unlock → parse ตามปกติ
    const parsed = parseCustomAspectRatio();
    if (parsed.success) {
        if (aspectRatioSelect) aspectRatioSelect.value = parsed.ratio;
        if (customAspectRatioError) customAspectRatioError.style.display = 'none';
        
        // Update button display
        if (aspectRatioDropdownBtn) {
            const btnVal = aspectRatioDropdownBtn.querySelector('.custom-dropdown-value');
            if (btnVal) {
                btnVal.innerHTML = `<i class="bi bi-pencil-square me-1"></i>Custom (${parsed.ratio})`;
            }
        }
    } else {
        if (aspectRatioSelect) aspectRatioSelect.value = 'custom';
        if (customAspectRatioError) {
            customAspectRatioError.textContent = parsed.error;
            customAspectRatioError.style.display = 'block';
        }
    }
}

if (customAspectRatioWidth) {
    customAspectRatioWidth.addEventListener('input', () => {
        if (customAspectRatioLocked) {
            updateAspectRatioFromLock('width');
        } else {
            updateCustomAspectRatio();
        }
    });
    customAspectRatioWidth.addEventListener('blur', updateCustomAspectRatio);
}

if (customAspectRatioHeight) {
    customAspectRatioHeight.addEventListener('input', () => {
        if (customAspectRatioLocked) {
            updateAspectRatioFromLock('height');
        } else {
            updateCustomAspectRatio();
        }
    });
    customAspectRatioHeight.addEventListener('blur', updateCustomAspectRatio);
}

if (customAspectRatioUnitSelect) {
    customAspectRatioUnitSelect.addEventListener('change', updateCustomAspectRatio);
}

if (customAspectRatioLockBtn) {
    customAspectRatioLockBtn.addEventListener('click', toggleAspectRatioLock);
}

// Bootstrap dropdown event สำหรับ aspect ratio (เพื่อให้แน่ใจว่า custom input แสดง)
if (aspectRatioDropdownBtn) {
    aspectRatioDropdownBtn.addEventListener('hidden.bs.dropdown', () => {
        // เมื่อ dropdown ปิด ให้ตรวจสอบว่าถ้าเลือก custom แล้วให้แสดง input
        if (aspectRatioSelect?.value === 'custom') {
            const customInput = document.getElementById('customAspectRatioInput');
            if (customInput) {
                customInput.removeAttribute('style');
                customInput.style.display = 'block';
                customInput.style.setProperty('display', 'block', 'important');
            }
        }
    });
}

// อัปเดตสถานะ aspect ratio ตาม model ที่เลือก
updateAspectRatioAvailability();

// โหลด preset dropdown
refreshPresetDropdown();

// Fetch history and cleanup status on page load
if (historySection) {
    fetchHistory();
}

if (cleanupSection) {
    fetchCleanupStatus();
}

// Add CSS animation for slideOut
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        to {
            opacity: 0;
            transform: translateX(-20px);
        }
    }
`;
document.head.appendChild(style);

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    stopStatusPolling();
});

console.log('✅ Batch Image Generator initialized');
