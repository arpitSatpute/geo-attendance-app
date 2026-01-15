package com.geoattendance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FaceVerificationResponse {
    private boolean success;
    private String message;
    private boolean faceRegistered;
    private boolean verifiedToday;
    private String verificationDate;
    private Double confidence;
}
