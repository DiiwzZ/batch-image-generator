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
    } else {
        modeTextOnly.style.display = 'none';
        modeReference.style.display = 'block';
        modeTextOnlyBtn?.classList.remove('active');
        modeReferenceBtn?.classList.add('active');
    }
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

    const prompts = parsePrompts();
    if (prompts.length === 0) {
        showToast('Please enter at least 1 prompt', 'warning');
        return;
    }

    const isReferenceMode = getCurrentMode() === 'reference';
    if (isReferenceMode && !referenceImageData) {
        showToast('Please upload a reference image first', 'warning');
        return;
    }

    const data = {
        api_key: apiKey,
        prompts: prompts,
        model: modelSelect.value,
        mode: modeSelect.value,
        aspect_ratio: aspectRatioSelect.value,
        master_prompts: masterPromptsInput.value.trim(),
        suffix: suffixInput.value.trim(),
        negative_prompts: negativePromptsInput.value.trim()
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
                    cancelJobBtn.textContent = '⏹ Stop / Cancel';
                }
                
                if (result.job.status === 'completed') {
                    showToast('Image generation complete!', 'success');
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
    cancelJobBtn.textContent = '⏳ Stopping...';
    
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
            renderHistory(result.jobs || []);
        }
    } catch (error) {
        console.error('Failed to fetch history:', error);
    }
}

/**
 * Render history list
 */
function renderHistory(jobs) {
    if (!historyList || !historyEmpty) return;
    
    historyList.innerHTML = '';
    
    if (jobs.length === 0) {
        historyEmpty.style.display = 'block';
        return;
    }
    
    historyEmpty.style.display = 'none';
    
    jobs.forEach(job => {
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

        item.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                    <div class="fw-bold mb-2">
                        ${statusIcon} ${job.total} Prompts - ${job.success_count} completed ${refBadge}
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
        
        historyList.appendChild(item);
    });
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
                        showToast('Aspect ratio other than 1:1 only works with Pro model. Switching to 1:1.', 'warning');
                        resetAspectRatioTo1x1();
                    }
                    
                    // อัพเดตสถานะ enable/disable
                    updateAspectRatioAvailability();
                }
            }
        }
    });
});

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

// Cleanup buttons
if (refreshCleanupBtn) refreshCleanupBtn.addEventListener('click', fetchCleanupStatus);
if (cleanupNowBtn) cleanupNowBtn.addEventListener('click', performCleanupNow);

// ===== Initialization =====

// โหลด theme ก่อน (ป้องกัน flash)
initTheme();

// เช็ค API key ตอนโหลดหน้า
checkApiKey();

// Add initial prompt input
addPromptInput();

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
