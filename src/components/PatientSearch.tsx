import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Search, Calendar } from 'lucide-react';
import { Patient } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const useCurrentDoctorId = () => {
  const [doctorId, setDoctorId] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('medical_staff')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();
      if (data) setDoctorId(data.id);
    })();
  }, []);
  return doctorId;
};

interface PatientSearchProps {
  onBack: () => void;
  onPatientSelect: (patientId: string) => void;
}

export const PatientSearch = ({ onBack, onPatientSelect }: PatientSearchProps) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const doctorId = useCurrentDoctorId();

  const handleSearch = async () => {
    if (!searchTerm.trim() || !doctorId) return;
    
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .eq('doctor_id', doctorId)
        .order('name');

      if (error) throw error;
      
      setSearchResults(data || []);
      
      if (data?.length === 0) {
        toast({
          title: "No Results",
          description: "No patients found with that name",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to search patients",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold">Search Patients</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Patient Search</CardTitle>
          <CardDescription>Search for existing patients by name</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <div className="flex-1">
              <Label htmlFor="search">Patient Name</Label>
              <Input
                id="search"
                placeholder="Enter patient name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching} className="mt-6">
              <Search className="h-4 w-4 mr-2" />
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {searchResults.map((patient) => (
                <div key={patient.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">{patient.name}</h3>
                      <p className="text-sm text-gray-600">
                        Age: {patient.age} | Department: {patient.department}
                      </p>
                      <p className="text-sm text-gray-600">
                        Phone: {patient.phone} | Email: {patient.email}
                      </p>
                      <p className="text-sm text-gray-600">
                        Address: {patient.address}
                      </p>
                      {patient.allergies && (
                        <p className="text-sm text-red-600">
                          Allergies: {patient.allergies}
                        </p>
                      )}
                    </div>
                    <Button onClick={() => onPatientSelect(patient.id)}>
                      <Calendar className="h-4 w-4 mr-2" />
                      Record Visit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
