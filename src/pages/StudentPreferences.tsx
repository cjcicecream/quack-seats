import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import FloatingBubbles from "@/components/FloatingBubbles";
import { ArrowLeft } from "lucide-react";

const StudentPreferences = () => {
  const [preferences, setPreferences] = useState<string[]>([]);
  const [comments, setComments] = useState("");
  const [maxPreferences, setMaxPreferences] = useState(3);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkStudent();
    loadPreviousPreferences();
  }, []);

  const checkStudent = () => {
    const studentId = sessionStorage.getItem("student_id");
    if (!studentId) {
      navigate("/student/login");
    }
  };

  const loadPreviousPreferences = async () => {
    try {
      const classId = sessionStorage.getItem("class_id");
      const studentId = sessionStorage.getItem("student_id");

      if (!classId || !studentId) return;

      // Get class settings
      const { data: classData } = await supabase
        .from("classes")
        .select("max_preferences")
        .eq("id", classId)
        .single();

      if (classData) {
        setMaxPreferences(classData.max_preferences);
        setPreferences(new Array(classData.max_preferences).fill(""));
      }

      // Get previous preferences
      const { data } = await supabase
        .from("student_preferences")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        const prefs = data.preferences as any[];
        setPreferences(prefs.map((p: any) => p.name));
        setComments(data.additional_comments || "");
      }
    } catch (error: any) {
      console.error("Failed to load preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const studentId = sessionStorage.getItem("student_id");
      const classId = sessionStorage.getItem("class_id");

      if (!studentId || !classId) throw new Error("Not logged in");

      const prefs = preferences
        .filter((p) => p.trim())
        .map((name, index) => ({ name: name.trim(), rank: index + 1 }));

      const { error } = await supabase.from("student_preferences").insert({
        student_id: studentId,
        class_id: classId,
        preferences: prefs,
        additional_comments: comments.trim() || null,
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
        <Button
          variant="ghost"
          onClick={() => navigate("/student/login")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

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
