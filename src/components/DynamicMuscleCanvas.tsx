import React, { useRef } from 'react';
import { useDynamicMusclePoints } from '../hooks/useDynamicMusclePoints';
import { MusclePoint } from '../constants/muscleCoordinates';

interface DynamicMuscleCanvasProps {
  muscleType: 'front' | 'back';
  containerWidth: number;
  containerHeight: number;
  backgroundImage?: string;
}

export const DynamicMuscleCanvas: React.FC<DynamicMuscleCanvasProps> = ({
  muscleType,
  containerWidth,
  containerHeight,
  backgroundImage
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { 
    frontMuscles, 
    backMuscles, 
    handleMuscleClick, 
    clearSelections, 
    selectedMuscle,
    resetMusclePoint 
  } = useDynamicMusclePoints();

  const muscles = muscleType === 'front' ? frontMuscles : backMuscles;

  const handleCanvasClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    handleMuscleClick({ x, y }, muscleType);
  };

  const renderMusclePoint = (muscle: MusclePoint) => {
    if (!muscle.point) return null;

    return (
      <div
        key={`point-${muscle.id}`}
        className={`absolute w-2 h-2 rounded-full transform -translate-x-1 -translate-y-1 transition-all duration-200 ${
          muscle.isSelected 
            ? 'bg-red-500 ring-2 ring-red-300 ring-opacity-50 scale-125' 
            : 'bg-blue-500 hover:bg-blue-600'
        }`}
        style={{
          left: `${muscle.point.x}%`,
          top: `${muscle.point.y}%`,
          zIndex: 10
        }}
        title={muscle.name}
      />
    );
  };

  const renderMuscleArea = (muscle: MusclePoint) => {
    if (!muscle.areaPoints || muscle.areaPoints.length < 3) return null;

    const pathData = muscle.areaPoints
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ') + ' Z';

    return (
      <polygon
        key={`area-${muscle.id}`}
        points={muscle.areaPoints.map(p => `${p.x},${p.y}`).join(' ')}
        className={`transition-all duration-200 ${
          muscle.isDynamic 
            ? 'fill-blue-100 fill-opacity-30 stroke-blue-300 stroke-1 hover:fill-opacity-50 cursor-pointer' 
            : 'fill-gray-100 fill-opacity-20 stroke-gray-300 stroke-1'
        }`}
        strokeDasharray={muscle.isDynamic ? '2,2' : 'none'}
      />
    );
  };

  const renderMuscleLines = (muscle: MusclePoint) => {
    if (!muscle.point || !muscle.linePoints || muscle.linePoints.length < 2) return null;

    const pathData = muscle.linePoints
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');

    return (
      <path
        key={`line-${muscle.id}`}
        d={pathData}
        className={`transition-all duration-200 ${
          muscle.isSelected 
            ? 'stroke-red-500 stroke-1' 
            : 'stroke-blue-400 stroke-1'
        }`}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  };

  const renderMuscleLabel = (muscle: MusclePoint) => {
    if (!muscle.point || !muscle.text) return null;

    return (
      <div
        key={`label-${muscle.id}`}
        className={`absolute text-xs font-bold transition-all duration-200 ${
          muscle.isSelected 
            ? 'text-red-600 font-black' 
            : 'text-blue-600'
        }`}
        style={{
          left: `${muscle.text.x}%`,
          top: `${muscle.text.y}%`,
          transform: 'translate(-50%, -50%)',
          zIndex: 5
        }}
      >
        {muscle.name}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* 컨트롤 버튼들 */}
      <div className="flex space-x-2">
        <button
          onClick={clearSelections}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        >
          모든 선택 해제
        </button>
        {selectedMuscle && (
          <button
            onClick={() => resetMusclePoint(selectedMuscle, muscleType)}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
          >
            선택된 포인트 리셋
          </button>
        )}
      </div>

      {/* 현재 선택된 근육 표시 */}
      {selectedMuscle && (
        <div className="text-sm text-gray-600">
          선택된 근육: <span className="font-semibold text-blue-600">{muscles[selectedMuscle]?.name}</span>
        </div>
      )}

      {/* 캔버스 영역 */}
      <div
        ref={canvasRef}
        className="relative border border-gray-300 rounded-lg overflow-hidden cursor-crosshair"
        style={{ 
          width: containerWidth, 
          height: containerHeight,
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center'
        }}
        onClick={handleCanvasClick}
      >
        {/* SVG 오버레이 */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {Object.values(muscles).map(renderMuscleArea)}
          {Object.values(muscles).map(renderMuscleLines)}
        </svg>

        {/* 포인트들 */}
        {Object.values(muscles).map(renderMusclePoint)}
        
        {/* 라벨들 */}
        {Object.values(muscles).map(renderMuscleLabel)}
      </div>

      {/* 사용법 안내 */}
      <div className="text-sm text-gray-500 max-w-md text-center">
        <p>파란색 점선 영역은 동적 포인트 영역입니다.</p>
        <p>해당 영역을 클릭하면 포인트와 연결선이 클릭한 위치로 이동합니다.</p>
      </div>
    </div>
  );
};