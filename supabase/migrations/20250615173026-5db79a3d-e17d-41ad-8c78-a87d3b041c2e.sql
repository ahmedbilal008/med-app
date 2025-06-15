
-- 1. Add doctor_id to patients table
ALTER TABLE patients
ADD COLUMN doctor_id UUID REFERENCES medical_staff(id);

-- 2. All existing patients will have NULL doctor_id, up to you to backfill in the UI.

-- 3. Row-level security: allow only a doctor to see their patients
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Policy: Only allow SELECT/UPDATE/DELETE for the doctor assigned (doctor_id = medical_staff.id)
CREATE POLICY "Doctor can access their patients"
  ON patients FOR SELECT USING (
    doctor_id = (
      SELECT id FROM medical_staff WHERE email = auth.email()
    )
  );

CREATE POLICY "Doctor can update their patients"
  ON patients FOR UPDATE USING (
    doctor_id = (
      SELECT id FROM medical_staff WHERE email = auth.email()
    )
  );

CREATE POLICY "Doctor can delete their patients"
  ON patients FOR DELETE USING (
    doctor_id = (
      SELECT id FROM medical_staff WHERE email = auth.email()
    )
  );

-- 4. Secure visits: allow only staff assigned as patient's doctor (through their patient)
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctor can access their visits"
  ON visits FOR SELECT USING (
    staff_id = (
      SELECT id FROM medical_staff WHERE email = auth.email()
    )
  );
CREATE POLICY "Doctor can update/delete their visits"
  ON visits FOR UPDATE USING (
    staff_id = (
      SELECT id FROM medical_staff WHERE email = auth.email()
    )
  )
  WITH CHECK (
    staff_id = (
      SELECT id FROM medical_staff WHERE email = auth.email()
    )
  );

-- (Leave insert open for now)
