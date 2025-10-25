import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import FloatingBubbles from "@/components/FloatingBubbles";
import { ArrowLeft, LogOut } from "lucide-react";

const StudentPreferences = () => {
  const [preferences, setPreferences] = useState<string[]>([]);
  const [comments, setComments] = useState("");
  const [maxPreferences, setMaxPreferences] = useState(3);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const checkStudent = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast.error("Please log in first");
      navigate("/student/login");
      return null;
    }
    
    // Get student data
    const { data: studentData, error } = await supabase
      .from("students")
      .select("id, class_id, name")
      .eq("auth_user_id", session.user.id)
      .single();
    
    if (error || !studentData) {
      toast.error("Student profile not found");
      navigate("/student/login");
      return null;
    }
    
    return studentData;
  };

  const loadPreviousPreferences = async (studentData: { id: string; class_id: string }) => {
    try {
      // Get max preferences from class
      const { data: classData } = await supabase
        .from("classes")
        .select("max_preferences")
        .eq("id", studentData.class_id)
        .single();

      if (classData) {
        setMaxPreferences(classData.max_preferences);
        setPreferences(Array(classData.max_preferences).fill(""));
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
        const prefs = prefData.preferences as Array<{ name: string; rank: number }>;
        const sortedPrefs = prefs.sort((a, b) => a.rank - b.rank);
        const names = sortedPrefs.map(p => p.name);
        
        setPreferences([...names, ...Array(Math.max(0, (classData?.max_preferences || 3) - names.length)).fill("")]);
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
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please log in first");
        navigate("/student/login");
        return;
      }

      const { data: studentData } = await supabase
        .from("students")
        .select("id, class_id")
        .eq("auth_user_id", session.user.id)
        .single();

      if (!studentData) {
        toast.error("Student profile not found");
        return;
      }

      const formattedPreferences = preferences
        .filter(pref => pref.trim() !== "")
        .map((name, index) => ({
          name: name.trim(),
          rank: index + 1
        }));

      const { error } = await supabase
        .from("student_preferences")
        .insert({
          student_id: studentData.id,
          class_id: studentData.class_id,
          preferences: formattedPreferences,
          additional_comments: comments.trim() || null,
          status: 'pending'
        });

      if (error) throw error;

      toast.success("Preferences submitted successfully!");
      navigate("/student/success");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit preferences");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/student/login");
  };

  const updatePreference = (index: number, value: string) => {
    const newPrefs = [...preferences];
    newPrefs[index] = value;
    setPreferences(newPrefs);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen p-4 md:p-8 relative overflow-hidden">
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
              🐣quack groups🐣
            </CardTitle>
            <CardDescription className="text-lg">
              Who would you like to sit with? (Rank your preferences)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
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

              <div className="space-y-2">
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
  );
};

export default StudentPreferences;
