import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, X, Users } from "lucide-react";

interface Student {
  id: string;
  name: string;
}

interface Pairing {
  id: string;
  student1: string;
  student2: string;
}

interface ClassSettingsData {
  name: string;
  max_preferences: number;
  allow_gender_preference: boolean;
  prioritize_teacher_preferences: boolean;
}

const ClassSettings = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [settings, setSettings] = useState<ClassSettingsData>({
    name: "",
    max_preferences: 3,
    allow_gender_preference: false,
    prioritize_teacher_preferences: false,
  });
  const [teacherPrefs, setTeacherPrefs] = useState({
    avoid_large_groups: false,
    max_friends_per_table: 2,
    mix_genders_at_tables: false,
    must_sit_together: [] as Pairing[],
    must_not_sit_together: [] as Pairing[],
  });

  useEffect(() => {
    loadSettings();
  }, [classId]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("classes")
        .select("name, max_preferences, allow_gender_preference, prioritize_teacher_preferences")
        .eq("id", classId)
        .single();

      if (error) throw error;
      if (data) {
        setSettings({
          name: data.name,
          max_preferences: data.max_preferences || 3,
          allow_gender_preference: data.allow_gender_preference || false,
          prioritize_teacher_preferences: (data as any).prioritize_teacher_preferences || false,
        });
        setTeacherPrefs(prev => ({
          ...prev,
          mix_genders_at_tables: data.allow_gender_preference || false,
        }));
      }

      // Load students for this class
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("id, name")
        .eq("class_id", classId)
        .order("name");

      if (studentsError) throw studentsError;
      setStudents(studentsData || []);

      // Load saved teacher preferences from localStorage
      const saved = localStorage.getItem(`teacher_prefs_${classId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setTeacherPrefs(prev => ({
          ...prev,
          avoid_large_groups: parsed.avoid_large_groups || false,
          max_friends_per_table: parsed.max_friends_per_table || 2,
          must_sit_together: parsed.must_sit_together || [],
          must_not_sit_together: parsed.must_not_sit_together || [],
        }));
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
          allow_gender_preference: teacherPrefs.mix_genders_at_tables,
          prioritize_teacher_preferences: settings.prioritize_teacher_preferences,
        } as any)
        .eq("id", classId);

      if (error) throw error;

      // Save teacher preferences to localStorage
      localStorage.setItem(`teacher_prefs_${classId}`, JSON.stringify({
        ...teacherPrefs,
        prioritize_student_requests: !settings.prioritize_teacher_preferences,
      }));

      toast.success("Settings saved successfully!");
    } catch (error: any) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const addPairing = (type: 'must_sit_together' | 'must_not_sit_together') => {
    setTeacherPrefs(prev => ({
      ...prev,
      [type]: [...prev[type], { id: crypto.randomUUID(), student1: '', student2: '' }]
    }));
  };

  const removePairing = (type: 'must_sit_together' | 'must_not_sit_together', id: string) => {
    setTeacherPrefs(prev => ({
      ...prev,
      [type]: prev[type].filter(p => p.id !== id)
    }));
  };

  const updatePairing = (type: 'must_sit_together' | 'must_not_sit_together', id: string, field: 'student1' | 'student2', value: string) => {
    setTeacherPrefs(prev => ({
      ...prev,
      [type]: prev[type].map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">Loading...</div>;
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Class Settings: {settings.name}
        </h1>

        {/* Student Preference Options */}
        <Card className="shadow-[var(--shadow-glow)]">
          <CardHeader>
            <CardTitle>Student Preference Options</CardTitle>
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
                <Label htmlFor="mixGenders">Ask Students for Gender</Label>
                <p className="text-sm text-muted-foreground">
                  Include gender field in student questionnaire to enable mixed gender tables
                </p>
              </div>
              <Switch
                id="mixGenders"
                checked={teacherPrefs.mix_genders_at_tables}
                onCheckedChange={(checked) => setTeacherPrefs({ ...teacherPrefs, mix_genders_at_tables: checked })}
              />
            </div>

            <div className="space-y-3 py-3">
              <Label>Preference Priority</Label>
              <p className="text-sm text-muted-foreground mb-3">
                When generating seating arrangements, which preferences should take priority?
              </p>
              <RadioGroup
                value={settings.prioritize_teacher_preferences ? "teacher" : "student"}
                onValueChange={(value) => setSettings({ ...settings, prioritize_teacher_preferences: value === "teacher" })}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="student" id="student-priority" />
                  <Label htmlFor="student-priority" className="flex-1 cursor-pointer">
                    <span className="font-medium">Prioritize Student Preferences</span>
                    <p className="text-sm text-muted-foreground font-normal">
                      Student choices take precedence when arranging seats
                    </p>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="teacher" id="teacher-priority" />
                  <Label htmlFor="teacher-priority" className="flex-1 cursor-pointer">
                    <span className="font-medium">Prioritize Teacher Preferences</span>
                    <p className="text-sm text-muted-foreground font-normal">
                      Teacher-defined arrangements take precedence
                    </p>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* Seating Algorithm Options */}
        <Card className="shadow-[var(--shadow-glow)]">
          <CardHeader>
            <CardTitle>Seating Algorithm Options</CardTitle>
            <CardDescription>
              Fine-tune how the seating chart algorithm arranges students
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start justify-between gap-4 py-3 border-b">
              <div className="space-y-0.5 flex-1 min-w-0">
                <Label htmlFor="avoidGroups">Avoid Large Friend Groups</Label>
                <p className="text-sm text-muted-foreground">
                  Prevent too many friend groupings from sitting together at one table
                </p>
                {teacherPrefs.avoid_large_groups && (
                  <div className="flex items-center gap-2 mt-2">
                    <Label htmlFor="maxFriends" className="text-sm whitespace-nowrap">Max friends per table:</Label>
                    <Select
                      value={String(teacherPrefs.max_friends_per_table)}
                      onValueChange={(v) => setTeacherPrefs({ ...teacherPrefs, max_friends_per_table: Number(v) })}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <Switch
                id="avoidGroups"
                checked={teacherPrefs.avoid_large_groups}
                onCheckedChange={(checked) => setTeacherPrefs({ ...teacherPrefs, avoid_large_groups: checked })}
                className="shrink-0"
              />
            </div>
          </CardContent>
        </Card>

        {/* Manual Pairings Card */}
        <Card className="shadow-[var(--shadow-glow)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Manual Student Pairings
            </CardTitle>
            <CardDescription>
              Override algorithm decisions by specifying which students must or must not sit together
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Must Sit Together */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium text-green-600 dark:text-green-400">Must Sit Together</Label>
                  <p className="text-sm text-muted-foreground">These students will be placed at the same table</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addPairing('must_sit_together')}
                  disabled={students.length < 2}
                  className="gap-1"
                >
                  <Plus className="w-4 h-4" /> Add Pair
                </Button>
              </div>

              {teacherPrefs.must_sit_together.length === 0 ? (
                <p className="text-sm text-muted-foreground italic py-2">No pairings added yet</p>
              ) : (
                <div className="space-y-3">
                  {teacherPrefs.must_sit_together.map((pairing) => (
                    <div key={pairing.id} className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                      <Select
                        value={pairing.student1}
                        onValueChange={(v) => updatePairing('must_sit_together', pairing.id, 'student1', v)}
                      >
                        <SelectTrigger className="flex-1 bg-background">
                          <SelectValue placeholder="Select student" />
                        </SelectTrigger>
                        <SelectContent>
                          {students.filter(s => s.id !== pairing.student2).map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-muted-foreground font-medium">with</span>
                      <Select
                        value={pairing.student2}
                        onValueChange={(v) => updatePairing('must_sit_together', pairing.id, 'student2', v)}
                      >
                        <SelectTrigger className="flex-1 bg-background">
                          <SelectValue placeholder="Select student" />
                        </SelectTrigger>
                        <SelectContent>
                          {students.filter(s => s.id !== pairing.student1).map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePairing('must_sit_together', pairing.id)}
                        className="shrink-0 text-destructive hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Must not Sit Together */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium text-red-600 dark:text-red-400 flex items-center gap-2">
                    Must not Sit Together
                  </Label>
                  <p className="text-sm text-muted-foreground">These students will be kept at separate tables</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addPairing('must_not_sit_together')}
                  disabled={students.length < 2}
                  className="gap-1"
                >
                  <Plus className="w-4 h-4" /> Add Pair
                </Button>
              </div>

              {teacherPrefs.must_not_sit_together.length === 0 ? (
                <p className="text-sm text-muted-foreground italic py-2">No pairings added yet</p>
              ) : (
                <div className="space-y-3">
                  {teacherPrefs.must_not_sit_together.map((pairing) => (
                    <div key={pairing.id} className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                      <Select
                        value={pairing.student1}
                        onValueChange={(v) => updatePairing('must_not_sit_together', pairing.id, 'student1', v)}
                      >
                        <SelectTrigger className="flex-1 bg-background">
                          <SelectValue placeholder="Select student" />
                        </SelectTrigger>
                        <SelectContent>
                          {students.filter(s => s.id !== pairing.student2).map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-muted-foreground font-medium">apart from</span>
                      <Select
                        value={pairing.student2}
                        onValueChange={(v) => updatePairing('must_not_sit_together', pairing.id, 'student2', v)}
                      >
                        <SelectTrigger className="flex-1 bg-background">
                          <SelectValue placeholder="Select student" />
                        </SelectTrigger>
                        <SelectContent>
                          {students.filter(s => s.id !== pairing.student1).map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePairing('must_not_sit_together', pairing.id)}
                        className="shrink-0 text-destructive hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {students.length < 2 && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Add at least 2 students to this class to create pairings
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button onClick={handleSave} disabled={saving} variant="playful" className="flex-1">
            {saving ? "Saving..." : "Save Settings"}
          </Button>
          <Button onClick={() => navigate("/teacher/dashboard")} variant="outline">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClassSettings;