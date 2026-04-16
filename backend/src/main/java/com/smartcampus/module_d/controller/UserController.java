package com.smartcampus.module_d.controller;

import com.smartcampus.common.ApiResponse;
import com.smartcampus.module_d.dto.UserProfileDTO;
import com.smartcampus.module_d.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    @Autowired
    private UserService userService;

    // GET CURRENT USER (/me)
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileDTO>> getCurrentUser(Authentication authentication) {

        //get userId from Spring Security context
        String userIdStr = authentication.getName();

        UUID userId = UUID.fromString(userIdStr);

        UserProfileDTO profile = userService.getUserProfile(userId);

        return ResponseEntity.ok(
                ApiResponse.success("User fetched", profile)
        );
    }

    // GET ALL USERS (ADMIN ONLY)
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<UserProfileDTO>>> getAllUsers() {

        return ResponseEntity.ok(
                ApiResponse.success("All users", userService.getAllUsers())
        );
    }

    // UPDATE USER ROLE (ADMIN ONLY)
    @PutMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserProfileDTO>> updateRole(
            @PathVariable UUID id,
            @RequestBody RoleRequest req) {

        return ResponseEntity.ok(
                ApiResponse.success("Role updated",
                        userService.updateUserRole(id, req.getRole()))
        );
    }

    // REQUEST BODY CLASS
    static class RoleRequest {
        private String role;

        public String getRole() {
            return role;
        }

        public void setRole(String role) {
            this.role = role;
        }
    }
}