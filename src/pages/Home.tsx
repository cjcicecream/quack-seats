import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import FloatingBubbles from "@/components/FloatingBubbles";
import { GraduationCap, Users, Eye } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <FloatingBubbles />
      
      <div className="relative z-10 text-center max-w-4xl mx-auto space-y-8 px-4">
        <div className="space-y-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-fade-in leading-relaxed py-2">
            🥔potato groups🥔
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground animate-fade-in">
            Create perfect seating arrangements with student preferences!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-12">
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-8 shadow-[var(--shadow-glow)] border-2 border-primary/20 hover:border-primary/40 transition-all hover:scale-105">
            <GraduationCap className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-bold mb-3">Teachers</h2>
            <p className="text-muted-foreground mb-6">
              Manage classes, create table layouts, and generate smart seating charts
            </p>
            <Button
              variant="playful"
              size="lg"
              className="w-full"
              onClick={() => navigate("/teacher/auth")}
            >
              Teacher Login
            </Button>
          </div>

          <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-8 shadow-[var(--shadow-glow)] border-2 border-secondary/20 hover:border-secondary/40 transition-all hover:scale-105">
            <Users className="w-16 h-16 mx-auto mb-4 text-secondary" />
            <h2 className="text-2xl font-bold mb-3">Students</h2>
            <p className="text-muted-foreground mb-6">
              Submit your seating preferences and see where you'll sit!
            </p>
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => navigate("/student/login")}
            >
              Student Login
            </Button>
          </div>

          <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-8 shadow-[var(--shadow-glow)] border-2 border-primary/20 hover:border-primary/40 transition-all hover:scale-105">
            <Eye className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-bold mb-3">View Charts</h2>
            <p className="text-muted-foreground mb-6">
              View the final seating arrangement with all students
            </p>
            <Button
              variant="playful"
              size="lg"
              className="w-full"
              onClick={() => navigate("/student/final-view")}
            >
              View Seating Chart
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
