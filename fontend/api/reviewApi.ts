import axios from 'axios';
import { CreateReviewDTO, ReviewDTO, ReviewStatsDTO } from '../types/review';

const API_BASE = '/api';

export const fetchReviews = (productId: number, page: number = 1) =>
    axios.get<ReviewDTO[]>(`${API_BASE}/products/${productId}/reviews?page=${page}`);

export const fetchStats = (productId: number) =>
    axios.get<ReviewStatsDTO>(`/api/products/${productId}/review-stats`);

export const submitReview = (productId: number, data: CreateReviewDTO) =>
    axios.post(`${API_BASE}/products/${productId}/reviews`, data);
