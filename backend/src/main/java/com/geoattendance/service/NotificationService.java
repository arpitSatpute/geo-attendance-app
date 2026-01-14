package com.geoattendance.service;

import com.geoattendance.entity.Geofence;
import com.geoattendance.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final JavaMailSender mailSender;
    private static final Set<WebSocketSession> sessions = new CopyOnWriteArraySet<>();
    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public NotificationService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Send check-in notification
     */
    public void sendCheckInNotification(User user, Geofence geofence) {
        String message = String.format(
            "User %s checked in at %s at %s",
            user.getFirstName() + " " + user.getLastName(),
            geofence.getName(),
            LocalDateTime.now().format(formatter)
        );

        broadcastNotification("CHECK_IN", message, user.getId());

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

        broadcastNotification("CHECK_OUT", message, user.getId());

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

        broadcastNotification("LATE_ARRIVAL", message, user.getId());

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

        broadcastNotification("GEOFENCE_VIOLATION", message, user.getId());

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

        broadcastNotification("LEAVE_APPROVAL", message, user.getId());

        sendEmailNotification(
            user.getEmail(),
            "Leave Request " + (approved ? "Approved" : "Rejected"),
            message
        );
    }

    /**
     * Broadcast notification via WebSocket
     */
    public void broadcastNotification(String type, String message, String userId) {
        String payload = String.format(
            "{\"type\":\"%s\",\"message\":\"%s\",\"userId\":\"%s\",\"timestamp\":\"%s\"}",
            type, message, userId, LocalDateTime.now().format(formatter)
        );

        for (WebSocketSession session : sessions) {
            try {
                if (session.isOpen()) {
                    session.sendMessage(new org.springframework.web.socket.TextMessage(payload));
                }
            } catch (IOException e) {
                log.error("Error sending WebSocket message", e);
            }
        }
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
    public void sendBulkNotification(String type, String message, java.util.List<User> users) {
        for (User user : users) {
            broadcastNotification(type, message, user.getId());
        }
    }
}
