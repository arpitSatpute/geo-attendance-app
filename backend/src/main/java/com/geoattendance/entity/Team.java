package com.geoattendance.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "teams")
public class Team {
    @Id
    private String id;
    private String name;
    private String managerId;
    private List<String> employeeIds;
    private String geofenceId; // The geofence associated with this team
}
