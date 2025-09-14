import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, BarChart3, Brain, X, Pill } from 'lucide-react';
import { adherenceAnalysisService, AdherenceAnalysis, MedicineAdherence } from '../services/adherenceAnalysisService';
import logger from '../services/logger';

interface AdherenceAnalysisProps {
  patientId: string;
  patientName: string;
  onClose: () => void;
}

const AdherenceAnalysisComponent: React.FC<AdherenceAnalysisProps> = ({
  patientId,
  patientName,
  onClose
}) => {
  const [analysis, setAnalysis] = useState<AdherenceAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAdherenceData();
  }, [patientId]);

  const fetchAdherenceData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/adherence/patient/${patientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const adherenceData: MedicineAdherence[] = data.adherenceData;
        
        // Debug: Log the actual data received from database
        console.log('Raw adherence data from database:', data);
        console.log('Processed adherence data:', adherenceData);
        
        // Generate AI analysis
        const aiAnalysis = await adherenceAnalysisService.analyzeAdherence(patientName, adherenceData);
        setAnalysis(aiAnalysis);
        
        logger.success('Adherence analysis generated', 'AdherenceAnalysis');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch adherence data');
        logger.error(`Failed to fetch adherence data: ${errorData.message}`, 'AdherenceAnalysis');
      }
    } catch (error) {
      setError('Error generating adherence analysis');
      logger.error('Error generating adherence analysis', 'AdherenceAnalysis');
    } finally {
      setLoading(false);
    }
  };

  const getAdherenceColor = (rate: number): string => {
    if (rate >= 80) return 'text-green-600 dark:text-green-400';
    if (rate >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getAdherenceBgColor = (rate: number): string => {
    if (rate >= 80) return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    if (rate >= 60) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
  };

  const getAdherenceIcon = (rate: number) => {
    if (rate >= 80) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (rate >= 60) return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    return <TrendingDown className="w-5 h-5 text-red-600" />;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg max-w-2xl w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Generating AI analysis...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Analysis Error</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <Brain className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                AI Adherence Analysis
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
              Patient: {patientName}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Analysis generated on {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Overall Adherence Rate */}
          <div className={`p-4 rounded-lg border mb-6 ${getAdherenceBgColor(analysis.overallAdherenceRate)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getAdherenceIcon(analysis.overallAdherenceRate)}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Overall Adherence Rate</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Across all medications</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold ${getAdherenceColor(analysis.overallAdherenceRate)}`}>
                  {analysis.overallAdherenceRate}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {analysis.overallAdherenceRate >= 80 ? 'Excellent' : 
                   analysis.overallAdherenceRate >= 60 ? 'Good' : 'Needs Improvement'}
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              AI Summary
            </h4>
            <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              {analysis.summary}
            </p>
          </div>

          {/* Medicine Insights */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Pill className="w-5 h-5 mr-2" />
              Medicine-Specific Insights
            </h4>
            {analysis.medicineInsights.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Pill size={48} className="mx-auto mb-4 opacity-50" />
                <p>No adherence data available for analysis.</p>
                <p className="text-sm mt-2">Start tracking medicine adherence to see insights.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {analysis.medicineInsights.map((insight, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h5 className="font-medium text-gray-900 dark:text-white">{insight.medicineName}</h5>
                    <div className="text-right">
                      <div className={`text-xl font-bold ${getAdherenceColor(insight.adherenceRate)}`}>
                        {insight.adherenceRate}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {insight.missedDoses} missed / {insight.totalDoses} total
                      </div>
                    </div>
                  </div>
                  
                  {insight.patterns.length > 0 && (
                    <div className="mb-3">
                      <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observed Patterns:</h6>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {insight.patterns.map((pattern, patternIndex) => (
                          <li key={patternIndex} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{pattern}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {insight.recommendations.length > 0 && (
                    <div>
                      <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recommendations:</h6>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {insight.recommendations.map((recommendation, recIndex) => (
                          <li key={recIndex} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{recommendation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
              </div>
            )}
          </div>

          {/* General Recommendations */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              General Recommendations
            </h4>
            <div className="space-y-2">
              {analysis.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">{recommendation}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Factors */}
          {analysis.riskFactors.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                Risk Factors
              </h4>
              <div className="space-y-2">
                {analysis.riskFactors.map((risk, index) => (
                  <div key={index} className="flex items-start p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-orange-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{risk}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Patterns */}
          {analysis.patterns.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Overall Patterns
              </h4>
              <div className="space-y-2">
                {analysis.patterns.map((pattern, index) => (
                  <div key={index} className="flex items-start p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="mr-2">•</span>
                    <span className="text-gray-700 dark:text-gray-300">{pattern}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdherenceAnalysisComponent;
