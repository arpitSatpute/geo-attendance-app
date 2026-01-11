//package com.geoattendance.config;
//
//import org.slf4j.Logger;
//import org.slf4j.LoggerFactory;
//import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
//import org.springframework.context.annotation.Bean;
//import org.springframework.context.annotation.Configuration;
//import org.springframework.data.redis.core.RedisTemplate;
//import org.springframework.data.redis.core.StringRedisTemplate;
//
///**
// * Provides no-op Redis beans when Redis is intentionally disabled via
// * `app.disable-redis=true`. These beans are safe for application startup
// * because they override `afterPropertiesSet()` so Spring won't require a
// * RedisConnectionFactory.
// */
//@Configuration
//@ConditionalOnProperty(prefix = "app", name = "disable-redis", havingValue = "true")
//public class NoOpRedisConfig {
//
//    private final Logger log = LoggerFactory.getLogger(NoOpRedisConfig.class);
//
//    @Bean
//    public RedisTemplate<Object, Object> redisTemplate() {
//        log.info("Redis disabled (noop) - providing noop RedisTemplate bean");
//        // Return a RedisTemplate that does not require a connection factory
//        return new RedisTemplate<>() {
//            @Override
//            public void afterPropertiesSet() {
//                // no-op: avoid asserting that a connection factory is present
//            }
//        };
//    }
//}
//
//
//        log.info("Redis disabled (noop) - providing noop StringRedisTemplate bean");
//        return new StringRedisTemplate() {
//            @Override
//            public void afterPropertiesSet() {
//                // no-op
//            }
//        };
