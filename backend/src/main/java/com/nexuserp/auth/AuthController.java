package com.nexuserp.auth;

import com.nexuserp.auth.dto.LoginRequest;
import com.nexuserp.auth.dto.LoginResponse;
import com.nexuserp.common.api.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request
    ) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Login successful",
                        authService.login(request)
                )
        );
    }
}