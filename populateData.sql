-- 9. Sample data for testing (uncomment to populate)
/*
-- Insert sample users
INSERT INTO users (username, email) VALUES 
    ('john_doe', 'john@example.com'),
    ('jane_smith', 'jane@example.com'),
    ('bob_wilson', 'bob@example.com');

INSERT INTO demo_table (company, allowed) VALUES 
    ('Canvas', TRUE),
    ('Google Drive', TRUE);
    ('bob_wilson', 'bob@example.com');


-- Insert sample entities (apps)
INSERT INTO entities (entity_name, entity_type, description) VALUES 
    ('Gmail', 'email', 'Google Email Service'),
    ('Google Drive', 'storage', 'Cloud Storage Service'),
    ('Slack', 'communication', 'Team Communication Platform'),
    ('GitHub', 'development', 'Code Repository Platform');

-- Insert sample files (you'll need to replace UUIDs with actual user_ids)
-- INSERT INTO files (user_id, file_name, file_path, file_type) VALUES 
--     ('user-uuid-1', 'resume.pdf', '/documents/resume.pdf', 'pdf'),
--     ('user-uuid-1', 'project.zip', '/projects/project.zip', 'archive');

-- Insert sample relationships
-- INSERT INTO user_entity_files (user_id, entity_id, file_id, interaction_type) VALUES 
--     ('user-uuid', 'entity-uuid', 'file-uuid', 'read');
*/

-- 10. Useful queries for common operations

-- Query 1: Get all files a user uses with a specific entity
-- SELECT f.file_name, f.file_path, uef.interaction_type, uef.created_at
-- FROM user_entity_files uef
-- JOIN files f ON uef.file_id = f.file_id
-- WHERE uef.user_id = $1 AND uef.entity_id = $2;

-- Query 2: Get all entities a user interacts with
-- SELECT e.entity_name, e.entity_type, COUNT(uef.file_id) as file_count
-- FROM user_entity_files uef
-- JOIN entities e ON uef.entity_id = e.entity_id
-- WHERE uef.user_id = $1
-- GROUP BY e.entity_id, e.entity_name, e.entity_type;

-- Query 3: Get all users who interact with a specific entity
-- SELECT u.username, COUNT(uef.file_id) as file_count
-- FROM user_entity_files uef
-- JOIN users u ON uef.user_id = u.user_id
-- WHERE uef.entity_id = $1
-- GROUP BY u.user_id, u.username;

-- Performance monitoring queries
-- Check table sizes:
-- SELECT schemaname,tablename,attname,n_distinct,correlation FROM pg_stats WHERE tablename = 'user_entity_files';

-- Check index usage:
-- SELECT indexname, idx_tup_read, idx_tup_fetch FROM pg_stat_user_indexes WHERE relname = 'user_entity_files';