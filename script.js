const colors = [
    { name: '코카콜라', hex: '#ED1C16', description: '세계에서 가장 인지도 높은 브랜드의 상징색', context: '자본주의의 아이콘' },
    { name: '소비에트 연방', hex: '#CD0000', description: '구 소련의 국기에 사용된 붉은색', context: '공산주의의 상징' },
    { name: '맥도날드', hex: '#DA291C', description: '패스트푸드 문화의 대표 브랜드', context: '미국식 소비문화' },
    { name: '중국 공산당', hex: '#DE2910', description: '중화인민공화국 국기의 붉은색', context: '현대 공산주의' },
    { name: 'YouTube', hex: '#FF0000', description: '디지털 시대의 붉은 재생 버튼', context: '플랫폼 자본주의' },
    { name: '북한', hex: '#ED1C27', description: '조선민주주의인민공화국의 국기색', context: '주체사상' },
    { name: 'Target', hex: '#CC0000', description: '미국 대형 유통업체의 브랜드 컬러', context: '대량 소비사회' },
    { name: 'Netflix', hex: '#E50914', description: '스트리밍 시대의 대표 브랜드', context: '구독 경제' }
];

let selectedColor = null;
const tooltip = document.getElementById('tooltip');

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function colorDistance(color1, color2) {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    
    // Euclidean distance in RGB space
    return 10 * Math.sqrt(
        Math.pow(rgb1.r - rgb2.r, 2) +
        Math.pow(rgb1.g - rgb2.g, 2) +
        Math.pow(rgb1.b - rgb2.b, 2)
    );
}

function updateVisualization(selected) {
    const originPoint = document.getElementById('originPoint');
    const colorNodes = document.getElementById('colorNodes');
    const closestColors = document.getElementById('closestColors');
    
    // Update origin point
    originPoint.style.backgroundColor = selected.hex;
    
    // Clear previous nodes
    colorNodes.innerHTML = '';
    
    // Calculate distances and sort
    const otherColors = colors.filter(c => c.hex !== selected.hex);
    const distances = otherColors.map(color => ({
        ...color,
        distance: colorDistance(selected.hex, color.hex)
    })).sort((a, b) => a.distance - b.distance);
    
    // Create nodes
    distances.forEach((color, index) => {
        const node = document.createElement('div');
        node.className = 'color-node';
        node.style.backgroundColor = color.hex;
        
        // Position based on distance (normalize to fit in visualization)
        const maxDistance = 442; // Max possible distance in RGB space
        const normalizedDistance = (color.distance / maxDistance) * 100;
        const position = 150 + (normalizedDistance * 7); // Start at 150px, scale up
        
        node.style.left = `${position}px`;
        node.style.animationDelay = `${index * 0.1}s`;
        
        // // Add surprise indicator for very close colors
        // if (color.distance < 30) {
        //     const indicator = document.createElement('div');
        //     indicator.className = 'surprise-indicator';
        //     indicator.textContent = '이렇게 가깝다고?!';
        //     node.appendChild(indicator);
        // }
        
        // Hover events
        node.addEventListener('mouseenter', (e) => {
            showTooltip(e, color);
        });
        
        node.addEventListener('mouseleave', () => {
            hideTooltip();
        });
        
        colorNodes.appendChild(node);
    });
    
    // Update results
    closestColors.innerHTML = distances.slice(0, 5).map((color, index) => `
        <div class="color-item">
            <div class="color-preview" style="background-color: ${color.hex};"></div>
            <div class="color-info">
                <div class="color-name">${index + 1}. ${color.name}</div>
                <div class="color-distance">거리: ${color.distance.toFixed(2)} | ${color.context}</div>
            </div>
        </div>
    `).join('');
}

function showTooltip(e, color) {
    const rect = e.target.getBoundingClientRect();
    tooltip.innerHTML = `
        <h3>${color.name}</h3>
        <p>${color.description}</p>
        <p style="margin-top: 5px; font-size: 0.8rem;">거리: ${color.distance.toFixed(2)}</p>
    `;
    
    tooltip.style.left = rect.left + rect.width / 2 + 'px';
    tooltip.style.top = rect.top - 10 + 'px';
    tooltip.style.transform = 'translate(-50%, -100%)';
    tooltip.classList.add('show');
}

function hideTooltip() {
    tooltip.classList.remove('show');
}

// Color selector events
document.querySelectorAll('.color-option').forEach(option => {
    option.addEventListener('click', () => {
        // Remove previous selection
        document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
        
        // Add selection
        option.classList.add('selected');
        
        // Find color data
        const colorData = colors.find(c => c.hex === option.dataset.color);
        selectedColor = colorData;
        
        updateVisualization(colorData);
    });
});

// Initialize with first color
document.querySelector('.color-option').click();