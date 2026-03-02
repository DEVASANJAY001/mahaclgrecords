-- Insert default exam types
INSERT INTO exam_types (code, name) VALUES
('IAT1', 'IAT 1'),
('IAT2', 'IAT 2'),
('SEM', 'Semester Exam'),
('QZ', 'Quiz'),
('ASG', 'Assignment'),
('PRJ', 'Project')
ON CONFLICT (code) DO NOTHING;
