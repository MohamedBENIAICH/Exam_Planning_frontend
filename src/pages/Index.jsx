
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Header from '@/components/Layout/Header';
import Sidebar from '@/components/Layout/Sidebar';
import StatsCards from '@/components/Dashboard/StatsCards';
import UpcomingExams from '@/components/Dashboard/UpcomingExams';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header 
          title="Dashboard" 
          subtitle="Welcome to the Exam Scheduler"
          actions={
            <Button onClick={() => navigate('/exams')}>
              <Plus className="h-4 w-4 mr-2" />
              New Exam
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
