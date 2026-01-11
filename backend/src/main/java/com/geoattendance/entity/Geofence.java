package com.geoattendance.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexed;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Document(collection = "geofences")
@CompoundIndexes({
    @CompoundIndex(name = "location_active", def = "{'location': '2dsphere', 'isActive': 1}")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Geofence {
    
    @Id
    private String id;
    
    private String name;
    
    private String description;
    
    private String locationName;
    
    private Double latitude;
    
    private Double longitude;
    
    @GeoSpatialIndexed
    private GeoJsonPoint location;
    
    @Builder.Default
    private Integer radiusMeters = 100;
    
    private List<Map<String, Double>> polygonCoordinates;
    
    @Builder.Default
    private GeofenceType geofenceType = GeofenceType.CIRCLE;
    
    @Indexed
    private String createdById;
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
    
    @Indexed
    @Builder.Default
    private Boolean isActive = true;
    
    public enum GeofenceType {
        CIRCLE, POLYGON
    }
}
