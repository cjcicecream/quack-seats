import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TeacherSidebar } from "./TeacherSidebar";

interface TeacherLayoutProps {
  children: ReactNode;
}

export function TeacherLayout({ children }: TeacherLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <TeacherSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b flex items-center px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <SidebarTrigger />
            <div className="ml-4 text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              🥔potato groups🥔
            </div>
          </header>
          
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
