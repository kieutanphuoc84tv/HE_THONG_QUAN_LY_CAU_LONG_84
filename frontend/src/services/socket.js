import { io } from 'socket.io-client';
import { API_BASE_URL } from './api';

const socket = io(API_BASE_URL, {
  autoConnect: false, // We'll connect when user is ready or in specific components
});

export default socket;
