import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
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
  const loadPreviousPreferences = async (studentData: {
    id: string;
    class_id: string;
  }) => {
    try {
      // Use server-side edge function to get class settings and previous preferences
      const {
        data,
        error
      } = await supabase.functions.invoke('student-auth', {
        body: {
          action: 'get_class_settings',
          studentId: studentData.id,
          classId: studentData.class_id
        }
      });
      if (error || data?.error) {
        console.error("Error loading class settings:", error || data?.error);
        toast.error("Failed to load class settings. Please log in again.");
        sessionStorage.removeItem("student_data");
        navigate("/student/login");
        return;
      }
      const {
        classSettings: classData,
        previousPreferences: prefData
      } = data;
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

      // Use server-side edge function to submit preferences securely
      const {
        data,
        error
      } = await supabase.functions.invoke('student-auth', {
        body: {
          action: 'submit_preferences',
          studentId: student.id,
          classId: student.class_id,
          preferences: formattedPreferences,
          additionalComments: comments.trim() || null
        }
      });
      if (error || data?.error) {
        throw new Error(data?.error || error?.message || 'Failed to submit preferences');
      }
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
  return <div className="min-h-screen flex flex-col">
      <header className="h-14 border-b flex items-center justify-between px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold hover:opacity-80 transition-opacity">
          <ArrowLeft className="h-5 w-5 text-black" />
          <span className="inline-block">🥔</span>
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">potato groups</span>
          <span className="inline-block">🥔</span>
        </Link>
        <Button variant="ghost" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </header>
      
      <div className="flex-1 p-4 md:p-8 relative overflow-hidden">
        <FloatingBubbles />
        
        <div className="max-w-2xl mx-auto relative z-10">

        <Card className="shadow-[var(--shadow-glow)]">
          <CardHeader>
            <CardTitle className="text-3xl">
              {className || "Loading..."}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-base font-medium text-foreground">Students You'd Like to Sit With</h3>
                {preferences.map((pref, index) => <div key={index} className="space-y-2">
                    <Label htmlFor={`pref-${index}`} className="text-sm font-normal text-muted-foreground">
                      Preference #{index + 1} {index === 0 && "(most preferred)"}
                    </Label>
                    <Input id={`pref-${index}`} type="text" placeholder="Enter student name (optional)" value={pref} onChange={e => updatePreference(index, e.target.value.toUpperCase())} className="uppercase" />
                  </div>)}
              </div>

              {classSettings.allow_gender_preference && <div className="space-y-2 pt-4 border-t">
                  <Label htmlFor="gender" className="text-sm font-normal text-muted-foreground">Gender *</Label>
                  <Select value={genderPreference || "none"} onValueChange={value => setGenderPreference(value === "none" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>}

              {classSettings.allow_avoid_students && <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-base font-medium text-foreground">Students to Avoid (optional)</h3>
                  <p className="text-sm text-muted-foreground">
                    Students you'd prefer not to sit near
                  </p>
                  {avoidStudents.map((avoid, index) => <div key={index} className="space-y-2">
                      <Label htmlFor={`avoid-${index}`} className="text-sm font-normal text-muted-foreground">
                        Avoid #{index + 1}
                      </Label>
                      <Input id={`avoid-${index}`} type="text" placeholder="Enter student name (optional)" value={avoid} onChange={e => updateAvoidStudent(index, e.target.value.toUpperCase())} className="uppercase" />
                    </div>)}
                </div>}

              <div className="space-y-2 pt-4 border-t">
                <h3 className="text-base font-medium text-foreground">Additional Comments (optional)</h3>
                <Textarea id="comments" placeholder="Any other preferences or considerations..." value={comments} onChange={e => setComments(e.target.value)} rows={4} />
              </div>

              <Button type="submit" variant="playful" size="lg" className="w-full" disabled={loading}>
                {loading ? "Submitting..." : "Submit Preferences"}
              </Button>
            </form>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>;
};
export default StudentPreferences;