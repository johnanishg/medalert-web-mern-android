export interface SmartScheduleConfig {
  prescriptionTime: Date;
  frequency: string;
  doctorRecommendations?: string;
}

export interface SmartScheduleResult {
  timing: string[];
  startDate: Date;
  nextDoseTime: Date;
  explanation: string;
}

export class SmartScheduler {
  /**
   * Generate smart schedule based on prescription time and frequency
   */
  static generateSmartSchedule(config: SmartScheduleConfig): SmartScheduleResult {
    const { prescriptionTime, frequency, doctorRecommendations } = config;
    const currentHour = prescriptionTime.getHours();
    const currentMinute = prescriptionTime.getMinutes();
    
    // Parse frequency to determine how many times per day
    const timesPerDay = this.parseFrequency(frequency);
    
    // Determine the next appropriate time based on current time
    const nextTime = this.getNextAppropriateTime(currentHour, currentMinute, timesPerDay, doctorRecommendations);
    
    // Generate timing array based on frequency and next time
    const timing = this.generateTimingArray(timesPerDay, nextTime);
    
    // Calculate start date (today if it's early enough, tomorrow if too late)
    const startDate = this.calculateStartDate(prescriptionTime, nextTime);
    
    // Calculate next dose time
    const nextDoseTime = this.calculateNextDoseTime(startDate, timing[0]);
    
    // Generate explanation
    const explanation = this.generateExplanation(prescriptionTime, timing, startDate, doctorRecommendations);
    
    return {
      timing,
      startDate,
      nextDoseTime,
      explanation
    };
  }
  
  /**
   * Parse frequency string to determine times per day
   */
  private static parseFrequency(frequency: string): number {
    const freq = frequency.toLowerCase();
    
    if (freq.includes('once') || freq.includes('1 time') || freq.includes('daily')) {
      return 1;
    } else if (freq.includes('twice') || freq.includes('2 times') || freq.includes('bid')) {
      return 2;
    } else if (freq.includes('thrice') || freq.includes('3 times') || freq.includes('tid')) {
      return 3;
    } else if (freq.includes('4 times') || freq.includes('qid')) {
      return 4;
    } else if (freq.includes('every 6 hours') || freq.includes('6 hourly')) {
      return 4; // 4 times per day
    } else if (freq.includes('every 8 hours') || freq.includes('8 hourly')) {
      return 3; // 3 times per day
    } else if (freq.includes('every 12 hours') || freq.includes('12 hourly')) {
      return 2; // 2 times per day
    } else if (freq.includes('every 24 hours') || freq.includes('24 hourly')) {
      return 1; // 1 time per day
    }
    
    // Try to extract number from frequency
    const match = freq.match(/(\d+)\s*times?/);
    if (match) {
      return parseInt(match[1]);
    }
    
    // Default to once daily
    return 1;
  }
  
  /**
   * Get the next appropriate time based on current time and frequency
   */
  private static getNextAppropriateTime(
    currentHour: number, 
    currentMinute: number, 
    timesPerDay: number,
    doctorRecommendations?: string
  ): { hour: number; minute: number; label: string } {
    const currentTime = currentHour * 60 + currentMinute;
    
    // Define time slots
    const timeSlots = [
      { hour: 8, minute: 0, label: 'Morning', start: 6 * 60, end: 11 * 60 }, // 6:00 AM - 11:00 AM
      { hour: 14, minute: 0, label: 'Afternoon', start: 11 * 60, end: 17 * 60 }, // 11:00 AM - 5:00 PM
      { hour: 20, minute: 0, label: 'Evening', start: 17 * 60, end: 22 * 60 }, // 5:00 PM - 10:00 PM
      { hour: 22, minute: 0, label: 'Night', start: 22 * 60, end: 24 * 60 } // 10:00 PM - 12:00 AM
    ];
    
    // Check doctor recommendations first
    if (doctorRecommendations) {
      const rec = doctorRecommendations.toLowerCase();
      if (rec.includes('morning')) {
        return { hour: 8, minute: 0, label: 'Morning' };
      } else if (rec.includes('afternoon')) {
        return { hour: 14, minute: 0, label: 'Afternoon' };
      } else if (rec.includes('evening')) {
        return { hour: 20, minute: 0, label: 'Evening' };
      } else if (rec.includes('night')) {
        return { hour: 22, minute: 0, label: 'Night' };
      }
    }
    
    // Determine next appropriate time based on current time and frequency
    if (timesPerDay === 1) {
      // Once daily - find the next appropriate time slot
      for (const slot of timeSlots) {
        if (currentTime < slot.end) {
          return slot;
        }
      }
      // If it's very late, start tomorrow morning
      return timeSlots[0];
    } else if (timesPerDay === 2) {
      // Twice daily - morning and evening
      if (currentTime < 12 * 60) { // Before noon
        return { hour: 8, minute: 0, label: 'Morning' };
      } else {
        return { hour: 20, minute: 0, label: 'Evening' };
      }
    } else if (timesPerDay === 3) {
      // Three times daily - morning, afternoon, evening
      if (currentTime < 10 * 60) { // Before 10 AM
        return { hour: 8, minute: 0, label: 'Morning' };
      } else if (currentTime < 16 * 60) { // Before 4 PM
        return { hour: 14, minute: 0, label: 'Afternoon' };
      } else {
        return { hour: 20, minute: 0, label: 'Evening' };
      }
    } else if (timesPerDay === 4) {
      // Four times daily - every 6 hours
      if (currentTime < 6 * 60) { // Before 6 AM
        return { hour: 6, minute: 0, label: 'Early Morning' };
      } else if (currentTime < 12 * 60) { // Before noon
        return { hour: 12, minute: 0, label: 'Noon' };
      } else if (currentTime < 18 * 60) { // Before 6 PM
        return { hour: 18, minute: 0, label: 'Evening' };
      } else {
        return { hour: 0, minute: 0, label: 'Midnight' };
      }
    }
    
    // Default fallback
    return { hour: 8, minute: 0, label: 'Morning' };
  }
  
  /**
   * Generate timing array based on frequency and next time
   */
  private static generateTimingArray(timesPerDay: number, nextTime: { hour: number; minute: number }): string[] {
    const timing: string[] = [];
    
    if (timesPerDay === 1) {
      timing.push(`${nextTime.hour.toString().padStart(2, '0')}:${nextTime.minute.toString().padStart(2, '0')}`);
    } else if (timesPerDay === 2) {
      // Morning and evening
      timing.push('08:00', '20:00');
    } else if (timesPerDay === 3) {
      // Morning, afternoon, evening
      timing.push('08:00', '14:00', '20:00');
    } else if (timesPerDay === 4) {
      // Every 6 hours
      timing.push('06:00', '12:00', '18:00', '00:00');
    } else {
      // Custom frequency - distribute evenly
      const interval = 24 / timesPerDay;
      for (let i = 0; i < timesPerDay; i++) {
        const hour = Math.floor(i * interval);
        timing.push(`${hour.toString().padStart(2, '0')}:00`);
      }
    }
    
    return timing;
  }
  
  /**
   * Calculate start date based on prescription time and next dose time
   */
  private static calculateStartDate(prescriptionTime: Date, nextTime: { hour: number; minute: number }): Date {
    const currentHour = prescriptionTime.getHours();
    const currentMinute = prescriptionTime.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;
    const nextTimeMinutes = nextTime.hour * 60 + nextTime.minute;
    
    // If the next dose time is today and there's enough time (at least 30 minutes)
    if (nextTimeMinutes > currentTime + 30) {
      return new Date(prescriptionTime);
    } else {
      // Start tomorrow
      const tomorrow = new Date(prescriptionTime);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }
  }
  
  /**
   * Calculate next dose time
   */
  private static calculateNextDoseTime(startDate: Date, firstTime: string): Date {
    const [hours, minutes] = firstTime.split(':').map(Number);
    const nextDoseTime = new Date(startDate);
    nextDoseTime.setHours(hours, minutes, 0, 0);
    return nextDoseTime;
  }
  
  /**
   * Generate explanation for the schedule
   */
  private static generateExplanation(
    prescriptionTime: Date, 
    timing: string[], 
    startDate: Date, 
    doctorRecommendations?: string
  ): string {
    const prescriptionTimeStr = prescriptionTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    const startDateStr = startDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
    
    const timingStr = timing.map(time => {
      const [hours, minutes] = time.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    }).join(', ');
    
    let explanation = `Prescribed at ${prescriptionTimeStr}. `;
    
    if (doctorRecommendations) {
      explanation += `Based on doctor's recommendation (${doctorRecommendations}), `;
    }
    
    explanation += `medication schedule will start ${startDateStr} at ${timingStr}. `;
    
    if (timing.length === 1) {
      explanation += 'This is a once-daily medication.';
    } else {
      explanation += `This medication should be taken ${timing.length} times per day.`;
    }
    
    return explanation;
  }
}
