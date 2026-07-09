const axios = require('axios');
const FormData = require('form-data');

const apiClient = axios.create({
  baseURL: 'https://httpbin.org',
  headers: { 'Content-Type': 'application/json' }
});

const fd = new FormData();
fd.append('test', 'value');

apiClient.post('/post', fd, {
  headers: { 'Content-Type': 'multipart/form-data' }
}).then(res => {
  console.log('With explicit multipart:', res.data.headers['Content-Type']);
}).catch(err => console.error(err.message));

apiClient.post('/post', fd).then(res => {
  console.log('Without explicit header:', res.data.headers['Content-Type']);
}).catch(err => console.error(err.message));
