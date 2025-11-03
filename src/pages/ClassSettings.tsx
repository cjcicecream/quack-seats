import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface ClassSettings {
  name: string;
  max_preferences: number;
  allow_gender_preference: boolean;
  allow_seating_position: boolean;
  allow_avoid_students: boolean;
}

const ClassSettings = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ClassSettings>({
    name: "",
    max_preferences: 3,
    allow_gender_preference: false,
    allow_seating_position: false,
    allow_avoid_students: false,
  });

  useEffect(() => {
    loadSettings();
  }, [classId]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("classes")
        .select("name, max_preferences, allow_gender_preference, allow_seating_position, allow_avoid_students")
        .eq("id", classId)
        .single();

      if (error) throw error;
      if (data) {
        setSettings({
          name: data.name,
          max_preferences: data.max_preferences || 3,
          allow_gender_preference: data.allow_gender_preference || false,
          allow_seating_position: data.allow_seating_position || false,
          allow_avoid_students: data.allow_avoid_students || false,
        });
      }
    } catch (error: any) {
      toast.error("Failed to load class settings");
      navigate("/teacher/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("classes")
        .update({
          max_preferences: settings.max_preferences,
          allow_gender_preference: settings.allow_gender_preference,
          allow_seating_position: settings.allow_seating_position,
          allow_avoid_students: settings.allow_avoid_students,
        })
        .eq("id", classId);

      if (error) throw error;
      toast.success("Settings saved successfully!");
    } catch (error: any) {
      toast.error("Failed to save settings");
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
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Class Settings: {settings.name}
        </h1>

        <Card className="shadow-[var(--shadow-glow)]">
          <CardHeader>
            <CardTitle>Preference Options</CardTitle>
            <CardDescription>
              Configure what options students have when submitting their seating preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="maxPreferences">Maximum Preferences per Student</Label>
              <Input
                id="maxPreferences"
                type="number"
                min="1"
                max="10"
                value={settings.max_preferences}
                onChange={(e) => setSettings({ ...settings, max_preferences: parseInt(e.target.value) || 3 })}
              />
              <p className="text-sm text-muted-foreground">
                How many students can each student select as their preferred seatmates?
              </p>
            </div>

            <div className="flex items-center justify-between space-x-4 py-3 border-b">
              <div className="space-y-0.5">
                <Label htmlFor="genderPreference">Allow Gender Preferences</Label>
                <p className="text-sm text-muted-foreground">
                  Students can specify if they prefer sitting with a particular gender
                </p>
              </div>
              <Switch
                id="genderPreference"
                checked={settings.allow_gender_preference}
                onCheckedChange={(checked) => setSettings({ ...settings, allow_gender_preference: checked })}
              />
            </div>

            <div className="flex items-center justify-between space-x-4 py-3 border-b">
              <div className="space-y-0.5">
                <Label htmlFor="seatingPosition">Allow Seating Position Preferences</Label>
                <p className="text-sm text-muted-foreground">
                  Students can indicate preferred classroom locations (front, back, near window, etc.)
                </p>
              </div>
              <Switch
                id="seatingPosition"
                checked={settings.allow_seating_position}
                onCheckedChange={(checked) => setSettings({ ...settings, allow_seating_position: checked })}
              />
            </div>

            <div className="flex items-center justify-between space-x-4 py-3">
              <div className="space-y-0.5">
                <Label htmlFor="avoidStudents">Allow "Avoid" Preferences</Label>
                <p className="text-sm text-muted-foreground">
                  Students can specify classmates they prefer NOT to sit near
                </p>
              </div>
              <Switch
                id="avoidStudents"
                checked={settings.allow_avoid_students}
                onCheckedChange={(checked) => setSettings({ ...settings, allow_avoid_students: checked })}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button onClick={handleSave} disabled={saving} variant="playful" className="flex-1">
                {saving ? "Saving..." : "Save Settings"}
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

export default ClassSettings;
