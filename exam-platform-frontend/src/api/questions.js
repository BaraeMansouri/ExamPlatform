import api from './axios';

export const addQuestion = (examId, data) => api.post(`/exams/${examId}/questions`, data);
export const deleteQuestion = (id) => api.delete(`/questions/${id}`);
