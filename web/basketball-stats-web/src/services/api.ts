import axios from 'axios';
import { BasketballStatsAPI } from '@basketball-stats/shared';

// Create a direct instance of the API with an axios instance
const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Override the api.ts in the shared package
class WebBasketballStatsAPI extends BasketballStatsAPI {
  constructor() {
    super();
    // Override the client with our own instance
    Object.defineProperty(this, 'client', {
      value: axiosInstance,
      writable: true,
      configurable: true
    });
  }
}

export const basketballAPI = new WebBasketballStatsAPI();
export default basketballAPI;
