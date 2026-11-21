export var UserRole;
(function (UserRole) {
    UserRole["USER"] = "USER";
    UserRole["ADMIN"] = "ADMIN";
})(UserRole || (UserRole = {}));
export var SkillCategory;
(function (SkillCategory) {
    SkillCategory["CORE_CS"] = "CORE_CS";
    SkillCategory["FRONTEND"] = "FRONTEND";
    SkillCategory["BACKEND"] = "BACKEND";
    SkillCategory["DATABASE"] = "DATABASE";
    SkillCategory["AI_ML"] = "AI_ML";
    SkillCategory["DEVOPS"] = "DEVOPS";
    SkillCategory["SOFT_SKILL"] = "SOFT_SKILL";
})(SkillCategory || (SkillCategory = {}));
export var ProficiencyLevel;
(function (ProficiencyLevel) {
    ProficiencyLevel["BEGINNER"] = "BEGINNER";
    ProficiencyLevel["INTERMEDIATE"] = "INTERMEDIATE";
    ProficiencyLevel["ADVANCED"] = "ADVANCED";
})(ProficiencyLevel || (ProficiencyLevel = {}));
export var SkillSource;
(function (SkillSource) {
    SkillSource["PROFILE"] = "PROFILE";
    SkillSource["RESUME_PARSED"] = "RESUME_PARSED";
    SkillSource["INTERVIEW_EVAL"] = "INTERVIEW_EVAL";
})(SkillSource || (SkillSource = {}));
export var ResumeFileType;
(function (ResumeFileType) {
    ResumeFileType["PDF"] = "PDF";
    ResumeFileType["DOCX"] = "DOCX";
})(ResumeFileType || (ResumeFileType = {}));
export var ResumeAnalysisType;
(function (ResumeAnalysisType) {
    ResumeAnalysisType["COMPLETE_ANALYSIS"] = "COMPLETE_ANALYSIS";
    ResumeAnalysisType["ATS_COMPATIBILITY"] = "ATS_COMPATIBILITY";
    ResumeAnalysisType["TECHNICAL_SKILLS"] = "TECHNICAL_SKILLS";
    ResumeAnalysisType["PROJECT_EVALUATION"] = "PROJECT_EVALUATION";
})(ResumeAnalysisType || (ResumeAnalysisType = {}));
export var JobType;
(function (JobType) {
    JobType["INTERNSHIP"] = "INTERNSHIP";
    JobType["FULL_TIME"] = "FULL_TIME";
    JobType["PART_TIME"] = "PART_TIME";
    JobType["REMOTE"] = "REMOTE";
    JobType["ON_SITE"] = "ON_SITE";
    JobType["HYBRID"] = "HYBRID";
})(JobType || (JobType = {}));
export var SkillGapLearningPreference;
(function (SkillGapLearningPreference) {
    SkillGapLearningPreference["BEGINNER_TO_ADVANCED"] = "BEGINNER_TO_ADVANCED";
    SkillGapLearningPreference["INTERMEDIATE_TO_ADVANCED"] = "INTERMEDIATE_TO_ADVANCED";
    SkillGapLearningPreference["INTERVIEW_PREPARATION"] = "INTERVIEW_PREPARATION";
    SkillGapLearningPreference["PROJECT_BASED_LEARNING"] = "PROJECT_BASED_LEARNING";
})(SkillGapLearningPreference || (SkillGapLearningPreference = {}));
export var RoadmapLearningPreference;
(function (RoadmapLearningPreference) {
    RoadmapLearningPreference["MIXED_LEARNING"] = "MIXED_LEARNING";
    RoadmapLearningPreference["VIDEO_BASED"] = "VIDEO_BASED";
    RoadmapLearningPreference["DOCUMENTATION"] = "DOCUMENTATION";
    RoadmapLearningPreference["HANDS_ON_PROJECTS"] = "HANDS_ON_PROJECTS";
})(RoadmapLearningPreference || (RoadmapLearningPreference = {}));
export var InterviewCategory;
(function (InterviewCategory) {
    InterviewCategory["TECHNICAL"] = "TECHNICAL";
    InterviewCategory["HR"] = "HR";
    InterviewCategory["DSA"] = "DSA";
    InterviewCategory["JAVA"] = "JAVA";
    InterviewCategory["PYTHON"] = "PYTHON";
    InterviewCategory["SQL"] = "SQL";
    InterviewCategory["FULL_STACK"] = "FULL_STACK";
    InterviewCategory["PROJECT_BASED"] = "PROJECT_BASED";
    InterviewCategory["BEHAVIORAL"] = "BEHAVIORAL";
    InterviewCategory["MIXED"] = "MIXED";
})(InterviewCategory || (InterviewCategory = {}));
export var InterviewDifficulty;
(function (InterviewDifficulty) {
    InterviewDifficulty["EASY"] = "EASY";
    InterviewDifficulty["MEDIUM"] = "MEDIUM";
    InterviewDifficulty["HARD"] = "HARD";
})(InterviewDifficulty || (InterviewDifficulty = {}));
export var InterviewMode;
(function (InterviewMode) {
    InterviewMode["TEXT"] = "TEXT";
    InterviewMode["VOICE"] = "VOICE";
})(InterviewMode || (InterviewMode = {}));
export var InterviewStatus;
(function (InterviewStatus) {
    InterviewStatus["IN_PROGRESS"] = "IN_PROGRESS";
    InterviewStatus["COMPLETED"] = "COMPLETED";
    InterviewStatus["ABANDONED"] = "ABANDONED";
})(InterviewStatus || (InterviewStatus = {}));
export var TaskPriority;
(function (TaskPriority) {
    TaskPriority["HIGH"] = "HIGH";
    TaskPriority["MEDIUM"] = "MEDIUM";
    TaskPriority["LOW"] = "LOW";
})(TaskPriority || (TaskPriority = {}));
export var TaskStatus;
(function (TaskStatus) {
    TaskStatus["PENDING"] = "PENDING";
    TaskStatus["IN_PROGRESS"] = "IN_PROGRESS";
    TaskStatus["COMPLETED"] = "COMPLETED";
})(TaskStatus || (TaskStatus = {}));
export var ApplicationStatus;
(function (ApplicationStatus) {
    ApplicationStatus["APPLIED"] = "APPLIED";
    ApplicationStatus["ASSESSMENT"] = "ASSESSMENT";
    ApplicationStatus["SHORTLISTED"] = "SHORTLISTED";
    ApplicationStatus["INTERVIEW_SCHEDULED"] = "INTERVIEW_SCHEDULED";
    ApplicationStatus["SELECTED"] = "SELECTED";
    ApplicationStatus["REJECTED"] = "REJECTED";
    ApplicationStatus["OFFER_RECEIVED"] = "OFFER_RECEIVED";
})(ApplicationStatus || (ApplicationStatus = {}));
export const DESIGN_TOKENS = {
    primary: "#6D5DFB",
    secondary: "#8B7CFF",
    background: "#F8FAFC",
    sidebar: "#111827",
    card: "#FFFFFF",
    primaryText: "#172033",
    secondaryText: "#64748B",
    border: "#E2E8F0",
    success: "#16A34A",
    warning: "#F59E0B",
    danger: "#EF4444",
};
export const USER_PERSONA_OPTIONS = [
    "College Student",
    "Recent Graduate",
    "Working Professional",
    "Career Switcher",
];
export const EDUCATION_LEVEL_OPTIONS = [
    "Diploma",
    "Undergraduate (B.Tech, BCA, B.Sc, etc.)",
    "Postgraduate (M.Tech, MCA, MBA, etc.)",
    "Other",
];
export const CAREER_ROLE_PRESETS = [
    "Full Stack Developer",
    "Frontend Developer",
    "Backend Developer",
    "AI/ML Engineer",
    "Data Scientist",
    "Data Analyst",
    "Software Engineer (SDE)",
    "DevOps Engineer",
    "Cybersecurity Engineer",
];
export const SKILL_GAP_ROLE_OPTIONS = [
    "Software Engineer (SDE)",
    "Full Stack Developer",
    "AI/ML Engineer",
    "Data Scientist",
    "Backend Developer",
    "Frontend Developer",
];
export const EXPERIENCE_LEVEL_OPTIONS = [
    "Beginner",
    "Fresher",
    "0–1 years",
    "1–3 years",
    "3+ years",
];
export const CAREER_GOAL_OPTIONS = [
    "Get an internship",
    "Prepare for campus placements",
    "Become a Full Stack Developer",
    "Become an AI Engineer",
    "Improve my resume",
    "Prepare for technical interviews",
    "Switch to a new career",
];
export const TECHNICAL_SUBCATEGORY_OPTIONS = [
    "DSA",
    "OOP",
    "DBMS",
    "Operating Systems",
    "Computer Networks",
    "SQL",
    "Java",
    "Python",
    "JavaScript",
    "React",
    "Node.js",
    "System Design",
];
export const ROADMAP_DURATION_DAYS_OPTIONS = [30, 60, 90, 180];
export const ROADMAP_DAILY_HOURS_OPTIONS = [
    { value: 1, label: "1 hour / day" },
    { value: 2, label: "2 hours / day" },
    { value: 3, label: "3 hours / day" },
    { value: 4, label: "4+ hours / day" },
];
