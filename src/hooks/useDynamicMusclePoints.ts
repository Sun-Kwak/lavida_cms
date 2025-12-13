import { useState, useCallback } from 'react';
import { 
  MusclePoint, 
  setMusclePoint, 
  clearAllSelections, 
  findMuscleAtPosition,
  frontMuscles as initialFrontMuscles,
  backMuscles as initialBackMuscles
} from '../constants/muscleCoordinates';

export interface UseDynamicMusclePointsReturn {
  frontMuscles: { [key: string]: MusclePoint };
  backMuscles: { [key: string]: MusclePoint };
  handleMuscleClick: (position: { x: number, y: number }, muscleType: 'front' | 'back') => void;
  clearSelections: () => void;
  selectedMuscle: string | null;
  resetMusclePoint: (muscleId: string, muscleType: 'front' | 'back') => void;
}

export const useDynamicMusclePoints = (): UseDynamicMusclePointsReturn => {
  const [frontMuscles, setFrontMuscles] = useState<{ [key: string]: MusclePoint }>(initialFrontMuscles);
  const [backMuscles, setBackMuscles] = useState<{ [key: string]: MusclePoint }>(initialBackMuscles);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

  const handleMuscleClick = useCallback((position: { x: number, y: number }, muscleType: 'front' | 'back') => {
    const currentMuscles = muscleType === 'front' ? frontMuscles : backMuscles;
    const setMuscles = muscleType === 'front' ? setFrontMuscles : setBackMuscles;
    
    // 클릭된 위치에 있는 근육 찾기
    const clickedMuscleId = findMuscleAtPosition(position, currentMuscles);
    
    if (clickedMuscleId) {
      const clickedMuscle = currentMuscles[clickedMuscleId];
      
      // 동적 근육인 경우에만 포인트 설정
      if (clickedMuscle.isDynamic) {
        // 모든 선택 해제 후 새로운 포인트 설정
        const clearedMuscles = clearAllSelections(currentMuscles);
        const updatedMuscles = setMusclePoint(clickedMuscleId, position, clearedMuscles);
        
        if (updatedMuscles) {
          setMuscles(updatedMuscles);
          setSelectedMuscle(clickedMuscleId);
        }
      } else {
        // 정적 근육인 경우 단순히 선택만 변경
        const clearedMuscles = clearAllSelections(currentMuscles);
        setMuscles({
          ...clearedMuscles,
          [clickedMuscleId]: {
            ...clearedMuscles[clickedMuscleId],
            isSelected: true
          }
        });
        setSelectedMuscle(clickedMuscleId);
      }
    } else {
      // 빈 공간 클릭시 모든 선택 해제
      clearSelections();
    }
  }, [frontMuscles, backMuscles]);

  const clearSelections = useCallback(() => {
    setFrontMuscles(clearAllSelections(frontMuscles));
    setBackMuscles(clearAllSelections(backMuscles));
    setSelectedMuscle(null);
  }, [frontMuscles, backMuscles]);

  const resetMusclePoint = useCallback((muscleId: string, muscleType: 'front' | 'back') => {
    const currentMuscles = muscleType === 'front' ? frontMuscles : backMuscles;
    const setMuscles = muscleType === 'front' ? setFrontMuscles : setBackMuscles;
    const originalMuscles = muscleType === 'front' ? initialFrontMuscles : initialBackMuscles;
    
    const muscle = currentMuscles[muscleId];
    const originalMuscle = originalMuscles[muscleId];
    if (muscle && muscle.isDynamic && originalMuscle) {
      setMuscles({
        ...currentMuscles,
        [muscleId]: {
          ...muscle,
          point: originalMuscle.point, // 원래 기본값으로 복원
          linePoints: originalMuscle.linePoints, // 원래 라인포인트로 복원
          isSelected: false
        }
      });
      
      if (selectedMuscle === muscleId) {
        setSelectedMuscle(null);
      }
    }
  }, [frontMuscles, backMuscles, selectedMuscle]);

  return {
    frontMuscles,
    backMuscles,
    handleMuscleClick,
    clearSelections,
    selectedMuscle,
    resetMusclePoint
  };
};