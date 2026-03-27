import api from './axios';

export const getResults = (examId) => api.get(`/results/${examId}`);
export const getResultDetail = (sessionId) => api.get(`/results/${sessionId}/detail`);
export const gradeAnswer = (answerId, data) => api.put(`/results/answers/${answerId}`, data);
