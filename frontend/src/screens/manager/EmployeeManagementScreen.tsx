import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ApiService } from '../../services/ApiService';
import { LinearGradient } from 'expo-linear-gradient';

const EmployeeManagementScreen = ({ navigation }: any) => {
    const [employees, setEmployees] = useState<any[]>([]);
    const [filteredEmployees, setFilteredEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        onLeave: 0,
    });

    useEffect(() => {
        loadEmployees();
    }, []);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredEmployees(employees);
        } else {
            const filtered = employees.filter(
                (emp) =>
                    `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    emp.email.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredEmployees(filtered);
        }
    }, [searchQuery, employees]);

    const loadEmployees = async () => {
        setLoading(true);
        try {
            const response = await ApiService.get('/users/employees');
            const data = response.data || [];
            setEmployees(data);
            setFilteredEmployees(data);

            // Basic stats calculation (this could be from a dedicated API eventually)
            setStats({
                total: data.length,
                active: data.filter((e: any) => e.active).length,
                onLeave: 0, // Need leave API for this
            });
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderEmployeeCard = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('EmployeeDetail', { userId: item.id, employeeName: `${item.firstName} ${item.lastName}` })}
        >
            <View style={styles.cardContent}>
                <View style={styles.avatarContainer}>
                    <LinearGradient
                        colors={['#6366f1', '#a855f7']}
                        style={styles.avatar}
                    >
                        <Text style={styles.avatarText}>
                            {item.firstName.charAt(0)}{item.lastName.charAt(0)}
                        </Text>
                    </LinearGradient>
                    {item.active && <View style={styles.activeDot} />}
                </View>

                <View style={styles.infoContainer}>
                    <Text style={styles.nameText}>{item.firstName} {item.lastName}</Text>
                    <Text style={styles.emailText}>{item.email}</Text>
                    <View style={styles.roleTag}>
                        <Text style={styles.roleText}>{item.role || 'Employee'}</Text>
                    </View>
                </View>

                <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Stats Section */}
            <View style={styles.statsContainer}>
                <LinearGradient colors={['#4f46e5', '#7c3aed']} style={styles.statBox}>
                    <Ionicons name="people" size={24} color="#fff" />
                    <Text style={styles.statValue}>{stats.total}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                </LinearGradient>

                <LinearGradient colors={['#10b981', '#059669']} style={styles.statBox}>
                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                    <Text style={styles.statValue}>{stats.active}</Text>
                    <Text style={styles.statLabel}>Active</Text>
                </LinearGradient>

                <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.statBox}>
                    <Ionicons name="calendar" size={24} color="#fff" />
                    <Text style={styles.statValue}>{stats.onLeave}</Text>
                    <Text style={styles.statLabel}>On Leave</Text>
                </LinearGradient>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search employees..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="#94a3b8"
                />
            </View>

            {loading ? (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color="#4f46e5" />
                </View>
            ) : (
                <FlatList
                    data={filteredEmployees}
                    renderItem={renderEmployeeCard}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="people-outline" size={64} color="#cbd5e1" />
                            <Text style={styles.emptyText}>No employees found</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    statsContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    statBox: {
        flex: 1,
        padding: 12,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 4,
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        margin: 16,
        paddingHorizontal: 12,
        borderRadius: 12,
        height: 50,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1e293b',
    },
    listContent: {
        padding: 16,
        paddingTop: 0,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    activeDot: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#10b981',
        borderWidth: 2,
        borderColor: '#fff',
    },
    infoContainer: {
        flex: 1,
        marginLeft: 12,
    },
    nameText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    emailText: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 2,
    },
    roleTag: {
        alignSelf: 'flex-start',
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        marginTop: 6,
    },
    roleText: {
        fontSize: 11,
        color: '#475569',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#94a3b8',
        marginTop: 12,
    },
});

export default EmployeeManagementScreen;
