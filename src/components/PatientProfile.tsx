
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const PatientProfile = ({ patientId, onBack, onPatientUpdated }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    phone: "",
    email: "",
    address: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    medical_history: "",
    allergies: "",
    current_medications: "",
    department: ""
  });

  useEffect(() => {
    if (!patientId) return;
    (async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();
      if (data) {
        setFormData({
          name: data.name || "",
          age: data.age !== undefined && data.age !== null ? String(data.age) : "",
          gender: data.gender || "",
          phone: data.phone || "",
          email: data.email || "",
          address: data.address || "",
          emergency_contact_name: data.emergency_contact_name || "",
          emergency_contact_phone: data.emergency_contact_phone || "",
          medical_history: data.medical_history || "",
          allergies: data.allergies || "",
          current_medications: data.current_medications || "",
          department: data.department || ""
        });
      }
    })();
  }, [patientId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase
      .from('patients')
      .update({
        ...formData,
        age: Number(formData.age)
      })
      .eq('id', patientId);

    if (error) {
      toast({ title: "Error", description: "Could not update patient", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Patient updated." });
      onPatientUpdated();
    }
  };

  return (
    <div>
      <Button variant="outline" onClick={onBack}>Back</Button>
      <Card className="my-6">
        <CardHeader>
          <CardTitle>Patient Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <Label>Age</Label>
              <Input value={formData.age} type="number" onChange={e => setFormData(f => ({ ...f, age: e.target.value }))} required />
            </div>
            <div>
              <Label>Gender</Label>
              <Input value={formData.gender} onChange={e => setFormData(f => ({ ...f, gender: e.target.value }))} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={formData.phone} onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={formData.email} type="email" onChange={e => setFormData(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <Label>Department</Label>
              <Input value={formData.department} onChange={e => setFormData(f => ({ ...f, department: e.target.value }))} required />
            </div>
            <div>
              <Label>Address</Label>
              <Textarea value={formData.address} onChange={e => setFormData(f => ({ ...f, address: e.target.value }))} required />
            </div>
            <div>
              <Label>Emergency Contact Name</Label>
              <Input value={formData.emergency_contact_name} onChange={e => setFormData(f => ({ ...f, emergency_contact_name: e.target.value }))} />
            </div>
            <div>
              <Label>Emergency Contact Phone</Label>
              <Input value={formData.emergency_contact_phone} onChange={e => setFormData(f => ({ ...f, emergency_contact_phone: e.target.value }))} />
            </div>
            <div>
              <Label>Medical History</Label>
              <Textarea value={formData.medical_history} onChange={e => setFormData(f => ({ ...f, medical_history: e.target.value }))} />
            </div>
            <div>
              <Label>Allergies</Label>
              <Textarea value={formData.allergies} onChange={e => setFormData(f => ({ ...f, allergies: e.target.value }))} />
            </div>
            <div>
              <Label>Current Medications</Label>
              <Textarea value={formData.current_medications} onChange={e => setFormData(f => ({ ...f, current_medications: e.target.value }))} />
            </div>
            <Button type="submit">Update Patient</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
