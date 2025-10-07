// src/services/certificationApi.js
const CERT_API_BASE = 'https://app.dataengineerhub.blog/wp-json/cert/v1';

class CertificationAPI {
  async getCertifications() {
    const response = await fetch(`${CERT_API_BASE}/certifications`);
    if (!response.ok) throw new Error('Failed to fetch certifications');
    return response.json();
  }
  
  async getQuestions(certId, page = 1, perPage = 20) {
    const response = await fetch(
      `${CERT_API_BASE}/questions/${certId}?page=${page}&per_page=${perPage}`
    );
    if (!response.ok) throw new Error('Failed to fetch questions');
    return response.json();
  }
  
  async getQuestion(questionId) {
    const response = await fetch(`${CERT_API_BASE}/question/${questionId}`);
    if (!response.ok) throw new Error('Failed to fetch question');
    return response.json();
  }
}

export default new CertificationAPI();