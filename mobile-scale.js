// --- START OF FILE mobile-scale.js (修改后) ---
/**
 * 动态调整电子标识缩放比例的脚本
 * 这个脚本会根据设备屏幕宽度自动计算最佳缩放比例
 */
document.addEventListener('DOMContentLoaded', function() {
    // 获取电子标识元素
    const electronicLabel = document.getElementById('electronic-label');
    const labelContainer = document.querySelector('.label-container');
    const labelWrapper = document.querySelector('.label-wrapper');

    // 只在移动设备上运行（屏幕宽度小于900px）
    function adjustScale() {
        if (electronicLabel && labelContainer && labelWrapper) { // Ensure elements exist before proceeding
            if (window.innerWidth < 900) {
                // 获取 .container 元素的实际内容宽度作为我们缩放的目标容器宽度
                const mainPageContainer = document.querySelector('.container');
                if (!mainPageContainer) return; // Sanity check
                const containerWidth = mainPageContainer.clientWidth;

                // #electronic-label 的原始宽度。
                // 由于 CSS 中 width: 600px; 和 box-sizing: border-box;
                // 600px 就是其总宽度 (包括 padding 和 border)。
                const labelWidth = 600;
                
                // 计算最佳缩放比例
                let scale = containerWidth / labelWidth;
                
                // 设置最小和最大比例限制，确保完全可见且不会过小/过大
                // 这些值可以根据实际效果微调
                scale = Math.min(Math.max(scale, 0.35), 0.9); // Max scale slightly increased for wider mobile views if needed
                
                // 应用缩放，使用 setProperty 以覆盖 CSS 中的 !important
                electronicLabel.style.setProperty('transform', `scale(${scale})`, 'important');
                electronicLabel.style.setProperty('transform-origin', 'center center', 'important'); // 确保从中心缩放

                // 调整标签的上下边距为0，以精确计算其视觉高度
                electronicLabel.style.marginTop = '0px';
                electronicLabel.style.marginBottom = '0px';
                electronicLabel.style.position = 'static'; // 确保标准流布局 (与 no-scroll-fixes.css 一致)
                
                // 获取缩放后 electronic-label 的实际视觉高度
                // getBoundingClientRect() 返回的是视觉尺寸，已经考虑了 transform:scale
                const rect = electronicLabel.getBoundingClientRect();
                const visualHeight = rect.height;

                // 将实际视觉高度应用到 labelContainer，使其恰好包裹缩放后的标签
                labelContainer.style.height = `${visualHeight}px`;
                labelContainer.style.padding = '0'; // 确保无内边距干扰
                labelContainer.style.margin = '0';  // 确保无外边距干扰
                labelContainer.style.display = 'flex';
                labelContainer.style.alignItems = 'center';
                labelContainer.style.justifyContent = 'center';
                labelContainer.style.overflow = 'visible'; // 确保内容可见
                
                labelWrapper.style.height = 'auto'; 
                labelWrapper.style.overflow = 'visible';
                labelWrapper.style.padding = '0';

            } else {
                // 在桌面端恢复原始样式
                electronicLabel.style.removeProperty('transform');
                electronicLabel.style.removeProperty('transform-origin');
                electronicLabel.style.marginTop = '';
                electronicLabel.style.marginBottom = '';
                electronicLabel.style.position = ''; 
                
                labelContainer.style.height = '';
                labelContainer.style.padding = '';
                labelContainer.style.margin = '';
                labelContainer.style.display = ''; 
                labelContainer.style.alignItems = ''; 
                labelContainer.style.justifyContent = ''; 
                labelContainer.style.overflow = 'visible';

                labelWrapper.style.height = '';
                labelWrapper.style.overflow = '';
                labelWrapper.style.padding = '';
            }
        }
    }
    
    // 初始调整
    if (electronicLabel && labelContainer && labelWrapper) {
        adjustScale();
        
        // 当窗口大小改变时重新调整
        window.addEventListener('resize', adjustScale);
    }
});
// --- END OF FILE mobile-scale.js (修改后) ---