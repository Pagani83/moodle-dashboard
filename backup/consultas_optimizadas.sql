-- ==========================================================================
-- CONSULTAS OTIMIZADAS PARA DASHBOARD - ESTRATÉGIA FRAGMENTADA
-- ==========================================================================

-- CONSULTA 1: SUMÁRIOS POR CURSO (Performance Rápida)
-- Relatório ID: 200
-- Tamanho esperado: ~100-500 linhas (um por curso)
SELECT 
    c.id as course_id,
    c.shortname,
    c.fullname,
    c.category as category_id,
    cat.name as category_name,
    
    -- MÉTRICAS AGREGADAS
    COUNT(DISTINCT ue.userid) as total_students,
    COUNT(DISTINCT CASE WHEN cc.timecompleted IS NOT NULL THEN ue.userid END) as completed_students,
    ROUND((COUNT(DISTINCT CASE WHEN cc.timecompleted IS NOT NULL THEN ue.userid END) * 100.0) / 
          NULLIF(COUNT(DISTINCT ue.userid), 0), 2) as completion_rate,
    
    -- DATAS IMPORTANTES
    MIN(ue.timecreated) as first_enrollment,
    MAX(cc.timecompleted) as last_completion,
    
    -- ATIVIDADE RECENTE (últimos 30 dias)
    COUNT(DISTINCT CASE WHEN ue.timecreated >= (UNIX_TIMESTAMP() - 2592000) THEN ue.userid END) as new_students_30d,
    COUNT(DISTINCT CASE WHEN cc.timecompleted >= (UNIX_TIMESTAMP() - 2592000) THEN ue.userid END) as completions_30d,
    
    -- STATUS DO CURSO
    CASE 
        WHEN COUNT(DISTINCT ue.userid) = 0 THEN 'INACTIVE'
        WHEN (COUNT(DISTINCT CASE WHEN cc.timecompleted IS NOT NULL THEN ue.userid END) * 100.0) / 
             COUNT(DISTINCT ue.userid) > 80 THEN 'EXCELLENT'
        WHEN (COUNT(DISTINCT CASE WHEN cc.timecompleted IS NOT NULL THEN ue.userid END) * 100.0) / 
             COUNT(DISTINCT ue.userid) > 50 THEN 'GOOD'
        ELSE 'NEEDS_ATTENTION'
    END as course_status,
    
    -- TEMPO MÉDIO DE CONCLUSÃO (em dias)
    ROUND(AVG(CASE WHEN cc.timecompleted IS NOT NULL 
                   THEN (cc.timecompleted - ue.timecreated) / 86400.0 
                   END), 1) as avg_completion_days

FROM {course} c
LEFT JOIN {course_categories} cat ON cat.id = c.category
LEFT JOIN {enrol} e ON e.courseid = c.id
LEFT JOIN {user_enrolments} ue ON ue.enrolid = e.id
LEFT JOIN {user} u ON u.id = ue.userid AND u.deleted = 0
LEFT JOIN {context} ctx ON ctx.instanceid = c.id AND ctx.contextlevel = 50
LEFT JOIN {role_assignments} ra ON ra.userid = u.id AND ra.contextid = ctx.id AND ra.roleid = 5
LEFT JOIN {course_completions} cc ON cc.course = c.id AND cc.userid = u.id

WHERE 
    c.category = %%FILTER_CATEGORY:int%%
    AND c.visible = 1

GROUP BY c.id, c.shortname, c.fullname, c.category, cat.name
ORDER BY completion_rate DESC, total_students DESC;

-- ==========================================================================

-- CONSULTA 2: CONCLUSÕES POR PERÍODO (Dados de Tempo)
-- Relatório ID: 201  
-- Tamanho esperado: ~1k-5k linhas (filtrado por datas)
SELECT 
    c.id as course_id,
    c.fullname as course_name,
    u.id as user_id,
    CONCAT(u.firstname, ' ', u.lastname) as user_fullname,
    u.email,
    
    -- DADOS DE CONCLUSÃO
    cc.timecompleted,
    FROM_UNIXTIME(cc.timecompleted, '%Y-%m-%d') as completion_date,
    FROM_UNIXTIME(cc.timecompleted, '%Y-%m') as completion_month,
    
    -- TEMPO NO CURSO
    ROUND((cc.timecompleted - ue.timecreated) / 86400.0, 1) as days_to_complete,
    
    -- CLASSIFICAÇÃO DE TEMPO
    CASE 
        WHEN (cc.timecompleted - ue.timecreated) <= 604800 THEN 'FAST_1_WEEK'      -- 7 dias
        WHEN (cc.timecompleted - ue.timecreated) <= 2592000 THEN 'NORMAL_1_MONTH'  -- 30 dias
        WHEN (cc.timecompleted - ue.timecreated) <= 7776000 THEN 'SLOW_3_MONTHS'   -- 90 dias
        ELSE 'VERY_SLOW'
    END as completion_speed

FROM {course_completions} cc
JOIN {course} c ON c.id = cc.course
JOIN {user} u ON u.id = cc.userid
JOIN {user_enrolments} ue ON ue.userid = u.id
JOIN {enrol} e ON e.id = ue.enrolid AND e.courseid = c.id

WHERE 
    c.category = %%FILTER_CATEGORY:int%%
    AND c.visible = 1
    AND u.deleted = 0
    AND cc.timecompleted IS NOT NULL
    AND cc.timecompleted >= %%FILTER_START_DATE:timestamp%%
    AND cc.timecompleted <= %%FILTER_END_DATE:timestamp%%

ORDER BY cc.timecompleted DESC, c.fullname, u.lastname;

-- ==========================================================================

-- CONSULTA 3: ESTUDANTES ATIVOS (Dados de Progresso)
-- Relatório ID: 202
-- Tamanho esperado: ~2k-10k linhas (apenas ativos)
SELECT 
    c.id as course_id,
    c.fullname as course_name,
    u.id as user_id,
    CONCAT(u.firstname, ' ', u.lastname) as user_fullname,
    u.email,
    u.city,
    u.lastaccess,
    FROM_UNIXTIME(u.lastaccess, '%Y-%m-%d %H:%i') as last_login,
    
    -- STATUS DA INSCRIÇÃO
    ue.status as enrollment_status,
    FROM_UNIXTIME(ue.timecreated, '%Y-%m-%d') as enrollment_date,
    ROUND((UNIX_TIMESTAMP() - ue.timecreated) / 86400.0, 0) as days_enrolled,
    
    -- PROGRESSO NO CURSO
    COALESCE((
        SELECT COUNT(*) 
        FROM {course_modules_completion} cmc 
        JOIN {course_modules} cm ON cm.id = cmc.coursemoduleid 
        WHERE cm.course = c.id AND cmc.userid = u.id AND cmc.completionstate > 0
    ), 0) as activities_completed,
    
    -- TOTAL DE ATIVIDADES DO CURSO
    (SELECT COUNT(*) 
     FROM {course_modules} cm 
     WHERE cm.course = c.id AND cm.visible = 1
    ) as total_activities,
    
    -- PERCENTUAL DE PROGRESSO
    ROUND(
        (COALESCE((
            SELECT COUNT(*) 
            FROM {course_modules_completion} cmc 
            JOIN {course_modules} cm ON cm.id = cmc.coursemoduleid 
            WHERE cm.course = c.id AND cmc.userid = u.id AND cmc.completionstate > 0
        ), 0) * 100.0) / NULLIF((
            SELECT COUNT(*) 
            FROM {course_modules} cm 
            WHERE cm.course = c.id AND cm.visible = 1
        ), 0), 1
    ) as progress_percentage,
    
    -- STATUS DO ESTUDANTE
    CASE 
        WHEN cc.timecompleted IS NOT NULL THEN 'COMPLETED'
        WHEN ue.status = 1 THEN 'SUSPENDED'
        WHEN u.lastaccess < (UNIX_TIMESTAMP() - 2592000) THEN 'INACTIVE_30_DAYS'
        WHEN u.lastaccess < (UNIX_TIMESTAMP() - 604800) THEN 'INACTIVE_1_WEEK'
        ELSE 'ACTIVE'
    END as student_status

FROM {user_enrolments} ue
JOIN {enrol} e ON e.id = ue.enrolid
JOIN {course} c ON c.id = e.courseid
JOIN {user} u ON u.id = ue.userid
JOIN {context} ctx ON ctx.instanceid = c.id AND ctx.contextlevel = 50
JOIN {role_assignments} ra ON ra.userid = u.id AND ra.contextid = ctx.id
LEFT JOIN {course_completions} cc ON cc.course = c.id AND cc.userid = u.id

WHERE 
    c.category = %%FILTER_CATEGORY:int%%
    AND c.visible = 1
    AND u.deleted = 0
    AND ra.roleid = 5  -- Apenas estudantes
    AND ue.status = 0  -- Apenas inscrições ativas
    AND cc.timecompleted IS NULL  -- Apenas não concluídos (ativos)

ORDER BY c.fullname, progress_percentage DESC, u.lastname;

-- ==========================================================================

-- CONSULTA 4: ANÁLISE DE ATIVIDADES (Detalhes por Módulo)
-- Relatório ID: 203
-- Tamanho esperado: ~500-2k linhas (atividades por curso)
SELECT 
    c.id as course_id,
    c.fullname as course_name,
    cm.id as module_id,
    
    -- TIPO DA ATIVIDADE
    m.name as module_type,
    CASE cm.module
        WHEN 1 THEN (SELECT name FROM {assign} WHERE id = cm.instance)
        WHEN 16 THEN (SELECT name FROM {quiz} WHERE id = cm.instance)
        WHEN 20 THEN (SELECT name FROM {scorm} WHERE id = cm.instance)
        WHEN 15 THEN (SELECT name FROM {page} WHERE id = cm.instance)
        WHEN 17 THEN (SELECT name FROM {resource} WHERE id = cm.instance)
        ELSE CONCAT('Module_', cm.module, '_', cm.instance)
    END as activity_name,
    
    cm.visible as is_visible,
    cm.completion as completion_tracking,
    
    -- ESTATÍSTICAS DA ATIVIDADE
    COUNT(DISTINCT ue.userid) as enrolled_students,
    COUNT(DISTINCT cmc.userid) as students_completed,
    ROUND((COUNT(DISTINCT cmc.userid) * 100.0) / 
          NULLIF(COUNT(DISTINCT ue.userid), 0), 1) as completion_rate,
    
    -- DADOS DE QUIZ (se aplicável)
    CASE WHEN cm.module = 16 THEN
        (SELECT ROUND(AVG(qa.sumgrades), 2) 
         FROM {quiz_attempts} qa 
         WHERE qa.quiz = cm.instance AND qa.state = 'finished')
    END as avg_quiz_grade,
    
    CASE WHEN cm.module = 16 THEN
        (SELECT COUNT(*) 
         FROM {quiz_attempts} qa 
         WHERE qa.quiz = cm.instance)
    END as total_quiz_attempts,
    
    -- ORDEM NO CURSO
    cm.section as course_section

FROM {course} c
JOIN {course_modules} cm ON cm.course = c.id
JOIN {modules} m ON m.id = cm.module
LEFT JOIN {user_enrolments} ue ON ue.enrolid IN (
    SELECT id FROM {enrol} WHERE courseid = c.id
)
LEFT JOIN {course_modules_completion} cmc ON cmc.coursemoduleid = cm.id 
    AND cmc.userid = ue.userid AND cmc.completionstate > 0

WHERE 
    c.category = %%FILTER_CATEGORY:int%%
    AND c.visible = 1
    AND cm.visible = 1

GROUP BY c.id, c.fullname, cm.id, m.name, cm.module, cm.instance, 
         cm.visible, cm.completion, cm.section

ORDER BY c.fullname, cm.section, completion_rate DESC;