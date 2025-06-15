import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Mic, Square, Play, Pause, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Patient } from '@/types';

interface VisitRecordingProps {
  patientId: string | null;
  onBack: () => void;
  showPreviousVisits?: boolean;
  onVisitSaved?: () => void;
}

export const VisitRecording = ({ patientId, onBack, showPreviousVisits = false, onVisitSaved }: VisitRecordingProps) => {
  const { toast } = useToast();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<BlobPart[]>([]);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [visitData, setVisitData] = useState({
    symptoms: '',
    diagnosis: '',
    treatment_plan: '',
    prescription: '',
    notes: '',
    follow_up_date: ''
  });

  const [previousVisits, setPreviousVisits] = useState<any[]>([]);

  useEffect(() => {
    if (showPreviousVisits && patientId) {
      (async () => {
        const { data, error } = await supabase
          .from('visits')
          .select('*')
          .eq('patient_id', patientId)
          .order('visit_date', { ascending: false });

        if (!error && data) setPreviousVisits(data);
      })();
    }
  }, [patientId, showPreviousVisits]);

  useEffect(() => {
    if (patientId) {
      fetchPatient();
    }
  }, [patientId]);

  const fetchPatient = async () => {
    if (!patientId) return;
    
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (error) throw error;
      setPatient(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load patient information",
        variant: "destructive",
      });
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      setMediaRecorder(recorder);
      setAudioChunks([]);
      setAudioBlob(null);

      recorder.ondataavailable = (event) => {
        setAudioChunks((prev) => [...prev, event.data]);
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      recorder.start();
      setIsRecording(true);
      setIsPaused(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  };

  const pauseRecording = () => {
    if (mediaRecorder && isRecording && !isPaused) {
      mediaRecorder.pause();
      setIsPaused(true);
    }
  };
  const resumeRecording = () => {
    if (mediaRecorder && isRecording && isPaused) {
      mediaRecorder.resume();
      setIsPaused(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setIsPaused(false);
      setMediaRecorder(null);
    }
  };

  const deleteAudio = () => {
    setAudioChunks([]);
    setAudioBlob(null);
    setIsRecording(false);
    setIsPaused(false);
    if (mediaRecorder) {
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setMediaRecorder(null);
    }
    toast({ title: "Audio Deleted", description: "The recording has been removed." });
  };

  const playAudio = () => {
    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.play();
      setIsPlaying(true);
      
      audio.onended = () => {
        setIsPlaying(false);
      };
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Get current user for staff_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get staff_id from medical_staff table
      const { data: staffData } = await supabase
        .from('medical_staff')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();
      if (!staffData) throw new Error("Staff not found");
      
      let audioUrl = null;
      
      // Upload audio file if exists
      if (audioBlob) {
        const fileName = `visit-recording-${Date.now()}.webm`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('audio-recordings')
          .upload(fileName, audioBlob);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('audio-recordings')
            .getPublicUrl(fileName);
          audioUrl = publicUrl;
        }
      }

      // Insert visit record
      const { error } = await supabase
        .from('visits')
        .insert([{
          patient_id: patientId,
          staff_id: staffData.id,
          symptoms: visitData.symptoms,
          diagnosis: visitData.diagnosis,
          treatment_plan: visitData.treatment_plan,
          prescription: visitData.prescription,
          notes: visitData.notes,
          voice_recording_url: audioUrl,
          follow_up_date: visitData.follow_up_date || null
        }]);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Visit recorded successfully",
      });

      // Reset form
      setVisitData({
        symptoms: '',
        diagnosis: '',
        treatment_plan: '',
        prescription: '',
        notes: '',
        follow_up_date: ''
      });
      setAudioChunks([]);
      setAudioBlob(null);
      if (onVisitSaved) onVisitSaved();
      onBack();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to record visit",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!patientId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">Record Visit</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">Please select a patient to record a visit.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold">Record Visit</h2>
      </div>

      {patient && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-700">Patient Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><strong>Name:</strong> {patient.name}</div>
              <div><strong>Age:</strong> {patient.age}</div>
              <div><strong>Department:</strong> {patient.department}</div>
              <div><strong>Phone:</strong> {patient.phone}</div>
              {patient.allergies && (
                <div className="md:col-span-2 text-red-600">
                  <strong>Allergies:</strong> {patient.allergies}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Voice Recording</CardTitle>
            <CardDescription>Record consultation audio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center gap-2 flex-wrap">
              {!isRecording && (
                <Button onClick={startRecording}>
                  <Mic className="h-4 w-4 mr-2" /> Start
                </Button>
              )}
              {isRecording && !isPaused && (
                <Button onClick={pauseRecording} variant="outline">
                  <Pause className="h-4 w-4 mr-2" /> Pause
                </Button>
              )}
              {isRecording && isPaused && (
                <Button onClick={resumeRecording} variant="outline">
                  <Play className="h-4 w-4 mr-2" /> Resume
                </Button>
              )}
              {isRecording && (
                <Button onClick={stopRecording} variant="destructive">
                  <Square className="h-4 w-4 mr-2" /> Stop
                </Button>
              )}
              {(audioBlob || audioChunks.length > 0) && (
                <Button onClick={deleteAudio} variant="ghost">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete Recording
                </Button>
              )}
            </div>
            {audioBlob && (
              <div className="flex items-center justify-center space-x-4">
                {!isPlaying ? (
                  <Button onClick={playAudio} variant="outline">
                    <Play className="h-4 w-4 mr-2" /> Play Recording
                  </Button>
                ) : (
                  <Button onClick={pauseAudio} variant="outline">
                    <Pause className="h-4 w-4 mr-2" /> Pause
                  </Button>
                )}
              </div>
            )}
            {isRecording && (
              <div className="text-center text-red-600 font-medium">
                {isPaused ? "Recording paused..." : "Recording in progress..."}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visit Details</CardTitle>
            <CardDescription>Enter consultation information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="symptoms">Symptoms</Label>
                <Textarea
                  id="symptoms"
                  value={visitData.symptoms}
                  onChange={(e) => setVisitData(prev => ({ ...prev, symptoms: e.target.value }))}
                  placeholder="Patient's reported symptoms"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnosis</Label>
                <Textarea
                  id="diagnosis"
                  value={visitData.diagnosis}
                  onChange={(e) => setVisitData(prev => ({ ...prev, diagnosis: e.target.value }))}
                  placeholder="Medical diagnosis"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="treatment_plan">Treatment Plan</Label>
                <Textarea
                  id="treatment_plan"
                  value={visitData.treatment_plan}
                  onChange={(e) => setVisitData(prev => ({ ...prev, treatment_plan: e.target.value }))}
                  placeholder="Recommended treatment plan"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prescription">Prescription</Label>
                <Textarea
                  id="prescription"
                  value={visitData.prescription}
                  onChange={(e) => setVisitData(prev => ({ ...prev, prescription: e.target.value }))}
                  placeholder="Prescribed medications"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={visitData.notes}
                  onChange={(e) => setVisitData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional notes"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="follow_up_date">Follow-up Date</Label>
                <Input
                  id="follow_up_date"
                  type="date"
                  value={visitData.follow_up_date}
                  onChange={(e) => setVisitData(prev => ({ ...prev, follow_up_date: e.target.value }))}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Saving Visit...' : 'Save Visit Record'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {showPreviousVisits && previousVisits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Previous Visits</CardTitle>
            <CardDescription>The most recent visits for this patient</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {previousVisits.map(v =>
                <li key={v.id} className="border rounded p-2">
                  <div><strong>Date:</strong> {v.visit_date?.split('T')[0]}</div>
                  <div><strong>Diagnosis:</strong> {v.diagnosis}</div>
                  <div><strong>Notes:</strong> {v.notes}</div>
                  {v.voice_recording_url && (
                    <audio controls src={v.voice_recording_url} className="w-full mt-1" />
                  )}
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
