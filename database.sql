
-- 1. Tables
CREATE TABLE IF NOT EXISTS areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT CHECK (role IN ('admin', 'lead', 'viewer')) DEFAULT 'viewer',
    area_id UUID REFERENCES areas(id)
);

CREATE TABLE IF NOT EXISTS srv_objectives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area_id UUID NOT NULL REFERENCES areas(id),
    year INT NOT NULL,
    name TEXT NOT NULL,
    annual_weight NUMERIC(5,2) NOT NULL,
    UNIQUE(area_id, year, name)
);

CREATE TABLE IF NOT EXISTS srv_plan_monthly (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    objective_id UUID NOT NULL REFERENCES srv_objectives(id) ON DELETE CASCADE,
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    planned_value NUMERIC(12,4) DEFAULT 0,
    UNIQUE(objective_id, month)
);

CREATE TABLE IF NOT EXISTS srv_exec_monthly (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    objective_id UUID NOT NULL REFERENCES srv_objectives(id) ON DELETE CASCADE,
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    executed_value NUMERIC(12,4) DEFAULT 0,
    UNIQUE(objective_id, month)
);

-- 2. RLS Enable
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE srv_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE srv_plan_monthly ENABLE ROW LEVEL SECURITY;
ALTER TABLE srv_exec_monthly ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies

-- Areas: Everyone can read areas for dropdowns, only admin can write.
CREATE POLICY "Public read areas" ON areas FOR SELECT USING (true);
CREATE POLICY "Admin write areas" ON areas FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Profiles: Own profile or admin
CREATE POLICY "Profile self access" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Admin profiles access" ON profiles FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Objectives: Admin (all), Lead (area), Viewer (read area)
CREATE POLICY "Objectives access" ON srv_objectives FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' OR
  ((SELECT area_id FROM profiles WHERE id = auth.uid()) = area_id AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('lead', 'viewer'))
);

-- Plan: Admin (all), Lead (area)
CREATE POLICY "Plan access" ON srv_plan_monthly FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' OR
  EXISTS (
    SELECT 1 FROM srv_objectives o 
    JOIN profiles p ON p.area_id = o.area_id 
    WHERE o.id = objective_id AND p.id = auth.uid() AND p.role IN ('lead', 'viewer')
  )
);

-- Exec: Same as plan
CREATE POLICY "Exec access" ON srv_exec_monthly FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' OR
  EXISTS (
    SELECT 1 FROM srv_objectives o 
    JOIN profiles p ON p.area_id = o.area_id 
    WHERE o.id = objective_id AND p.id = auth.uid() AND p.role IN ('lead', 'viewer')
  )
);

-- 4. Trigger for profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'viewer');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
