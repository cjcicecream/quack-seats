import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Home } from "lucide-react";

interface TeacherLayoutProps {
  children: ReactNode;
}

export function TeacherLayout({ children }: TeacherLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-14 border-b flex items-center justify-between px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <button 
          onClick={() => navigate("/")}
          className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent hover:opacity-80 transition-opacity"
        >
          🥔potato groups🥔
        </button>
        
        <Button variant="ghost" size="sm" onClick={() => navigate("/teacher/dashboard")}>
          <Home className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
      </header>
      
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
