import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, Calendar, Search, LogOut, FileText } from 'lucide-react';
import { PatientRegistration } from '@/components/PatientRegistration';
import { PatientSearch } from '@/components/PatientSearch';
import { VisitRecording } from '@/components/VisitRecording';
import { Auth } from '@/components/Auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@supabase/supabase-js';
import { Patient } from "@/types";
import { PatientProfile } from "@/components/PatientProfile";
import { DoctorProfile } from "@/components/DoctorProfile";
import { ProfileDropdown } from "@/components/ProfileDropdown";

export type ActiveView = 'dashboard' | 'register-patient' | 'search-patient' | 'record-visit' | 'patient-profile' | 'doctor-profile';

const Dashboard = () => {
  const { toast } = useToast();
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastPatients, setLastPatients] = useState<Patient[]>([]);
  const [lastVisitedPatients, setLastVisitedPatients] = useState<Patient[]>([]);
  const [showRecentVisits, setShowRecentVisits] = useState(false);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // new: fetch last 10 patients on mount (for doctor)
  useEffect(() => {
    (async () => {
      if (user) {
        const { data: doctorRow } = await supabase
          .from('medical_staff')
          .select('id')
          .eq('email', user.email)
          .maybeSingle();
        if (doctorRow?.id) {
          // Last registered
          const { data: patientsData } = await supabase
            .from('patients')
            .select('*')
            .eq('doctor_id', doctorRow.id)
            .order('created_at', { ascending: false })
            .limit(10);
          setLastPatients(patientsData || []);
          // Last visited
          const { data: recentVisits } = await supabase
            .from('visits')
            .select('patient_id')
            .eq('staff_id', doctorRow.id)
            .order('visit_date', { ascending: false })
            .limit(10);

          const patientIds = (recentVisits || []).map((v: any) => v.patient_id);

          let patientsRecent: Patient[] = [];
          if (patientIds.length) {
            // Maintain order
            const { data: recentPatients } = await supabase
              .from('patients')
              .select('*')
              .in('id', patientIds);

            patientsRecent = patientIds
              .map((pid: string) => recentPatients?.find((p: Patient) => p.id === pid))
              .filter(Boolean) as Patient[];
          }
          setLastVisitedPatients(patientsRecent);
        }
      }
    })();
  }, [user, activeView]);

  // On initial login, just go to dashboard
  useEffect(() => {
    if (user) {
      setActiveView('dashboard');
    }
  }, [user]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={() => setUser(user)} />;
  }

  // Use ProfileDropdown in header and move profile options there
  // Main Content:

  const renderContent = () => {
    // New view: if 'showRecentVisits', show recent visits for this doctor
    if (showRecentVisits) {
      return (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold text-blue-700">Your Recently Visited Patients</CardTitle>
            <Button variant="outline" onClick={() => setShowRecentVisits(false)}>
              Back to Dashboard
            </Button>
          </CardHeader>
          <CardContent>
            {lastVisitedPatients.length === 0 ? (
              <CardDescription className="mb-3 text-blue-600">No recent visits found for you.</CardDescription>
            ) : (
              <ul className="space-y-2">
                {lastVisitedPatients.map(p => (
                  <li key={p.id} className="flex flex-col md:flex-row md:justify-between md:items-center border-b py-2">
                    <div>
                      <span className="font-medium">{p.name}</span> (Age {p.age}) — {p.department}
                      <div className="text-xs text-gray-600">Phone: {p.phone || "-"} | Email: {p.email || "-"}</div>
                    </div>
                    <div className="flex gap-2 mt-2 md:mt-0">
                      <Button size="sm" onClick={() => {
                        setSelectedPatientId(p.id);
                        setShowRecentVisits(false);
                        setActiveView('record-visit');
                      }}>Record Visit</Button>
                      <Button size="sm" variant="ghost" onClick={() => {
                        setSelectedPatientId(p.id);
                        setShowRecentVisits(false);
                        setActiveView('patient-profile');
                      }}>View Profile</Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      );
    }

    switch (activeView) {
      case 'register-patient':
        return <PatientRegistration onBack={() => setActiveView('dashboard')}
                                   onSuccess={() => setActiveView('dashboard')}
        />;
      case 'search-patient':
        return (
          <PatientSearch
            onBack={() => setActiveView('dashboard')}
            onPatientSelect={(patientId) => {
              setSelectedPatientId(patientId);
              setActiveView('record-visit');
            }}
          />
        );
      case 'record-visit':
        return (
          <VisitRecording
            patientId={selectedPatientId}
            onBack={() => {
              setActiveView('dashboard');
              setSelectedPatientId(null);
            }}
            showPreviousVisits // will show previous visits for the selected patient in VisitRecording UI
            onVisitSaved={() => setActiveView('dashboard')}
          />
        );
      case 'patient-profile':
        return (
          <PatientProfile
            patientId={selectedPatientId}
            onBack={() => setActiveView('dashboard')}
            onPatientUpdated={() => setActiveView('dashboard')}
          />
        );
      case 'doctor-profile':
        return (
          <DoctorProfile
            onBack={() => setActiveView('dashboard')}
            onDoctorUpdated={() => setActiveView('dashboard')}
          />
        );
      default:
        // Dashboard view—no My Profile card, and Record Visit card acts as a trigger for recent visits
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Record Visit card */}
            <Card
              className="hover:shadow-lg transition-shadow cursor-pointer border-blue-200 bg-blue-50"
              onClick={() => setShowRecentVisits(true)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold text-blue-700">Record New Visit</CardTitle>
                <FileText className="h-6 w-6 text-blue-600" />
              </CardHeader>
              <CardContent>
                <CardDescription className="text-blue-600">Click to see and manage recent patient visits</CardDescription>
              </CardContent>
            </Card>
            {/* Register new patient card */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveView('register-patient')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Register New Patient</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CardDescription>Add a new patient to the system</CardDescription>
              </CardContent>
            </Card>
            {/* Search patients card */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveView('search-patient')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Search Patients</CardTitle>
                <Search className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CardDescription>Find existing patients and view history</CardDescription>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            {/* Left logo & app name */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">MedCare System</h1>
            </div>
            <div className="flex items-center space-x-4">
              <ProfileDropdown
                email={user.email}
                onProfile={() => setActiveView('doctor-profile')}
                onLogout={handleLogout}
              />
              {activeView !== 'dashboard' && (
                <Button variant="outline" onClick={() => setActiveView('dashboard')}>
                  Dashboard
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
