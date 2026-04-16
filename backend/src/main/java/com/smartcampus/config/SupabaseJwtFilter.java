package com.smartcampus.config;

import com.smartcampus.module_d.repository.UserProfileRepository;
import com.nimbusds.jwt.JWTClaimsSet;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Component
public class SupabaseJwtFilter extends OncePerRequestFilter {

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        System.out.println("========== JWT FILTER START ==========");

        String header = request.getHeader("Authorization");
        System.out.println("AUTH HEADER: " + header);

        if (header == null || !header.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);

        try {
            JWTClaimsSet claims = JwtValidator.validate(token);

            String userId = claims.getSubject();
            System.out.println("USER ID: " + userId);

            String role = userProfileRepository
                    .findById(UUID.fromString(userId))
                    .map(UserProfile -> UserProfile.getRole())
                    .orElse("USER");

            System.out.println("ROLE FROM DB: " + role);
            System.out.println("GRANTED AUTHORITY: ROLE_" + role);

            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(
                            userId,
                            null,
                            List.of(new SimpleGrantedAuthority("ROLE_" + role))
                    );

            auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(auth);

            System.out.println("AUTH SUCCESS");

        } catch (Exception e) {
            System.out.println("JWT ERROR: " + e.getMessage());
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        System.out.println("========== JWT FILTER END ==========");

        filterChain.doFilter(request, response);
    }
}