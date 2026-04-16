package com.smartcampus.module_d.service;

import com.smartcampus.module_d.dto.UserProfileDTO;
import java.util.List;
import java.util.UUID;

public interface UserService {
    UserProfileDTO getUserProfile(UUID userId);
    List<UserProfileDTO> getAllUsers();
    UserProfileDTO updateUserRole(UUID userId, String role);
}