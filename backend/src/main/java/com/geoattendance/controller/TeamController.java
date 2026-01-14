
package com.geoattendance.controller;

import com.geoattendance.entity.Team;
import com.geoattendance.service.TeamService;
import lombok.RequiredArgsConstructor;
import com.geoattendance.service.AuthenticationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/teams")
@RequiredArgsConstructor
public class TeamController {
    private final TeamService teamService;
    private final AuthenticationService authenticationService;

    @GetMapping("/manager/{managerId}")
    public ResponseEntity<List<Team>> getTeamsByManager(@PathVariable String managerId) {
        return ResponseEntity.ok(teamService.getTeamsByManager(managerId));
    }

    @GetMapping("/{teamId}/available-geofences")
    public ResponseEntity<List<com.geoattendance.entity.Geofence>> getAvailableGeofencesForTeam(@PathVariable String teamId) {
        // For simplicity, return all geofences (or filter by manager if needed)
        List<com.geoattendance.entity.Geofence> geofences = teamService.getAvailableGeofencesForTeam(teamId);
        return ResponseEntity.ok(geofences);
    }



    @PostMapping("/{teamId}/remove-employee")
    public ResponseEntity<Team> removeEmployeeFromTeam(@PathVariable String teamId, @RequestParam String employeeId) {
        Team team = teamService.removeEmployeeFromTeam(teamId, employeeId);
        return ResponseEntity.ok(team);
    }
    @GetMapping("/{teamId}/employees")
    public ResponseEntity<List<com.geoattendance.entity.User>> getEmployeesOfTeam(@PathVariable String teamId) {
        List<com.geoattendance.entity.User> employees = teamService.getEmployeesOfTeam(teamId);
        return ResponseEntity.ok(employees);
    }

    @GetMapping("/manager/me")
    public ResponseEntity<List<Team>> getTeamsForCurrentManager() {
        String managerId = authenticationService.getCurrentUser().getId();
        return ResponseEntity.ok(teamService.getTeamsByManager(managerId));
    }

    @GetMapping("/{teamId}")
    public ResponseEntity<Team> getTeamById(@PathVariable String teamId) {
        Optional<Team> team = teamService.getTeamById(teamId);
        return team.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/create")
    public ResponseEntity<Team> createTeam(@RequestBody Team teamRequest) {
        // Get managerId from authenticated user
        String managerId = authenticationService.getCurrentUser().getId();
        Team team = teamService.createTeam(teamRequest.getName(), managerId);
        return ResponseEntity.ok(team);
    }

    @PostMapping("/{teamId}/add-employee")
    public ResponseEntity<Team> addEmployeeToTeamByEmail(@PathVariable String teamId, @RequestParam String email) {
        Team team = teamService.addEmployeeToTeamByEmail(teamId, email);
        return ResponseEntity.ok(team);
    }

    @PostMapping("/{teamId}/set-geofence")
    public ResponseEntity<Team> setGeofenceForTeam(@PathVariable String teamId, @RequestParam String geofenceId) {
        Team team = teamService.setGeofenceForTeam(teamId, geofenceId);
        return ResponseEntity.ok(team);
    }
}
