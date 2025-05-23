const fs = require('fs');
const path = require('path');
// Adjust the path if your templates.js is structured differently or not in the same directory
const { deviceTemplates } = require('./templates');

const outputDir = path.join(__dirname, 'templates_data');
const manufacturersFile = path.join(__dirname, 'manufacturers.json');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Sanitize filenames (important for cross-platform compatibility and avoiding issues with special characters)
function sanitizeFilename(name) {
    // Replace problematic characters with a hyphen or remove them
    // This example replaces common problematic characters. You might need to adjust it.
    return name.replace(/[\/\?%*:|"<>\.]/g, '-');
}

const manufacturerNames = Object.keys(deviceTemplates);

// Generate manufacturers.json
fs.writeFileSync(manufacturersFile, JSON.stringify(manufacturerNames, null, 2), 'utf8');
console.log(`Generated ${manufacturersFile}`);

// Helper function to transform a single device object's properties
function transformDevice(oldDevice) {
    let link = oldDevice.qrLink || oldDevice.Link;
    if (link) {
        try {
            const urlObj = new URL(link); // Assumes link is an absolute URL

            // Normalize query parameters in the hash part of the URL
            if (urlObj.hash) {
                const hashQueryStartIndex = urlObj.hash.indexOf('?');
                if (hashQueryStartIndex !== -1) {
                    const hashPath = urlObj.hash.substring(0, hashQueryStartIndex);
                    const hashQueryString = urlObj.hash.substring(hashQueryStartIndex + 1);
                    
                    if (hashQueryString) { // Ensure there's actually a query string
                        const params = new URLSearchParams(hashQueryString);
                        urlObj.hash = hashPath + '?' + params.toString();
                    } else {
                        // Hash had a '?' but no actual query string after it, e.g., #/path?
                        urlObj.hash = hashPath; 
                    }
                }
            }

            // Normalize standard query parameters (not in the hash)
            if (urlObj.search) { // Check if there are search params (e.g., ?key=value)
                 const mainParams = new URLSearchParams(urlObj.search); // urlObj.search includes initial '?'
                 urlObj.search = mainParams.toString(); // Re-encodes them consistently
            }

            link = urlObj.toString();
        } catch (e) {
            console.warn(`Warning: Could not parse or re-encode URL: "${link}". Error: ${e.message}. Keeping original.`);
            // Keep original link if parsing/re-encoding fails to avoid breaking valid but unparseable links
        }
    }

    return {
        Name: oldDevice.name || oldDevice.Name, // Handles if 'name' or 'Name' exists
        DeviceCategory: oldDevice.category || oldDevice.DeviceCategory,
        ApprovalNumber: oldDevice.approval || oldDevice.ApprovalNumber,
        SupervisionPhone: oldDevice.phone || oldDevice.SupervisionPhone,
        Link: link
    };
}

// Generate individual JSON files for each manufacturer
Object.keys(deviceTemplates).forEach(manufacturerName => {
    const rawManufacturerData = deviceTemplates[manufacturerName];
    let processedManufacturerData = [];

    if (Array.isArray(rawManufacturerData)) {
        // Case 1: Manufacturer data is already an array (e.g., [{Type: "...", Devices: [...]}, ...])
        // We still need to transform the devices within it to ensure correct property names.
        processedManufacturerData = rawManufacturerData.map(typeGroup => {
            if (!typeGroup || typeof typeGroup.Type === 'undefined' || !Array.isArray(typeGroup.Devices)) {
                console.warn(`Warning: Manufacturer ${manufacturerName} has an array item with unexpected structure:`, typeGroup);
                return { ...typeGroup }; // Return a copy or handle error appropriately
            }
            return {
                Type: typeGroup.Type,
                Devices: typeGroup.Devices.map(transformDevice)
            };
        });
    } else if (typeof rawManufacturerData === 'object' && rawManufacturerData !== null) {
        // Case 2: Manufacturer data is an object (e.g., {"TypeName1": [device1], "TypeName2": [device2]})
        // This is the structure observed for "广州众联动漫科技有限公司"
        Object.keys(rawManufacturerData).forEach(typeName => {
            const devicesInOldFormat = rawManufacturerData[typeName];
            if (Array.isArray(devicesInOldFormat)) {
                processedManufacturerData.push({
                    Type: typeName,
                    Devices: devicesInOldFormat.map(transformDevice)
                });
            } else {
                console.warn(`Warning: Manufacturer ${manufacturerName}, Type ${typeName} does not have an array of devices:`, devicesInOldFormat);
            }
        });
    } else {
        console.warn(`Warning: Manufacturer ${manufacturerName} has data that is neither an array nor a recognized object structure:`, rawManufacturerData);
    }

    const sanitizedManufacturerName = sanitizeFilename(manufacturerName);
    const filePath = path.join(outputDir, `${sanitizedManufacturerName}.json`);

    fs.writeFileSync(filePath, JSON.stringify(processedManufacturerData, null, 2), 'utf8');
    console.log(`Generated ${filePath} for ${manufacturerName}`);
});

console.log('All template files generated successfully.');
