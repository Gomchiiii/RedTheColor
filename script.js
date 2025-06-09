// 전역 변수
let colors = [];
let selectedColor = null;
const tooltip = document.getElementById('tooltip');
let allColors = []; // 전체 색상 데이터 저장
let filteredColors = []; // 필터링된 색상 데이터

// 기본 색상 데이터 (CSV 로딩 실패시 폴백)
function getDefaultColors() {
    return [
        { name: '코카콜라', hex: '#ED1C16', description: '세계에서 가장 인지도 높은 브랜드의 상징색', context: '자본주의의 아이콘', category: 'brand' },
        { name: '소비에트 연방', hex: '#CD0000', description: '구 소련의 국기에 사용된 붉은색', context: '공산주의의 상징', category: 'political' },
        { name: '맥도날드', hex: '#DA291C', description: '패스트푸드 문화의 대표 브랜드', context: '미국식 소비문화', category: 'brand' },
        { name: '중국 공산당', hex: '#DE2910', description: '중화인민공화국 국기의 붉은색', context: '현대 공산주의', category: 'political' },
        { name: 'YouTube', hex: '#FF0000', description: '디지털 시대의 붉은 재생 버튼', context: '플랫폼 자본주의', category: 'brand' },
        { name: '북한', hex: '#ED1C27', description: '조선민주주의인민공화국의 국기색', context: '주체사상', category: 'political' },
        { name: 'Target', hex: '#CC0000', description: '미국 대형 유통업체의 브랜드 컬러', context: '대량 소비사회', category: 'brand' },
        { name: 'Netflix', hex: '#E50914', description: '스트리밍 시대의 대표 브랜드', context: '구독 경제', category: 'brand' }
    ];
}

// CSV 로딩 함수
async function loadColorsFromCSV(csvPath) {
    try {
        const response = await fetch(csvPath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvText = await response.text();
        return parseCSV(csvText);
    } catch (error) {
        console.error('CSV 로딩 실패:', error);
        return getDefaultColors();
    }
}

// CSV 파싱 함수
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const colors = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        
        if (values.length >= 5) {
            const colorObj = {
                name: values[0] || '',
                hex: values[1] || '#000000',
                description: values[2] || '',
                context: values[3] || '',
                category: values[4] || 'other'
            };
            
            if (values[5]) colorObj.year = values[5];
            if (values[6]) colorObj.country = values[6];
            if (values[7]) colorObj.influence = parseFloat(values[7]) || 0;
            if (values[8]) colorObj.recognition = parseFloat(values[8]) || 0;
            
            colors.push(colorObj);
        }
    }
    
    return colors;
}

// CSV 라인 파싱
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current.trim());
    return result;
}

// 색상 선택기 업데이트
function updateColorSelector(colorData) {
    const colorSelector = document.querySelector('.color-selector');
    if (!colorSelector) return;
    
    colorSelector.innerHTML = '';
    
    colorData.forEach((color, index) => {
        const option = document.createElement('div');
        option.className = 'color-option';
        option.dataset.name = color.name;
        option.dataset.color = color.hex;
        option.style.backgroundColor = color.hex;
        
        option.addEventListener('click', () => {
            document.querySelectorAll('.color-option').forEach(opt => 
                opt.classList.remove('selected')
            );
            
            option.classList.add('selected');
            selectedColor = color;
            
            updateVisualizationResponsive(color);
        });
        
        colorSelector.appendChild(option);
    });
}

// 헥스를 RGB로 변환
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

// 색상 거리 계산
function colorDistance(color1, color2) {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    
    return 10 * Math.sqrt(
        Math.pow(rgb1.r - rgb2.r, 2) +
        Math.pow(rgb1.g - rgb2.g, 2) +
        Math.pow(rgb1.b - rgb2.b, 2)
    );
}

// 현재 브레이크포인트 감지
function getCurrentBreakpoint() {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
}

// 거리 구간 표시선 생성 (수정됨)
function createDistanceIndicators(distances, breakpoint, config) {
    const visualization = document.querySelector('.visualization');
    
    // 기존 세로 인디케이터 제거 (가로줄은 유지)
    const existingIndicators = visualization.querySelectorAll('.vertical-indicator');
    existingIndicators.forEach(indicator => indicator.remove());
    
    if (distances.length === 0) return;
    
    // 최대 거리 계산
    const maxDistance = Math.max(...distances.map(d => d.distance));
    const maxDisplayDistance = 442; // RGB 공간에서의 최대 거리
    
    // 구간 나누기 (1/3, 2/3 지점)
    const closeThreshold = maxDistance / 3;
    const mediumThreshold = (maxDistance * 2) / 3;
    
    const indicators = [
        { 
            distance: closeThreshold, 
            color: '#ffffff',
            opacity: 0.1
        },
        { 
            distance: mediumThreshold, 
            color: '#ffffff',
            opacity: 0.1
        }
    ];
    
    indicators.forEach((indicator, index) => {
        // 위치 계산 (기존 노드와 같은 로직)
        const normalizedDistance = (indicator.distance / maxDisplayDistance) * 100;
        const position = config.startPosition + (normalizedDistance * config.scale);
        
        // 화면을 벗어나지 않도록 제한
        const maxPosition = window.innerWidth - 120;
        const finalPosition = Math.min(position, maxPosition);
        
        // 세로선 생성 (!important 사용하여 강제 적용)
        const line = document.createElement('div');
        line.className = 'vertical-indicator';
        line.style.cssText = `
            position: absolute !important;
            left: ${finalPosition}px !important;
            top: 20% !important;
            height: 60% !important;
            width: 2px !important;
            background: ${indicator.color} !important;
            opacity: ${indicator.opacity} !important;
            z-index: 5 !important;
            border-radius: 1px !important;
            animation: indicatorAppear 0.8s ease-out ${index * 0.2}s both !important;
        `;
        
        visualization.appendChild(line);
    });
}

// 반응형 시각화 업데이트 (수정됨)
function updateVisualizationResponsive(selected) {
    const breakpoint = getCurrentBreakpoint();
    const originPoint = document.getElementById('originPoint');
    const colorNodes = document.getElementById('colorNodes');
    const closestColors = document.getElementById('closestColors');
    const visualization = document.querySelector('.visualization');
    
    console.log('🔍 디버깅: updateVisualizationResponsive 호출됨');
    console.log('선택된 색상:', selected);
    console.log('전체 colors 배열 길이:', colors.length);
    
    // 가로줄이 있는지 확인하고 없으면 생성
    let horizontalLine = visualization.querySelector('.horizontal-line');
    if (!horizontalLine) {
        horizontalLine = document.createElement('div');
        horizontalLine.className = 'horizontal-line';
        horizontalLine.style.cssText = `
            position: absolute;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
            top: 50%;
            transform: translateY(-50%);
            z-index: 3;
        `;
        
        // 브레이크포인트별 위치 설정
        if (breakpoint === 'mobile') {
            horizontalLine.style.left = '30px';
            horizontalLine.style.right = '30px';
        } else if (breakpoint === 'tablet') {
            horizontalLine.style.left = '40px';
            horizontalLine.style.right = '40px';
        } else {
            horizontalLine.style.left = '50px';
            horizontalLine.style.right = '50px';
        }
        
        visualization.appendChild(horizontalLine);
    } else {
        // 기존 가로줄 위치 업데이트
        if (breakpoint === 'mobile') {
            horizontalLine.style.left = '30px';
            horizontalLine.style.right = '30px';
        } else if (breakpoint === 'tablet') {
            horizontalLine.style.left = '40px';
            horizontalLine.style.right = '40px';
        } else {
            horizontalLine.style.left = '50px';
            horizontalLine.style.right = '50px';
        }
    }
    
    originPoint.style.backgroundColor = selected.hex;
    colorNodes.innerHTML = '';
    
    // 🔧 전체 색상 데이터에서 선택된 색상을 제외하고 거리 계산
    const otherColors = colors.filter(c => c.hex !== selected.hex);
    console.log('비교할 다른 색상들:', otherColors.length);
    
    if (otherColors.length === 0) {
        console.log('❌ 비교할 색상이 없습니다');
        closestColors.innerHTML = '<div class="no-results">비교할 다른 색상이 없습니다</div>';
        return;
    }
    
    const distances = otherColors.map(color => ({
        ...color,
        distance: colorDistance(selected.hex, color.hex)
    })).sort((a, b) => a.distance - b.distance);
    
    console.log('거리 계산 완료:', distances.length, '개');
    console.log('가장 가까운 3개:', distances.slice(0, 3).map(d => `${d.name}: ${d.distance.toFixed(2)}`));
    
    const configs = {
        mobile: { 
            maxNodes: 5, 
            nodeSize: '30px',
            startPosition: 80,
            scale: 4
        },
        tablet: { 
            maxNodes: 6, 
            nodeSize: '45px',
            startPosition: 120,
            scale: 5.5
        },
        desktop: { 
            maxNodes: 7, 
            nodeSize: '50px',
            startPosition: 150,
            scale: 7
        }
    };
    
    const config = configs[breakpoint];
    
    // 거리 표시선 생성
    createDistanceIndicators(distances, breakpoint, config);
    
    const displayColors = distances.slice(0, config.maxNodes);
    console.log('표시할 색상 노드:', displayColors.length, '개');
    
    // 색상별 구간 분류
    const classified = classifyColorsByDistance(distances);
    
    displayColors.forEach((color, index) => {
        const node = document.createElement('div');
        node.className = 'color-node';
        node.style.backgroundColor = color.hex;
        node.style.width = config.nodeSize;
        node.style.height = config.nodeSize;
        
        const maxDistance = 442;
        const normalizedDistance = (color.distance / maxDistance) * 100;
        const position = config.startPosition + (normalizedDistance * config.scale);
        
        node.style.left = `${Math.min(position, window.innerWidth - 100)}px`;
        node.style.animationDelay = `${index * 0.1}s`;
        
        // 기본 박스 섀도우만 적용 (테두리 색상 제거)
        node.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.4)';
        
        // 구간 정보만 데이터로 저장
        let distanceCategory = 'far';
        if (classified.close.includes(color)) {
            distanceCategory = 'close';
        } else if (classified.medium.includes(color)) {
            distanceCategory = 'medium';
        }
        
        node.dataset.colorData = JSON.stringify({...color, category: distanceCategory});
        
        // 터치 기기 감지
        const isTouchDevice = 'ontouchstart' in window;
        
        if (isTouchDevice) {
            node.addEventListener('click', (e) => {
                const isVisible = tooltip.classList.contains('show');
                hideTooltip();
                
                if (!isVisible) {
                    showTooltip(e, color);
                    setTimeout(hideTooltip, 3000);
                }
            });
        } else {
            node.addEventListener('mouseenter', (e) => {
                showTooltip(e, color);
            });
            
            node.addEventListener('mouseleave', () => {
                hideTooltip();
            });
        }
        
        colorNodes.appendChild(node);
    });
    
    // 결과 목록 업데이트 (구간별 색상 코딩 포함)
    const displayCount = breakpoint === 'mobile' ? 3 : 5;
    console.log('결과 목록 업데이트:', displayCount, '개 표시');
    
    closestColors.innerHTML = distances.slice(0, displayCount).map((color, index) => {
        let categoryIcon = '';
        let categoryColor = '#9ca3af';
        
        if (classified.close.includes(color)) {
            categoryIcon = '🟢';
            categoryColor = '#22c55e';
        } else if (classified.medium.includes(color)) {
            categoryIcon = '🟡';
            categoryColor = '#f59e0b';
        } else {
            categoryIcon = '🔴';
            categoryColor = '#ef4444';
        }
        
        return `
            <div class="color-item">
                <div class="color-preview" style="background-color: ${color.hex};"></div>
                <div class="color-info">
                    <div class="color-name">${index + 1}. ${color.name}</div>
                    <div class="color-distance">
                        <span style="color: ${categoryColor};">${categoryIcon} 거리: ${color.distance.toFixed(2)}</span> | ${color.context}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    console.log('✅ 시각화 업데이트 완료');
}

function showTooltip(e, color) {
    const node = e.target;
    const tooltip = document.getElementById('tooltip');

    // 거리 구간 분류
    const maxDistance = Math.max(...colors.filter(c => c.hex !== selectedColor.hex)
        .map(c => colorDistance(selectedColor.hex, c.hex)));
    const closeThreshold = maxDistance / 3;
    const mediumThreshold = (maxDistance * 2) / 3;

    let categoryInfo = '';
    if (color.distance <= closeThreshold) {
        categoryInfo = '<div class="distance-category close">🟢 가까운 색상</div>';
    } else if (color.distance <= mediumThreshold) {
        categoryInfo = '<div class="distance-category medium">🟡 보통 거리</div>';
    } else {
        categoryInfo = '<div class="distance-category far">🔴 먼 색상</div>';
    }

    tooltip.innerHTML = `
        <h3>${color.name}</h3>
        <p>${color.description}</p>
        <p style="margin-top: 5px; font-size: 0.8rem;">거리: ${color.distance.toFixed(2)}</p>
        ${categoryInfo}
    `;

    // 노드 기준 상대 위치 설정
    const offsetLeft = node.offsetLeft;
    const offsetTop = node.offsetTop;
    const nodeHeight = node.offsetHeight;

    tooltip.style.left = `${offsetLeft}px`;
    tooltip.style.top = `${offsetTop + nodeHeight + 8}px`; // 아래로 8px
    tooltip.style.transform = 'none';
    tooltip.classList.add('show');
}


// 툴팁 숨기기
function hideTooltip() {
    tooltip.classList.remove('show');
}

// 색상 구간별 분류 함수
function classifyColorsByDistance(distances) {
    if (distances.length === 0) return { close: [], medium: [], far: [] };
    
    const maxDistance = Math.max(...distances.map(d => d.distance));
    const closeThreshold = maxDistance / 3;
    const mediumThreshold = (maxDistance * 2) / 3;
    
    return {
        close: distances.filter(d => d.distance <= closeThreshold),
        medium: distances.filter(d => d.distance > closeThreshold && d.distance <= mediumThreshold),
        far: distances.filter(d => d.distance > mediumThreshold)
    };
}

// 카테고리별 필터링 (확장 기능)
function filterColorsByCategory(colors, category) {
    if (!category || category === 'all') return colors;
    return colors.filter(color => color.category === category);
}

// 리사이즈 핸들러
function handleResize() {
    clearTimeout(window.resizeTimer);
    window.resizeTimer = setTimeout(() => {
        if (selectedColor) {
            updateVisualizationResponsive(selectedColor);
        }
    }, 150);
}

// 반응형 레이아웃 설정
function setupResponsiveLayout() {
    const breakpoint = getCurrentBreakpoint();
    const body = document.body;
    
    // 기존 브레이크포인트 클래스 제거
    body.classList.remove('mobile', 'tablet', 'desktop');
    // 현재 브레이크포인트 클래스 추가
    body.classList.add(breakpoint);
}

// 초기화
document.addEventListener('DOMContentLoaded', async () => {
    document.body.classList.add('loading');
    
    try {
        // CSV에서 색상 데이터 로드
        colors = await loadColorsFromCSV('./data/colors.csv');
        allColors = [...colors]; // 전체 데이터 백업
        filteredColors = [...colors]; // 초기에는 모든 색상 표시
        
        // 검색 기능 초기화
        initializeSearch();
        
        // 색상 선택기 업데이트
        updateColorSelector(filteredColors);
        
        // 반응형 설정
        setupResponsiveLayout();
        
        // 이벤트 리스너 등록
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                setupResponsiveLayout();
                if (selectedColor) {
                    updateVisualizationResponsive(selectedColor);
                }
            }, 100);
        });
        
        // 첫 번째 색상으로 초기화
        if (filteredColors.length > 0) {
            const firstOption = document.querySelector('.color-option');
            if (firstOption) {
                firstOption.click();
            }
        }
        
        // 로딩 완료
        document.body.classList.remove('loading');
        
    } catch (error) {
        console.error('초기화 실패:', error);
        document.body.classList.remove('loading');
        document.body.classList.add('error');
    }
});

// 검색 기능 초기화
function initializeSearch() {
    const container = document.querySelector('.container');
    const header = container.querySelector('header');
    const colorSelector = container.querySelector('.color-selector');
    
    // 검색 컨테이너 생성
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    searchContainer.innerHTML = `
        <div class="search-wrapper">
            <input type="text" 
                   id="colorSearch" 
                   class="search-input" 
                   placeholder="색상, 브랜드, 국가 또는 컨텍스트로 검색..."
                   autocomplete="off">
            <div class="search-icon">🔍</div>
            <button class="search-clear" id="searchClear" style="display: none;">✕</button>
        </div>
        <div class="search-results-info" id="searchInfo">
            총 ${allColors.length}개 색상
        </div>
    `;
    
    // 헤더와 색상 선택기 사이에 삽입
    container.insertBefore(searchContainer, colorSelector);
    
    // 검색 이벤트 리스너
    const searchInput = document.getElementById('colorSearch');
    const clearButton = document.getElementById('searchClear');
    const searchInfo = document.getElementById('searchInfo');
    
    // 실시간 검색 (디바운싱 적용)
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        // 클리어 버튼 표시/숨김
        clearButton.style.display = query ? 'flex' : 'none';
        
        searchTimeout = setTimeout(() => {
            performSearch(query);
        }, 300); // 300ms 디바운싱
    });
    
    // 클리어 버튼 이벤트
    clearButton.addEventListener('click', () => {
        searchInput.value = '';
        clearButton.style.display = 'none';
        performSearch('');
        searchInput.focus();
    });
    
    // Enter 키 검색
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            clearTimeout(searchTimeout);
            performSearch(searchInput.value.trim());
        }
    });
}

// 검색 수행
function performSearch(query) {
    const searchInfo = document.getElementById('searchInfo');
    
    if (!query) {
        // 검색어가 없으면 모든 색상 표시
        filteredColors = [...allColors];
        colors = filteredColors; // 시각화에서 사용할 전체 데이터
        searchInfo.textContent = `총 ${allColors.length}개 색상`;
    } else {
        // 검색 실행
        filteredColors = searchColors(query);
        // 🔧 중요: 시각화용 colors는 여전히 전체 데이터를 사용
        colors = [...allColors]; // 거리 계산을 위해 전체 데이터 유지
        
        if (filteredColors.length === 0) {
            searchInfo.innerHTML = `"${query}"에 대한 검색 결과가 없습니다`;
        } else {
            searchInfo.innerHTML = `"${query}" 검색 결과: ${filteredColors.length}개 색상`;
        }
    }
    
    // 색상 선택기 업데이트
    updateColorSelector(filteredColors);
    
    // 첫 번째 색상으로 시각화 업데이트 (있는 경우)
    if (filteredColors.length > 0) {
        const firstColor = filteredColors[0];
        selectedColor = firstColor;
        
        // 첫 번째 옵션 선택 상태로 만들기
        setTimeout(() => {
            const firstOption = document.querySelector('.color-option');
            if (firstOption) {
                document.querySelectorAll('.color-option').forEach(opt => 
                    opt.classList.remove('selected')
                );
                firstOption.classList.add('selected');
                updateVisualizationResponsive(firstColor);
            }
        }, 100);
    } else {
        // 검색 결과가 없으면 시각화 초기화
        clearVisualization();
    }
}

// 시각화 초기화 함수 추가
function clearVisualization() {
    const visualization = document.querySelector('.visualization');
    const colorNodes = document.getElementById('colorNodes');
    const closestColors = document.getElementById('closestColors');
    
    if (colorNodes) colorNodes.innerHTML = '';
    if (closestColors) {
        closestColors.innerHTML = '<div class="no-results">검색 결과가 없습니다</div>';
    }
    
    // 세로 구간선도 제거
    const existingIndicators = visualization.querySelectorAll('.vertical-indicator');
    existingIndicators.forEach(indicator => indicator.remove());
    
    // 원점 초기화
    const originPoint = document.getElementById('originPoint');
    if (originPoint) {
        originPoint.style.backgroundColor = '#666666';
    }
}

// 색상 검색 함수
function searchColors(query) {
    const lowerQuery = query.toLowerCase();
    
    return allColors.filter(color => {
        return (
            color.name.toLowerCase().includes(lowerQuery) ||
            color.description.toLowerCase().includes(lowerQuery) ||
            color.context.toLowerCase().includes(lowerQuery) ||
            color.category.toLowerCase().includes(lowerQuery) ||
            (color.country && color.country.toLowerCase().includes(lowerQuery)) ||
            (color.year && color.year.toString().includes(lowerQuery)) ||
            color.hex.toLowerCase().includes(lowerQuery)
        );
    });
}

// 검색 하이라이트 함수 (선택사항)
function highlightSearchTerm(text, query) {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

// script.js에 추가할 색상 피커 기능

// 색상 피커 초기화 (검색 기능 초기화 후에 호출)
// script.js의 initializeColorPicker 함수를 이것으로 교체

function initializeColorPicker() {
    const container = document.querySelector('.container');
    const colorSelector = container.querySelector('.color-selector');
    
    // 색상 피커 컨테이너 생성 (색상 상자 하나만)
    const colorPickerContainer = document.createElement('div');
    colorPickerContainer.className = 'color-picker-container';
    colorPickerContainer.innerHTML = `
        <div class="color-picker-wrapper">
            <div class="color-picker-title">
                <span class="picker-icon">🎨</span>
                <span>원하는 색상으로 비교하기</span>
            </div>
            <div class="color-picker-info" id="pickerInfo">
                색상을 선택하거나 HEX 코드를 입력하세요
            </div>
            <div class="color-picker-content">
                <div class="color-input-wrapper">
                    <input type="color" 
                           id="colorPicker" 
                           class="color-picker-input" 
                           value="#FF0000">
                </div>
                <div class="color-info-inputs">
                    <input type="text" 
                           id="hexInput" 
                           class="hex-input" 
                           placeholder="#FF0000" 
                           maxlength="7">
                    <button id="compareButton" class="compare-button">
                        <span class="button-icon">🔍</span>
                        <span class="button-text">이 색상과 비교</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // 색상 선택기 아래에 삽입
    container.insertBefore(colorPickerContainer, colorSelector.nextSibling);
    
    // 이벤트 리스너 설정
    setupColorPickerEvents();
}

// setupColorPickerEvents 함수도 수정 (colorDisplay 관련 제거)
function setupColorPickerEvents() {
    const colorPicker = document.getElementById('colorPicker');
    const hexInput = document.getElementById('hexInput');
    const compareButton = document.getElementById('compareButton');
    //const pickerInfo = document.getElementById('pickerInfo');
    
    // 초기 HEX 값 설정
    hexInput.value = colorPicker.value.toUpperCase();
    
    // 색상 피커 변경 이벤트
    colorPicker.addEventListener('input', (e) => {
        const color = e.target.value;
        hexInput.value = color.toUpperCase();
        //pickerInfo.textContent = `선택된 색상: ${color.toUpperCase()}`;
    });
    
    // HEX 입력 필드 이벤트
    hexInput.addEventListener('input', (e) => {
        const hex = e.target.value;
        if (isValidHex(hex)) {
            colorPicker.value = hex;
            pickerInfo.textContent = `입력된 색상: ${hex.toUpperCase()}`;
        } else if (hex.length > 0) {
            pickerInfo.textContent = "올바른 HEX 코드를 입력하세요 (예: #FF0000)";
        }
    });
    
    // HEX 입력 필드 포커스 아웃 시 검증
    hexInput.addEventListener('blur', (e) => {
        const hex = e.target.value;
        if (hex && !isValidHex(hex)) {
            e.target.value = colorPicker.value;
            pickerInfo.textContent = `수정됨: ${colorPicker.value}`;
        }
    });
    
    // 비교 버튼 클릭 이벤트
    compareButton.addEventListener('click', () => {
        const selectedColor = colorPicker.value;
        compareWithCustomColor(selectedColor);
    });
    
    // Enter 키로 비교 실행
    hexInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const hex = e.target.value;
            if (isValidHex(hex)) {
                compareWithCustomColor(hex);
            }
        }
    });
}

// 색상 표시 업데이트
function updateColorDisplay(color) {
    const colorDisplay = document.getElementById('colorDisplay');
    const hexInput = document.getElementById('hexInput');
    
    colorDisplay.style.backgroundColor = color;
    if (!hexInput.matches(':focus')) {
        hexInput.value = color.toUpperCase();
    }
}

// HEX 색상 코드 유효성 검사
function isValidHex(hex) {
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(hex);
}

// 사용자 정의 색상과 비교
function compareWithCustomColor(hexColor) {
    const pickerInfo = document.getElementById('pickerInfo');
    const compareButton = document.getElementById('compareButton');
    
    // 버튼 로딩 상태
    compareButton.innerHTML = `
        <span class="button-icon">⏳</span>
        <span class="button-text">분석 중...</span>
    `;
    
    // RGB 값 계산
    const rgb = hexToRgb(hexColor);
    if (!rgb) {
        pickerInfo.textContent = "올바르지 않은 색상 코드입니다.";
        resetCompareButton();
        return;
    }
    
    // 임시 색상 객체 생성
    const customColor = {
        name: `사용자 색상`,
        hex: hexColor.toUpperCase(),
        description: `RGB(${rgb.r}, ${rgb.g}, ${rgb.b})`,
        context: '사용자 정의',
        category: 'custom'
    };
    
    // 기존 검색 초기화 (선택사항)
    const searchInput = document.getElementById('colorSearch');
    if (searchInput) {
        searchInput.value = '';
        const clearButton = document.getElementById('searchClear');
        if (clearButton) clearButton.style.display = 'none';
    }
    
    // 색상 선택기를 전체 데이터로 복원
    filteredColors = [...allColors];
    colors = [...allColors];
    updateColorSelector(filteredColors);
    
    // 선택된 색상 설정 및 시각화
    selectedColor = customColor;
    
    setTimeout(() => {
        // 모든 색상 옵션 선택 해제
        document.querySelectorAll('.color-option').forEach(opt => 
            opt.classList.remove('selected')
        );
        
        // 시각화 업데이트
        updateVisualizationResponsive(customColor);
        
        // 정보 업데이트
        const searchInfo = document.getElementById('searchInfo');
        if (searchInfo) {
            searchInfo.innerHTML = `사용자 색상 <span style="display:inline-block;width:20px;height:20px;background:${hexColor};border-radius:3px;vertical-align:middle;margin:0 5px;border:1px solid rgba(255,255,255,0.3);"></span> ${hexColor}와 비교 중`;
        }
        
        pickerInfo.innerHTML = `분석 완료! <strong>${hexColor}</strong> 색상과 가장 유사한 색상들을 확인하세요.`;
        
        // 버튼 원래 상태로 복원
        resetCompareButton();
        
        // 결과 영역으로 스크롤 (부드럽게)
        const results = document.querySelector('.results');
        if (results) {
            results.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }
        
    }, 500);
}

// 비교 버튼 원래 상태로 복원
function resetCompareButton() {
    const compareButton = document.getElementById('compareButton');
    compareButton.innerHTML = `
        <span class="button-icon">🔍</span>
        <span class="button-text">이 색상과 비교</span>
    `;
}

// 기존 initializeSearch 함수 수정 - 색상 피커도 함께 초기화
function initializeSearch() {
    const container = document.querySelector('.container');
    const header = container.querySelector('header');
    const colorSelector = container.querySelector('.color-selector');
    
    // 검색 컨테이너 생성
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    searchContainer.innerHTML = `
        <div class="search-wrapper">
            <input type="text" 
                   id="colorSearch" 
                   class="search-input" 
                   placeholder="색상, 브랜드, 국가 또는 컨텍스트로 검색..."
                   autocomplete="off">
            <div class="search-icon">🔍</div>
            <button class="search-clear" id="searchClear" style="display: none;">✕</button>
        </div>
        <div class="search-results-info" id="searchInfo">
            총 ${allColors.length}개 색상
        </div>
    `;
    
    // 헤더와 색상 선택기 사이에 삽입
    container.insertBefore(searchContainer, colorSelector);
    
    // 색상 피커도 함께 초기화
    initializeColorPicker();
    
    // 검색 이벤트 리스너 (기존과 동일)
    const searchInput = document.getElementById('colorSearch');
    const clearButton = document.getElementById('searchClear');
    const searchInfo = document.getElementById('searchInfo');
    
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        clearButton.style.display = query ? 'flex' : 'none';
        
        searchTimeout = setTimeout(() => {
            performSearch(query);
        }, 300);
    });
    
    clearButton.addEventListener('click', () => {
        searchInput.value = '';
        clearButton.style.display = 'none';
        performSearch('');
        searchInput.focus();
    });
    
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            clearTimeout(searchTimeout);
            performSearch(searchInput.value.trim());
        }
    });
}