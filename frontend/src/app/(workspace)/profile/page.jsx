"use client";
import React, { useEffect, useState } from "react";
import { CheckCircle2, FolderGit2, GraduationCap, Briefcase, Plus, Save, Trash2, Wrench, } from "lucide-react";
import { CAREER_ROLE_PRESETS, ProficiencyLevel, SkillCategory, } from "@careerpilot/shared";
import { apiRequest, ApiClientError } from "@/lib/api";
import { projectsApi } from "@/services/advanced.service";
import { useAuth } from "@/store/auth-context";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
export default function ProfilePage() {
    const { user, setUserDirect } = useAuth();
    const [name, setName] = useState("");
    const [profileImage, setProfileImage] = useState("");
    const [headline, setHeadline] = useState("");
    const [targetRole, setTargetRole] = useState(CAREER_ROLE_PRESETS[0]);
    const [yearsExperience, setYearsExperience] = useState(0);
    const [location, setLocation] = useState("");
    const [githubUrl, setGithubUrl] = useState("");
    const [linkedinUrl, setLinkedinUrl] = useState("");
    const [skills, setSkills] = useState([]);
    const [skillName, setSkillName] = useState("");
    const [skillCategory, setSkillCategory] = useState(SkillCategory.CORE_CS);
    const [skillLevel, setSkillLevel] = useState(ProficiencyLevel.INTERMEDIATE);
    const [educations, setEducations] = useState([]);
    const [workExperiences, setWorkExperiences] = useState([]);
    const [projects, setProjects] = useState([]);
    const [githubAnalyses, setGithubAnalyses] = useState([]);
    const [repoUrlInput, setRepoUrlInput] = useState("");
    const [analyzingRepo, setAnalyzingRepo] = useState(false);
    const [saving, setSaving] = useState(false);
    const [statusMsg, setStatusMsg] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    useEffect(() => {
        if (user) {
            setName(user.name || "");
            setProfileImage(user.profileImage || "");
            setHeadline(user.headline || "");
            setTargetRole(user.targetRole || CAREER_ROLE_PRESETS[0]);
            setYearsExperience(user.yearsExperience ?? 0);
            setLocation(user.location || "");
            setGithubUrl(user.githubUrl || "");
            setLinkedinUrl(user.linkedinUrl || "");
            setSkills((user.skills || []).map((s) => ({
                name: s.name,
                category: s.category,
                proficiencyLevel: s.proficiencyLevel,
            })));
            setEducations(user.educations || []);
            setWorkExperiences(user.workExperiences || []);
            setProjects(user.projects || []);
        }
        projectsApi
            .listGitHub()
            .then(setGithubAnalyses)
            .catch(() => { });
    }, [user]);
    async function handleAnalyzeGitHubRepo() {
        if (!repoUrlInput.trim())
            return;
        setErrorMsg(null);
        setStatusMsg(null);
        setAnalyzingRepo(true);
        try {
            const analyzed = await projectsApi.analyzeGitHub(repoUrlInput.trim());
            setGithubAnalyses((prev) => [
                analyzed,
                ...prev.filter((item) => item.id !== analyzed.id),
            ]);
            setRepoUrlInput("");
            setStatusMsg(`Analyzed ${analyzed.owner}/${analyzed.repoName} — ready for Project-Based Mock Interviews.`);
        }
        catch (err) {
            setErrorMsg(err instanceof ApiClientError
                ? err.message
                : "Could not analyze GitHub repository. Make sure it is a public repo URL.");
        }
        finally {
            setAnalyzingRepo(false);
        }
    }
    async function handleDeleteGitHubRepo(id) {
        try {
            await projectsApi.deleteGitHub(id);
            setGithubAnalyses((prev) => prev.filter((item) => item.id !== id));
        }
        catch {
            setErrorMsg("Unable to delete analyzed repository.");
        }
    }
    function addSkill() {
        const clean = skillName.trim();
        if (!clean)
            return;
        if (!skills.some((s) => s.name.toLowerCase() === clean.toLowerCase())) {
            setSkills((prev) => [
                ...prev,
                { name: clean, category: skillCategory, proficiencyLevel: skillLevel },
            ]);
        }
        setSkillName("");
    }
    function addEducation() {
        setEducations((prev) => [
            ...prev,
            {
                institution: "",
                degree: "B.Tech / B.E.",
                fieldOfStudy: "Computer Science",
                startYear: 2022,
                endYear: 2026,
                grade: "",
            },
        ]);
    }
    function addExperience() {
        setWorkExperiences((prev) => [
            ...prev,
            {
                company: "",
                roleTitle: "",
                startDate: "",
                endDate: "",
                isCurrent: false,
                description: "",
                highlights: [],
            },
        ]);
    }
    function addProject() {
        setProjects((prev) => [
            ...prev,
            {
                title: "",
                techStack: [],
                description: "",
                repoUrl: "",
                liveUrl: "",
            },
        ]);
    }
    async function handleSave(e) {
        e.preventDefault();
        setSaving(true);
        setStatusMsg(null);
        setErrorMsg(null);
        try {
            const updated = await apiRequest("/profile", {
                method: "PUT",
                body: JSON.stringify({
                    name,
                    profileImage: profileImage || null,
                    headline: headline || null,
                    targetRole,
                    yearsExperience: Number(yearsExperience) || 0,
                    location: location || null,
                    githubUrl: githubUrl || null,
                    linkedinUrl: linkedinUrl || null,
                    skills,
                    educations: educations.filter((ed) => ed.institution.trim() && ed.degree.trim()),
                    workExperiences: workExperiences.filter((w) => w.company.trim() && w.roleTitle.trim()),
                    projects: projects.filter((p) => p.title.trim() && p.description.trim().length >= 5),
                }),
            });
            setUserDirect(updated);
            setStatusMsg("Candidate profile, verified skills, and portfolio updated successfully.");
        }
        catch (err) {
            if (err instanceof ApiClientError) {
                setErrorMsg(err.message);
            }
            else {
                setErrorMsg("Failed to save profile changes.");
            }
        }
        finally {
            setSaving(false);
        }
    }
    return (<form onSubmit={handleSave} className="max-w-4xl space-y-6">
      {statusMsg && (<div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs font-medium text-[#16A34A]">
          <CheckCircle2 className="h-4 w-4 shrink-0"/>
          {statusMsg}
        </div>)}
      {errorMsg && (<div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-[#EF4444]">
          {errorMsg}
        </div>)}

      {/* Identity & Core Career Track */}
      <Card>
        <CardHeader title="Personal Details & Target Role" subtitle="Core identity, avatar, and placement track." action={<Button type="submit" size="sm" loading={saving}>
              <Save className="h-3.5 w-3.5"/>
              Save All Changes
            </Button>}/>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Full Name" name="name" required value={name} onChange={(e) => setName(e.target.value)}/>
            <Input label="Profile Picture URL (optional)" name="profileImage" placeholder="https://avatars.githubusercontent.com/..." value={profileImage} onChange={(e) => setProfileImage(e.target.value)}/>
          </div>

          <Input label="Headline" name="headline" placeholder="e.g. Final-year CS student specializing in Next.js, Java Spring Boot & ML" value={headline} onChange={(e) => setHeadline(e.target.value)}/>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label htmlFor="targetRole" className="block text-xs font-medium text-[#172033]">
                Target Job Role
              </label>
              <select id="targetRole" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]/20 focus:border-[#6D5DFB]">
                {CAREER_ROLE_PRESETS.map((preset) => (<option key={preset} value={preset}>
                    {preset}
                  </option>))}
              </select>
            </div>
            <Input label="Years of Experience" name="yearsExperience" type="number" min={0} max={40} value={yearsExperience} onChange={(e) => setYearsExperience(Number(e.target.value))}/>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Location" name="location" placeholder="Bengaluru / Remote" value={location} onChange={(e) => setLocation(e.target.value)}/>
            <Input label="GitHub URL" name="githubUrl" placeholder="https://github.com/username" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)}/>
            <Input label="LinkedIn URL" name="linkedinUrl" placeholder="https://linkedin.com/in/username" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)}/>
          </div>
        </CardContent>
      </Card>

      {/* Normalized Technical Skills */}
      <Card>
        <CardHeader title="Technical Skills Inventory" subtitle="Stored relationally in Skill & UserSkill tables for JD Matching & Skill Gap Analysis."/>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <div className="sm:col-span-5">
              <input type="text" placeholder="Skill (e.g. React, SQL, Java, Spring Boot)" value={skillName} onChange={(e) => setSkillName(e.target.value)} onKeyDown={(e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                addSkill();
            }
        }} className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]/20 focus:border-[#6D5DFB]"/>
            </div>
            <div className="sm:col-span-3">
              <select value={skillCategory} onChange={(e) => setSkillCategory(e.target.value)} className="w-full h-10 px-2.5 rounded-lg border border-[#E2E8F0] bg-white text-xs text-[#172033]">
                {Object.values(SkillCategory).map((cat) => (<option key={cat} value={cat}>
                    {cat.replace("_", " ")}
                  </option>))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <select value={skillLevel} onChange={(e) => setSkillLevel(e.target.value)} className="w-full h-10 px-2.5 rounded-lg border border-[#E2E8F0] bg-white text-xs text-[#172033]">
                {Object.values(ProficiencyLevel).map((lvl) => (<option key={lvl} value={lvl}>
                    {lvl}
                  </option>))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Button type="button" variant="secondary" onClick={addSkill} className="w-full">
                <Plus className="h-4 w-4"/>
                Add
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {skills.length > 0 ? (skills.map((s) => (<Badge key={s.name} tone="brand" className="py-1 px-3">
                  <Wrench className="h-3 w-3"/>
                  <span>{s.name}</span>
                  <span className="text-[10px] opacity-75">({s.proficiencyLevel})</span>
                  <button type="button" onClick={() => setSkills((prev) => prev.filter((x) => x.name !== s.name))} className="ml-1 hover:text-[#EF4444]">
                    &times;
                  </button>
                </Badge>))) : (<p className="text-xs text-[#64748B]">No technical skills added yet.</p>)}
          </div>
        </CardContent>
      </Card>

      {/* Education */}
      <Card>
        <CardHeader title="Education" subtitle="Academic degrees, institutions, and graduation years." action={<Button type="button" variant="outline" size="sm" onClick={addEducation}>
              <GraduationCap className="h-3.5 w-3.5 text-[#6D5DFB]"/>
              Add Education
            </Button>}/>
        <CardContent className="space-y-4">
          {educations.length === 0 ? (<p className="text-xs text-[#64748B]">No education entries added yet.</p>) : (educations.map((ed, idx) => (<div key={idx} className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#172033]">Education #{idx + 1}</span>
                  <button type="button" onClick={() => setEducations((prev) => prev.filter((_, i) => i !== idx))} className="text-xs text-[#EF4444] hover:underline flex items-center gap-1">
                    <Trash2 className="h-3.5 w-3.5"/>
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Institution" value={ed.institution} placeholder="University / College Name" onChange={(e) => {
                const next = [...educations];
                next[idx] = { ...next[idx], institution: e.target.value };
                setEducations(next);
            }}/>
                  <Input label="Degree" value={ed.degree} placeholder="B.Tech / B.Sc" onChange={(e) => {
                const next = [...educations];
                next[idx] = { ...next[idx], degree: e.target.value };
                setEducations(next);
            }}/>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input label="Field of Study" value={ed.fieldOfStudy || ""} onChange={(e) => {
                const next = [...educations];
                next[idx] = { ...next[idx], fieldOfStudy: e.target.value };
                setEducations(next);
            }}/>
                  <Input label="Graduation Year" type="number" value={ed.endYear ?? ""} onChange={(e) => {
                const next = [...educations];
                next[idx] = { ...next[idx], endYear: Number(e.target.value) || null };
                setEducations(next);
            }}/>
                  <Input label="CGPA / Grade" value={ed.grade || ""} placeholder="e.g. 8.7/10" onChange={(e) => {
                const next = [...educations];
                next[idx] = { ...next[idx], grade: e.target.value };
                setEducations(next);
            }}/>
                </div>
              </div>)))}
        </CardContent>
      </Card>

      {/* Projects & Experience */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Key Projects" subtitle="Used for Project-Based Mock Interviews." action={<Button type="button" variant="outline" size="sm" onClick={addProject}>
                <FolderGit2 className="h-3.5 w-3.5 text-[#6D5DFB]"/>
                Add Project
              </Button>}/>
          <CardContent className="space-y-4">
            {projects.length === 0 ? (<p className="text-xs text-[#64748B]">No projects listed yet.</p>) : (projects.map((proj, idx) => (<div key={idx} className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#172033]">Project #{idx + 1}</span>
                    <button type="button" onClick={() => setProjects((prev) => prev.filter((_, i) => i !== idx))} className="text-xs text-[#EF4444]">
                      Remove
                    </button>
                  </div>
                  <Input label="Project Title" value={proj.title} placeholder="Distributed Task Queue" onChange={(e) => {
                const next = [...projects];
                next[idx] = { ...next[idx], title: e.target.value };
                setProjects(next);
            }}/>
                  <Input label="Tech Stack (comma separated)" value={(proj.techStack || []).join(", ")} placeholder="Next.js, FastAPI, PostgreSQL" onChange={(e) => {
                const next = [...projects];
                next[idx] = {
                    ...next[idx],
                    techStack: e.target.value
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean),
                };
                setProjects(next);
            }}/>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-[#172033]">
                      Description &amp; Impact
                    </label>
                    <textarea rows={2} value={proj.description} onChange={(e) => {
                const next = [...projects];
                next[idx] = { ...next[idx], description: e.target.value };
                setProjects(next);
            }} className="w-full p-2.5 rounded-lg border border-[#E2E8F0] bg-white text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]/20 focus:border-[#6D5DFB]"/>
                  </div>
                </div>)))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Internships & Experience" subtitle="Professional or internship roles." action={<Button type="button" variant="outline" size="sm" onClick={addExperience}>
                <Briefcase className="h-3.5 w-3.5 text-[#6D5DFB]"/>
                Add Role
              </Button>}/>
          <CardContent className="space-y-4">
            {workExperiences.length === 0 ? (<p className="text-xs text-[#64748B]">No work experience entries yet.</p>) : (workExperiences.map((exp, idx) => (<div key={idx} className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#172033]">Role #{idx + 1}</span>
                    <button type="button" onClick={() => setWorkExperiences((prev) => prev.filter((_, i) => i !== idx))} className="text-xs text-[#EF4444]">
                      Remove
                    </button>
                  </div>
                  <Input label="Company" value={exp.company} onChange={(e) => {
                const next = [...workExperiences];
                next[idx] = { ...next[idx], company: e.target.value };
                setWorkExperiences(next);
            }}/>
                  <Input label="Role Title" value={exp.roleTitle} placeholder="Software Engineer Intern" onChange={(e) => {
                const next = [...workExperiences];
                next[idx] = { ...next[idx], roleTitle: e.target.value };
                setWorkExperiences(next);
            }}/>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-[#172033]">Summary</label>
                    <textarea rows={2} value={exp.description || ""} onChange={(e) => {
                const next = [...workExperiences];
                next[idx] = { ...next[idx], description: e.target.value };
                setWorkExperiences(next);
            }} className="w-full p-2.5 rounded-lg border border-[#E2E8F0] bg-white text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]/20 focus:border-[#6D5DFB]"/>
                  </div>
                </div>)))}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button type="submit" size="lg" loading={saving}>
          <Save className="h-4 w-4"/>
          Save Candidate Profile
        </Button>
      </div>

      {/* GitHub Repository & Architecture Code Analyzer */}
      <Card>
        <CardHeader icon={<FolderGit2 className="h-4 w-4"/>} title="GitHub Repository Code Analyzer" subtitle="Analyze any public GitHub repo to extract architecture highlights and ground Project-Based Mock Interviews in your actual codebase."/>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input type="url" value={repoUrlInput} onChange={(e) => setRepoUrlInput(e.target.value)} placeholder="https://github.com/username/repository" className="flex-1 h-10 px-3 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]/20 focus:border-[#6D5DFB]"/>
            <Button type="button" variant="secondary" loading={analyzingRepo} onClick={() => void handleAnalyzeGitHubRepo()}>
              <FolderGit2 className="h-4 w-4"/>
              {analyzingRepo ? "Inspecting Repo..." : "Analyze Codebase"}
            </Button>
          </div>

          {githubAnalyses.length > 0 ? (<div className="space-y-3">
              {githubAnalyses.map((repo) => (<div key={repo.id} className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]/70 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <a href={repo.repoUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#172033] hover:text-[#6D5DFB]">
                          {repo.owner}/{repo.repoName}
                        </a>
                        {repo.primaryLanguage && <Badge tone="brand">{repo.primaryLanguage}</Badge>}
                        <Badge tone="neutral">{repo.stars} stars</Badge>
                      </div>
                      <p className="text-xs text-[#64748B] mt-1 leading-relaxed">{repo.summary}</p>
                    </div>
                    <button type="button" onClick={() => void handleDeleteGitHubRepo(repo.id)} className="text-slate-400 hover:text-rose-500 p-1" title="Delete analyzed repo">
                      <Trash2 className="h-4 w-4"/>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {repo.detectedStack.map((tech) => (<Badge key={tech} tone="neutral">
                        {tech}
                      </Badge>))}
                  </div>

                  {repo.interviewHooks.length > 0 && (<div className="pt-2 border-t border-slate-200/70 space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6D5DFB]">
                        Code-Grounded Interview Probes
                      </p>
                      <ul className="space-y-1 text-xs text-[#172033]">
                        {repo.interviewHooks.slice(0, 3).map((hook, i) => (<li key={i}>&bull; {hook}</li>))}
                      </ul>
                    </div>)}
                </div>))}
            </div>) : (<p className="text-xs text-[#64748B]">
              No public repositories analyzed yet. Add one above to unlock codebase-grounded interviews.
            </p>)}
        </CardContent>
      </Card>
    </form>);
}
