import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, X, Users, UserX } from "lucide-react";

interface Student {
  id: string;
  name: string;
}

interface Pairing {
  id: string;
  student1: string;
  student2: string;
}

const TeacherPreferences = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [className, setClassName] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [preferences, setPreferences] = useState({
    prioritize_student_requests: true,
    avoid_large_groups: false,
    mix_genders_at_tables: false,
    separate_disruptive: true,
    notes: "",
    must_sit_together: [] as Pairing[],
    must_not_sit_together: [] as Pairing[]
  });

  useEffect(() => {
    loadPreferences();
  }, [classId]);

  const loadPreferences = async () => {
    try {
      const { data: classData, error: classError } = await supabase
        .from("classes")
        .select("name, allow_gender_preference")
        .eq("id", classId)
        .single();

      if (classError) throw classError;
      setClassName(classData.name);

      // Load students for this class
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("id, name")
        .eq("class_id", classId)
        .order("name");

      if (studentsError) throw studentsError;
      setStudents(studentsData || []);

      const saved = localStorage.getItem(`teacher_prefs_${classId}`);
      if (saved) {
        setPreferences(prev => ({ ...prev, ...JSON.parse(saved) }));
      }
      
      // Sync mix_genders_at_tables from database value
      setPreferences(prev => ({ 
        ...prev, 
        mix_genders_at_tables: classData.allow_gender_preference || false 
      }));
    } catch (error: any) {
      toast.error("Failed to load preferences");
      navigate("/teacher/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem(`teacher_prefs_${classId}`, JSON.stringify(preferences));
      
      // Sync mix_genders_at_tables to database so student questionnaire shows/hides gender question
      const { error } = await supabase
        .from("classes")
        .update({ allow_gender_preference: preferences.mix_genders_at_tables })
        .eq("id", classId);
      
      if (error) throw error;
      
      toast.success("Teacher preferences saved!");
    } catch (error: any) {
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const addPairing = (type: 'must_sit_together' | 'must_not_sit_together') => {
    setPreferences(prev => ({
      ...prev,
      [type]: [...prev[type], { id: crypto.randomUUID(), student1: '', student2: '' }]
    }));
  };

  const removePairing = (type: 'must_sit_together' | 'must_not_sit_together', id: string) => {
    setPreferences(prev => ({
      ...prev,
      [type]: prev[type].filter(p => p.id !== id)
    }));
  };

  const updatePairing = (
    type: 'must_sit_together' | 'must_not_sit_together',
    id: string,
    field: 'student1' | 'student2',
    value: string
  ) => {
    setPreferences(prev => ({
      ...prev,
      [type]: prev[type].map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
  };

  const getStudentName = (id: string) => students.find(s => s.id === id)?.name || '';

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">Loading...</div>;
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
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
                <Label htmlFor="mixGenders">Mix Genders at Tables</Label>
                <p className="text-sm text-muted-foreground">
                  Try to have both genders represented at each table
                </p>
              </div>
              <Switch
                id="mixGenders"
                checked={preferences.mix_genders_at_tables}
                onCheckedChange={(checked) => 
                  setPreferences({ ...preferences, mix_genders_at_tables: checked })
                }
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

              {preferences.must_sit_together.length === 0 ? (
                <p className="text-sm text-muted-foreground italic py-2">No pairings added yet</p>
              ) : (
                <div className="space-y-3">
                  {preferences.must_sit_together.map((pairing) => (
                    <div key={pairing.id} className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                      <Select
                        value={pairing.student1}
                        onValueChange={(v) => updatePairing('must_sit_together', pairing.id, 'student1', v)}
                      >
                        <SelectTrigger className="flex-1 bg-background">
                          <SelectValue placeholder="Select student" />
                        </SelectTrigger>
                        <SelectContent>
                          {students.filter(s => s.id !== pairing.student2).map(s => (
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
                          {students.filter(s => s.id !== pairing.student1).map(s => (
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

            {/* Must NOT Sit Together */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium text-red-600 dark:text-red-400 flex items-center gap-2">
                    <UserX className="w-4 h-4" />
                    Must NOT Sit Together
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

              {preferences.must_not_sit_together.length === 0 ? (
                <p className="text-sm text-muted-foreground italic py-2">No pairings added yet</p>
              ) : (
                <div className="space-y-3">
                  {preferences.must_not_sit_together.map((pairing) => (
                    <div key={pairing.id} className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                      <Select
                        value={pairing.student1}
                        onValueChange={(v) => updatePairing('must_not_sit_together', pairing.id, 'student1', v)}
                      >
                        <SelectTrigger className="flex-1 bg-background">
                          <SelectValue placeholder="Select student" />
                        </SelectTrigger>
                        <SelectContent>
                          {students.filter(s => s.id !== pairing.student2).map(s => (
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
                          {students.filter(s => s.id !== pairing.student1).map(s => (
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
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
          <Button onClick={() => navigate("/teacher/dashboard")} variant="outline">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TeacherPreferences;
