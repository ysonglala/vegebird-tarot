window.VEGE_TAROT_API = (() => {
  const API_BASE = window.VEGE_TAROT_API_BASE || 'http://127.0.0.1:8787';

  async function request(path, options = {}) {
    const url = `${API_BASE}${path}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });

    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }

    if (!response.ok) {
      const error = new Error(data?.message || `HTTP ${response.status}`);
      error.status = response.status;
      error.payload = data;
      throw error;
    }

    return data;
  }

  async function interpretReading(payload) {
    return request('/api/tarot/interpret', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async function followUpReading(payload) {
    return request('/api/tarot/follow-up', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async function fetchHistory() {
    return request('/api/tarot/history', {
      method: 'GET',
    });
  }

  return {
    request,
    interpretReading,
    followUpReading,
    fetchHistory,
  };
})();
