package v1

import (
	"math"
	"testing"
	"time"
)

var defaultActualTargetPoints = 120                // Default target points for bucket size calculation
var maxBucketSizeGlobal = 24 * time.Hour.Seconds() // 1 day in seconds
var minBucketSizeGlobal = 20                       // Minimum bucket size in seconds

// Helper function to log bucket info (remains the same)
func logBucketInfoForTest(t *testing.T, hours float64, targetPointsInput int, expectedMinBuckets, expectedMaxBuckets int, actualSize int, idealSize float64) {
	if !t.Failed() {
		effectiveTarget := targetPointsInput
		if targetPointsInput <= 0 {
			effectiveTarget = defaultActualTargetPoints
		}
		if actualSize <= 0 {
			t.Logf("Hours: %.2f, TargetPtsInput: %d (Effective: %d), IdealSize: %.1fs, Actual Size: %d (Invalid size)",
				hours, targetPointsInput, effectiveTarget, idealSize, actualSize)
			return
		}
		totalSeconds := hours * float64(time.Hour.Seconds())
		actualBuckets := 0
		if totalSeconds > 0 {
			actualBuckets = int(math.Ceil(totalSeconds / float64(actualSize)))
		}

		t.Logf("Hours: %.2f, TargetPtsInput: %d (Effective: %d), IdealSize: %.1fs, Actual Size: %d s (%s), Actual Buckets: %d (Expected Buckets Range: %d-%d)",
			hours,
			targetPointsInput,
			effectiveTarget,
			idealSize,
			actualSize,
			time.Duration(actualSize)*time.Second,
			actualBuckets,
			expectedMinBuckets,
			expectedMaxBuckets,
		)
	}
}

func TestCalcBucketSize_FinerGranularity(t *testing.T) {
	// defaultActualTargetPoints is 120
	// minBucketSizeGlobal is 20
	// maxBucketSizeGlobal is 1 day (86400s)

	tests := []struct {
		name                   string
		hours                  float64
		targetPointInput       int
		expectedBucketSize     int  // Precise expected size after snapping and limits
		assertBucketCountRange bool // Whether to check bucket count range
		expectedMinBuckets     int
		expectedMaxBuckets     int
	}{
		// Edge Cases
		{
			name:               "Zero Hours",
			hours:              0,
			targetPointInput:   120,
			expectedBucketSize: GetMinBucketSize(), // 20s
		},
		{
			name:               "Negative Hours",
			hours:              -10,
			targetPointInput:   120,
			expectedBucketSize: GetMinBucketSize(), // 20s
		},
		{
			name:                   "Invalid Target Points (<=0), 1 hour",
			hours:                  1,  // 3600s
			targetPointInput:       0,  // Uses default 120. ideal=3600/120=30s. Snaps to 30s.
			expectedBucketSize:     30, // 30s
			assertBucketCountRange: true,
			expectedMinBuckets:     118, // 3600/30 = 120
			expectedMaxBuckets:     122,
		},

		// --- Default Target (120 points) ---
		{
			name:                   "15 Min (0.25h), Default Target (120)",
			hours:                  0.25, // 900s
			targetPointInput:       120,  // ideal=900/120=7.5s. MinSize=20s. Snaps to 20s.
			expectedBucketSize:     20,   // minBucketSizeGlobal
			assertBucketCountRange: true,
			expectedMinBuckets:     44, // 900/20 = 45
			expectedMaxBuckets:     46,
		},
		{
			name:                   "30 Min (0.5h), Default Target (120)",
			hours:                  0.5, // 1800s
			targetPointInput:       120, // ideal=1800/120=15s. MinSize=20s. Snaps to 20s.
			expectedBucketSize:     20,  // minBucketSizeGlobal
			assertBucketCountRange: true,
			expectedMinBuckets:     89, // 1800/20 = 90
			expectedMaxBuckets:     91,
		},
		{
			name:                   "45 Min (0.75h), Default Target (120)",
			hours:                  0.75, // 2700s
			targetPointInput:       120,  // ideal=2700/120=22.5s. Closest nice: 20s or 30s. Snaps to 20s (diff 2.5 vs 7.5)
			expectedBucketSize:     20,
			assertBucketCountRange: true,
			expectedMinBuckets:     134, // 2700/20 = 135
			expectedMaxBuckets:     136,
		},
		{
			name:                   "1 Hour, Default Target (120)",
			hours:                  1,   // 3600s
			targetPointInput:       120, // ideal=30s. Snaps to 30s.
			expectedBucketSize:     30,
			assertBucketCountRange: true,
			expectedMinBuckets:     119, // 3600/30 = 120
			expectedMaxBuckets:     121,
		},
		{
			name:                   "1.5 Hours, Default Target (120)",
			hours:                  1.5, // 5400s
			targetPointInput:       120, // ideal=5400/120=45s. Snaps to 45s.
			expectedBucketSize:     45,
			assertBucketCountRange: true,
			expectedMinBuckets:     119, // 5400/45 = 120
			expectedMaxBuckets:     121,
		},
		{
			name:                   "6 Hours, Default Target (120)",
			hours:                  6,   // 21600s
			targetPointInput:       120, // ideal=21600/120=180s (3m). Snaps to 3m.
			expectedBucketSize:     180, // 3 minutes
			assertBucketCountRange: true,
			expectedMinBuckets:     119, // 21600/180 = 120
			expectedMaxBuckets:     121,
		},
		{
			name:                   "1 Day (24h), Default Target (120)",
			hours:                  24,  // 86400s
			targetPointInput:       120, // ideal=86400/120=720s (12m). Closest nice: 10m (600s) or 15m (900s). Diff 120 vs 180. Snaps to 10m (600s).
			expectedBucketSize:     600, // 10 minutes
			assertBucketCountRange: true,
			expectedMinBuckets:     143, // 86400/600 = 144
			expectedMaxBuckets:     145,
		},

		// --- Varying Target Points ---
		{
			name:                   "1 Day (24h), Target 60 Points",
			hours:                  24,   // 86400s
			targetPointInput:       60,   // ideal=86400/60=1440s (24m). Closest nice: 20m (1200s) or 30m (1800s). Diff 240 vs 360. Snaps to 20m.
			expectedBucketSize:     1200, // 20 minutes
			assertBucketCountRange: true,
			expectedMinBuckets:     71, // 86400/1200 = 72
			expectedMaxBuckets:     73,
		},
		{
			name:                   "1 Day (24h), Target 200 Points",
			hours:                  24,  // 86400s
			targetPointInput:       200, // ideal=86400/200=432s (7.2m). Closest nice: 7.5m (450s) or 5m (300s). Diff 18 vs 132. Snaps to 7.5m.
			expectedBucketSize:     450, // 7.5 minutes
			assertBucketCountRange: true,
			expectedMinBuckets:     191, // 86400/450 = 192
			expectedMaxBuckets:     193,
		},

		// --- Longer Durations, Default Target (120) & Max Bucket Limit (1 day) ---
		{
			name:                   "2 Days (48h), Default Target (120)",
			hours:                  48,   // 172800s
			targetPointInput:       120,  // ideal=172800/120=1440s (24m). Snaps to 20m (1200s).
			expectedBucketSize:     1200, // 20 minutes
			assertBucketCountRange: true,
			expectedMinBuckets:     143, // 172800/1200 = 144
			expectedMaxBuckets:     145,
		},
		{
			name:                   "7 Days (168h), Default Target (120)",
			hours:                  168,  // 604800s
			targetPointInput:       120,  // ideal=604800/120=5040s (1.4h). Snaps to 1.5h (5400s).
			expectedBucketSize:     5400, // 1.5 hours
			assertBucketCountRange: true,
			expectedMinBuckets:     111, // 604800/5400 = 112
			expectedMaxBuckets:     113,
		},
		{
			name:                   "15 Days (360h), Default Target (120)",
			hours:                  360,   // 1296000s
			targetPointInput:       120,   // ideal=1296000/120=10800s (3h). Snaps to 3h.
			expectedBucketSize:     10800, // 3 hours
			assertBucketCountRange: true,
			expectedMinBuckets:     119, // 1296000/10800 = 120
			expectedMaxBuckets:     121,
		},
		{
			name:                   "30 Days (720h), Default Target (120)",
			hours:                  720,   // 2592000s
			targetPointInput:       120,   // ideal=2592000/120=21600s (6h). Snaps to 6h.
			expectedBucketSize:     21600, // 6 hours
			assertBucketCountRange: true,
			expectedMinBuckets:     119, // 2592000/21600 = 120
			expectedMaxBuckets:     121,
		},
		{
			name:                   "60 Days (1440h), Default Target (120)",
			hours:                  1440,  // 5184000s
			targetPointInput:       120,   // ideal=5184000/120=43200s (12h). Snaps to 12h.
			expectedBucketSize:     43200, // 12 hours
			assertBucketCountRange: true,
			expectedMinBuckets:     119, // 5184000/43200 = 120
			expectedMaxBuckets:     121,
		},
		{
			name:                   "90 Days (2160h), Default Target (120)",
			hours:                  2160,  // 7776000s
			targetPointInput:       120,   // ideal=7776000/120=64800s (18h). Snaps to 18h.
			expectedBucketSize:     64800, // 18 hours
			assertBucketCountRange: true,
			expectedMinBuckets:     119, // 7776000/64800 = 120
			expectedMaxBuckets:     121,
		},
		{
			name:             "100 Days (2400h), Default Target (120) - Hits Max Bucket Size",
			hours:            2400, // 8640000s
			targetPointInput: 120,  // ideal=8640000/120=72000s (20h).
			// Snaps to 18h (64800s) or 1d (86400s). Closest is 1d.
			// No, ideal 20h is closer to 18h (diff 2h) than 1d (diff 4h). So 18h.
			expectedBucketSize:     64800, // 18h. This is < maxBucketSizeGlobal (1d)
			assertBucketCountRange: true,
			expectedMinBuckets:     133, // 8640000 / 64800 = 133.33
			expectedMaxBuckets:     135,
		},
		{
			name:             "150 Days (3600h), Default Target (120) - Hits Max Bucket Size",
			hours:            3600, // 12960000s
			targetPointInput: 120,  // ideal=12960000/120=108000s (30h = 1.25d).
			// Closest nice interval to 1.25d is 1d (86400s).
			// Then capped by maxBucketSizeGlobal (1d).
			expectedBucketSize:     int(maxBucketSizeGlobal), // 1 day
			assertBucketCountRange: true,
			expectedMinBuckets:     149, // 3600h / 24h_bucket_size = 150 buckets
			expectedMaxBuckets:     151,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Calculate ideal for logging/verification
			var effectiveTarget float64
			if tt.targetPointInput <= 0 {
				effectiveTarget = float64(defaultActualTargetPoints)
			} else {
				effectiveTarget = float64(tt.targetPointInput)
			}
			idealSize := 0.0
			if tt.hours > 0 && effectiveTarget > 0 {
				idealSize = (tt.hours * float64(time.Hour.Seconds())) / effectiveTarget
			}

			actualSize := CalcBucketSize(tt.hours, tt.targetPointInput)

			if tt.expectedBucketSize >= 0 { // Use >=0 to allow asserting expected 0 for some specific (though unlikely) case
				if actualSize != tt.expectedBucketSize {
					t.Errorf("CalcBucketSize(%.2f, %d) -> ideal: %.1fs = %d; want %d",
						tt.hours, tt.targetPointInput, idealSize, actualSize, tt.expectedBucketSize)
				}
			}

			if actualSize < GetMinBucketSize() && !(tt.hours <= 0 && actualSize == GetMinBucketSize()) { // Allow min for 0/neg hours
				t.Errorf("Result %d for (%.2fhr, target %d) is less than minBucketSize %d",
					actualSize, tt.hours, tt.targetPointInput, GetMinBucketSize())
			}
			if actualSize > int(maxBucketSizeGlobal) {
				t.Errorf("Result %d for (%.2fhr, target %d) is greater than maxBucketSize %d",
					actualSize, tt.hours, tt.targetPointInput, int(maxBucketSizeGlobal))
			}

			if tt.assertBucketCountRange && tt.hours > 0 {
				totalSeconds := tt.hours * float64(time.Hour.Seconds())
				if actualSize == 0 {
					t.Errorf("Returned 0 for positive hours %.2f, target %d",
						tt.hours, tt.targetPointInput)
				} else {
					numBuckets := int(math.Ceil(totalSeconds / float64(actualSize)))
					if numBuckets < tt.expectedMinBuckets || numBuckets > tt.expectedMaxBuckets {
						t.Errorf("For (%.2fhr, target %d), ideal: %.1fs, got %d buckets (size %ds). Expected bucket count [%d, %d].",
							tt.hours, tt.targetPointInput, idealSize, numBuckets, actualSize, tt.expectedMinBuckets, tt.expectedMaxBuckets)
					}
				}
			}
			logBucketInfoForTest(t, tt.hours, tt.targetPointInput, tt.expectedMinBuckets, tt.expectedMaxBuckets, actualSize, idealSize)
		})
	}
}

// TestGetMinBucketSize (no change needed here)
func TestGetMinBucketSize_Finer(t *testing.T) {
	if GetMinBucketSize() != minBucketSizeGlobal {
		t.Errorf("GetMinBucketSize() = %d; want %d", GetMinBucketSize(), minBucketSizeGlobal)
	}
}
