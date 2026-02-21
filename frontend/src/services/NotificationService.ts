import { ApiService } from './ApiService';
import { API_URL } from '../config';

export interface Notification {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    timestamp: string;
}

class NotificationServiceClass {
    private socket: WebSocket | null = null;
    private listeners: ((notification: Notification) => void)[] = [];

    async getMyNotifications(): Promise<Notification[]> {
        const response = await ApiService.get('/api/notifications');
        return response.data;
    }

    async markAsRead(id: string): Promise<void> {
        await ApiService.put(`/api/notifications/${id}/read`, {});
    }

    async markAllAsRead(): Promise<void> {
        await ApiService.put('/api/notifications/read-all', {});
    }

    async deleteNotification(id: string): Promise<void> {
        await ApiService.delete(`/api/notifications/${id}`);
    }

    connect(userId: string) {
        if (this.socket) return;

        // Convert http://host:port/api to ws://host:port/ws/notifications
        const wsBase = API_URL.replace('http://', 'ws://').replace('https://', 'wss://');
        const wsUrl = `${wsBase}/ws/notifications`;

        console.log('Connecting to WebSocket:', wsUrl);
        this.socket = new WebSocket(wsUrl);

        this.socket.onmessage = (event) => {
            try {
                const notification: Notification = JSON.parse(event.data);
                console.log('Received WebSocket notification:', notification.title, 'for user:', notification.userId);

                if (String(notification.userId) === String(userId)) {
                    console.log('Notification matches current user. Notifying listeners.');
                    this.notifyListeners(notification);
                } else {
                    console.log('Notification for different user (Target:', notification.userId, 'Current:', userId, '). Ignoring.');
                }
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        this.socket.onclose = () => {
            console.log('WebSocket connection closed. Retrying in 5s...');
            this.socket = null; // Clear socket to allow reconnection
            setTimeout(() => this.connect(userId), 5000);
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error for URL:', wsUrl, error);
            if (this.socket) {
                this.socket.close();
            }
        };

        this.socket.onopen = () => {
            console.log('WebSocket connection established successfully for user:', userId);
        };
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }

    addListener(callback: (notification: Notification) => void) {
        this.listeners.push(callback);
    }

    removeListener(callback: (notification: Notification) => void) {
        this.listeners = this.listeners.filter(l => l !== callback);
    }

    private notifyListeners(notification: Notification) {
        this.listeners.forEach(l => l(notification));
    }
}

export const NotificationService = new NotificationServiceClass();
