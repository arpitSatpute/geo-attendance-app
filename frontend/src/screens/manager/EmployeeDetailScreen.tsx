import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
    Dimensions,
    Alert,
    Modal,
    TextInput,
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { Ionicons } from '@expo/vector-icons';
import { ApiService } from '../../services/ApiService';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const EmployeeDetailScreen = ({ route, navigation }: any) => {
    const { userId, employeeName } = route.params;
    const [loading, setLoading] = useState(true);
    const [employee, setEmployee] = useState<any>(null);
    const [attendanceStats, setAttendanceStats] = useState<any>(null);
    const [salaryHistory, setSalaryHistory] = useState<any[]>([]);
    const [leaveHistory, setLeaveHistory] = useState<any[]>([]);
    const [editing, setEditing] = useState(false);
    const [teams, setTeams] = useState<any[]>([]);
    const [managers, setManagers] = useState<any[]>([]);
    const [editData, setEditData] = useState({
        baseSalary: '',
        teamId: '',
        managerId: '',
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

            const [userRes, statsRes, salaryRes, leavesRes] = await Promise.all([
                ApiService.get(`/users/employee/${userId}`),
                ApiService.get(`/attendance/employee/${userId}/statistics?startDate=${firstDayOfMonth}&endDate=${lastDayOfMonth}`),
                ApiService.get(`/salary/employee/${userId}/history`),
                ApiService.get(`/leaves/employee/${userId}`)
            ]);

            setEmployee(userRes.data);
            setAttendanceStats(statsRes.data);
            setSalaryHistory(salaryRes.data || []);
            setLeaveHistory(leavesRes.data || []);

            // Prefill edit data
            setEditData({
                baseSalary: userRes.data.baseSalary ? String(userRes.data.baseSalary) : '',
                teamId: userRes.data.teamId || '',
                managerId: userRes.data.managerId || '',
            });
        } catch (error) {
            console.error('Error loading employee detail data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadManagementData = async () => {
        try {
            const [teamsRes, managersRes] = await Promise.all([
                ApiService.get('/teams/manager/me'),
                ApiService.get('/users/managers')
            ]);
            setTeams(teamsRes.data || []);
            setManagers(managersRes.data || []);
        } catch (error) {
            console.error('Error loading management data:', error);
        }
    };

    const handleOpenEdit = () => {
        loadManagementData();
        setEditing(true);
    };

    const handleSaveManagement = async () => {
        setSaving(true);
        try {
            const promises = [];

            // Salary update
            if (parseFloat(editData.baseSalary) !== employee.baseSalary) {
                promises.push(ApiService.put(`/users/${userId}/salary`, { baseSalary: parseFloat(editData.baseSalary) }));
            }

            // Team update
            if (editData.teamId !== employee.teamId) {
                promises.push(ApiService.put(`/users/${userId}/team`, { teamId: editData.teamId }));
            }

            // Manager update (Handover)
            if (editData.managerId !== employee.managerId) {
                promises.push(ApiService.put(`/users/${userId}/manager`, { managerId: editData.managerId }));
            }

            if (promises.length > 0) {
                await Promise.all(promises);
                Alert.alert('Success', 'Management details updated successfully');
                loadData(); // Refresh page
            }
            setEditing(false);
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error || 'Failed to update details');
        } finally {
            setSaving(false);
        }
    };

    const StatCard = ({ label, value, icon, colors }: any) => (
        <View style={styles.statCard}>
            <LinearGradient colors={colors} style={styles.statIconContainer}>
                <Ionicons name={icon} size={24} color="#fff" />
            </LinearGradient>
            <View style={styles.statInfo}>
                <Text style={styles.statCardValue}>{value}</Text>
                <Text style={styles.statCardLabel}>{label}</Text>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#4f46e5" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header Profile Section */}
                <LinearGradient colors={['#4f46e5', '#7c3aed']} style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>

                    <View style={styles.profileInfo}>
                        <View style={styles.largeAvatar}>
                            <Text style={styles.largeAvatarText}>
                                {employee?.firstName?.charAt(0)}{employee?.lastName?.charAt(0)}
                            </Text>
                        </View>
                        <Text style={styles.profileName}>{employee?.firstName} {employee?.lastName}</Text>
                        <Text style={styles.profileRole}>{employee?.role}</Text>
                        <View style={styles.statusBadge}>
                            <View style={[styles.statusDot, { backgroundColor: employee?.active ? '#10b981' : '#ef4444' }]} />
                            <Text style={styles.statusText}>{employee?.active ? 'Active User' : 'Inactive'}</Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={styles.content}>
                    {/* Quick Stats Grid */}
                    <Text style={styles.sectionTitle}>Monthly Attendance Overview</Text>
                    <View style={styles.statsGrid}>
                        <StatCard
                            label="Present"
                            value={attendanceStats?.presentDays || 0}
                            icon="checkmark-done"
                            colors={['#10b981', '#059669']}
                        />
                        <StatCard
                            label="Absent"
                            value={attendanceStats?.absentDays || 0}
                            icon="close-circle"
                            colors={['#ef4444', '#dc2626']}
                        />
                        <StatCard
                            label="Late"
                            value={attendanceStats?.lateDays || 0}
                            icon="timer"
                            colors={['#f59e0b', '#d97706']}
                        />
                        <StatCard
                            label="Ratio"
                            value={`${Math.round(attendanceStats?.attendancePercentage || 0)}%`}
                            icon="trending-up"
                            colors={['#3b82f6', '#2563eb']}
                        />
                    </View>

                    {/* Management Control Section - Now Inline */}
                    <Text style={styles.sectionTitle}>Management Settings</Text>
                    <View style={styles.infoCard}>
                        <Text style={styles.inputLabel}>Monthly Base Salary (₹)</Text>
                        <TextInput
                            style={styles.input}
                            value={editData.baseSalary}
                            onChangeText={(text) => setEditData({ ...editData, baseSalary: text })}
                            keyboardType="numeric"
                            placeholder="Enter base salary"
                        />

                        <Text style={styles.inputLabel}>Assign Team</Text>
                        <Dropdown
                            style={styles.dropdown}
                            placeholderStyle={styles.placeholderStyle}
                            selectedTextStyle={styles.selectedTextStyle}
                            inputSearchStyle={styles.inputSearchStyle}
                            iconStyle={styles.iconStyle}
                            data={[
                                { label: 'Unassigned', value: '' },
                                ...teams.map(t => ({ label: t.name, value: t.id }))
                            ]}
                            search
                            maxHeight={300}
                            labelField="label"
                            valueField="value"
                            placeholder="Select Team"
                            searchPlaceholder="Search..."
                            value={editData.teamId}
                            onChange={item => setEditData({ ...editData, teamId: item.value })}
                        />

                        <Text style={styles.inputLabel}>Handover to Manager</Text>
                        <Text style={styles.inputHint}>Warning: Transfers authority to selected manager</Text>
                        <Dropdown
                            style={styles.dropdown}
                            placeholderStyle={styles.placeholderStyle}
                            selectedTextStyle={styles.selectedTextStyle}
                            inputSearchStyle={styles.inputSearchStyle}
                            iconStyle={styles.iconStyle}
                            data={[
                                { label: 'Keep Current (You)', value: employee?.managerId || '' },
                                ...managers.filter(m => m.id !== employee?.managerId).map(m => ({ label: `${m.firstName} ${m.lastName}`, value: m.id }))
                            ]}
                            search
                            maxHeight={300}
                            labelField="label"
                            valueField="value"
                            placeholder="Select Manager"
                            searchPlaceholder="Search..."
                            value={editData.managerId}
                            onChange={item => setEditData({ ...editData, managerId: item.value })}
                        />

                        <TouchableOpacity
                            style={[styles.saveButtonInline, saving && { opacity: 0.5 }]}
                            onPress={handleSaveManagement}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.saveText}>Update Employee Status</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Financial Summary */}
                    <Text style={styles.sectionTitle}>Salary & Financials</Text>
                    <View style={styles.infoCard}>
                        <View>
                            <Text style={styles.infoLabel}>Current Base Salary</Text>
                            <Text style={styles.salaryAmount}>₹{employee?.baseSalary || 0}</Text>
                        </View>

                        <View style={styles.divider} />

                        <Text style={styles.subTitle}>Last Payment History</Text>
                        {salaryHistory.length > 0 ? (
                            salaryHistory.slice(0, 3).map((sal, idx) => (
                                <View key={idx} style={styles.historyRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.historyDate}>
                                            {new Date(sal.year, sal.month - 1).toLocaleString('default', { month: 'short', year: 'numeric' })}
                                        </Text>
                                    </View>
                                    <Text style={[styles.historyStatus, { color: sal.status === 'PAID' ? '#10b981' : '#f59e0b' }]}>{sal.status}</Text>
                                    <Text style={styles.historyAmount}>₹{sal.netSalary}</Text>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.emptySmall}>No payment history found</Text>
                        )}
                    </View>

                    {/* Leave Information */}
                    <Text style={styles.sectionTitle}>Recent Leave Applications</Text>
                    <View style={styles.infoCard}>
                        {leaveHistory.length > 0 ? (
                            leaveHistory.slice(0, 3).map((leave, idx) => (
                                <View key={idx} style={styles.leaveRow}>
                                    <View>
                                        <Text style={styles.leaveType}>{leave.leaveType}</Text>
                                        <Text style={styles.leaveDates}>{new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</Text>
                                    </View>
                                    <View style={[styles.leaveBadge, { backgroundColor: leave.status === 'APPROVED' ? '#dcfce7' : '#fee2e2' }]}>
                                        <Text style={[styles.leaveBadgeText, { color: leave.status === 'APPROVED' ? '#166534' : '#991b1b' }]}>{leave.status}</Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.emptySmall}>No leave applications</Text>
                        )}
                    </View>

                    {/* Personal Details */}
                    <Text style={styles.sectionTitle}>Contact & Profile</Text>
                    <View style={styles.infoCard}>
                        <View style={styles.contactItem}>
                            <Ionicons name="mail-outline" size={20} color="#64748b" />
                            <Text style={styles.contactText}>{employee?.email}</Text>
                        </View>
                        <View style={styles.contactItem}>
                            <Ionicons name="call-outline" size={20} color="#64748b" />
                            <Text style={styles.contactText}>{employee?.phone || 'Not provided'}</Text>
                        </View>
                        <View style={styles.contactItem}>
                            <Ionicons name="business-outline" size={20} color="#64748b" />
                            <Text style={styles.contactText}>{employee?.department || 'General'}</Text>
                        </View>
                    </View>

                    <View style={{ height: 40 }} />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        padding: 24,
        paddingTop: 40,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        alignItems: 'center',
    },
    backButton: {
        position: 'absolute',
        top: 40,
        left: 20,
        padding: 8,
    },
    profileInfo: {
        alignItems: 'center',
        marginTop: 10,
    },
    largeAvatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    largeAvatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    profileName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 12,
    },
    profileRole: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 4,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        marginTop: 12,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    content: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginTop: 24,
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },
    statCard: {
        width: (width - 52) / 2,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    statIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statInfo: {
        marginLeft: 12,
        flex: 1,
    },
    statCardValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    statCardLabel: {
        fontSize: 12,
        color: '#64748b',
    },
    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 14,
        color: '#64748b',
    },
    salaryAmount: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4f46e5',
        marginTop: 4,
    },
    actionBtn: {
        backgroundColor: '#4f46e5',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
    },
    actionBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginVertical: 16,
    },
    subTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 12,
    },
    historyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    historyDate: {
        flex: 1,
        fontSize: 14,
        color: '#475569',
    },
    historyStatus: {
        fontSize: 12,
        fontWeight: '600',
        marginRight: 10,
    },
    historyAmount: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    leaveRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    leaveType: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    leaveDates: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    leaveBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    leaveBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    contactText: {
        marginLeft: 12,
        fontSize: 15,
        color: '#334155',
    },
    emptySmall: {
        fontSize: 12,
        color: '#94a3b8',
        fontStyle: 'italic',
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 8,
        marginTop: 16,
    },
    inputHint: {
        fontSize: 11,
        color: '#ef4444',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: '#1e293b',
    },
    dropdown: {
        height: 50,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    icon: {
        marginRight: 10,
    },
    placeholderStyle: {
        fontSize: 16,
        color: '#94a3b8',
    },
    selectedTextStyle: {
        fontSize: 16,
        color: '#1e293b',
    },
    iconStyle: {
        width: 20,
        height: 20,
    },
    inputSearchStyle: {
        height: 40,
        fontSize: 16,
        borderRadius: 8,
    },
    saveButtonInline: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: '#4f46e5',
        alignItems: 'center',
        marginTop: 20,
    },
    saveText: {
        color: '#fff',
        fontWeight: '600',
    },
    dropdownContainer: {
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginTop: 4,
    },
});

export default EmployeeDetailScreen;
