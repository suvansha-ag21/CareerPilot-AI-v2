"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, KeyRound, Save } from "lucide-react";
import { apiRequest, ApiClientError } from "@/lib/api";
import { useAuth } from "@/store/auth-context";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
export default function SettingsPage() {
    const { user, setUserDirect } = useAuth();
    const [preferredWorkMode, setPreferredWorkMode] = useState("REMOTE");
    const [weeklyStudyHours, setWeeklyStudyHours] = useState(10);
    const [openToInternships, setOpenToInternships] = useState(true);
    const [preferredLocationsText, setPreferredLocationsText] = useState("");
    const [saving, setSaving] = useState(false);
    const [statusMsg, setStatusMsg] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    useEffect(() => {
        if (user?.careerPreferences) {
            setPreferredWorkMode(user.careerPreferences.preferredWorkMode || "REMOTE");
            setWeeklyStudyHours(user.careerPreferences.weeklyStudyHours ?? 10);
            setOpenToInternships(user.careerPreferences.openToInternships ?? true);
            setPreferredLocationsText((user.careerPreferences.preferredLocations || []).join(", "));
        }
    }, [user]);
    async function handleSavePreferences(e) {
        e.preventDefault();
        setSaving(true);
        setStatusMsg(null);
        setErrorMsg(null);
        const existing = user?.careerPreferences;
        const prefs = {
            ...(existing ?? {}),
            preferredWorkMode,
            weeklyStudyHours: Number(weeklyStudyHours) || 10,
            openToInternships,
            preferredLocations: preferredLocationsText
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .slice(0, 8),
            careerGoals: existing?.careerGoals ?? [],
            onboardingCompleted: existing?.onboardingCompleted ?? false,
        };
        try {
            const updated = await apiRequest("/profile", {
                method: "PUT",
                body: JSON.stringify({ careerPreferences: prefs }),
            });
            setUserDirect(updated);
            setStatusMsg("Career preferences saved successfully.");
        }
        catch (err) {
            if (err instanceof ApiClientError) {
                setErrorMsg(err.message);
            }
            else {
                setErrorMsg("Failed to update settings.");
            }
        }
        finally {
            setSaving(false);
        }
    }
    return (<div className="max-w-3xl space-y-6">
      <Card>
        <CardHeader title="Career & Roadmap Preferences" subtitle="Used by the personalized Learning Roadmap and Job Application workflows."/>
        <CardContent>
          <form onSubmit={handleSavePreferences} className="space-y-4">
            {statusMsg && (<div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs font-medium text-[#16A34A]">
                <CheckCircle2 className="h-4 w-4 shrink-0"/>
                {statusMsg}
              </div>)}
            {errorMsg && (<div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-[#EF4444]">
                {errorMsg}
              </div>)}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#172033]">
                  Preferred Work Mode
                </label>
                <select value={preferredWorkMode} onChange={(e) => setPreferredWorkMode(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#172033]">
                  <option value="REMOTE">Remote</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="ONSITE">On-Site</option>
                </select>
              </div>

              <Input label="Weekly Prep Hours Target" type="number" min={1} max={80} value={weeklyStudyHours} onChange={(e) => setWeeklyStudyHours(Number(e.target.value))}/>
            </div>

            <Input label="Preferred Cities / Locations (comma separated)" placeholder="Bengaluru, Hyderabad, Remote" value={preferredLocationsText} onChange={(e) => setPreferredLocationsText(e.target.value)}/>

            <label className="flex items-center gap-2.5 text-sm text-[#172033] cursor-pointer pt-1">
              <input type="checkbox" checked={openToInternships} onChange={(e) => setOpenToInternships(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-[#6D5DFB] focus:ring-[#6D5DFB]"/>
              <span>Open to Internship &amp; New-Grad Roles</span>
            </label>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button type="submit" loading={saving}>
                <Save className="h-4 w-4"/>
                Save Preferences
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Account Security" subtitle="JWT access sessions & password recovery controls"/>
        <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-[#172033]">Signed in as {user?.email}</p>
            <p className="text-xs text-[#64748B]">
              Resetting your password automatically invalidates active refresh token families.
            </p>
          </div>
          <Link href="/forgot-password">
            <Button variant="outline" size="sm">
              <KeyRound className="h-3.5 w-3.5 text-[#6D5DFB]"/>
              Reset Password
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>);
}
