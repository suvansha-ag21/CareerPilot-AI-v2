"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, ArrowRight, Check, CheckCircle2, Compass, FileText, GraduationCap, Loader2, Sparkles, Target, UploadCloud, } from "lucide-react";
import { CAREER_GOAL_OPTIONS, CAREER_ROLE_PRESETS, EDUCATION_LEVEL_OPTIONS, EXPERIENCE_LEVEL_OPTIONS, ProficiencyLevel, ResumeAnalysisType, SkillCategory, USER_PERSONA_OPTIONS, } from "@careerpilot/shared";
import { apiRequest, ApiClientError } from "@/lib/api";
import { useAuth } from "@/store/auth-context";
import { resumeApi } from "@/services/resume.service";
import { skillsApi } from "@/services/skills.service";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
const EXP_LEVEL_TO_YEARS = {
    Beginner: 0,
    Fresher: 0,
    "0–1 years": 1,
    "1–3 years": 2,
    "3+ years": 4,
};
const QUICK_STARTER_SKILLS = [
    { name: "Data Structures & Algorithms", category: SkillCategory.CORE_CS },
    { name: "OOP", category: SkillCategory.CORE_CS },
    { name: "JavaScript", category: SkillCategory.FRONTEND },
    { name: "TypeScript", category: SkillCategory.FRONTEND },
    { name: "React", category: SkillCategory.FRONTEND },
    { name: "Node.js", category: SkillCategory.BACKEND },
    { name: "Python", category: SkillCategory.BACKEND },
    { name: "Java", category: SkillCategory.BACKEND },
    { name: "SQL", category: SkillCategory.DATABASE },
    { name: "PostgreSQL", category: SkillCategory.DATABASE },
    { name: "Machine Learning", category: SkillCategory.AI_ML },
    { name: "Docker", category: SkillCategory.DEVOPS },
    { name: "Git", category: SkillCategory.DEVOPS },
];
export default function OnboardingPage() {
    const router = useRouter();
    const { user, setUserDirect, refreshProfile } = useAuth();
    const fileRef = useRef(null);
    const [step, setStep] = useState(1);
    // Step 1: Personal Details & Education
    const [userPersona, setUserPersona] = useState(USER_PERSONA_OPTIONS[0]);
    const [educationLevel, setEducationLevel] = useState(EDUCATION_LEVEL_OPTIONS[1]);
    const [experienceLevel, setExperienceLevel] = useState(EXPERIENCE_LEVEL_OPTIONS[1]);
    const [institution, setInstitution] = useState("");
    const [degreeTitle, setDegreeTitle] = useState("");
    // Step 2: Career Goals & Target Role
    const [selectedRoleOption, setSelectedRoleOption] = useState(CAREER_ROLE_PRESETS[0]);
    const [customRole, setCustomRole] = useState("");
    const [careerGoals, setCareerGoals] = useState([
        "Get an internship",
        "Prepare for campus placements",
    ]);
    // Step 3: Resume Upload & Skill Assessment
    const [selectedSkills, setSelectedSkills] = useState([]);
    const [uploadedResumeName, setUploadedResumeName] = useState(null);
    const [uploadingResume, setUploadingResume] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    useEffect(() => {
        if (!user)
            return;
        const prefs = user.careerPreferences;
        if (prefs?.userPersona)
            setUserPersona(prefs.userPersona);
        if (prefs?.educationLevel)
            setEducationLevel(prefs.educationLevel);
        if (prefs?.experienceLevel)
            setExperienceLevel(prefs.experienceLevel);
        if (prefs?.careerGoals && prefs.careerGoals.length > 0) {
            setCareerGoals(prefs.careerGoals);
        }
        if (user.targetRole) {
            if (CAREER_ROLE_PRESETS.includes(user.targetRole)) {
                setSelectedRoleOption(user.targetRole);
            }
            else {
                setSelectedRoleOption("Other");
                setCustomRole(user.targetRole);
            }
        }
        if (user.educations?.[0]) {
            setInstitution(user.educations[0].institution);
            setDegreeTitle(user.educations[0].degree);
        }
        if (user.skills && user.skills.length > 0) {
            setSelectedSkills(user.skills.map((s) => s.name));
        }
    }, [user]);
    const effectiveTargetRole = selectedRoleOption === "Other"
        ? customRole.trim() || "Software Engineer (SDE)"
        : selectedRoleOption;
    function toggleGoal(goal) {
        setCareerGoals((prev) => prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]);
    }
    function toggleStarterSkill(skillName) {
        setSelectedSkills((prev) => prev.includes(skillName)
            ? prev.filter((s) => s !== skillName)
            : [...prev, skillName]);
    }
    async function handleResumeUpload(file) {
        setErrorMsg(null);
        setUploadingResume(true);
        try {
            const uploaded = await resumeApi.upload(file);
            const analyzed = await resumeApi.analyze(uploaded.id, {
                targetRole: effectiveTargetRole,
                experienceLevel,
                analysisType: ResumeAnalysisType.COMPLETE_ANALYSIS,
            });
            await resumeApi.syncSkills(analyzed.id);
            setUploadedResumeName(`${analyzed.title} (${Math.round(analyzed.estimatedScore)}% score)`);
            setSelectedSkills((prev) => Array.from(new Set([...prev, ...analyzed.skills.slice(0, 12)])));
        }
        catch (err) {
            setErrorMsg(err instanceof ApiClientError ? err.message : "Could not upload and analyze resume.");
        }
        finally {
            setUploadingResume(false);
        }
    }
    async function handleCompleteOnboarding(skipStepThree = false) {
        setErrorMsg(null);
        setSaving(true);
        try {
            const existingPrefs = user?.careerPreferences;
            const updated = await apiRequest("/profile", {
                method: "PUT",
                body: JSON.stringify({
                    targetRole: effectiveTargetRole,
                    yearsExperience: EXP_LEVEL_TO_YEARS[experienceLevel] ?? 0,
                    careerPreferences: {
                        preferredWorkMode: existingPrefs?.preferredWorkMode || "REMOTE",
                        preferredLocations: existingPrefs?.preferredLocations || [],
                        weeklyStudyHours: existingPrefs?.weeklyStudyHours || 10,
                        openToInternships: careerGoals.includes("Get an internship") ||
                            userPersona === "College Student" ||
                            userPersona === "Recent Graduate",
                        userPersona,
                        educationLevel,
                        experienceLevel,
                        careerGoals,
                        onboardingCompleted: true,
                    },
                    ...(institution.trim()
                        ? {
                            educations: [
                                {
                                    institution: institution.trim(),
                                    degree: degreeTitle.trim() || educationLevel,
                                },
                            ],
                        }
                        : {}),
                }),
            });
            if (!skipStepThree && selectedSkills.length > 0) {
                for (const name of selectedSkills.slice(0, 15)) {
                    const found = QUICK_STARTER_SKILLS.find((s) => s.name.toLowerCase() === name.toLowerCase());
                    await skillsApi.upsertSkill({
                        name,
                        category: found?.category || SkillCategory.CORE_CS,
                        proficiencyLevel: experienceLevel === "Beginner"
                            ? ProficiencyLevel.BEGINNER
                            : experienceLevel === "3+ years"
                                ? ProficiencyLevel.ADVANCED
                                : ProficiencyLevel.INTERMEDIATE,
                    });
                }
            }
            setUserDirect(updated);
            await refreshProfile();
            router.replace("/dashboard");
        }
        catch (err) {
            setErrorMsg(err instanceof ApiClientError ? err.message : "Could not save onboarding profile.");
        }
        finally {
            setSaving(false);
        }
    }
    return (<div className="max-w-4xl mx-auto space-y-6">
      {/* Header Stepper */}
      <Card>
        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-white via-white to-[#EEF2FF]/60">
          <div className="space-y-1">
            <Badge tone="brand">
              <Sparkles className="h-3 w-3"/>
              Step {step} of 3
            </Badge>
            <h2 className="text-xl font-semibold text-[#172033] tracking-tight">
              {step === 1 && "Tell us about your background & education"}
              {step === 2 && "Choose your target role & career goals"}
              {step === 3 && "Upload your resume & calibrate starting skills"}
            </h2>
            <p className="text-xs text-[#64748B]">
              We tailor your dashboard, mock interview questions, job matches, and roadmap based on
              these selections.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {[1, 2, 3].map((num) => (<div key={num} className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold border transition-all ${step > num
                ? "bg-emerald-600 text-white border-emerald-600"
                : step === num
                    ? "bg-[#6D5DFB] text-white border-[#6D5DFB] shadow-sm"
                    : "bg-white text-slate-400 border-slate-200"}`}>
                {step > num ? <Check className="h-4 w-4"/> : num}
              </div>))}
          </div>
        </div>
      </Card>

      {errorMsg && (<div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-sm text-[#EF4444]">
          <AlertCircle className="h-4 w-4 shrink-0"/>
          <span>{errorMsg}</span>
        </div>)}

      {/* STEP 1: PERSONAL DETAILS & EDUCATION */}
      {step === 1 && (<Card>
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="space-y-2.5">
              <label className="block text-sm font-semibold text-[#172033]">
                A. What describes you best?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {USER_PERSONA_OPTIONS.map((option) => {
                const active = userPersona === option;
                return (<button key={option} type="button" onClick={() => setUserPersona(option)} className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${active
                        ? "bg-[#EEF2FF] border-[#6D5DFB] ring-1 ring-[#6D5DFB]"
                        : "bg-white border-slate-200 hover:border-slate-300"}`}>
                      <span className="text-xs font-semibold text-[#172033]">{option}</span>
                      {active && <CheckCircle2 className="h-4 w-4 text-[#6D5DFB]"/>}
                    </button>);
            })}
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="block text-sm font-semibold text-[#172033]">
                B. What is your current education level?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {EDUCATION_LEVEL_OPTIONS.map((option) => {
                const active = educationLevel === option;
                return (<button key={option} type="button" onClick={() => setEducationLevel(option)} className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${active
                        ? "bg-[#EEF2FF] border-[#6D5DFB] ring-1 ring-[#6D5DFB]"
                        : "bg-white border-slate-200 hover:border-slate-300"}`}>
                      <span className="text-xs font-semibold text-[#172033] flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-[#6D5DFB] shrink-0"/>
                        {option}
                      </span>
                      {active && <CheckCircle2 className="h-4 w-4 text-[#6D5DFB]"/>}
                    </button>);
            })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="College / University (optional)" value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="e.g. NIT / VIT / Pune University"/>
              <Input label="Degree / Branch (optional)" value={degreeTitle} onChange={(e) => setDegreeTitle(e.target.value)} placeholder="e.g. B.Tech Computer Science"/>
            </div>

            <div className="space-y-2.5">
              <label className="block text-sm font-semibold text-[#172033]">
                D. What is your experience level?
              </label>
              <div className="flex flex-wrap gap-2.5">
                {EXPERIENCE_LEVEL_OPTIONS.map((exp) => {
                const active = experienceLevel === exp;
                return (<button key={exp} type="button" onClick={() => setExperienceLevel(exp)} className={`px-4 py-2 rounded-lg border text-xs font-semibold transition-all ${active
                        ? "bg-[#6D5DFB] text-white border-[#6D5DFB]"
                        : "bg-white text-[#172033] border-slate-200 hover:border-slate-300"}`}>
                      {exp}
                    </button>);
            })}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="button" onClick={() => setStep(2)}>
                Continue to Career Goals
                <ArrowRight className="h-4 w-4"/>
              </Button>
            </div>
          </CardContent>
        </Card>)}

      {/* STEP 2: CAREER GOALS & TARGET ROLE */}
      {step === 2 && (<Card>
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="space-y-2.5">
              <label className="block text-sm font-semibold text-[#172033]">
                C. What is your target career role?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {[...CAREER_ROLE_PRESETS, "Other"].map((roleOpt) => {
                const active = selectedRoleOption === roleOpt;
                return (<button key={roleOpt} type="button" onClick={() => setSelectedRoleOption(roleOpt)} className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${active
                        ? "bg-[#EEF2FF] border-[#6D5DFB] ring-1 ring-[#6D5DFB]"
                        : "bg-white border-slate-200 hover:border-slate-300"}`}>
                      <span className="text-xs font-semibold text-[#172033] flex items-center gap-2">
                        <Target className="h-3.5 w-3.5 text-[#6D5DFB] shrink-0"/>
                        {roleOpt}
                      </span>
                      {active && <CheckCircle2 className="h-4 w-4 text-[#6D5DFB]"/>}
                    </button>);
            })}
              </div>

              {selectedRoleOption === "Other" && (<div className="pt-2 max-w-md">
                  <Input label="Specify your target career role" value={customRole} onChange={(e) => setCustomRole(e.target.value)} placeholder="e.g. Mobile App Developer / Product Engineer"/>
                </div>)}
            </div>

            <div className="space-y-2.5">
              <label className="block text-sm font-semibold text-[#172033]">
                What do you want CareerPilot AI to help you achieve?{" "}
                <span className="text-xs font-normal text-[#64748B]">(Select multiple goals)</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CAREER_GOAL_OPTIONS.map((goal) => {
                const checked = careerGoals.includes(goal);
                return (<label key={goal} className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${checked
                        ? "bg-[#EEF2FF]/80 border-[#6D5DFB]"
                        : "bg-white border-slate-200 hover:border-slate-300"}`}>
                      <input type="checkbox" checked={checked} onChange={() => toggleGoal(goal)} className="h-4 w-4 rounded border-slate-300 text-[#6D5DFB] focus:ring-[#6D5DFB]"/>
                      <span className="text-xs font-medium text-[#172033]">{goal}</span>
                    </label>);
            })}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4"/>
                Back
              </Button>
              <Button type="button" onClick={() => setStep(3)}>
                Continue to Resume &amp; Skills
                <ArrowRight className="h-4 w-4"/>
              </Button>
            </div>
          </CardContent>
        </Card>)}

      {/* STEP 3: RESUME UPLOAD & SKILL ASSESSMENT */}
      {step === 3 && (<Card>
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-[#172033]">
                Upload your Resume (optional — auto-extracts your skills)
              </label>
              <div className="p-5 rounded-xl border-2 border-dashed border-[#E2E8F0] bg-[#F8FAFC]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <input ref={fileRef} type="file" accept=".pdf,.docx" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f)
                    void handleResumeUpload(f);
            }}/>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-[#EEF2FF] text-[#6D5DFB] flex items-center justify-center shrink-0">
                    {uploadingResume ? (<Loader2 className="h-5 w-5 animate-spin"/>) : uploadedResumeName ? (<FileText className="h-5 w-5 text-emerald-600"/>) : (<UploadCloud className="h-5 w-5"/>)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#172033]">
                      {uploadingResume
                ? "Analyzing resume for skills & feedback..."
                : uploadedResumeName
                    ? `Analyzed: ${uploadedResumeName}`
                    : "Upload PDF or DOCX resume (max 10 MB)"}
                    </p>
                    <p className="text-[11px] text-[#64748B]">
                      Tailored for {effectiveTargetRole} ({experienceLevel})
                    </p>
                  </div>
                </div>
                <Button type="button" variant="secondary" size="sm" disabled={uploadingResume} onClick={() => fileRef.current?.click()}>
                  {uploadedResumeName ? "Upload Another" : "Choose File"}
                </Button>
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="block text-sm font-semibold text-[#172033]">
                Quick Skill Assessment — select skills you already know
              </label>
              <div className="flex flex-wrap gap-2">
                {QUICK_STARTER_SKILLS.map((sk) => {
                const selected = selectedSkills.some((x) => x.toLowerCase() === sk.name.toLowerCase());
                return (<button key={sk.name} type="button" onClick={() => toggleStarterSkill(sk.name)} className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all flex items-center gap-1.5 ${selected
                        ? "bg-[#6D5DFB] text-white border-[#6D5DFB]"
                        : "bg-white text-[#172033] border-slate-200 hover:border-[#6D5DFB]/40"}`}>
                      {selected && <Check className="h-3 w-3"/>}
                      {sk.name}
                    </button>);
            })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="h-4 w-4"/>
                Back
              </Button>

              <div className="flex items-center gap-2.5">
                <Button type="button" variant="ghost" disabled={saving} onClick={() => void handleCompleteOnboarding(true)}>
                  Skip for Now
                </Button>
                <Button type="button" variant="primary" loading={saving} onClick={() => void handleCompleteOnboarding(false)}>
                  <Compass className="h-4 w-4"/>
                  Finish &amp; Personalize Workspace
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>)}
    </div>);
}
