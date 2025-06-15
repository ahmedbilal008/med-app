
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const DoctorProfile = ({ onBack, onDoctorUpdated }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    license_number: ""
  });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('medical_staff')
        .select('*')
        .eq('email', user.email)
        .single();

      if (data) setFormData({ ...data });
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('medical_staff')
      .update({
        name: formData.name,
        phone: formData.phone,
        department: formData.department,
        license_number: formData.license_number
      })
      .eq('email', user.email);

    if (error) {
      toast({ title: "Error", description: "Could not update profile", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Profile updated." });
      onDoctorUpdated();
    }
  };

  return (
    <div>
      <Button variant="outline" onClick={onBack}>Back</Button>
      <Card className="my-6">
        <CardHeader>
          <CardTitle>Doctor Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={formData.phone} onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <Label>Department</Label>
              <Input value={formData.department} onChange={e => setFormData(f => ({ ...f, department: e.target.value }))} required />
            </div>
            <div>
              <Label>License #</Label>
              <Input value={formData.license_number} onChange={e => setFormData(f => ({ ...f, license_number: e.target.value }))} />
            </div>
            <Button type="submit">Update Profile</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
