import React, { useState } from 'react';
import type { Acompanhamento } from '@/types/moodle';

interface CreateAcompanhamentoModalProps {
  onClose: () => void;
  onCreate: (dados: { nome: string; descricao: string; cursos: any[] }) => void;
  availableCourses: any[];
  editingData?: Acompanhamento | null;
}

export function CreateAcompanhamentoModal({ 
  onClose, 
  onCreate, 
  availableCourses, 
  editingData 
}: CreateAcompanhamentoModalProps) {
  // Estados iniciais baseados nos dados de edição ou valores padrão
  const [nome, setNome] = useState(editingData?.nome || '');
  const [descricao, setDescricao] = useState(editingData?.descricao || '');
  const [selectedCourses, setSelectedCourses] = useState<any[]>(editingData?.cursos || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedCourse, setDraggedCourse] = useState<any>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [hoveredCourse, setHoveredCourse] = useState<string | null>(null);

  // Debug: log para verificar estrutura dos cursos
  console.log('📚 Available courses:', availableCourses.length, 'total');
  if (availableCourses.length > 0) {
    console.log('📖 Sample course:', availableCourses[0]);
    console.log('🔍 Course fields:', Object.keys(availableCourses[0]));
  }

  const filteredCourses = availableCourses.filter(course => {
    const isAlreadySelected = selectedCourses.some(c => c.courseid === course.courseid);
    const matchesSearch = course.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.shortname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.course_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.course_shortname?.toLowerCase().includes(searchTerm.toLowerCase());
    return !isAlreadySelected && matchesSearch;
  });

  const handleDragStart = (e: React.DragEvent, course: any) => {
    setDraggedCourse(course);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedCourse(null);
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Só remove o highlight se realmente saiu da drop zone
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (draggedCourse) {
      // Priorizar o nome real do curso ao invés de "Curso X"
      const courseName = draggedCourse.course_name || 
                        draggedCourse.course_fullname ||
                        draggedCourse.fullname ||
                        draggedCourse.nome || 
                        draggedCourse.shortname || 
                        draggedCourse.course_shortname || 
                        `Curso ${draggedCourse.courseid}`;
      
      const newCourse = {
        ...draggedCourse,
        id: `${draggedCourse.courseid}-${Date.now()}`, // ID único para reordenação
        nome: courseName, // Nome real do curso como principal
        relatorios: [],
        ativo: true
      };
      
      setSelectedCourses(prev => [...prev, newCourse]);
      setDraggedCourse(null);
      
      // Som de sucesso para novo curso
      playSound('success');
      
      // Efeito visual borrachudo na área de drop
      const dropArea = e.currentTarget as HTMLElement;
      dropArea.style.transform = 'scale(1.05)';
      dropArea.style.background = 'linear-gradient(45deg, #10b981, #3b82f6)';
      
      setTimeout(() => {
        dropArea.style.transform = '';
        dropArea.style.background = '';
      }, 400);
    }
  };

  const handleRemoveCourse = (courseId: string) => {
    console.log('🗑️ Removendo curso:', courseId);
    setSelectedCourses(prev => {
      const newCourses = prev.filter(c => c.id !== courseId);
      console.log('📝 Cursos restantes:', newCourses.length);
      return newCourses;
    });
  };

  // Handle drop back to available list (remove from selected)
  const handleDropBackToAvailable = (e: React.DragEvent) => {
    e.preventDefault();
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      
      if (data.type === 'selected' && data.course) {
        setSelectedCourses(prev => prev.filter(c => c.id !== data.course.id));
      }
    } catch (error) {
      console.error('Erro no drop back:', error);
    }
  };

  // Estados para animações e feedback
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [dragOverY, setDragOverY] = useState<number | null>(null);

  // Feedback sonoro mais suave e orgânico
  const playSound = (type: 'drop' | 'pickup' | 'success') => {
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      // Volume baixo e suave
      const baseVolume = 0.03;
      
      if (type === 'pickup') {
        // Som suave de "pegar"
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(550, context.currentTime + 0.15);
        gainNode.gain.setValueAtTime(baseVolume, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.15);
        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.15);
      } else if (type === 'drop') {
        // Som suave de "encaixe"
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(330, context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(220, context.currentTime + 0.2);
        gainNode.gain.setValueAtTime(baseVolume, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.2);
        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.2);
      } else if (type === 'success') {
        // Som satisfatório mas suave de sucesso
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(330, context.currentTime); // E4
        oscillator.frequency.setValueAtTime(415, context.currentTime + 0.1); // G#4
        oscillator.frequency.setValueAtTime(523, context.currentTime + 0.2); // C5
        gainNode.gain.setValueAtTime(baseVolume * 1.5, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.3);
        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.3);
      }
    } catch (error) {
      console.log('Audio não suportado:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nome.trim()) {
      onCreate({ 
        nome: nome.trim(), 
        descricao: descricao.trim(),
        cursos: selectedCourses.map(course => ({
          courseid: course.courseid,
          nome: course.nome,
          relatorios: course.relatorios || [],
          ativo: course.ativo !== false
        }))
      });
    }
  };

  const courseColors = [
    'from-blue-500 to-blue-600',
    'from-green-500 to-green-600', 
    'from-purple-500 to-purple-600',
    'from-orange-500 to-orange-600',
    'from-pink-500 to-pink-600',
    'from-indigo-500 to-indigo-600',
    'from-teal-500 to-teal-600',
    'from-red-500 to-red-600'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {editingData ? '✏️ Editar Acompanhamento' : '✨ Criar Novo Acompanhamento'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Arraste os cursos para adicionar ao seu acompanhamento
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-1 overflow-hidden">
          {/* Painel esquerdo - Informações básicas e cursos selecionados */}
          <div className="w-1/3 p-6 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="space-y-4 mb-6">
              <div>
                <label htmlFor="nome" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  📝 Nome do Acompanhamento *
                </label>
                <input
                  id="nome"
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                  placeholder="Ex: Capacitação Judicial 2025"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="descricao" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  📄 Descrição
                </label>
                <textarea
                  id="descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 resize-none"
                  placeholder="Descrição opcional do acompanhamento..."
                />
              </div>
            </div>

            {/* Área de Drop - Cursos Selecionados */}
            <div className="flex-1 flex flex-col min-h-0">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                🎯 Cursos Selecionados ({selectedCourses.length})
              </h3>
              
              <div
                className={`flex-1 border-3 border-dashed rounded-xl p-4 transition-all duration-500 overflow-hidden flex flex-col ${
                  isDragOver 
                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 scale-105 shadow-2xl transform rotate-1' 
                    : selectedCourses.length === 0
                      ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30'
                      : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/50'
                }`}
                style={{
                  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  transformOrigin: 'center',
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {selectedCourses.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                    <div className="text-4xl mb-3">🎯</div>
                    <p className="text-center font-medium">Arraste cursos aqui</p>
                    <p className="text-xs text-center mt-1">Os cursos aparecerão na ordem que você adicionar</p>
                  </div>
                ) : (
                  <div className="flex flex-col flex-1 min-h-0">
                    <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                      <div className="space-y-3">
                        {selectedCourses.map((course, index) => (
                          <div key={course.id} className="relative">
                            {/* Espaço que se abre quando arrasta por cima */}
                            {dropTargetIndex === index && draggedIndex !== null && draggedIndex !== index && (
                              <div className="h-16 bg-blue-200 dark:bg-blue-800 border-2 border-dashed border-blue-400 rounded-xl mb-3 flex items-center justify-center animate-pulse">
                                <span className="text-blue-600 dark:text-blue-300 text-sm font-medium">
                                  ↓ Solte aqui ↓
                                </span>
                              </div>
                            )}
                            
                            <div
                              className={`group relative bg-gradient-to-r ${courseColors[index % courseColors.length]} p-4 rounded-xl text-white shadow-lg transform transition-all duration-300 ease-out cursor-move select-none ${
                                draggedIndex === index 
                                  ? 'opacity-50 scale-95 rotate-3 z-50' // Item sendo arrastado fica semi-transparente
                                  : dropTargetIndex === index
                                    ? 'scale-105 shadow-2xl'
                                    : 'hover:scale-102 hover:shadow-xl'
                              }`}
                              style={{
                                transformOrigin: 'center',
                                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                              }}
                              draggable
                              onDragStart={(e) => {
                                console.log('🏁 Iniciando drag do curso:', course.nome, 'índice:', index);
                                setIsDragging(true);
                                setDraggedIndex(index);
                                playSound('pickup');
                                
                                e.dataTransfer.setData('text/plain', JSON.stringify({
                                  type: 'selected',
                                  courseId: course.id,
                                  index: index,
                                  course: course
                                }));
                                e.dataTransfer.effectAllowed = 'move';
                              }}
                              onDragEnd={() => {
                                console.log('🏁 Finalizando drag');
                                setIsDragging(false);
                                setDraggedIndex(null);
                                setDropTargetIndex(null);
                                setDragOverY(null);
                              }}
                              onDragOver={(e) => {
                                e.preventDefault();
                                if (draggedIndex !== null && draggedIndex !== index) {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const y = e.clientY;
                                  const middle = rect.top + rect.height / 2;
                                  
                                  // Determina se vai inserir antes ou depois baseado na posição do mouse
                                  if (y < middle) {
                                    setDropTargetIndex(index);
                                  } else {
                                    setDropTargetIndex(index + 1);
                                  }
                                  setDragOverY(y);
                                }
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                
                                try {
                                  const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                                  console.log('🎯 Drop sobre curso:', course.nome, 'índice atual:', index);
                                  
                                  if (data.type === 'selected' && data.index !== undefined && data.index !== index) {
                                    const newSelected = [...selectedCourses];
                                    const draggedCourse = newSelected[data.index];
                                    
                                    // Remove o curso da posição original
                                    newSelected.splice(data.index, 1);
                                    
                                    // Determina a posição de inserção
                                    let insertIndex = index;
                                    if (data.index < index) {
                                      insertIndex = index - 1;
                                    }
                                    if (dropTargetIndex !== null && dropTargetIndex <= selectedCourses.length) {
                                      insertIndex = dropTargetIndex;
                                      if (data.index < dropTargetIndex) {
                                        insertIndex = dropTargetIndex - 1;
                                      }
                                    }
                                    
                                    // Garante que o índice esteja dentro dos limites
                                    insertIndex = Math.max(0, Math.min(insertIndex, newSelected.length));
                                    
                                    newSelected.splice(insertIndex, 0, draggedCourse);
                                    
                                    console.log('🔄 Nova ordem:', newSelected.map((c, i) => `${i+1}. ${c.nome}`));
                                    setSelectedCourses(newSelected);
                                    playSound('success');
                                  }
                                } catch (error) {
                                  console.error('Erro no drop:', error);
                                }
                                
                                // Reset dos estados
                                setDropTargetIndex(null);
                                setDragOverY(null);
                              }}
                              onClick={(e) => {
                                if (isDragging) {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }
                              }}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 pr-3">
                                  <div className="font-semibold text-base leading-tight mb-2 line-clamp-2">
                                    {course.nome}
                                  </div>
                                  <div className="text-xs opacity-90">
                                    ID: {course.courseid}
                                  </div>
                                </div>
                                
                                {/* Botão de remoção */}
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleRemoveCourse(course.id);
                                    playSound('drop');
                                  }}
                                  className="flex items-center justify-center w-7 h-7 bg-red-500 hover:bg-red-600 rounded-lg transition-all duration-200 hover:scale-110 text-white font-bold text-sm shadow-lg z-20"
                                  type="button"
                                  title="Remover curso"
                                >
                                  🗑️
                                </button>
                              </div>
                              
                              {/* Indicador de posição */}
                              <div className={`absolute top-2 left-2 bg-black bg-opacity-30 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold text-white border border-white border-opacity-20 transition-all duration-300 ${
                                draggedIndex === index ? 'bg-yellow-500 animate-pulse' : ''
                              }`}>
                                {index + 1}
                              </div>
                              
                              {/* Indicador visual quando está sendo arrastado */}
                              {draggedIndex === index && (
                                <div className="absolute inset-0 border-2 border-dashed border-yellow-300 rounded-xl animate-pulse pointer-events-none">
                                </div>
                              )}
                            </div>
                            
                            {/* Espaço que se abre no final da lista */}
                            {index === selectedCourses.length - 1 && dropTargetIndex === selectedCourses.length && draggedIndex !== null && (
                              <div className="h-16 bg-blue-200 dark:bg-blue-800 border-2 border-dashed border-blue-400 rounded-xl mt-3 flex items-center justify-center animate-pulse">
                                <span className="text-blue-600 dark:text-blue-300 text-sm font-medium">
                                  ↓ Solte aqui ↓
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {isDragOver && (
                      <div className="border-2 border-dashed border-blue-400 bg-blue-100 dark:bg-blue-900/30 rounded-xl p-4 text-center text-blue-600 dark:text-blue-400 animate-pulse mt-3">
                        <div className="text-2xl mb-1">⬇️</div>
                        <p className="text-sm font-medium">Solte aqui para adicionar</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Painel direito - Lista de cursos disponíveis */}
          <div className="flex-1 p-6 flex flex-col">
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                🔍 Buscar Cursos Disponíveis
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Digite para buscar cursos..."
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
              />
            </div>

            {/* Lista de cursos disponíveis */}
            <div 
              className="flex-1 overflow-y-auto border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl p-2 transition-all duration-200"
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add('border-red-400', 'bg-red-50', 'dark:bg-red-900/20');
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove('border-red-400', 'bg-red-50', 'dark:bg-red-900/20');
              }}
              onDrop={(e) => {
                e.currentTarget.classList.remove('border-red-400', 'bg-red-50', 'dark:bg-red-900/20');
                handleDropBackToAvailable(e);
              }}
            >
              {filteredCourses.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                  <div className="text-4xl mb-3">📚</div>
                  <p className="text-center font-medium">
                    {searchTerm ? 'Nenhum curso encontrado' : availableCourses.length === selectedCourses.length ? 'Todos os cursos foram adicionados' : 'Digite para buscar cursos'}
                  </p>
                  <p className="text-xs text-center mt-2 text-gray-400">
                    Arraste cursos selecionados aqui para removê-los
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredCourses.map((course) => (
                    <div
                      key={course.courseid}
                      className={`group relative bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl p-4 cursor-grab active:cursor-grabbing transition-all duration-300 ${
                        draggedCourse?.courseid === course.courseid 
                          ? 'opacity-40 scale-90 rotate-6 shadow-2xl border-blue-500' 
                          : 'hover:border-blue-400 hover:shadow-xl hover:scale-105 hover:-translate-y-2 hover:rotate-1'
                      } ${hoveredCourse === course.courseid ? 'border-blue-400 shadow-xl scale-105' : ''}`}
                      style={{
                        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Efeito borrachudo
                        transformOrigin: 'center',
                      }}
                      draggable
                      onDragStart={(e) => {
                        handleDragStart(e, course);
                        playSound('pickup');
                        
                        // Efeito visual no curso sendo arrastado
                        if (e.currentTarget) {
                          e.currentTarget.style.transform = 'scale(1.1) rotate(-3deg)';
                          setTimeout(() => {
                            if (e.currentTarget) {
                              e.currentTarget.style.transform = '';
                            }
                          }, 200);
                        }
                      }}
                      onDragEnd={() => {
                        handleDragEnd();
                        playSound('drop');
                      }}
                      onMouseEnter={() => {
                        setHoveredCourse(course.courseid);
                        // Efeito sutil de entrada
                        const element = document.querySelector(`[data-course-id="${course.courseid}"]`) as HTMLElement;
                        if (element) {
                          element.style.transform = 'scale(1.02)';
                        }
                      }}
                      onMouseLeave={() => {
                        setHoveredCourse(null);
                        // Reset do efeito
                        const element = document.querySelector(`[data-course-id="${course.courseid}"]`) as HTMLElement;
                        if (element) {
                          element.style.transform = '';
                        }
                      }}
                      data-course-id={course.courseid}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 dark:text-white text-base leading-tight mb-2">
                            {course.nome}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            ID: {course.courseid}
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-blue-500">
                          <div className="text-lg">⤴️</div>
                        </div>
                      </div>
                      
                      {/* Indicador visual de drag */}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-200"></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </form>
        
        {/* Footer com botões */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <div>💡 Arraste cursos da direita para a esquerda para selecioná-los</div>
            <div>🔄 Arraste um curso sobre outro para trocar as posições</div>
            <div>🗑️ Arraste cursos selecionados de volta para a direita para removê-los</div>
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 transition-all duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={!nome.trim()}
              className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {editingData ? '✏️ Salvar Alterações' : '✨ Criar Acompanhamento'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
