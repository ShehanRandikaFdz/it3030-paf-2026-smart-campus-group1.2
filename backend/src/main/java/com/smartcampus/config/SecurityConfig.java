package com.smartcampus.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private SupabaseJwtFilter supabaseJwtFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // public endpoints
                        .requestMatchers("/api/v1/auth/**").permitAll()

                        // resources: GET is public, write operations require ADMIN
                        .requestMatchers(HttpMethod.GET, "/api/v1/resources/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/resources").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/v1/resources/**").permitAll()
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/resources/**").permitAll()
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/resources/**").permitAll()

                        // user profile
                        .requestMatchers("/api/v1/users/me").authenticated()

                        // admin-only user management
                        .requestMatchers("/api/v1/users/**").hasRole("ADMIN")

                        // everything else requires authentication
                        .anyRequest().authenticated()
                )
                .addFilterBefore(supabaseJwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}