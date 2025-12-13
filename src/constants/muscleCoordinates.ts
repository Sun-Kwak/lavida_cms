// 근육 좌표 데이터 관리 파일 (마우스 좌표 기준)
// 좌표는 컨테이너 기준 퍼센트 값 (0-100) 입니다. 마우스 좌표와 동일한 기준.

// 포인트가 다각형 영역 내부에 있는지 확인하는 함수 (Ray casting algorithm)
export const isPointInPolygon = (point: { x: number, y: number }, polygon: { x: number, y: number }[]): boolean => {
  let isInside = false;
  const { x, y } = point;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      isInside = !isInside;
    }
  }
  
  return isInside;
};

// 근육 포인트를 동적으로 설정하는 함수
export const setMusclePoint = (
  muscleId: string,
  clickPosition: { x: number, y: number },
  muscles: { [key: string]: MusclePoint }
): { [key: string]: MusclePoint } | null => {
  const muscle = muscles[muscleId];
  if (!muscle) return null;
  
  // 클릭 위치가 areaPoints 내부에 있는지 확인
  if (!isPointInPolygon(clickPosition, muscle.areaPoints)) {
    return null; // 영역 외부 클릭은 무시
  }
  
  // 기존 linePoints의 고정 부분은 유지하고 마지막 포인트만 변경
  const updatedLinePoints = [...muscle.linePoints];
  if (updatedLinePoints.length > 0) {
    updatedLinePoints[updatedLinePoints.length - 1] = clickPosition;
  }
  
  return {
    ...muscles,
    [muscleId]: {
      ...muscle,
      point: clickPosition,
      linePoints: updatedLinePoints,
      isSelected: true,
      isDynamic: true
    }
  };
};

// 모든 근육의 선택 상태를 해제하는 함수
export const clearAllSelections = (muscles: { [key: string]: MusclePoint }): { [key: string]: MusclePoint } => {
  const updatedMuscles: { [key: string]: MusclePoint } = {};
  
  Object.keys(muscles).forEach(key => {
    updatedMuscles[key] = {
      ...muscles[key],
      isSelected: false
    };
  });
  
  return updatedMuscles;
};

// 특정 근육이 클릭된 영역에 있는지 확인하는 함수
export const findMuscleAtPosition = (
  position: { x: number, y: number },
  muscles: { [key: string]: MusclePoint }
): string | null => {
  for (const [muscleId, muscle] of Object.entries(muscles)) {
    if (isPointInPolygon(position, muscle.areaPoints)) {
      return muscleId;
    }
  }
  return null;
};

export interface MusclePoint {
  id: string;
  name: string;
  point: { x: number, y: number }; // 항상 존재하는 포인트
  linePoints: { x: number, y: number }[];
  areaPoints: { x: number, y: number }[];
  textBox: { x: number, y: number, width: number, height: number };
  text: { x: number, y: number };
  isSelected?: boolean; // 선택 상태 표시
  isDynamic?: boolean; // 동적 포인트 여부 (true면 클릭으로 변경 가능)
}

// 2페이지 - 전면 근육들 (이미지 분석 기반으로 조정)
export const frontMuscles: { [key: string]: MusclePoint } = {
  // Head and facial muscles
  'frontalis': {
    id: 'frontalis',
    name: 'Frontalis',
    point: { x: 53.0, y: 12.0 }, // 기본값 제공, 동적으로 변경 가능
    linePoints: [{ x: 82.0, y: 6.0 }, { x: 65.0, y: 6.0 }, { x: 53.0, y: 12.0 }], // 마지막 포인트는 클릭시 변경됨
    areaPoints: [{ x: 46.0, y: 11.0 }, { x: 54.0, y: 11.0 }, { x: 54.0, y: 13.5 }, { x: 46.0, y: 13.5 }],
    textBox: { x: 79, y: 4.5, width: 15.0, height: 3.0 },
    text: { x: 85.5, y: 6.0 },
    isDynamic: true,
    isSelected: false
  },
  'temporalis': {
    id: 'temporalis',
    name: 'Temporalis',
    point: { x: 55.5, y: 13.5 }, // 기본값 제공, 동적으로 변경 가능
    linePoints: [{ x: 82.0, y: 9.0 }, { x: 65.0, y: 9.0 }, { x: 55.5, y: 13.5 }], // 마지막 포인트는 클릭시 변경됨
    areaPoints: [{ x: 55, y: 12 }, { x: 56, y: 12 }, { x: 55, y: 15.5 }, { x: 56, y: 15.5 }],
    textBox: { x: 79, y: 7.5, width: 15, height: 3 },
    text: { x: 86, y: 9.0 },
    isDynamic: true,
    isSelected: false
  },
  'orbicularis_oculi': {
    id: 'orbicularis_oculi',
    name: 'Orbicularis oculi',
    point: { x: 53, y: 16 },
    linePoints: [{ x: 82, y: 12 }, { x: 65, y: 12 }, { x: 53, y: 16 }],
    areaPoints: [{ x: 45.5, y: 13.5 }, { x: 54.5, y: 13.5 }, { x: 54.5, y: 16.5 }, { x: 45.5, y: 16.5 }],
    textBox: { x: 79, y: 10.5, width: 15, height: 3 },
    text: { x: 88, y: 12.0 },
    isDynamic: true,
    isSelected: false
  },
    'facial muscles': {
    id: 'facial muscles',
    name: 'Facial muscles',
    point: { x: 48, y: 17.5 },
    linePoints: [{ x: 17, y: 12 }, { x: 34, y: 12 }, { x: 48, y: 17.5 }],
 areaPoints: [{ x: 45.5, y: 16.5 }, { x: 54.5, y: 16.5 }, { x: 54.5, y: 18 },{ x: 50, y: 19.5 },  { x: 45.5, y: 18 }],
    textBox: { x: 4.5, y: 10.5, width: 15, height: 3 },
    text: { x: 12, y: 12 },
    isDynamic: true,
    isSelected: false
  },
  'masseter': {
    id: 'masseter',
    name: 'Masseter',
    point: { x: 52, y: 20 },
    linePoints: [{ x: 82.0, y: 15.0 }, { x: 65.0, y: 15.0 }, { x: 52.0, y: 20 }],
     areaPoints: [{ x: 54.5, y: 18 },{ x: 50, y: 19.5 },  { x: 45.5, y: 18 },{ x: 45.5, y: 20 },{ x: 50, y: 21.5 },{ x: 54.5, y: 20 },],
    textBox: { x: 80, y: 13.5, width: 15, height: 3 },
    text: { x: 85.5, y: 15.0 },
    isDynamic: true,
    isSelected: false
  },

    'scalenes': {
    id: 'scalenes',
    name: 'Scalenes',
    point: { x: 53.5, y: 22.5 },
   linePoints: [{ x: 82.0, y: 18.0 }, { x: 65.0, y: 18.0 }, { x: 53.5, y: 22.5 }],
      areaPoints: [{ x: 52.5, y: 20.5 }, { x: 54, y: 20.5 }, { x: 54, y: 24 }, { x: 52.5, y: 24 }],
    textBox: { x: 80, y: 16.5, width: 12, height: 3 },
    text: { x: 85.5, y: 18 },
    isDynamic: true,
    isSelected: false
  },
  'sternocleidomastoid': {
    id: 'sternocleidomastoid',
    name: 'Sternocleidomastoid',
    point: { x: 47.5, y: 22.5 },
    linePoints: [{ x: 17, y: 15 }, { x: 34, y: 15 }, { x: 47.5, y: 22.5 }],
 areaPoints: [{ x: 45.5, y: 20 }, { x: 48, y: 21 }, { x: 49.5, y: 25.5 },{ x: 49, y: 25 },  { x: 46, y: 22.5 },{ x: 45.5, y: 20 },],
    textBox: { x: 3, y: 13.5, width: 15, height: 3 },
    text: { x: 10, y: 15 },
    isDynamic: true,
    isSelected: false
  },

  'deltoid': {
    id: 'deltoid',
    name: 'Deltoid',
    point: { x: 37, y: 25.5 }, // 기본값 제공, 동적으로 변경 가능
    linePoints: [{ x: 18, y: 20 }, { x: 28, y: 20 }, { x: 37, y: 25.5 }], // 마지막 포인트는 클릭시 변경됨
    areaPoints: [{ x: 45.5, y: 22.0 }, { x: 35.5, y: 25.5 }, { x: 34, y: 30 }, { x: 45.5, y: 24.5 }],
    textBox: { x: 8, y: 18.5, width: 12.0, height: 3.0 },
    text: { x: 14, y: 20 },
    isDynamic: true,
    isSelected: false
  },


  'coracobrachialis': {
    id: 'coracobrachialis',
    name: 'Coracobrachialis',
    point: { x: 62, y: 28 },
    linePoints: [{ x: 82, y: 26 }, { x: 65, y: 26 },{ x: 62, y: 28 }],
    areaPoints: [{ x: 61.5, y: 25.5 }, { x: 60.5, y: 29 }, { x: 62.5, y: 33 }, { x: 63, y: 28.5 }],
    textBox: { x: 80, y: 24.5, width: 18, height: 3 },
    text: { x: 87.8, y: 26 },
    isDynamic: true,
    isSelected: false
  },
  'serratus_anterior': {
    id: 'serratus_anterior',
    name: 'Serratus anterior',
    point: { x: 59.5, y: 31.5 },
    linePoints: [{ x: 82, y: 31.5 },{ x: 65, y: 31.5 },{ x: 59.5, y: 31.5 }],
    areaPoints: [{ x: 59.5, y: 29.5 }, { x: 58.5, y:  32}, { x: 60, y: 35 }, { x: 60, y: 32 }],
    textBox: { x: 80, y: 30.0, width: 18, height: 3 },
    text: { x: 87.8, y: 31.5 },
    isDynamic: true,
    isSelected: false
  },
    'sternalis': {
    id: 'sternalis',
    name: 'Sternalis',
    point: { x: 51.8, y: 28.1 },
    linePoints: [{ x: 82, y: 35.4 }, { x: 58.2, y: 35.4},{ x: 51.8, y: 28.1 } ],
    areaPoints: [{ x: 51.6, y: 25.3 }, { x: 51, y: 28.5 }, { x: 51.2, y: 32.5 },  { x: 52, y: 32.7 },{ x: 52.7, y: 28.5 }],
    textBox: { x: 80, y: 34, width: 12, height: 3 },
    text: { x: 85.3, y: 35.4 },
    isDynamic: true,
    isSelected: false
  },

    'brachialis': {
    id: 'brachialis',
    name: 'Brachialis',
    point: { x: 64.0, y: 37.5 },
    linePoints: [{ x: 82.0, y: 39 }, { x: 71.5, y: 39 }, { x: 64.0, y: 38 }],
    areaPoints: [{ x: 63.0, y: 31.0 }, { x: 61.8, y: 36.4 }, { x: 63.5, y: 39.6 }, { x: 65.0, y: 40.0 }, { x: 65.5, y: 36.0 }],
    textBox: { x: 80, y: 37.5, width: 12, height: 3 },
    text: { x: 85.8, y: 39 },
    isDynamic: true,
    isSelected: false
  },

    'pectoralis_major(R)': {
    id: 'pectoralis_major(R)',
    name: 'Pectoralis major(R)',
    point: { x: 43.0, y: 28.0 },
    linePoints: [{ x: 18, y: 28.0 },{ x: 30, y: 28.0 },{ x: 43.0, y: 28.0 } ],
    areaPoints: [{ x: 48, y: 24 }, { x: 38, y: 28 }, { x: 42.5, y: 33.5 }, { x: 44.5, y: 33.8 }, { x: 49.5, y: 32 }],
    textBox: { x: 6, y: 26.5, width: 12.0, height: 3.0 },
    text: { x: 12, y: 28 },
    isDynamic: true,
    isSelected: false
  },
    'pectoralis_major(L)': {
    id: 'pectoralis_major(L)',
    name: 'Pectoralis major(L)',
    point: { x: 58.5, y: 28.0 },
    linePoints: [{ x: 82, y: 22.0 },{ x: 65, y: 22.0 },{ x: 58.5, y: 28.0 } ],
    areaPoints: [{ x: 60.5, y: 25.3 }, { x: 54.5, y: 28.9 }, { x: 55.1, y: 32.1 }, { x: 57, y: 32.1 }, { x: 61.5, y: 25.3 }],
    textBox: { x: 81, y: 20.5, width: 18.0, height: 3.0 },
    text: { x: 88.8, y: 22 },
    isDynamic: true,
    isSelected: false
  },
  

  // Arms
  'biceps_brachii': {
    id: 'biceps_brachii',
    name: 'Biceps brachii',
    point: { x: 36.5, y: 32.5 },
    linePoints: [{ x: 18.0, y: 31 },{ x: 30.0, y: 31 },{ x: 36.5, y: 32.5 }, ],
    areaPoints: [{ x: 35.8, y: 29 }, { x: 34.6, y: 33 }, { x: 34, y: 37.5 }, { x: 37.0, y: 38.5 }, { x: 38, y: 34.0 }, { x: 38.5, y: 29.5 }, { x: 37.6, y: 28.3 }],
    textBox: { x: 6, y: 29.5, width: 12.0, height: 3.0 },
    text: { x: 12, y: 31 },
    isDynamic: true,
    isSelected: false
  },

  'flexor_digitorum_muscles': {
    id: 'flexor_digitorum_muscles',
    name: 'Flexor digitorum muscles',
    point: { x: 66, y: 43 },
    linePoints: [{ x: 82, y: 43 },{ x: 70, y: 43 },{ x: 66, y: 43 }, ],
    areaPoints: [{ x: 63, y: 39 }, { x: 63, y: 43 }, { x: 68, y: 49.6 }, { x: 71, y: 48.8 }, { x: 70, y: 45.8 }, { x: 68.1, y: 44.3 }, { x: 65.1, y: 40.0 }],
    textBox: { x: 81, y: 41.5, width: 18, height: 3 },
    text: { x: 90.5, y: 43 },
    isDynamic: true,
    isSelected: false
  },



  'rectus_abdominis': {
    id: 'rectus_abdominis',
    name: 'Rectus abdominis',
    point: { x: 47.5, y: 44.0 },
    linePoints: [{ x: 18.0, y: 44.0 },{ x: 35.0, y: 44.0 },{ x: 47.5, y: 44.0 }, ],
    areaPoints: [{ x: 50.0, y: 33.0 }, { x: 47.5, y: 33.8 }, { x: 46.0, y: 38.4 }, { x: 45.5, y: 49.0 }, { x: 50, y: 49.0 }],
    textBox: { x: 3.0, y: 42.5, width: 18.0, height: 3.0 },
    text: { x: 12.0, y: 44 },
    isDynamic: true,
    isSelected: false
  },

  'external_oblique': {
    id: 'external_oblique',
    name: 'External oblique',
    point: { x: 42.8, y: 40.5 },
    linePoints: [{ x: 18, y: 34 }, { x: 30, y: 34 }, { x: 42.8, y: 40.5 }],
    areaPoints: [{ x: 41.5, y: 32.5 }, { x: 40, y: 36.3 }, { x: 41, y: 41 }, { x: 40, y: 43.4 }, { x: 40.9, y: 45.5 }, { x: 45.5, y: 43.7 }, { x: 46.3, y: 36.2 }, { x: 48.8, y: 33.2 }, { x: 47.5, y: 33.9 }, { x: 46.1, y: 33.5 }, { x: 42.7, y: 33.7 }],
    textBox: { x: 3, y: 32.5, width: 18, height: 3 },
    text: { x: 12, y: 34 },
    isDynamic: true,
    isSelected: false
  },

  'pronator_teres': {
    id: 'pronator_teres',
    name: 'Pronator teres',
    point: { x: 34.6, y: 41.6 },
    linePoints: [{ x: 18, y: 37 }, { x: 30, y: 37 }, { x: 34.6, y: 41.6 }],
    areaPoints: [{ x: 37.7, y: 38.8 }, { x: 33.4, y: 41.7 }, { x: 31.0, y: 44.5 }, { x: 38, y: 40 }],
    textBox: { x: 4, y: 35.5, width: 16, height: 3 },
    text: { x: 12, y: 37 },
    isDynamic: true,
    isSelected: false
  },


  'brachioradialis': {
    id: 'brachioradialis',
    name: 'Brachioradialis',
    point: { x: 32, y: 41.3 },
    linePoints: [{ x: 18, y: 41.3 }, { x: 28, y: 41.3 }, { x: 32, y: 41.3 }],
    areaPoints: [{ x: 33.7, y: 37.6 }, { x: 30.7, y: 40.5 }, { x: 29.9, y: 44 }, { x: 30.4, y: 46.0 }, { x: 32.8, y: 42.0 }, { x: 34.8, y: 39.4 }],
    textBox: { x: 4, y: 39.8, width: 16, height: 3 },
    text: { x: 12, y: 41.3 },
    isDynamic: true,
    isSelected: false
  },




   'iliopsoas': {
    id: 'iliopsoas',
    name: 'Iliopsoas',
    point: { x: 55.4, y: 45.8 },
    linePoints: [{ x: 82, y: 45.8 }, { x: 70, y: 45.8 }, { x: 55.4, y: 45.8 }],
    areaPoints: [{ x: 52.1, y: 37.4 }, { x: 51.6, y: 45.2 }, { x: 57.8, y: 53.7 }, { x: 58.7, y: 53.1 }, { x: 57.9, y: 51.5 }, { x: 60, y: 44.5 }, { x: 56.4, y: 43.2 }, { x: 53.9, y: 38.7 }],
    textBox: { x: 79, y: 44.3, width: 12, height: 3 },
    text: { x: 85.5, y: 45.8 },
    isDynamic: true,
    isSelected: false
  },

    'pectineus': {
    id: 'pectineus',
    name: 'Pectineus',
    point: { x: 46.7, y: 51.7 },
    linePoints: [{ x: 82, y: 51.7 }, { x: 70, y: 51.7 }, { x: 46.7, y: 51.7 }],
    areaPoints: [{ x: 46.4, y: 50.7 }, { x: 44, y: 52.6 }, { x: 45.1, y: 54.3 }, { x: 48.7, y: 51.4 }],
    textBox: { x: 80, y: 50.2, width: 12, height: 3 },
    text: { x: 86, y: 51.7 },
    isDynamic: true,
    isSelected: false
  },

    'adductor_brevis': {
    id: 'adductor_brevis',
    name: 'Adductor brevis',
    point: { x: 56.1, y: 54.6 },
    linePoints: [{ x: 82, y: 54.6 }, { x: 70, y: 54.6 }, { x: 56.1, y: 54.6 }],
    areaPoints: [{ x: 53.6, y: 52.7 }, { x: 52.5, y: 53.2 }, { x: 57, y: 57.5 }, { x: 57.5, y: 54.1 }],
    textBox: { x: 81, y: 53.1, width: 12, height: 3 },
    text: { x: 88, y: 54.6 },
    isDynamic: true,
    isSelected: false
  },
  'adductor_longus': {
    id: 'adductor_longus',
    name: 'Adductor longus',
    point: { x: 55.2, y: 57.8 },
    linePoints: [{ x: 82, y: 57.8 }, { x: 70, y: 57.8 }, { x: 55.2, y: 57.8 }],
    areaPoints: [{ x: 51.8, y: 51.5 }, { x: 51, y: 52 }, { x: 52.5, y: 56.9 }, { x: 56, y: 62.1 }, { x: 57, y: 57.6 }, { x: 52.8, y: 53.9 }],
    textBox: { x: 81, y: 56.3, width: 12, height: 3 },
    text: { x: 88, y: 57.8 },
    isDynamic: true,
    isSelected: false
  },
  'adductor_magnus': {
    id: 'adductor_magnus',
    name: 'Adductor magnus',
    point: { x: 54, y: 61 },
    linePoints: [{ x: 82, y: 61 }, { x: 70, y: 61 }, { x: 54, y: 61 }],
    areaPoints: [{ x: 52.8, y: 57.1 }, { x: 52.7, y: 62.5 }, { x: 55.5, y: 61.4 }],
    textBox: { x: 81, y: 59.5, width: 12, height: 3 },
    text: { x: 88.3, y: 61 },
    isDynamic: true,
    isSelected: false
  },
  'gracilis': {
    id: 'gracilis',
    name: 'Gracilis',
    point: { x: 52.5, y: 64 },
    linePoints: [{ x: 82, y: 64 }, { x: 70, y: 64 }, { x: 52.5, y: 64 }],
    areaPoints: [{ x: 51, y: 52 }, { x: 51, y: 56.8 }, { x: 51.9, y: 61.4 }, { x: 52.1, y: 70.5 },{ x: 53, y: 70.5 },{ x: 52.8, y: 57.1 }],
    textBox: { x: 81, y: 62.5, width: 12, height: 3 },
    text: { x:85, y: 64 },
    isDynamic: true,
    isSelected: false
  },
  'extensor_hallucis_longus': {
    id: 'extensor_hallucis_longus',
    name: 'Extensor hallucis longus',
    point: { x: 54.5, y: 81 },
    linePoints: [{ x: 82, y: 81 }, { x: 70, y: 81 }, { x: 54.5, y: 81 }],
    areaPoints: [{ x: 55.8, y: 73.8 }, { x: 53.7, y: 79 }, { x: 54, y: 83.8 }, { x: 53.6, y: 86.5 }, { x: 55.4, y: 82.8 }],
    textBox: { x: 80, y: 79.5, width: 20, height: 3 },
    text: { x: 90.5, y: 81 },
    isDynamic: true,
    isSelected: false
  },

    'extensor_digitorum_brevis': {
    id: 'extensor_digitorum_brevis',
    name: 'Extensor digitorum brevis',
    point: { x: 55.2, y: 88.3 },
    linePoints: [{ x: 82, y: 88.3 }, { x: 70, y: 88.3 }, { x: 55.2, y: 88.3 }],
    areaPoints: [{ x: 54.9, y: 86.1 }, { x: 52.2, y: 89.5 }, { x: 56.6, y: 89.5 }, { x: 56.1, y: 86.9 }],
    textBox: { x: 80, y: 86.8, width: 22, height: 3 },
    text: { x: 91, y: 88.3 },
    isDynamic: true,
    isSelected: false
  },

  'flexor_carpi': {
    id: 'flexor_carpi',
    name: 'Flexor carpi radialis / ulnaris',
    point: { x: 31.7, y: 47 },
    linePoints: [{ x: 18, y: 47 }, { x: 28, y: 47 }, { x: 31.7, y: 47 }],
    areaPoints: [{ x: 37.9, y: 40 }, { x: 31.4, y: 44.3 }, { x: 29.2, y: 47.1 }, { x: 29.3, y: 49.3 },{ x: 32.9, y: 48.6 },{ x: 37, y: 44.3 }],
    textBox: { x: 0, y: 45.5, width: 20, height: 3 },
    text: { x: 9, y: 47 },
    isDynamic: true,
    isSelected: false
  },
  // // Hip and thigh muscles
  'tensor_fasciae_latae': {
    id: 'tensor_fasciae_latae',
    name: 'Tensor fasciae latae',
    point: { x: 39.8, y: 50.2 },
    linePoints: [{ x: 18, y: 50.2 }, { x: 28, y: 50.2  }, { x: 39.8, y: 50.2 }],
    areaPoints: [{ x: 40, y: 46 }, { x: 38.6, y: 51.9 }, { x: 39.7, y: 52.7 }, { x: 41.2, y: 48.5 }, { x: 40.7, y: 46.4 }],
    textBox: { x: 2, y: 48.7, width: 18, height: 3 },
    text: { x: 11, y: 50.2 },
    isDynamic: true,
    isSelected: false
  },
  'sartorius': {
    id: 'sartorius',
    name: 'Sartorius',
    point: { x: 43.5, y: 54.1 },
    linePoints: [{ x: 18, y: 54.1 }, { x: 28, y: 54.1 }, { x: 43.5, y: 54.1 }],
    areaPoints: [{ x: 41, y: 48.5 }, { x: 43.5, y: 56.4 }, { x: 47.8, y: 63.6 }, { x: 48.2, y: 66.4 }, { x: 48.2, y: 63 }, { x: 46.9, y: 58.4 }, { x: 42.2, y: 48.8 }],
    textBox: { x: 8, y: 52.6, width: 12, height: 3 },
    text: { x: 14, y: 54.1 },
    isDynamic: true,
    isSelected: false
  },
  'rectus_femoris': {
    id: 'rectus_femoris',
    name: 'Rectus femoris',
    point: { x: 41.6, y: 58.8 },
    linePoints: [{ x: 18, y: 58.8 }, { x: 28, y: 58.8 }, { x: 41.6, y: 58.8 }],
    areaPoints: [{ x: 40.3, y: 51.2 }, { x: 39.2, y: 56 }, { x: 39.8, y: 57.8 },{ x: 44, y: 65.4 }, { x: 45.6, y: 64.9 }, { x: 46, y: 64.5 }, { x: 43.7, y: 60.3 }, { x: 41.6, y: 56.3}],
    textBox: { x: 6, y: 56.3, width: 12, height: 3 },
    text: { x: 12, y: 58.8 },
    isDynamic: true,
    isSelected: false
  },
  'vastus_lateralis': {
    id: 'vastus_lateralis',
    name: 'Vastus lateralis',
    point: { x: 41.6, y: 62.4 },
    linePoints: [{ x: 18, y: 62.4 }, { x: 28, y: 62.4 }, { x: 41.6, y: 62.4 }],
    areaPoints: [{ x: 39.5, y: 57.1 }, { x: 39.7, y: 60.7 }, { x: 43.1, y: 66.4 }, { x: 44.2, y: 66 }],
    textBox: { x: 6, y: 60.9, width: 12, height: 3 },
    text: { x: 12, y: 62.4 },
    isDynamic: true,
    isSelected: false
  },
  'vastus_medialis': {
    id: 'vastus_medialis',
    name: 'Vastus medialis',
    point: { x: 46.7, y: 64.1 },
    linePoints: [{ x: 18, y: 66 }, { x: 28, y: 66 }, { x: 46.7, y: 64.1 }],
    areaPoints: [{ x: 46.1, y: 60.6 }, { x: 45.8, y: 66.8 }, { x: 48.1, y: 66.5 }, { x: 47.3, y: 62.7 }],
    textBox: { x: 6, y: 64.5, width: 12, height: 3 },
    text: { x: 12, y: 66 },
    isDynamic: true,
    isSelected: false
  },

  // // Lower leg muscles
  'tibialis_anterior': {
    id: 'tibialis_anterior',
    name: 'Tibialis anterior',
    point: { x: 45.1, y: 74.3 },
    linePoints: [{ x: 18, y: 70 }, { x: 40, y: 70 }, { x: 45.1, y: 74.3 }],
    areaPoints: [{ x: 44.3, y: 70 }, { x: 43.3, y: 73 }, { x: 45.5, y: 80.7 }, { x: 46.5, y: 79 }, { x: 46.3, y: 75 }],
    textBox: { x: 6, y: 68.5, width: 12, height: 3 },
    text: { x: 12, y: 70 },
    isDynamic: true,
    isSelected: false
  },
  'fibularis_muscles': {
    id: 'fibularis_muscles',
    name: 'Fibularis muscles',
    point: { x: 42.5, y: 73.2 },
    linePoints: [{ x: 18, y: 73.2 }, { x: 28, y: 73.2 }, { x: 42.5, y: 73.2 }],
    areaPoints: [{ x: 43.7, y: 68.5 }, { x: 41.7, y: 72.9 }, { x: 42.8, y: 78.2 }, { x: 43.4, y: 73.5 }, { x: 43, y: 72.2 }, { x: 44.8, y: 69.4 }],
    textBox: { x: 6, y: 71.7, width: 12, height: 3 },
    text: { x: 12, y: 73.2 },
    isDynamic: true,
    isSelected: false
  },
  'extensor_digitorum_longus': {
    id: 'extensor_digitorum_longus',
    name: 'Extensor digitorum longus',
    point: { x: 44.3, y: 80 },
    linePoints: [{ x: 18, y: 80 }, { x: 28, y: 80 }, { x: 44.3, y: 80 }],
    areaPoints: [{ x: 43.3, y: 73.1 }, { x: 42.8, y: 78.1 }, { x: 43.9, y: 82.8 }, { x: 45.1, y: 84.8 }, { x: 46, y: 84.5 }, { x: 46, y: 82 }, { x: 45.5, y: 80.6}, { x: 43.6, y: 75.6} ],
    textBox: { x: 0, y: 78.5, width: 20, height: 3 },
    text: { x: 9, y: 80 },
    isDynamic: true,
    isSelected: false
  },


  // Deep hip muscles
 


};

// 3페이지 - 후면 근육들 (이미지 분석 기반으로 조정)
export const backMuscles: { [key: string]: MusclePoint } = {
  'trapezius': {
    id: 'trapezius',
    name: 'Trapezius',
    point: { x: 47.9, y: 22 },
    linePoints: [{ x: 18, y: 22 }, { x: 30, y: 22 }, { x: 47.9, y: 22 }],
    areaPoints: [{ x: 48.8, y: 17.7 }, { x: 46.1, y: 21.8 }, { x: 36.8, y: 24.6 }, { x: 37.7, y: 25.8 }, { x: 43.4, y: 27.1 }, { x: 49.7, y: 37.9 }, { x: 49.7, y: 17.7 }],
    textBox: { x: 6, y: 20.5, width: 16, height: 3 },
    text: { x: 14, y: 22 },
    isDynamic: true,
    isSelected: false
  },

    'rhomboid_major_minor': {
    id: 'rhomboid_major_minor',
    name: 'Rhomboid major / minor',
    point: { x: 52, y: 27 },
    linePoints: [{ x: 18, y: 27 }, { x: 30, y: 27 }, { x: 52, y: 27 }],
    areaPoints: [{ x: 50.4, y: 24.6 }, { x: 50.4, y: 29 }, { x: 53.7, y: 31 }, { x: 54, y: 27 }],
    textBox: { x: 0, y: 25.5, width: 18, height: 3 },
    text: { x: 9, y: 27 },
    isDynamic: true,
    isSelected: false
  },
  'triceps_brachii': {
    id: 'triceps_brachii',
    name: 'Triceps brachii',
    point: { x: 38, y: 34.4 },
    linePoints: [{ x: 18, y: 34.4 }, { x: 30, y: 34.4 }, { x: 38, y: 34.4 }],
    areaPoints: [{ x: 40, y: 30.2 }, { x: 37.9, y: 31.1 }, { x: 36.8, y: 34.5 }, { x: 37, y: 37 }, { x: 38.9, y: 35.1 }, { x: 39.8, y: 32.8 }],
    textBox: { x: 3, y: 32.9, width: 16, height: 3 },
    text: { x: 12, y: 34.4 },
    isDynamic: true,
    isSelected: false
  },

    'latissimus_dorsi': {
    id: 'latissimus_dorsi',
    name: 'Latissimus dorsi',
    point: { x: 42.4, y: 37.4 },
    linePoints: [{ x: 18, y: 37.4 }, { x: 30, y: 37.4 }, { x: 42.4, y: 37.4 }],
    areaPoints: [{ x: 40, y: 30.2 }, { x: 39.7, y: 36.7 }, { x: 40.4, y: 39.7 }, { x: 44, y: 42.9 }, { x: 47.8, y: 40.7 }, { x: 49.1, y: 36.9 }, { x: 45.2, y: 31.2 }, { x: 41.9, y: 31.2 }],
    textBox: { x: 2.5, y: 35.9, width: 18, height: 3 },
    text: { x: 11.5, y: 37.4 },
    isDynamic: true,
    isSelected: false
  },

    'extensor_carpi': {
    id: 'extensor_carpi',
    name: 'Extensor carpi radialis / ulnaris',
    point: { x: 32.3, y: 46.5 },
    linePoints: [{ x: 21, y: 46.5 }, { x: 28, y: 46.5 }, { x: 32.3, y: 46.5 }],
    areaPoints: [{ x: 32.9, y: 39.4 }, { x: 29.9, y: 46.4 }, { x: 29, y: 50.5 }, { x: 30.5, y: 51.2 }, { x: 34, y: 45.1 }, { x: 34.3, y: 41.4 }],
    textBox: { x: 0, y: 45, width: 22, height: 3 },
    text: { x: 11, y: 46.5 },
    isDynamic: true,
    isSelected: false
  },

    'gluteus_maximus': {
    id: 'gluteus_maximus',
    name: 'Gluteus maximus',
    point: { x: 44.2, y: 50.5 },
    linePoints: [{ x: 18, y: 61 }, { x: 28, y: 61 }, { x: 44.2, y: 50.5 }],
    areaPoints: [{ x: 46.2, y: 45.7 }, { x: 41.9, y: 47.3 }, { x: 39.7, y: 51.1 }, { x: 42.4, y: 53.6 }, { x: 46.6, y: 53.3 }, { x: 49.1, y: 51.6 }, { x: 49.1, y: 49.8 }],
    textBox: { x: 3, y: 59.5, width: 16, height: 3 },
    text: { x: 11, y: 61 },
    isDynamic: true,
    isSelected: false
  },

    'gastrocnemius': {
    id: 'gastrocnemius',
    name: 'Gastrocnemius',
    point: { x: 44, y: 76.4 },
    linePoints: [{ x: 18, y: 76.4 }, { x: 28, y: 76.4 }, { x: 44, y: 76.4 }],
    areaPoints: [{ x: 44.3, y: 68.6 }, { x: 42.1, y: 70.3 }, { x: 41.6, y: 76.9 }, { x: 45.5, y: 82.5 }, { x: 46.6, y: 80.2 }, { x: 46.4, y: 75.2 }],
    textBox: { x: 4, y: 74.9, width: 16, height: 3 },
    text: { x: 12, y: 76.4 },
    isDynamic: true,
    isSelected: false
  },

    'suboccipital_muscles': {
    id: 'suboccipital_muscles',
    name: 'Suboccipital muscles',
    point: { x: 51.5, y: 18.4 },
    linePoints: [{ x: 82, y: 14 }, { x: 70, y: 14 }, { x: 51.5, y: 18.4 }],
    areaPoints: [{ x: 52.8, y: 17.9 }, { x: 50.6, y: 17.9 }, { x: 50.6, y: 20.3 }],
    textBox: { x: 80, y: 12.5, width: 20, height: 3 },
    text: { x: 90, y: 14 },
    isDynamic: true,
    isSelected: false
  },
  'splenius': {
    id: 'splenius',
    name: 'Splenius',
    point: { x: 51.9, y: 20.4 },
    linePoints: [{ x: 82, y: 17 }, { x: 70, y: 17 }, { x: 51.9, y: 20.4 }],
    areaPoints: [{ x: 53.6, y: 17 }, { x: 50.4, y: 20.6 }, { x: 50.4, y: 23 }, { x: 51.6, y: 23.8 }, { x: 54.5, y: 18 }],
    textBox: { x: 80, y: 15.5, width: 12, height: 3 },
    text: { x: 86, y: 17 },
    isDynamic: true,
    isSelected: false
  },
  'levator_scapulae': {
    id: 'levator_scapulae',
    name: 'Levator scapulae',
    point: { x: 54.5, y: 23.9 },
    linePoints: [{ x: 82, y: 20 }, { x: 70, y: 20 }, { x: 54.5, y: 23.9 }],
    areaPoints: [{ x: 53.3, y: 20.6 }, { x: 53.6, y: 25.5 }, { x: 56.1, y: 24 }, { x: 53.9, y: 21.9 }],
    textBox: { x: 79.5, y: 18.5, width: 18, height: 3 },
    text: { x: 88.5, y: 20 },
    isDynamic: true,
    isSelected: false
  },
  'supraspinatus': {
    id: 'supraspinatus',
    name: 'Supraspinatus',
    point: { x: 58.5, y: 25 },
    linePoints: [{ x: 82, y: 25 }, { x: 70, y: 25 }, { x: 58.5, y: 25 }],
    areaPoints: [{ x: 56.1, y: 24.1 }, { x: 54.4, y: 25.7 }, { x: 56.3, y: 26.1 }, { x: 61.4, y: 25 }],
    textBox: { x: 79, y: 23.5, width: 18, height: 3 },
    text: { x: 88, y: 25 },
    isDynamic: true,
    isSelected: false
  },
  'infraspinatus': {
    id: 'infraspinatus',
    name: 'Infraspinatus',
    point: { x: 59.4, y: 27.3 },
    linePoints: [{ x: 82, y: 27.3 }, { x: 70, y: 27.3 }, { x: 59.4, y: 27.3 }],
    areaPoints: [{ x: 54.3, y: 26.9 }, { x: 53.7, y: 28.7 }, { x: 54.2, y: 31.3 }, { x: 63.9, y: 26.7 }, { x: 63.5, y: 26.1 }, { x: 59.3, y: 26 }, { x: 57.5, y: 26.6 }, { x: 55.2, y: 26.3 }],
    textBox: { x: 79.5, y: 25.8, width: 16, height: 3 },
    text: { x:87.5, y: 27.3 },
    isDynamic: true,
    isSelected: false
  },



  'teres_minor': {
    id: 'teres_minor',
    name: 'Teres minor',
    point: { x: 62, y: 28.3 },
    linePoints: [{ x: 82, y: 30 }, { x: 70, y: 30 }, { x: 62, y: 28.3 }],
    areaPoints: [{ x: 63.6, y: 26.9 }, { x: 55.8, y: 30.5 }, { x: 55.8, y: 31 },{ x: 62, y: 28.7 }, { x: 63.9, y: 27.5 }],
    textBox: { x: 80, y: 28.5, width: 14, height: 3 },
    text: { x:87, y: 30 },
    isDynamic: true,
    isSelected: false
  },
  'teres_major': {
    id: 'teres_major',
    name: 'Teres major',
    point: { x: 58.1, y: 30.6 },
    linePoints: [{ x: 82, y: 32 }, { x: 70, y: 32 }, { x: 58.1, y: 30.6 }],
    areaPoints: [{ x: 59.6, y: 29.6 }, { x: 55.7, y: 30.8 }, { x: 56, y: 31.5 }, { x: 58.4, y: 31.5 }, { x: 60.3, y: 30.5 }],
    textBox: { x: 80, y: 30.5, width: 14, height: 3 },
    text: { x: 87, y: 32 },
    isDynamic: true,
    isSelected: false
  },
  'erector_spinae': {
    id: 'erector_spinae',
    name: 'Erector spinae',
    point: { x: 52.1, y: 34.1 },
    linePoints: [{ x: 82, y: 34.1 }, { x: 70, y: 34.1 }, { x: 52.1, y: 34.1 }],
    areaPoints: [{ x: 51.9, y: 29.9 }, { x: 51.5, y: 32.9 }, { x: 50.3, y: 38.5 }, { x: 52.1, y: 42.6 }, { x: 53.3, y: 38 }, { x: 53.4, y: 36.4 }, { x: 53, y: 30.6 }],
    textBox: { x: 81, y: 32.6, width: 16, height: 3 },
    text: { x: 88, y: 34.1 },
    isDynamic: true,
    isSelected: false
  },

  'quadratus_lumborum': {
    id: 'quadratus_lumborum',
    name: 'Quadratus lumborum',
    point: { x: 56, y: 42 },
    linePoints: [{ x: 82, y: 37 }, { x: 70, y: 37 }, { x: 56, y: 42 }],
    areaPoints: [{ x: 56, y: 40 }, { x: 54.9, y: 43.7 }, { x: 56.9, y: 43.4 }],
    textBox: { x: 81, y: 35.5, width: 18, height: 3 },
    text: { x: 90, y: 37 },
    isDynamic: true,
    isSelected: false
  },

  'anconeus': {
    id: 'anconeus',
    name: 'Anconeus',
    point: { x: 66, y: 40.7 },
    linePoints: [{ x: 82, y: 40.7 }, { x: 70, y: 40.7 }, { x: 66, y: 40.7 }],
    areaPoints: [{ x: 66, y: 39 }, { x: 65, y: 40.9 }, { x: 66.3, y: 43.4 }, { x: 67.1, y: 40.3 }],
    textBox: { x: 81.5, y: 39.2, width: 10, height: 3 },
    text: { x: 86.5, y: 40.7 },
    isDynamic: true,
    isSelected: false
  },

    'gluteus_medius': {
    id: 'gluteus_medius',
    name: 'Gluteus medius',
    point: { x: 57.3, y: 46 },
    linePoints: [{ x: 82, y: 43 }, { x: 70, y: 43 }, { x: 57.3, y: 46 }],
    areaPoints: [{ x: 54.9, y: 44.4 }, { x: 54.3, y: 46 }, { x: 57, y: 47.1 }, { x: 59.7, y: 49.5 }, { x: 61.1, y: 49.7 }, { x: 59.4, y: 44.8 }, { x: 57.5, y: 43.7 }],
    textBox: { x: 82.5, y: 41.5, width: 16, height: 3 },
    text: { x: 88.5, y: 43 },
    isDynamic: true,
    isSelected: false
  },

    'gluteus_minimus': {
    id: 'gluteus_minimus',
    name: 'Gluteus minimus',
    point: { x: 57.6, y: 48.2 },
    linePoints: [{ x: 82, y: 46 }, { x: 70, y: 46 }, { x: 57.6, y: 48.2 }],
    areaPoints: [{ x: 55.5, y: 46.5 }, { x: 54.9, y: 48 }, { x: 59, y: 49.9 }, { x: 59.6, y: 49.2 }, { x: 57.5, y: 47 }],
    textBox: { x: 82.5, y: 44.5, width: 16, height: 3 },
    text: { x: 88.5, y: 46 },
    isDynamic: true,
    isSelected: false
  },

  'extensor_digitorum_muscles': {
    id: 'extensor_digitorum_muscles',
    name: 'Extensor digitorum muscles',
    point: { x: 69.9, y: 48.2 },
    linePoints: [{ x: 78, y: 48.2 }, { x: 76, y: 48.2 }, { x: 69.9, y: 48.2 }],
    areaPoints: [{ x: 67.7, y: 45 }, { x: 67.4, y: 46.1 }, { x: 69.3, y: 49.9 }, { x: 72, y: 51.3 }, { x: 72.3, y: 49.4 }, { x: 69.9, y: 46.3 }],
    textBox: { x: 77, y: 46.7, width: 22, height: 3 },
    text: { x: 88, y: 48.2 },
    isDynamic: true,
    isSelected: false
  },

  'piriformis': {
    id: 'piriformis',
    name: 'Piriformis',
    point: { x: 55.1, y: 48.8 },
    linePoints: [{ x: 82, y: 52 }, { x: 70, y: 52 }, { x: 55.1, y: 48.8 }],
    areaPoints: [{ x: 53, y: 47.9 }, { x: 52.5, y: 48.9 }, { x: 57, y: 49.9 }, { x: 57.9, y: 49.4 }, { x: 54.9, y: 48.1 }],
    textBox: { x: 80, y: 50.5, width: 12, height: 3 },
    text: { x: 86, y: 52 },
    isDynamic: true,
    isSelected: false
  },

  'biceps_femoris': {
    id: 'biceps_femoris',
    name: 'Biceps femoris',
    point: { x: 44.3, y: 61 },
    linePoints: [{ x: 82, y: 56 }, { x: 49, y: 56 }, { x: 44.3, y: 61 }],
    areaPoints: [{ x: 44.9, y: 53.7 }, { x: 42.5, y: 59.3 }, { x: 42.4, y: 66.5 }, { x: 44, y: 66.2 }, { x: 45.5, y: 64 }, { x: 46.1, y: 61 }, { x: 46.4, y: 55.1 }, { x: 46.9, y: 54.1}],
    textBox: { x: 82, y: 54.5, width: 16, height: 3 },
    text: { x: 88, y: 56 },
    isDynamic: true,
    isSelected: false
  },
  'semitendinosus': {
    id: 'semitendinosus',
    name: 'Semitendinosus',
    point: { x: 46.7, y: 62.9 },
    linePoints: [{ x: 82, y: 60 }, { x: 55, y: 60 }, { x: 46.7, y: 62.9 }],
    areaPoints: [{ x: 46.9, y: 54.1 }, { x: 46.4, y: 54.8 }, { x: 46.6, y: 58.3 }, { x: 46.4, y: 61.8 }, { x: 45.5, y: 63.9 }, { x: 46, y: 64.7 }, { x: 47, y: 64.5 }, { x: 47.9, y: 61.6 }, { x: 47.5, y: 54.3 }],
    textBox: { x: 82, y: 58.5, width: 16, height: 3 },
    text: { x: 88, y: 60 },
    isDynamic: true,
    isSelected: false
  },
  'semimembranosus': {
    id: 'semimembranosus',
    name: 'Semimembranosus',
    point: { x: 54.8, y: 65.5 },
    linePoints: [{ x: 82, y: 65.5 }, { x: 70, y: 65.5 }, { x: 54.8, y: 65.5 }],
    areaPoints: [{ x: 55.4, y: 62.9 }, { x: 53.1, y: 66.8 }, { x: 53.9, y: 67.6 }, { x: 55.5, y: 65.8 }],
    textBox: { x: 81, y: 64.1, width: 16, height: 3 },
    text: { x: 89, y: 65.6 },
    isDynamic: true,
    isSelected: false
  },

  'popliteus': {
    id: 'popliteus',
    name: 'Popliteus',
    point: { x: 54.6, y: 70.6 },
    linePoints: [{ x: 82, y: 70.6 }, { x: 70, y: 70.6 }, { x: 54.6, y: 70.6 }],
    areaPoints: [{ x: 56, y: 68.2 }, { x: 54.6, y: 69.6 },{ x: 52.5, y: 70.4 }, { x: 53.1, y: 73 }, { x: 55.7, y: 71.4 }, { x: 57.2, y: 69.1 }],
    textBox: { x: 81, y: 69.1, width: 10, height: 3 },
    text: { x:86, y: 70.6 },
    isDynamic: true,
    isSelected: false
  },

  'soleus': {
    id: 'soleus',
    name: 'Soleus',
    point: { x: 53.3, y: 78.5 },
    linePoints: [{ x: 82, y: 78.5 }, { x: 70, y: 78.5 }, { x: 53.3, y: 78.5 }],
    areaPoints: [{ x: 55.5, y: 71.8 }, { x: 52.6, y: 74.9 }, { x: 50.9, y: 77.4 }, { x: 51.5, y: 85 }, { x: 54.6, y: 80.5 }, { x: 55.1, y: 84.9 }, { x: 57.9, y: 79.9 }, { x: 57.2, y: 72.2 }],
    textBox: { x: 81, y: 77, width: 10, height: 3 },
    text: { x: 86, y: 78.5 },
    isDynamic: true,
    isSelected: false
  },
  'achilles_tendon': {
    id: 'achilles_tendon',
    name: 'Achilles tendon',
    point: { x: 52.5, y: 90 },
    linePoints: [{ x: 82, y: 90 }, { x: 70, y: 90 }, { x: 52.5, y: 90 }],
    areaPoints: [{ x: 52.1, y: 87.3 }, { x: 51.2, y: 91.3 }, { x: 54.2, y: 91.5 }, { x: 53.3, y: 89.5 }, { x: 53.7, y: 87.5 }],
    textBox: { x: 81, y: 88.5, width: 16, height: 3 },
    text: { x: 88, y: 90 },
    isDynamic: true,
    isSelected: false
  }
};