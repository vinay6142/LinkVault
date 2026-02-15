import axios from 'axios';

const api = axios.create({
  baseURL: 'http://10.145.30.165:5000/api'
});

async function test() {
  try {
    // Test upload with maxViewCount
    const formData = new FormData();
    formData.append('text', 'Test content');
    formData.append('maxViewCount', '3');
    
    const uploadRes = await api.post('/shares/upload', formData);
    console.log('Upload response:', uploadRes.data);
    
    const shareId = uploadRes.data.shareId;
    
    // Check info
    const infoRes = await api.get(`/shares/info/${shareId}`);
    console.log('Info response:', infoRes.data);
    console.log('MaxViewCount in info:', infoRes.data.maxViewCount);
    
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  }
}

test();
