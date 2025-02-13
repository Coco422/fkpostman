// 全局变量
let method = 'GET';
let requestTimeout;

// 方法选择器切换
const getBtn = document.getElementById('get-btn');
const postBtn = document.getElementById('post-btn');

getBtn.addEventListener('click', () => {
  method = 'GET';
  getBtn.classList.add('active');
  postBtn.classList.remove('active');
});

postBtn.addEventListener('click', () => {
  method = 'POST';
  postBtn.classList.add('active');
  getBtn.classList.remove('active');
});

// 添加参数行
const addParamBtn = document.getElementById('add-param-btn');
const paramsContainer = document.querySelector('.params-container');

addParamBtn.addEventListener('click', () => {
  const paramRow = document.createElement('div');
  paramRow.classList.add('param-row');
  paramRow.innerHTML = `
    <input type="text" placeholder="Key">
    <input type="text" placeholder="Value">
    <button class="remove-param">X</button>
  `;
  paramsContainer.insertBefore(paramRow, addParamBtn);

  const removeParamBtn = paramRow.querySelector('.remove-param');
  removeParamBtn.addEventListener('click', () => {
    paramsContainer.removeChild(paramRow);
  });
});

// 添加请求头行
const addHeaderBtn = document.getElementById('add-header-btn');
const headersContainer = document.querySelector('.headers-container');

addHeaderBtn.addEventListener('click', () => {
  const headerRow = document.createElement('div');
  headerRow.classList.add('header-row');
  headerRow.innerHTML = `
    <input type="text" placeholder="Header Key">
    <input type="text" placeholder="Header Value">
    <button class="remove-header">X</button>
  `;
  headersContainer.insertBefore(headerRow, addHeaderBtn);

  const removeHeaderBtn = headerRow.querySelector('.remove-header');
  removeHeaderBtn.addEventListener('click', () => {
    headersContainer.removeChild(headerRow);
  });
});

// 发送请求
const sendRequestBtn = document.getElementById('send-request-btn');
const urlInput = document.getElementById('url-input');
const requestBody = document.getElementById('request-body');
const statusCodeSpan = document.getElementById('status-code');
const responseTimeSpan = document.getElementById('response-time');
const formattedJsonDiv = document.getElementById('formatted-json');
const rawResponseTextarea = document.getElementById('raw-response');
const toggleRawBtn = document.getElementById('toggle-raw');

sendRequestBtn.addEventListener('click', async () => {
  const baseURL = urlInput.value;
  const params = Array.from(paramsContainer.querySelectorAll('.param-row'))
    .map(row => {
      const key = row.children[0].value;
      const value = row.children[1].value;
      return { key, value };
    })
    .filter(param => param.key && param.value);

  const headers = Array.from(headersContainer.querySelectorAll('.header-row'))
    .map(row => {
      const key = row.children[0].value;
      const value = row.children[1].value;
      return { key, value };
    })
    .filter(header => header.key && header.value);

  const fullURL = buildFullURL(baseURL, params);

  const config = {
    url: fullURL,
    method: method,
    headers: headers.reduce((acc, header) => {
      acc[header.key] = header.value;
      return acc;
    }, {}),
    body: method === 'POST' ? JSON.parse(requestBody.value) : null
  };

  const startTime = Date.now();
  const response = await sendRequest(config);
  const endTime = Date.now();
  const responseTime = endTime - startTime;

  statusCodeSpan.textContent = `Status Code: ${response.status}`;
  responseTimeSpan.textContent = `Response Time: ${responseTime}ms`;

  try {
    const jsonData = await response.json();
    formattedJsonDiv.textContent = JSON.stringify(jsonData, null, 2);
    rawResponseTextarea.value = JSON.stringify(jsonData, null, 2);
  } catch (error) {
    const textData = await response.text();
    formattedJsonDiv.textContent = textData;
    rawResponseTextarea.value = textData;
  }
});

// 切换原始响应数据显示
toggleRawBtn.addEventListener('click', () => {
  if (rawResponseTextarea.style.display === 'none') {
    rawResponseTextarea.style.display = 'block';
    formattedJsonDiv.style.display = 'none';
  } else {
    rawResponseTextarea.style.display = 'none';
    formattedJsonDiv.style.display = 'block';
  }
});

// 构建完整 URL
function buildFullURL(baseURL, params) {
  const urlObj = new URL(baseURL);
  params.forEach(({ key, value }) => urlObj.searchParams.append(key, value));
  return urlObj.toString();
}

// 发送请求
async function sendRequest(config) {
  const controller = new AbortController();
  requestTimeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(config.url, {
      method: config.method,
      headers: new Headers(config.headers),
      body: config.method === 'POST' ? JSON.stringify(config.body) : null,
      signal: controller.signal
    });

    clearTimeout(requestTimeout);
    return response;
  } catch (error) {
    clearTimeout(requestTimeout);
    console.error('Request error:', error);
    alert('Network error. Please try again.');
  }
}