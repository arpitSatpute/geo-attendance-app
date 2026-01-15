package com.geoattendance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FaceVerificationRequest {
    private String faceImageData; // Base64 encoded image
    private Double confidence;    // Optional confidence score
}
