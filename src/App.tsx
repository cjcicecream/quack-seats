import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TeacherLayout } from "./components/TeacherLayout";
import Home from "./pages/Home";
import TeacherAuth from "./pages/TeacherAuth";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentLogin from "./pages/StudentLogin";
import StudentHome from "./pages/StudentHome";
import StudentPreferences from "./pages/StudentPreferences";
import StudentSuccess from "./pages/StudentSuccess";
import StudentFinalView from "./pages/StudentFinalView";
import SeatingChart from "./pages/SeatingChart";
import TableLayout from "./pages/TableLayout";
import ManagePreferences from "./pages/ManagePreferences";
import ClassSettings from "./pages/ClassSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/teacher/auth" element={<TeacherAuth />} />
          <Route path="/teacher/dashboard" element={<TeacherLayout><TeacherDashboard /></TeacherLayout>} />
          <Route path="/teacher/class/:classId/settings" element={<TeacherLayout><ClassSettings /></TeacherLayout>} />
          <Route path="/teacher/class/:classId/layout" element={<TeacherLayout><TableLayout /></TeacherLayout>} />
          <Route path="/teacher/class/:classId/manage-prefs" element={<TeacherLayout><ManagePreferences /></TeacherLayout>} />
          <Route path="/teacher/class/:classId/chart" element={<TeacherLayout><SeatingChart /></TeacherLayout>} />
          <Route path="/student/login" element={<StudentLogin />} />
          <Route path="/student/home" element={<StudentHome />} />
          <Route path="/student/preferences" element={<StudentPreferences />} />
          <Route path="/student/success" element={<StudentSuccess />} />
          <Route path="/student/final-view" element={<StudentFinalView />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
