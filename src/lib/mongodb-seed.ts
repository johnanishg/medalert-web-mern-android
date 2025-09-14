import { MongoDBService, MedicationDocument } from './mongodb';

// Sample medications data for seeding
const sampleMedications: Omit<MedicationDocument, '_id' | 'createdAt'>[] = [
  {
    name: 'Lisinopril',
    genericName: 'lisinopril',
    brandNames: ['Prinivil', 'Zestril'],
    dosageForm: 'tablet',
    strength: '10mg',
    description: 'ACE inhibitor for high blood pressure',
    sideEffects: ['dizziness', 'dry cough', 'headache'],
    contraindications: ['pregnancy', 'kidney disease']
  },
  {
    name: 'Metformin',
    genericName: 'metformin',
    brandNames: ['Glucophage', 'Fortamet'],
    dosageForm: 'tablet',
    strength: '500mg',
    description: 'Diabetes medication to control blood sugar',
    sideEffects: ['nausea', 'diarrhea', 'stomach upset'],
    contraindications: ['kidney disease', 'liver disease']
  },
  {
    name: 'Atorvastatin',
    genericName: 'atorvastatin',
    brandNames: ['Lipitor'],
    dosageForm: 'tablet',
    strength: '20mg',
    description: 'Statin to lower cholesterol',
    sideEffects: ['muscle pain', 'liver problems', 'memory issues'],
    contraindications: ['liver disease', 'pregnancy']
  },
  {
    name: 'Omeprazole',
    genericName: 'omeprazole',
    brandNames: ['Prilosec'],
    dosageForm: 'capsule',
    strength: '20mg',
    description: 'Proton pump inhibitor for acid reflux',
    sideEffects: ['headache', 'nausea', 'diarrhea'],
    contraindications: ['liver disease']
  },
  {
    name: 'Aspirin',
    genericName: 'acetylsalicylic acid',
    brandNames: ['Bayer', 'Bufferin'],
    dosageForm: 'tablet',
    strength: '81mg',
    description: 'Low-dose aspirin for heart health',
    sideEffects: ['stomach irritation', 'bleeding risk'],
    contraindications: ['bleeding disorders', 'stomach ulcers']
  },
  {
    name: 'Vitamin D3',
    genericName: 'cholecalciferol',
    brandNames: ['Nature Made', 'Kirkland'],
    dosageForm: 'tablet',
    strength: '1000 IU',
    description: 'Vitamin D supplement for bone health',
    sideEffects: ['nausea', 'vomiting', 'weakness'],
    contraindications: ['hypercalcemia', 'kidney stones']
  },
  {
    name: 'Calcium Carbonate',
    genericName: 'calcium carbonate',
    brandNames: ['Tums', 'Caltrate'],
    dosageForm: 'tablet',
    strength: '500mg',
    description: 'Calcium supplement for bone health',
    sideEffects: ['constipation', 'gas', 'bloating'],
    contraindications: ['kidney stones', 'hypercalcemia']
  },
  {
    name: 'Levothyroxine',
    genericName: 'levothyroxine',
    brandNames: ['Synthroid', 'Levoxyl'],
    dosageForm: 'tablet',
    strength: '50mcg',
    description: 'Thyroid hormone replacement',
    sideEffects: ['heart palpitations', 'insomnia', 'weight loss'],
    contraindications: ['heart disease', 'adrenal insufficiency']
  },
  {
    name: 'Amlodipine',
    genericName: 'amlodipine',
    brandNames: ['Norvasc'],
    dosageForm: 'tablet',
    strength: '5mg',
    description: 'Calcium channel blocker for blood pressure',
    sideEffects: ['swelling', 'dizziness', 'flushing'],
    contraindications: ['severe heart failure', 'liver disease']
  },
  {
    name: 'Gabapentin',
    genericName: 'gabapentin',
    brandNames: ['Neurontin'],
    dosageForm: 'capsule',
    strength: '300mg',
    description: 'Anticonvulsant for nerve pain',
    sideEffects: ['drowsiness', 'dizziness', 'fatigue'],
    contraindications: ['kidney disease']
  }
];

export async function seedMongoDB() {
  try {
    await MongoDBService.initialize();
    
    console.log('Seeding medications...');
    for (const medication of sampleMedications) {
      await MongoDBService.createMedication(medication);
    }
    
    console.log('MongoDB seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding MongoDB:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedMongoDB().catch(console.error);
}