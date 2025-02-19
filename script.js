// 域名生成配置
const zlName = [ ".20292029.xyz", ".20292029.xyz", ".20292029.xyz", ".20292029.xyz", ".20292029.xyz", ".20292029.xyz", ".20292029.xyz", ".20292029.xyz", ".20292029.xyz"];

// 打乱数组的函数
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 生成域名列表
function generateDomains(count) {
    const domains = [];
    // 打乱后缀数组
    const shuffledSuffixes = shuffleArray([...zlName]);
    
    for (let i = 0; i < count; i++) {
        // 循环使用打乱后的后缀
        const suffix = shuffledSuffixes[i % shuffledSuffixes.length];
        const domain = uuid2(7, 16) + suffix;
        domains.push(domain);
    }
    return domains;
}

// UUID 生成
function uuid2(len, radix) {
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
    var uuid = [], i;
    radix = radix || chars.length;

    if (len) {
        // Compact form
        for (i = 0; i < len; i++) {
            uuid[i] = chars[0 | Math.random() * radix];
        }
    } else {
        // rfc4122, version 4 form
        var r;
        uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
        uuid[14] = '4';

        for (i = 0; i < 36; i++) {
            if (!uuid[i]) {
                r = 0 | Math.random() * 16;
                uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
            }
        }
    }
    return uuid.join('');
}

// 生成10个域名
const allDomains = generateDomains(5);

// 随机选择5个不同的域名
function getRandomDomains(count) {
    const shuffled = [...allDomains].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// 检测域名可访问性
async function checkDomain(domain) {
    const startTime = performance.now();
    try {
        const response = await fetch(`https://${domain}`, {
            mode: 'no-cors',
            timeout: 5000
        });
        const endTime = performance.now();
        const latency = Math.round(endTime - startTime);
        return {
            available: true,
            latency
        };
    } catch (error) {
        return {
            available: false,
            latency: 0
        };
    }
}


// 添加本地存储相关函数
function saveSuccessfulDomain(domain) {
    const timestamp = new Date().getTime();
    localStorage.setItem('lastSuccessfulDomain', JSON.stringify({
        domain: domain,
        timestamp: timestamp
    }));
}

function getLastSuccessfulDomain() {
    const saved = localStorage.getItem('lastSuccessfulDomain');
    if (!saved) return null;
    
    const data = JSON.parse(saved);
    const now = new Date().getTime();
    // 检查是否在24小时内（在这里记录的时间了）
    if (now - data.timestamp < 24 * 60 * 60 * 1000) {
        return data.domain;
    }    
	// 如果超过24小时了，删除存储的数据
    localStorage.removeItem('lastSuccessfulDomain');
    return null;
}

// 创建加载中的域名元素
function createLoadingDomainElement(routeNumber) {
    const routeSection = document.createElement('div');
    routeSection.className = 'route-section';
    
    const routeTitle = document.createElement('div');
    routeTitle.className = 'route-title';
    routeTitle.textContent = `线路 ${routeNumber}`;
    
    const domainItem = document.createElement('div');
    domainItem.className = 'domain-item';
    
    const statusDiv = document.createElement('div');
    statusDiv.className = 'domain-status';
    
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    
    const checkingText = document.createElement('span');
    checkingText.className = 'checking-text';
    checkingText.textContent = '正在检测中...';
    
    statusDiv.appendChild(spinner);
    statusDiv.appendChild(checkingText);
    domainItem.appendChild(statusDiv);
    
    routeSection.appendChild(routeTitle);
    routeSection.appendChild(domainItem);
    
    return {
        element: routeSection,
        updateContent: (domain, status) => {
            domainItem.innerHTML = '';
            
            const domainLink = document.createElement('a');
            domainLink.href = `https://${domain}`;
            domainLink.textContent = status.available ? '点击进入线路' : '线路不可用';
            domainLink.target = '_blank';
            domainLink.className = status.available ? 'available-link' : 'unavailable-link';
            
            // 添加点击事件，保存成功访问的域名
            if (status.available) {
                domainLink.addEventListener('click', () => {
                    saveSuccessfulDomain(domain);
                });
            }

            const domainText = document.createElement('span');
            domainText.className = 'domain-text';
            domainText.textContent = domain;
            domainText.style.marginRight = '15px';
            domainText.style.color = '#888';

            const newStatusDiv = document.createElement('div');
            newStatusDiv.className = 'domain-status';
            
            const indicator = document.createElement('div');
            indicator.className = `status-indicator ${status.available ? 'status-available' : 'status-unavailable'}`;
            
            const latencySpan = document.createElement('span');
            latencySpan.className = 'latency';
            latencySpan.textContent = status.available ? `延迟: ${(status.latency/1000).toFixed(3)}s` : '不可访问';

            newStatusDiv.appendChild(indicator);
            newStatusDiv.appendChild(latencySpan);
            
            domainItem.appendChild(domainText);
            domainItem.appendChild(domainLink);
            domainItem.appendChild(newStatusDiv);

            // 添加可用/不可用的视觉标识
            routeSection.className = `route-section ${status.available ? 'available' : 'unavailable'}`;
            
            // 添加提示文本
            const tipText = document.createElement('div');
            tipText.style.fontSize = '12px';
            tipText.style.color = '#888';
            tipText.style.marginTop = '8px';
            tipText.textContent = status.available ? 
                '✅ 此线路正常可用，点击绿色按钮直接访问' : 
                '❌ 此线路暂时无法访问，请尝试其他线路';
            domainItem.appendChild(tipText);
        }
    };
}

// 修改初始化页面函数
async function initializePage() {
    // 检查是否有最近成功访问的域名
    const lastDomain = getLastSuccessfulDomain();
    if (lastDomain) {
        // 创建简单的跳转提示
        const redirectDiv = document.createElement('div');
        redirectDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: #fff;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            z-index: 1000;
            box-shadow: 0 2px 20px rgba(0, 0, 0, 0.5);
        `;
        redirectDiv.textContent = '正在跳转到上次可用的域名...';
        document.body.appendChild(redirectDiv);

        // 隐藏主要内容
        document.querySelector('.container').style.display = 'none';
        document.querySelector('.footer').style.display = 'none';
        document.querySelector('.header').style.display = 'none';

        // 直接跳转
        setTimeout(() => {
            window.location.href = `https://${lastDomain}`;
        }, 1000);
        return;
    }
	
    const domainList = document.getElementById('domain-list');
    const errorMessage = document.getElementById('error-message');
    const selectedDomains = getRandomDomains(5);
    const routeElements = [];

    // 首先创建所有加载中的元素
    for (let i = 0; i < 5; i++) {
        const routeElement = createLoadingDomainElement(i + 1);
        routeElements.push(routeElement);
        domainList.appendChild(routeElement.element);
    }

    // 并行检测所有域名
    const checkResults = [];
    const checkPromises = selectedDomains.map(async (domain, index) => {
        const status = await checkDomain(domain);
        routeElements[index].updateContent(domain, status);
        checkResults.push({ domain, status, index });
        return status.available;
    });

    // 等待所有检测完成
    const results = await Promise.all(checkPromises);
    
    // 检查是否所有线路都不可用
    const allUnavailable = results.every(available => !available);
    if (allUnavailable) {
        errorMessage.style.display = 'block';
    } else {
        errorMessage.style.display = 'none';
        
        // 找到延迟最低的可用域名
        const availableDomains = checkResults.filter(result => result.status.available);
        if (availableDomains.length > 0) {
            const fastestDomain = availableDomains.reduce((prev, current) => {
                return prev.status.latency < current.status.latency ? prev : current;
            });

            // 创建倒计时提示
            const countdownDiv = document.createElement('div');
            countdownDiv.className = 'countdown-tip';
            countdownDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(0, 0, 0, 0.8);
                color: #fff;
                padding: 15px 20px;
                border-radius: 8px;
                z-index: 1000;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
                border: 1px solid #4CAF50;
            `;
            document.body.appendChild(countdownDiv);

            // 开始3秒倒计时
            let countdown = 3;
            const updateCountdown = () => {
                countdownDiv.textContent = `${countdown} 秒后自动跳转到最快线路...`;
                if (countdown === 0) {
                    // 保存成功访问的域名
                    saveSuccessfulDomain(fastestDomain.domain);
                    window.location.href = `https://${fastestDomain.domain}`;
                } else {
                    countdown--;
                    setTimeout(updateCountdown, 1000);
                }
            };
            updateCountdown();

            // 高亮显示最快的线路
            const fastestElement = routeElements[fastestDomain.index].element;
            fastestElement.style.border = '2px solid #4CAF50';
            fastestElement.style.boxShadow = '0 0 15px rgba(76, 175, 80, 0.3)';
            
            // 添加"最快线路"标签
            const fastestLabel = document.createElement('div');
            fastestLabel.textContent = '🚀 最快线路';
            fastestLabel.style.cssText = `
                background: #4CAF50;
                color: white;
                padding: 5px 10px;
                border-radius: 4px;
                font-size: 12px;
                display: inline-block;
                margin-left: 10px;
            `;
            fastestElement.querySelector('.route-title').appendChild(fastestLabel);
        }
    }
}

// 页面加载完成后执行初始化
document.addEventListener('DOMContentLoaded', initializePage); 
