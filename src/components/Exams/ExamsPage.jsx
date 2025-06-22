import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ExamsList from "./ExamsList";
import ExamForm from "./ExamForm";

const ExamsPage = () => {
  const [selectedTab, setSelectedTab] = React.useState("list");
  const [createMode, setCreateMode] = React.useState(false);
  const [selectedStudents, setSelectedStudents] = React.useState([]);
  const [importedStudents, setImportedStudents] = React.useState([]);

  const handleNewExamCreated = () => {
    setCreateMode(false);
    setSelectedTab("list");
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Gestion des Examens</h1>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="list">Liste des Examens</TabsTrigger>
            {createMode && (
              <TabsTrigger value="create">Créer un Examen</TabsTrigger>
            )}
          </TabsList>

          {selectedTab === "list" && !createMode && (
            <button
              className="bg-primary text-white px-4 py-2 rounded-md"
              onClick={() => {
                setCreateMode(true);
                setSelectedTab("create");
              }}
            >
              Nouveau Examen
            </button>
          )}
        </div>

        <TabsContent value="list" className="mt-0">
          <ExamsList />
        </TabsContent>

        {createMode && (
          <TabsContent value="create" className="mt-0">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">
                Créer un Nouvel Examen
              </h2>
              <ExamForm
                onSubmit={handleNewExamCreated}
                onCancel={() => {
                  setCreateMode(false);
                  setSelectedTab("list");
                }}
                setSelectedStudents={setSelectedStudents}
                setImportedStudents={setImportedStudents}
              />
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default ExamsPage;
