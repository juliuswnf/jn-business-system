import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { captureError } from '../../utils/errorTracking';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { TrendingUp, TrendingDown, Camera, Target, Award, Calendar, Upload, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../utils/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function ProgressTracker({ customerId, trainerId }) {
  const [progressData, setProgressData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [weightTrend, setWeightTrend] = useState(null);
  const [performanceTrend, setPerformanceTrend] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('weight');
  const [loading, setLoading] = useState(true);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [photoCompareMode, setPhotoCompareMode] = useState(false);

  useEffect(() => {
    fetchProgressData();
  }, [customerId]);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      
      // Fetch all progress data
      const [historyRes, summaryRes, weightRes, performanceRes] = await Promise.all([
        api.get(`/api/progress/client/${customerId}`),
        api.get(`/api/progress/client/${customerId}/summary`),
        api.get(`/api/progress/client/${customerId}/weight-trend`),
        api.get(`/api/progress/client/${customerId}/performance-trend`, {
          params: { exercise: 'bench-press' } // Default exercise
        })
      ]);

      setProgressData(historyRes.data.progress || []);
      setSummary(summaryRes.data.summary || {});
      setWeightTrend(weightRes.data.trend || []);
      setPerformanceTrend(performanceRes.data.trend || []);
    } catch (error) {
      captureError(error, { context: 'fetchProgressData' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Progress Tracker</h1>
          <p className="text-gray-600">Track your fitness journey</p>
        </div>
        <button
          onClick={() => setShowAddEntry(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-500 text-zinc-900 rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Upload className="w-5 h-5" />
          <span>Log Progress</span>
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <SummaryCard
            title="Weight Change"
            value={summary.weightChange || 0}
            unit="kg"
            trend={summary.weightChange < 0 ? 'down' : 'up'}
            icon={TrendingDown}
            color="blue"
          />
          <SummaryCard
            title="Body Fat"
            value={summary.bodyFatChange || 0}
            unit="%"
            trend={summary.bodyFatChange < 0 ? 'down' : 'up'}
            icon={TrendingDown}
            color="green"
          />
          <SummaryCard
            title="Goals Achieved"
            value={summary.goalsAchieved || 0}
            unit="goals"
            icon={Target}
            color="purple"
          />
          <SummaryCard
            title="Total Entries"
            value={progressData.length}
            unit="entries"
            icon={Calendar}
            color="orange"
          />
        </div>
      )}

      {/* Chart Section */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
        {/* Metric Selector */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Progress Charts</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedMetric('weight')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedMetric === 'weight'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Weight
            </button>
            <button
              onClick={() => setSelectedMetric('bodyFat')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedMetric === 'bodyFat'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Body Fat
            </button>
            <button
              onClick={() => setSelectedMetric('performance')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedMetric === 'performance'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Performance
            </button>
          </div>
        </div>

        {/* Chart */}
        <div className="h-80">
          {selectedMetric === 'weight' && weightTrend && (
            <WeightChart data={weightTrend} />
          )}
          {selectedMetric === 'bodyFat' && progressData && (
            <BodyFatChart data={progressData} />
          )}
          {selectedMetric === 'performance' && performanceTrend && (
            <PerformanceChart data={performanceTrend} />
          )}
        </div>
      </div>

      {/* Photo Comparison */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Camera className="w-6 h-6 mr-2 text-blue-500" />
            Photo Progress
          </h2>
          <button
            onClick={() => setPhotoCompareMode(!photoCompareMode)}
            className="text-blue-500 hover:text-blue-600 font-medium"
          >
            {photoCompareMode ? 'View All' : 'Compare Photos'}
          </button>
        </div>

        {photoCompareMode ? (
          <PhotoComparison entries={progressData} />
        ) : (
          <PhotoGallery entries={progressData} />
        )}
      </div>

      {/* Progress Entries Timeline */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Progress Timeline</h2>
        <ProgressTimeline entries={progressData} />
      </div>
    </div>
  );
}

// Summary Card Component
function SummaryCard({ title, value, unit, trend, icon: Icon, color }) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600'
  };

  const TrendIcon = trend === 'down' ? TrendingDown : TrendingUp;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <TrendIcon className={`w-6 h-6 ${trend === 'down' && (color === 'blue' || color === 'green') ? 'text-green-500' : 'text-blue-500'}`} />
        )}
      </div>
      <h3 className="text-sm text-gray-600 mb-1">{title}</h3>
      <div className="flex items-baseline">
        <span className="text-3xl font-bold text-gray-900">{Math.abs(value)}</span>
        <span className="ml-2 text-zinc-400">{unit}</span>
      </div>
    </div>
  );
}

// Weight Chart Component
function WeightChart({ data }) {
  const chartData = {
    labels: data.map(d => new Date(d.date).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })),
    datasets: [
      {
        label: 'Weight (kg)',
        data: data.map(d => d.weight),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(59, 130, 246, 0.8)',
        borderWidth: 1
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  return <Line data={chartData} options={options} />;
}

// Body Fat Chart Component
function BodyFatChart({ data }) {
  const filteredData = data.filter(d => d.bodyFatPercentage);
  
  const chartData = {
    labels: filteredData.map(d => new Date(d.entryDate).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })),
    datasets: [
      {
        label: 'Body Fat %',
        data: filteredData.map(d => d.bodyFatPercentage),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  return <Line data={chartData} options={options} />;
}

// Performance Chart Component
function PerformanceChart({ data }) {
  const chartData = {
    labels: data.map(d => new Date(d.date).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })),
    datasets: [
      {
        label: 'Weight (kg)',
        data: data.map(d => d.weight),
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        title: {
          display: true,
          text: 'Weight (kg)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  return <Line data={chartData} options={options} />;
}

// Photo Gallery Component
function PhotoGallery({ entries }) {
  const entriesWithPhotos = entries.filter(e => e.photos && e.photos.length > 0);

  if (entriesWithPhotos.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-400">
        <Camera className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
        <p>No progress photos yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {entriesWithPhotos.map((entry) => (
        entry.photos.map((photo, idx) => (
          <div key={`${entry._id}-${idx}`} className="relative aspect-square rounded-lg overflow-hidden shadow-md hover:shadow-none transition-shadow">
            <img
              src={photo.url}
              alt={`Progress ${photo.type}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
              <p className="text-zinc-900 text-sm font-medium">{photo.type}</p>
              <p className="text-white/80 text-xs">
                {new Date(entry.entryDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))
      ))}
    </div>
  );
}

// Photo Comparison Component
function PhotoComparison({ entries }) {
  const [selectedEntries, setSelectedEntries] = useState([]);
  const entriesWithPhotos = entries.filter(e => e.photos && e.photos.length > 0);

  useEffect(() => {
    if (entriesWithPhotos.length >= 2) {
      setSelectedEntries([
        entriesWithPhotos[0], // First entry
        entriesWithPhotos[entriesWithPhotos.length - 1] // Latest entry
      ]);
    }
  }, [entries]);

  if (entriesWithPhotos.length < 2) {
    return (
      <div className="text-center py-8 text-zinc-400">
        <p>Need at least 2 progress photos to compare</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {selectedEntries.map((entry, idx) => (
        <div key={entry._id} className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-900">
              {idx === 0 ? 'Before' : 'After'}
            </h3>
            <p className="text-sm text-gray-600">
              {new Date(entry.entryDate).toLocaleDateString()}
            </p>
          </div>
          {entry.photos.map((photo, photoIdx) => (
            <div key={photoIdx} className="aspect-square rounded-lg overflow-hidden shadow-sm">
              <img
                src={photo.url}
                alt={`${photo.type}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// Progress Timeline Component
function ProgressTimeline({ entries }) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-400">
        <p>No progress entries yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {entries.map((entry, idx) => (
        <div key={entry._id} className="relative pl-8 pb-8 border-l-2 border-blue-200 last:border-l-0 last:pb-0">
          {/* Timeline Dot */}
          <div className="absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full bg-blue-500 border-4 border-white"></div>

          {/* Content */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold text-gray-900">
                  {new Date(entry.entryDate).toLocaleDateString('de-DE', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <p className="text-sm text-zinc-400">
                  by {entry.trainerId?.name || 'Trainer'}
                </p>
              </div>
              {entry.goalsAchieved && entry.goalsAchieved.length > 0 && (
                <Award className="w-6 h-6 text-yellow-500" />
              )}
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-4 mb-3">
              {entry.weight && (
                <div>
                  <p className="text-xs text-zinc-400">Weight</p>
                  <p className="font-semibold text-gray-900">{entry.weight} kg</p>
                </div>
              )}
              {entry.bodyFatPercentage && (
                <div>
                  <p className="text-xs text-zinc-400">Body Fat</p>
                  <p className="font-semibold text-gray-900">{entry.bodyFatPercentage}%</p>
                </div>
              )}
              {entry.muscleMass && (
                <div>
                  <p className="text-xs text-zinc-400">Muscle Mass</p>
                  <p className="font-semibold text-gray-900">{entry.muscleMass} kg</p>
                </div>
              )}
            </div>

            {/* Notes */}
            {entry.notes && (
              <p className="text-sm text-gray-700 mb-3">{entry.notes}</p>
            )}

            {/* Photos */}
            {entry.photos && entry.photos.length > 0 && (
              <div className="flex space-x-2">
                {entry.photos.map((photo, photoIdx) => (
                  <img
                    key={photoIdx}
                    src={photo.url}
                    alt={photo.type}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
