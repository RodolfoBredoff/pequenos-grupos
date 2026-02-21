-- Visitantes não cadastrados (podem ser convertidos em membros depois)
CREATE TABLE IF NOT EXISTS guest_visitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guest_visitors_group ON guest_visitors(group_id);

-- Presença de visitantes não cadastrados no encontro
CREATE TABLE IF NOT EXISTS attendance_guests (
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES guest_visitors(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (meeting_id, guest_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_guests_meeting ON attendance_guests(meeting_id);
CREATE INDEX IF NOT EXISTS idx_attendance_guests_guest ON attendance_guests(guest_id);
