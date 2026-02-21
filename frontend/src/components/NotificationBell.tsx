import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    FlatList,
    Dimensions,
    Platform,
    ActivityIndicator,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setNotifications, addNotification, markRead, markAllRead, removeNotification } from '../store';
import { NotificationService, Notification } from '../services/NotificationService';

const { width, height } = Dimensions.get('window');

const NotificationBell = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const { notifications, unreadCount } = useSelector((state: RootState) => state.notification);
    const { user } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        console.log('NotificationBell mounted for user:', user?.id);
        if (user && user.id) {
            loadNotifications();

            // Connect to WebSocket
            console.log('Attempting to connect to WebSocket for user:', user.id);
            NotificationService.connect(user.id);

            const handleNewNotification = (notification: Notification) => {
                dispatch(addNotification(notification));

                // Show foreground alert
                Alert.alert(
                    notification.title,
                    notification.message,
                    [{ text: 'View', onPress: () => setIsVisible(true) }, { text: 'Dismiss', style: 'cancel' }]
                );
            };

            NotificationService.addListener(handleNewNotification);

            return () => {
                NotificationService.removeListener(handleNewNotification);
                NotificationService.disconnect();
            };
        }
    }, [user]);

    const loadNotifications = async () => {
        try {
            setLoading(true);
            const data = await NotificationService.getMyNotifications();
            dispatch(setNotifications(data));
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkRead = async (id: string) => {
        try {
            await NotificationService.markAsRead(id);
            dispatch(markRead(id));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await NotificationService.deleteNotification(id);
            dispatch(removeNotification(id));
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await NotificationService.markAllAsRead();
            dispatch(markAllRead());
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const renderNotificationItem = ({ item }: { item: Notification }) => (
        <TouchableOpacity
            style={[styles.notificationItem, !item.isRead && styles.unreadItem]}
            onPress={() => handleMarkRead(item.id)}
        >
            <View style={styles.notificationHeader}>
                <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.type) }]} />
                <Text style={styles.notificationTitle}>{item.title}</Text>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                    <Ionicons name="close-circle-outline" size={20} color="#999" />
                </TouchableOpacity>
            </View>
            <Text style={styles.notificationMessage}>{item.message}</Text>
            <Text style={styles.notificationTime}>{formatTimestamp(item.timestamp)}</Text>
        </TouchableOpacity>
    );

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'CHECK_IN': return '#4CAF50';
            case 'CHECK_OUT': return '#2196F3';
            case 'LEAVE_REQUEST': return '#FF9800';
            case 'LEAVE_APPROVAL': return '#FF9800';
            case 'SALARY_UPDATE': return '#9C27B0';
            case 'GEOFENCE_VIOLATION': return '#F44336';
            default: return '#757575';
        }
    };

    const formatTimestamp = (ts: string) => {
        // Basic formatting, could be improved with date-fns
        return ts.split(' ')[1] || ts;
    };

    return (
        <View>
            <TouchableOpacity
                style={styles.bellButton}
                onPress={() => setIsVisible(true)}
            >
                <Ionicons name="notifications-outline" size={24} color="#333" />
                {unreadCount > 0 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>

            <Modal
                visible={isVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setIsVisible(false)}
                >
                    <View style={styles.dropdownContainer}>
                        <View style={styles.dropdownHeader}>
                            <Text style={styles.headerTitle}>Notifications ({unreadCount})</Text>
                            {unreadCount > 0 && (
                                <TouchableOpacity onPress={handleMarkAllRead}>
                                    <Text style={styles.markAllText}>Mark all read</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {loading && notifications.length === 0 ? (
                            <ActivityIndicator style={{ padding: 20 }} color="#000" />
                        ) : (
                            <FlatList
                                data={notifications}
                                renderItem={renderNotificationItem}
                                keyExtractor={(item) => item.id}
                                ListEmptyComponent={
                                    <View style={styles.emptyContainer}>
                                        <Ionicons name="notifications-off-outline" size={48} color="#ccc" />
                                        <Text style={styles.emptyText}>No notifications yet</Text>
                                    </View>
                                }
                                style={styles.list}
                            />
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    bellButton: {
        padding: 8,
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: '#f44336',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingTop: Platform.OS === 'ios' ? 100 : 60,
        paddingRight: 10,
    },
    dropdownContainer: {
        width: width * 0.85,
        maxHeight: height * 0.6,
        backgroundColor: '#fff',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
        overflow: 'hidden',
    },
    dropdownHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: '#fafafa',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    markAllText: {
        fontSize: 12,
        color: '#2196F3',
        fontWeight: '600',
    },
    list: {
        flexGrow: 0,
    },
    notificationItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    unreadItem: {
        backgroundColor: '#f0f7ff',
    },
    notificationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    typeBadge: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    notificationTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    notificationMessage: {
        fontSize: 13,
        color: '#666',
        marginBottom: 4,
        lineHeight: 18,
    },
    notificationTime: {
        fontSize: 11,
        color: '#999',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 10,
        color: '#999',
        fontSize: 14,
    },
});

export default NotificationBell;
