-- =====================================================================
-- DASHBOARD MASTER CJUD - VERSÃO FINAL CORRIGIDA
-- Relatório ID: 149 (ou novo ID)
-- =====================================================================

SELECT
    -- CURSO
    c.id AS course_id,
    c.shortname AS course_shortname,
    c.fullname AS course_fullname,
    c.category AS category_id,
    cat.name AS category_name,
    DATE_FORMAT(FROM_UNIXTIME(c.startdate), '%d-%m-%Y') AS course_startdate,
    DATE_FORMAT(FROM_UNIXTIME(c.enddate), '%d-%m-%Y') AS course_enddate,
    c.visible AS course_visible,
    c.format AS course_format,

    -- CARGA HORÁRIA (customfield 'ch')
    COALESCE(
        ch_data.value, 
        ch_data.charvalue, 
        CAST(ch_data.intvalue AS CHAR), 
        CAST(ch_data.decvalue AS CHAR),
        'N/A'
    ) AS course_ch,

    -- USUÁRIO
    u.id AS user_id,
    u.firstname,
    u.lastname,
    CONCAT(u.firstname, ' ', u.lastname) AS fullname,
    u.email,
    u.city,
    u.country,
    CASE 
        WHEN u.lastaccess > 0 THEN DATE_FORMAT(FROM_UNIXTIME(u.lastaccess), '%d-%m-%Y')
        ELSE 'Nunca'
    END AS lastaccess,
    u.confirmed,
    u.suspended,

    -- CAMPOS CUSTOM DE USUÁRIO
    COALESCE(cargo.data, 'N/I') AS nomecargo,
    COALESCE(comarca.data, 'N/I') AS comarca,
    COALESCE(genero.data, 'N/I') AS genero,
    COALESCE(setor.data, 'N/I') AS setor_exerc,
    COALESCE(nomesetor.data, 'N/I') AS nomesetor_exerc,

    -- INSCRIÇÃO
    ue.status AS enrollment_status,
    CASE WHEN ue.timestart > 0 THEN DATE_FORMAT(FROM_UNIXTIME(ue.timestart), '%d-%m-%Y') ELSE 'N/A' END AS enrollment_start,
    CASE WHEN ue.timeend > 0 THEN DATE_FORMAT(FROM_UNIXTIME(ue.timeend), '%d-%m-%Y') ELSE 'N/A' END AS enrollment_end,
    DATE_FORMAT(FROM_UNIXTIME(ue.timecreated), '%d-%m-%Y') AS enrollment_created,
    DATE_FORMAT(FROM_UNIXTIME(ue.timemodified), '%d-%m-%Y') AS enrollment_modified,

    -- PAPEL
    r.shortname AS role_name,
    DATE_FORMAT(FROM_UNIXTIME(ra.timemodified), '%d-%m-%Y') AS role_assigned,

    -- CONCLUSÃO
    cc.timecompleted,
    CASE WHEN cc.timecompleted IS NOT NULL THEN 1 ELSE 0 END AS is_completed,
    CASE 
        WHEN cc.timecompleted IS NOT NULL 
        THEN DATE_FORMAT(FROM_UNIXTIME(cc.timecompleted), '%d-%m-%Y')
        ELSE 'Não Concluído'
    END AS completion_date,

    -- PROGRESSO
    COALESCE(prog.activities_completed, 0) AS activities_completed,
    COALESCE(course_stats.total_activities, 0) AS total_activities,
    CASE 
        WHEN COALESCE(course_stats.total_activities, 0) > 0 
        THEN ROUND((COALESCE(prog.activities_completed, 0) * 100.0) / course_stats.total_activities, 1)
        ELSE 0 
    END AS progress_percentage,

    -- NOTAS E QUIZZES
    COALESCE(course_stats.avg_max_grade, 0) AS avg_max_grade,
    COALESCE(course_stats.total_quizzes, 0) AS total_quizzes,

    -- ÚLTIMA ATIVIDADE NO CURSO
    CASE 
        WHEN last_log.last_activity IS NOT NULL 
        THEN DATE_FORMAT(FROM_UNIXTIME(last_log.last_activity), '%d-%m-%Y')
        ELSE 'Sem Atividade'
    END AS last_activity,

    -- TEMPO NO CURSO (em dias)
    CASE
        WHEN cc.timecompleted IS NOT NULL 
        THEN ROUND((cc.timecompleted - ue.timecreated) / 86400.0, 1)
        ELSE ROUND((UNIX_TIMESTAMP() - ue.timecreated) / 86400.0, 1)
    END AS days_in_course,

    -- STATUS CONSOLIDADO
    CASE
        WHEN cc.timecompleted IS NOT NULL THEN 'CONCLUÍDO'
        WHEN ue.status = 1 THEN 'SUSPENSO'
        WHEN ue.timeend > 0 AND ue.timeend < UNIX_TIMESTAMP() THEN 'EXPIRADO'
        WHEN u.suspended = 1 THEN 'USUÁRIO_SUSPENSO'
        WHEN u.lastaccess = 0 THEN 'NUNCA_ACESSOU'
        WHEN u.lastaccess < (UNIX_TIMESTAMP() - 2592000) THEN 'INATIVO_30_DIAS'
        WHEN u.lastaccess < (UNIX_TIMESTAMP() - 604800) THEN 'INATIVO_7_DIAS'
        ELSE 'ATIVO'
    END AS student_status

FROM prefix_user_enrolments ue
JOIN prefix_enrol e ON e.id = ue.enrolid
JOIN prefix_course c ON c.id = e.courseid
JOIN prefix_user u ON u.id = ue.userid
JOIN prefix_context ctx ON ctx.instanceid = c.id AND ctx.contextlevel = 50
JOIN prefix_role_assignments ra ON ra.userid = u.id AND ra.contextid = ctx.id
JOIN prefix_role r ON r.id = ra.roleid
JOIN prefix_course_categories cat ON cat.id = c.category
LEFT JOIN prefix_course_completions cc ON cc.course = c.id AND cc.userid = u.id

-- CUSTOMFIELD DO CURSO: CARGA HORÁRIA
LEFT JOIN prefix_customfield_field ch_field ON ch_field.shortname = 'ch' AND ch_field.component = 'core_course'
LEFT JOIN prefix_customfield_data ch_data ON ch_data.fieldid = ch_field.id AND ch_data.instanceid = c.id

-- CAMPOS CUSTOM DE USUÁRIO
LEFT JOIN prefix_user_info_data cargo ON cargo.userid = u.id AND cargo.fieldid = (
    SELECT id FROM prefix_user_info_field WHERE shortname = 'nomecargo' LIMIT 1
)
LEFT JOIN prefix_user_info_data comarca ON comarca.userid = u.id AND comarca.fieldid = (
    SELECT id FROM prefix_user_info_field WHERE shortname = 'comarca' LIMIT 1
)
LEFT JOIN prefix_user_info_data genero ON genero.userid = u.id AND genero.fieldid = (
    SELECT id FROM prefix_user_info_field WHERE shortname = 'genero' LIMIT 1
)
LEFT JOIN prefix_user_info_data setor ON setor.userid = u.id AND setor.fieldid = (
    SELECT id FROM prefix_user_info_field WHERE shortname = 'setor_exerc' LIMIT 1
)
LEFT JOIN prefix_user_info_data nomesetor ON nomesetor.userid = u.id AND nomesetor.fieldid = (
    SELECT id FROM prefix_user_info_field WHERE shortname = 'nomesetor_exerc' LIMIT 1
)

-- PROGRESSO DO USUÁRIO
LEFT JOIN (
    SELECT 
        cm.course,
        cmc.userid,
        COUNT(*) as activities_completed
    FROM prefix_course_modules_completion cmc
    JOIN prefix_course_modules cm ON cm.id = cmc.coursemoduleid
    WHERE cmc.completionstate > 0
    GROUP BY cm.course, cmc.userid
) prog ON prog.course = c.id AND prog.userid = u.id

-- ESTATÍSTICAS DO CURSO
LEFT JOIN (
    SELECT 
        c.id as course_id,
        COUNT(CASE WHEN cm.visible = 1 THEN 1 END) as total_activities,
        (SELECT AVG(gi.grademax) FROM prefix_grade_items gi WHERE gi.courseid = c.id AND gi.itemtype = 'mod') as avg_max_grade,
        (SELECT COUNT(*) FROM prefix_quiz q WHERE q.course = c.id) as total_quizzes
    FROM prefix_course c
    LEFT JOIN prefix_course_modules cm ON cm.course = c.id
    GROUP BY c.id
) course_stats ON course_stats.course_id = c.id

-- ÚLTIMA ATIVIDADE
LEFT JOIN (
    SELECT 
        l.courseid,
        l.userid,
        MAX(l.timecreated) as last_activity
    FROM prefix_logstore_standard_log l
    GROUP BY l.courseid, l.userid
) last_log ON last_log.courseid = c.id AND last_log.userid = u.id

WHERE
    u.deleted = 0
    AND u.username REGEXP '^[0-9]+'
    AND ra.roleid = 5
    AND c.visible = 1
    AND c.startdate >= UNIX_TIMESTAMP('2025-01-01 00:00:00')
    AND c.startdate < UNIX_TIMESTAMP('2026-01-01 00:00:00')
    AND (
        NULLIF('%%FILTER_CATEGORY:int%%','') IS NULL
        OR c.category = CAST('%%FILTER_CATEGORY:int%%' AS UNSIGNED)
    )

ORDER BY c.id, student_status, u.lastname, u.firstname;