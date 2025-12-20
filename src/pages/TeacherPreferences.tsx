import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";


const TeacherPreferences = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [className, setClassName] = useState("");
  const [preferences, setPreferences] = useState({
    prioritize_student_requests: true,
    avoid_large_groups: false,
    balance_personalities: false,
    separate_disruptive: true, // Always enabled automatically
    notes: ""
  });

  useEffect(() => {
    loadPreferences();
  }, [classId]);

  const loadPreferences = async () => {
    try {
      const { data: classData, error: classError } = await supabase
        .from("classes")
        .select("name")
        .eq("id", classId)
        .single();

      if (classError) throw classError;
      setClassName(classData.name);

      // Load existing teacher preferences (stored in additional class metadata or separate table)
      // For now, using localStorage as a simple solution
      const saved = localStorage.getItem(`teacher_prefs_${classId}`);
      if (saved) {
        setPreferences(JSON.parse(saved));
      }
    } catch (error: any) {
      toast.error("Failed to load preferences");
      navigate("/teacher/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    setSaving(true);
    try {
      // Save to localStorage (in production, you'd save to database)
      localStorage.setItem(`teacher_prefs_${classId}`, JSON.stringify(preferences));
      toast.success("Teacher preferences saved!");
    } catch (error: any) {
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">Loading...</div>;
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-[var(--shadow-glow)]">
          <CardHeader>
            <CardTitle>Seating Arrangement Preferences</CardTitle>
            <CardDescription>
              Set your preferences for how the seating chart should be generated
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start justify-between gap-4 py-3 border-b">
              <div className="space-y-0.5 flex-1 min-w-0">
                <Label htmlFor="prioritize">Prioritize Student Requests</Label>
                <p className="text-sm text-muted-foreground">
                  Try to honor student seating preferences when possible
                </p>
              </div>
              <Switch
                id="prioritize"
                checked={preferences.prioritize_student_requests}
                onCheckedChange={(checked) => 
                  setPreferences({ ...preferences, prioritize_student_requests: checked })
                }
                className="shrink-0"
              />
            </div>

            <div className="flex items-start justify-between gap-4 py-3 border-b">
              <div className="space-y-0.5 flex-1 min-w-0">
                <Label htmlFor="avoidGroups">Avoid Large Friend Groups</Label>
                <p className="text-sm text-muted-foreground">
                  Prevent too many friends from sitting together at one table
                </p>
              </div>
              <Switch
                id="avoidGroups"
                checked={preferences.avoid_large_groups}
                onCheckedChange={(checked) => 
                  setPreferences({ ...preferences, avoid_large_groups: checked })
                }
                className="shrink-0"
              />
            </div>

            <div className="flex items-start justify-between gap-4 py-3 border-b">
              <div className="space-y-0.5 flex-1 min-w-0">
                <Label htmlFor="balance">Balance Personalities</Label>
                <p className="text-sm text-muted-foreground">
                  Mix different types of students (quiet/outgoing, strong/struggling)
                </p>
              </div>
              <Switch
                id="balance"
                checked={preferences.balance_personalities}
                onCheckedChange={(checked) => 
                  setPreferences({ ...preferences, balance_personalities: checked })
                }
                className="shrink-0"
              />
            </div>


            <div className="space-y-2 pt-4">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any special considerations, specific pairings to avoid, or other notes..."
                value={preferences.notes}
                onChange={(e) => setPreferences({ ...preferences, notes: e.target.value })}
                rows={4}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button onClick={handleSave} disabled={saving} variant="playful" className="flex-1">
                {saving ? "Saving..." : "Save Preferences"}
              </Button>
              <Button onClick={() => navigate("/teacher/dashboard")} variant="outline">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherPreferences;
