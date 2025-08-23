/**
 * Função para extrair lista única de cursos dos dados do Report 134
 */
export const extractUniqueCoursesFromReport = (reportData: any[]): any[] => {
  if (!reportData || reportData.length === 0) return [];
  
  const coursesMap = new Map();
  
  reportData.forEach(record => {
    const courseId = record.course_id || record.courseid;
    if (courseId && !coursesMap.has(courseId)) {
      // Priorizar o nome do curso real ao invés de "Curso X"
      const realCourseName = record.course_name || 
                            record.course_fullname ||
                            record.fullname || 
                            record.nome ||
                            record.shortname ||
                            record.course_shortname;
      
      coursesMap.set(courseId, {
        courseid: courseId,
        nome: realCourseName || `Curso ${courseId}`, // Nome real do curso como principal
        shortname: record.course_shortname || record.shortname || `curso_${courseId}`,
        fullname: record.course_fullname || record.fullname || record.course_name || realCourseName
      });
    }
  });
  
  return Array.from(coursesMap.values()).sort((a, b) => 
    (a.nome || a.shortname).localeCompare(b.nome || b.shortname)
  );
};
