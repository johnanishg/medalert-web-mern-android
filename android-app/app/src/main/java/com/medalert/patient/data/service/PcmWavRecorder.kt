package com.medalert.patient.data.service

import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.isActive
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import java.io.IOException
import kotlin.math.min

class PcmWavRecorder(
    private val sampleRateHz: Int = 16000,
    private val channelConfig: Int = AudioFormat.CHANNEL_IN_MONO,
    private val audioFormat: Int = AudioFormat.ENCODING_PCM_16BIT
) {
    private var audioRecord: AudioRecord? = null
    private val pcmBuffer = ByteArrayOutputStream()
    private var isRecording = false

    fun start(): Boolean {
        val minBuffer = AudioRecord.getMinBufferSize(sampleRateHz, channelConfig, audioFormat)
        if (minBuffer == AudioRecord.ERROR || minBuffer == AudioRecord.ERROR_BAD_VALUE) return false

        audioRecord = AudioRecord(
            MediaRecorder.AudioSource.MIC,
            sampleRateHz,
            channelConfig,
            audioFormat,
            minBuffer * 2
        )
        return try {
            audioRecord?.startRecording()
            isRecording = true
            pcmBuffer.reset()
            startRecordingLoop()
            true
        } catch (e: Exception) {
            false
        }
    }

    fun stop() {
        isRecording = false
        try { audioRecord?.stop() } catch (_: Exception) {}
        try { audioRecord?.release() } catch (_: Exception) {}
        audioRecord = null
    }

    private fun startRecordingLoop() {
        Thread {
            val buffer = ByteArray(2048)
            val ar = audioRecord ?: return@Thread
            
            while (isRecording && ar.recordingState == AudioRecord.RECORDSTATE_RECORDING) {
                try {
                    val read = ar.read(buffer, 0, buffer.size)
                    if (read > 0) {
                        synchronized(pcmBuffer) {
                            pcmBuffer.write(buffer, 0, read)
                        }
                    }
                } catch (e: Exception) {
                    break
                }
            }
        }.start()
    }

    fun getWavBytes(): ByteArray {
        val pcmBytes = synchronized(pcmBuffer) {
            pcmBuffer.toByteArray()
        }
        return wrapPcmToWav(pcmBytes, sampleRateHz, 1, 16)
    }

    private fun wrapPcmToWav(pcmData: ByteArray, sampleRate: Int, channels: Int, bitsPerSample: Int): ByteArray {
        val byteRate = sampleRate * channels * bitsPerSample / 8
        val wavHeader = ByteArrayOutputStream()
        try {
            // RIFF header
            wavHeader.write("RIFF".toByteArray())
            wavHeader.write(intToLittleEndian(36 + pcmData.size))
            wavHeader.write("WAVE".toByteArray())

            // fmt subchunk
            wavHeader.write("fmt ".toByteArray())
            wavHeader.write(intToLittleEndian(16)) // Subchunk1Size for PCM
            wavHeader.write(shortToLittleEndian(1)) // AudioFormat PCM
            wavHeader.write(shortToLittleEndian(channels))
            wavHeader.write(intToLittleEndian(sampleRate))
            wavHeader.write(intToLittleEndian(byteRate))
            wavHeader.write(shortToLittleEndian((channels * bitsPerSample / 8))) // BlockAlign
            wavHeader.write(shortToLittleEndian(bitsPerSample))

            // data subchunk
            wavHeader.write("data".toByteArray())
            wavHeader.write(intToLittleEndian(pcmData.size))
        } catch (e: IOException) {
            // ignore
        }

        val out = ByteArrayOutputStream()
        out.write(wavHeader.toByteArray())
        out.write(pcmData)
        return out.toByteArray()
    }

    private fun intToLittleEndian(value: Int): ByteArray {
        return byteArrayOf(
            (value and 0xff).toByte(),
            ((value shr 8) and 0xff).toByte(),
            ((value shr 16) and 0xff).toByte(),
            ((value shr 24) and 0xff).toByte()
        )
    }

    private fun shortToLittleEndian(value: Int): ByteArray {
        return byteArrayOf(
            (value and 0xff).toByte(),
            ((value shr 8) and 0xff).toByte()
        )
    }
}


