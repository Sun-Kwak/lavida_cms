// 근육 좌표 데이터 관리 파일
// 좌표는 SVG viewBox="0 0 100 100" 기준입니다.
// 이미지 기반으로 2페이지(전면)와 3페이지(후면) 근육도 좌표 설정

export interface MusclePoint {
  id: string;
  name: string;
  point: { x: number, y: number };
  linePoints: { x: number, y: number }[];
  areaPoints: { x: number, y: number }[];
  textBox: { x: number, y: number, width: number, height: number };
  text: { x: number, y: number };
}

// 2페이지 - 전면 근육들
export const frontMuscles: { [key: string]: MusclePoint } = {
  // Head and neck muscles
  'frontalis': {
    id: 'frontalis',
    name: 'Frontalis',
    point: { x: 50, y: 8 },
    linePoints: [{ x: 50, y: 8 }, { x: 45, y: 5 }, { x: 35, y: 2 }],
    areaPoints: [{ x: 45, y: 5 }, { x: 55, y: 5 }, { x: 55, y: 10 }, { x: 45, y: 10 }],
    textBox: { x: 25, y: 1, width: 15, height: 3 },
    text: { x: 32.5, y: 2.5 }
  },
  'temporalis': {
    id: 'temporalis',
    name: 'Temporalis',
    point: { x: 42, y: 12 },
    linePoints: [{ x: 42, y: 12 }, { x: 37, y: 10 }, { x: 22, y: 7 }],
    areaPoints: [{ x: 37, y: 10 }, { x: 47, y: 10 }, { x: 47, y: 14 }, { x: 37, y: 14 }],
    textBox: { x: 12, y: 6, width: 15, height: 3 },
    text: { x: 19.5, y: 7.5 }
  },
  'orbicularis_oculi': {
    id: 'orbicularis_oculi',
    name: 'Orbicularis oculi',
    point: { x: 46, y: 15 },
    linePoints: [{ x: 46, y: 15 }, { x: 41, y: 13 }, { x: 26, y: 11 }],
    areaPoints: [{ x: 41, y: 13 }, { x: 51, y: 13 }, { x: 51, y: 17 }, { x: 41, y: 17 }],
    textBox: { x: 6, y: 10, width: 22, height: 3 },
    text: { x: 17, y: 11.5 }
  },
  'masseter': {
    id: 'masseter',
    name: 'Masseter',
    point: { x: 40, y: 20 },
    linePoints: [{ x: 40, y: 20 }, { x: 35, y: 18 }, { x: 20, y: 15 }],
    areaPoints: [{ x: 35, y: 18 }, { x: 45, y: 18 }, { x: 45, y: 22 }, { x: 35, y: 22 }],
    textBox: { x: 10, y: 14, width: 15, height: 3 },
    text: { x: 17.5, y: 15.5 }
  },
  'sternocleidomastoid': {
    id: 'sternocleidomastoid',
    name: 'Sternocleidomastoid',
    point: { x: 38, y: 25 },
    linePoints: [{ x: 38, y: 25 }, { x: 33, y: 23 }, { x: 18, y: 20 }],
    areaPoints: [{ x: 33, y: 23 }, { x: 43, y: 23 }, { x: 43, y: 27 }, { x: 33, y: 27 }],
    textBox: { x: 1, y: 19, width: 20, height: 3 },
    text: { x: 11, y: 20.5 }
  },

  // Shoulder and chest muscles
  'deltoid': {
    id: 'deltoid',
    name: 'Deltoid',
    point: { x: 25, y: 32 },
    linePoints: [{ x: 25, y: 32 }, { x: 20, y: 30 }, { x: 5, y: 27 }],
    areaPoints: [{ x: 18, y: 28 }, { x: 32, y: 28 }, { x: 32, y: 36 }, { x: 18, y: 36 }],
    textBox: { x: 1, y: 26, width: 12, height: 3 },
    text: { x: 7, y: 27.5 }
  },
  'scalenes': {
    id: 'scalenes',
    name: 'Scalenes',
    point: { x: 42, y: 28 },
    linePoints: [{ x: 42, y: 28 }, { x: 37, y: 26 }, { x: 22, y: 23 }],
    areaPoints: [{ x: 37, y: 26 }, { x: 47, y: 26 }, { x: 47, y: 30 }, { x: 37, y: 30 }],
    textBox: { x: 12, y: 22, width: 15, height: 3 },
    text: { x: 19.5, y: 23.5 }
  },
  'pectoralis_major': {
    id: 'pectoralis_major',
    name: 'Pectoralis major',
    point: { x: 42, y: 36 },
    linePoints: [{ x: 42, y: 36 }, { x: 37, y: 34 }, { x: 22, y: 31 }],
    areaPoints: [{ x: 35, y: 32 }, { x: 50, y: 32 }, { x: 50, y: 42 }, { x: 35, y: 42 }],
    textBox: { x: 5, y: 30, width: 20, height: 3 },
    text: { x: 15, y: 31.5 }
  },

  // Arm muscles
  'biceps_brachii': {
    id: 'biceps_brachii',
    name: 'Biceps brachii',
    point: { x: 22, y: 45 },
    linePoints: [{ x: 22, y: 45 }, { x: 17, y: 43 }, { x: 2, y: 40 }],
    areaPoints: [{ x: 17, y: 43 }, { x: 27, y: 43 }, { x: 27, y: 47 }, { x: 17, y: 47 }],
    textBox: { x: 1, y: 39, width: 18, height: 3 },
    text: { x: 10, y: 40.5 }
  },
  'coracobrachialis': {
    id: 'coracobrachialis',
    name: 'Coracobrachialis',
    point: { x: 30, y: 42 },
    linePoints: [{ x: 30, y: 42 }, { x: 25, y: 40 }, { x: 10, y: 37 }],
    areaPoints: [{ x: 25, y: 40 }, { x: 35, y: 40 }, { x: 35, y: 44 }, { x: 25, y: 44 }],
    textBox: { x: 1, y: 36, width: 20, height: 3 },
    text: { x: 11, y: 37.5 }
  },
  'serratus_anterior': {
    id: 'serratus_anterior',
    name: 'Serratus anterior',
    point: { x: 35, y: 45 },
    linePoints: [{ x: 35, y: 45 }, { x: 30, y: 43 }, { x: 15, y: 40 }],
    areaPoints: [{ x: 30, y: 43 }, { x: 40, y: 43 }, { x: 40, y: 47 }, { x: 30, y: 47 }],
    textBox: { x: 3, y: 39, width: 18, height: 3 },
    text: { x: 12, y: 40.5 }
  },
  'sternalis': {
    id: 'sternalis',
    name: 'Sternalis',
    point: { x: 50, y: 40 },
    linePoints: [{ x: 50, y: 40 }, { x: 45, y: 38 }, { x: 30, y: 35 }],
    areaPoints: [{ x: 47, y: 38 }, { x: 53, y: 38 }, { x: 53, y: 42 }, { x: 47, y: 42 }],
    textBox: { x: 20, y: 34, width: 15, height: 3 },
    text: { x: 27.5, y: 35.5 }
  },
  'brachialis': {
    id: 'brachialis',
    name: 'Brachialis',
    point: { x: 24, y: 52 },
    linePoints: [{ x: 24, y: 52 }, { x: 19, y: 50 }, { x: 4, y: 47 }],
    areaPoints: [{ x: 19, y: 50 }, { x: 29, y: 50 }, { x: 29, y: 54 }, { x: 19, y: 54 }],
    textBox: { x: 1, y: 46, width: 15, height: 3 },
    text: { x: 8.5, y: 47.5 }
  },

  // Core muscles
  'rectus_abdominis': {
    id: 'rectus_abdominis',
    name: 'Rectus abdominis',
    point: { x: 50, y: 50 },
    linePoints: [{ x: 50, y: 50 }, { x: 45, y: 48 }, { x: 30, y: 45 }],
    areaPoints: [{ x: 47, y: 45 }, { x: 53, y: 45 }, { x: 53, y: 55 }, { x: 47, y: 55 }],
    textBox: { x: 15, y: 44, width: 20, height: 3 },
    text: { x: 25, y: 45.5 }
  },
  'external_oblique': {
    id: 'external_oblique',
    name: 'External oblique',
    point: { x: 43, y: 55 },
    linePoints: [{ x: 43, y: 55 }, { x: 38, y: 53 }, { x: 23, y: 50 }],
    areaPoints: [{ x: 38, y: 53 }, { x: 48, y: 53 }, { x: 48, y: 57 }, { x: 38, y: 57 }],
    textBox: { x: 8, y: 49, width: 20, height: 3 },
    text: { x: 18, y: 50.5 }
  },

  // Forearm muscles
  'pronator_teres': {
    id: 'pronator_teres',
    name: 'Pronator teres',
    point: { x: 26, y: 55 },
    linePoints: [{ x: 26, y: 55 }, { x: 21, y: 53 }, { x: 6, y: 50 }],
    areaPoints: [{ x: 21, y: 53 }, { x: 31, y: 53 }, { x: 31, y: 57 }, { x: 21, y: 57 }],
    textBox: { x: 1, y: 49, width: 18, height: 3 },
    text: { x: 10, y: 50.5 }
  },
  'brachioradialis': {
    id: 'brachioradialis',
    name: 'Brachioradialis',
    point: { x: 20, y: 60 },
    linePoints: [{ x: 20, y: 60 }, { x: 15, y: 58 }, { x: 2, y: 55 }],
    areaPoints: [{ x: 15, y: 58 }, { x: 25, y: 58 }, { x: 25, y: 62 }, { x: 15, y: 62 }],
    textBox: { x: 1, y: 54, width: 18, height: 3 },
    text: { x: 10, y: 55.5 }
  },
  'flexor_carpi_radialis_ulnaris': {
    id: 'flexor_carpi_radialis_ulnaris',
    name: 'Flexor carpi radialis/ulnaris',
    point: { x: 22, y: 65 },
    linePoints: [{ x: 22, y: 65 }, { x: 17, y: 63 }, { x: 2, y: 60 }],
    areaPoints: [{ x: 17, y: 63 }, { x: 27, y: 63 }, { x: 27, y: 67 }, { x: 17, y: 67 }],
    textBox: { x: 1, y: 59, width: 25, height: 3 },
    text: { x: 13.5, y: 60.5 }
  },

  // Hip and thigh muscles
  'tensor_fasciae_latae': {
    id: 'tensor_fasciae_latae',
    name: 'Tensor fasciae latae',
    point: { x: 40, y: 62 },
    linePoints: [{ x: 40, y: 62 }, { x: 35, y: 60 }, { x: 20, y: 57 }],
    areaPoints: [{ x: 35, y: 60 }, { x: 45, y: 60 }, { x: 45, y: 64 }, { x: 35, y: 64 }],
    textBox: { x: 5, y: 56, width: 22, height: 3 },
    text: { x: 16, y: 57.5 }
  },
  'sartorius': {
    id: 'sartorius',
    name: 'Sartorius',
    point: { x: 44, y: 68 },
    linePoints: [{ x: 44, y: 68 }, { x: 39, y: 66 }, { x: 24, y: 63 }],
    areaPoints: [{ x: 39, y: 66 }, { x: 49, y: 66 }, { x: 49, y: 70 }, { x: 39, y: 70 }],
    textBox: { x: 14, y: 62, width: 15, height: 3 },
    text: { x: 21.5, y: 63.5 }
  },
  'rectus_femoris': {
    id: 'rectus_femoris',
    name: 'Rectus femoris',
    point: { x: 48, y: 72 },
    linePoints: [{ x: 48, y: 72 }, { x: 43, y: 70 }, { x: 28, y: 67 }],
    areaPoints: [{ x: 43, y: 70 }, { x: 53, y: 70 }, { x: 53, y: 74 }, { x: 43, y: 74 }],
    textBox: { x: 18, y: 66, width: 18, height: 3 },
    text: { x: 27, y: 67.5 }
  },
  'vastus_lateralis': {
    id: 'vastus_lateralis',
    name: 'Vastus lateralis',
    point: { x: 41, y: 78 },
    linePoints: [{ x: 41, y: 78 }, { x: 36, y: 76 }, { x: 21, y: 73 }],
    areaPoints: [{ x: 36, y: 76 }, { x: 46, y: 76 }, { x: 46, y: 80 }, { x: 36, y: 80 }],
    textBox: { x: 11, y: 72, width: 18, height: 3 },
    text: { x: 20, y: 73.5 }
  },
  'vastus_medialis': {
    id: 'vastus_medialis',
    name: 'Vastus medialis',
    point: { x: 53, y: 78 },
    linePoints: [{ x: 53, y: 78 }, { x: 48, y: 76 }, { x: 33, y: 73 }],
    areaPoints: [{ x: 48, y: 76 }, { x: 58, y: 76 }, { x: 58, y: 80 }, { x: 48, y: 80 }],
    textBox: { x: 23, y: 72, width: 18, height: 3 },
    text: { x: 32, y: 73.5 }
  },

  // Lower leg muscles
  'tibialis_anterior': {
    id: 'tibialis_anterior',
    name: 'Tibialis anterior',
    point: { x: 44, y: 85 },
    linePoints: [{ x: 44, y: 85 }, { x: 39, y: 83 }, { x: 24, y: 80 }],
    areaPoints: [{ x: 39, y: 83 }, { x: 49, y: 83 }, { x: 49, y: 87 }, { x: 39, y: 87 }],
    textBox: { x: 14, y: 79, width: 18, height: 3 },
    text: { x: 23, y: 80.5 }
  },
  'fibularis_muscles': {
    id: 'fibularis_muscles',
    name: 'Fibularis muscles',
    point: { x: 38, y: 88 },
    linePoints: [{ x: 38, y: 88 }, { x: 33, y: 86 }, { x: 18, y: 83 }],
    areaPoints: [{ x: 33, y: 86 }, { x: 43, y: 86 }, { x: 43, y: 90 }, { x: 33, y: 90 }],
    textBox: { x: 8, y: 82, width: 18, height: 3 },
    text: { x: 17, y: 83.5 }
  },
  'extensor_digitorum_longus': {
    id: 'extensor_digitorum_longus',
    name: 'Extensor digitorum longus',
    point: { x: 41, y: 90 },
    linePoints: [{ x: 41, y: 90 }, { x: 36, y: 88 }, { x: 15, y: 85 }],
    areaPoints: [{ x: 36, y: 88 }, { x: 46, y: 88 }, { x: 46, y: 92 }, { x: 36, y: 92 }],
    textBox: { x: 1, y: 84, width: 25, height: 3 },
    text: { x: 13.5, y: 85.5 }
  },
  'extensor_digitorum_brevis': {
    id: 'extensor_digitorum_brevis',
    name: 'Extensor digitorum brevis',
    point: { x: 44, y: 95 },
    linePoints: [{ x: 44, y: 95 }, { x: 39, y: 93 }, { x: 20, y: 90 }],
    areaPoints: [{ x: 39, y: 93 }, { x: 49, y: 93 }, { x: 49, y: 97 }, { x: 39, y: 97 }],
    textBox: { x: 1, y: 89, width: 25, height: 3 },
    text: { x: 13.5, y: 90.5 }
  },
  'flexor_digitorum_muscles': {
    id: 'flexor_digitorum_muscles',
    name: 'Flexor digitorum muscles',
    point: { x: 51, y: 92 },
    linePoints: [{ x: 51, y: 92 }, { x: 46, y: 90 }, { x: 25, y: 87 }],
    areaPoints: [{ x: 46, y: 90 }, { x: 56, y: 90 }, { x: 56, y: 94 }, { x: 46, y: 94 }],
    textBox: { x: 1, y: 86, width: 28, height: 3 },
    text: { x: 15, y: 87.5 }
  },

  // Hip deep muscles
  'iliopsoas': {
    id: 'iliopsoas',
    name: 'Iliopsoas',
    point: { x: 48, y: 65 },
    linePoints: [{ x: 48, y: 65 }, { x: 43, y: 63 }, { x: 28, y: 60 }],
    areaPoints: [{ x: 43, y: 63 }, { x: 53, y: 63 }, { x: 53, y: 67 }, { x: 43, y: 67 }],
    textBox: { x: 18, y: 59, width: 15, height: 3 },
    text: { x: 25.5, y: 60.5 }
  },
  'pectineus': {
    id: 'pectineus',
    name: 'Pectineus',
    point: { x: 51, y: 70 },
    linePoints: [{ x: 51, y: 70 }, { x: 46, y: 68 }, { x: 31, y: 65 }],
    areaPoints: [{ x: 46, y: 68 }, { x: 56, y: 68 }, { x: 56, y: 72 }, { x: 46, y: 72 }],
    textBox: { x: 21, y: 64, width: 15, height: 3 },
    text: { x: 28.5, y: 65.5 }
  },
  'adductor_brevis': {
    id: 'adductor_brevis',
    name: 'Adductor brevis',
    point: { x: 53, y: 75 },
    linePoints: [{ x: 53, y: 75 }, { x: 48, y: 73 }, { x: 33, y: 70 }],
    areaPoints: [{ x: 48, y: 73 }, { x: 58, y: 73 }, { x: 58, y: 77 }, { x: 48, y: 77 }],
    textBox: { x: 23, y: 69, width: 18, height: 3 },
    text: { x: 32, y: 70.5 }
  },
  'adductor_longus': {
    id: 'adductor_longus',
    name: 'Adductor longus',
    point: { x: 55, y: 80 },
    linePoints: [{ x: 55, y: 80 }, { x: 50, y: 78 }, { x: 35, y: 75 }],
    areaPoints: [{ x: 50, y: 78 }, { x: 60, y: 78 }, { x: 60, y: 82 }, { x: 50, y: 82 }],
    textBox: { x: 25, y: 74, width: 18, height: 3 },
    text: { x: 34, y: 75.5 }
  },
  'adductor_magnus': {
    id: 'adductor_magnus',
    name: 'Adductor magnus',
    point: { x: 57, y: 85 },
    linePoints: [{ x: 57, y: 85 }, { x: 52, y: 83 }, { x: 37, y: 80 }],
    areaPoints: [{ x: 52, y: 83 }, { x: 62, y: 83 }, { x: 62, y: 87 }, { x: 52, y: 87 }],
    textBox: { x: 27, y: 79, width: 18, height: 3 },
    text: { x: 36, y: 80.5 }
  },
  'gracilis': {
    id: 'gracilis',
    name: 'Gracilis',
    point: { x: 54, y: 88 },
    linePoints: [{ x: 54, y: 88 }, { x: 49, y: 86 }, { x: 34, y: 83 }],
    areaPoints: [{ x: 49, y: 86 }, { x: 59, y: 86 }, { x: 59, y: 90 }, { x: 49, y: 90 }],
    textBox: { x: 24, y: 82, width: 15, height: 3 },
    text: { x: 31.5, y: 83.5 }
  },
  'extensor_hallucis_longus': {
    id: 'extensor_hallucis_longus',
    name: 'Extensor hallucis longus',
    point: { x: 47, y: 92 },
    linePoints: [{ x: 47, y: 92 }, { x: 42, y: 90 }, { x: 22, y: 87 }],
    areaPoints: [{ x: 42, y: 90 }, { x: 52, y: 90 }, { x: 52, y: 94 }, { x: 42, y: 94 }],
    textBox: { x: 1, y: 86, width: 25, height: 3 },
    text: { x: 13.5, y: 87.5 }
  }
};

// 3페이지 - 후면 근육들
export const backMuscles: { [key: string]: MusclePoint } = {
  // Head and neck muscles
  'trapezius': {
    id: 'trapezius',
    name: 'Trapezius',
    point: { x: 50, y: 18 },
    linePoints: [{ x: 50, y: 18 }, { x: 45, y: 15 }, { x: 30, y: 12 }],
    areaPoints: [{ x: 40, y: 12 }, { x: 60, y: 12 }, { x: 60, y: 25 }, { x: 40, y: 25 }],
    textBox: { x: 20, y: 11, width: 15, height: 3 },
    text: { x: 27.5, y: 12.5 }
  },
  'splenius': {
    id: 'splenius',
    name: 'Splenius',
    point: { x: 50, y: 10 },
    linePoints: [{ x: 50, y: 10 }, { x: 45, y: 8 }, { x: 30, y: 5 }],
    areaPoints: [{ x: 45, y: 8 }, { x: 55, y: 8 }, { x: 55, y: 12 }, { x: 45, y: 12 }],
    textBox: { x: 20, y: 4, width: 15, height: 3 },
    text: { x: 27.5, y: 5.5 }
  },
  'levator_scapulae': {
    id: 'levator_scapulae',
    name: 'Levator scapulae',
    point: { x: 43, y: 22 },
    linePoints: [{ x: 43, y: 22 }, { x: 38, y: 20 }, { x: 23, y: 17 }],
    areaPoints: [{ x: 38, y: 20 }, { x: 48, y: 20 }, { x: 48, y: 24 }, { x: 38, y: 24 }],
    textBox: { x: 8, y: 16, width: 20, height: 3 },
    text: { x: 18, y: 17.5 }
  },
  'supraspinatus': {
    id: 'supraspinatus',
    name: 'Supraspinatus',
    point: { x: 35, y: 28 },
    linePoints: [{ x: 35, y: 28 }, { x: 30, y: 26 }, { x: 15, y: 23 }],
    areaPoints: [{ x: 30, y: 26 }, { x: 40, y: 26 }, { x: 40, y: 30 }, { x: 30, y: 30 }],
    textBox: { x: 1, y: 22, width: 18, height: 3 },
    text: { x: 10, y: 23.5 }
  },
  'infraspinatus': {
    id: 'infraspinatus',
    name: 'Infraspinatus',
    point: { x: 35, y: 33 },
    linePoints: [{ x: 35, y: 33 }, { x: 30, y: 31 }, { x: 15, y: 28 }],
    areaPoints: [{ x: 30, y: 31 }, { x: 40, y: 31 }, { x: 40, y: 35 }, { x: 30, y: 35 }],
    textBox: { x: 1, y: 27, width: 18, height: 3 },
    text: { x: 10, y: 28.5 }
  },
  'suboccipital_muscles': {
    id: 'suboccipital_muscles',
    name: 'Suboccipital muscles',
    point: { x: 50, y: 6 },
    linePoints: [{ x: 50, y: 6 }, { x: 45, y: 4 }, { x: 25, y: 1 }],
    areaPoints: [{ x: 45, y: 4 }, { x: 55, y: 4 }, { x: 55, y: 8 }, { x: 45, y: 8 }],
    textBox: { x: 5, y: 0, width: 25, height: 3 },
    text: { x: 17.5, y: 1.5 }
  },
  'rhomboid_major_minor': {
    id: 'rhomboid_major_minor',
    name: 'Rhomboid major/minor',
    point: { x: 45, y: 28 },
    linePoints: [{ x: 45, y: 28 }, { x: 40, y: 26 }, { x: 20, y: 23 }],
    areaPoints: [{ x: 40, y: 26 }, { x: 50, y: 26 }, { x: 50, y: 30 }, { x: 40, y: 30 }],
    textBox: { x: 1, y: 22, width: 25, height: 3 },
    text: { x: 13.5, y: 23.5 }
  },
  'teres_minor': {
    id: 'teres_minor',
    name: 'Teres minor',
    point: { x: 35, y: 38 },
    linePoints: [{ x: 35, y: 38 }, { x: 30, y: 36 }, { x: 15, y: 33 }],
    areaPoints: [{ x: 30, y: 36 }, { x: 40, y: 36 }, { x: 40, y: 40 }, { x: 30, y: 40 }],
    textBox: { x: 1, y: 32, width: 18, height: 3 },
    text: { x: 10, y: 33.5 }
  },
  'teres_major': {
    id: 'teres_major',
    name: 'Teres major',
    point: { x: 35, y: 43 },
    linePoints: [{ x: 35, y: 43 }, { x: 30, y: 41 }, { x: 15, y: 38 }],
    areaPoints: [{ x: 30, y: 41 }, { x: 40, y: 41 }, { x: 40, y: 45 }, { x: 30, y: 45 }],
    textBox: { x: 1, y: 37, width: 18, height: 3 },
    text: { x: 10, y: 38.5 }
  },

  // Back muscles
  'erector_spinae': {
    id: 'erector_spinae',
    name: 'Erector spinae',
    point: { x: 47, y: 50 },
    linePoints: [{ x: 47, y: 50 }, { x: 42, y: 48 }, { x: 27, y: 45 }],
    areaPoints: [{ x: 44, y: 30 }, { x: 50, y: 30 }, { x: 50, y: 65 }, { x: 44, y: 65 }],
    textBox: { x: 17, y: 44, width: 18, height: 3 },
    text: { x: 26, y: 45.5 }
  },
  'triceps_brachii': {
    id: 'triceps_brachii',
    name: 'Triceps brachii',
    point: { x: 22, y: 42 },
    linePoints: [{ x: 22, y: 42 }, { x: 17, y: 40 }, { x: 2, y: 37 }],
    areaPoints: [{ x: 17, y: 40 }, { x: 27, y: 40 }, { x: 27, y: 44 }, { x: 17, y: 44 }],
    textBox: { x: 1, y: 36, width: 18, height: 3 },
    text: { x: 10, y: 37.5 }
  },
  'latissimus_dorsi': {
    id: 'latissimus_dorsi',
    name: 'Latissimus dorsi',
    point: { x: 38, y: 48 },
    linePoints: [{ x: 38, y: 48 }, { x: 33, y: 46 }, { x: 18, y: 43 }],
    areaPoints: [{ x: 30, y: 40 }, { x: 46, y: 40 }, { x: 46, y: 55 }, { x: 30, y: 55 }],
    textBox: { x: 3, y: 42, width: 20, height: 3 },
    text: { x: 13, y: 43.5 }
  },
  'extensor_carpi_radialis_ulnaris': {
    id: 'extensor_carpi_radialis_ulnaris',
    name: 'Extensor carpi radialis/ulnaris',
    point: { x: 22, y: 52 },
    linePoints: [{ x: 22, y: 52 }, { x: 17, y: 50 }, { x: 2, y: 47 }],
    areaPoints: [{ x: 17, y: 50 }, { x: 27, y: 50 }, { x: 27, y: 54 }, { x: 17, y: 54 }],
    textBox: { x: 1, y: 46, width: 28, height: 3 },
    text: { x: 15, y: 47.5 }
  },
  'extensor_digitorum_muscles': {
    id: 'extensor_digitorum_muscles',
    name: 'Extensor digitorum muscles',
    point: { x: 20, y: 57 },
    linePoints: [{ x: 20, y: 57 }, { x: 15, y: 55 }, { x: 2, y: 52 }],
    areaPoints: [{ x: 15, y: 55 }, { x: 25, y: 55 }, { x: 25, y: 59 }, { x: 15, y: 59 }],
    textBox: { x: 1, y: 51, width: 25, height: 3 },
    text: { x: 13.5, y: 52.5 }
  },
  'quadratus_lumborum': {
    id: 'quadratus_lumborum',
    name: 'Quadratus lumborum',
    point: { x: 43, y: 55 },
    linePoints: [{ x: 43, y: 55 }, { x: 38, y: 53 }, { x: 23, y: 50 }],
    areaPoints: [{ x: 38, y: 53 }, { x: 48, y: 53 }, { x: 48, y: 57 }, { x: 38, y: 57 }],
    textBox: { x: 8, y: 49, width: 20, height: 3 },
    text: { x: 18, y: 50.5 }
  },
  'anconeus': {
    id: 'anconeus',
    name: 'Anconeus',
    point: { x: 18, y: 47 },
    linePoints: [{ x: 18, y: 47 }, { x: 13, y: 45 }, { x: 3, y: 42 }],
    areaPoints: [{ x: 13, y: 45 }, { x: 23, y: 45 }, { x: 23, y: 49 }, { x: 13, y: 49 }],
    textBox: { x: 1, y: 41, width: 15, height: 3 },
    text: { x: 8.5, y: 42.5 }
  },

  // Hip and glute muscles
  'gluteus_medius': {
    id: 'gluteus_medius',
    name: 'Gluteus medius',
    point: { x: 40, y: 62 },
    linePoints: [{ x: 40, y: 62 }, { x: 35, y: 60 }, { x: 20, y: 57 }],
    areaPoints: [{ x: 35, y: 60 }, { x: 45, y: 60 }, { x: 45, y: 64 }, { x: 35, y: 64 }],
    textBox: { x: 5, y: 56, width: 20, height: 3 },
    text: { x: 15, y: 57.5 }
  },
  'gluteus_minimus': {
    id: 'gluteus_minimus',
    name: 'Gluteus minimus',
    point: { x: 42, y: 65 },
    linePoints: [{ x: 42, y: 65 }, { x: 37, y: 63 }, { x: 22, y: 60 }],
    areaPoints: [{ x: 37, y: 63 }, { x: 47, y: 63 }, { x: 47, y: 67 }, { x: 37, y: 67 }],
    textBox: { x: 7, y: 59, width: 20, height: 3 },
    text: { x: 17, y: 60.5 }
  },
  'gluteus_maximus': {
    id: 'gluteus_maximus',
    name: 'Gluteus maximus',
    point: { x: 46, y: 68 },
    linePoints: [{ x: 46, y: 68 }, { x: 41, y: 66 }, { x: 26, y: 63 }],
    areaPoints: [{ x: 35, y: 60 }, { x: 57, y: 60 }, { x: 57, y: 75 }, { x: 35, y: 75 }],
    textBox: { x: 11, y: 62, width: 20, height: 3 },
    text: { x: 21, y: 63.5 }
  },
  'piriformis': {
    id: 'piriformis',
    name: 'Piriformis',
    point: { x: 48, y: 70 },
    linePoints: [{ x: 48, y: 70 }, { x: 43, y: 68 }, { x: 28, y: 65 }],
    areaPoints: [{ x: 43, y: 68 }, { x: 53, y: 68 }, { x: 53, y: 72 }, { x: 43, y: 72 }],
    textBox: { x: 18, y: 64, width: 15, height: 3 },
    text: { x: 25.5, y: 65.5 }
  },

  // Posterior thigh muscles (hamstrings)
  'biceps_femoris': {
    id: 'biceps_femoris',
    name: 'Biceps femoris',
    point: { x: 40, y: 78 },
    linePoints: [{ x: 40, y: 78 }, { x: 35, y: 76 }, { x: 20, y: 73 }],
    areaPoints: [{ x: 35, y: 76 }, { x: 45, y: 76 }, { x: 45, y: 80 }, { x: 35, y: 80 }],
    textBox: { x: 5, y: 72, width: 20, height: 3 },
    text: { x: 15, y: 73.5 }
  },
  'semitendinosus': {
    id: 'semitendinosus',
    name: 'Semitendinosus',
    point: { x: 50, y: 80 },
    linePoints: [{ x: 50, y: 80 }, { x: 45, y: 78 }, { x: 30, y: 75 }],
    areaPoints: [{ x: 45, y: 78 }, { x: 55, y: 78 }, { x: 55, y: 82 }, { x: 45, y: 82 }],
    textBox: { x: 20, y: 74, width: 18, height: 3 },
    text: { x: 29, y: 75.5 }
  },
  'semimembranosus': {
    id: 'semimembranosus',
    name: 'Semimembranosus',
    point: { x: 52, y: 83 },
    linePoints: [{ x: 52, y: 83 }, { x: 47, y: 81 }, { x: 32, y: 78 }],
    areaPoints: [{ x: 47, y: 81 }, { x: 57, y: 81 }, { x: 57, y: 85 }, { x: 47, y: 85 }],
    textBox: { x: 22, y: 77, width: 18, height: 3 },
    text: { x: 31, y: 78.5 }
  },

  // Lower leg posterior muscles
  'popliteus': {
    id: 'popliteus',
    name: 'Popliteus',
    point: { x: 47, y: 85 },
    linePoints: [{ x: 47, y: 85 }, { x: 42, y: 83 }, { x: 27, y: 80 }],
    areaPoints: [{ x: 42, y: 83 }, { x: 52, y: 83 }, { x: 52, y: 87 }, { x: 42, y: 87 }],
    textBox: { x: 17, y: 79, width: 15, height: 3 },
    text: { x: 24.5, y: 80.5 }
  },
  'gastrocnemius': {
    id: 'gastrocnemius',
    name: 'Gastrocnemius',
    point: { x: 47, y: 88 },
    linePoints: [{ x: 47, y: 88 }, { x: 42, y: 86 }, { x: 27, y: 83 }],
    areaPoints: [{ x: 40, y: 85 }, { x: 54, y: 85 }, { x: 54, y: 92 }, { x: 40, y: 92 }],
    textBox: { x: 12, y: 82, width: 18, height: 3 },
    text: { x: 21, y: 83.5 }
  },
  'soleus': {
    id: 'soleus',
    name: 'Soleus',
    point: { x: 44, y: 92 },
    linePoints: [{ x: 44, y: 92 }, { x: 39, y: 90 }, { x: 24, y: 87 }],
    areaPoints: [{ x: 39, y: 90 }, { x: 49, y: 90 }, { x: 49, y: 94 }, { x: 39, y: 94 }],
    textBox: { x: 14, y: 86, width: 15, height: 3 },
    text: { x: 21.5, y: 87.5 }
  },
  'achilles_tendon': {
    id: 'achilles_tendon',
    name: 'Achilles tendon',
    point: { x: 47, y: 96 },
    linePoints: [{ x: 47, y: 96 }, { x: 42, y: 94 }, { x: 27, y: 91 }],
    areaPoints: [{ x: 42, y: 94 }, { x: 52, y: 94 }, { x: 52, y: 98 }, { x: 42, y: 98 }],
    textBox: { x: 12, y: 90, width: 18, height: 3 },
    text: { x: 21, y: 91.5 }
  }
};