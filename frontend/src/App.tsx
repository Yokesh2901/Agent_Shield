import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, PageId } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { ActionExplorerPage } from './pages/ActionExplorerPage';
import { PoliciesPage } from './pages/PoliciesPage';
import { AgentsPage } from './pages/AgentsPage';
import { ToolsPage } from './pages/ToolsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { UserRole } from './types';
import { getAuthRole, api } from './api/client';

export function App() {
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [currentRole, setCurrentRole] = useState<UserRole>(getAuthRole());
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);

  const fetchPendingCount = async () => {
    try {
      const appr = await api.getApprovals('PENDING');
      setPendingApprovalsCount(appr.length);
    } catch {
      // Offline fallback / no-op
    }
  };

  useEffect(() => {
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectAction = (actionId: string) => {
    setSelectedActionId(actionId);
    setActivePage('explorer');
  };

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navigation */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={(newRole) => setCurrentRole(newRole)}
        pendingReviewsCount={pendingApprovalsCount}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activePage={activePage}
          onPageSelect={(page) => {
            setActivePage(page);
            if (page !== 'explorer') setSelectedActionId(null);
          }}
          pendingApprovalsCount={pendingApprovalsCount}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {activePage === 'dashboard' && (
            <DashboardPage
              onSelectAction={handleSelectAction}
              onNavigate={(page) => setActivePage(page as PageId)}
            />
          )}

          {activePage === 'simulator' && (
            <SimulatorPage
              onNavigateToApprovals={() => setActivePage('approvals')}
            />
          )}

          {activePage === 'approvals' && (
            <ApprovalsPage />
          )}

          {activePage === 'explorer' && (
            <ActionExplorerPage
              selectedActionId={selectedActionId}
              onClearSelection={() => setSelectedActionId(null)}
            />
          )}

          {activePage === 'policies' && (
            <PoliciesPage />
          )}

          {activePage === 'agents' && (
            <AgentsPage
              onRunSimulationWithAgent={(agentId) => {
                setActivePage('simulator');
              }}
            />
          )}

          {activePage === 'tools' && (
            <ToolsPage />
          )}

          {activePage === 'audit' && (
            <AuditLogsPage />
          )}

          {activePage === 'settings' && (
            <SettingsPage />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
