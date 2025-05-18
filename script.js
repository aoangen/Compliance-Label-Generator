document.addEventListener('DOMContentLoaded', function () {
    // --- Data for Templates --- (Now in templates.js)
    // const deviceTemplates = { ... };

    // --- DOM Elements ---
    // Input fields
    const deviceCategoryInput = document.getElementById('deviceCategory');
    const deviceNameInput = document.getElementById('deviceName');
    const approvalNumberInput = document.getElementById('approvalNumber');
    const supervisionPhoneInput = document.getElementById('supervisionPhone');
    const qrLinkInput = document.getElementById('qrLink');

    // Control elements
    const qrErrorCorrectionSelect = document.getElementById('qrErrorCorrection');
    const fontFamilySelect = document.getElementById('fontFamily');
    const fontSizeInput = document.getElementById('fontSize');
    const fontWeightSelect = document.getElementById('fontWeight');
    const fontSizeValueSpan = document.getElementById('fontSizeValue');
    const fontWeightValueSpan = document.getElementById('fontWeightValue');
    const lineHeightInput = document.getElementById('lineHeight'); // Added
    const lineHeightValueSpan = document.getElementById('lineHeightValue'); // Added

    // Template selectors
    const manufacturerSelect = document.getElementById('manufacturerSelect');
    const typeSelect = document.getElementById('typeSelect');
    const deviceSelect = document.getElementById('deviceSelect');

    // Preview elements
    const previewLabel = document.getElementById('electronic-label');
    const previewDeviceCategory = document.getElementById('previewDeviceCategory');
    const previewDeviceName = document.getElementById('previewDeviceName');
    const previewApprovalNumber = document.getElementById('previewApprovalNumber');
    const previewSupervisionPhone = document.getElementById('previewSupervisionPhone');
    const qrCodeContainer = document.getElementById('qrCodeContainer');
    const previewValueSpans = document.querySelectorAll('.preview-value');
    const labelInfoDiv = document.querySelector('.label-info'); // Added for line-height

    // Button
    const downloadBtn = document.getElementById('downloadBtn');
    const shareBtn = document.getElementById('shareBtn'); // Changed from analyzeBtn

    // More Info QR Code Placeholders
    const qrCodeRenshifuDiv = document.getElementById('qrCodeRenshifu');
    const qrCodeGongzhonghaoDiv = document.getElementById('qrCodeGongzhonghao');

    let qrCodeInstance = null;

    // --- Core Functions ---
    function updatePreviewText() {
        previewDeviceCategory.textContent = deviceCategoryInput.value;
        previewDeviceName.textContent = deviceNameInput.value;
        previewApprovalNumber.textContent = approvalNumberInput.value;
        previewSupervisionPhone.textContent = supervisionPhoneInput.value;
    }

    function generateQRCode() {
        qrCodeContainer.innerHTML = '';
        const link = qrLinkInput.value.trim();
        // Ensure qrErrorCorrectionSelect.value is a valid key in QRCode.CorrectLevel
        const errorCorrectionKey = qrErrorCorrectionSelect.value;
        const errorCorrectionLevel = QRCode.CorrectLevel[errorCorrectionKey] !== undefined ? QRCode.CorrectLevel[errorCorrectionKey] : QRCode.CorrectLevel.M;

        if (link) {
            try {
                qrCodeInstance = new QRCode(qrCodeContainer, {
                    text: link,
                    width: 140,
                    height: 140,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                    correctLevel: errorCorrectionLevel
                });
            } catch (error) {
                console.error("Error generating QR Code:", error);
                qrCodeContainer.textContent = "生成二维码出错";
            }
        } else {
            qrCodeContainer.textContent = "输入链接以生成二维码";
        }
    }

    function generateMoreInfoQRCodes() {
        if (qrCodeRenshifuDiv) {
            qrCodeRenshifuDiv.innerHTML = ''; // Clear previous QR
            new QRCode(qrCodeRenshifuDiv, {
                text: "https://m-9.cn/32n9eguo3oqr",
                width: 80,
                height: 80,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.M
            });
        }

        if (qrCodeGongzhonghaoDiv) {
            qrCodeGongzhonghaoDiv.innerHTML = ''; // Clear previous QR
            new QRCode(qrCodeGongzhonghaoDiv, {
                text: "http://mp.weixin.qq.com/mp/homepage?__biz=MzIyNDM0NTQxNw==&hid=25&sn=3ebf0f25f49d224e5a3f2c0cc40146d0&scene=18#wechat_redirect",
                width: 80,
                height: 80,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.M
            });
        }
    }

    function updateFontFamily() {
        previewLabel.style.fontFamily = fontFamilySelect.value;
    }

    function updateFontStyles() {
        const size = fontSizeInput.value + 'px';
        const weight = fontWeightSelect.value;
        const lineHeight = lineHeightInput.value; // Added

        // Update display spans
        if (fontSizeValueSpan) {
            fontSizeValueSpan.textContent = size;
        }
        if (fontWeightValueSpan) {
            fontWeightValueSpan.textContent = weight;
        }
        if (lineHeightValueSpan) { // Added
            lineHeightValueSpan.textContent = lineHeight;
        }

        previewValueSpans.forEach(span => {
            span.style.fontSize = size;
            span.style.fontWeight = weight;
        });
        document.querySelectorAll('.label-key').forEach(span => {
             span.style.fontSize = size;
             // fontWeight logic for label-key remains the same
             if (weight === 'lighter') {
                span.style.fontWeight = weight;
            } else if (weight !== 'bold' && String(weight) !== '700' && String(weight) !== '800' && String(weight) !== '900' && Number(weight) < 700) { 
                span.style.fontWeight = weight;
            } else { 
                span.style.fontWeight = 'bold'; 
            }
        });

        if (labelInfoDiv) { // Added for line-height
            labelInfoDiv.style.lineHeight = lineHeight;
        }
    }

    // --- Template Selector Functions ---
    function populateManufacturers() {
        manufacturerSelect.innerHTML = '<option value="">--请选择厂商--</option>';
        for (const manufacturer in deviceTemplates) {
            const option = document.createElement('option');
            option.value = manufacturer;
            option.textContent = manufacturer;
            manufacturerSelect.appendChild(option);
        }
        resetTypeSelect();
        resetDeviceSelect();
    }

    function handleManufacturerChange() {
        const selectedManufacturer = manufacturerSelect.value;
        resetTypeSelect();
        resetDeviceSelect();

        if (selectedManufacturer && deviceTemplates[selectedManufacturer]) {
            typeSelect.disabled = false;
            for (const type in deviceTemplates[selectedManufacturer]) {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = type;
                typeSelect.appendChild(option);
            }
        }
    }

    function handleTypeChange() {
        const selectedManufacturer = manufacturerSelect.value;
        const selectedType = typeSelect.value;
        resetDeviceSelect();

        if (selectedManufacturer && selectedType && deviceTemplates[selectedManufacturer][selectedType]) {
            deviceSelect.disabled = false;
            const devices = deviceTemplates[selectedManufacturer][selectedType];
            devices.forEach((device, index) => {
                const option = document.createElement('option');
                option.value = index; // Store index
                option.textContent = device.name;
                deviceSelect.appendChild(option);
            });
        }
    }

    function handleDeviceChange() {
        const selectedManufacturer = manufacturerSelect.value;
        const selectedType = typeSelect.value;
        const selectedDeviceIndex = deviceSelect.value;

        if (selectedManufacturer && selectedType && selectedDeviceIndex !== "") {
            const deviceData = deviceTemplates[selectedManufacturer][selectedType][selectedDeviceIndex];

            deviceCategoryInput.value = deviceData.category || '';
            deviceNameInput.value = deviceData.name || '';
            approvalNumberInput.value = deviceData.approval || '';
            supervisionPhoneInput.value = deviceData.phone || '';
            qrLinkInput.value = deviceData.qrLink || '';

            // Trigger updates for preview and QR
            updatePreviewText();
            generateQRCode();
            // Font styles are independent, so no need to call updateFontStyles() here unless you want templates to also set fonts
        }
    }

    function resetTypeSelect() {
        typeSelect.innerHTML = '<option value="">--请选择类型--</option>';
        typeSelect.disabled = true;
    }

    function resetDeviceSelect() {
        deviceSelect.innerHTML = '<option value="">--请选择设备--</option>';
        deviceSelect.disabled = true;
    }

    // --- Event Listeners ---
    // Input fields
    deviceCategoryInput.addEventListener('input', updatePreviewText);
    deviceNameInput.addEventListener('input', updatePreviewText);
    approvalNumberInput.addEventListener('input', updatePreviewText);
    supervisionPhoneInput.addEventListener('input', updatePreviewText);
    qrLinkInput.addEventListener('input', generateQRCode);

    // Control elements
    qrErrorCorrectionSelect.addEventListener('change', generateQRCode);
    fontFamilySelect.addEventListener('change', updateFontFamily);
    fontSizeInput.addEventListener('input', updateFontStyles);
    fontWeightSelect.addEventListener('input', updateFontStyles);
    lineHeightInput.addEventListener('input', updateFontStyles); // Added

    // Template selectors
    manufacturerSelect.addEventListener('change', handleManufacturerChange);
    typeSelect.addEventListener('change', handleTypeChange);
    deviceSelect.addEventListener('change', handleDeviceChange);

    // Download button
    downloadBtn.addEventListener('click', function () {
        const originalQrBorder = qrCodeContainer.style.border;
        // qrCodeContainer.style.border = 'none'; // Optional: remove border during capture

        html2canvas(previewLabel, {
            scale: 2.5,
            useCORS: true,
            backgroundColor: '#ffffff' // Ensure background for the label itself
        }).then(canvas => {
            // qrCodeContainer.style.border = originalQrBorder; // Restore border

            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = image;

            let filename = deviceNameInput.value.trim();
            if (!filename) {
                filename = 'electronic-label';
            }
            filename = filename.replace(/[\\/:*?"<>|#%&{}]/g, '').replace(/\s+/g, '_');
            link.download = `${filename}.png`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }).catch(err => {
            console.error("Error generating image:", err);
            // qrCodeContainer.style.border = originalQrBorder; // Restore border on error
            alert("生成图片出错，请检查控制台获取详情。");
        });
    });

    // Share button event listener
    if (shareBtn) {
        shareBtn.addEventListener('click', async function() { // Made async for await
            if (navigator.share) {
                try {
                    // 1. Generate canvas from the label
                    const canvas = await html2canvas(previewLabel, {
                        scale: 2.5,
                        useCORS: true,
                        backgroundColor: '#ffffff'
                    });

                    // 2. Convert canvas to Blob, then to File
                    canvas.toBlob(async function(blob) {
                        if (!blob) {
                            console.error("Canvas to Blob conversion failed");
                            alert("图片转换失败，无法分享。");
                            return;
                        }
                        let filename = deviceNameInput.value.trim() || 'electronic-label';
                        filename = filename.replace(/[\\/:*?"<>|#%&{}]/g, '').replace(/\s+/g, '_') + '.png';
                        const file = new File([blob], filename, { type: 'image/png' });

                        // 3. Prepare share data
                        const shareData = {
                            title: document.title,
                            text: `查看我的${deviceNameInput.value || '电子标识'}`,
                            files: [file]
                        };

                        // 4. Call Web Share API
                        await navigator.share(shareData);
                        console.log('图片分享成功!');
                    }, 'image/png');

                } catch (err) {
                    console.error("分享失败:", err);
                    if (err.name !== 'AbortError') { // AbortError means user cancelled share
                        alert("分享图片时出错，请稍后再试。");
                    }
                }
            } else {
                alert('此浏览器不支持分享功能，或您未在 HTTPS 环境下访问。请尝试下载图片后手动分享。');
            }
        });
    }

    // --- Initial Population ---
    populateManufacturers(); // Populate manufacturers dropdown first
    updatePreviewText();
    generateQRCode();
    updateFontFamily();
    // Ensure initial font styles including the new default line height are applied
    if (lineHeightInput) {
        lineHeightInput.value = "1.6"; // Set default value in JS as well for consistency
    }
    updateFontStyles();
    generateMoreInfoQRCodes(); // Generate QR codes for the "More Information" section

    // --- Auto-select first template on page load ---
    if (Object.keys(deviceTemplates).length > 0) {
        const firstManufacturer = Object.keys(deviceTemplates)[0];
        manufacturerSelect.value = firstManufacturer;
        handleManufacturerChange(); // Populate types and trigger further updates

        if (typeSelect.options.length > 1) { // Check if types were populated (ignore placeholder)
            const typesForFirstManufacturer = deviceTemplates[firstManufacturer];
            if (Object.keys(typesForFirstManufacturer).length > 0) {
                const firstType = Object.keys(typesForFirstManufacturer)[0];
                typeSelect.value = firstType;
                handleTypeChange(); // Populate devices and trigger further updates

                if (deviceSelect.options.length > 1) { // Check if devices were populated
                    deviceSelect.value = "0"; 
                    handleDeviceChange(); // Populate form fields
                }
            }
        }
    }
});