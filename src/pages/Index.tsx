import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Header from "@/components/Layout/Header";
import Sidebar from "@/components/Layout/Sidebar";
import StatsCards from "@/components/Dashboard/StatsCards";
import UpcomingExams from "@/components/Dashboard/UpcomingExams";
import { fr } from "@/translations/fr";

const Index = () => {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header
          title={fr.navigation.dashboard}
          subtitle={fr.dashboard.welcome}
          actions={
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {fr.dashboard.newExam}
            </Button>
          }
        />
        <div className="flex-1 p-4 sm:p-6 space-y-6 overflow-auto">
          <StatsCards />
          <UpcomingExams />
        </div>
      </div>
    </div>
  );
};

export default Index;
