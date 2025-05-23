// 用于将templates.js中的URL中文字符进行编码的工具脚本
const fs = require('fs');
const path = require('path');

// 读取templates.js文件
const templatesPath = path.join(__dirname, 'templates.js');
let content = fs.readFileSync(templatesPath, 'utf8');

// 定义一个函数来识别并编码JSON字符串中的URL
function encodeUrlsInJson(jsonStr) {
    // 正则表达式查找qrLink后面的URL
    return jsonStr.replace(/qrLink:\s*"([^"]+)"/g, function(match, url) {
        // 如果URL包含未编码的中文，进行编码
        if (/[\u4e00-\u9fa5]/.test(url)) {
            const encodedUrl = encodeURI(url);
            return `qrLink: "${encodedUrl}"`;
        }
        return match;
    });
}

// 编码URL
const updatedContent = encodeUrlsInJson(content);

// 写回文件
fs.writeFileSync(templatesPath, updatedContent, 'utf8');

console.log('URL编码完成！');
