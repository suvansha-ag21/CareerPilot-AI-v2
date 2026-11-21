package com.careerpilot.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;

public class AuthDtos {

    public static class LoginRequest {
        @NotBlank @Email
        private String email;
        @NotBlank
        private String password;

        public LoginRequest() {}
        public LoginRequest(String email, String password) {
            this.email = email;
            this.password = password;
        }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class RegisterRequest {
        @NotBlank
        private String name;
        @NotBlank @Email
        private String email;
        @NotBlank @Size(min = 8)
        private String password;
        private String targetRole;

        public RegisterRequest() {}
        public RegisterRequest(String name, String email, String password, String targetRole) {
            this.name = name;
            this.email = email;
            this.password = password;
            this.targetRole = targetRole;
        }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public String getTargetRole() { return targetRole; }
        public void setTargetRole(String targetRole) { this.targetRole = targetRole; }
    }

    public static class UserDto {
        private String id;
        private String name;
        private String email;
        private String role;
        private String targetRole;
        private int yearsExperience;
        private String profileImage;
        private String headline;
        private String location;
        private String githubUrl;
        private String linkedinUrl;
        private Map<String, Object> careerPreferences;
        private List<Map<String, Object>> skills;
        private List<Map<String, Object>> educations;
        private List<Map<String, Object>> workExperiences;
        private List<Map<String, Object>> projects;

        public UserDto() {}

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public String getTargetRole() { return targetRole; }
        public void setTargetRole(String targetRole) { this.targetRole = targetRole; }
        public int getYearsExperience() { return yearsExperience; }
        public void setYearsExperience(int yearsExperience) { this.yearsExperience = yearsExperience; }
        public String getProfileImage() { return profileImage; }
        public void setProfileImage(String profileImage) { this.profileImage = profileImage; }
        public String getHeadline() { return headline; }
        public void setHeadline(String headline) { this.headline = headline; }
        public String getLocation() { return location; }
        public void setLocation(String location) { this.location = location; }
        public String getGithubUrl() { return githubUrl; }
        public void setGithubUrl(String githubUrl) { this.githubUrl = githubUrl; }
        public String getLinkedinUrl() { return linkedinUrl; }
        public void setLinkedinUrl(String linkedinUrl) { this.linkedinUrl = linkedinUrl; }
        public Map<String, Object> getCareerPreferences() { return careerPreferences; }
        public void setCareerPreferences(Map<String, Object> careerPreferences) { this.careerPreferences = careerPreferences; }
        public List<Map<String, Object>> getSkills() { return skills; }
        public void setSkills(List<Map<String, Object>> skills) { this.skills = skills; }
        public List<Map<String, Object>> getEducations() { return educations; }
        public void setEducations(List<Map<String, Object>> educations) { this.educations = educations; }
        public List<Map<String, Object>> getWorkExperiences() { return workExperiences; }
        public void setWorkExperiences(List<Map<String, Object>> workExperiences) { this.workExperiences = workExperiences; }
        public List<Map<String, Object>> getProjects() { return projects; }
        public void setProjects(List<Map<String, Object>> projects) { this.projects = projects; }
    }

    public static class AuthResponse {
        private UserDto user;
        private String accessToken;

        public AuthResponse() {}
        public AuthResponse(UserDto user, String accessToken) {
            this.user = user;
            this.accessToken = accessToken;
        }

        public UserDto getUser() { return user; }
        public void setUser(UserDto user) { this.user = user; }
        public String getAccessToken() { return accessToken; }
        public void setAccessToken(String accessToken) { this.accessToken = accessToken; }
    }

    public static class OnboardingRequest {
        private String persona;
        private String educationLevel;
        private String targetRole;
        private String experienceLevel;
        private List<String> careerGoals;

        public OnboardingRequest() {}

        public String getPersona() { return persona; }
        public void setPersona(String persona) { this.persona = persona; }
        public String getEducationLevel() { return educationLevel; }
        public void setEducationLevel(String educationLevel) { this.educationLevel = educationLevel; }
        public String getTargetRole() { return targetRole; }
        public void setTargetRole(String targetRole) { this.targetRole = targetRole; }
        public String getExperienceLevel() { return experienceLevel; }
        public void setExperienceLevel(String experienceLevel) { this.experienceLevel = experienceLevel; }
        public List<String> getCareerGoals() { return careerGoals; }
        public void setCareerGoals(List<String> careerGoals) { this.careerGoals = careerGoals; }
    }
}
