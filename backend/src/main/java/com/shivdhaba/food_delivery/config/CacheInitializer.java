package com.shivdhaba.food_delivery.config;

import com.shivdhaba.food_delivery.service.MenuService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.cache.CacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Clears corrupted cache entries on application startup.
 * This handles cases where cache was serialized with old serializer format.
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
public class CacheInitializer {
    
    private final CacheManager cacheManager;
    private final MenuService menuService;
    
    @Bean
    public ApplicationRunner cacheClearRunner() {
        return args -> {
            try {
                log.info("Clearing menu cache on startup to remove any corrupted entries...");
                menuService.clearMenuCache();
                log.info("Menu cache cleared successfully");
            } catch (Exception e) {
                log.warn("Failed to clear menu cache on startup: {}", e.getMessage());
                // Try to clear cache directly
                try {
                    if (cacheManager != null) {
                        var menuCache = cacheManager.getCache("menu");
                        if (menuCache != null) {
                            menuCache.clear();
                            log.info("Menu cache cleared via CacheManager");
                        }
                    }
                } catch (Exception ex) {
                    log.error("Failed to clear cache via CacheManager: {}", ex.getMessage());
                }
            }
        };
    }
}






