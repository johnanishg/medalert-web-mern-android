export interface Dose {
  id: string;
  scheduledTime: Date;
  timeLabel: string;
  taken: boolean;
  takenAt?: Date;
  notes?: string;
  isOverdue: boolean;
  isUpcoming: boolean;
  isCurrent: boolean;
  isActive: boolean; // New field to indicate if checkbox should be clickable
}

export interface MedicineSchedule {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  timing: string[];
  foodTiming: string;
  prescribedDate: string;
  totalDoses: number;
  doses: Dose[];
  adherenceRate: number;
}

export class DoseScheduler {
  /**
   * Generate all individual doses for a medicine based on its schedule
   */
  static generateDoses(medicine: any): Dose[] {
    const doses: Dose[] = [];
    
    // Parse timing from frequency if timing array is empty
    const timing = this.parseTimingFromFrequency(medicine);
    
    if (!timing || timing.length === 0) {
      return doses;
    }

    // Parse duration to get number of days
    const days = this.parseDuration(medicine.duration);
    
    if (days <= 0) {
      return doses;
    }

    // Get prescribed date
    const prescribedDate = new Date(medicine.prescribedDate);
    const startDate = new Date(prescribedDate);
    startDate.setHours(0, 0, 0, 0);

    // Generate doses for each day
    for (let day = 0; day < days; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + day);

      // Generate doses for each timing on this day
      timing.forEach((timeStr: string, timingIndex: number) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const scheduledTime = new Date(currentDate);
        scheduledTime.setHours(hours, minutes, 0, 0);

        // Check if this dose was already taken (from adherence records)
        const taken = this.checkIfDoseTaken(medicine, scheduledTime);
        const takenAt = taken ? this.getTakenTime(medicine, scheduledTime) : undefined;

        const dose: Dose = {
          id: `${medicine.name}-${day}-${timingIndex}-${scheduledTime.getTime()}`,
          scheduledTime,
          timeLabel: this.getTimeLabel(timeStr, medicine.foodTiming),
          taken,
          takenAt,
          isOverdue: this.isOverdue(scheduledTime),
          isUpcoming: this.isUpcoming(scheduledTime),
          isCurrent: this.isCurrent(scheduledTime),
          isActive: this.isActive(scheduledTime)
        };

        doses.push(dose);
      });
    }

    return doses.sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
  }

  /**
   * Parse timing from frequency field if timing array is empty
   */
  static parseTimingFromFrequency(medicine: any): string[] {
    try {
      // If timing array exists and has values, use it
      if (medicine.timing && medicine.timing.length > 0) {
        return medicine.timing;
      }

      // Parse from frequency field
      if (!medicine.frequency) return ['08:00']; // Default to morning if no frequency

    const frequency = medicine.frequency.toLowerCase();
    const timing: string[] = [];

    // Common timing patterns
    if (frequency.includes('morning')) {
      timing.push('08:00');
    }
    if (frequency.includes('afternoon')) {
      timing.push('14:00');
    }
    if (frequency.includes('night') || frequency.includes('evening')) {
      timing.push('20:00');
    }

    // If no standard timings found, try to extract times from the string
    if (timing.length === 0) {
      const timeMatches = frequency.match(/(\d{1,2}):(\d{2})/g);
      if (timeMatches) {
        timing.push(...timeMatches);
      }
    }

    return timing;
    } catch (error) {
      console.error('Error parsing timing from frequency:', error);
      return ['08:00']; // Default fallback
    }
  }

  /**
   * Parse duration string to get number of days
   */
  private static parseDuration(duration: string): number {
    if (!duration) return 0;
    
    const lowerDuration = duration.toLowerCase();
    
    // Extract number from duration string
    const match = lowerDuration.match(/(\d+)/);
    if (!match) return 0;
    
    const number = parseInt(match[1]);
    
    if (lowerDuration.includes('day')) {
      return number;
    } else if (lowerDuration.includes('week')) {
      return number * 7;
    } else if (lowerDuration.includes('month')) {
      return number * 30;
    }
    
    return number; // Default to days
  }

  /**
   * Check if a specific dose was taken based on adherence records
   */
  private static checkIfDoseTaken(medicine: any, scheduledTime: Date): boolean {
    if (!medicine.adherence || medicine.adherence.length === 0) {
      console.log('🔍 DoseScheduler: No adherence records for medicine:', medicine.name);
      return false;
    }

    // Use a more flexible approach - check if there are any taken records
    // and match them to doses based on date and approximate time
    const scheduledDate = new Date(scheduledTime);
    scheduledDate.setHours(0, 0, 0, 0);
    
    const scheduledTimeOfDay = scheduledTime.getHours() * 60 + scheduledTime.getMinutes();

    console.log('🔍 DoseScheduler: Checking if dose taken for:', {
      medicineName: medicine.name,
      scheduledTime: scheduledTime.toLocaleString(),
      scheduledDate: scheduledDate.toLocaleDateString(),
      scheduledTimeOfDay: scheduledTimeOfDay,
      adherenceRecords: medicine.adherence.length
    });

    const taken = medicine.adherence.some((record: any) => {
      const recordDate = new Date(record.timestamp);
      const recordDateOnly = new Date(recordDate);
      recordDateOnly.setHours(0, 0, 0, 0);
      
      const recordTimeOfDay = recordDate.getHours() * 60 + recordDate.getMinutes();
      const isTaken = record.taken;
      
      // Match by date and approximate time (within 2 hours)
      const isSameDate = recordDateOnly.getTime() === scheduledDate.getTime();
      const timeDiff = Math.abs(recordTimeOfDay - scheduledTimeOfDay);
      const isWithinTimeWindow = timeDiff <= 120; // 2 hours in minutes
      
      const matches = isSameDate && isWithinTimeWindow && isTaken;
      
      console.log('🔍 DoseScheduler: Checking record:', {
        recordTime: recordDate.toLocaleString(),
        recordDate: recordDateOnly.toLocaleDateString(),
        recordTimeOfDay: recordTimeOfDay,
        timeDiffMinutes: timeDiff,
        isSameDate,
        isWithinTimeWindow,
        isTaken,
        matches
      });
      
      return matches;
    });

    console.log('🔍 DoseScheduler: Dose taken result:', taken);
    return taken;
  }

  /**
   * Get the time when a dose was taken
   */
  private static getTakenTime(medicine: any, scheduledTime: Date): Date | undefined {
    if (!medicine.adherence || medicine.adherence.length === 0) {
      return undefined;
    }

    const scheduledDate = new Date(scheduledTime);
    scheduledDate.setHours(0, 0, 0, 0);
    const scheduledTimeOfDay = scheduledTime.getHours() * 60 + scheduledTime.getMinutes();

    const takenRecord = medicine.adherence.find((record: any) => {
      const recordDate = new Date(record.timestamp);
      const recordDateOnly = new Date(recordDate);
      recordDateOnly.setHours(0, 0, 0, 0);
      
      const recordTimeOfDay = recordDate.getHours() * 60 + recordDate.getMinutes();
      const timeDiff = Math.abs(recordTimeOfDay - scheduledTimeOfDay);
      
      const isSameDate = recordDateOnly.getTime() === scheduledDate.getTime();
      const isWithinTimeWindow = timeDiff <= 120; // 2 hours in minutes
      
      return record.taken && isSameDate && isWithinTimeWindow;
    });

    return takenRecord ? new Date(takenRecord.timestamp) : undefined;
  }

  /**
   * Check if a dose is overdue
   */
  private static isOverdue(scheduledTime: Date): boolean {
    const now = new Date();
    const timeDiff = now.getTime() - scheduledTime.getTime();
    return timeDiff > (30 * 60 * 1000); // 30 minutes past scheduled time
  }

  /**
   * Check if a dose is upcoming (within next 2 hours)
   */
  private static isUpcoming(scheduledTime: Date): boolean {
    const now = new Date();
    const timeDiff = scheduledTime.getTime() - now.getTime();
    return timeDiff > 0 && timeDiff <= (2 * 60 * 60 * 1000); // Next 2 hours
  }

  /**
   * Check if a dose is current (due within 30 minutes)
   */
  private static isCurrent(scheduledTime: Date): boolean {
    const now = new Date();
    const timeDiff = Math.abs(scheduledTime.getTime() - now.getTime());
    return timeDiff <= (30 * 60 * 1000); // Within 30 minutes
  }

  /**
   * Check if a dose is active (within 1-hour window: 30 mins before to 30 mins after)
   */
  private static isActive(scheduledTime: Date): boolean {
    const now = new Date();
    const timeDiff = Math.abs(scheduledTime.getTime() - now.getTime());
    return timeDiff <= (30 * 60 * 1000); // Within 30 minutes before or after
  }

  /**
   * Get formatted time label
   */
  private static getTimeLabel(timeStr: string, foodTiming: string): string {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const time = new Date();
    time.setHours(hours, minutes, 0, 0);
    
    const timeLabel = time.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });

    if (foodTiming && foodTiming !== '') {
      return `${timeLabel} (${foodTiming} food)`;
    }

    return timeLabel;
  }

  /**
   * Calculate adherence rate for a medicine
   */
  static calculateAdherenceRate(doses: Dose[]): number {
    if (doses.length === 0) return 0;
    
    const takenDoses = doses.filter(dose => dose.taken).length;
    return Math.round((takenDoses / doses.length) * 100);
  }

  /**
   * Get medicine schedule with all doses
   */
  static getMedicineSchedule(medicine: any): MedicineSchedule {
    const doses = this.generateDoses(medicine);
    const adherenceRate = this.calculateAdherenceRate(doses);
    const timing = this.parseTimingFromFrequency(medicine);

    // Add adherence records as individual dose entries for better tracking
    const adherenceDoses = this.createAdherenceDoses(medicine);
    const allDoses = [...doses, ...adherenceDoses].sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());

    return {
      name: medicine.name,
      dosage: medicine.dosage,
      frequency: medicine.frequency,
      duration: medicine.duration,
      timing: timing,
      foodTiming: medicine.foodTiming || this.parseFoodTimingFromFrequency(medicine.frequency),
      prescribedDate: medicine.prescribedDate,
      totalDoses: allDoses.length,
      doses: allDoses,
      adherenceRate
    };
  }

  /**
   * Create dose entries from adherence records
   */
  private static createAdherenceDoses(medicine: any): Dose[] {
    if (!medicine.adherence || medicine.adherence.length === 0) {
      return [];
    }

    return medicine.adherence.map((record: any, index: number) => {
      const recordTime = new Date(record.timestamp);
      
      return {
        id: `adherence-${medicine.name}-${index}-${recordTime.getTime()}`,
        scheduledTime: recordTime,
        timeLabel: this.getTimeLabel(
          `${recordTime.getHours().toString().padStart(2, '0')}:${recordTime.getMinutes().toString().padStart(2, '0')}`,
          medicine.foodTiming || this.parseFoodTimingFromFrequency(medicine.frequency)
        ),
        taken: record.taken,
        takenAt: record.taken ? recordTime : undefined,
        notes: record.notes || '',
        isOverdue: this.isOverdue(recordTime),
        isUpcoming: this.isUpcoming(recordTime),
        isCurrent: this.isCurrent(recordTime),
        isActive: false // Adherence records are never active (already recorded)
      };
    });
  }

  /**
   * Parse food timing from frequency field
   */
  private static parseFoodTimingFromFrequency(frequency: string): string {
    if (!frequency) return '';
    
    const freq = frequency.toLowerCase();
    if (freq.includes('before food')) return 'Before';
    if (freq.includes('after food')) return 'After';
    if (freq.includes('with food')) return 'With';
    
    return '';
  }
}
