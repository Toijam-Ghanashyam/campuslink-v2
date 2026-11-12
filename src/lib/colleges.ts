export interface College {
  id: string;
  code: string;
  name: string;
  district: string;
}

export const AFFILIATED_COLLEGES: College[] = [
  {
    id: 'e9ad5cc3-f368-401f-9363-d478c4b433cc',
    code: 'BPUT_CAMPUS',
    name: 'BPUT Central University Campus, Rourkela',
    district: 'Sundargarh',
  },
  {
    id: '11111111-1111-4111-a111-111111111111',
    code: 'OUTR',
    name: 'Odisha University of Technology and Research (OUTR / CET), Bhubaneswar',
    district: 'Khurda',
  },
  {
    id: '22222222-2222-4222-a222-222222222222',
    code: 'PMEC',
    name: 'Parala Maharaja Engineering College (PMEC), Berhampur',
    district: 'Ganjam',
  },
  {
    id: '33333333-3333-4333-a333-333333333333',
    code: 'GCEK',
    name: 'Government College of Engineering (GCEK), Kalahandi',
    district: 'Kalahandi',
  },
  {
    id: '44444444-4444-4444-a444-444444444444',
    code: 'VSSUT',
    name: 'Veer Surendra Sai University of Technology (VSSUT), Burla',
    district: 'Sambalpur',
  },
  {
    id: '55555555-5555-4555-a555-555555555555',
    code: 'SILICON',
    name: 'Silicon Institute of Technology, Bhubaneswar',
    district: 'Khurda',
  },
  {
    id: '66666666-6666-4666-a666-666666666666',
    code: 'CVRCE',
    name: 'C. V. Raman Global University (CVRCE), Bhubaneswar',
    district: 'Khurda',
  },
  {
    id: '77777777-7777-4777-a777-777777777777',
    code: 'IGIT',
    name: 'Indira Gandhi Institute of Technology (IGIT), Sarang',
    district: 'Dhenkanal',
  },
];

export function getCollegeById(id?: string | null): College {
  if (!id) return AFFILIATED_COLLEGES[0];
  return (
    AFFILIATED_COLLEGES.find((c) => c.id === id || c.code.toLowerCase() === id.toLowerCase()) ||
    AFFILIATED_COLLEGES[0]
  );
}

