import api from './axios';

export const verifyToken = (token) => api.get(`/exam/access/${token}`);
export const joinExam = (data) => api.post('/exam/join', data);
export const logActivity = (data) => api.post('/exam/log-activity', data);
export const submitExam = (data) => api.post('/exam/submit', data);

export const getPendingSessions = (examId) => api.get(`/admin/pending/${examId}`);
export const validateSession = (sessionId) => api.post(`/admin/validate/${sessionId}`);
export const rejectSession = (sessionId) => api.post(`/admin/reject/${sessionId}`);
