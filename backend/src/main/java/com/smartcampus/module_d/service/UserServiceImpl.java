package com.smartcampus.module_d.service;

import com.smartcampus.common.exception.ResourceNotFoundException;
import com.smartcampus.module_d.dto.UserProfileDTO;
import com.smartcampus.module_d.entity.UserProfile;
import com.smartcampus.module_d.repository.UserProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserProfileRepository repository;

    @Override
    public UserProfileDTO getUserProfile(UUID userId) {
        UserProfile user = repository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return map(user);
    }

    @Override
    public List<UserProfileDTO> getAllUsers() {
        return repository.findAll()
                .stream()
                .map(this::map)
                .collect(Collectors.toList());
    }

    @Override
    public UserProfileDTO updateUserRole(UUID userId, String role) {
        UserProfile user = repository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setRole(role.toUpperCase());
        repository.save(user);
        return map(user);
    }

    private UserProfileDTO map(UserProfile user) {
        return UserProfileDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .avatarUrl(user.getAvatarUrl())
                .createdAt(user.getCreatedAt())
                .build();
    }
}