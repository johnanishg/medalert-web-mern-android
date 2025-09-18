package com.medalert.patient.data.local

import android.content.Context
import androidx.room.*
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
import com.medalert.patient.data.model.DoseRecord
import com.medalert.patient.data.model.DoseStatus
import com.medalert.patient.data.model.ScheduledDose
import kotlinx.coroutines.flow.Flow

@Database(
    entities = [DoseRecordEntity::class, ScheduledDoseEntity::class],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class DoseTrackingDatabase : RoomDatabase() {
    abstract fun doseTrackingDao(): DoseTrackingDao
}

@Entity(tableName = "dose_records")
data class DoseRecordEntity(
    @PrimaryKey val id: String,
    val scheduledDoseId: String,
    val scheduledTime: String,
    val scheduledDate: String,
    val actualTime: String,
    val actualDate: String,
    val status: DoseStatus,
    val notes: String,
    val recordedAt: String,
    val recordedBy: String
) {
    fun toDoseRecord(): DoseRecord {
        return DoseRecord(
            id = id,
            scheduledDoseId = scheduledDoseId,
            scheduledTime = scheduledTime,
            scheduledDate = scheduledDate,
            actualTime = actualTime,
            actualDate = actualDate,
            status = status,
            notes = notes,
            recordedAt = recordedAt,
            recordedBy = recordedBy
        )
    }
    
    companion object {
        fun fromDoseRecord(doseRecord: DoseRecord): DoseRecordEntity {
            return DoseRecordEntity(
                id = doseRecord.id,
                scheduledDoseId = doseRecord.scheduledDoseId,
                scheduledTime = doseRecord.scheduledTime,
                scheduledDate = doseRecord.scheduledDate,
                actualTime = doseRecord.actualTime,
                actualDate = doseRecord.actualDate,
                status = doseRecord.status,
                notes = doseRecord.notes,
                recordedAt = doseRecord.recordedAt,
                recordedBy = doseRecord.recordedBy
            )
        }
    }
}

@Entity(tableName = "scheduled_doses")
data class ScheduledDoseEntity(
    @PrimaryKey val id: String,
    val medicationId: String,
    val time: String,
    val label: String,
    val dosage: String,
    val isActive: Boolean,
    val daysOfWeek: List<Int>,
    val startDate: String,
    val endDate: String,
    val notes: String
) {
    fun toScheduledDose(): ScheduledDose {
        return ScheduledDose(
            id = id,
            time = time,
            label = label,
            dosage = dosage,
            isActive = isActive,
            daysOfWeek = daysOfWeek,
            startDate = startDate,
            endDate = endDate,
            notes = notes
        )
    }
    
    companion object {
        fun fromScheduledDose(scheduledDose: ScheduledDose, medicationId: String): ScheduledDoseEntity {
            return ScheduledDoseEntity(
                id = scheduledDose.id,
                medicationId = medicationId,
                time = scheduledDose.time,
                label = scheduledDose.label,
                dosage = scheduledDose.dosage,
                isActive = scheduledDose.isActive,
                daysOfWeek = scheduledDose.daysOfWeek,
                startDate = scheduledDose.startDate,
                endDate = scheduledDose.endDate,
                notes = scheduledDose.notes
            )
        }
    }
}

@Dao
interface DoseTrackingDao {
    // Dose Records
    @Query("SELECT * FROM dose_records WHERE scheduledDoseId = :scheduledDoseId AND scheduledDate = :scheduledDate")
    suspend fun getDoseRecord(scheduledDoseId: String, scheduledDate: String): DoseRecordEntity?
    
    @Query("SELECT * FROM dose_records WHERE scheduledDoseId = :scheduledDoseId ORDER BY scheduledDate DESC")
    fun getDoseRecordsForScheduledDose(scheduledDoseId: String): Flow<List<DoseRecordEntity>>
    
    @Query("SELECT * FROM dose_records WHERE scheduledDate = :date ORDER BY scheduledTime")
    fun getDoseRecordsForDate(date: String): Flow<List<DoseRecordEntity>>
    
    @Query("SELECT * FROM dose_records WHERE scheduledDate BETWEEN :startDate AND :endDate ORDER BY scheduledDate, scheduledTime")
    fun getDoseRecordsForDateRange(startDate: String, endDate: String): Flow<List<DoseRecordEntity>>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDoseRecord(doseRecord: DoseRecordEntity)
    
    @Update
    suspend fun updateDoseRecord(doseRecord: DoseRecordEntity)
    
    @Delete
    suspend fun deleteDoseRecord(doseRecord: DoseRecordEntity)
    
    @Query("DELETE FROM dose_records WHERE scheduledDoseId = :scheduledDoseId")
    suspend fun deleteDoseRecordsForScheduledDose(scheduledDoseId: String)
    
    // Scheduled Doses
    @Query("SELECT * FROM scheduled_doses WHERE medicationId = :medicationId")
    fun getScheduledDosesForMedication(medicationId: String): Flow<List<ScheduledDoseEntity>>
    
    @Query("SELECT * FROM scheduled_doses WHERE medicationId = :medicationId AND isActive = 1")
    fun getActiveScheduledDosesForMedication(medicationId: String): Flow<List<ScheduledDoseEntity>>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertScheduledDose(scheduledDose: ScheduledDoseEntity)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertScheduledDoses(scheduledDoses: List<ScheduledDoseEntity>)
    
    @Update
    suspend fun updateScheduledDose(scheduledDose: ScheduledDoseEntity)
    
    @Delete
    suspend fun deleteScheduledDose(scheduledDose: ScheduledDoseEntity)
    
    @Query("DELETE FROM scheduled_doses WHERE medicationId = :medicationId")
    suspend fun deleteScheduledDosesForMedication(medicationId: String)
    
    // Statistics
    @Query("SELECT COUNT(*) FROM dose_records WHERE scheduledDoseId = :scheduledDoseId")
    suspend fun getTotalDoseCount(scheduledDoseId: String): Int
    
    @Query("SELECT COUNT(*) FROM dose_records WHERE scheduledDoseId = :scheduledDoseId AND status = :status")
    suspend fun getDoseCountByStatus(scheduledDoseId: String, status: DoseStatus): Int
    
    @Query("SELECT COUNT(*) FROM dose_records WHERE scheduledDoseId = :scheduledDoseId AND status = 'TAKEN'")
    suspend fun getTakenDoseCount(scheduledDoseId: String): Int
}

class Converters {
    @TypeConverter
    fun fromDoseStatus(status: DoseStatus): String {
        return status.name
    }
    
    @TypeConverter
    fun toDoseStatus(status: String): DoseStatus {
        return DoseStatus.valueOf(status)
    }
    
    @TypeConverter
    fun fromIntList(value: List<Int>): String {
        return value.joinToString(",")
    }
    
    @TypeConverter
    fun toIntList(value: String): List<Int> {
        return if (value.isEmpty()) emptyList() else value.split(",").map { it.toInt() }
    }
}

object DatabaseMigrations {
    val MIGRATION_1_2 = object : Migration(1, 2) {
        override fun migrate(database: SupportSQLiteDatabase) {
            // Add any future migrations here
        }
    }
}

// Database instance
object DoseTrackingDatabaseProvider {
    private var INSTANCE: DoseTrackingDatabase? = null
    
    fun getDatabase(context: Context): DoseTrackingDatabase {
        return INSTANCE ?: synchronized(this) {
            val instance = Room.databaseBuilder(
                context.applicationContext,
                DoseTrackingDatabase::class.java,
                "dose_tracking_database"
            )
                .fallbackToDestructiveMigration()
                .build()
            INSTANCE = instance
            instance
        }
    }
}
