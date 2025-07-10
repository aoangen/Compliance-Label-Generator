"use strict";

let currentManufacturerData = null; // To store data for the currently selected manufacturer

// Helper function to find specific device data
function findDeviceData(manufacturerData, typeName, deviceName) {
    if (!manufacturerData || !typeName || !deviceName) return null;
    const typeInfo = manufacturerData.find(t => t.Type === typeName);
    if (!typeInfo || !typeInfo.Devices) return null;
    return typeInfo.Devices.find(d => d.Name === deviceName);
}

// Helper function to ensure URL query parameters are properly percent-encoded
function ensureQueryParametersEncoded(urlString) {
    if (!urlString) return ""; // Handle empty or null input
    try {
        // The URL constructor will parse the URL. If it contains raw characters in
        // query parameters (e.g., Chinese characters), they will be correctly
        // percent-encoded when the URL is converted back to a string using toString().
        // This ensures the URL is valid and suitable for the QR code library.
        return new URL(urlString).toString();
    } catch (e) {
        // This might happen if the urlString is not a valid absolute URL or
        // is malformed in a way the URL constructor cannot handle.
        console.warn("Failed to process URL for QR code, using original. URL:", urlString, "Error:", e);
        // Fallback to original string if parsing/reconstruction fails,
        // as this might still allow QR generation if the original error was intermittent
        // or specific to certain unencoded characters not present in this instance.
        return urlString;
    }
}

// Function to generate QR Code
function generateQRCode() {
    const qrLinkInput = document.getElementById('qrLink');
    const qrCodeContainer = document.getElementById('qrCodeContainer');
    const errorCorrectionLevelSelect = document.getElementById('qrErrorCorrection');
    
    qrCodeContainer.innerHTML = ''; // Clear previous QR code
    let linkValue = qrLinkInput.value.trim(); // Changed to let for reassignment
    const errorCorrectionLevel = errorCorrectionLevelSelect.value;

    // Process the link to ensure query parameters are properly encoded
    linkValue = ensureQueryParametersEncoded(linkValue);

    if (linkValue) {
        try {
            if (typeof QRCode === 'undefined') {
                console.error('QRCode library is not loaded.');
                qrCodeContainer.textContent = 'QR Code library error.';
                return;
            }
            new QRCode(qrCodeContainer, {
                text: linkValue, // Use the processed and correctly encoded link
                width: 160, 
                height: 160,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel[errorCorrectionLevel]
            });
        } catch (e) {
            console.error("Error generating QR Code:", e);
            qrCodeContainer.textContent = 'Error generating QR Code.';
        }
    }
}

// Function to apply device data to form and preview, then generate QR code
function applyDeviceData(deviceData) {
    const deviceCategoryInput = document.getElementById('deviceCategory');
    const deviceNameInput = document.getElementById('deviceName');
    const approvalNumberInput = document.getElementById('approvalNumber');
    const supervisionPhoneInput = document.getElementById('supervisionPhone');
    const qrLinkInput = document.getElementById('qrLink');

    const previewDeviceCategory = document.getElementById('previewDeviceCategory');
    const previewDeviceName = document.getElementById('previewDeviceName');
    const previewApprovalNumber = document.getElementById('previewApprovalNumber');
    const previewSupervisionPhone = document.getElementById('previewSupervisionPhone');

    if (deviceData) {
        deviceCategoryInput.value = deviceData.DeviceCategory || '';
        deviceNameInput.value = deviceData.Name || '';
        approvalNumberInput.value = deviceData.ApprovalNumber || '';
        supervisionPhoneInput.value = deviceData.SupervisionPhone || '12318';
        qrLinkInput.value = deviceData.Link || '';
    } else {
        deviceCategoryInput.value = '游艺机';
        deviceNameInput.value = '设备名称';
        approvalNumberInput.value = '粤游审〔201x〕A100号';
        supervisionPhoneInput.value = '12318';
        qrLinkInput.value = 'https://sh.gegia.cn/user/login.do#/index';
    }

    previewDeviceCategory.textContent = deviceCategoryInput.value;
    previewDeviceName.textContent = deviceNameInput.value;
    previewApprovalNumber.textContent = approvalNumberInput.value;
    previewSupervisionPhone.textContent = supervisionPhoneInput.value;
    
    generateQRCode();
}

// Populate Manufacturer Select
async function populateManufacturerSelect(isInitialLoad = false) {
    const manufacturerSelect = document.getElementById('manufacturerSelect');
    manufacturerSelect.innerHTML = '<option value="">--请选择厂商--</option>';
    
    try {
        const response = await fetch('manufacturers.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status} for manufacturers.json`);
        const manufacturers = await response.json();

        if (!Array.isArray(manufacturers)) throw new Error('manufacturers.json is not a valid array.');

        manufacturers.forEach(manufacturerName => {
            const option = new Option(manufacturerName, manufacturerName);
            manufacturerSelect.add(option);
        });

        if (isInitialLoad && manufacturerSelect.options.length > 1) {
            manufacturerSelect.selectedIndex = 1;
            await populateTypeSelect(manufacturerSelect.value, true);
        } else if (isInitialLoad) {
            await populateTypeSelect(null, true);
        }
    } catch (error) {
        console.error('Error fetching/populating manufacturers:', error);
        if (isInitialLoad) await populateTypeSelect(null, true);
    }
}

// Populate Type Select
async function populateTypeSelect(manufacturerName, isInitialLoad = false) {
    const typeSelect = document.getElementById('typeSelect');
    const deviceSelect = document.getElementById('deviceSelect');
    
    typeSelect.innerHTML = '<option value="">--请选择类型--</option>';
    deviceSelect.innerHTML = '<option value="">--请选择设备--</option>';
    typeSelect.disabled = true;
    deviceSelect.disabled = true;
    currentManufacturerData = null;

    if (!manufacturerName) {
        if (isInitialLoad) applyDeviceData(null);
        return;
    }

    try {
        const fileName = `${manufacturerName}.json`;
        const response = await fetch(`templates_data/${encodeURIComponent(fileName)}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status} for ${fileName}`);
        
        currentManufacturerData = await response.json();
        if (!Array.isArray(currentManufacturerData)) throw new Error(`${fileName} is not a valid array.`);

        const types = [...new Set(currentManufacturerData.map(item => item.Type))];
        if (types.length > 0) {
            typeSelect.disabled = false;
            types.forEach(typeName => {
                const option = new Option(typeName, typeName);
                typeSelect.add(option);
            });

            if (isInitialLoad && typeSelect.options.length > 1) {
                typeSelect.selectedIndex = 1;
                await populateDeviceSelect(typeSelect.value, true);
            } else if (isInitialLoad) {
                await populateDeviceSelect(null, true);
            }
        } else {
             if (isInitialLoad) await populateDeviceSelect(null, true);
        }
    } catch (error) {
        console.error(`Error fetching/populating types for ${manufacturerName}:`, error);
        if (isInitialLoad) applyDeviceData(null);
    }
}

// Populate Device Select
async function populateDeviceSelect(typeName, isInitialLoad = false) { 
    const deviceSelect = document.getElementById('deviceSelect');
    deviceSelect.innerHTML = '<option value="">--请选择设备--</option>';
    deviceSelect.disabled = true;

    if (!typeName || !currentManufacturerData) {
        if (isInitialLoad) applyDeviceData(null);
        return;
    }

    const typeInfo = currentManufacturerData.find(item => item.Type === typeName);
    if (typeInfo && typeInfo.Devices && Array.isArray(typeInfo.Devices) && typeInfo.Devices.length > 0) {
        deviceSelect.disabled = false;
        typeInfo.Devices.forEach(device => {
            const option = new Option(device.Name, device.Name);
            deviceSelect.add(option);
        });

        if (isInitialLoad && deviceSelect.options.length > 1) {
            deviceSelect.selectedIndex = 1;
            const deviceData = findDeviceData(currentManufacturerData, typeName, deviceSelect.value);
            applyDeviceData(deviceData);
        } else if (isInitialLoad) {
            applyDeviceData(null);
        }
    } else {
        if (isInitialLoad) applyDeviceData(null);
    }
}

// Helper function to prepare element for html2canvas and capture it
async function captureLabelAsCanvas(labelElement) {
    const originalStyles = {
        transform: labelElement.style.getPropertyValue('transform'),
        transformPriority: labelElement.style.getPropertyPriority('transform'),
        transformOrigin: labelElement.style.getPropertyValue('transform-origin'),
        transformOriginPriority: labelElement.style.getPropertyPriority('transform-origin'),
        width: labelElement.style.getPropertyValue('width'),
        widthPriority: labelElement.style.getPropertyPriority('width'),
        minWidth: labelElement.style.getPropertyValue('min-width'),
        minWidthPriority: labelElement.style.getPropertyPriority('min-width'),
        marginTop: labelElement.style.getPropertyValue('margin-top'),
        marginTopPriority: labelElement.style.getPropertyPriority('margin-top'),
        marginBottom: labelElement.style.getPropertyValue('margin-bottom'),
        marginBottomPriority: labelElement.style.getPropertyPriority('margin-bottom'),
    };

    labelElement.style.setProperty('transform', 'none', 'important');
    labelElement.style.setProperty('transform-origin', 'initial', 'important');
    labelElement.style.setProperty('width', '600px', 'important');
    labelElement.style.setProperty('min-width', '600px', 'important');
    labelElement.style.setProperty('margin-top', '0px', 'important'); 
    labelElement.style.setProperty('margin-bottom', '0px', 'important');

    labelElement.getBoundingClientRect(); // Force reflow
    const naturalHeight = labelElement.offsetHeight;

    try {
        const canvas = await html2canvas(labelElement, { 
            scale: 3, 
            backgroundColor: null,
            width: 600,           
            height: naturalHeight,  
            windowWidth: 600,       
            windowHeight: naturalHeight, 
            x: 0,                   
            y: 0,
        });
        return canvas;
    } catch (err) {
        console.error("html2canvas capture error:", err);
        throw err; // Re-throw to be caught by caller
    } finally {
        // Restore original styles
        labelElement.style.setProperty('transform', originalStyles.transform, originalStyles.transformPriority);
        labelElement.style.setProperty('transform-origin', originalStyles.transformOrigin, originalStyles.transformOriginPriority);
        
        if (originalStyles.width) {
            labelElement.style.setProperty('width', originalStyles.width, originalStyles.widthPriority);
        } else {
            labelElement.style.removeProperty('width');
        }

        if (originalStyles.minWidth) {
            labelElement.style.setProperty('min-width', originalStyles.minWidth, originalStyles.minWidthPriority);
        } else {
            labelElement.style.removeProperty('min-width');
        }

        if (originalStyles.marginTop) {
            labelElement.style.setProperty('margin-top', originalStyles.marginTop, originalStyles.marginTopPriority);
        } else {
            labelElement.style.removeProperty('margin-top');
        }
        if (originalStyles.marginBottom) {
            labelElement.style.setProperty('margin-bottom', originalStyles.marginBottomPriority);
        } else {
            labelElement.style.removeProperty('margin-bottom');
        }
        
        if (typeof window.adjustScale === 'function') {
           try {
               window.adjustScale();
           } catch (e) {
               console.warn("Error trying to call adjustScale after capture:", e);
           }
        }
    }
}

// Function to display image in a modal for manual sharing
function showImageForManualShare(imageDataUrl, deviceName) {
    // Check if modal already exists, if not, create it
    let modal = document.getElementById('manualShareModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'manualShareModal';
        modal.style.position = 'fixed';
        modal.style.left = '0';
        modal.style.top = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0,0,0,0.7)';
        modal.style.display = 'flex';
        modal.style.flexDirection = 'column';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = '10000'; // Ensure it's on top
        modal.style.padding = '20px';
        modal.style.boxSizing = 'border-box';


        const modalContent = document.createElement('div');
        modalContent.style.backgroundColor = '#fff';
        modalContent.style.padding = '20px';
        modalContent.style.borderRadius = '8px';
        modalContent.style.textAlign = 'center';
        modalContent.style.maxWidth = '90%'; // Max width for the content box
        modalContent.style.maxHeight = '90%'; // Max height for the content box
        modalContent.style.overflow = 'auto'; // Add scroll if content is too big


        const instructionText = document.createElement('p');
        instructionText.id = 'manualShareInstruction';
        instructionText.style.marginBottom = '15px';
        instructionText.style.fontSize = '16px';
        instructionText.style.color = '#333';

        const imgElement = document.createElement('img');
        imgElement.id = 'manualShareImage';
        imgElement.style.maxWidth = '100%'; // Make image responsive within modal
        imgElement.style.maxHeight = 'calc(80vh - 100px)'; // Limit image height
        imgElement.style.border = '1px solid #ccc';
        imgElement.style.marginBottom = '15px';


        const closeButton = document.createElement('button');
        closeButton.textContent = '关闭';
        closeButton.style.padding = '10px 20px';
        closeButton.style.backgroundColor = '#007bff';
        closeButton.style.color = 'white';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '4px';
        closeButton.style.cursor = 'pointer';
        closeButton.onclick = () => {
            modal.style.display = 'none';
        };
        
        modalContent.appendChild(instructionText);
        modalContent.appendChild(imgElement);
        modalContent.appendChild(closeButton);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
    }

    // Update modal content
    const img = modal.querySelector('#manualShareImage');
    const instruction = modal.querySelector('#manualShareInstruction');
    
    img.src = imageDataUrl;
    img.alt = deviceName + ' 电子标识';
    instruction.innerHTML = `您的浏览器不支持直接分享文件。<br>请 <b>长按上方图片</b> 保存或分享，<br>或使用浏览器菜单中的分享功能。`;
    
    modal.style.display = 'flex';
}


// DOMContentLoaded - Main entry point
document.addEventListener('DOMContentLoaded', async () => {
    const manufacturerSelect = document.getElementById('manufacturerSelect');
    const typeSelect = document.getElementById('typeSelect');
    const deviceSelect = document.getElementById('deviceSelect');
    const qrLinkInput = document.getElementById('qrLink');
    const qrErrorCorrectionSelect = document.getElementById('qrErrorCorrection');
    
    const fontFamilySelect = document.getElementById('fontFamily');
    const fontSizeRange = document.getElementById('fontSize');
    const fontWeightRange = document.getElementById('fontWeight');
    const lineHeightRange = document.getElementById('lineHeight');
    const electronicLabel = document.getElementById('electronic-label');

    function updateFontStyles() {
        if (!electronicLabel || !fontFamilySelect || !fontSizeRange || !fontWeightRange || !lineHeightRange) return;
        
        electronicLabel.style.fontFamily = fontFamilySelect.value; // 从下拉框获取字体并应用
        
        electronicLabel.style.fontSize = fontSizeRange.value + 'px';
        document.getElementById('fontSizeValue').textContent = fontSizeRange.value + 'px';
        
        electronicLabel.style.fontWeight = fontWeightRange.value;
        document.getElementById('fontWeightValue').textContent = fontWeightRange.value;
        
        electronicLabel.style.lineHeight = lineHeightRange.value;
        document.getElementById('lineHeightValue').textContent = lineHeightRange.value;
    }

    // 函数：根据屏幕宽度设置字体下拉框的默认选项
    function setDefaultFontOption() {
        if (!fontFamilySelect) return;

        const isMobile = window.innerWidth <= 900; // 你的移动端断点

        // 定义宋体和仿宋选项的 value 值 (确保与 HTML 中的 <option> value 完全一致)
        // 注意：这里的字体栈是为了 CSS 兼容性，但在 JS 中我们主要通过部分匹配来找到选项
        const simsunOptionValuePart = "SimSun"; // HTML 中宋体选项 value 应包含 "SimSun"
        const fangsongOptionValuePart = "FangSong"; // HTML 中仿宋选项 value 应包含 "FangSong"

        let targetOptionValuePart = isMobile ? fangsongOptionValuePart : simsunOptionValuePart;
        
        let foundOption = false;
        for (let i = 0; i < fontFamilySelect.options.length; i++) {
            const option = fontFamilySelect.options[i];
            // *** 修改后的代码在此处 ***
            if (option.value.startsWith(targetOptionValuePart)) { 
                fontFamilySelect.selectedIndex = i; // 设置选中
                foundOption = true;
                break;
            }
        }

        if (!foundOption) {
            console.warn(`未能根据屏幕宽度找到匹配的默认字体选项: ${targetOptionValuePart}`);
            // 如果没有找到，则保持 HTML 中定义的默认 selected 选项，或者选择第一个
            // fontFamilySelect.selectedIndex = 0; // 或者不作处理
        }
    }

    // 1. 页面加载时设置默认字体选项
    setDefaultFontOption();

    // 2. 初始应用所有样式（包括字体、大小、粗细、行高）
    updateFontStyles(); 

    // 3. 为各个控件添加事件监听器
    if (fontFamilySelect) fontFamilySelect.addEventListener('change', updateFontStyles);
    if (fontSizeRange) fontSizeRange.addEventListener('input', updateFontStyles);
    if (fontWeightRange) fontWeightRange.addEventListener('input', updateFontStyles);
    if (lineHeightRange) lineHeightRange.addEventListener('input', updateFontStyles);

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            setDefaultFontOption();
            updateFontStyles();
        }, 250); // 防抖
    });
    

    manufacturerSelect.addEventListener('change', async function() {
        typeSelect.innerHTML = '<option value="">--请选择类型--</option>';
        typeSelect.disabled = true;
        deviceSelect.innerHTML = '<option value="">--请选择设备--</option>';
        deviceSelect.disabled = true;
        currentManufacturerData = null;
        
        if (this.value) {
            await populateTypeSelect(this.value, false); 
        } else {
            applyDeviceData(null); 
        }
    });

    typeSelect.addEventListener('change', async function() { 
        deviceSelect.innerHTML = '<option value="">--请选择设备--</option>';
        deviceSelect.disabled = true;

        if (this.value && currentManufacturerData) {
            await populateDeviceSelect(this.value, false); 
        } else {
            applyDeviceData(null); 
        }
    });

    deviceSelect.addEventListener('change', function() {
        const selectedTypeName = typeSelect.value;
        const selectedDeviceName = this.value;

        if (selectedDeviceName && currentManufacturerData && selectedTypeName) {
            const deviceData = findDeviceData(currentManufacturerData, selectedTypeName, selectedDeviceName);
            applyDeviceData(deviceData);
        } else {
            applyDeviceData(null); 
        }
    });

    qrLinkInput.addEventListener('input', generateQRCode);
    qrErrorCorrectionSelect.addEventListener('change', generateQRCode);

    const inputsToTrackForPreview = ['deviceCategory', 'deviceName', 'approvalNumber', 'supervisionPhone'];
    inputsToTrackForPreview.forEach(id => {
        const inputElement = document.getElementById(id);
        if (inputElement) {
            inputElement.addEventListener('input', function() {
                const previewElementId = `preview${id.charAt(0).toUpperCase() + id.slice(1)}`;
                const previewElement = document.getElementById(previewElementId);
                if (previewElement) {
                    previewElement.textContent = this.value;
                }
            });
        }
    });
    
    const downloadBtn = document.getElementById('downloadBtn');
    const shareBtn = document.getElementById('shareBtn');
    const deviceNameInput = document.getElementById('deviceName'); 

    if (downloadBtn && typeof html2canvas !== 'undefined') {
        downloadBtn.addEventListener('click', async () => {
            const labelElement = document.getElementById('electronic-label');
            if (!labelElement) {
                console.error("下载时未找到电子标识元素。");
                return;
            }
            try {
                const canvas = await captureLabelAsCanvas(labelElement);
                const link = document.createElement('a');
                const filename = (deviceNameInput.value.trim() || 'electronic-label') + '.png';
                link.download = filename;
                link.href = canvas.toDataURL('image/png');
                link.click();
            } catch (err) {
                alert('图片生成失败，无法下载: ' + err.message);
            }
        });
    } else if (downloadBtn) {
        console.warn("html2canvas not loaded, download button will not work.");
        if(downloadBtn) downloadBtn.disabled = true;
    }
    
    if (shareBtn && typeof html2canvas !== 'undefined') {
        if (!(navigator.share)) {
             console.log("Web Share API (navigator.share) not supported by this browser. Share button will offer manual share.");
        }

        shareBtn.addEventListener('click', async () => {
            const labelElement = document.getElementById('electronic-label');
            if (!labelElement) {
                console.error("分享时未找到电子标识元素。");
                alert("无法分享图片：元素未找到。");
                return;
            }
            const deviceNameValue = deviceNameInput.value.trim() || 'electronic-label';

            let canvas;
            try {
                canvas = await captureLabelAsCanvas(labelElement);
            } catch (err) {
                alert('图片生成失败，无法分享: ' + err.message);
                return;
            }

            const imageDataUrl = canvas.toDataURL('image/png');

            if (navigator.share) { 
                canvas.toBlob(async (blob) => {
                    if (!blob) {
                        console.error("Canvas to Blob conversion failed.");
                        showImageForManualShare(imageDataUrl, deviceNameValue); 
                        return;
                    }
                    const filesArray = [new File([blob], `${deviceNameValue}.png`, { type: 'image/png' })];
                    const shareData = {
                        files: filesArray,
                        title: '电子标识',
                        text: `查看 ${deviceNameValue} 电子标识图片。`
                    };

                    if (navigator.canShare && navigator.canShare(shareData)) {
                        try {
                            await navigator.share(shareData);
                            console.log('内容已成功分享 (Web Share API)。');
                        } catch (err) {
                            console.error("Web Share API 分享失败:", err);
                            if (err.name !== 'AbortError') { 
                                showImageForManualShare(imageDataUrl, deviceNameValue);
                            }
                        }
                    } else {
                        console.log('navigator.canShare returned false. Fallback to manual share.');
                        showImageForManualShare(imageDataUrl, deviceNameValue);
                    }
                }, 'image/png');
            } else {
                console.log('Web Share API not available. Fallback to manual share.');
                showImageForManualShare(imageDataUrl, deviceNameValue);
            }
        });
    } else if (shareBtn) {
        console.warn("html2canvas not loaded, share button will not work as expected.");
        if(shareBtn) shareBtn.disabled = true;
    }

    await populateManufacturerSelect(true); 
});

document.addEventListener('DOMContentLoaded', () => { 
    const qrCodeRenshifuContainer = document.getElementById('qrCodeRenshifu');
    const qrCodeGongzhonghaoContainer = document.getElementById('qrCodeGongzhonghao');

    if (qrCodeRenshifuContainer && typeof QRCode !== 'undefined') {
        new QRCode(qrCodeRenshifuContainer, {
            text: "https://m-9.cn/32n9eguo3oqr", 
            width: 80,
            height: 80,
            correctLevel: QRCode.CorrectLevel.M
        });
    }
    if (qrCodeGongzhonghaoContainer && typeof QRCode !== 'undefined') {
        new QRCode(qrCodeGongzhonghaoContainer, {
            text: "http://mp.weixin.qq.com/mp/homepage?__biz=MzIyNDM0NTQxNw==&hid=25&sn=3ebf0f25f49d224e5a3f2c0cc40146d0&scene=18#wechat_redirect", 
            width: 80,
            height: 80,
            correctLevel: QRCode.CorrectLevel.L
        });
    }
});

// Helper function to escape HTML to prevent XSS
function escapeHTML(str) {
    if (typeof str !== 'string') return ''; // Ensure str is a string
    return str.replace(/[&<>'\"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// Debounce function
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

document.addEventListener('DOMContentLoaded', () => {
    // Algolia Direct Search Initialization
    const searchClient = algoliasearch('WX2YYRHSCB', '3c5b63181c7325a6b96dcdcf94204295'); 
    const searchIndex = searchClient.initIndex('guangdong_approved_games_with_links'); 

    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const resultsContainer = document.getElementById('searchResultsContainer');

    if (!searchInput || !searchButton || !resultsContainer) {
        console.error('Search UI elements not found. Direct search functionality will not work.');
        return;
    }

    async function performSearch(query) {
        if (!query.trim()) {
            resultsContainer.innerHTML = '';
            resultsContainer.classList.remove('active');
            return;
        }
        resultsContainer.classList.add('active'); 
        resultsContainer.innerHTML = '<div class="search-result-item">搜索中...</div>'; 

        try {
            const { hits } = await searchIndex.search(query, { hitsPerPage: 10 });
            displayResults(hits);
        } catch (error) {
            console.error('Algolia search error:', error);
            resultsContainer.innerHTML = '<div class="no-results">搜索时发生错误。</div>';
        }
    }

    function displayResults(hits) {
        resultsContainer.innerHTML = ''; 
        if (hits.length === 0) {
            resultsContainer.innerHTML = '<div class="no-results">未找到结果。</div>';
        } else {
            hits.forEach(hit => {
                const hitElement = document.createElement('div');
                hitElement.classList.add('search-result-item');

                const name = hit.Name ? escapeHTML(hit.Name) : '未知名称';
                const operator = hit['运营单位'] ? escapeHTML(hit['运营单位']) : '未知运营单位';

                const displayName = (hit._highlightResult && hit._highlightResult.Name) ? hit._highlightResult.Name.value : name;
                const displayOperator = (hit._highlightResult && hit._highlightResult['运营单位']) ? hit._highlightResult['运营单位'].value : operator;

                hitElement.innerHTML = `<strong>${displayName}</strong><br><span class="operator">${displayOperator}</span>`;
                hitElement.addEventListener('click', () => {
                    selectDeviceFromSearch(hit); 
                    searchInput.value = ''; 
                    resultsContainer.innerHTML = ''; 
                    resultsContainer.classList.remove('active');
                });
                resultsContainer.appendChild(hitElement);
            });
        }
        resultsContainer.classList.add('active'); 
    }

    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); 
            const query = searchInput.value;
            if (query.trim()) { // Check if query is not empty
                performSearch(query);
            } else {
                resultsContainer.innerHTML = ''; // Clear results if query is empty
                resultsContainer.classList.remove('active');
            }
        }
    });

    searchButton.addEventListener('click', () => {
        const query = searchInput.value;
        if (query.trim()) { // Check if query is not empty
            performSearch(query);
        } else {
            resultsContainer.innerHTML = ''; // Clear results if query is empty
            resultsContainer.classList.remove('active');
        }
    });

    document.addEventListener('click', (event) => {
        if (!resultsContainer.contains(event.target) && event.target !== searchInput && event.target !== searchButton) {
            resultsContainer.classList.remove('active');
        }
    });
    
    searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim()) {
             performSearch(searchInput.value);
        }
    });
});

// 从搜索结果中选择设备并直接填充输入框和预览
function selectDeviceFromSearch(hit) {
    // 直接填充输入信息表单的字段
    const deviceCategoryInput = document.getElementById('deviceCategory');
    const deviceNameInput = document.getElementById('deviceName');
    const approvalNumberInput = document.getElementById('approvalNumber');
    const supervisionPhoneInput = document.getElementById('supervisionPhone');
    const qrLinkInput = document.getElementById('qrLink');

    if (deviceCategoryInput) deviceCategoryInput.value = hit.DeviceCategory || '';
    if (deviceNameInput) deviceNameInput.value = hit.Name || '';
    if (approvalNumberInput) approvalNumberInput.value = hit.ApprovalNumber || '';
    if (supervisionPhoneInput) supervisionPhoneInput.value = hit.supervisionPhone !== undefined ? String(hit.supervisionPhone) : '';
    if (qrLinkInput) qrLinkInput.value = hit.Link || '';

    // 更新预览区域的文本内容
    const previewDeviceCategory = document.getElementById('previewDeviceCategory');
    const previewDeviceName = document.getElementById('previewDeviceName');
    const previewApprovalNumber = document.getElementById('previewApprovalNumber');
    const previewSupervisionPhone = document.getElementById('previewSupervisionPhone');

    if (previewDeviceCategory) previewDeviceCategory.textContent = deviceCategoryInput.value;
    if (previewDeviceName) previewDeviceName.textContent = deviceNameInput.value;
    if (previewApprovalNumber) previewApprovalNumber.textContent = approvalNumberInput.value;
    if (previewSupervisionPhone) previewSupervisionPhone.textContent = supervisionPhoneInput.value;

    // 生成新的二维码
    if (typeof generateQRCode === 'function') {
        generateQRCode();
    }

    // 清空预设下拉框，因为我们直接使用了 Algolia 的数据
    const manufacturerSelect = document.getElementById('manufacturerSelect');
    const typeSelect = document.getElementById('typeSelect');
    const deviceSelect = document.getElementById('deviceSelect');

    if (manufacturerSelect) manufacturerSelect.value = '';
    if (typeSelect) {
        typeSelect.innerHTML = '<option value="">--请选择类型--</option>';
        typeSelect.disabled = true;
    }
    if (deviceSelect) {
        deviceSelect.innerHTML = '<option value="">--请选择设备--</option>';
        deviceSelect.disabled = true;
    }
    // 重置 currentManufacturerData，因为它与预设相关
    currentManufacturerData = null; 
}

// === 不蒜子访问计数控制台输出功能 ===
function checkBusuanziCounter() {
    const pvElement = document.getElementById('busuanzi_value_site_pv');
    const uvElement = document.getElementById('busuanzi_value_site_uv');
    
    if (pvElement && pvElement.textContent && uvElement && uvElement.textContent) {
        console.log('📊 网站访问统计信息');
        console.log('='.repeat(30));
        console.log('🔍 总访问量（PV）:', pvElement.textContent.trim() + ' 次');
        console.log('👥 访客数（UV）:', uvElement.textContent.trim() + ' 人次');
        console.log('='.repeat(30));
        console.log('💡 提示：数据由不蒜子统计服务提供');
    } else {
        // 如果还没加载完成，100ms后再次检查
        setTimeout(checkBusuanziCounter, 100);
    }
}

// 页面加载完成后开始检查不蒜子计数
window.addEventListener('load', function() {
    // 延迟一下确保不蒜子脚本有时间执行
    setTimeout(checkBusuanziCounter, 1000);
});