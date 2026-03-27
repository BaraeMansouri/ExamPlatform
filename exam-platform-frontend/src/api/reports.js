import api from './axios';

export const getReports = (examId) => api.get(`/reports/${examId}`);
export const getReportDetail = (sessionId) => api.get(`/reports/${sessionId}/detail`);
export const addRemark = (reportId, data) => api.put(`/reports/${reportId}`, data);
