package com.geoattendance.config;

import jakarta.mail.MessagingException;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.MailException;
import org.springframework.mail.MailParseException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessagePreparator;

import java.io.InputStream;
import java.util.Arrays;
import java.util.Properties;

/**
 * Provides a no-op JavaMailSender when mail is intentionally disabled via
 * the `app.disable-mail=true` property. This prevents startup failures in
 * services that autowire JavaMailSender while keeping mail calls safe to
 * execute (they'll only be logged).
 */
@Configuration
@ConditionalOnProperty(prefix = "app", name = "disable-mail", havingValue = "true")
public class NoOpMailConfig {

    @Bean
    public JavaMailSender javaMailSender() {
        return new JavaMailSender() {
            private final Logger log = LoggerFactory.getLogger(NoOpMailConfig.class);

            @Override
            public MimeMessage createMimeMessage() {
                return new MimeMessage(Session.getDefaultInstance(new Properties()));
            }

            @Override
            public MimeMessage createMimeMessage(InputStream contentStream) throws MailException {
                try {
                    return new MimeMessage(null, contentStream);
                } catch (MessagingException e) {
                    throw new MailParseException(e);
                }
            }

            @Override
            public void send(MimeMessage mimeMessage) throws MailException {
                log.info("Mail disabled (noop) - send(MimeMessage) called");
            }

            @Override
            public void send(MimeMessage... mimeMessages) throws MailException {
                log.info("Mail disabled (noop) - send({}) MimeMessage(s) called", mimeMessages.length);
            }

            @Override
            public void send(MimeMessagePreparator mimeMessagePreparator) throws MailException {
                try {
                    MimeMessage m = createMimeMessage();
                    mimeMessagePreparator.prepare(m);
                } catch (Exception e) {
                    log.warn("Mail disabled (noop) - preparator threw", e);
                }
            }

            @Override
            public void send(MimeMessagePreparator... mimeMessagePreparators) throws MailException {
                log.info("Mail disabled (noop) - send({}) MimeMessagePreparator(s) called", mimeMessagePreparators.length);
            }

            @Override
            public void send(SimpleMailMessage simpleMessage) throws MailException {
                log.info("Mail disabled (noop) - send(SimpleMailMessage) to={} subject={}",
                        Arrays.toString(simpleMessage.getTo()), simpleMessage.getSubject());
            }

            @Override
            public void send(SimpleMailMessage... simpleMessages) throws MailException {
                log.info("Mail disabled (noop) - send({}) SimpleMailMessage(s) called", simpleMessages.length);
            }
        };
    }
}

