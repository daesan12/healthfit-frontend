import { mapBodyRecord } from './adapters'
import { apiClient, unwrapResponse } from './client'

function toBodyRecordPayload(record) {
  return {
    record_date: record.recordDate,
    weight: record.weight || null,
    body_fat_percentage: record.bodyFatPercentage || null,
    skeletal_muscle_mass: record.skeletalMuscleMass || null,
  }
}

export async function getBodyRecords(params) {
  const response = await apiClient.get('/body-records/', { params })
  const data = unwrapResponse(response)
  return Array.isArray(data) ? data.map(mapBodyRecord) : data
}

export async function createBodyRecord(record) {
  const response = await apiClient.post('/body-records/', toBodyRecordPayload(record))
  return mapBodyRecord(unwrapResponse(response))
}

export async function updateBodyRecord(recordId, record) {
  const response = await apiClient.patch(`/body-records/${recordId}/`, toBodyRecordPayload(record))
  return mapBodyRecord(unwrapResponse(response))
}

export async function deleteBodyRecord(recordId) {
  const response = await apiClient.delete(`/body-records/${recordId}/`)
  return unwrapResponse(response)
}
