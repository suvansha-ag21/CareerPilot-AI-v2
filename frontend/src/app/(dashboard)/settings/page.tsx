"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, Plus, X, Save } from "lucide-react";
import { AuthUserDTO, CAREER_ROLE_PRESETS } from "@careerpilot/shared";
import { apiRequest, ApiClientError } from "@/lib/api";
import { useAuth } from "@/store/auth-context";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function SettingsPage() {
  const { user, setUserDirect } = useAuth();

  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [targetRole, setTargetRole] = useState<string>(CAREER_ROLE_PRESETS[0]);
  const [yearsExperience, setYearsExperience] = useState<number>(0);
  const [location, setLocation] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [preferredStack, setPreferredStack] = useState<string[]>([]);
  const [skillDraft, setSkillDraft] = useState("");

  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user?.profile) {
      setFullName(user.profile.fullName || "");
      setHeadline(user.profile.headline || "");
      setTargetRole(user.profile.targetRole || CAREER_ROLE_PRESETS[0]);
      setYearsExperience(user.profile.yearsExperience ?? 0);
      setLocation(user.profile.location || "");
      setGithubUrl(user.profile.githubUrl || "");
      setLinkedinUrl(user.profile.linkedinUrl || "");
      setPreferredStack(user.profile.preferredStack || []);
    }
  }, [user]);

  function addSkill() {
    const clean = skillDraft.trim();
    if (!clean) return;
    if (!preferredStack.includes(clean)) {
      setPreferredStack((prev) => [...prev, clean]);
    }
    setSkillDraft("");
  }

  function removeSkill(skill: string) {
    setPreferredStack((prev) => prev.filter((s) => s !== skill));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);
    setErrorMsg(null);

    try {
      const updated = await apiRequest<AuthUserDTO>("/profile", {
        method: "PATCH",
        body: JSON.stringify({
          fullName,
          headline,
          targetRole,
          yearsExperience: Number(yearsExperience) || 0,
          preferredStack,
          location,
          githubUrl,
          linkedinUrl,
        }),
      });
      setUserDirect(updated);
      setStatusMsg("Profile and career track saved to PostgreSQL.");
    } catch (err) {
      if (err instanceof ApiClientError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Failed to update profile.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Card>
        <CardHeader
          title="Candidate Profile & Target Career Track"
          subtitle="CareerPilot AI tailors interviews, JD matching thresholds, and roadmaps around these preferences."
        />
        <CardContent>
          <form onSubmit={handleSave} className="space-y-5">
            {statusMsg && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {statusMsg}
              </div>
            )}
            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                name="fullName"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <Input
                label="Account Email"
                name="email"
                value={user?.email || ""}
                disabled
                className="bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>

            <Input
              label="Professional Headline"
              name="headline"
              placeholder="e.g. Full Stack Engineer focused on distributed TypeScript & Python systems"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label htmlFor="targetRole" className="block text-xs font-medium text-[#172033]">
                  Target Career Track
                </label>
                <select
                  id="targetRole"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]/20 focus:border-[#6D5DFB]"
                >
                  {CAREER_ROLE_PRESETS.map((preset) => (
                    <option key={preset} value={preset}>
                      {preset}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Years of Experience"
                name="yearsExperience"
                type="number"
                min={0}
                max={40}
                value={yearsExperience}
                onChange={(e) => setYearsExperience(Number(e.target.value))}
              />
            </div>

            {/* Preferred Tech Stack Tags */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-[#172033]">
                Core Technical Stack
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={skillDraft}
                  onChange={(e) => setSkillDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                  placeholder="Add skill (e.g. Next.js, FastAPI, PostgreSQL, PyTorch)"
                  className="flex-1 h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]/20 focus:border-[#6D5DFB]"
                />
                <Button type="button" variant="secondary" onClick={addSkill}>
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {preferredStack.length > 0 ? (
                  preferredStack.map((skill) => (
                    <Badge key={skill} tone="brand" className="pr-1.5">
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="p-0.5 rounded-full hover:bg-[#6D5DFB]/20"
                        aria-label={`Remove ${skill}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">
                    No skills listed yet. Add technologies you want emphasized in interviews.
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Location"
                name="location"
                placeholder="San Francisco / Remote"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <Input
                label="GitHub URL"
                name="githubUrl"
                placeholder="https://github.com/username"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
              />
              <Input
                label="LinkedIn URL"
                name="linkedinUrl"
                placeholder="https://linkedin.com/in/username"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button type="submit" loading={saving}>
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
