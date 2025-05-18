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
                // 获取容器宽度和标签原始宽度
                const containerWidth = window.innerWidth - 60; // 考虑边距，确保完整可见
                const labelWidth = 600 + 40; // 标签宽度 (600px) 加上左右内边距 (20px * 2)
                
                // 计算最佳缩放比例
                let scale = containerWidth / labelWidth;
                
                // 设置最小和最大比例限制，确保完全可见
                scale = Math.min(Math.max(scale, 0.35), 0.8);
                
                // 应用缩放，使用 setProperty 以覆盖 CSS 中的 !important
                electronicLabel.style.setProperty('transform', `scale(${scale})`, 'important');
                electronicLabel.style.setProperty('transform-origin', 'center center', 'important'); // 确保从中心缩放

                // 调整标签的上下边距为0
                electronicLabel.style.marginTop = '0px';
                electronicLabel.style.marginBottom = '0px';
                electronicLabel.style.position = 'static'; // 确保标准流布局 (与 no-scroll-fixes.css 一致)
                
                // 获取缩放后 electronic-label 的实际视觉高度
                const rect = electronicLabel.getBoundingClientRect();
                const visualHeight = rect.height;

                // 将实际视觉高度应用到 labelContainer
                labelContainer.style.height = `${visualHeight}px`;
                labelContainer.style.padding = '0'; // 确保无内边距干扰
                labelContainer.style.margin = '0';  // 确保无外边距干扰
                labelContainer.style.display = 'flex';
                labelContainer.style.alignItems = 'center';
                labelContainer.style.justifyContent = 'center';
                labelContainer.style.overflow = 'visible'; // 确保内容可见
                
                // labelWrapper 的样式主要依赖 CSS (no-scroll-fixes.css 已经有 height: auto !important 等)
                // 我们确保其关键属性以适应 labelContainer
                labelWrapper.style.height = 'auto'; // 允许其包裹调整过高度的 labelContainer
                labelWrapper.style.overflow = 'visible';
                labelWrapper.style.padding = '0'; // 与 no-scroll-fixes.css 一致
                // labelWrapper.style.margin = '0 auto'; // 此样式由 no-scroll-fixes.css 控制

            } else {
                // 在桌面端恢复原始样式
                electronicLabel.style.removeProperty('transform');
                electronicLabel.style.removeProperty('transform-origin');
                electronicLabel.style.marginTop = '';
                electronicLabel.style.marginBottom = '';
                electronicLabel.style.position = ''; // 由CSS控制
                
                labelContainer.style.height = '';
                labelContainer.style.padding = '';
                labelContainer.style.margin = '';
                labelContainer.style.display = ''; // 由CSS控制 (style.fixed.css 中有 flex)
                labelContainer.style.alignItems = ''; // 由CSS控制
                labelContainer.style.justifyContent = ''; // 由CSS控制 (style.fixed.css 中有 center)
                labelContainer.style.overflow = 'visible'; // 恢复或由CSS控制

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
        // electronicLabel.style.transformOrigin = 'center center'; // 已在 adjustScale 中设置
    }
});
