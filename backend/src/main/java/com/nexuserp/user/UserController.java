package com.nexuserp.user;

import com.nexuserp.common.api.ApiResponse;
import com.nexuserp.user.dto.CreateUserRequest;
import com.nexuserp.user.dto.UserResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping
    public ResponseEntity<ApiResponse<UserResponse>> createUser(
            @Valid @RequestBody CreateUserRequest request
    ) {

        UserResponse user = userService.createUser(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        ApiResponse.success(
                                "User created successfully",
                                user
                        )
                );
    }

    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getUsersByTenant(
            @PathVariable UUID tenantId
    ) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Users retrieved successfully",
                        userService.getUsersByTenant(tenantId)
                )
        );
    }
}