package com.geoattendance.service;

import com.geoattendance.entity.Geofence;
import com.geoattendance.entity.Notification;
import com.geoattendance.entity.User;
import com.geoattendance.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final JavaMailSender mailSender;
    private final NotificationRepository notificationRepository;
    private static final Set<WebSocketSession> sessions = new CopyOnWriteArraySet<>();
    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public NotificationService(JavaMailSender mailSender, NotificationRepository notificationRepository) {
        this.mailSender = mailSender;
        this.notificationRepository = notificationRepository;
    }

    /**
     * Send check-in notification
     */
    public void sendCheckInNotification(User user, String geofenceName) {
        String message = String.format(
            "User %s checked in at %s at %s",
            user.getFirstName() + " " + user.getLastName(),
            geofenceName,
            LocalDateTime.now().format(formatter)
        );

        createNotification(user.getId(), "CHECK_IN", "New Check-In", message);

        // Send email to manager if exists
        if (user.getManager() != null) {
            sendEmailNotification(
                user.getManager().getEmail(),
                "Team Member Check-In",
                message
            );
        }
    }

    /**
     * Send check-out notification
     */
    public void sendCheckOutNotification(User user) {
        String message = String.format(
            "User %s checked out at %s",
            user.getFirstName() + " " + user.getLastName(),
            LocalDateTime.now().format(formatter)
        );

        createNotification(user.getId(), "CHECK_OUT", "Check-Out Recorded", message);

        // Send email to manager if exists
        if (user.getManager() != null) {
            sendEmailNotification(
                user.getManager().getEmail(),
                "Team Member Check-Out",
                message
            );
        }
    }

    /**
     * Send late arrival notification
     */
    public void sendLateArrivalNotification(User user) {
        String message = String.format(
            "User %s arrived late at %s",
            user.getFirstName() + " " + user.getLastName(),
            LocalDateTime.now().format(formatter)
        );

        createNotification(user.getId(), "LATE_ARRIVAL", "Late Arrival Alert", message);

        // Send email to manager
        if (user.getManager() != null) {
            sendEmailNotification(
                user.getManager().getEmail(),
                "Late Arrival Alert",
                message
            );
        }
    }

    /**
     * Send geofence violation notification
     */
    public void sendGeofenceViolationNotification(User user, Geofence geofence) {
        String message = String.format(
            "User %s left geofence %s unexpectedly at %s",
            user.getFirstName() + " " + user.getLastName(),
            geofence.getName(),
            LocalDateTime.now().format(formatter)
        );

        createNotification(user.getId(), "GEOFENCE_VIOLATION", "Geofence Violation", message);

        // Send email to manager and admin
        if (user.getManager() != null) {
            sendEmailNotification(
                user.getManager().getEmail(),
                "Geofence Violation Alert",
                message
            );
        }
    }

    /**
     * Send leave approval notification
     */
    public void sendLeaveApprovalNotification(User user, boolean approved) {
        String status = approved ? "approved" : "rejected";
        String message = String.format(
            "Your leave request has been %s",
            status
        );

        createNotification(user.getId(), "LEAVE_APPROVAL", "Leave Request " + (approved ? "Approved" : "Rejected"), message);

        sendEmailNotification(
            user.getEmail(),
            "Leave Request " + (approved ? "Approved" : "Rejected"),
            message
        );
    }

    /**
     * Send salary update notification
     */
    public void sendSalaryUpdateNotification(User user, String month, Double amount, boolean approved) {
        String status = approved ? "approved" : "calculated";
        String message = String.format(
            "Salary details for %s have been %s. Net pay: %.2f",
            month, status, amount
        );

        createNotification(user.getId(), "SALARY_UPDATE", "Salary " + (approved ? "Approved" : "Update"), message);

        sendEmailNotification(
            user.getEmail(),
            "Salary " + (approved ? "Approved" : "Update") + " - " + month,
            message
        );
    }

    /**
     * Create and save notification, then broadcast
     */
    public Notification createNotification(String userId, String type, String title, String message) {
        Notification notification = Notification.builder()
                .userId(userId)
                .type(type)
                .title(title)
                .message(message)
                .isRead(false)
                .timestamp(LocalDateTime.now())
                .build();

        Notification saved = notificationRepository.save(notification);
        broadcastNotification(saved);
        return saved;
    }

    /**
     * Broadcast notification via WebSocket
     */
    public void broadcastNotification(Notification notification) {
        String payload = String.format(
            "{\"id\":\"%s\",\"type\":\"%s\",\"title\":\"%s\",\"message\":\"%s\",\"userId\":\"%s\",\"isRead\":%b,\"timestamp\":\"%s\"}",
            notification.getId(),
            notification.getType(),
            notification.getTitle(),
            notification.getMessage(),
            notification.getUserId(),
            notification.isRead(),
            notification.getTimestamp().format(formatter)
        );

        log.info("Broadcasting notification to {} active sessions. Target UserId: {}", sessions.size(), notification.getUserId());
        int notifiedCount = 0;
        for (WebSocketSession session : sessions) {
            try {
                if (session.isOpen()) {
                    session.sendMessage(new org.springframework.web.socket.TextMessage(payload));
                    notifiedCount++;
                } else {
                    log.warn("Session {} is closed, cannot send notification", session.getId());
                }
            } catch (Exception e) {
                log.error("Error sending WebSocket message to session " + session.getId(), e);
            }
        }
        log.info("Finished broadcasting. Delivered to {} sessions", notifiedCount);
    }

    /**
     * Get user notifications
     */
    public List<Notification> getUserNotifications(String userId) {
        return notificationRepository.findByUserIdOrderByTimestampDesc(userId);
    }

    /**
     * Mark notification as read
     */
    public void markAsRead(String notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    /**
     * Mark all as read
     */
    public void markAllAsRead(String userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndIsReadOrderByTimestampDesc(userId, false);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    /**
     * Delete notification
     */
    public void deleteNotification(String notificationId) {
        notificationRepository.deleteById(notificationId);
    }

    /**
     * Send email notification
     */
    public void sendEmailNotification(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            message.setFrom("noreply@geoattendance.com");

            mailSender.send(message);
            log.info("Email sent to {} with subject: {}", to, subject);
        } catch (Exception e) {
            log.error("Error sending email to {}", to, e);
        }
    }

    /**
     * Register WebSocket session
     */
    public void registerSession(WebSocketSession session) {
        sessions.add(session);
        log.info("WebSocket session registered. Total sessions: {}", sessions.size());
    }

    /**
     * Unregister WebSocket session
     */
    public void unregisterSession(WebSocketSession session) {
        sessions.remove(session);
        log.info("WebSocket session unregistered. Total sessions: {}", sessions.size());
    }

    /**
     * Send bulk notification to team
     */
    public void sendBulkNotification(String type, String title, String message, java.util.List<User> users) {
        for (User user : users) {
            createNotification(user.getId(), type, title, message);
        }
    }

    /**
     * Send a single notification to a user by ID
     */
    public void sendNotification(String userId, String type, String title, String message) {
        createNotification(userId, type, title, message);
    }
}

