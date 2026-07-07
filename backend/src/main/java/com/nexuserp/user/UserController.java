package com.nexuserp.user;

import com.nexuserp.common.api.ApiResponse;
import com.nexuserp.security.AuthenticatedUser;
import com.nexuserp.user.dto.CreateUserRequest;
import com.nexuserp.user.dto.UserResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping
    public ResponseEntity<ApiResponse<UserResponse>> createUser(
            @AuthenticationPrincipal
            AuthenticatedUser authenticatedUser,

            @Valid
            @RequestBody
            CreateUserRequest request
    ) {

        UserResponse user =
                userService.createUserForTenant(
                        authenticatedUser.tenantId(),
                        request
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        ApiResponse.success(
                                "User created successfully",
                                user
                        )
                );
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserResponse>>> getUsers(
            @AuthenticationPrincipal
            AuthenticatedUser authenticatedUser
    ) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Users retrieved successfully",
                        userService.getUsersByTenant(
                                authenticatedUser.tenantId()
                        )
                )
        );
    }
}