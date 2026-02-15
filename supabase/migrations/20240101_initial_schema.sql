-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations (multi-tenancy)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Groups
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  default_meeting_day INTEGER NOT NULL CHECK (default_meeting_day BETWEEN 0 AND 6),
  default_meeting_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leaders (vinculados a auth.users)
CREATE TABLE leaders (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Members (Participantes e Visitantes)
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  birth_date DATE NOT NULL,
  member_type VARCHAR(20) NOT NULL CHECK (member_type IN ('participant', 'visitor')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meetings (Agenda gerada + manual)
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  meeting_date DATE NOT NULL,
  is_cancelled BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, meeting_date)
);

-- Attendance (Presença/Falta)
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  is_present BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(meeting_id, member_id)
);

-- Notifications (histórico de alertas)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('absence_alert', 'birthday')),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_members_group ON members(group_id);
CREATE INDEX idx_meetings_group_date ON meetings(group_id, meeting_date);
CREATE INDEX idx_attendance_meeting ON attendance(meeting_id);
CREATE INDEX idx_notifications_group_unread ON notifications(group_id, is_read);

-- Habilitar RLS em todas as tabelas
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaders ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Leaders só acessam dados do próprio grupo
CREATE POLICY "leaders_own_group_members" ON members
  FOR ALL USING (
    group_id IN (
      SELECT group_id FROM leaders WHERE id = auth.uid()
    )
  );

CREATE POLICY "leaders_own_group_meetings" ON meetings
  FOR ALL USING (
    group_id IN (
      SELECT group_id FROM leaders WHERE id = auth.uid()
    )
  );

CREATE POLICY "leaders_own_group_attendance" ON attendance
  FOR ALL USING (
    meeting_id IN (
      SELECT m.id FROM meetings m
      JOIN leaders l ON l.group_id = m.group_id
      WHERE l.id = auth.uid()
    )
  );

CREATE POLICY "leaders_own_group_notifications" ON notifications
  FOR ALL USING (
    group_id IN (
      SELECT group_id FROM leaders WHERE id = auth.uid()
    )
  );

-- Policy: Líderes podem ver outros líderes do mesmo grupo
CREATE POLICY "leaders_same_group" ON leaders
  FOR SELECT USING (
    group_id IN (
      SELECT group_id FROM leaders WHERE id = auth.uid()
    )
  );

-- Policy: Líderes podem ver seu próprio grupo
CREATE POLICY "leaders_own_group" ON groups
  FOR SELECT USING (
    id IN (
      SELECT group_id FROM leaders WHERE id = auth.uid()
    )
  );

-- Policy: Líderes podem ver sua própria organização
CREATE POLICY "leaders_own_organization" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM leaders WHERE id = auth.uid()
    )
  );

-- Função: Buscar últimas N faltas consecutivas de um membro
CREATE OR REPLACE FUNCTION get_consecutive_absences(member_uuid UUID, limit_count INT DEFAULT 10)
RETURNS TABLE (
  meeting_date DATE,
  is_present BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT m.meeting_date, a.is_present
  FROM attendance a
  JOIN meetings m ON m.id = a.meeting_id
  WHERE a.member_id = member_uuid
    AND m.is_cancelled = FALSE
  ORDER BY m.meeting_date DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função: Verificar aniversariantes de hoje
CREATE OR REPLACE FUNCTION get_birthdays_today(group_uuid UUID)
RETURNS TABLE (
  id UUID,
  full_name VARCHAR,
  phone VARCHAR,
  birth_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT m.id, m.full_name, m.phone, m.birth_date
  FROM members m
  WHERE m.group_id = group_uuid
    AND EXTRACT(MONTH FROM m.birth_date) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(DAY FROM m.birth_date) = EXTRACT(DAY FROM CURRENT_DATE)
    AND m.is_active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
