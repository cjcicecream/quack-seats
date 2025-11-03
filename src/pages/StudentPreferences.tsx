import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import FloatingBubbles from "@/components/FloatingBubbles";
import { ArrowLeft, LogOut } from "lucide-react";

const StudentPreferences = () => {
  const [preferences, setPreferences] = useState<string[]>([]);
  const [comments, setComments] = useState("");
  const [maxPreferences, setMaxPreferences] = useState(3);
  const [className, setClassName] = useState("");
  const [loading, setLoading] = useState(true);
  const [classSettings, setClassSettings] = useState({
    allow_gender_preference: false,
    allow_seating_position: false,
    allow_avoid_students: false
  });
  const [genderPreference, setGenderPreference] = useState("");
  const [seatingPosition, setSeatingPosition] = useState("");
  const [avoidStudents, setAvoidStudents] = useState<string[]>([]);
  const navigate = useNavigate();

  const checkStudent = async () => {
    const studentData = sessionStorage.getItem("student_data");
    
    if (!studentData) {
      toast.error("Please join a class first");
      navigate("/student/login");
      return null;
    }
    
    return JSON.parse(studentData);
  };

  const loadPreviousPreferences = async (studentData: { id: string; class_id: string }) => {
    try {
      // Get class settings and data
      const { data: classData } = await supabase
        .from("classes")
        .select("max_preferences, name, allow_gender_preference, allow_seating_position, allow_avoid_students")
        .eq("id", studentData.class_id)
        .single();

      if (classData) {
        setMaxPreferences(classData.max_preferences);
        setClassName(classData.name);
        setClassSettings({
          allow_gender_preference: classData.allow_gender_preference || false,
          allow_seating_position: classData.allow_seating_position || false,
          allow_avoid_students: classData.allow_avoid_students || false
        });
        setPreferences(Array(classData.max_preferences).fill(""));
        
        // Initialize avoid students array if enabled
        if (classData.allow_avoid_students) {
          setAvoidStudents(Array(Math.min(2, classData.max_preferences)).fill(""));
        }
      }

      // Get previous preferences if any
      const { data: prefData } = await supabase
        .from("student_preferences")
        .select("preferences, additional_comments")
        .eq("student_id", studentData.id)
        .eq("class_id", studentData.class_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (prefData) {
        const prefs = prefData.preferences as any;
        
        // Load seating preferences
        if (prefs.students) {
          const sortedPrefs = prefs.students.sort((a: any, b: any) => a.rank - b.rank);
          const names = sortedPrefs.map((p: any) => p.name);
          setPreferences([...names, ...Array(Math.max(0, (classData?.max_preferences || 3) - names.length)).fill("")]);
        }
        
        // Load other preferences
        if (prefs.gender) setGenderPreference(prefs.gender);
        if (prefs.seating_position) setSeatingPosition(prefs.seating_position);
        if (prefs.avoid_students) {
          setAvoidStudents([...prefs.avoid_students, ...Array(Math.max(0, 2 - prefs.avoid_students.length)).fill("")]);
        }
        
        setComments(prefData.additional_comments || "");
      }
    } catch (error: any) {
      console.error("Error loading preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const studentData = await checkStudent();
      if (studentData) {
        await loadPreviousPreferences(studentData);
      }
    };
    init();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const studentData = sessionStorage.getItem("student_data");
      
      if (!studentData) {
        toast.error("Please join a class first");
        navigate("/student/login");
        return;
      }

      const student = JSON.parse(studentData);

      // Validate no duplicate names in seating preferences
      const filledPreferences = preferences.filter(pref => pref.trim() !== "");
      const uniquePrefs = new Set(filledPreferences.map(p => p.toLowerCase().trim()));
      if (filledPreferences.length !== uniquePrefs.size) {
        toast.error("Please remove duplicate student names from your preferences");
        setLoading(false);
        return;
      }

      // Validate avoid students don't duplicate seating preferences
      if (classSettings.allow_avoid_students) {
        const filledAvoid = avoidStudents.filter(a => a.trim() !== "");
        for (const avoidName of filledAvoid) {
          if (filledPreferences.some(p => p.toLowerCase().trim() === avoidName.toLowerCase().trim())) {
            toast.error("You can't have the same student in both 'sit with' and 'avoid' lists");
            setLoading(false);
            return;
          }
        }
      }

      // Validate gender is provided if enabled
      if (classSettings.allow_gender_preference && !genderPreference) {
        toast.error("Please select your gender");
        setLoading(false);
        return;
      }

      const formattedPreferences: any = {
        students: filledPreferences.map((name, index) => ({
          name: name.trim(),
          rank: index + 1
        }))
      };

      // Add required gender field
      if (classSettings.allow_gender_preference && genderPreference) {
        formattedPreferences.gender = genderPreference;
      }
      
      if (classSettings.allow_seating_position && seatingPosition) {
        formattedPreferences.seating_position = seatingPosition;
      }
      
      if (classSettings.allow_avoid_students) {
        formattedPreferences.avoid_students = avoidStudents.filter(s => s.trim() !== "");
      }

      const { error } = await supabase
        .from("student_preferences")
        .insert({
          student_id: student.id,
          class_id: student.class_id,
          preferences: formattedPreferences,
          additional_comments: comments.trim() || null,
          status: 'pending'
        });

      if (error) throw error;

      toast.success("Preferences submitted successfully! You can update them anytime before the teacher creates the final chart.");
      navigate("/student/success");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit preferences");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("student_data");
    toast.success("Logged out successfully");
    navigate("/student/login");
  };

  const updatePreference = (index: number, value: string) => {
    const newPrefs = [...preferences];
    newPrefs[index] = value;
    setPreferences(newPrefs);
  };

  const updateAvoidStudent = (index: number, value: string) => {
    const newAvoid = [...avoidStudents];
    newAvoid[index] = value;
    setAvoidStudents(newAvoid);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-14 border-b flex items-center justify-between px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <button 
          onClick={() => navigate("/")}
          className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent hover:opacity-80 transition-opacity"
        >
          🥔potato groups🥔
        </button>
      </header>
      
      <div className="flex-1 p-4 md:p-8 relative overflow-hidden">
        <FloatingBubbles />
        
        <div className="max-w-2xl mx-auto relative z-10">
          <div className="flex justify-between items-center mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/student/login")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              variant="ghost"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>

        <Card className="shadow-[var(--shadow-glow)]">
          <CardHeader>
            <CardTitle className="text-3xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              🥔potato groups🥔
            </CardTitle>
            {className && (
              <div className="text-xl font-semibold text-foreground mt-2">
                Class: {className}
              </div>
            )}
            <CardDescription className="text-lg">
              Who would you like to sit with? (Rank your preferences)
              {preferences.some(p => p.trim() !== "") && (
                <span className="block mt-2 text-sm text-primary">
                  ✓ Your previous preferences have been loaded. You can update them anytime!
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Students You'd Like to Sit With</h3>
                {preferences.map((pref, index) => (
                  <div key={index} className="space-y-2">
                    <Label htmlFor={`pref-${index}`}>
                      Preference #{index + 1} {index === 0 && "(Most preferred)"}
                    </Label>
                    <Input
                      id={`pref-${index}`}
                      type="text"
                      placeholder="Enter student name (optional)"
                      value={pref}
                      onChange={(e) => updatePreference(index, e.target.value)}
                    />
                  </div>
                ))}
              </div>

              {classSettings.allow_gender_preference && (
                <div className="space-y-2 pt-4 border-t">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select value={genderPreference || "none"} onValueChange={(value) => setGenderPreference(value === "none" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {classSettings.allow_seating_position && (
                <div className="space-y-2 pt-4 border-t">
                  <Label htmlFor="position">Seating Position Preference (Optional)</Label>
                  <Select value={seatingPosition || "none"} onValueChange={(value) => setSeatingPosition(value === "none" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="No preference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No preference</SelectItem>
                      <SelectItem value="front">Front of classroom</SelectItem>
                      <SelectItem value="middle">Middle of classroom</SelectItem>
                      <SelectItem value="back">Back of classroom</SelectItem>
                      <SelectItem value="window">Near window</SelectItem>
                      <SelectItem value="door">Near door</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {classSettings.allow_avoid_students && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold text-lg">Students to Avoid (Optional)</h3>
                  <p className="text-sm text-muted-foreground">
                    Students you'd prefer NOT to sit near
                  </p>
                  {avoidStudents.map((avoid, index) => (
                    <div key={index} className="space-y-2">
                      <Label htmlFor={`avoid-${index}`}>
                        Avoid #{index + 1}
                      </Label>
                      <Input
                        id={`avoid-${index}`}
                        type="text"
                        placeholder="Enter student name (optional)"
                        value={avoid}
                        onChange={(e) => updateAvoidStudent(index, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="comments">Additional Comments (Optional)</Label>
                <Textarea
                  id="comments"
                  placeholder="Any other preferences or considerations..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={4}
                />
              </div>

              <Button
                type="submit"
                variant="playful"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit Preferences"}
              </Button>
            </form>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentPreferences;
